/* Portafile sync API — three-part key model:
   - shopId (40 hex): durable identity, data at shops/<shopId>.json. Never in a URL.
   - shareKey (40 hex, URL ?k=): rotatable pointer at keys/<shareKey>.json = {shopId,created}.
   - ownerToken (40 hex, x-portafile-owner header only — query strings land in access logs):
     sha256 hash at rest in owners/<shopId>.json = {ownerHash,currentKey,created}.
     Required to create a shop or rotate its link.
   A shareKey whose pointer is missing NEVER creates anything — that's what makes rotation real.
   Requires BLOB_READ_WRITE_TOKEN env var on the Vercel project. */
import { put, get, del } from '@vercel/blob';
import { createHash, randomBytes } from 'node:crypto';

const HEX40 = /^[a-f0-9]{40}$/;
const sha256 = s => createHash('sha256').update(String(s)).digest('hex');

// best-effort per-instance throttle (same pattern as lead.js): stops a single-source PUT flood
// from burning Blob ops. A distributed flood is the Vercel spend cap's job.
const HITS = new Map(); // ip -> recent ms timestamps
const RATE_N = 120, RATE_MS = 10 * 60 * 1000; // saves are debounced 800ms client-side — 120/10min never throttles a real editing session
function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now(), win = (HITS.get(ip) || []).filter(t => now - t < RATE_MS);
  win.push(now); HITS.set(ip, win);
  if (HITS.size > 5000) HITS.clear(); // crude memory bound
  return win.length > RATE_N;
}
const clientIp = req => String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim();

// mirror of the client's validBackup() — never store a shape the app would reject
function validBackup(s) {
  return !!(s && typeof s === 'object'
    && s.shop && typeof s.shop === 'object' && typeof s.shop.name === 'string'
    && ['ingredients', 'recipes', 'beans', 'dialins', 'baristas', 'path'].every(k => Array.isArray(s[k]))
    && s.signoffs && typeof s.signoffs === 'object');
}

// NEVER look a blob up with list() — its index lags writes AND deletes, so it both hides
// brand-new blobs and keeps serving ones already deleted. get(useCache:false) reads origin
// storage directly: null means genuinely absent, and a transient failure throws (→ 500).
// Both matter: the client wipes a device's local data on 'unknown-key', so "absent" has to be
// the truth rather than a stale index, and a rotate that trusts a stale list leaves the old
// staff link alive (that exact bug shipped and killed a link that kept working).
async function readJson(path) {
  const r = await get(path, { access: 'public', useCache: false });
  if (!r) return null;
  return JSON.parse(await r.blob.text());
}
const writeJson = (path, obj) => put(path, JSON.stringify(obj), { access: 'public', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true, cacheControlMaxAge: 0 });

export default async function handler(req, res) {
  const k = String(req.query.k || '');
  const shop = String(req.query.shop || '');
  const owner = String(req.headers['x-portafile-owner'] || '');

  if (req.method === 'GET') {
    if (!HEX40.test(k)) return res.status(400).json({ error: 'bad key' });
    const ptr = await readJson(`keys/${k}.json`);
    if (!ptr || !HEX40.test(String(ptr.shopId || ''))) return res.status(404).json({ error: 'unknown-key' });
    const state = await readJson(`shops/${ptr.shopId}.json`);
    if (!state) return res.status(404).json({ error: 'not found' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(state);
  }

  if (req.method === 'PUT') {
    if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'slow down' });
    if (!HEX40.test(k)) return res.status(400).json({ error: 'bad key' });
    const body = req.body;
    if (!validBackup(body)) return res.status(422).json({ error: 'not a portafile state' });
    const raw = JSON.stringify(body);
    if (raw.length > 1_000_000) return res.status(413).json({ error: 'too large' }); // ponytail: 1MB cap ≈ 100× a real shop; raise if a legit shop ever hits it

    let shopId;
    const ptr = await readJson(`keys/${k}.json`);
    if (ptr) {
      shopId = String(ptr.shopId || '');
      if (!HEX40.test(shopId)) return res.status(404).json({ error: 'unknown-key' });
    } else {
      // create path: only an owner token can bring a shop into existence
      if (!shop || !owner) return res.status(404).json({ error: 'unknown-key' });
      if (!HEX40.test(shop)) return res.status(400).json({ error: 'bad shop' });
      const own = await readJson(`owners/${shop}.json`);
      if (own) {
        // shop exists but its pointer is gone. Restoring it is allowed ONLY for the real owner
        // holding the CURRENT key — that self-heals a rotate that died halfway without ever
        // resurrecting a rotated-away link (old key !== currentKey → stays dead forever).
        if (sha256(owner) !== own.ownerHash || k !== own.currentKey) return res.status(404).json({ error: 'unknown-key' });
      } else {
        await writeJson(`owners/${shop}.json`, { ownerHash: sha256(owner), currentKey: k, created: Date.now() });
      }
      await writeJson(`keys/${k}.json`, { shopId: shop, created: Date.now() });
      shopId = shop;
    }

    // stale-write guard: a device holding an older copy must pull, not clobber newer cloud state
    const cur = await readJson(`shops/${shopId}.json`);
    if (cur && (+body.ts || 0) < (+cur.ts || 0)) return res.status(409).json({ error: 'stale' });
    await writeJson(`shops/${shopId}.json`, body);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST' && String(req.query.action) === 'rotate') {
    if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'slow down' });
    if (!HEX40.test(shop)) return res.status(400).json({ error: 'bad shop' });
    const own = await readJson(`owners/${shop}.json`);
    // same 403 for no-such-shop and wrong token — no existence oracle
    if (!own || sha256(owner) !== own.ownerHash) return res.status(403).json({ error: 'not-owner' });
    // Kill the old link FIRST and prove it's dead. Failing here must leave the old link dead and
    // the new one unborn (fails closed); the owner just presses reset again — their token, not the
    // link, is what authorises this. Minting first would fail OPEN: a live old link the owner
    // believes is revoked, which is the one outcome this whole feature exists to prevent.
    const old = String(own.currentKey || '');
    if (HEX40.test(old)) {
      await del(`keys/${old}.json`);
      if (await readJson(`keys/${old}.json`)) return res.status(500).json({ error: 'old-link-still-live' });
    }
    const nk = randomBytes(20).toString('hex');
    await writeJson(`keys/${nk}.json`, { shopId: shop, created: Date.now() });
    await writeJson(`owners/${shop}.json`, { ...own, currentKey: nk });
    return res.status(200).json({ k: nk });
  }

  res.setHeader('Allow', 'GET, PUT, POST');
  return res.status(405).json({ error: 'method' });
}

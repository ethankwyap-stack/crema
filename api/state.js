/* Portafile sync API — three-part key model:
   - shopId (40 hex): durable identity, data at shops/<shopId>.json. Never in a URL.
   - shareKey (40 hex, URL ?k=): rotatable pointer at keys/<shareKey>.json = {shopId,created}.
   - ownerToken (40 hex, x-portafile-owner header only — query strings land in access logs):
     sha256 hash at rest in owners/<shopId>.json = {ownerHash,currentKey,created}.
     Required to create a shop or rotate its link.
   A shareKey whose pointer is missing NEVER creates anything — that's what makes rotation real.
   Requires BLOB_READ_WRITE_TOKEN env var on the Vercel project. */
import { put, list, del } from '@vercel/blob';
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

// null ONLY when the blob genuinely isn't there. A transient fetch failure must THROW (→ 500),
// never look like "absent" — the client wipes local data on 'unknown-key', so a network blip
// misreported as a missing pointer would destroy a real shop's copy on every staff device.
async function readJson(path) {
  const { blobs } = await list({ prefix: path, limit: 1 });
  if (!blobs.length) return null;
  const r = await fetch(blobs[0].url);
  if (!r.ok) throw new Error(`blob fetch ${r.status} for ${path}`);
  return r.json();
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
      // create path: only an owner token can bring a shop into existence, and only once —
      // a rotated-away key stays dead even for the owner (they use rotate to recover).
      if (!shop || !owner) return res.status(404).json({ error: 'unknown-key' });
      if (!HEX40.test(shop)) return res.status(400).json({ error: 'bad shop' });
      if (await readJson(`owners/${shop}.json`)) return res.status(404).json({ error: 'unknown-key' });
      await writeJson(`owners/${shop}.json`, { ownerHash: sha256(owner), currentKey: k, created: Date.now() });
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
    const nk = randomBytes(20).toString('hex');
    await writeJson(`keys/${nk}.json`, { shopId: shop, created: Date.now() });
    if (HEX40.test(String(own.currentKey || ''))) {
      const { blobs } = await list({ prefix: `keys/${own.currentKey}.json`, limit: 1 });
      await Promise.all(blobs.map(b => del(b.url)));
    }
    await writeJson(`owners/${shop}.json`, { ...own, currentKey: nk });
    return res.status(200).json({ k: nk });
  }

  res.setHeader('Allow', 'GET, PUT, POST');
  return res.status(405).json({ error: 'method' });
}

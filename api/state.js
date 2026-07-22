/* Portafile sync API — three-part key model:
   - shopId (40 hex): durable identity, data at shops/<shopId>.json. Never in a URL.
   - shareKey (40 hex, URL ?k=): pointer at keys/<shareKey>.json = {shopId,created}.
   - ownerToken (40 hex, x-portafile-owner header only — query strings land in access logs):
     sha256 hash at rest in owners/<shopId>.json = {ownerHash,currentKey,created}.
     Required to create a shop or rotate its link.

   REVOCATION IS A VALUE COMPARISON, NEVER A MISSING BLOB. Blob reads are eventually consistent:
   two back-to-back reads of the same existing path can return found, then null (measured, not
   assumed). So pointers are NEVER deleted, and a link is dead when it isn't owners.currentKey —
   a positive fact read out of a blob that always exists. That answer is 410; the client wipes the
   device only on 410. Every read that flakes to null therefore fails SAFE: a wrongly-null pointer
   is a 404 ("link not recognised", no wipe), and a wrongly-null owner record leaves the key valid.
   Requires BLOB_READ_WRITE_TOKEN env var on the Vercel project. */
import { put, get } from '@vercel/blob';
import { createHash, randomBytes } from 'node:crypto';

const HEX40 = /^[a-f0-9]{40}$/;
const sha256 = s => createHash('sha256').update(String(s)).digest('hex');
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

// Never look a blob up with list() — its index lags writes AND deletes. get(useCache:false) reads
// origin storage; a transient failure throws (→ 500) instead of masquerading as "absent".
async function readJson(path) {
  const r = await get(path, { access: 'private', useCache: false }); // r.blob is metadata; the body is r.stream
  if (!r) return null;
  if (!r.stream) throw new Error(`no body for ${path} (status ${r.statusCode})`);
  return new Response(r.stream).json();
}
// For the one decision where absence GRANTS something (creating a shop), one null isn't evidence.
async function readJsonSure(path, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const v = await readJson(path);
    if (v) return v;
    if (i < tries - 1) await sleep(250);
  }
  return null;
}
const writeJson = (path, obj) => put(path, JSON.stringify(obj), { access: 'private', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true, cacheControlMaxAge: 0 });

// 'unknown' → we have no record of this link. 'revoked' → this link was replaced by a newer one.
async function resolveKey(k) {
  const ptr = await readJsonSure(`keys/${k}.json`);
  const shopId = String(ptr?.shopId || '');
  if (!HEX40.test(shopId)) return { state: 'unknown' };
  // readJsonSure, not readJson: an existing record CAN read as absent under Blob's eventual
  // consistency, and absence here now decides two things — that the link is valid, and that the
  // caller may see costs. Real shops have the record, so the retry costs nothing on the hot path.
  const own = await readJsonSure(`owners/${shopId}.json`);
  // No owner record at all = a pre-owner-token shop (the legacy one): it has no rotation, so its
  // link stays valid forever. A null here from a flaky read lands in the same safe branch.
  if (own && own.currentKey && k !== own.currentKey) return { state: 'revoked', own };
  return { state: 'ok', shopId, own };
}
// A 410 says WHOSE link died: owner:true only for the shop's real owner (their device settles and
// retries instead of locking). Without this the client trusted any local owner token — so a device
// owning a DIFFERENT shop could never be revoked from this one.
const revoked = (own, owner) => ({ error: 'revoked', owner: !!(own && owner && sha256(owner) === own.ownerHash) });
const UNKNOWN = { error: 'unknown-key' };
// Display role for the client: 'staff' only when this shop HAS an owner record and the request did
// not prove ownership. Deciding it here — not from the presence of a local token — is what stops a
// staff device from unhiding ingredient costs by writing a made-up token into its own localStorage.
// A shop with no owner record (the legacy one) has no staff links at all, so it stays 'owner'; the
// same branch catches a flaky null read, and the client refuses to downgrade staff→owner without a
// token of its own, so an eventually-consistent miss can never flash costs onto a barista's phone.
const roleOf = (own, owner) => (own && own.ownerHash && sha256(owner) !== own.ownerHash) ? 'staff' : 'owner';

export default async function handler(req, res) {
  const k = String(req.query.k || '');
  const shop = String(req.headers['x-portafile-shop'] || ''); // header, not query — query strings land in access logs
  const owner = String(req.headers['x-portafile-owner'] || '');

  if (req.method === 'GET') {
    if (!HEX40.test(k)) return res.status(400).json({ error: 'bad key' });
    const r = await resolveKey(k);
    if (r.state === 'revoked') return res.status(410).json(revoked(r.own, owner));
    if (r.state === 'unknown') return res.status(404).json(UNKNOWN);
    const state = await readJson(`shops/${r.shopId}.json`);
    if (!state) return res.status(404).json({ error: 'not found' }); // pointer fine, data missing — client must NOT treat this as revocation
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('x-portafile-role', roleOf(r.own, owner));
    return res.status(200).json(state);
  }

  if (req.method === 'PUT') {
    if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'slow down' });
    if (!HEX40.test(k)) return res.status(400).json({ error: 'bad key' });
    const body = req.body;
    if (!validBackup(body)) return res.status(422).json({ error: 'not a portafile state' });
    const raw = JSON.stringify(body);
    if (raw.length > 1_000_000) return res.status(413).json({ error: 'too large' }); // ponytail: 1MB cap ≈ 100× a real shop; raise if a legit shop ever hits it

    const r = await resolveKey(k);
    if (r.state === 'revoked') return res.status(410).json(revoked(r.own, owner));
    let shopId = r.shopId;
    if (r.state === 'unknown') {
      // create/repair path: only an owner token can bring a shop into existence
      if (!shop || !owner) return res.status(404).json(UNKNOWN);
      if (!HEX40.test(shop)) return res.status(400).json({ error: 'bad shop' });
      const own = await readJsonSure(`owners/${shop}.json`);
      if (own) {
        // shop exists but its pointer didn't resolve. Rewriting it is allowed ONLY for the real
        // owner holding the CURRENT key, so a rotated-away link can never come back to life.
        if (sha256(owner) !== own.ownerHash || k !== own.currentKey) return res.status(404).json(UNKNOWN);
      } else {
        // allowOverwrite:false is the store's only ATOMIC check — a flaky read can say "no owner
        // record" when one exists, but this put cannot overwrite one. Conflict = someone owns it.
        try {
          await put(`owners/${shop}.json`, JSON.stringify({ ownerHash: sha256(owner), currentKey: k, created: Date.now() }),
            { access: 'private', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: false, cacheControlMaxAge: 0 });
        } catch (e) { return res.status(404).json(UNKNOWN); }
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
    // Write the new pointer first, then flip currentKey — that flip IS the revocation, so if it
    // fails nothing changes and the owner sees an error, rather than being told a live link is dead.
    // ponytail: superseded pointers are left behind (77 bytes each); they resolve to 410 forever.
    const nk = randomBytes(20).toString('hex');
    await writeJson(`keys/${nk}.json`, { shopId: shop, created: Date.now() });
    await writeJson(`owners/${shop}.json`, { ...own, currentKey: nk });
    return res.status(200).json({ k: nk });
  }

  res.setHeader('Allow', 'GET, PUT, POST');
  return res.status(405).json({ error: 'method' });
}

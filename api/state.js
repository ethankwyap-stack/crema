/* Portafile sync API — one shop state blob per secret key. Free tier: Vercel Blob.
   Requires BLOB_READ_WRITE_TOKEN env var on the Vercel project (auto-set when a Blob store is connected). */
import { put, list } from '@vercel/blob';

const KEY_RE = /^[a-f0-9]{40}$/;

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

export default async function handler(req, res) {
  const k = String(req.query.k || '');
  if (!KEY_RE.test(k)) return res.status(400).json({ error: 'bad key' });
  const path = `shops/${k}.json`;

  if (req.method === 'GET') {
    const { blobs } = await list({ prefix: path, limit: 1 });
    if (!blobs.length) return res.status(404).json({ error: 'not found' });
    const r = await fetch(blobs[0].url);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(await r.json());
  }

  if (req.method === 'PUT') {
    if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'slow down' });
    const body = req.body;
    if (!validBackup(body)) return res.status(422).json({ error: 'not a portafile state' });
    const raw = JSON.stringify(body);
    if (raw.length > 1_000_000) return res.status(413).json({ error: 'too large' }); // ponytail: 1MB cap ≈ 100× a real shop; raise if a legit shop ever hits it
    // stale-write guard: a device holding an older copy must pull, not clobber newer cloud state
    const { blobs } = await list({ prefix: path, limit: 1 });
    if (blobs.length) {
      const cur = await fetch(blobs[0].url).then(r => r.json()).catch(() => null);
      if (cur && (+body.ts || 0) < (+cur.ts || 0)) return res.status(409).json({ error: 'stale' });
    }
    await put(path, raw, { access: 'public', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true, cacheControlMaxAge: 0 });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'method' });
}

/* Portafile sync API — one shop state blob per secret key. Free tier: Vercel Blob.
   Requires BLOB_READ_WRITE_TOKEN env var on the Vercel project (auto-set when a Blob store is connected). */
import { put, list } from '@vercel/blob';

const KEY_RE = /^[a-f0-9]{40}$/;

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
    const body = req.body;
    if (!validBackup(body)) return res.status(422).json({ error: 'not a portafile state' });
    const raw = JSON.stringify(body);
    if (raw.length > 1_000_000) return res.status(413).json({ error: 'too large' }); // ponytail: 1MB cap ≈ 100× a real shop; raise if a legit shop ever hits it
    await put(path, raw, { access: 'public', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true, cacheControlMaxAge: 0 });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'method' });
}

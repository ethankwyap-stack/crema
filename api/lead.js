/* Portafile lead capture — POST stores one lead per blob (no read-modify-write races),
   GET lists them for the founder dashboard (requires ADMIN_KEY env var to match ?admin=). */
import { put, get, list, del } from '@vercel/blob';
import { randomUUID, timingSafeEqual } from 'node:crypto';

const cors = res => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // ponytail: dashboard runs on localhost; leads are only readable/deletable with the admin key
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS'); // dashboard DELETE is cross-origin → needs this on the preflight
};

// constant-time compare; false on any length/type mismatch (fails closed, never throws)
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a ?? '')), y = Buffer.from(String(b ?? ''));
  return x.length === y.length && timingSafeEqual(x, y);
};

// best-effort per-instance throttle: stops a single-source POST flood. A distributed flood
// is the Vercel spend cap's job. ponytail: in-memory, resets on cold start / per warm instance —
// upgrade to a shared KV limiter only if abuse gets past this + the spend cap.
const HITS = new Map(); // ip -> recent ms timestamps
const RATE_N = 8, RATE_MS = 10 * 60 * 1000; // 8 posts / 10 min / ip (a real signup is ~1 ever)
function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now(), win = (HITS.get(ip) || []).filter(t => now - t < RATE_MS);
  win.push(now); HITS.set(ip, win);
  if (HITS.size > 5000) HITS.clear(); // crude memory bound
  return win.length > RATE_N;
}
const clientIp = req => String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim();

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    const b = req.body || {};
    // honeypot: `hp` is an off-screen field real users never fill. Filled = bot → 200 but write nothing.
    if (String(b.hp ?? '').trim()) return res.status(200).json({ ok: true });
    if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'slow down' });
    const s = (v, max) => String(v ?? '').trim().slice(0, max);
    const lead = {
      email: s(b.email, 120), shop: s(b.shop, 120), role: s(b.role, 40),
      city: s(b.city, 80), phone: s(b.phone, 40), ts: Date.now(),
    };
    // optional shop linkage — lets the founder answer "which signup owns which cloud data"
    if (/^[a-f0-9]{40}$/.test(String(b.shopId || ''))) lead.shopId = String(b.shopId);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || !lead.shop)
      return res.status(422).json({ error: 'email and shop name required' });
    await put(`leads/${lead.ts}-${randomUUID()}.json`,
      JSON.stringify(lead), { access: 'private', addRandomSuffix: false, contentType: 'application/json' });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    if (!process.env.ADMIN_KEY || !safeEqual(req.query.admin, process.env.ADMIN_KEY)) {
      console.error('lead admin auth failed', { ip: clientIp(req) || '?' });
      return res.status(401).json({ error: 'unauthorized' });
    }
    const { blobs } = await list({ prefix: 'leads/', limit: 1000 });
    // private store: blob URLs aren't publicly fetchable — read via the SDK (authed by the token)
    const leads = await Promise.all(blobs.map(b =>
      get(b.pathname, { access: 'private', useCache: false })
        .then(r => (r?.stream ? new Response(r.stream).json() : null)).catch(() => null)));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(leads.filter(Boolean).sort((a, b) => b.ts - a.ts));
  }

  // admin-gated single-lead delete — lets the founder honor a "delete my data" request (GDPR)
  if (req.method === 'DELETE') {
    if (!process.env.ADMIN_KEY || !safeEqual(req.query.admin, process.env.ADMIN_KEY)) {
      console.error('lead delete auth failed', { ip: clientIp(req) || '?' });
      return res.status(401).json({ error: 'unauthorized' });
    }
    const ts = String(req.query.ts || '');
    if (!/^\d+$/.test(ts)) return res.status(400).json({ error: 'bad ts' }); // numeric ts only → path stays inside leads/
    const { blobs } = await list({ prefix: `leads/${ts}-`, limit: 10 });
    await Promise.all(blobs.map(b => del(b.pathname)));
    return res.status(200).json({ ok: true, deleted: blobs.length });
  }

  res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
  return res.status(405).json({ error: 'method' });
}

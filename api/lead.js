/* Portafile lead capture — POST stores one lead per blob (no read-modify-write races),
   GET lists them for the founder dashboard (requires ADMIN_KEY env var to match ?admin=). */
import { put, list } from '@vercel/blob';

const cors = res => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // ponytail: dashboard runs on localhost; leads are only readable with the admin key
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    const b = req.body || {};
    const s = (v, max) => String(v ?? '').trim().slice(0, max);
    const lead = {
      email: s(b.email, 120), shop: s(b.shop, 120), role: s(b.role, 40),
      city: s(b.city, 80), phone: s(b.phone, 40), ts: Date.now(),
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || !lead.shop)
      return res.status(422).json({ error: 'email and shop name required' });
    await put(`leads/${lead.ts}-${Math.random().toString(36).slice(2, 8)}.json`,
      JSON.stringify(lead), { access: 'public', addRandomSuffix: false, contentType: 'application/json' });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    if (!process.env.ADMIN_KEY || req.query.admin !== process.env.ADMIN_KEY)
      return res.status(401).json({ error: 'unauthorized' });
    const { blobs } = await list({ prefix: 'leads/', limit: 1000 });
    const leads = await Promise.all(blobs.map(b => fetch(b.url).then(r => r.json()).catch(() => null)));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(leads.filter(Boolean).sort((a, b) => b.ts - a.ts));
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'method' });
}

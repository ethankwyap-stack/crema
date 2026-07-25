/* Portafile founder metrics — AGGREGATE ONLY, plus in-app feedback.

   GET  (admin key) → counts and percentages across all synced shops, plus a per-cafe METADATA
   row. Shop states are read INSIDE this function to compute booleans; no recipe, price,
   ingredient or synced shop name ever leaves it. That boundary is what keeps the privacy page
   true. The per-shop rows carry only metadata the owner handed Ethan directly (their signup
   name/email) or that the store records anyway (created, last save, which dates) — never
   anything derived from reading their app data.
   POST                → one feedback blob per submission (same one-blob-per-record shape as lead.js,
   so concurrent writes can never clobber each other).

   Blind spot to state honestly: only shops with SYNC ON exist here. A shop living purely in
   someone's browser is invisible to every number below. */
import { put, get, list } from '@vercel/blob';
import { randomUUID, timingSafeEqual } from 'node:crypto';

const HEX40 = /^[a-f0-9]{40}$/;
const DAY = 864e5;
// the demo seed a fresh browser starts on — a shop still matching it hasn't been made anyone's own
const DEMO = { name: 'Demo Espresso Bar', recipes: 15, ingredients: 13, dialins: 3, baristas: 1 };

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a ?? '')), y = Buffer.from(String(b ?? ''));
  return x.length === y.length && timingSafeEqual(x, y);
};
const readJson = path => get(path, { access: 'private', useCache: false })
  .then(r => (r?.stream ? new Response(r.stream).json() : null)).catch(() => null);

// same best-effort per-instance throttle as lead.js: stops a single-source flood of feedback posts
const HITS = new Map();
const RATE_N = 10, RATE_MS = 10 * 60 * 1000;
function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now(), win = (HITS.get(ip) || []).filter(t => now - t < RATE_MS);
  win.push(now); HITS.set(ip, win);
  if (HITS.size > 5000) HITS.clear();
  return win.length > RATE_N;
}
const clientIp = req => String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim();

const arr = v => (Array.isArray(v) ? v : []);
// ponytail: three coarse booleans, not a usage log. Enough to rank what to build next.
export const isCustomised = s => s.shop?.name !== DEMO.name || arr(s.recipes).length !== DEMO.recipes || arr(s.ingredients).length !== DEMO.ingredients;
export const usesTraining = s => arr(s.baristas).length > DEMO.baristas
  || Object.values(s.signoffs || {}).some(o => o && Object.keys(o).length > 0);
export const usesDialin = s => arr(s.dialins).length > DEMO.dialins;

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

/* Level 3: how many of the last `win` UTC days a shop touched the app. ISO dates compare as
   strings, so no date parsing. Exported and pure for ../verify-metrics.mjs. */
export const daysUsed = (days, now, win = 30) => {
  const cut = new Date(now - (win - 1) * DAY).toISOString().slice(0, 10); // inclusive of today
  return arr(days).filter(d => d >= cut).length;
};

/* Onboarding = signup → the shop's cloud copy existing. Exported and pure (the owner lookup is
   injected) so ../verify-metrics.mjs can exercise it without touching the store.
   The trap it exists for: when a browser links its shopId to a signup, the app re-POSTs the whole
   lead, and lead.js stamps a FRESH server ts — a second record for the same person. Taking that
   record's ts would report onboarding times near zero. The sign-up moment is the EARLIEST record
   for an email; the shopId is whichever record carries one. */
export async function onboarding(leads, getOwner) {
  const byEmail = new Map();
  for (const l of leads) {
    const e = String(l?.email || '').toLowerCase();
    if (!e || !(+l.ts > 0)) continue;
    const cur = byEmail.get(e) || { ts: Infinity, shopId: '' };
    byEmail.set(e, {
      ts: Math.min(cur.ts, +l.ts),
      shopId: cur.shopId || (HEX40.test(String(l.shopId || '')) ? String(l.shopId) : ''),
    });
  }
  const linked = [...byEmail.values()].filter(v => v.shopId);
  const owners = await Promise.all(linked.map(v => getOwner(v.shopId)));
  const waits = linked
    // a deleted shop's tombstone has no `created`; a clock skew that puts creation before signup
    // is dropped rather than counted as instant onboarding
    .map((v, i) => (+owners[i]?.created >= v.ts ? owners[i].created - v.ts : null))
    .filter(ms => ms !== null)
    .sort((a, b) => a - b);
  const hrs = ms => Math.round((ms / 3600e3) * 10) / 10;
  return {
    samples: waits.length,
    signups: byEmail.size,        // distinct signup emails (the duplicate link-records collapse)
    linkedShops: linked.length,   // signups we can tie to a cloud shop at all
    avgHours: waits.length ? hrs(waits.reduce((a, b) => a + b, 0) / waits.length) : null,
    medianHours: waits.length ? hrs(waits[Math.floor((waits.length - 1) / 2)]) : null,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // founder dashboard runs on localhost; GET needs the admin key
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-portafile-admin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    const b = req.body || {};
    if (String(b.hp ?? '').trim()) return res.status(200).json({ ok: true }); // honeypot: bots fill it, humans can't see it
    if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'slow down' });
    const sentiment = b.sentiment === 'up' || b.sentiment === 'down' ? b.sentiment : '';
    const msg = String(b.msg ?? '').trim().slice(0, 2000);
    const email = String(b.email ?? '').trim().slice(0, 120);
    if (!sentiment) return res.status(422).json({ error: 'sentiment required' });
    const fb = { sentiment, msg, email, role: String(b.role ?? '').slice(0, 20), ts: Date.now() };
    await put(`feedback/${fb.ts}-${randomUUID()}.json`, JSON.stringify(fb),
      { access: 'private', addRandomSuffix: false, contentType: 'application/json' });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    if (!process.env.ADMIN_KEY || !safeEqual(req.headers['x-portafile-admin'], process.env.ADMIN_KEY)) {
      console.error('metrics admin auth failed', { ip: clientIp(req) || '?' });
      return res.status(401).json({ error: 'unauthorized' });
    }
    const now = Date.now();
    // list() is the only way to ENUMERATE; its index lags writes and deletes by seconds, which is
    // fine for counts. Never use it to resolve one known path — that's what api/state.js warns about.
    const [shopBlobs, leadBlobs, fbBlobs] = await Promise.all([
      list({ prefix: 'shops/', limit: 1000 }).then(r => r.blobs),
      list({ prefix: 'leads/', limit: 1000 }).then(r => r.blobs),
      list({ prefix: 'feedback/', limit: 1000 }).then(r => r.blobs),
    ]);

    // ponytail: reads every shop file on every refresh — trivial at a few dozen shops, and it's a
    // button press, not a cron. If this ever times out, cache the booleans per shop instead.
    const states = (await Promise.all(shopBlobs.map(b => readJson(b.pathname)))).filter(Boolean);
    const seen = shopBlobs.map(b => +new Date(b.uploadedAt)).filter(t => t > 0);
    const shops = {
      total: shopBlobs.length,
      active7: seen.filter(t => now - t < 7 * DAY).length,
      active30: seen.filter(t => now - t < 30 * DAY).length,
      read: states.length, // < total means a blob read flaked; adoption % is over `read`, not `total`
    };
    const adoption = {
      customised: pct(states.filter(isCustomised).length, states.length),
      training: pct(states.filter(usesTraining).length, states.length),
      dialin: pct(states.filter(usesDialin).length, states.length),
    };

    const leads = (await Promise.all(leadBlobs.map(b => readJson(b.pathname)))).filter(Boolean);
    const onboard = await onboarding(leads, id => readJson(`owners/${id}.json`));

    const feedback = (await Promise.all(fbBlobs.map(b => readJson(b.pathname))))
      .filter(Boolean).sort((a, b) => b.ts - a.ts);

    /* Levels 2 & 3 — one row per cafe. The name comes from the LEAD record (what the owner typed
       into the signup form and gave Ethan directly), never from their synced state, which is their
       data. Earliest record wins: the shopId-linking re-POST is a duplicate of the same person. */
    const nameByShop = new Map();
    for (const l of [...leads].sort((a, b) => (+a.ts || 0) - (+b.ts || 0))) {
      const id = String(l?.shopId || '');
      if (HEX40.test(id) && !nameByShop.has(id)) nameByShop.set(id, { name: String(l.shop || ''), email: String(l.email || '') });
    }
    const perShop = (await Promise.all(shopBlobs.map(async b => {
      const id = (b.pathname.match(/^shops\/([a-f0-9]{40})\.json$/) || [])[1];
      if (!id) return null; // also keeps the dashboard's id-in-an-attribute rendering injection-proof
      const [own, act] = await Promise.all([readJson(`owners/${id}.json`), readJson(`activity/${id}.json`)]);
      const lastActive = +new Date(b.uploadedAt) || null;
      return {
        id,
        ...(nameByShop.get(id) || { name: '', email: '' }), // unnamed until they sign up AND sync in the same browser
        created: +own?.created || null,                     // legacy pre-owner-token shop has none
        lastActive,
        days30: daysUsed(act?.days, now),
        quietDays: lastActive === null ? null : Math.floor((now - lastActive) / DAY),
      };
    }))).filter(Boolean).sort((a, b) => (a.lastActive || 0) - (b.lastActive || 0)); // stalest first

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ shops, adoption, onboarding: onboard, feedback, perShop, generatedAt: now });
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'method' });
}

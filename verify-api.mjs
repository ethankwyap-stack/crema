/* Server-side checks for api/state.js, api/lead.js and api/metrics.js — the REAL handlers.
   verify-sync.js mocks /api/state with a JS mirror inside the test, so nothing else in this repo
   ever executes the server code. This does: @vercel/blob is swapped for an in-memory store via
   module.registerHooks, then the handlers are called with fake req/res.
   Run: node verify-api.mjs   (no network, no keys, writes nothing)
   ponytail: the fake store models only what these paths use — get/put/del by exact pathname,
   allowOverwrite:false conflicts. It is NOT eventually consistent; add lag here if you ever test
   the consistency-window behaviour rather than the authorization logic. */
import { registerHooks } from 'node:module';

globalThis.__BLOB = new Map(); // pathname -> JSON string
registerHooks({
  resolve(spec, ctx, next) {
    return spec === '@vercel/blob' ? { url: 'memblob:///', shortCircuit: true } : next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url !== 'memblob:///') return next(url, ctx);
    return { format: 'module', shortCircuit: true, source: `
      const S = globalThis.__BLOB;
      export const get = async (p) => S.has(p) ? { stream: new Response(S.get(p)).body, statusCode: 200 } : null;
      export const put = async (p, body, opts = {}) => {
        if (opts.allowOverwrite === false && S.has(p)) throw new Error('blob already exists');
        S.set(p, String(body)); return { pathname: p };
      };
      export const del = async (p) => { S.delete(p); };
      export const list = async ({ prefix = '' } = {}) =>
        ({ blobs: [...S.keys()].filter(k => k.startsWith(prefix)).map(pathname => ({ pathname, uploadedAt: new Date(0) })) });
    ` };
  },
});

const state = (await import('./api/state.js')).default;
const lead = (await import('./api/lead.js')).default;
const metrics = (await import('./api/metrics.js')).default;

let failures = 0;
const check = (name, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + name); if (!cond) failures++; };
const hex = c => c.repeat(40);
// minimal shape validBackup() accepts
const body = (ts = Date.now()) => ({
  shop: { name: 'Test', cogsTarget: 30 }, ingredients: [], recipes: [], beans: [],
  dialins: [], baristas: [], path: [], signoffs: {}, ts,
});

async function call(handler, { method = 'GET', query = {}, headers = {}, body: b } = {}) {
  const res = {
    code: 0, payload: null, headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.code = c; return this; },
    json(o) { this.payload = o; return this; },
    end() { return this; },
  };
  await handler({ method, query, headers, body: b }, res);
  return res;
}

/* ---- MED-2: GET /api/state is rate limited, on its OWN bucket ---- */
{
  const ip = { 'x-real-ip': '9.9.9.9' };
  // malformed key is rejected at 400 before any blob read, but the limiter runs first, so it counts
  let tripped = 0, firstTrip = 0;
  for (let i = 1; i <= 620; i++) {
    const r = await call(state, { query: { k: 'nope' }, headers: ip });
    if (r.code === 429) { tripped++; if (!firstTrip) firstTrip = i; }
  }
  check(`GET is throttled (first 429 at request ${firstTrip})`, tripped > 0);
  check('GET budget is ~600, not the 120 write budget (a 6-device cafe keeps working)', firstTrip === 601);

  // separate bucket: tripping reads must not touch the write budget for the same IP
  globalThis.__BLOB.clear();
  const put1 = await call(state, {
    method: 'PUT', query: { k: hex('a') }, body: body(),
    headers: { ...ip, 'x-portafile-shop': hex('b'), 'x-portafile-owner': hex('c') },
  });
  check('a 429-ed reader can still SAVE — writes have their own bucket', put1.code === 200);

  // a different IP is unaffected
  const other = await call(state, { query: { k: 'nope' }, headers: { 'x-real-ip': '8.8.8.8' } });
  check('the throttle is per-IP, not global', other.code === 400);
}

/* ---- MED-1: an unowned shopId with data must not be claimable ---- */
{
  globalThis.__BLOB.clear();
  const victim = hex('1'), attacker = hex('e'), attackerKey = hex('f');
  // pre-owner-token shop: data exists, NO owners/ record (the documented legacy shape)
  globalThis.__BLOB.set(`shops/${victim}.json`, JSON.stringify({ ...body(1000), shop: { name: 'Real Cafe', cogsTarget: 30 } }));

  const r = await call(state, {
    method: 'PUT', query: { k: attackerKey }, body: body(),
    headers: { 'x-real-ip': '7.7.7.7', 'x-portafile-shop': victim, 'x-portafile-owner': attacker },
  });
  check('takeover of an unowned shop with data is refused (404)', r.code === 404);
  check('no owner record was minted for the attacker', !globalThis.__BLOB.has(`owners/${victim}.json`));
  check('no pointer was minted for the attacker key', !globalThis.__BLOB.has(`keys/${attackerKey}.json`));
  const still = JSON.parse(globalThis.__BLOB.get(`shops/${victim}.json`));
  check("the cafe's data is untouched", still.shop.name === 'Real Cafe');

  // regression: a genuine first-time seed has no shop blob, so it must still succeed
  globalThis.__BLOB.clear();
  const shop = hex('2'), owner = hex('3'), key = hex('4');
  const seed = await call(state, {
    method: 'PUT', query: { k: key }, body: body(),
    headers: { 'x-real-ip': '7.7.7.7', 'x-portafile-shop': shop, 'x-portafile-owner': owner },
  });
  check('a brand-new shop can still seed the cloud', seed.code === 200);
  check('seeding wrote the owner record', !!globalThis.__BLOB.get(`owners/${shop}.json`));
  check('seeding wrote the pointer', !!globalThis.__BLOB.get(`keys/${key}.json`));
  check('the seeding device is told it is the owner', seed.headers['x-portafile-role'] === 'owner');
  const back = await call(state, { query: { k: key }, headers: { 'x-real-ip': '7.7.7.7', 'x-portafile-owner': owner } });
  check('the shop reads back through its link', back.code === 200 && back.payload.shop.name === 'Test');

  // and the owner can still repair its own pointer with the current key (unchanged path)
  globalThis.__BLOB.delete(`keys/${key}.json`);
  const repair = await call(state, {
    method: 'PUT', query: { k: key }, body: body(),
    headers: { 'x-real-ip': '7.7.7.7', 'x-portafile-shop': shop, 'x-portafile-owner': owner },
  });
  check('the real owner can still repair a lost pointer', repair.code === 200);
  const steal = await call(state, {
    method: 'PUT', query: { k: hex('5') }, body: body(),
    headers: { 'x-real-ip': '7.7.7.7', 'x-portafile-shop': shop, 'x-portafile-owner': hex('6') },
  });
  check('a stranger still cannot claim an OWNED shop', steal.code === 404);
}

/* ---- MED-3: the admin key is read from a header, never the query string ---- */
{
  process.env.ADMIN_KEY = 'test-admin-key';
  const KEY = process.env.ADMIN_KEY;
  for (const [name, h] of [['lead', lead], ['metrics', metrics]]) {
    check(`${name}: no credential at all → 401`, (await call(h, {})).code === 401);
    check(`${name}: the OLD ?admin= form no longer authenticates`,
      (await call(h, { query: { admin: KEY } })).code === 401);
    check(`${name}: the x-portafile-admin header does authenticate`,
      (await call(h, { headers: { 'x-portafile-admin': KEY } })).code === 200);
    check(`${name}: a wrong header value → 401`,
      (await call(h, { headers: { 'x-portafile-admin': 'wrong-length-key' } })).code === 401);
    // the CORS trap: a custom header makes the dashboard's request preflighted, so the browser
    // will not send it at all unless the header is advertised here
    const pre = await call(h, { method: 'OPTIONS' });
    check(`${name}: preflight advertises x-portafile-admin (or the dashboard silently breaks)`,
      String(pre.headers['access-control-allow-headers'] || '').includes('x-portafile-admin'));
  }
  // DELETE /api/lead: key in the header, ts stays in the query (a ts is not a secret)
  globalThis.__BLOB.set('leads/1700000000000-x.json', JSON.stringify({ ts: 1700000000000, email: 'a@b.c' }));
  const badDel = await call(lead, { method: 'DELETE', query: { admin: KEY, ts: '1700000000000' } });
  check('lead DELETE: query-string key is refused', badDel.code === 401 && globalThis.__BLOB.has('leads/1700000000000-x.json'));
  const okDel = await call(lead, { method: 'DELETE', query: { ts: '1700000000000' }, headers: { 'x-portafile-admin': KEY } });
  check('lead DELETE: header key deletes the record', okDel.code === 200 && !globalThis.__BLOB.has('leads/1700000000000-x.json'));
}

console.log(failures ? `\n${failures} FAILURES` : '\nall api checks passed');
process.exit(failures ? 1 : 0);

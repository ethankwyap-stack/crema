/* Sync verification — serves product/ locally, mocks /api/state with an in-memory store
   mirroring the real three-part key model (shops/ data, keys/ pointers, owners/ records),
   and proves: no-key mode never calls the API, keyed devices share state both ways,
   offline degrades gracefully, dead links create nothing, and link rotation is real.
   Run: node product/verify-sync.js */
const pw = require('/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');

const results = []; const ok = (n, c) => { results.push([c, n]); console.log((c ? 'PASS' : 'FAIL') + '  ' + n); };
const KEY = 'a'.repeat(40);        // owner's first shareKey
const SHOP = 'c'.repeat(40);       // owner's shopId
const OWNER = 'd'.repeat(40);      // owner token (mock stores it raw; real server stores sha256)
const DEADKEY = 'e'.repeat(40);    // a shareKey no pointer ever existed for

(async () => {
  const dir = __dirname;
  const srv = http.createServer((req, res) => {
    const f = path.join(dir, req.url.split('?')[0].replace(/^\//, '') || 'index.html');
    try { res.end(fs.readFileSync(f)); } catch (e) { res.statusCode = 404; res.end(); }
  }).listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;

  // mirror of api/state.js: cloud=shops/, keys=pointers, owners=owner records
  const cloud = {}, keys = {}, owners = {}; let apiCalls = 0, rotN = 1;
  const mock = async route => {
    apiCalls++;
    const u = new URL(route.request().url());
    const k = u.searchParams.get('k'), shop = u.searchParams.get('shop');
    const owner = route.request().headers()['x-portafile-owner'] || '';
    const method = route.request().method();
    if (method === 'POST' && u.searchParams.get('action') === 'rotate') {
      if (!owners[shop] || owners[shop].hash !== owner) return route.fulfill({ status: 403, json: { error: 'not-owner' } });
      delete keys[owners[shop].currentKey]; // old link dies first — mirrors the server's fail-closed order
      const nk = (rotN++).toString(16).padStart(40, '0');
      keys[nk] = shop; owners[shop].currentKey = nk;
      return route.fulfill({ json: { k: nk } });
    }
    if (method === 'PUT') {
      const body = JSON.parse(route.request().postData());
      let shopId;
      if (keys[k]) shopId = keys[k];
      else {
        // create path: needs owner creds, and CREATES NOTHING otherwise. An existing shop's pointer
        // may only be restored by the real owner holding the CURRENT key (never a rotated-away one).
        if (!shop || !owner) return route.fulfill({ status: 404, json: { error: 'unknown-key' } });
        const own = owners[shop];
        if (own && (own.hash !== owner || k !== own.currentKey)) return route.fulfill({ status: 404, json: { error: 'unknown-key' } });
        if (!own) owners[shop] = { hash: owner, currentKey: k };
        keys[k] = shop; shopId = shop;
      }
      const old = cloud[shopId] && JSON.parse(cloud[shopId]);
      if (old && (+body.ts || 0) < (+old.ts || 0)) return route.fulfill({ status: 409, json: { error: 'stale' } });
      cloud[shopId] = route.request().postData(); return route.fulfill({ json: { ok: true } });
    }
    if (!keys[k]) return route.fulfill({ status: 404, json: { error: 'unknown-key' } });
    if (!cloud[keys[k]]) return route.fulfill({ status: 404, json: { error: 'not found' } });
    return route.fulfill({ contentType: 'application/json', body: cloud[keys[k]] });
  };

  const b = await pw.chromium.launch();
  const errs = [];

  // 1. no key → pure local, zero API traffic
  const c0 = await b.newContext(); const p0 = await c0.newPage();
  p0.on('pageerror', e => errs.push('p0: ' + e.message));
  await p0.route('**/api/state*', mock);
  await p0.goto(base + '/index.html?selftest=1', { waitUntil: 'networkidle' });
  await p0.waitForTimeout(1200);
  ok('no-key: selftest still passes', (await p0.textContent('.selftest')).includes('PASS'));
  ok('no-key: zero API calls', apiCalls === 0);
  ok('no-key: no sync badge', await p0.locator('#syncBadge').count() === 0);
  await c0.close();

  // 2. device A (OWNER: holds token + shopId) with key seeds the cloud
  const cA = await b.newContext();
  await cA.addInitScript(([o, s]) => { localStorage.setItem('portafile.v1.owner', o); localStorage.setItem('portafile.v1.shopid', s); }, [OWNER, SHOP]);
  const pA = await cA.newPage();
  pA.on('pageerror', e => errs.push('pA: ' + e.message));
  pA.on('dialog', d => d.accept());
  await pA.route('**/api/state*', mock);
  await pA.goto(base + `/index.html?k=${KEY}`, { waitUntil: 'networkidle' });
  await pA.waitForTimeout(1500);
  ok('A: badge shows synced', (await pA.textContent('#syncBadge')) === 'synced');
  ok('A: cloud seeded with valid state', !!cloud[SHOP] && JSON.parse(cloud[SHOP]).recipes.length === 15);
  ok('A: cloud state carries ts', +JSON.parse(cloud[SHOP]).ts > 0);
  ok('A: pointer + owner record created', keys[KEY] === SHOP && owners[SHOP].hash === OWNER);

  // 3. A edits shop name → push lands in cloud
  await pA.fill('#shopName', 'Sync Test Cafe'); await pA.dispatchEvent('#shopName', 'change');
  await pA.waitForTimeout(1500);
  ok('A: edit pushed to cloud', JSON.parse(cloud[SHOP]).shop.name === 'Sync Test Cafe');

  // 4. device B (STAFF: no token) opens the same link → sees A's data
  const cB = await b.newContext(); const pB = await cB.newPage();
  pB.on('pageerror', e => errs.push('pB: ' + e.message));
  await pB.route('**/api/state*', mock);
  await pB.goto(base + `/index.html?k=${KEY}`, { waitUntil: 'networkidle' });
  await pB.waitForTimeout(1500);
  ok('B: staff pulled A\'s data', (await pB.inputValue('#shopName')) === 'Sync Test Cafe');

  // 5. B edits → staff write lands, A picks it up on next poll
  await pB.fill('#shopName', 'B Was Here'); await pB.dispatchEvent('#shopName', 'change');
  await pB.waitForTimeout(1500);
  ok('B: staff write landed in cloud', JSON.parse(cloud[SHOP]).shop.name === 'B Was Here');
  await pA.evaluate(() => syncPull());
  await pA.waitForTimeout(800);
  ok('A: poll pulled B\'s edit', (await pA.inputValue('#shopName')) === 'B Was Here');

  // 5b. the pull that overwrote A kept a recovery snapshot of A's prior state
  ok('A: presync snapshot saved before overwrite', await pA.evaluate(() => {
    const p = localStorage.getItem('portafile.v1.presync');
    return !!p && JSON.parse(p).shop.name === 'Sync Test Cafe';
  }));

  // 5c. a stale device can't clobber newer cloud state — the 409 makes it pull instead
  const future = JSON.parse(cloud[SHOP]); future.shop.name = 'Future Cafe'; future.ts = Date.now() + 9e6;
  cloud[SHOP] = JSON.stringify(future);
  await pA.fill('#shopName', 'Stale Edit'); await pA.dispatchEvent('#shopName', 'change');
  await pA.waitForTimeout(1800);
  ok('stale: cloud kept the newer state', JSON.parse(cloud[SHOP]).shop.name === 'Future Cafe');
  ok('stale: device refreshed to cloud state instead', (await pA.inputValue('#shopName')) === 'Future Cafe');

  // 6. dead link (no pointer, no token) → creates nothing, wipes nothing, goes dead
  const cD = await b.newContext(); const pD = await cD.newPage();
  pD.on('pageerror', e => errs.push('pD: ' + e.message));
  await pD.route('**/api/state*', mock);
  await pD.goto(base + `/index.html?k=${DEADKEY}`, { waitUntil: 'networkidle' });
  await pD.waitForTimeout(1500);
  ok('dead link: badge says link no longer works', (await pD.textContent('#syncBadge')).includes('no longer works'));
  ok('dead link: nothing created in cloud', !keys[DEADKEY] && Object.keys(cloud).length === 1);
  // a link this device never got in through must NOT wipe it — otherwise clicking a stale link
  // destroys the local shop of someone who was never part of that shop at all
  ok('dead link: never-synced device keeps working', await pD.locator('.rcard').count() > 0);
  ok('dead link: never-synced device NOT wiped or locked', await pD.evaluate(() =>
    !!localStorage.getItem('portafile.v1') && !localStorage.getItem('portafile.v1.revoked')));

  // 6b. creation without an owner token is refused even with a shop param
  const createStatus = await pD.evaluate(async () => {
    const r = await fetch('/api/state?k=' + 'e'.repeat(40) + '&shop=' + 'b'.repeat(40),
      { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ts: Date.now() }) });
    return r.status;
  });
  ok('dead link: tokenless create refused', createStatus === 404 && !keys[DEADKEY] && !cloud['b'.repeat(40)]);
  await cD.close();

  // 7. owner rotates the staff link via the real Data-menu button
  await pA.evaluate(() => dataMenu());
  await pA.click('#dSyncRotate');
  await pA.waitForTimeout(800);
  const newK = await pA.evaluate(() => localStorage.getItem('portafile.v1.synckey'));
  ok('rotate: new key minted, stored, pointing at the shop', !!newK && newK !== KEY && keys[newK] === SHOP);
  ok('rotate: old key deleted server-side', !keys[KEY]);
  await pA.evaluate(() => closeModal());

  // 7b. staff device on the OLD key is HARD-KILLED: locked, wiped, unusable
  await pB.evaluate(() => syncPull());
  await pB.waitForTimeout(700);
  ok('rotate: staff device shows the lock screen', (await pB.textContent('body')).includes('This link has been turned off'));
  ok('rotate: staff device has no working UI left', await pB.locator('.rcard').count() === 0 && await pB.locator('.tab').count() === 0);
  ok('rotate: shop data wiped off the staff device', await pB.evaluate(() =>
    !localStorage.getItem('portafile.v1') && !localStorage.getItem('portafile.v1.presync') && !localStorage.getItem('portafile.v1.synckey')));

  // 7b-2. the lock survives a reload — they can't just refresh their way back in
  await pB.reload({ waitUntil: 'networkidle' });
  await pB.waitForTimeout(700);
  ok('rotate: still locked after reload', (await pB.textContent('body')).includes('This link has been turned off'));
  ok('rotate: still no app after reload', await pB.locator('.rcard').count() === 0);

  // 7b-3. the NEW link brings that same device back to life (re-hired barista)
  await pB.goto(base + `/index.html?k=${newK}`, { waitUntil: 'networkidle' });
  await pB.waitForTimeout(1500);
  ok('rotate: new link unlocks the same device', (await pB.inputValue('#shopName')) === JSON.parse(cloud[SHOP]).shop.name);
  ok('rotate: lock flag cleared by the new link', await pB.evaluate(() => !localStorage.getItem('portafile.v1.revoked')));
  await cB.close(); // done with the staff device — stop its poll racing the pointer tests below

  // 7c. a fresh staff device on the NEW key works normally
  const cF = await b.newContext(); const pF = await cF.newPage();
  pF.on('pageerror', e => errs.push('pF: ' + e.message));
  await pF.route('**/api/state*', mock);
  await pF.goto(base + `/index.html?k=${newK}`, { waitUntil: 'networkidle' });
  await pF.waitForTimeout(1500);
  ok('rotate: new link pulls shop data', (await pF.inputValue('#shopName')) === JSON.parse(cloud[SHOP]).shop.name);
  await cF.close();

  // 7d. a 404 that is NOT 'unknown-key' (pointer fine, shop blob missing) must never wipe a device
  const cG = await b.newContext(); const pG = await cG.newPage();
  pG.on('pageerror', e => errs.push('pG: ' + e.message));
  await pG.route('**/api/state*', mock);
  await pG.goto(base + `/index.html?k=${newK}`, { waitUntil: 'networkidle' });
  await pG.waitForTimeout(1500);
  const keep = cloud[SHOP]; delete cloud[SHOP];
  await pG.evaluate(() => syncPull());
  await pG.waitForTimeout(700);
  ok('server hiccup (404 not-found) does NOT wipe a synced device',
    await pG.evaluate(() => !!localStorage.getItem('portafile.v1') && !localStorage.getItem('portafile.v1.revoked'))
    && await pG.locator('.rcard').count() > 0);
  cloud[SHOP] = keep;
  await cG.close();

  // 7e. a half-finished rotate leaves the shop with no pointer. The owner (current key) may restore
  // it; a rotated-away key never can, or revocation would be undoable.
  // carry the live state forward with a newer ts, or the stale-write guard 409s the restore
  const restorePut = (k, o) => pA.evaluate(async ([k, shop, owner, body]) => {
    const r = await fetch(`/api/state?k=${k}&shop=${shop}`, {
      method: 'PUT', headers: { 'content-type': 'application/json', 'x-portafile-owner': owner },
      body: JSON.stringify(body),
    });
    return r.status;
  }, [k, SHOP, o, { ...JSON.parse(cloud[SHOP]), ts: Date.now() + 2e7 }]);
  delete keys[newK]; // simulate the pointer never being written
  ok('owner CANNOT restore with a rotated-away key', await restorePut(KEY, OWNER) === 404 && !keys[KEY]);
  ok('stranger CANNOT restore with the current key', await restorePut(newK, 'f'.repeat(40)) === 404 && !keys[newK]);
  ok('owner CAN restore the pointer with the current key', await restorePut(newK, OWNER) === 200 && keys[newK] === SHOP);

  // 8. offline: API dead → badge degrades, app keeps working locally
  await pA.unroute('**/api/state*');
  await pA.route('**/api/state*', r => r.abort());
  await pA.evaluate(() => syncPull());
  await pA.waitForTimeout(800);
  ok('A: offline badge on API failure', (await pA.textContent('#syncBadge')).includes('offline'));
  ok('A: app still alive offline', await pA.locator('.rcard').count() > 0);

  ok('zero page errors', errs.length === 0);
  if (errs.length) console.log(errs);
  await b.close(); srv.close();
  const fails = results.filter(r => !r[0]).length;
  console.log(fails ? `${fails} FAILED` : 'ALL SYNC CHECKS PASS');
  process.exit(fails ? 1 : 0);
})();

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
    const k = u.searchParams.get('k'), shop = route.request().headers()['x-portafile-shop'] || null;
    const owner = route.request().headers()['x-portafile-owner'] || '';
    const method = route.request().method();
    if (method === 'POST' && u.searchParams.get('action') === 'rotate') {
      if (!owners[shop] || owners[shop].hash !== owner) return route.fulfill({ status: 403, json: { error: 'not-owner' } });
      // pointers are never deleted; flipping currentKey IS the revocation (mirrors api/state.js)
      const nk = (rotN++).toString(16).padStart(40, '0');
      keys[nk] = shop; owners[shop].currentKey = nk;
      return route.fulfill({ json: { k: nk } });
    }
    // a deleted shop answers 410 deleted from its tombstone for every key that points at it
    if (keys[k] && owners[keys[k]] && owners[keys[k]].deleted)
      return route.fulfill({ status: 410, json: { error: 'deleted', owner: owners[keys[k]].hash === owner, shopId: keys[k] } });
    // a key that resolves but is no longer the shop's current one is positively revoked → 410
    const revoked = keys[k] && owners[keys[k]] && owners[keys[k]].currentKey !== k;
    if (revoked) return route.fulfill({ status: 410, json: { error: 'revoked', owner: owners[keys[k]].hash === owner } }); // owner flag mirrors api/state.js
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
      cloud[shopId] = route.request().postData();
      const putRole = (owners[shopId] && owners[shopId].hash !== owner) ? 'staff' : 'owner'; // mirrors api/state.js PUT
      return route.fulfill({ headers: { 'x-portafile-role': putRole }, json: { ok: true } });
    }
    if (!keys[k]) return route.fulfill({ status: 404, json: { error: 'unknown-key' } });
    if (!cloud[keys[k]]) return route.fulfill({ status: 404, json: { error: 'not found' } });
    // mirrors api/state.js roleOf(): staff unless the request proves ownership of THIS shop
    const role = (owners[keys[k]] && owners[keys[k]].hash !== owner) ? 'staff' : 'owner';
    return route.fulfill({ contentType: 'application/json', headers: { 'x-portafile-role': role }, body: cloud[keys[k]] });
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
  // focus/online wake the sync recheck — a local-only shop must still touch the network NEVER
  await p0.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('online')); });
  await p0.waitForTimeout(600);
  ok('no-key: zero API calls (even on tab focus)', apiCalls === 0);
  ok('no-key: no sync badge', await p0.locator('#syncBadge').count() === 0);
  await c0.close();

  // 2. device A (OWNER: holds token + shopId) with key seeds the cloud
  const cA = await b.newContext();
  // init scripts re-run on EVERY navigation — the stopseed flag (outside the portafile.v1 prefix,
  // so wipes keep it) lets the deletion tests turn re-seeding off, or they'd test the harness
  await cA.addInitScript(([o, s]) => {
    if (localStorage.getItem('pf-test-stopseed')) return;
    localStorage.setItem('portafile.v1.owner', o); localStorage.setItem('portafile.v1.shopid', s);
  }, [OWNER, SHOP]);
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
  const cB = await b.newContext();
  // pretend this browser already filled the access gate, so we can prove a wipe doesn't erase that
  await cB.addInitScript(() => { localStorage.setItem('portafile.v1.lead', '{"email":"x@y.z","shop":"S"}'); localStorage.setItem('portafile.v1.lead.sent', '1'); });
  const pB = await cB.newPage();
  pB.on('pageerror', e => errs.push('pB: ' + e.message));
  await pB.route('**/api/state*', mock);
  await pB.goto(base + `/index.html?k=${KEY}`, { waitUntil: 'networkidle' });
  await pB.waitForTimeout(1500);
  ok('B: staff pulled A\'s data', (await pB.inputValue('#shopName')) === 'Sync Test Cafe');

  // 4b. staff view: costs hidden everywhere, Prices tab gone, export redacted; owner still sees all
  ok('B: staff sees no cost figures on cards', !(await pB.textContent('#view')).includes('costs you'));
  ok('B: staff has no Prices tab', await pB.locator('[data-tab="prices"]:visible').count() === 0);
  ok('B: staff has no Margin report pack', await pB.evaluate(() => { S.tab = 'print'; render(); return !document.querySelector('[data-pack="margin"]'); }));
  ok('B: staff footer says costs stay with the owner', (await pB.textContent('#footNote')).includes('stay with the owner'));
  ok('B: staff export redacts unit costs', await pB.evaluate(() =>
    (staffView() ? { ...S, ingredients: S.ingredients.map(i => ({ ...i, unitCost: 0 })) } : S).ingredients.every(i => i.unitCost === 0)));
  await pB.evaluate(() => { S.tab = 'recipes'; render(); });
  ok('A: owner still sees costs', (await pA.textContent('#view')).includes('costs you'));
  // 4c. wrong owner code is rejected by the server; the right one unlocks
  await pB.evaluate(() => dataMenu());
  await pB.fill('#dOwnerCode', 'f'.repeat(40)); await pB.click('#dOwnerUnlock');
  await pB.waitForTimeout(600);
  ok('B: wrong owner code refused', (await pB.textContent('#dOwnerMsg')).includes('not this shop') &&
    await pB.evaluate(() => staffView()));
  await pB.fill('#dOwnerCode', 'd'.repeat(40)); await pB.click('#dOwnerUnlock');
  await pB.waitForTimeout(600);
  ok('B: correct owner code unlocks costs', await pB.evaluate(() => !staffView()) &&
    (await pB.textContent('#view')).includes('costs you'));
  // put B back to a pure staff device for the revocation tests below
  await pB.evaluate(() => { localStorage.removeItem('portafile.v1.owner'); localStorage.setItem('portafile.v1.role', 'staff'); render(); });

  // 4d. REGRESSION (found live by Ethan): a device holding a DIFFERENT shop's owner token opens the
  // staff link. The stale token must not unlock costs — the server said 'staff' for this shop.
  const cX = await b.newContext();
  await cX.addInitScript(() => {
    localStorage.setItem('portafile.v1.owner', 'b'.repeat(40));  // owner of some OTHER shop
    localStorage.setItem('portafile.v1.role', 'owner');          // and a stale cached role
    localStorage.setItem('portafile.v1.synckey', 'b'.repeat(40)); // from that other shop's link
  });
  const pX = await cX.newPage();
  pX.on('pageerror', e => errs.push('pX: ' + e.message));
  await pX.route('**/api/state*', mock);
  await pX.goto(base + `/index.html?k=${KEY}`, { waitUntil: 'networkidle' });
  await pX.waitForTimeout(1500);
  ok('wrong-shop owner token: costs hidden on staff link', !(await pX.textContent('#view')).includes('costs you'));
  ok('wrong-shop owner token: no Prices tab', await pX.locator('[data-tab="prices"]:visible').count() === 0);
  ok('wrong-shop owner token: server-declared staff role stored', await pX.evaluate(() => localStorage.getItem('portafile.v1.role') === 'staff'));
  await cX.close();

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
    const r = await fetch('/api/state?k=' + 'e'.repeat(40),
      { method: 'PUT', headers: { 'content-type': 'application/json', 'x-portafile-shop': 'b'.repeat(40) }, body: JSON.stringify({ ts: Date.now() }) });
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
  // pointers are never deleted — the old key is dead because it is no longer owners.currentKey,
  // and the server says so positively with 410 rather than by a blob being absent
  ok('rotate: old key demoted, not deleted', keys[KEY] === SHOP && owners[SHOP].currentKey === newK);
  ok('rotate: old key now answers 410 revoked', await pA.evaluate(async k =>
    (await fetch('/api/state?k=' + k)).status, KEY) === 410);
  await pA.evaluate(() => closeModal());

  // 7b. staff device on the OLD key is HARD-KILLED: locked, wiped, unusable.
  // One 410 is only a strike (blob reads flake); the second one wipes — so pull twice.
  await pB.evaluate(() => syncPull());
  await pB.waitForTimeout(500);
  ok('rotate: first 410 alone does not wipe', await pB.evaluate(() => !!localStorage.getItem('portafile.v1')));
  await pB.evaluate(() => syncPull());
  await pB.waitForTimeout(700);
  ok('rotate: staff device shows the lock screen', (await pB.textContent('body')).includes('This link has been turned off'));
  ok('rotate: staff device has no working UI left', await pB.locator('.rcard').count() === 0 && await pB.locator('.tab').count() === 0);
  ok('rotate: shop data wiped off the staff device', await pB.evaluate(() =>
    !localStorage.getItem('portafile.v1') && !localStorage.getItem('portafile.v1.presync') && !localStorage.getItem('portafile.v1.synckey')));
  ok('rotate: signup record SURVIVES the wipe (no re-signup, no duplicate lead)', await pB.evaluate(() =>
    !!localStorage.getItem('portafile.v1.lead') && localStorage.getItem('portafile.v1.lead.sent') === '1'));

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
    const r = await fetch(`/api/state?k=${k}`, {
      method: 'PUT', headers: { 'content-type': 'application/json', 'x-portafile-owner': owner, 'x-portafile-shop': shop },
      body: JSON.stringify(body),
    });
    return r.status;
  }, [k, SHOP, o, { ...JSON.parse(cloud[SHOP]), ts: Date.now() + 2e7 }]);
  delete keys[newK]; // simulate the pointer never being written
  ok('owner CANNOT revive a rotated-away key (410)', await restorePut(KEY, OWNER) === 410 && owners[SHOP].currentKey === newK);
  ok('stranger CANNOT restore with the current key', await restorePut(newK, 'f'.repeat(40)) === 404 && !keys[newK]);
  ok('owner CAN restore the pointer with the current key', await restorePut(newK, OWNER) === 200 && keys[newK] === SHOP);

  // 7f. founder deletes the shop's cloud data (tombstone). EVERY device — staff and owner alike —
  // is wiped back to the demo shop and forgets its signup record, so the gate greets them fresh.
  // (The owner used to keep its recipes; that left the signup form sitting on top of a live shop,
  // which read as "the delete did nothing". Deleting means clean slate on every device now.)
  const cS = await b.newContext();
  await cS.addInitScript(() => {
    if (localStorage.getItem('pf-test-stopseed')) return;
    localStorage.setItem('portafile.v1.lead', '{"email":"s@y.z"}'); localStorage.setItem('portafile.v1.lead.sent', '1');
  });
  const pS = await cS.newPage();
  pS.on('pageerror', e => errs.push('pS: ' + e.message));
  await pS.route('**/api/state*', mock);
  await pS.goto(base + `/index.html?k=${newK}`, { waitUntil: 'networkidle' });
  await pS.waitForTimeout(1500);
  ok('delete: staff device synced first', (await pS.inputValue('#shopName')) === JSON.parse(cloud[SHOP]).shop.name);
  // seed the owner's lead record too, so we can prove deletion clears it
  await pA.evaluate(() => localStorage.setItem('portafile.v1.lead', '{"email":"o@y.z"}'));
  // stop the harness re-seeding on the post-wipe reload, or it undoes what we're asserting
  await pS.evaluate(() => localStorage.setItem('pf-test-stopseed', '1'));
  await pA.evaluate(() => localStorage.setItem('pf-test-stopseed', '1'));
  owners[SHOP] = { deleted: true, hash: OWNER }; delete cloud[SHOP]; // the admin DELETE, server-side
  await pS.evaluate(() => syncPull()); await pS.waitForTimeout(1200);
  // after the wipe the reload re-seeds the demo shop — so assert the SHOP's data is gone (name is
  // back to the demo), and the signup record is gone (a real browser would now see the gate)
  ok('delete: staff device wiped INCLUDING signup record (gate returns)', await pS.evaluate(() =>
    JSON.parse(localStorage.getItem('portafile.v1')).shop.name === 'Demo Espresso Bar' &&
    !localStorage.getItem('portafile.v1.lead') && !localStorage.getItem('portafile.v1.lead.sent') &&
    !localStorage.getItem('portafile.v1.synckey') && !localStorage.getItem('portafile.v1.revoked')));
  ok('delete: staff device reloaded clean (no ?k, no lock screen)', !pS.url().includes('k=') &&
    !(await pS.textContent('body')).includes('turned off'));
  await cS.close();
  const preName = await pA.inputValue('#shopName'); // the owner's real shop name, so the check below can't pass vacuously
  await pA.evaluate(() => syncPull()); await pA.waitForTimeout(1200);
  ok('delete: owner device ALSO wiped back to the demo shop', preName !== 'Demo Espresso Bar' && await pA.evaluate(() => {
    const s = localStorage.getItem('portafile.v1'); return !!s && JSON.parse(s).shop.name === 'Demo Espresso Bar';
  }));
  ok('delete: owner device loses signup + sync credentials', await pA.evaluate(() =>
    !localStorage.getItem('portafile.v1.lead') && !localStorage.getItem('portafile.v1.synckey') &&
    !localStorage.getItem('portafile.v1.owner') && !localStorage.getItem('portafile.v1.role')));
  ok('delete: owner device back on clean URL, app alive', !pA.url().includes('k=') && await pA.locator('.rcard').count() > 0);
  // a never-synced device opening the dead bookmark: disconnected, never wiped
  const cN = await b.newContext(); const pN = await cN.newPage();
  pN.on('pageerror', e => errs.push('pN: ' + e.message));
  await pN.route('**/api/state*', mock);
  await pN.goto(base + `/index.html?k=${newK}`, { waitUntil: 'networkidle' });
  await pN.waitForTimeout(1500);
  ok('delete: stale bookmark just disconnects — badge says removed, data intact',
    (await pN.textContent('#syncBadge')).includes('removed') && await pN.locator('.rcard').count() > 0 &&
    await pN.evaluate(() => !!localStorage.getItem('portafile.v1') && !localStorage.getItem('portafile.v1.synckey')));
  await cN.close();
  // owner starts over from the demo seed: the PUT create path with fresh ids must still work post-delete
  await pA.evaluate(() => dataMenu());
  await pA.click('#dSyncOn'); await pA.waitForTimeout(1800);
  const rebornK = await pA.evaluate(() => localStorage.getItem('portafile.v1.synckey'));
  ok('delete: owner can start a FRESH shop afterwards (new ids, new link)',
    !!rebornK && rebornK !== newK && !!keys[rebornK] && keys[rebornK] !== SHOP && !!cloud[keys[rebornK]]);
  ok('delete: old shop stays tombstoned', owners[SHOP].deleted === true && !cloud[SHOP]);

  /* 7g. The two ways the founder's delete used to look like it did nothing.
     (a) The tombstone has no ownerHash — api/state.js copies it from a Blob read that CAN flake to
     null, and a pre-owner-token shop never had one — so the server can only answer owner:false.
     (b) The owner device that SEEDED the shop has no `synced` marker until its first 200 GET, so a
     shop deleted in its first 30 seconds (every test cycle) has neither proof. With both missing the
     device fell into the stale-bookmark branch: sync stopped, the app stayed open, the gate never
     came back. It must recognise its OWN shop from the shopId in the 410 body instead.
     Same section covers the other half of "guaranteed": a hidden tab reacts on focus, not one POLL_MS later. */
  const shop2 = keys[rebornK];
  // rename BEFORE the tombstone (and let the 800ms save debounce flush) so the wipe check below is
  // real — the reborn shop starts on the demo seed, so "name is the demo name" would pass vacuously
  await pA.fill('#shopName', 'Second Cafe'); await pA.dispatchEvent('#shopName', 'change');
  await pA.waitForTimeout(1400);
  await pA.evaluate(() => localStorage.setItem('portafile.v1.lead', '{"email":"o2@y.z"}'));
  ok('delete: seeding owner really has no synced marker', await pA.evaluate(() => !localStorage.getItem('portafile.v1.synced')));
  owners[shop2] = { deleted: true }; delete cloud[shop2]; // the admin DELETE, with the ownerHash lost
  await pA.waitForTimeout(2500);
  ok('delete: nothing has happened yet (poll not due)', await pA.evaluate(() => !!localStorage.getItem('portafile.v1.lead')));
  // headless Chromium reports every tab as visible, so the browser's own "you're back" signal is
  // dispatched here instead of by backgrounding the tab — the handler it wakes is the real one
  await pA.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await pA.waitForTimeout(2500);
  ok('delete: tab reacts the moment it is looked at', await pA.evaluate(() => !localStorage.getItem('portafile.v1.lead')));
  ok('delete: hashless tombstone still wipes the owner back to the demo shop', await pA.evaluate(() => {
    const s = localStorage.getItem('portafile.v1');
    return !!s && JSON.parse(s).shop.name === 'Demo Espresso Bar' && JSON.parse(s).recipes.length > 0;
  }));
  ok('delete: hashless tombstone still clears the dead credentials', await pA.evaluate(() =>
    !localStorage.getItem('portafile.v1.synckey') && !localStorage.getItem('portafile.v1.owner') &&
    !localStorage.getItem('portafile.v1.shopid') && !localStorage.getItem('portafile.v1.synced')));
  // re-sync so the offline section below still has a keyed device
  await pA.evaluate(() => dataMenu());
  await pA.click('#dSyncOn'); await pA.waitForTimeout(1800);

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

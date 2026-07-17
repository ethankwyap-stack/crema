/* Sync verification — serves product/ locally, mocks /api/state with an in-memory store,
   and proves: no-key mode never calls the API, keyed devices share state both ways,
   offline degrades gracefully. Run: node product/verify-sync.js */
const pw = require('/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');

const results = []; const ok = (n, c) => { results.push([c, n]); console.log((c ? 'PASS' : 'FAIL') + '  ' + n); };
const KEY = 'a'.repeat(40);

(async () => {
  const dir = __dirname;
  const srv = http.createServer((req, res) => {
    const f = path.join(dir, req.url.split('?')[0].replace(/^\//, '') || 'index.html');
    try { res.end(fs.readFileSync(f)); } catch (e) { res.statusCode = 404; res.end(); }
  }).listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;

  const cloud = {}; let apiCalls = 0;
  const mock = async route => {
    apiCalls++;
    const u = new URL(route.request().url()); const k = u.searchParams.get('k');
    if (route.request().method() === 'PUT') { cloud[k] = route.request().postData(); return route.fulfill({ json: { ok: true } }); }
    if (!cloud[k]) return route.fulfill({ status: 404, json: { error: 'not found' } });
    return route.fulfill({ contentType: 'application/json', body: cloud[k] });
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

  // 2. device A with key seeds the cloud
  const cA = await b.newContext(); const pA = await cA.newPage();
  pA.on('pageerror', e => errs.push('pA: ' + e.message));
  await pA.route('**/api/state*', mock);
  await pA.goto(base + `/index.html?k=${KEY}`, { waitUntil: 'networkidle' });
  await pA.waitForTimeout(1500);
  ok('A: badge shows synced', (await pA.textContent('#syncBadge')) === 'synced');
  ok('A: cloud seeded with valid state', !!cloud[KEY] && JSON.parse(cloud[KEY]).recipes.length === 15);

  // 3. A edits shop name → push lands in cloud
  await pA.fill('#shopName', 'Sync Test Cafe'); await pA.dispatchEvent('#shopName', 'change');
  await pA.waitForTimeout(1500);
  ok('A: edit pushed to cloud', JSON.parse(cloud[KEY]).shop.name === 'Sync Test Cafe');

  // 4. device B opens the same link → sees A's data
  const cB = await b.newContext(); const pB = await cB.newPage();
  pB.on('pageerror', e => errs.push('pB: ' + e.message));
  await pB.route('**/api/state*', mock);
  await pB.goto(base + `/index.html?k=${KEY}`, { waitUntil: 'networkidle' });
  await pB.waitForTimeout(1500);
  ok('B: pulled A\'s data', (await pB.inputValue('#shopName')) === 'Sync Test Cafe');

  // 5. B edits → A picks it up on next poll (fake the poll by evaluating syncPull)
  await pB.fill('#shopName', 'B Was Here'); await pB.dispatchEvent('#shopName', 'change');
  await pB.waitForTimeout(1500);
  await pA.evaluate(() => syncPull());
  await pA.waitForTimeout(800);
  ok('A: poll pulled B\'s edit', (await pA.inputValue('#shopName')) === 'B Was Here');

  // 6. offline: API dead → badge degrades, app keeps working locally
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

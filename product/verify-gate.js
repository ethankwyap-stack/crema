/* Access-gate verification — mocks /api/lead, disables the webdriver skip, and proves:
   gate blocks first visit, requires email+shop, submits the lead, unlocks and stays
   unlocked, and never re-appears or re-posts. Run: node product/verify-gate.js */
const pw = require('/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const results = []; const ok = (n, c) => { results.push([c, n]); console.log((c ? 'PASS' : 'FAIL') + '  ' + n); };

(async () => {
  const dir = __dirname;
  const srv = http.createServer((req, res) => {
    try { res.end(fs.readFileSync(path.join(dir, req.url.split('?')[0].replace(/^\//, '') || 'index.html'))); }
    catch (e) { res.statusCode = 404; res.end(); }
  }).listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;

  const posted = [];
  const b = await pw.chromium.launch();
  const ctx = await b.newContext();
  // the gate deliberately skips automated browsers; undo that for this test only
  await ctx.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  await ctx.route('**/api/lead', r => { posted.push(JSON.parse(r.request().postData())); r.fulfill({ json: { ok: true } }); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));

  await p.goto(base + '/index.html', { waitUntil: 'networkidle' });
  ok('gate shows on first visit', await p.locator('.gatewrap').isVisible());
  await p.click('.gate button[type=submit]');
  ok('empty form does not unlock', await p.locator('.gatewrap').isVisible());
  await p.fill('.gate [name=email]', 'owner@cafetest.com');
  await p.fill('.gate [name=shop]', 'Test Cafe');
  await p.selectOption('.gate [name=role]', 'Owner');
  await p.fill('.gate [name=city]', 'Davis, CA');
  await p.click('.gate button[type=submit]');
  await p.waitForTimeout(600);
  ok('gate unlocks after valid submit', await p.locator('.gatewrap').count() === 0);
  ok('lead posted with all fields', posted.length === 1 && posted[0].email === 'owner@cafetest.com'
    && posted[0].shop === 'Test Cafe' && posted[0].role === 'Owner' && posted[0].city === 'Davis, CA');
  ok('app usable behind gate', await p.locator('.rcard').count() > 0);

  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  ok('remembered: no gate on reload', await p.locator('.gatewrap').count() === 0);
  ok('remembered: no duplicate POST', posted.length === 1);

  // a barista opening the owner's staff link must never be asked to sign up
  const ctxS = await b.newContext();
  await ctxS.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  await ctxS.route('**/api/lead', r => r.fulfill({ json: { ok: true } }));
  const pS = await ctxS.newPage();
  await pS.goto(base + '/index.html?k=' + 'a'.repeat(40), { waitUntil: 'networkidle' });
  await pS.waitForTimeout(600);
  ok('staff link (?k=) skips the gate entirely', await pS.locator('.gatewrap').count() === 0);

  /* The training path is the owner's document: a barista reads it, they don't rewrite it.
     This is visibility, not a security boundary — a staff device holds the whole shop in
     localStorage either way, exactly like the price table. */
  await pS.evaluate(() => { S.path[0].note = 'Grind, tamp, 27 seconds.'; save(); render(); });
  await pS.click('.tab[data-tab=training]');
  ok('staff still see the path', await pS.locator('.pathlist li').count() === 10);
  ok('staff still see the step descriptions', (await pS.locator('.pathlist .note').first().textContent()).startsWith('Grind, tamp'));
  ok('staff get no reorder/delete buttons', await pS.locator('.pathlist [data-act]').count() === 0);
  ok('staff cannot retype a description or a day', await pS.locator('.pathlist input').count() === 0);
  ok('staff get no add-step row', await pS.locator('#pAdd').count() === 0);

  // automated browsers (the other suites, bots) skip the gate entirely
  const ctx2 = await b.newContext();
  await ctx2.route('**/api/lead', r => r.fulfill({ json: { ok: true } }));
  const p2 = await ctx2.newPage();
  await p2.goto(base + '/index.html?selftest=1', { waitUntil: 'networkidle' });
  await p2.waitForTimeout(1200);
  ok('webdriver visitors skip gate (suites unaffected)', await p2.locator('.gatewrap').count() === 0);
  ok('selftest passes behind no gate', (await p2.textContent('.selftest')).includes('PASS'));

  ok('zero page errors', errs.length === 0);
  if (errs.length) console.log(errs);
  await b.close(); srv.close();
  const fails = results.filter(r => !r[0]).length;
  console.log(fails ? `${fails} FAILED` : 'ALL GATE CHECKS PASS');
  process.exit(fails ? 1 : 0);
})();

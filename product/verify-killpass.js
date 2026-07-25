// Kill-pass fix verification: import-brick blocker + underwater badge + id-XSS
const { chromium } = require('/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const APP = 'file://' + path.resolve(__dirname, 'index.html'); // test the REAL shipped app, not a stale backup copy
const tmp = p => path.join(require('os').tmpdir(), p); // fixtures stay out of the repo
let failures = 0;
const check = (name, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + name); if (!cond) failures++; };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  let lastAlert = '';
  page.on('dialog', d => { lastAlert = d.message(); d.dismiss().catch(() => {}); });

  await page.goto(APP);
  const before = await page.evaluate(() => localStorage.getItem('portafile.v1') || localStorage.getItem(Object.keys(localStorage).find(k => k.includes('portafile'))));

  // 1. Hostile import: valid JSON, missing top-level keys (the blocker repro)
  fs.writeFileSync(tmp('bad-backup.json'), JSON.stringify({ recipes: [], ingredients: [] }));
  await page.click('#btnData');
  await page.setInputFiles('#dImport', tmp('bad-backup.json'));
  await page.waitForTimeout(400);
  check('keyless import rejected with alert', lastAlert.includes('not a portafile backup'));
  const after = await page.evaluate(() => localStorage.getItem('portafile.v1') || localStorage.getItem(Object.keys(localStorage).find(k => k.includes('portafile'))));
  check('localStorage untouched by rejected import', after === before);
  await page.reload();
  const drinks = await page.evaluate(() => document.querySelectorAll('.rcard').length);
  check('app alive after reload, recipes render (' + drinks + ')', drinks >= 15);

  // 2. Crafted import with XSS in id: valid shape, hostile id attribute
  const xssBackup = {
    shop: { name: 'x', cogsTarget: 30 },
    ingredients: [{ id: 'i1', name: 'Milk', unit: 'oz', unitCost: 0.04 }],
    recipes: [{ id: 'x"><img src=y onerror=window.__xss=1>', name: 'Evil', cat: 'c', size: 's', price: 5, items: [{ ing: 'i1', qty: 1 }], steps: [], bean: null }],
    beans: [], dialins: [], baristas: [], path: [], signoffs: {},
  };
  fs.writeFileSync(tmp('xss-backup.json'), JSON.stringify(xssBackup));
  await page.click('#btnData');
  await page.setInputFiles('#dImport', tmp('xss-backup.json'));
  await page.waitForTimeout(400);
  const xss = await page.evaluate(() => window.__xss);
  check('crafted id does not execute (attribute escaped)', xss === undefined);
  const evil = await page.evaluate(() => document.querySelectorAll('.rcard').length);
  check('crafted backup imported and rendered (' + evil + ' card)', evil === 1);

  // 3. Underwater: price 0 with real cost
  const badge = await page.evaluate(() => {
    const r = window.S ? null : null; return document.querySelector('.rcard .badge') ? document.querySelector('.rcard .badge').textContent : '';
  });
  // Evil recipe: price 5, cost 0.04 -> fine. Set price to 0 via edit is UI-heavy; import a price-0 drink instead.
  const uw = { ...xssBackup, recipes: [{ id: 'r1', name: 'Freebie', cat: 'c', size: 's', price: 0, items: [{ ing: 'i1', qty: 10 }], steps: [], bean: null }] };
  fs.writeFileSync(tmp('uw-backup.json'), JSON.stringify(uw));
  await page.click('#btnData');
  await page.setInputFiles('#dImport', tmp('uw-backup.json'));
  await page.waitForTimeout(400);
  const uwBadge = await page.evaluate(() => document.querySelector('.rcard .badge')?.textContent.trim());
  const uwClass = await page.evaluate(() => document.querySelector('.rcard .badge')?.className);
  check('price-0 drink shows "underwater" (got: ' + uwBadge + ')', uwBadge === 'underwater');
  check('underwater badge is red/bad', (uwClass || '').includes('bad'));
  const avg = await page.evaluate(() => document.querySelectorAll('.dash .stat .v')[1]?.textContent.trim());
  check('dashboard avg finite with unpriced drink (got: ' + avg + ')', !!avg && !avg.includes('Infinity') && !avg.includes('NaN'));

  // 3b. Hostile dial-in numbers (MED-4). Dial-ins typed locally are parseFloat'd, but state
  // arriving from the cloud or an import is never coerced — validBackup only checks Array.isArray.
  // This runs on file:// with NO CSP, the one context where the audit proved the payload executes,
  // so it fails loudly if any of the three render sites stops escaping.
  const PAY = '<img src=x onerror="window.__dial=1" id="pwned">';
  const dialBackup = {
    ...xssBackup,
    recipes: [{ id: 'r1', name: 'Latte', cat: 'c', size: 's', price: 5, items: [{ ing: 'i1', qty: 1 }], steps: [], bean: 'b1' }],
    beans: [{ id: 'b1', name: 'House', roaster: 'Roaster' }],
    dialins: [
      { beanId: 'b1', grind: PAY, dose: PAY, yield: PAY, time: PAY, note: 'newest', ts: Date.now() },
      { beanId: 'b1', grind: PAY, dose: PAY, yield: PAY, time: PAY, note: 'older', ts: Date.now() - 8.64e7 },
    ],
    path: [{ day: 1, type: 'recipe', ref: 'r1' }],
  };
  fs.writeFileSync(tmp('dial-backup.json'), JSON.stringify(dialBackup));
  await page.click('#btnData');
  await page.setInputFiles('#dImport', tmp('dial-backup.json'));
  await page.waitForTimeout(400);
  await page.click('[data-tab="dialin"]');
  await page.waitForTimeout(200);
  const dial = await page.evaluate(() => ({
    fired: window.__dial,
    injected: document.querySelectorAll('#pwned').length,
    board: document.querySelector('.dial-now .num')?.textContent || '',
    hist: document.querySelector('.dial-hist td:nth-child(2)')?.textContent || '',
  }));
  check('hostile dial-in does not execute (board + history)', dial.fired === undefined);
  check('no injected node anywhere in the dial-in view', dial.injected === 0);
  check('board shows the payload as literal text', dial.board.includes('<img src=x'));
  check('history row shows the payload as literal text', dial.hist.includes('<img src=x'));
  const pack = await page.evaluate(() => {
    window.buildPrint('hire');
    return { fired: window.__dial, injected: document.querySelectorAll('#printRoot #pwned').length,
             nums: document.querySelector('#printRoot .pdial .nums')?.textContent || '' };
  });
  check('new-hire print pack does not execute the payload', pack.fired === undefined);
  check('print pack renders the payload as literal text', pack.injected === 0 && pack.nums.includes('<img src=x'));

  // 4. Reset back to demo so the shipped state is clean
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  const seeded = await page.evaluate(() => document.querySelectorAll('.rcard').length);
  check('reset to demo shop (15 cards)', seeded === 15);

  check('zero page errors across all scenarios', pageErrors.length === 0);
  if (pageErrors.length) console.log(pageErrors.join('\n'));
  await browser.close();
  console.log(failures ? `${failures} FAILURES` : 'ALL KILL-PASS FIX CHECKS PASS');
  process.exit(failures ? 1 : 0);
})();

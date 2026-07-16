// Portafile end-to-end verification. Run: node verify.js
const path = require('path');
const PW = '/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const APP = 'file://' + encodeURI('/Users/ethanyap/Desktop/Claude Projects/cafe business/product/index.html');
const SHOTS = '/Users/ethanyap/Desktop/Claude Projects/cafe business/product/screenshots';
const fs = require('fs'); fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const results = [];
  const check = (name, cond) => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}`); };

  // 1. load + selftest
  await page.goto(APP + '?selftest=1');
  await page.waitForSelector('.selftest');
  const st = await page.textContent('.selftest');
  check('selftest banner: ' + st, st.includes('PASS'));
  await page.screenshot({ path: SHOTS + '/01-recipes.png', fullPage: false });

  // 2. price change reprices cards
  const latteCostBefore = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.rcard')].find(c => c.querySelector('h3').textContent === 'Latte');
    return card.querySelectorAll('.money b')[1].textContent;
  });
  check(`latte cost before = ${latteCostBefore}`, latteCostBefore === '$1.22');
  await page.click('.tab[data-tab=prices]');
  await page.waitForSelector('table.grid');
  await page.screenshot({ path: SHOTS + '/02-prices.png' });
  // find Whole milk row, set cost to 0.080
  const milkRow = page.locator('tr', { has: page.locator('input[value="Whole milk"]') });
  await milkRow.locator('input[data-f=unitCost]').fill('0.080');
  await milkRow.locator('input[data-f=unitCost]').dispatchEvent('change');
  await page.click('.tab[data-tab=recipes]');
  const latteCostAfter = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.rcard')].find(c => c.querySelector('h3').textContent === 'Latte');
    return card.querySelectorAll('.money b')[1].textContent;
  });
  // 18g beans*.033 + 9oz milk*.080 + .30 cup = 1.614 -> $1.61
  check(`milk $0.036→$0.080 reprices latte to ${latteCostAfter} (expect $1.61)`, latteCostAfter === '$1.61');
  // restore
  await page.click('.tab[data-tab=prices]');
  const milkRow2 = page.locator('tr', { has: page.locator('input[value="Whole milk"]') });
  await milkRow2.locator('input[data-f=unitCost]').fill('0.036');
  await milkRow2.locator('input[data-f=unitCost]').dispatchEvent('change');

  // 3. dial-in logging
  await page.click('.tab[data-tab=dialin]');
  const histBefore = await page.locator('.bean').first().locator('.dial-hist tr').count();
  const bean = page.locator('.bean').first();
  await bean.locator('[data-f=grind]').fill('11.9');
  await bean.locator('[data-f=dose]').fill('18');
  await bean.locator('[data-f=yield]').fill('37');
  await bean.locator('[data-f=time]').fill('27');
  await bean.locator('[data-f=note]').fill('verify run');
  await bean.locator('[data-act=logDial]').click();
  await page.waitForTimeout(100);
  const histAfter = await page.locator('.bean').first().locator('.dial-hist tr').count();
  const nowGrind = await page.locator('.bean').first().locator('.dial-now .num').first().textContent();
  check(`dial-in logged: history ${histBefore}→${histAfter}, board grind=${nowGrind}`, histAfter === histBefore + 1 && nowGrind === '11.9');
  const updated = await page.locator('.bean').first().locator('.dial-updated').textContent();
  check('board shows "set just now — verify run"', updated.includes('just now') && updated.includes('verify run'));
  await page.screenshot({ path: SHOTS + '/03-dialin.png' });

  // 4. training sign-off
  await page.click('.tab[data-tab=training]');
  await page.locator('.checklist input[type=checkbox]').first().check();
  await page.waitForTimeout(100);
  const prog = await page.textContent('.hint + .checklist, .progress + .hint').catch(() => null);
  const progText = await page.evaluate(() => document.querySelector('.progress + .hint').textContent);
  check(`sign-off tick registers: "${progText}"`, /^1\/\d+/.test(progText.trim()));
  const dated = await page.locator('.checklist .done-date').count();
  check('sign-off shows date stamp', dated === 1);
  await page.screenshot({ path: SHOTS + '/04-training.png' });

  // 5. print packs build (stub window.print)
  await page.click('.tab[data-tab=print]');
  await page.evaluate(() => { window.print = () => {}; });
  await page.click('[data-pack=hire]');
  const counts = await page.evaluate(() => ({
    cards: document.querySelectorAll('#printRoot .pcard').length,
    checks: document.querySelectorAll('#printRoot .ck').length,
    dials: document.querySelectorAll('#printRoot .pdial').length,
    cover: document.querySelectorAll('#printRoot .pcover').length,
  }));
  check(`new-hire pack: cover=${counts.cover} checklist=${counts.checks} dialins=${counts.dials} cards=${counts.cards}`,
    counts.cover === 1 && counts.checks === 10 && counts.dials === 2 && counts.cards === 15);
  await page.click('[data-pack=margin]');
  const marginRows = await page.evaluate(() => document.querySelectorAll('#printRoot .pstation tbody tr').length);
  check(`margin report rows = ${marginRows}`, marginRows === 15);
  await page.screenshot({ path: SHOTS + '/05-print.png' });
  // print-media preview screenshot of the new-hire pack
  await page.click('[data-pack=hire]');
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: SHOTS + '/06-print-preview.png', fullPage: true });
  await page.emulateMedia({ media: 'screen' });

  // 6. add a new recipe through the modal
  await page.click('.tab[data-tab=recipes]');
  await page.click('#addRecipe');
  await page.fill('#f_name', 'Test Cortado Tonic');
  await page.fill('#f_price', '6.25');
  await page.click('#f_addItem');
  await page.locator('#f_items .irow select').last().selectOption({ label: 'Espresso beans (g)' });
  await page.locator('#f_items .irow input').last().fill('18');
  await page.fill('#f_steps', 'Fill glass with ice and tonic\nPull double shot over');
  await page.click('#f_save');
  await page.waitForTimeout(100);
  const newCard = await page.evaluate(() => {
    const c = [...document.querySelectorAll('.rcard')].find(x => x.querySelector('h3').textContent === 'Test Cortado Tonic');
    return c ? c.querySelectorAll('.money b')[1].textContent : null;
  });
  check(`new recipe via modal appears, cost=${newCard} (expect $0.59)`, newCard === '$0.59');

  // 7. persistence across reload
  await page.reload();
  await page.waitForSelector('.rcard');
  const persisted = await page.evaluate(() => ({
    recipes: JSON.parse(localStorage.getItem('portafile.v1')).recipes.length,
    stillThere: [...document.querySelectorAll('.rcard h3')].some(h => h.textContent === 'Test Cortado Tonic'),
  }));
  check(`persists after reload (16 recipes incl. test drink)`, persisted.recipes === 16 && persisted.stillThere);

  // cleanup test data back to seed for pristine screenshots/demo
  await page.evaluate(() => localStorage.removeItem('portafile.v1'));
  await page.reload(); await page.waitForSelector('.rcard');
  await page.screenshot({ path: SHOTS + '/01-recipes.png' });

  console.log(results.join('\n'));
  console.log(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
  await browser.close();
  process.exit(results.some(r => r.startsWith('FAIL')) || errors.length ? 1 : 0);
})();

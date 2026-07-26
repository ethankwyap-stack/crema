/* Ad-hoc PT verification. Uses the SAME pinned playwright path as the suites (never `npx playwright`,
   which would upgrade the cache and break them). */
const path = require('path');
const PW = '/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const APP = 'file://' + encodeURI(path.resolve(__dirname, 'product', 'index.html'));
const SHOTS = require('os').tmpdir() + '/portafile-shots';
require('fs').mkdirSync(SHOTS, { recursive: true });

const fails = []; let n = 0;
const ok = (name, cond, got) => { n++; const s = cond ? 'PASS' : 'FAIL'; if (!cond) fails.push(name); console.log(`${s}  ${name}${got !== undefined ? `  (got: ${got})` : ''}`); };

(async () => {
  const browser = await chromium.launch();
  const errs = [];

  // ---- 1. A Lisbon browser gets Portuguese with no action taken -------------------------------
  const ptCtx = await browser.newContext({ locale: 'pt-PT' });
  const p = await ptCtx.newPage();
  p.on('pageerror', e => errs.push('pt: ' + e.message));
  await p.goto(APP + '?selftest=1');
  await p.waitForSelector('.selftest');

  ok('selftest passes under pt-PT', (await p.textContent('.selftest')).includes('PASS'), await p.textContent('.selftest'));
  ok('html lang is pt-PT', await p.getAttribute('html', 'lang') === 'pt-PT', await p.getAttribute('html', 'lang'));
  ok('tabs are Portuguese', (await p.textContent('[data-tab="recipes"]')) === 'Receitas', await p.textContent('[data-tab="recipes"]'));
  ok('print tab translated', (await p.textContent('[data-tab="print"]')) === 'Imprimir', await p.textContent('[data-tab="print"]'));
  ok('shop is the Lisbon demo', (await p.inputValue('#shopName')) === 'Café da Esquina (demo)', await p.inputValue('#shopName'));
  ok('picker shows PT', await p.inputValue('#langSel') === 'pt', await p.inputValue('#langSel'));

  const cards = await p.$$('.rcard');
  ok('19 Portuguese drinks seeded', cards.length === 19, cards.length);
  const names = await p.$$eval('.rcard h3', els => els.map(e => e.textContent));
  ok('menu is a real Portuguese menu', ['Café', 'Galão', 'Meia de leite', 'Pingado', 'Garoto', 'Abatanado'].every(x => names.includes(x)), names.slice(0, 7).join(', '));

  const firstCard = await p.textContent('.rcard');
  ok('prices are euros with decimal comma', /\d,\d\d\s*€/.test(firstCard), firstCard.replace(/\s+/g, ' ').slice(0, 90));
  ok('no dollar sign anywhere on the board', !(await p.textContent('#view')).includes('$'));
  ok('card says custa-lhe', firstCard.includes('custa-lhe'));
  ok('dashboard label is Portuguese', (await p.textContent('.dash')).includes('bebidas'));

  // Galão: 14g*0.018 + 190ml*0.0009 + 0.02 = 0.443 -> "0,44 €" on "1,80 €"
  const galao = await p.$$eval('.rcard', els => {
    const el = els.find(e => e.querySelector('h3')?.textContent === 'Galão');
    return el ? el.textContent.replace(/\s+/g, ' ') : '(not found)';
  });
  ok('Galão costs 0,44 € and sells for 1,80 €', galao.includes('0,44') && galao.includes('1,80'), galao.slice(0, 120));

  // ---- 2. Metric, not imperial ---------------------------------------------------------------
  const viewTxt = await p.textContent('#view');
  ok('no °F on the Portuguese cards', !viewTxt.includes('°F'));
  ok('°C is used instead', viewTxt.includes('°C'));
  ok('volumes are in ml', /\bml\b/.test(viewTxt));
  ok('no fl oz anywhere', !/fl oz/.test(viewTxt));
  const dialRef = await p.textContent('.dial-ref');
  ok('dial-in grind uses a decimal comma', dialRef.includes('moagem 12,2'), dialRef.trim());
  ok('whole dial numbers gain no separator', /18g dentro/.test(dialRef), dialRef.trim());

  // ---- 3. Prices tab in euros ----------------------------------------------------------------
  await p.click('[data-tab="prices"]');
  ok('prices heading translated', (await p.textContent('#view h2')) === 'Preços dos ingredientes', await p.textContent('#view h2'));
  const th = await p.$$eval('#view th', els => els.map(e => e.textContent));
  ok('price table headers translated', th.includes('Ingrediente') && th.includes('Custo / unidade'), th.join('|'));
  ok('cost column shows €', (await p.textContent('#view tbody tr')).includes('€'));
  const step = await p.getAttribute('#view tbody tr input[data-f="unitCost"]', 'step');
  ok('unitCost step allows per-ml costs', step === '0.0001', step);
  const milkCost = await p.inputValue('#view tbody tr:nth-child(3) input[data-f="unitCost"]');
  ok('per-ml milk cost is a valid step value', Number(milkCost) === 0.0009, milkCost);
  ok('milk input is not :invalid', await p.$eval('#view tbody tr:nth-child(3) input[data-f="unitCost"]', el => el.checkValidity()));

  // ---- 4. Dial-in board ----------------------------------------------------------------------
  await p.click('[data-tab="dialin"]');
  ok('dial-in board translated', (await p.textContent('#view h2')) === 'Quadro de dial-in', await p.textContent('#view h2'));
  ok('dial cell labels translated', (await p.textContent('.dial-now')).includes('moagem'));
  ok('relative time is Portuguese', /há \d+h|agora mesmo/.test(await p.textContent('.dial-updated')), await p.textContent('.dial-updated'));

  // ---- 5. Training + print -------------------------------------------------------------------
  await p.click('[data-tab="training"]');
  ok('training translated', (await p.textContent('#view h2')) === 'Percurso de formação', await p.textContent('#view h2'));
  ok('sign-off counter translated', (await p.textContent('.progress + .hint')).includes('validadas'), await p.textContent('.progress + .hint'));

  await p.click('[data-tab="print"]');
  ok('print packs translated', (await p.textContent('#view h2')) === 'Dossiês para imprimir', await p.textContent('#view h2'));
  // Build the new-hire pack without actually opening a print dialog.
  await p.evaluate(() => { window.print = () => {}; buildPrint('hire'); });
  const pack = await p.textContent('#printRoot');
  ok('hire pack cover in Portuguese', pack.includes('Bem-vindo ao balcão.'));
  ok('hire pack days in Portuguese', pack.includes('Dia 1'));
  ok('hire pack dial-ins in Portuguese', pack.includes('moagem'));
  // The promise is that printed packs hide COSTS — the menu price is on the menu board anyway.
  ok('hire pack shows menu prices', /\d,\d\d\s*€/.test(pack));
  ok('hire pack hides cost and margin', !pack.includes('custa-lhe') && !pack.includes('margem') && !pack.includes('% de custo'));
  await p.evaluate(() => { buildPrint('margin'); });
  const margin = await p.textContent('#printRoot');
  ok('margin report in Portuguese with euros', margin.includes('% custo') && margin.includes('€'));
  ok('margin report over-target wording', margin.includes('ACIMA') || margin.includes('OK'));

  // ---- 6. Help + gate copy -------------------------------------------------------------------
  await p.click('#btnHelp');
  const help = await p.textContent('.sheet');
  ok('help modal translated', help.includes('Como funciona o Portafile'));
  ok('help keeps its <strong> markup', (await p.$$('.sheet strong')).length > 0);
  await p.click('.sheet .btn');

  // ---- 7. The switch: PT -> EN, live, no reload ------------------------------------------------
  // Back to Recipes first: the Print view has no prices and no .rcard, which would make the
  // currency and card-count assertions below pass or fail for the wrong reason.
  await p.click('[data-tab="recipes"]');
  await p.selectOption('#langSel', 'en');
  ok('switch to EN retranslates chrome', (await p.textContent('[data-tab="recipes"]')) === 'Recipes', await p.textContent('[data-tab="recipes"]'));
  ok('switch to EN flips html lang', await p.getAttribute('html', 'lang') === 'en');
  const enBoard = await p.textContent('#view');
  ok('switch to EN flips currency to $', enBoard.includes('$') && !enBoard.includes('€'));
  /* An UNTOUCHED demo swaps menus with the language. Before this, switching left an American menu
     priced in euros on screen, which reads as a half-broken translation (it is what sent Ethan
     looking for missing strings on 2026-07-26). Nothing of the owner's exists yet to protect. */
  ok('untouched demo swaps to the English menu', (await p.$$('.rcard')).length === 15, (await p.$$('.rcard')).length);
  ok('...and it is really the English seed', await p.inputValue('#shopName') === 'Demo Espresso Bar', await p.inputValue('#shopName'));
  await p.selectOption('#langSel', 'pt');
  ok('switch back to PT', (await p.textContent('[data-tab="recipes"]')) === 'Receitas');
  ok('switch back to PT restores the Lisbon menu', (await p.$$('.rcard')).length === 19, (await p.$$('.rcard')).length);

  // ---- 7b. ANY of the owner's own work vetoes that swap ----------------------------------------
  await p.evaluate(() => { S = seed('pt'); S.shop.name = 'Café do Bairro'; save(); render(); });
  await p.selectOption('#langSel', 'en');
  ok('a renamed shop is never swapped', await p.inputValue('#shopName') === 'Café do Bairro', await p.inputValue('#shopName'));
  ok('a renamed shop keeps its 19 Portuguese drinks', (await p.$$('.rcard')).length === 19, (await p.$$('.rcard')).length);

  /* The subtle one, and the reason this rule is stricter than matchesADemoSeed in api/metrics.js:
     that test ignores dial-ins entirely, so a café that logged a week of real shots on an otherwise
     untouched demo would have had them silently thrown away by a language switch. */
  await p.evaluate(() => {
    S = seed('pt');
    S.dialins.push({ id: 'test-dialin', beanId: S.beans[0].id, ts: Date.now(), grind: 11, dose: 18, yield: 36, time: 27, note: 'meu registo' });
    save(); render();
  });
  await p.selectOption('#langSel', 'en');
  ok('one logged dial-in vetoes the swap', (await p.$$('.rcard')).length === 19, (await p.$$('.rcard')).length);
  ok('...and that dial-in survives', await p.evaluate(() => S.dialins.some(d => d.note === 'meu registo')));

  /* Swapping ONE ingredient at the same quantity: the case a qty-only fingerprint cannot see,
     because item.ing is a random uid that never matches a fresh seed(). Revert the N[x.ing]
     lookup in demoSig and this is the check that fails. */
  await p.evaluate(() => {
    S = seed('pt');
    const oat = S.ingredients.find(i => i.name === 'Bebida de aveia');
    const milky = S.recipes.find(r => r.items.some(it => it.ing !== oat.id && S.ingredients.find(i => i.id === it.ing).unit === 'ml'));
    milky.items.find(it => S.ingredients.find(i => i.id === it.ing).unit === 'ml').ing = oat.id;
    window.__swapped = milky.name; save(); render();
  });
  await p.selectOption('#langSel', 'en');
  ok('an ingredient swapped at the same qty vetoes it', (await p.$$('.rcard')).length === 19, (await p.$$('.rcard')).length);
  ok('...and the swapped ingredient survives', await p.evaluate(() => {
    const oat = S.ingredients.find(i => i.name === 'Bebida de aveia');
    return S.recipes.find(r => r.name === window.__swapped).items.some(it => it.ing === oat.id);
  }));

  // Back to a clean Portuguese demo for the reload check and the screenshot below.
  await p.evaluate(() => { S = seed('pt'); save(); render(); });
  await p.reload();
  ok('language choice survives reload', await p.inputValue('#langSel') === 'pt', await p.inputValue('#langSel'));
  await p.screenshot({ path: SHOTS + '/pt-app.png', fullPage: false });

  // ---- 8. An English browser is untouched -----------------------------------------------------
  const enCtx = await browser.newContext({ locale: 'en-US' });
  const q = await enCtx.newPage();
  q.on('pageerror', e => errs.push('en: ' + e.message));
  await q.goto(APP);
  ok('en-US browser still gets English', (await q.textContent('[data-tab="recipes"]')) === 'Recipes');
  ok('en-US browser still gets the US demo shop', (await q.inputValue('#shopName')) === 'Demo Espresso Bar', await q.inputValue('#shopName'));
  ok('en-US browser still gets 15 drinks', (await q.$$('.rcard')).length === 15);
  ok('en-US prices still in dollars', (await q.textContent('.rcard')).includes('$'));
  ok('en-US picker shows EN', await q.inputValue('#langSel') === 'en');

  // ---- 9. A Brazilian browser also gets Portuguese --------------------------------------------
  const brCtx = await browser.newContext({ locale: 'pt-BR' });
  const r = await brCtx.newPage();
  r.on('pageerror', e => errs.push('br: ' + e.message));
  await r.goto(APP);
  ok('pt-BR browser gets Portuguese too', (await r.textContent('[data-tab="recipes"]')) === 'Receitas');

  ok('zero page errors', errs.length === 0, errs.join(' | '));
  await browser.close();
  console.log(fails.length ? `\nPT FAIL (${fails.length}/${n}):\n  - ${fails.join('\n  - ')}` : `\nALL PT CHECKS PASS (${n})`);
  process.exit(fails.length ? 1 : 0);
})();

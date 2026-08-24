/* verify-landing.mjs — checks the v3 landing page's live cost desk.
   Run:  python3 -m http.server 8899   (from the repo root, the page loads its
         stylesheets by absolute path, same as verify-site.js)
         node verify-landing.mjs

   The desk is the only logic on that page, and it is the page's whole argument:
   if it silently stops recomputing, the landing page still LOOKS finished.
   Playwright is required by absolute path out of the shared npx cache on
   purpose — see CLAUDE.md, a bare `npx playwright` upgrades that cache and
   breaks every suite in this repo. */
import { createRequire } from 'module';
const require = createRequire('/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/');
const { chromium } = require('/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');

const URL = process.env.LANDING_URL || 'http://localhost:8899/site/v3.html';
let pass = 0, fail = 0;
const ok = (name, cond, got) => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${got !== undefined ? `  got: ${got}` : ''}`); }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });

const read = () => page.evaluate(() => {
  const rows = [...document.querySelectorAll('#deskRows li')].map(li => ({
    name: li.querySelector('.d').textContent,
    cost: li.querySelector('.cost').textContent,
    cogs: li.querySelector('.cogs').textContent,
    alert: li.querySelector('.cogs').classList.contains('is-alert')
  }));
  return { rows, avg: document.getElementById('avgCogs').textContent };
});
const setMilk = v => page.evaluate(val => {
  const s = document.getElementById('milk');
  s.value = String(val);
  s.dispatchEvent(new Event('input'));
}, v);

const base = await read();
ok('the desk renders six drinks', base.rows.length === 6, base.rows.length);

// the app's own shipped demo numbers. If these drift, the landing page is
// quoting figures the product does not produce.
ok('latte costs $1.22 at the default milk price', base.rows[0].cost === 'costs $1.22', base.rows[0].cost);
ok('flat white costs $1.09', base.rows[1].cost === 'costs $1.09', base.rows[1].cost);
ok('cappuccino costs $1.07', base.rows[2].cost === 'costs $1.07', base.rows[2].cost);
ok('cortado costs $0.98', base.rows[3].cost === 'costs $0.98', base.rows[3].cost);
ok('espresso costs $0.89', base.rows[5].cost === 'costs $0.89', base.rows[5].cost);
ok('no drink is in the alert band at the default price', base.rows.every(r => !r.alert));

await setMilk(9.0);
const dear = await read();
ok('a milk rise re-costs the latte', dear.rows[0].cost === 'costs $1.53', dear.rows[0].cost);
ok('espresso has no milk, so it never moves', dear.rows[5].cost === 'costs $0.89', dear.rows[5].cost);
ok('the average COGS moves with the slider', dear.avg !== base.avg, `${base.avg} -> ${dear.avg}`);
ok('a dear enough milk trips the alert badge', dear.rows.some(r => r.alert));

await setMilk(3.2);
const cheap = await read();
ok('the cheapest milk is cheaper than the default', cheap.rows[0].cost < base.rows[0].cost,
   `${cheap.rows[0].cost} vs ${base.rows[0].cost}`);

// no-JS / reduced-motion reader still sees a real figure, never a zero
const stat = await page.textContent('[data-count]');
ok('the sourced figure renders even before it animates', /\d/.test(stat), stat);

// one CTA label, used everywhere
const labels = await page.$$eval('a.cta', els => [...new Set(els.map(e => e.textContent.trim()))]);
ok('every CTA carries the same label', labels.length === 1, labels.join(' | '));

ok('no console or page errors', errors.length === 0, errors.join(' ; '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

/* Render the guide HTML to a print-ready A4 PDF.
 *
 *   node guide/render-pdf.js              -> renders every guide/*.html
 *   node guide/render-pdf.js guia-pt.html -> renders just that one
 *
 * Uses the SAME pinned playwright as the verify suites. Never run a bare
 * `npx playwright ...` — it upgrades that cache and breaks every suite.
 * Nothing here is deployed: .vercelignore is an allowlist and /guide is not on it.
 */
const path = require('path');
const fs = require('fs');
const PW = '/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);

const DIR = __dirname;
const OUT = { 'guia-pt.html': 'Crema-Guia-PT.pdf', 'guide-en.html': 'Crema-Guide-EN.pdf' };

/* Every <span class="btn"> in the guide names a real button in the app. If someone renames a
   button in product/i18n.js, the guide silently starts lying — the same silent-drift failure the
   i18n dictionary already has. So check the labels here, on every render.
   BOTH SIDES of the dictionary count. The English string IS the key (see CLAUDE.md), so the
   Portuguese guide's labels are dictionary VALUES while the English guide's labels are KEYS —
   checking values alone would reject every correct English label. A `|context` suffix is
   stripped, since that is what the app renders for English.
   Literals that are in neither side (the language picker, the "?" button) are listed here. */
const LITERALS = new Set(['?', 'EN', 'PT', 'Dial-in']);
function checkLabels(html, file) {
  const dict = fs.readFileSync(path.join(DIR, '..', 'product', 'i18n.js'), 'utf8');
  const unq = s => s.replace(/\\'/g, "'");
  const known = new Set([
    ...[...dict.matchAll(/:\s*'((?:\\.|[^'])*)'/g)].map(m => unq(m[1])),              // pt values
    ...[...dict.matchAll(/^\s*'((?:\\.|[^'])*)'\s*:/gm)].map(m => unq(m[1]).split('|')[0]), // en keys
  ]);
  const used = [...new Set([...html.matchAll(/<span class="btn">([^<]+)<\/span>/g)].map(m => m[1].trim()))];
  const missing = used.filter(l => !LITERALS.has(l) && !known.has(l));
  console.log(`  ${used.length} button labels referenced, ${used.length - missing.length} confirmed against product/i18n.js`);
  if (missing.length) {
    console.error(`  ✗ ${file}: NOT FOUND in the app's dictionary (either side): ${missing.map(m => `"${m}"`).join(', ')}`);
    process.exitCode = 1;
  }
}

(async () => {
  const only = process.argv[2];
  const files = (only ? [only] : fs.readdirSync(DIR).filter(f => f.endsWith('.html')));
  if (!files.length) { console.error('no .html files in guide/'); process.exit(1); }

  const browser = await chromium.launch();
  for (const f of files) {
    const src = path.join(DIR, f);
    const out = path.join(DIR, OUT[f] || f.replace(/\.html$/, '.pdf'));
    checkLabels(fs.readFileSync(src, 'utf8'), f);
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + encodeURI(src), { waitUntil: 'networkidle' });
    await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    // Page count, read straight back out of the file we just wrote.
    const buf = fs.readFileSync(out);
    const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`${f} -> ${path.basename(out)}  ${(buf.length / 1024).toFixed(0)} KB, ${pages || '?'} page(s)`
      + (errs.length ? `  PAGE ERRORS: ${errs.join('; ')}` : ''));
    await page.close();
  }
  await browser.close();
})();

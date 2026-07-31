/* Landing-page verification: the CSS extraction must not have unstyled the page, and the new
   Portuguese page must render identically. Same pinned playwright path as the suites. */
const PW = '/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const BASE = process.env.BASE || 'http://127.0.0.1:8899';
const SHOTS = require('os').tmpdir() + '/portafile-shots';
require('fs').mkdirSync(SHOTS, { recursive: true });

const fails = []; let n = 0;
const ok = (name, cond, got) => { n++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${got !== undefined ? `  (got: ${got})` : ''}`); if (!cond) fails.push(name); };

(async () => {
  const browser = await chromium.launch();
  // reducedMotion so [data-reveal] elements are visible immediately — otherwise headless
  // virtual-time can freeze the transitions and every reveal screenshots blank.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });

  const bad = [];
  for (const [label, url] of [['en', `${BASE}/site/index.html`], ['pt', `${BASE}/site/pt/index.html`]]) {
    const p = await ctx.newPage();
    p.on('pageerror', e => bad.push(`${label} jserror: ${e.message}`));
    p.on('response', r => { if (r.status() >= 400) bad.push(`${label} ${r.status()} ${r.url()}`); });
    await p.goto(url, { waitUntil: 'load' });

    // The stylesheet actually applied — these values exist only in site.css.
    const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(`${label}: site.css applied (Counter dark background)`, bg === 'rgb(23, 19, 15)', bg);
    const h1size = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('h1')).fontSize));
    ok(`${label}: display type scaled by css`, h1size > 50, h1size);
    // Ink navy is a FILL shade, so the label flips light. Assert both — a navy fill
    // that kept the old dark label is a legible-looking rule and an invisible button.
    const btn = await p.evaluate(() => {
      const s = getComputedStyle(document.querySelector('.btn'));
      return { bg: s.backgroundColor, fg: s.color };
    });
    ok(`${label}: primary button is Ink navy`, btn.bg === 'rgb(34, 53, 92)', btn.bg);
    ok(`${label}: primary button label is light`, btn.fg === 'rgb(239, 241, 247)', btn.fg);

    // reveal.js ran and un-hid the content
    ok(`${label}: reveal.js added the .js class`, await p.evaluate(() => document.documentElement.classList.contains('js')));
    const heroOpacity = await p.evaluate(() => getComputedStyle(document.querySelector('.sub')).opacity);
    ok(`${label}: revealed content is visible`, heroOpacity === '1', heroOpacity);

    // no sideways scroll
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`${label}: no horizontal overflow`, overflow <= 1, overflow);

    const html = await p.content();
    if (label === 'pt') {
      ok('pt: lang is pt-PT', await p.getAttribute('html', 'lang') === 'pt-PT');
      ok('pt: headline translated', (await p.textContent('h1')).includes('afinado'));
      ok('pt: mockcard shows euros with comma', /1,80\s*€/.test(await p.textContent('.mockcard')));
      ok('pt: mockcard cost matches the seed (0,44 €)', (await p.textContent('.mockcard')).includes('0,44'));
      ok('pt: ticker in euros, no dollars', !(await p.textContent('.ticker')).includes('$'));
      ok('pt: switch links back to English', await p.getAttribute('.langlink', 'href') === '/');
      ok('pt: free tier shown as 0 €', (await p.textContent('.plan')).includes('0 €'));
      ok('pt: paid tiers flagged as USD', html.includes('em dólares (USD)'));
      ok('pt: privacy link is the PT one', html.includes('/site/pt/privacy.html'));
      ok('pt: app link is absolute', await p.getAttribute('.cta', 'href') === '/product/index.html');
      ok('pt: no film link while the video is pulled', !html.includes('portafile-launch.mp4'));
      ok('pt: faq drink count matches the pt seed (19)', html.includes('19 bebidas'));
      const faqs = await p.$$('details');
      ok('pt: all six faqs present', faqs.length === 6, faqs.length);
      ok('pt: reddit quotes kept verbatim in English', (await p.textContent('.q')).includes('WORST training standards'));
      // Nothing obviously untranslated left in the headings.
      const heads = (await p.$$eval('h2, .eyebrow, summary', els => els.map(e => e.textContent.trim())));
      const englishy = heads.filter(h => /^(Pricing|FAQ|What it does|The money|The paper|The menu|Fair questions|Asked over the counter|Heard on the bar)$/i.test(h));
      ok('pt: no untranslated headings', englishy.length === 0, englishy.join(' | '));
    } else {
      ok('en: switch links to /pt', await p.getAttribute('.langlink', 'href') === '/pt');
      ok('en: privacy link is absolute (was a root 404)', html.includes('href="/site/privacy.html"') && !html.includes('href="privacy.html"'));
      ok('en: no relative ../ links left', !html.includes('href="../'));
      ok('en: headline unchanged', (await p.textContent('h1')).includes('dialed'));
      ok('en: still 15 drinks in the faq', html.includes('15 editable drinks'));
    }
    await p.screenshot({ path: `${SHOTS}/site-${label}.png` });
    // narrow width via a second context (old-headless width clamping makes direct resize unreliable)
    await p.setViewportSize({ width: 390, height: 780 });
    const mOver = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`${label}: no overflow at 390px`, mOver <= 1, mOver);
    const langVisible = await p.evaluate(() => { const e = document.querySelector('.langlink'); return e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; });
    ok(`${label}: language switch still reachable on a phone`, langVisible);
    await p.close();
  }

  ok('no 4xx/5xx or js errors on either page', bad.length === 0, bad.join(' | '));
  await browser.close();
  console.log(fails.length ? `\nSITE FAIL (${fails.length}/${n}):\n  - ${fails.join('\n  - ')}` : `\nALL SITE CHECKS PASS (${n})`);
  process.exit(fails.length ? 1 : 0);
})();

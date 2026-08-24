/* Landing-page verification: the CSS extraction must not have unstyled the page, and the new
   Portuguese page must render identically. Same pinned playwright path as the suites. */
const PW = '/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
const BASE = process.env.BASE || 'http://127.0.0.1:8899';
const SHOTS = require('os').tmpdir() + '/portafile-shots';
require('fs').mkdirSync(SHOTS, { recursive: true });

const fails = []; let n = 0;

// How far the page can ACTUALLY be scrolled sideways, in px. Returns 0 when it cannot,
// however wide its content technically is. Restores the original scroll position.
const realOverflow = p => p.evaluate(() => {
  const was = window.scrollX;
  window.scrollTo(9.9e6, window.scrollY);
  const reached = window.scrollX;
  window.scrollTo(was, window.scrollY);
  return reached;
});

const ok = (name, cond, got) => { n++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${got !== undefined ? `  (got: ${got})` : ''}`); if (!cond) fails.push(name); };

(async () => {
  const browser = await chromium.launch();
  // reducedMotion so [data-reveal] elements are visible immediately — otherwise headless
  // virtual-time can freeze the transitions and every reveal screenshots blank.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });

  const bad = [];
  // Both landing pages are on v2.css since /pt was ported to the redesign (2026-08-23).
  // Each page still asserts its OWN href plus the background that sheet produces: a
  // shared assertion would pass with the sheet 404'd, which is the failure this catches.
  const PAGES = [
    ['en', `${BASE}/site/index.html`,    '/site/v2.css',   'rgb(14, 11, 9)'],
    ['pt', `${BASE}/site/pt/index.html`, '/site/v2.css',   'rgb(14, 11, 9)'],
  ];
  for (const [label, url, sheet, expectBg] of PAGES) {
    const p = await ctx.newPage();
    p.on('pageerror', e => bad.push(`${label} jserror: ${e.message}`));
    p.on('response', r => { if (r.status() >= 400) bad.push(`${label} ${r.status()} ${r.url()}`); });
    await p.goto(url, { waitUntil: 'load' });

    // Name the sheet AND assert its computed effect — the link tag alone proves nothing.
    ok(`${label}: links its own stylesheet (${sheet})`,
       (await p.content()).includes(`href="${sheet}"`));
    const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(`${label}: stylesheet applied (Counter dark background)`, bg === expectBg, bg);
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

    // no sideways scroll. Measured by REALLY SCROLLING, not by scrollWidth: the ticker's
    // .track is width:max-content and inflates scrollWidth by ~64px while the page cannot
    // actually be scrolled sideways (the .ticker clips it). scrollWidth reported a bug that
    // does not exist; window.scrollX after a scroll attempt reports what a visitor can do.
    const overflow = await realOverflow(p);
    ok(`${label}: no horizontal overflow`, overflow === 0, overflow);

    const html = await p.content();
    if (label === 'pt') {
      ok('pt: lang is pt-PT', await p.getAttribute('html', 'lang') === 'pt-PT');
      ok('pt: headline translated', (await p.textContent('h1')).includes('afinado'));
      ok('pt: mockcard shows euros with comma', /1,80\s*€/.test(await p.textContent('.mockcard')));
      ok('pt: mockcard cost matches the seed (0,44 €)', (await p.textContent('.mockcard')).includes('0,44'));
      ok('pt: ticker in euros, no dollars', !(await p.textContent('.ticker')).includes('$'));
      ok('pt: switch links back to English', await p.getAttribute('.langlink', 'href') === '/');
      // Pricing was pulled from BOTH pages (2026-08-02, not charging yet). These used to
      // assert the plan cards; locator('.plan') then hung for the full 30s timeout and
      // CRASHED the suite mid-run, so every check after it silently stopped existing.
      // Assert the absence instead — this flips the moment pricing is un-commented.
      ok('pt: no pricing section while pricing is pulled', (await p.$$('.plan')).length === 0);
      ok('pt: privacy link is the PT one', html.includes('/site/pt/privacy.html'));
      // The nav button lost its .cta class when /pt was ported to v2.css markup.
      ok('pt: app link is absolute', await p.getAttribute('.nav .btn.sm', 'href') === '/product/index.html');
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
      ok('en: no pricing section while pricing is pulled', (await p.$$('.plan')).length === 0);
    }
    await p.screenshot({ path: `${SHOTS}/site-${label}.png` });
    // narrow width via a second context (old-headless width clamping makes direct resize unreliable)
    await p.setViewportSize({ width: 390, height: 780 });
    const mOver = await realOverflow(p);
    ok(`${label}: no overflow at 390px`, mOver === 0, mOver);
    const langVisible = await p.evaluate(() => { const e = document.querySelector('.langlink'); return e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; });
    ok(`${label}: language switch still reachable on a phone`, langVisible);
    await p.close();
  }

  ok('no 4xx/5xx or js errors on either page', bad.length === 0, bad.join(' | '));
  await browser.close();
  console.log(fails.length ? `\nSITE FAIL (${fails.length}/${n}):\n  - ${fails.join('\n  - ')}` : `\nALL SITE CHECKS PASS (${n})`);
  process.exit(fails.length ? 1 : 0);
})();

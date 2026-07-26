const { chromium } = require('/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('fs');
const APP = 'file://' + encodeURI('/Users/ethanyap/Desktop/Claude Projects/cafe business/product/index.html');
const DIR = __dirname + '/rec';
fs.rmSync(DIR, { recursive: true, force: true }); fs.mkdirSync(DIR);

async function scene(name, fn) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: DIR, size: { width: 1280, height: 720 } },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(APP);
  await page.evaluate(() => localStorage.removeItem('portafile.v1'));
  await page.reload();
  await page.waitForSelector('.rcard');
  await fn(page);
  const video = page.video();
  await ctx.close();
  const p = await video.path();
  fs.renameSync(p, `${DIR}/${name}.webm`);
  await browser.close();
  console.log(name, 'recorded');
}

(async () => {
  // S3 — recipes tour (target ≥ 9.2s after 0.6 trim)
  await scene('s3', async p => {
    await p.waitForTimeout(2600);
    await p.mouse.move(640, 400);
    for (let i = 0; i < 22; i++) { await p.mouse.wheel(0, 28); await p.waitForTimeout(90); }
    await p.waitForTimeout(1200);
    for (let i = 0; i < 22; i++) { await p.mouse.wheel(0, -28); await p.waitForTimeout(60); }
    await p.waitForTimeout(2400);
  });

  // S4 — money moment (target ≥ 16.2s)
  await scene('s4', async p => {
    await p.waitForTimeout(1500);
    await p.click('.tab[data-tab=prices]');
    await p.waitForTimeout(2200);
    const milk = p.locator('tr', { has: p.locator('input[value="Whole milk"]') }).locator('input[data-f=unitCost]');
    await milk.click({ clickCount: 3 });
    await p.waitForTimeout(700);
    await milk.pressSequentially('0.080', { delay: 160 });
    await p.waitForTimeout(700);
    await milk.dispatchEvent('change');
    await p.waitForTimeout(2500);
    await p.click('.tab[data-tab=recipes]');
    await p.waitForTimeout(1300);
    const latte = p.locator('.rcard', { has: p.locator('h3', { hasText: /^Latte$/ }) });
    await latte.hover();
    await p.waitForTimeout(5200);
  });

  // S5 — dial-in (target ≥ 10.4s)
  await scene('s5', async p => {
    await p.click('.tab[data-tab=dialin]');
    await p.waitForTimeout(1800);
    const bean = p.locator('.bean').first();
    await bean.locator('[data-f=grind]').click({ clickCount: 3 });
    await bean.locator('[data-f=grind]').pressSequentially('11.9', { delay: 120 });
    await bean.locator('[data-f=time]').click({ clickCount: 3 });
    await bean.locator('[data-f=time]').pressSequentially('27', { delay: 120 });
    await bean.locator('[data-f=note]').click();
    await bean.locator('[data-f=note]').pressSequentially('humid again — tightened', { delay: 45 });
    await p.waitForTimeout(500);
    await bean.locator('[data-act=logDial]').click();
    await p.waitForTimeout(3600);
  });

  // S6 — training (target ≥ 5.5s)
  await scene('s6', async p => {
    await p.click('.tab[data-tab=training]');
    await p.waitForTimeout(1600);
    await p.locator('.checklist input[type=checkbox]').nth(0).check();
    await p.waitForTimeout(1300);
    await p.locator('.checklist input[type=checkbox]').nth(1).check();
    await p.waitForTimeout(2600);
  });

  // S7 — print pack (target ≥ 9.2s)
  await scene('s7', async p => {
    await p.click('.tab[data-tab=print]');
    await p.waitForTimeout(1600);
    await p.evaluate(() => { window.print = () => {}; });
    await p.click('[data-pack=hire]');
    await p.emulateMedia({ media: 'print' });
    await p.waitForTimeout(1400);
    await p.mouse.move(640, 400);
    for (let i = 0; i < 55; i++) { await p.mouse.wheel(0, 55); await p.waitForTimeout(70); }
    await p.waitForTimeout(1500);
  });

  console.log('all scenes recorded');
})();

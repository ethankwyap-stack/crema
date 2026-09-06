/* Crema v1 — local-first. All data in localStorage; nothing leaves the browser. */
'use strict';

/* ---------------- state ---------------- */
const KEY = 'portafile.v1';
const LOCK_KEY = 'portafile.v1.revoked'; // set when the owner killed this device's link — survives reload
let locked = false;                      // once true nothing may write to localStorage or the API again
const uid = () => Math.random().toString(36).slice(2, 9);

/* Two seeds, not one parameterised one: the Portuguese shop is not a translation of the American
   menu, it is a different menu (galão, meia de leite, pingado) at Lisbon prices in ml and °C,
   served in porcelain rather than paper. A shared template would have to be bent for every one of
   those differences. `lang` also decides currency — see product/i18n.js. */
function seed(lang) {
  return (lang || detectLang()) === 'pt' ? seedPT() : seedEN();
}

function seedEN() {
  const I = {}; // ingredient ids by name for readable seeding
  const ing = (name, unit, unitCost) => { const id = uid(); I[name] = id; return { id, name, unit, unitCost }; };
  const ingredients = [
    ing('Espresso beans', 'g', 0.033),
    ing('Drip / batch coffee', 'g', 0.026),
    ing('Whole milk', 'fl oz', 0.036),
    ing('Oat milk', 'fl oz', 0.078),
    ing('Vanilla syrup', 'pump', 0.14),
    ing('Chocolate sauce', 'pump', 0.16),
    ing('Chai concentrate', 'fl oz', 0.11),
    ing('Matcha powder', 'g', 0.32),
    ing('Cold brew concentrate', 'fl oz', 0.09),
    ing('Earl grey tea bag', 'each', 0.18),
    ing('Whipped cream', 'serving', 0.22),
    ing('12oz hot cup + lid + sleeve', 'each', 0.30),
    ing('16oz cold cup + lid + straw', 'each', 0.27),
  ];
  const beans = [
    { id: uid(), name: 'House Blend', roaster: 'Demo Coffee Roasters' },
    { id: uid(), name: 'Ethiopia Guji (guest)', roaster: 'Demo Coffee Roasters' },
  ];
  const now = Date.now(), H = 3600e3;
  const dialins = [
    { id: uid(), beanId: beans[0].id, ts: now - 30 * H, grind: 12.5, dose: 18, yield: 36, time: 26, note: 'new bag, opened up a touch' },
    { id: uid(), beanId: beans[0].id, ts: now - 4 * H, grind: 12.2, dose: 18, yield: 36, time: 28, note: 'humid morning' },
    { id: uid(), beanId: beans[1].id, ts: now - 20 * H, grind: 11.8, dose: 17, yield: 40, time: 30, note: 'running longer for sweetness' },
  ];
  const R = (name, cat, size, price, items, steps, bean) =>
    ({ id: uid(), name, cat, size, price, items, steps, bean: bean || null });
  const e = (n, q) => ({ ing: I[n], qty: q });
  const hot12 = () => e('12oz hot cup + lid + sleeve', 1);
  const cold16 = () => e('16oz cold cup + lid + straw', 1);
  const recipes = [
    R('Espresso', 'espresso', '2 oz', 3.25, [e('Espresso beans', 18), hot12()],
      ['Pull a double to current dial-in', 'Serve with sparkling water'], beans[0].id),
    R('Americano', 'espresso', '12 oz', 3.75, [e('Espresso beans', 18), hot12()],
      ['Fill cup 2/3 with hot water', 'Pull double shot over the water'], beans[0].id),
    R('Latte', 'espresso + milk', '12 oz', 5.00, [e('Espresso beans', 18), e('Whole milk', 9), hot12()],
      ['Pull double shot', 'Steam milk to 140°F, wet-paint texture', 'Pour from 3in, finish low for art'], beans[0].id),
    R('Cappuccino', 'espresso + milk', '8 oz', 4.75, [e('Espresso beans', 18), e('Whole milk', 5), hot12()],
      ['Pull double shot', 'Steam to 145°F with 1cm foam', 'Pour to a deep dome'], beans[0].id),
    R('Flat White', 'espresso + milk', '8 oz', 4.90, [e('Espresso beans', 18), e('Whole milk', 5.5), hot12()],
      ['Pull double ristretto (stop at 30g)', 'Steam to 135°F, thin microfoam', 'Pour flat and glossy'], beans[0].id),
    R('Cortado', 'espresso + milk', '4.5 oz', 4.50, [e('Espresso beans', 18), e('Whole milk', 2.5), hot12()],
      ['Pull double shot', 'Steam milk barely — 130°F, no dome', 'Equal parts, serve in gibraltar'], beans[0].id),
    R('Mocha', 'espresso + milk', '12 oz', 5.75, [e('Espresso beans', 18), e('Whole milk', 8), e('Chocolate sauce', 2), e('Whipped cream', 1), hot12()],
      ['Pump chocolate into cup, pull shots onto it', 'Stir to melt', 'Steam milk to 140°F, pour', 'Whip on request'], beans[0].id),
    R('Vanilla Latte', 'espresso + milk', '12 oz', 5.50, [e('Espresso beans', 18), e('Whole milk', 9), e('Vanilla syrup', 2), hot12()],
      ['2 pumps vanilla in cup', 'Pull double shot', 'Steam to 140°F, pour'], beans[0].id),
    R('Iced Latte', 'iced', '16 oz', 5.50, [e('Espresso beans', 18), e('Whole milk', 8), cold16()],
      ['Fill cup with ice', 'Milk to 1in below rim', 'Pull double shot over the top'], beans[0].id),
    R('Cold Brew', 'iced', '16 oz', 5.00, [e('Cold brew concentrate', 6), cold16()],
      ['Fill cup with ice', 'Concentrate + water 1:1 to the rim', 'Stir twice'], null),
    R('Drip Coffee', 'brewed', '12 oz', 3.00, [e('Drip / batch coffee', 22), hot12()],
      ['Brew batch at 1:16, hold max 2 hours', 'Offer room for cream'], null),
    R('Chai Latte', 'not coffee', '12 oz', 5.25, [e('Chai concentrate', 4), e('Whole milk', 8), hot12()],
      ['Concentrate in cup', 'Steam milk to 145°F', 'Pour and stir once'], null),
    R('Matcha Latte', 'not coffee', '12 oz', 6.00, [e('Matcha powder', 3), e('Whole milk', 9), hot12()],
      ['Sift 3g matcha, whisk with 2oz hot water until no lumps', 'Steam milk to 140°F', 'Pour over'], null),
    R('London Fog', 'not coffee', '12 oz', 4.95, [e('Earl grey tea bag', 1), e('Whole milk', 6), e('Vanilla syrup', 1), hot12()],
      ['Steep earl grey in 6oz water, 3 min', '1 pump vanilla', 'Steam milk, top the tea'], null),
    R('Hot Chocolate', 'not coffee', '12 oz', 4.50, [e('Chocolate sauce', 3), e('Whole milk', 10), e('Whipped cream', 1), hot12()],
      ['3 pumps chocolate in cup', 'Steam milk to 145°F', 'Pour, stir, whip on top'], null),
  ];
  const baristas = [{ id: uid(), name: 'Sam (demo)' }];
  const path = [
    { id: uid(), type: 'skill', label: 'Shop tour: stations, fridge map, closing keys', day: 1 },
    { id: uid(), type: 'skill', label: 'Espresso machine: safety, purge, portafilter care', day: 1 },
    { id: uid(), type: 'recipe', ref: recipes[0].id, day: 1 },
    { id: uid(), type: 'recipe', ref: recipes[1].id, day: 1 },
    { id: uid(), type: 'skill', label: 'Milk steaming: texture, temp by feel, pitcher care', day: 2 },
    { id: uid(), type: 'recipe', ref: recipes[2].id, day: 2 },
    { id: uid(), type: 'recipe', ref: recipes[3].id, day: 2 },
    { id: uid(), type: 'recipe', ref: recipes[7].id, day: 3 },
    { id: uid(), type: 'recipe', ref: recipes[8].id, day: 3 },
    { id: uid(), type: 'skill', label: 'Register: comps, refunds, 86ing an item', day: 3 },
  ];
  return {
    shop: { name: 'Demo Espresso Bar', cogsTarget: 30, lang: 'en' },
    ingredients, recipes, beans, dialins, baristas, path,
    signoffs: {}, tab: 'recipes',
  };
}

/* Lisbon demo shop. Real Portuguese café menu, euro prices a Lisbon owner would recognise,
   metric everywhere. The traditional drinks carry "Louça (lavagem)" instead of a paper cup —
   in Portugal a café or galão is drunk at the counter in porcelain, so the per-serve cost is
   dishwashing, not packaging. Getting that wrong made every espresso look like it lost money. */
function seedPT() {
  const I = {};
  const ing = (name, unit, unitCost) => { const id = uid(); I[name] = id; return { id, name, unit, unitCost }; };
  const ingredients = [
    ing('Café em grão (espresso)', 'g', 0.018),
    ing('Café de filtro', 'g', 0.016),
    ing('Leite meio-gordo', 'ml', 0.0009),
    ing('Bebida de aveia', 'ml', 0.0018),
    ing('Xarope de baunilha', 'dose', 0.10),
    ing('Molho de chocolate', 'dose', 0.12),
    ing('Concentrado de chai', 'ml', 0.006),
    ing('Matcha em pó', 'g', 0.15),
    ing('Concentrado de cold brew', 'ml', 0.005),
    ing('Saqueta de chá Earl Grey', 'un.', 0.09),
    ing('Chantilly', 'porção', 0.15),
    ing('Louça (lavagem)', 'un.', 0.02),
    ing('Copo takeaway 350 ml + tampa', 'un.', 0.22),
    ing('Copo frio 470 ml + tampa + palhinha', 'un.', 0.20),
  ];
  const beans = [
    { id: uid(), name: 'Lote da Casa', roaster: 'Torrefação Demo' },
    { id: uid(), name: 'Etiópia Guji (convidado)', roaster: 'Torrefação Demo' },
  ];
  const now = Date.now(), H = 3600e3;
  const dialins = [
    { id: uid(), beanId: beans[0].id, ts: now - 30 * H, grind: 12.5, dose: 18, yield: 36, time: 26, note: 'saco novo, abri a moagem um pouco' },
    { id: uid(), beanId: beans[0].id, ts: now - 4 * H, grind: 12.2, dose: 18, yield: 36, time: 28, note: 'manhã húmida' },
    { id: uid(), beanId: beans[1].id, ts: now - 20 * H, grind: 11.8, dose: 17, yield: 40, time: 30, note: 'mais longo para ganhar doçura' },
  ];
  const R = (name, cat, size, price, items, steps, bean) =>
    ({ id: uid(), name, cat, size, price, items, steps, bean: bean || null });
  const e = (n, q) => ({ ing: I[n], qty: q });
  const louca = (q) => e('Louça (lavagem)', q || 1);
  const takeaway = () => e('Copo takeaway 350 ml + tampa', 1);
  const frio = () => e('Copo frio 470 ml + tampa + palhinha', 1);
  const recipes = [
    R('Café', 'espresso', '25 ml', 1.00, [e('Café em grão (espresso)', 9), louca()],
      ['Moer na hora e extrair 9 g para 25 ml', 'Servir em louça com um copo de água'], beans[0].id),
    R('Café duplo', 'espresso', '50 ml', 1.60, [e('Café em grão (espresso)', 18), louca()],
      ['Extrair um duplo conforme o dial-in atual', 'Servir em louça com água'], beans[0].id),
    R('Abatanado', 'espresso', '120 ml', 1.40, [e('Café em grão (espresso)', 18), louca()],
      ['Encher a taça a 2/3 com água quente', 'Extrair o duplo por cima da água'], beans[0].id),
    R('Pingado', 'espresso + leite', '70 ml', 1.10, [e('Café em grão (espresso)', 9), e('Leite meio-gordo', 15), louca()],
      ['Extrair o café curto', 'Acrescentar um pingo de leite vaporizado'], beans[0].id),
    R('Garoto', 'espresso + leite', '90 ml', 1.20, [e('Café em grão (espresso)', 9), e('Leite meio-gordo', 45), louca()],
      ['Extrair o café', 'Vaporizar o leite a 60 °C', 'Encher a taça pequena com o leite'], beans[0].id),
    R('Meia de leite', 'espresso + leite', '200 ml', 1.60, [e('Café em grão (espresso)', 14), e('Leite meio-gordo', 130), louca()],
      ['Extrair o café numa taça', 'Vaporizar o leite a 60 °C, espuma fina', 'Meio café, meio leite'], beans[0].id),
    R('Galão', 'espresso + leite', '250 ml', 1.80, [e('Café em grão (espresso)', 14), e('Leite meio-gordo', 190), louca()],
      ['Extrair o café direto no copo alto', 'Vaporizar o leite a 60 °C', 'Encher o copo, espuma no topo'], beans[0].id),
    R('Cappuccino', 'espresso + leite', '240 ml', 2.60, [e('Café em grão (espresso)', 18), e('Leite meio-gordo', 150), louca()],
      ['Extrair o duplo', 'Vaporizar a 63 °C com 1 cm de espuma', 'Verter até formar uma cúpula'], beans[0].id),
    R('Flat White', 'espresso + leite', '240 ml', 2.80, [e('Café em grão (espresso)', 18), e('Leite meio-gordo', 165), louca()],
      ['Extrair um duplo ristretto (parar aos 30 g)', 'Vaporizar a 57 °C, microespuma fina', 'Verter liso e brilhante'], beans[0].id),
    R('Mocha', 'espresso + leite', '350 ml', 3.20, [e('Café em grão (espresso)', 18), e('Leite meio-gordo', 240), e('Molho de chocolate', 2), e('Chantilly', 1), takeaway()],
      ['Doses de chocolate no copo, extrair por cima', 'Mexer para derreter', 'Vaporizar o leite a 60 °C e verter', 'Chantilly a pedido'], beans[0].id),
    R('Galão de baunilha', 'espresso + leite', '250 ml', 2.40, [e('Café em grão (espresso)', 14), e('Leite meio-gordo', 190), e('Xarope de baunilha', 2), louca()],
      ['2 doses de baunilha no copo', 'Extrair o café', 'Vaporizar a 60 °C e verter'], beans[0].id),
    R('Café com gelo', 'gelado', '25 ml + gelo', 1.60, [e('Café em grão (espresso)', 18), louca(2)],
      ['Extrair o duplo numa taça', 'Servir com um copo de gelo à parte', 'O cliente verte o café sobre o gelo'], beans[0].id),
    R('Latte gelado', 'gelado', '470 ml', 3.20, [e('Café em grão (espresso)', 18), e('Leite meio-gordo', 240), frio()],
      ['Encher o copo de gelo', 'Leite até 2 cm da borda', 'Extrair o duplo por cima'], beans[0].id),
    R('Cold Brew', 'gelado', '470 ml', 3.20, [e('Concentrado de cold brew', 180), frio()],
      ['Encher o copo de gelo', 'Concentrado + água 1:1 até à borda', 'Mexer duas vezes'], null),
    R('Café de filtro', 'filtro', '350 ml', 2.20, [e('Café de filtro', 22), takeaway()],
      ['Extrair em lote a 1:16, guardar no máximo 2 horas', 'Oferecer espaço para leite'], null),
    R('Chai Latte', 'sem café', '350 ml', 3.20, [e('Concentrado de chai', 90), e('Leite meio-gordo', 240), takeaway()],
      ['Concentrado no copo', 'Vaporizar o leite a 63 °C', 'Verter e mexer uma vez'], null),
    R('Matcha Latte', 'sem café', '350 ml', 3.60, [e('Matcha em pó', 3), e('Leite meio-gordo', 270), takeaway()],
      ['Peneirar 3 g de matcha e bater com 60 ml de água quente até não ter grumos', 'Vaporizar o leite a 60 °C', 'Verter por cima'], null),
    R('London Fog', 'sem café', '350 ml', 2.90, [e('Saqueta de chá Earl Grey', 1), e('Leite meio-gordo', 180), e('Xarope de baunilha', 1), takeaway()],
      ['Infundir o Earl Grey em 180 ml de água, 3 min', '1 dose de baunilha', 'Vaporizar o leite e cobrir o chá'], null),
    R('Chocolate quente', 'sem café', '350 ml', 2.80, [e('Molho de chocolate', 3), e('Leite meio-gordo', 300), e('Chantilly', 1), takeaway()],
      ['3 doses de chocolate no copo', 'Vaporizar o leite a 63 °C', 'Verter, mexer, chantilly no topo'], null),
  ];
  const baristas = [{ id: uid(), name: 'Sofia (demo)' }];
  const path = [
    { id: uid(), type: 'skill', label: 'Visita ao espaço: postos, mapa do frigorífico, chaves do fecho', day: 1 },
    { id: uid(), type: 'skill', label: 'Máquina de espresso: segurança, purga, cuidado do porta-filtro', day: 1 },
    { id: uid(), type: 'recipe', ref: recipes[0].id, day: 1 },
    { id: uid(), type: 'recipe', ref: recipes[2].id, day: 1 },
    { id: uid(), type: 'skill', label: 'Vaporizar leite: textura, temperatura ao toque, cuidado da jarra', day: 2 },
    { id: uid(), type: 'recipe', ref: recipes[6].id, day: 2 },
    { id: uid(), type: 'recipe', ref: recipes[7].id, day: 2 },
    { id: uid(), type: 'recipe', ref: recipes[9].id, day: 3 },
    { id: uid(), type: 'recipe', ref: recipes[12].id, day: 3 },
    { id: uid(), type: 'skill', label: 'Caixa: ofertas, devoluções, marcar um artigo como esgotado', day: 3 },
  ];
  return {
    shop: { name: 'Café da Esquina (demo)', cogsTarget: 30, lang: 'pt' },
    ingredients, recipes, beans, dialins, baristas, path,
    signoffs: {}, tab: 'recipes',
  };
}

let S = load();
/* One place decides the active language: the shop's own setting, else what the browser asks for.
   Re-run at the top of render() because syncPull() can replace S wholesale with the owner's copy —
   so a Lisbon owner setting PT reaches every staff device on the next poll. */
const applyLang = () => setLang(S.shop.lang || detectLang());
applyLang();

/* index.html ships English markup; retranslate the static chrome on every render so the picker
   takes effect without a reload. */
function applyChrome() {
  document.documentElement.lang = getLang() === 'pt' ? 'pt-PT' : 'en';
  document.title = t('Crema — your whole shop, dialed in');
  const nm = $('#shopName'); if (nm) nm.setAttribute('aria-label', t('Shop name'));
  const bh = $('#btnHelp'); if (bh) bh.title = t('Help');
  const bd = $('#btnData'); if (bd) { bd.title = t('Backup, restore, reset'); bd.textContent = t('Data ▾'); }
  const TABS = { recipes: 'Recipes', prices: 'Prices', dialin: 'Dial-in', training: 'Training', print: 'Print' };
  $$('.tab').forEach(b => { if (TABS[b.dataset.tab]) b.textContent = t(TABS[b.dataset.tab]); });
  const sel = $('#langSel');
  if (sel) { sel.value = getLang(); sel.setAttribute('aria-label', t('Language')); sel.title = t('Language'); }
}

function validBackup(s) {
  return !!(s && typeof s === 'object'
    && s.shop && typeof s.shop === 'object' && typeof s.shop.name === 'string'
    && ['ingredients', 'recipes', 'beans', 'dialins', 'baristas', 'path'].every(k => Array.isArray(s[k]))
    && s.signoffs && typeof s.signoffs === 'object');
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (validBackup(s)) { s.shop.cogsTarget = +s.shop.cogsTarget || 30; s.tab = s.tab || 'recipes'; return s; }
      localStorage.setItem(KEY + '.bad', raw); // keep the damaged state recoverable instead of destroying it
    }
  } catch (e) { /* corrupted -> reseed */ }
  const s = seed();
  if (!localStorage.getItem(LOCK_KEY)) localStorage.setItem(KEY, JSON.stringify(s)); // a killed device stays empty on disk
  return s;
}
const save = () => { if (locked) return; localStorage.setItem(KEY, JSON.stringify(S)); syncPush(); };

/* ---------------- sync (opt-in secret link, ?k=…) ---------------- */
/* Off by default: with no key the app is pure-local, byte-identical to v1 behavior.
   ponytail: last-write-wins, no merging — local backup + Export remain the safety net. */
const SYNC_KEY = 'portafile.v1.synckey';
const OWNER_KEY = 'portafile.v1.owner';  // owner devices only — proves ownership, sent as a header, never in a URL
const SHOP_KEY = 'portafile.v1.shopid';  // durable shop identity; the share link is a rotatable pointer to it
const SYNCED_KEY = 'portafile.v1.synced'; // the link this device actually pulled a shop through
const ROLE_KEY = 'portafile.v1.role';     // 'staff' hides every cost/margin figure — set by the SERVER, not by us

/* Staff view: a device that reached this shop through a staff link and has never proven ownership.
   Costs are redacted SERVER-SIDE (api/state.js splits costs/<shopId>.json from shops/<shopId>.json,
   merged back only for a proven owner) — a staff device's synced copy never contains real unitCost
   values, so opening devtools shows only zeros. This client-side hide is still needed to keep the
   UI from rendering a wall of $0.00 cost figures and a fake 100% COGS at staff. */
/* Fails CLOSED: on a synced device, costs stay hidden until the SERVER has answered 'owner' for
   the current link. A local owner token proves nothing by itself — it may belong to a different
   shop (the owner pasting another shop's staff link into their own phone hit exactly that: the
   stale token unlocked costs the server never approved). The token's only job is to ride the
   request; the server hash-checks it against THIS shop and answers with the role. */
const staffView = () => syncKey ? localStorage.getItem(ROLE_KEY) !== 'owner' : false;
function applyRole(role) {
  const cur = localStorage.getItem(ROLE_KEY);
  // Never downgrade staff→owner on the server's word alone: a flaky owners-record read answers
  // 'owner' for everyone. Only a device actually holding an owner token may be promoted.
  if (role === 'owner' && cur === 'staff' && !localStorage.getItem(OWNER_KEY)) return;
  if (role !== 'staff' && role !== 'owner') return;
  if (role === cur) return;
  localStorage.setItem(ROLE_KEY, role);
  render(); // costs appear or vanish immediately, without waiting for the next state change
}
const hex40 = () => { const b = new Uint8Array(20); crypto.getRandomValues(b); return [...b].map(x => x.toString(16).padStart(2, '0')).join(''); };
let syncKey = (() => {
  const m = location.search.match(/[?&]k=([a-f0-9]{40})\b/);
  if (m) {
    // A different link = possibly a different shop: forget the cached role so costs stay hidden
    // until the server answers for THIS link. Same link (reload, rotate) keeps its role.
    if (m[1] !== localStorage.getItem(SYNC_KEY)) localStorage.removeItem(ROLE_KEY);
    localStorage.setItem(SYNC_KEY, m[1]);
    return m[1];
  }
  return localStorage.getItem(SYNC_KEY) || '';
})();
let syncStatus = syncKey ? 'connecting' : '';
function syncBadge() {
  let el = document.getElementById('syncBadge');
  if (!syncKey) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'syncBadge'; document.body.appendChild(el); }
  el.className = 'syncbadge ' + syncStatus;
  const badge = { connecting: 'sync…', live: 'synced', offline: 'sync offline — working locally', revoked: 'this link no longer works — ask the owner for a new one', deleted: 'this shop was removed — sync is off' }[syncStatus];
  el.textContent = badge ? t(badge) : '';
}
/* Poll interval. Each GET /api/state costs the server 3-4 Blob reads (pointer, owner record,
   shop state, and costs/ for an owner), and Vercel's free tier allows 2,000 advanced Blob
   operations a MONTH — at the original 30s this burned the whole month's budget in about four
   hours of one tab being left open. Five minutes is the timer; it is not what makes sync feel
   live. The visibilitychange and online re-pulls below do that, and they fire exactly when
   someone is actually looking. The cost is that a revoke or delete reaches a tab nobody is
   touching in up to 5 minutes instead of 30s, which the revocation model already allows for
   (it is a value comparison over an eventually-consistent store, never a real-time guarantee).
   Raising this back to 30s means paying for Blob operations. */
const POLL_MS = 300000;
let syncPollT;
function lockScreen() {
  document.title = t('Link turned off — Crema');
  document.body.innerHTML = `<div class="gatewrap"><div class="sheet">
    <h3>${t('This link has been turned off')}</h3>
    <p>${t("The shop owner reset the staff link, so this device no longer has access to the shop's recipes, prices or training records. The copy that was stored on this device has been removed.")}</p>
    <p class="hint">${t('Ask the owner for the new link and open it on this device.')}</p>
  </div></div>`;
}
/* Dead link. On a staff device this is a hard stop: wipe the shop's data off the device, lock the
   UI, and stay locked across reloads until a working link is opened. An owner device (holds the
   token) is NEVER wiped or locked — that would destroy the only full copy of the shop. */
function syncRevoked() {
  clearInterval(syncPollT); clearTimeout(syncPushT);
  // Wipe ONLY a device this link actually let in. A stale link clicked by someone holding their own
  // local shop must never destroy it — there is nothing to revoke on a device that never had access.
  if (localStorage.getItem(OWNER_KEY) || localStorage.getItem(SYNCED_KEY) !== syncKey) {
    syncStatus = 'revoked'; syncBadge(); return;
  }
  locked = true;
  const dead = syncKey || '1';
  // Destroy the SHOP's data, not the browser's signup record — that record isn't a credential and
  // grants nothing, and clearing it makes an already-signed-up person fill the gate in again,
  // writing a duplicate lead into the founder's store.
  Object.keys(localStorage)
    .filter(k => k.startsWith(KEY) && !k.startsWith(LEAD_KEY))
    .forEach(k => localStorage.removeItem(k));
  localStorage.setItem(LOCK_KEY, dead); // after the wipe — the wipe would have removed it
  lockScreen();
}
let syncPushT;
let syncPulled = false; // never push before the first successful pull — a freshly-seeded browser must not shove demo data over a real cloud copy
/* 410 is the ONLY wipe trigger: the server compared this link against the shop's current one and
   says it was replaced. A 404 means "no record of this link", which a flaky blob read can also
   produce, so it never destroys anything — it just shows the dead-link badge. */
const syncDead = () => { clearInterval(syncPollT); syncStatus = 'revoked'; syncBadge(); };
/* Wiping a device is irreversible, and blob reads go briefly stale after any write — so one 410 is
   a claim, not proof. Demand a second one a few seconds later; any successful sync clears the count. */
let revokeStrikes = 0;
/* isOwner comes from the SERVER's 410 body — it checked our token against THIS shop's owner record.
   A local owner token proves nothing here: it may belong to a different shop, and trusting it made
   such a device unrevokable (it settled-and-retried forever instead of locking). */
/* The founder deleted this shop's cloud copy — different from a link rotate. Every device
   disconnects AND forgets its signup record, so returning users meet the access gate as new
   visitors (that's the point: deleted shop = clean slate). EVERY device loses the local copy,
   the owner's included: a delete that left the owner's recipes on screen behind the signup form
   read as "nothing happened". That makes this the one button that can destroy a shop's last
   copy, so the founder's dashboard warns and asks first. 'deleted' is a positive tombstone value
   (a flaky read yields absence, not deleted:true, and shopIds are never reused), so unlike the
   revoke path one answer is proof enough — no two-strike rule needed. */
function syncDeletedSignal(isOwner, deletedShop) {
  clearInterval(syncPollT); clearTimeout(syncPushT);
  /* Is the dead shop OURS? Two independent proofs, either is enough. The server's hash check
     (isOwner) alone was not: the tombstone copies its ownerHash from a Blob read that CAN flake to
     null, and a pre-owner-token shop never had one — so the real owner gets owner:false. Combined
     with a seeding device having no `synced` marker until its first 200 GET (true for every shop
     deleted in its first 30 seconds), that dropped the owner into the stale-bookmark branch below:
     sync stopped, the app stayed open, the gate never returned. The shopId in the 410 body settles
     it locally. It can't misfire on a stale bookmark — that device's shopId is its own live shop. */
  const mine = isOwner || (!!deletedShop && deletedShop === localStorage.getItem(SHOP_KEY));
  // "part of the shop" = ours, or we pulled its data through this link (a staff device)
  if (!mine && localStorage.getItem(SYNCED_KEY) !== syncKey) {
    // a stale bookmark of a deleted shop on a device that was never part of it: just stop syncing
    localStorage.removeItem(SYNC_KEY); localStorage.removeItem(ROLE_KEY);
    history.replaceState(null, '', location.pathname);
    syncStatus = 'deleted'; syncBadge();
    return;
  }
  Object.keys(localStorage).filter(x => x.startsWith('portafile.v1')).forEach(x => localStorage.removeItem(x)); // INCLUDING lead* — the gate must reappear
  location.replace(location.pathname); // reload clean: no ?k, no signup record, demo seed → gate greets them fresh
}
/* Routes a 410 by its body: 'deleted' (shop erased by founder) vs 'revoked' (link rotated). */
function syncGoneSignal(body) {
  return body?.error === 'deleted' ? syncDeletedSignal(!!body.owner, String(body.shopId || '')) : syncRevokeSignal(body?.owner);
}
function syncRevokeSignal(isOwner) {
  if (isOwner) return syncRestart(3000); // this shop's real owner: never terminal, just settle and retry
  if (++revokeStrikes < 2) { syncRestart(4000); return; }
  syncRevoked(); // still refuses to WIPE any owner-token device — it may hold the only copy of its own shop
}
/* Blob storage takes up to ~1.2s to serve a freshly written value, so for a moment after a rotate
   the server can still answer from the pre-rotate owner record and call the NEW key revoked.
   Pause, then resume — without this the owner's own device goes dead the instant they press reset. */
function syncRestart(delay) {
  clearInterval(syncPollT); clearTimeout(syncPushT);
  setTimeout(() => {
    if (locked) return;
    syncStatus = 'connecting'; syncBadge(); syncPull();
    syncPollT = setInterval(syncPull, POLL_MS);
  }, delay);
}
function syncPush() {
  if (!syncKey || !syncPulled || locked) return;
  clearTimeout(syncPushT);
  syncPushT = setTimeout(async () => {
    syncPushT = 0; // no longer pending — lets the focus recheck below know a save isn't in flight
    try {
      const owner = localStorage.getItem(OWNER_KEY), shopId = localStorage.getItem(SHOP_KEY);
      const headers = { 'content-type': 'application/json' };
      if (owner && shopId) { headers['x-portafile-owner'] = owner; headers['x-portafile-shop'] = shopId; } // owner creds ride along; staff devices don't have them
      const r = await fetch('/api/state?k=' + syncKey, { method: 'PUT', headers, body: JSON.stringify({ ...S, ts: Date.now() }) });
      if (r.status === 409) return syncPull(); // our copy is stale — refresh from cloud instead of clobbering it
      if (r.status === 410) return syncGoneSignal(await r.json().catch(() => 0)); // link replaced or shop deleted — body says which
      if (r.status === 404) { syncDead(); return; }             // unrecognised link — stop, but never wipe
      if (r.ok) applyRole(r.headers.get('x-portafile-role')); // the create path never GETs, so the seeding owner learns their role here
      syncStatus = r.ok ? 'live' : 'offline';
    } catch (e) { syncStatus = 'offline'; }
    syncBadge();
  }, 800);
}
async function syncPull() {
  if (!syncKey || locked) return;
  try {
    const owner = localStorage.getItem(OWNER_KEY);
    // owner token rides along so a 410 can say whether WE are this shop's owner (settle) or not (lock)
    const r = await fetch('/api/state?k=' + syncKey, owner ? { headers: { 'x-portafile-owner': owner } } : undefined);
    if (r.status === 410) return syncGoneSignal(await r.json().catch(() => 0)); // link replaced or shop deleted — body says which
    // 404 = no record of this link. Only an OWNER device (holds the token) may read that as
    // "shop not created yet" and seed it; anyone else stops, but nothing is destroyed.
    if (r.status === 404) {
      if (localStorage.getItem(OWNER_KEY)) {
        const stored = localStorage.getItem(SYNC_KEY);
        if (stored && stored !== syncKey) { syncKey = stored; return syncPull(); } // another tab rotated the link
        syncPulled = true; syncStatus = 'live'; syncPush(); syncBadge();
      } else syncDead();
      return;
    }
    if (!r.ok) throw new Error(r.status);
    applyRole(r.headers.get('x-portafile-role'));
    const s = await r.json();
    syncPulled = true;
    localStorage.setItem(SYNCED_KEY, syncKey); // this link genuinely let us in — makes a later revoke wipe-worthy
    revokeStrikes = 0;                         // a working sync clears any earlier transient 410
    if (validBackup(s) && JSON.stringify({ ...s, tab: 0, ts: 0 }) !== JSON.stringify({ ...S, tab: 0, ts: 0 })) {
      localStorage.setItem(KEY + '.presync', localStorage.getItem(KEY) || ''); // snapshot of what we overwrite — recoverable if a stale device clobbered us
      s.shop.cogsTarget = +s.shop.cogsTarget || 30; s.tab = S.tab;
      S = s; localStorage.setItem(KEY, JSON.stringify(S)); render();
    }
    syncStatus = 'live';
  } catch (e) { syncStatus = 'offline'; }
  syncBadge();
}

/* ---------------- helpers ---------------- */
const $ = (q, root) => (root || document).querySelector(q);
const $$ = (q, root) => [...(root || document).querySelectorAll(q)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* money() lives in i18n.js — Intl gives "$5.00" for en and "5,00 €" for pt, decimal comma included.
   Reducer accumulators below are `sum`, never `t`: `t` is the global translator. */
const ingById = id => S.ingredients.find(i => i.id === id);
const recipeCost = r => r.items.reduce((sum, it) => { const i = ingById(it.ing); return sum + (i ? i.unitCost * it.qty : 0); }, 0);
const cogsPct = r => { const c = recipeCost(r); return r.price > 0 ? c / r.price * 100 : (c > 0 ? Infinity : 0); };
const latestDial = beanId => S.dialins.filter(d => d.beanId === beanId).sort((a, b) => b.ts - a.ts)[0];
const beanById = id => S.beans.find(b => b.id === id);
const ago = ts => { const h = (Date.now() - ts) / 36e5; return h < 1 ? t('just now') : h < 24 ? t('%sh ago', Math.round(h)) : t('%sd ago', Math.round(h / 24)); };
const cogsBadge = r => { const p = Math.round(cogsPct(r)), tgt = S.shop.cogsTarget; return p <= tgt ? 'good' : p <= tgt + 8 ? 'warn' : 'bad'; };
const dialRefText = r => {
  if (!r.bean) return '';
  const b = beanById(r.bean), d = latestDial(r.bean);
  if (!b) return '';
  return d ? t('%s: %sg in → %sg out, %ss (grind %s)', b.name, dec(d.dose), dec(d.yield), dec(d.time), dec(d.grind))
           : t('%s: no dial-in logged yet', b.name);
};

/* ---------------- render root ---------------- */
function render() {
  applyLang(); applyChrome();
  const staff = staffView();
  // The synced state carries the owner's last open tab — never land a staff device on the cost table.
  if (staff && S.tab === 'prices') S.tab = 'recipes';
  $('[data-tab="prices"]').hidden = staff;
  $('#footNote').textContent = staff
    ? t('Staff view — this device shows recipes and dial-ins. Ingredient costs and margins stay with the owner.')
    : syncKey
      ? t('Synced: your shop also has a cloud copy so staff devices share it. Export a backup from Data.')
      : t('Everything lives in this browser. Export a backup from Data.');
  $('#shopName').value = S.shop.name;
  $$('.tab').forEach(b => { const on = b.dataset.tab === S.tab; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
  const v = $('#view');
  if (S.tab === 'recipes') v.innerHTML = viewRecipes();
  else if (S.tab === 'prices') v.innerHTML = viewPrices();
  else if (S.tab === 'dialin') v.innerHTML = viewDialin();
  else if (S.tab === 'training') v.innerHTML = viewTraining();
  else v.innerHTML = viewPrint();
  wireView();
}

/* ---------------- recipes ---------------- */
function viewRecipes() {
  const rs = S.recipes;
  const priced = rs.filter(r => isFinite(cogsPct(r)));
  const avg = priced.length ? priced.reduce((sum, r) => sum + cogsPct(r), 0) / priced.length : 0;
  const over = rs.filter(r => cogsPct(r) > S.shop.cogsTarget);
  const worst = [...rs].sort((a, b) => cogsPct(b) - cogsPct(a))[0];
  const beans = new Set(S.recipes.map(r => r.bean).filter(Boolean)).size;
  return `
  <div class="dash">
    <div class="stat"><div class="k">${t('drinks')}</div><div class="v">${rs.length}</div></div>
    ${staffView() ? `
    <div class="stat"><div class="k">${t('beans on the board')}</div><div class="v">${beans}</div></div>
    <div class="stat"><div class="k">${t('baristas')}</div><div class="v">${S.baristas.length}</div></div>` : `
    <div class="stat"><div class="k">${t('avg cost of goods')}</div><div class="v ${avg > S.shop.cogsTarget ? 'bad' : 'good'}">${num(avg, 1)}%</div></div>
    <div class="stat"><div class="k">${t('over %s% target', S.shop.cogsTarget)}</div><div class="v ${over.length ? 'bad' : 'good'}">${over.length}</div></div>
    ${worst ? `<div class="stat"><div class="k">${t('thinnest margin')}</div><div class="v">${esc(worst.name)}</div><div class="hint">${t('%s cost on %s — %s', money(recipeCost(worst)), money(worst.price), isFinite(cogsPct(worst)) ? cogsPct(worst).toFixed(0) + '%' : t('no menu price'))}</div></div>` : ''}
    <div class="stat"><div class="k">${t('COGS target')}</div><div class="v"><input id="cogsTarget" style="width:64px;font-family:var(--font-mono);font-size:20px;border:none;background:transparent;border-bottom:1px dashed var(--crema)" value="${S.shop.cogsTarget}">%</div></div>`}
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <h2 style="margin:0">${t('Recipe cards')}</h2>
    <button class="btn" id="addRecipe">${t('+ New drink')}</button>
  </div>
  <div class="cardgrid">${rs.map(cardHTML).join('')}</div>`;
}
function cardHTML(r) {
  const cost = recipeCost(r), m = r.price - cost, p = cogsPct(r), staff = staffView();
  // Staff keep the menu price — it is on the menu board anyway — and lose every cost figure.
  return `<article class="rcard" data-id="${esc(r.id)}">
    <header><h3>${esc(r.name)}</h3><span class="cat">${esc(r.cat)} · ${esc(r.size)}</span></header>
    <div class="money">
      <span>${t('menu')} <b>${money(r.price)}</b></span>
      ${staff ? '' : `
      <span>${t('costs you')} <b>${money(cost)}</b></span>
      <span class="badge ${cogsBadge(r)}">${isFinite(p) ? t('%s% COGS', p.toFixed(0)) : t('underwater')}</span>
      <span style="color:var(--spruce)">${t('keeps %s', money(m))}</span>`}
    </div>
    <ul class="ing-list">${r.items.map(it => { const i = ingById(it.ing); return i ? `<li><span>${esc(i.name)} — ${it.qty} ${esc(i.unit)}</span>${staff ? '' : `<span class="c">${money(i.unitCost * it.qty)}</span>`}</li>` : ''; }).join('')}</ul>
    <ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    ${r.bean ? `<div class="dial-ref">⏚ ${esc(dialRefText(r))}</div>` : ''}
    <div class="actions">
      <button class="mini" data-act="edit">${t('Edit')}</button>
      <button class="mini" data-act="dup">${t('Duplicate')}</button>
      <button class="mini danger" data-act="del">${t('Delete')}</button>
    </div>
  </article>`;
}

function recipeForm(r) {
  const isNew = !r;
  r = r || { id: uid(), name: '', cat: t('espresso + milk'), size: t('12 oz'), price: getLang() === 'pt' ? 2.50 : 5.00, items: [], steps: [], bean: null };
  const ingOpts = sel => S.ingredients.map(i => `<option value="${esc(i.id)}" ${sel === i.id ? 'selected' : ''}>${esc(i.name)} (${esc(i.unit)})</option>`).join('');
  const beanOpts = S.beans.map(b => `<option value="${esc(b.id)}" ${r.bean === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('');
  openModal(`
    <h3>${isNew ? t('New drink') : t('Edit — %s', esc(r.name))}</h3>
    <div class="frm">
      <div class="row">
        <div><label>${t('Name')}</label><input id="f_name" value="${esc(r.name)}"></div>
        <div><label>${t('Category')}</label><input id="f_cat" value="${esc(r.cat)}"></div>
      </div>
      <div class="row">
        <div><label>${t('Size')}</label><input id="f_size" value="${esc(r.size)}"></div>
        <div><label>${t('Menu price')} ${currencySymbol()}</label><input id="f_price" type="number" step="0.05" value="${esc(r.price)}"></div>
        <div><label>${t('Espresso bean (for dial-in ref)')}</label><select id="f_bean"><option value="">${t('— none —')}</option>${beanOpts}</select></div>
      </div>
      <div><label>${t('Build (ingredient + quantity)')}</label>
        <div class="ing-rows" id="f_items">${r.items.map(it => `
          <div class="irow"><select>${ingOpts(it.ing)}</select><input type="number" step="0.5" value="${esc(it.qty)}"><button class="mini danger rm">×</button></div>`).join('')}
        </div>
        <button class="linkish" id="f_addItem">${t('+ add ingredient')}</button>
      </div>
      <div><label>${t('Steps (one per line)')}</label><textarea id="f_steps" rows="5">${esc(r.steps.join('\n'))}</textarea></div>
    </div>
    <div class="bar"><button class="ghost" data-close>${t('Cancel')}</button><button class="btn" id="f_save">${t('Save drink')}</button></div>
  `);
  $('#f_addItem').onclick = () => {
    const d = document.createElement('div'); d.className = 'irow';
    d.innerHTML = `<select>${ingOpts()}</select><input type="number" step="0.5" value="1"><button class="mini danger rm">×</button>`;
    $('#f_items').appendChild(d);
  };
  $('#f_items').addEventListener('click', e => { if (e.target.classList.contains('rm')) e.target.parentElement.remove(); });
  $('#f_save').onclick = () => {
    r.name = $('#f_name').value.trim() || t('Untitled');
    r.cat = $('#f_cat').value.trim(); r.size = $('#f_size').value.trim();
    r.price = Math.max(0, parseFloat($('#f_price').value) || 0);
    r.bean = $('#f_bean').value || null;
    r.items = $$('#f_items .irow').map(row => ({ ing: row.querySelector('select').value, qty: parseFloat(row.querySelector('input').value) || 0 })).filter(it => it.qty > 0);
    r.steps = $('#f_steps').value.split('\n').map(s => s.trim()).filter(Boolean);
    if (isNew) S.recipes.push(r);
    save(); closeModal(); render();
  };
}

/* ---------------- prices ---------------- */
function viewPrices() {
  // Belt and braces: render() already keeps staff off this tab and hides the button.
  if (staffView()) return `<h2>${t('Ingredient prices')}</h2><p class="hint">${t("This page is the owner's. Ask them if a build looks wrong.")}</p>`;
  return `
  <h2>${t('Ingredient prices')}</h2>
  <p class="hint">${t("Starter numbers are estimates — put in what you actually pay. Every card re-prices the moment you change a number here. That laminated price list from 2023? This is the version that can't go stale.")}</p>
  <div class="tablewrap"><table class="grid"><thead><tr><th>${t('Ingredient')}</th><th>${t('Unit')}</th><th>${t('Cost / unit')}</th><th>${t('Used in')}</th><th></th></tr></thead>
  <tbody>
    ${S.ingredients.map(i => {
      const uses = S.recipes.filter(r => r.items.some(it => it.ing === i.id));
      return `<tr data-id="${esc(i.id)}">
        <td><input class="wide" data-f="name" value="${esc(i.name)}"></td>
        <td><input style="width:60px" data-f="unit" value="${esc(i.unit)}"></td>
        <td>${currencySymbol()}<input data-f="unitCost" type="number" step="0.0001" value="${esc(i.unitCost)}"></td>
        <td class="uses">${uses.length ? esc(uses.map(r => r.name).join(', ')) : '—'}</td>
        <td><button class="mini danger" data-act="delIng">×</button></td>
      </tr>`;
    }).join('')}
  </tbody></table></div>
  <p><button class="btn" id="addIng">${t('+ Add ingredient')}</button></p>`;
}

/* ---------------- dial-in ---------------- */
function viewDialin() {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
    <h2 style="margin:0">${t('Dial-in board')}</h2>
    <button class="btn" id="addBean">${t('+ Add bean')}</button>
  </div>
  <p class="hint">${t('The morning question — "what\'s the grind today?" — answered without asking. Log every adjustment; the history is your shop\'s memory when that bean comes back next season.')}</p>
  <div class="beans">
    ${S.beans.map(b => {
      const cur = latestDial(b.id);
      const hist = S.dialins.filter(d => d.beanId === b.id).sort((x, y) => y.ts - x.ts).slice(0, 6);
      return `<section class="bean" data-id="${esc(b.id)}">
        <h3>${esc(b.name)}</h3><div class="roaster">${esc(b.roaster)}</div>
        ${cur ? `<div class="dial-now">
          <div class="cell"><div class="num">${esc(dec(cur.grind))}</div><div class="lbl">${t('grind')}</div></div>
          <div class="cell"><div class="num">${esc(dec(cur.dose))}g</div><div class="lbl">${t('dose in')}</div></div>
          <div class="cell"><div class="num">${esc(dec(cur.yield))}g</div><div class="lbl">${t('yield out')}</div></div>
          <div class="cell"><div class="num">${esc(dec(cur.time))}s</div><div class="lbl">${t('time')}</div></div>
        </div><div class="dial-updated">${t('set %s', ago(cur.ts))}${cur.note ? ' — ' + esc(cur.note) : ''}</div>` : `<div class="dial-updated">${t('no dial-in yet — log the first one below')}</div>`}
        <div class="dial-form">
          <input placeholder="${t('grind')}" data-f="grind" value="${cur ? esc(cur.grind) : ''}">
          <input placeholder="${t('dose g')}" data-f="dose" value="${cur ? esc(cur.dose) : ''}">
          <input placeholder="${t('yield g')}" data-f="yield" value="${cur ? esc(cur.yield) : ''}">
          <input placeholder="${t('sec')}" data-f="time" value="${cur ? esc(cur.time) : ''}">
          <input class="note" placeholder="${t('note (optional)')}" data-f="note">
          <button class="btn small" data-act="logDial">${t('Log')}</button>
        </div>
        <table class="dial-hist">${hist.map(d => `<tr><td>${new Date(d.ts).toLocaleDateString(localeTag(), { month: 'short', day: 'numeric' })}</td><td>g${esc(dec(d.grind))}</td><td>${esc(dec(d.dose))}→${esc(dec(d.yield))}g</td><td>${esc(dec(d.time))}s</td><td class="n">${esc(d.note || '')}</td></tr>`).join('')}</table>
        <p><button class="mini danger" data-act="delBean">${t('remove bean')}</button></p>
      </section>`;
    }).join('')}
  </div>`;
}

/* ---------------- training ---------------- */
/* On-screen order is day ascending, then manual order within the day — because the printed pack
   groups by day (viewPrint 'hire') and a screen in raw array order would disagree with the paper
   the moment an owner moves a step to another day. Returns S.path INDICES, never a copy of the
   steps: ↑↓ still swap real array entries, and only within one day (crossing days is the day
   field's job). Nothing here mutates S.path — a synced or legacy shop needs no migration. */
const pathOrder = () => S.path.map((_, i) => i)
  .sort((a, b) => ((S.path[a].day || 0) - (S.path[b].day || 0)) || a - b);

function viewTraining() {
  const recipeOpts = S.recipes.map(r => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');
  const bar = S.baristas.find(b => b.id === S._trainee) || S.baristas[0];
  if (bar) S._trainee = bar.id;
  const so = (bar && S.signoffs[bar.id]) || {};
  const done = S.path.filter(p => so[p.id]).length;
  const staff = staffView(), order = pathOrder();
  return `
  <h2>${t('Training path')}</h2>
  <p class="hint">${t('The new-hire pack, alive. Reorder the path, then track sign-offs per barista. Print it from the Print tab before their first shift.')}</p>
  <div class="train-wrap">
    <div>
      <h3 style="font-family:var(--font-display)">${t('The path')}</h3>
      <ul class="pathlist">
        ${order.map((ix, k) => {
          const p = S.path[ix];
          const label = p.type === 'recipe' ? (S.recipes.find(r => r.id === p.ref)?.name || t('(deleted drink)')) : p.label;
          const firstOfDay = k === 0 || S.path[order[k - 1]].day !== p.day;
          const lastOfDay = k === order.length - 1 || S.path[order[k + 1]].day !== p.day;
          return `<li data-id="${esc(p.id)}">
            ${staff ? `<span class="day">d${esc(p.day)}</span>`
                    : `<label class="day">d<input type="number" min="1" max="9" value="${esc(p.day)}"></label>`}
            <span class="t">${esc(label)}</span>
            ${staff ? '' : `<button class="mini" data-act="up" ${firstOfDay ? 'disabled' : ''}>↑</button>
            <button class="mini" data-act="down" ${lastOfDay ? 'disabled' : ''}>↓</button>
            <button class="mini danger" data-act="rmPath">×</button>`}
            ${staff ? (p.note ? `<div class="note">${esc(p.note)}</div>` : '')
                    : `<input class="note" value="${esc(p.note || '')}" placeholder="${t('Add a description — prints in the pack')}">`}
          </li>`;
        }).join('')}
      </ul>
      ${staff ? `<p class="hint">${t("This path is the owner's. Ask them to change it.")}</p>` : `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        <select id="pAddRecipe"><option value="">${t('+ drink…')}</option>${recipeOpts}</select>
        <input id="pAddSkill" placeholder="${t("+ custom skill, e.g. 'Closing checklist'")}" style="flex:1;min-width:180px;border:1px solid var(--line);border-radius:8px;padding:6px 9px">
        <input id="pAddDay" type="number" min="1" max="9" value="1" style="width:52px;border:1px solid var(--line);border-radius:8px;padding:6px">
        <button class="btn small" id="pAdd">${t('Add')}</button>
      </div>`}
    </div>
    <div>
      <h3 style="font-family:var(--font-display)">${t('Sign-offs')}</h3>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
        <select id="traineeSel">${S.baristas.map(b => `<option value="${esc(b.id)}" ${bar && b.id === bar.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>
        <button class="mini" id="addBarista">${t('+ barista')}</button>
        ${bar ? `<button class="mini danger" id="rmBarista">${t('remove')}</button>` : ''}
      </div>
      ${bar ? `
      <div class="progress"><div style="width:${S.path.length ? done / S.path.length * 100 : 0}%"></div></div>
      <div class="hint">${t('%s/%s signed off', done, S.path.length)}</div>
      <ul class="checklist">
        ${order.map(ix => {
          const p = S.path[ix];
          const label = p.type === 'recipe' ? (S.recipes.find(r => r.id === p.ref)?.name || t('(deleted drink)')) : p.label;
          const d = so[p.id];
          // read-only here on purpose: the trainer needs to see what they are signing off on,
          // but the description is edited in one place only — the path column.
          return `<li><input type="checkbox" data-id="${esc(p.id)}" ${d ? 'checked' : ''}><span>${esc(label)}${p.note ? `<div class="cknote">${esc(p.note)}</div>` : ''}</span>${d ? `<span class="done-date">${esc(d)}</span>` : ''}</li>`;
        }).join('')}
      </ul>` : `<p class="hint">${t('Add a barista to start tracking.')}</p>`}
    </div>
  </div>`;
}

/* ---------------- print ---------------- */
function viewPrint() {
  return `
  <h2>${t('Print packs')}</h2>
  <p class="hint">${t('Paper survives the rush. Print, laminate, tape where the work happens. Cards and the new-hire pack never show your costs — the Margin Report is the owner-only page.')}</p>
  <div class="packs">
    <div class="pack"><h3>${t('Recipe cards')}</h3><p>${t('Every drink as a 4×6-style card: build, steps, current dial-in. Two per page.')}</p><button class="btn" data-pack="cards">${t('Print cards')}</button></div>
    <div class="pack"><h3>${t('Station sheet')}</h3><p>${t('The whole menu on one dense page. Tape it to the low-boy.')}</p><button class="btn" data-pack="station">${t('Print sheet')}</button></div>
    <div class="pack"><h3>${t('New-hire pack')}</h3><p>${t("Cover + training checklist + every card + today's dial-ins. Ready before Monday.")}</p><button class="btn" data-pack="hire">${t('Print pack')}</button></div>
    ${staffView() ? '' : `<div class="pack"><h3>${t('Margin report')}</h3><p>${t('Owner-only: cost, margin and COGS% per drink, flagged against your target.')}</p><button class="btn sub" data-pack="margin">${t('Print report')}</button></div>`}
  </div>`;
}

const pCard = r => `
  <div class="pcard">
    <h3><span>${esc(r.name)}</span><span class="pr">${money(r.price)}</span></h3>
    <div class="meta">${esc(r.cat)} · ${esc(r.size)}</div>
    <ul>${r.items.map(it => { const i = ingById(it.ing); return i ? `<li><span>${esc(i.name)}</span><span>${it.qty} ${esc(i.unit)}</span></li>` : ''; }).join('')}</ul>
    <ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    ${r.bean ? `<div class="dial-ref">⏚ ${t('%s — check the board', esc(dialRefText(r)))}</div>` : ''}
  </div>`;
const pHead = title => `<div class="phead"><span>${esc(S.shop.name)} — ${title}</span><span>crema · ${new Date().toLocaleDateString(localeTag())}</span></div>`;

function buildPrint(kind) {
  const root = $('#printRoot');
  if (kind === 'margin' && staffView()) return; // the button is gone for staff; never build the page either
  if (kind === 'cards') {
    root.innerHTML = pHead(t('recipe cards')) + `<div class="pcards">${S.recipes.map(pCard).join('')}</div>`;
  } else if (kind === 'station') {
    root.innerHTML = pHead(t('station sheet')) + `
      <table class="pstation"><thead><tr><th>${t('Drink')}</th><th>${t('Build')}</th><th>${t('Steps')}</th></tr></thead><tbody>
      ${S.recipes.map(r => `<tr>
        <td><b>${esc(r.name)}</b><br>${esc(r.size)} · ${money(r.price)}</td>
        <td class="m">${r.items.map(it => { const i = ingById(it.ing); return i ? `${it.qty}${esc(i.unit)} ${esc(i.name)}` : ''; }).filter(Boolean).join('<br>')}</td>
        <td>${r.steps.map(esc).join(' → ')}</td>
      </tr>`).join('')}
      </tbody></table>`;
  } else if (kind === 'hire') {
    root.innerHTML = `
      <div class="pcover">
        <div class="big">${t('Welcome to the bar.')}</div>
        <div class="shop">${esc(S.shop.name)}</div>
        <div class="date">${t('Your training pack — printed %s by crema', new Date().toLocaleDateString(localeTag()))}</div>
      </div>
      ${pHead(t('training path'))}
      <div class="pchecklist">
        ${[...new Set(S.path.map(p => p.day))].sort((a, b) => a - b).map(day => `
          <h4>${t('Day %s', day)}</h4>
          ${S.path.filter(p => p.day === day).map(p => {
            const label = p.type === 'recipe' ? (S.recipes.find(r => r.id === p.ref)?.name || '') : p.label;
            return `<div class="ck"><div class="box"></div><div>${esc(label)}${p.note ? `<div class="cknote">${esc(p.note)}</div>` : ''}</div></div>`;
          }).join('')}`).join('')}
      </div>
      <div class="pagebreak"></div>
      ${pHead(t("today's dial-ins"))}
      ${S.beans.map(b => { const d = latestDial(b.id); return d ? `<div class="pdial"><h4>${esc(b.name)} — ${esc(b.roaster)}</h4><div class="nums">${t('grind %s · %sg in → %sg out · %ss', esc(dec(d.grind)), esc(dec(d.dose)), esc(dec(d.yield)), esc(dec(d.time)))}</div></div>` : ''; }).join('')}
      <div class="pagebreak"></div>
      ${pHead(t('recipe cards'))}
      <div class="pcards">${S.recipes.map(pCard).join('')}</div>`;
  } else {
    root.innerHTML = pHead(t('margin report — owner copy')) + `
      <table class="pstation"><thead><tr><th>${t('Drink')}</th><th>${t('Menu')}</th><th>${t('Cost')}</th><th>${t('Keeps')}</th><th>${t('COGS%')}</th><th>${t('vs %s% target', S.shop.cogsTarget)}</th></tr></thead><tbody>
      ${[...S.recipes].sort((a, b) => cogsPct(b) - cogsPct(a)).map(r => {
        const c = recipeCost(r), p = cogsPct(r);
        return `<tr><td><b>${esc(r.name)}</b> ${esc(r.size)}</td><td class="m">${money(r.price)}</td><td class="m">${money(c)}</td><td class="m">${money(r.price - c)}</td><td class="m">${num(p, 1)}%</td><td>${p <= S.shop.cogsTarget ? t('OK') : `<b>${t('OVER — reprice or rebuild')}</b>`}</td></tr>`;
      }).join('')}
      </tbody></table>
      <p style="font-size:8.5pt;color:#666;margin-top:8pt">${t('Ingredient prices as entered on %s. Excludes labor and rent — this is drink-level COGS only.', new Date().toLocaleDateString(localeTag()))}</p>`;
  }
  window.print();
}

/* ---------------- modal & data ---------------- */
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.classList.remove('hidden'); m.onclick = e => { if (e.target === m || e.target.hasAttribute('data-close')) closeModal(); }; }
function closeModal() { $('#modal').classList.add('hidden'); $('#modal').innerHTML = ''; }

function dataMenu() {
  openModal(`
    <h3>${t('Your data')}</h3>
    <p class="hint">${syncKey
      ? t('This shop has a cloud copy so every device on the staff link shares it. Export a JSON backup too — that file is yours and needs no internet.')
      : t('Everything lives in this browser only. Export a JSON backup and keep it with the shop docs; import it on any other machine.')}</p>
    <div class="bar" style="justify-content:flex-start">
      <button class="btn" id="dExport">${t('Export backup')}</button>
      <label class="ghost" style="display:inline-block;padding:8px 14px;border-radius:9px">${t('Import')}<input id="dImport" type="file" accept=".json" style="display:none"></label>
      <button class="ghost danger" id="dReset">${t('Reset to demo')}</button>
    </div>
    ${location.protocol === 'file:' ? '' : `
    <h4 style="margin-top:18px">${t('Sync (share with your staff)')}</h4>
    ${syncKey ? `
      <p class="hint">${t('This device is synced. Anyone who opens this secret link sees and edits the same live data — no account needed:')}</p>
      <p><input id="dSyncLink" readonly value="${esc(location.origin + location.pathname + '?k=' + syncKey)}" style="width:100%"></p>
      <div class="bar" style="justify-content:flex-start">
        <button class="btn" id="dSyncCopy">${t('Copy link')}</button>
        ${localStorage.getItem(OWNER_KEY) && localStorage.getItem(SHOP_KEY) ? `<button class="ghost" id="dSyncRotate">${t('Reset staff link')}</button>` : ''}
        <button class="ghost danger" id="dSyncOff">${t('Turn off sync on this device')}</button>
      </div>
      ${staffView() ? `
      <h4 style="margin-top:18px">${t('Owner?')}</h4>
      <p class="hint">${t('This device is on the staff link, so ingredient costs and margins are hidden. If the shop is yours, paste your owner code to see them here. Find it on the device where you first turned on sync, under Data ▾.')}</p>
      <div class="bar" style="justify-content:flex-start">
        <input id="dOwnerCode" placeholder="${t('owner code')}" style="flex:1;min-width:0;font-family:var(--font-mono)">
        <button class="btn" id="dOwnerUnlock">${t('Unlock')}</button>
      </div>
      <p class="hint" id="dOwnerMsg"></p>` : localStorage.getItem(OWNER_KEY) ? `
      <h4 style="margin-top:18px">${t('Owner code')}</h4>
      <p class="hint">${t('Unlocks the cost pages on your <em>own</em> other devices. Treat it like a key: anyone who has it can also reset the staff link. Never give it to staff.')}</p>
      <p><input id="dOwnerShow" readonly value="${esc(localStorage.getItem(OWNER_KEY))}" style="width:100%;font-family:var(--font-mono)"></p>` : ''}` : `
      <p class="hint">${t("Turn on sync to get a secret link: open it on any phone or laptop and everyone shares the same live data. Your data then also lives in Crema's cloud storage.")}</p>
      <div class="bar" style="justify-content:flex-start"><button class="btn" id="dSyncOn">${t('Turn on sync')}</button></div>`}`}`);
  const syncOn = $('#dSyncOn'); if (syncOn) syncOn.onclick = () => {
    // three independent secrets: durable identity, ownership proof, and the rotatable link
    localStorage.setItem(SHOP_KEY, hex40());
    localStorage.setItem(OWNER_KEY, hex40());
    localStorage.setItem(ROLE_KEY, 'owner'); // this device is creating the shop — it IS the owner
    const k = hex40();
    localStorage.setItem(SYNC_KEY, k);
    location.search = '?k=' + k; // reload with key: sync boot path takes over
  };
  const syncCopy = $('#dSyncCopy'); if (syncCopy) syncCopy.onclick = () => { $('#dSyncLink').select(); navigator.clipboard.writeText($('#dSyncLink').value); syncCopy.textContent = t('Copied!'); };
  const syncRotate = $('#dSyncRotate'); if (syncRotate) syncRotate.onclick = async () => {
    if (!confirm(t('Reset the staff link?\n\nEvery phone and laptop using the old link loses access immediately, and the shop data stored on those devices is erased. Your own device keeps everything. You cannot undo this.'))) return;
    syncRotate.disabled = true;
    try {
      const r = await fetch('/api/state?action=rotate',
        { method: 'POST', headers: { 'x-portafile-owner': localStorage.getItem(OWNER_KEY), 'x-portafile-shop': localStorage.getItem(SHOP_KEY) } });
      if (!r.ok) throw new Error(r.status);
      const { k } = await r.json();
      localStorage.setItem(SYNC_KEY, k); syncKey = k;
      localStorage.setItem(SYNCED_KEY, k); // we own this link; don't let the settle window look like a revoke
      syncRestart(2500);
      history.replaceState(null, '', location.pathname + '?k=' + k);
      dataMenu(); // rebuild the sheet so the link field shows the new key
      alert(t('New staff link created. Every old link has stopped working and those devices have been wiped — share the new link with your staff.'));
    } catch (e) { syncRotate.disabled = false; alert(t('Could not reset the link — check your connection and try again.')); }
  };
  const syncOff = $('#dSyncOff'); if (syncOff) syncOff.onclick = () => { localStorage.removeItem(SYNC_KEY); localStorage.removeItem(ROLE_KEY); location.search = ''; };
  /* Owner on a second device. The pasted code is checked by the SERVER before we store it, so a
     staff member typing 40 random characters gets nothing — the role header still says 'staff'. */
  const unlock = $('#dOwnerUnlock'); if (unlock) unlock.onclick = async () => {
    const code = $('#dOwnerCode').value.trim(), msg = $('#dOwnerMsg');
    if (!/^[a-f0-9]{40}$/.test(code)) { msg.textContent = t('That does not look like an owner code.'); return; }
    unlock.disabled = true; msg.textContent = t('Checking…');
    try {
      const r = await fetch('/api/state?k=' + syncKey, { headers: { 'x-portafile-owner': code } });
      if (r.ok && r.headers.get('x-portafile-role') === 'owner') {
        localStorage.setItem(OWNER_KEY, code); // only ever stored after the server agreed
        localStorage.setItem(ROLE_KEY, 'owner');
        closeModal(); render();
      } else { msg.textContent = t("That is not this shop's owner code."); unlock.disabled = false; }
    } catch (e) { msg.textContent = t('Could not check right now — try again when you have signal.'); unlock.disabled = false; }
  };
  $('#dExport').onclick = () => {
    // Hiding costs on screen is pointless if a staff device can export the cost sheet to a file.
    const out = staffView() ? { ...S, ingredients: S.ingredients.map(i => ({ ...i, unitCost: 0 })) } : S;
    const blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `crema-${S.shop.name.replace(/\W+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  };
  $('#dImport').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(txt => {
      try {
        const s = JSON.parse(txt);
        if (!validBackup(s)) throw new Error(t('not a crema backup'));
        s.shop.cogsTarget = +s.shop.cogsTarget || 30; s.tab = s.tab || 'recipes';
        const prev = S;
        try { S = s; render(); }
        catch (err) { S = prev; render(); throw new Error(t('backup is damaged: %s', err.message)); }
        save(); closeModal();
      } catch (err) { alert(t('Could not import: %s', err.message)); }
    });
  };
  // Reseeds in the CURRENT language: a Lisbon owner who resets gets the Portuguese demo back, not the American one.
  $('#dReset').onclick = () => { if (confirm(t('Replace everything with the demo shop?'))) { S = seed(getLang()); save(); closeModal(); render(); } };
}

function helpModal() {
  openModal(`
    <h3>${t('How Crema works')}</h3>
    <div class="helpbody">
      <h4>${t('Recipes')}</h4><p>${t('Every card shows what the drink <em>costs you</em> next to its menu price. The badge goes red when cost-of-goods passes your target (set it on the dashboard). Espresso drinks carry the live dial-in for their bean.')}</p>
      <h4>${t('Prices')}</h4><p>${t("One table of what you pay. Change a number → every card re-prices. When milk or beans jump, you'll see which drinks went underwater the same minute.")}</p>
      <h4>${t('Dial-in')}</h4><p>${t('Log grind/dose/yield/time per bean. The newest entry is "the board" — it appears on cards and print packs. History stays forever.')}</p>
      <h4>${t('Training')}</h4><p>${t('Order the path (drinks + custom skills, grouped by day), pick a barista, tick sign-offs. Progress is saved per barista.')}</p>
      <h4>${t('Print')}</h4><p>${t('Cards and the new-hire pack hide costs on purpose — they get taped where customers can see. The margin report is the owner-only page.')}</p>
      <h4>${t('Your data')}</h4><p>${t("Lives in this browser (localStorage). <strong>Data → Export backup</strong> before switching machines. No account, no bill. If you turn on <strong>Sync</strong> (Data menu), your data also lives in Crema's cloud storage so staff phones share it via a secret link.")}</p>
      <h4>${t('Staff view')}</h4><p>${t("Devices that join through the staff link see recipes, dial-ins and training — never ingredient costs, margins or the price table. Those stay on the owner's devices (the ones holding the owner code, under Data ▾).")}</p>
    </div>
    <div class="bar">${location.protocol === 'file:' ? '' : `<button class="ghost" id="hFeedback">${t('Send feedback')}</button>`}<button class="btn" data-close>${t('Got it')}</button></div>`);
  const fb = $('#hFeedback'); if (fb) fb.onclick = feedbackModal;
}

/* Feedback goes to /api/metrics as its own record. Deliberately carries NOTHING from the shop —
   no recipes, no prices, no shopId — only what the person typed. */
function feedbackModal() {
  openModal(`
    <h3>${t("How's Crema working?")}</h3>
    <p class="hint">${t('This goes straight to the person who builds it. Nothing from your recipes, prices or staff list is attached — only what you write here.')}</p>
    <div class="bar" style="justify-content:flex-start">
      <button class="ghost" id="fbUp" aria-pressed="false">${t('👍 Working well')}</button>
      <button class="ghost" id="fbDown" aria-pressed="false">${t("👎 Something's wrong")}</button>
    </div>
    <label>${t('What happened?')} <em>${t('(optional)')}</em><textarea id="fbMsg" rows="4" style="width:100%"></textarea></label>
    <label>${t('Email, if you want a reply')} <em>${t('(optional)')}</em><input id="fbEmail" type="email" style="width:100%"></label>
    <input id="fbHp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
    <p class="hint" id="fbOut"></p>
    <div class="bar"><button class="ghost" data-close>${t('Cancel')}</button><button class="btn" id="fbSend">${t('Send')}</button></div>`);
  let sentiment = '';
  const up = $('#fbUp'), down = $('#fbDown'), out = $('#fbOut'), send = $('#fbSend');
  const pick = v => () => {
    sentiment = v;
    up.setAttribute('aria-pressed', String(v === 'up')); down.setAttribute('aria-pressed', String(v === 'down'));
    up.classList.toggle('btn', v === 'up'); down.classList.toggle('btn', v === 'down');
    out.textContent = '';
  };
  up.onclick = pick('up'); down.onclick = pick('down');
  send.onclick = async () => {
    if (!sentiment) { out.textContent = t('Pick 👍 or 👎 first.'); return; }
    send.disabled = true; out.textContent = t('Sending…');
    try {
      const r = await fetch('/api/metrics', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sentiment, msg: $('#fbMsg').value, email: $('#fbEmail').value, role: staffView() ? 'staff' : 'owner', hp: $('#fbHp').value }),
      });
      if (!r.ok) throw new Error(r.status);
      out.textContent = t('Thanks — got it.');
      setTimeout(closeModal, 900);
    } catch (e) { send.disabled = false; out.textContent = t('Could not send — try again when you have signal.'); }
  };
}

/* ---------------- wiring ---------------- */
function wireView() {
  // recipes
  const add = $('#addRecipe'); if (add) add.onclick = () => recipeForm(null);
  const ct = $('#cogsTarget'); if (ct) ct.onchange = () => { S.shop.cogsTarget = Math.min(95, Math.max(5, parseFloat(ct.value) || 30)); save(); render(); };
  $$('.rcard [data-act]').forEach(b => b.onclick = () => {
    const id = b.closest('.rcard').dataset.id, r = S.recipes.find(x => x.id === id);
    if (b.dataset.act === 'edit') recipeForm(r);
    if (b.dataset.act === 'dup') { const c = JSON.parse(JSON.stringify(r)); c.id = uid(); c.name = t('%s (copy)', r.name); S.recipes.push(c); save(); render(); }
    if (b.dataset.act === 'del' && confirm(t('Delete "%s"?', r.name))) {
      S.recipes = S.recipes.filter(x => x.id !== id);
      S.path = S.path.filter(p => !(p.type === 'recipe' && p.ref === id));
      save(); render();
    }
  });
  // prices
  const ai = $('#addIng'); if (ai) ai.onclick = () => { S.ingredients.push({ id: uid(), name: t('New ingredient'), unit: t('each'), unitCost: 0 }); save(); render(); };
  $$('table.grid tr[data-id]').forEach(tr => {
    const ing = S.ingredients.find(i => i.id === tr.dataset.id);
    $$('input[data-f]', tr).forEach(inp => inp.onchange = () => {
      ing[inp.dataset.f] = inp.dataset.f === 'unitCost' ? Math.max(0, parseFloat(inp.value) || 0) : inp.value.trim();
      save(); render();
    });
    const del = $('[data-act=delIng]', tr); if (del) del.onclick = () => {
      const uses = S.recipes.filter(r => r.items.some(it => it.ing === ing.id));
      if (uses.length) return alert(t("Can't delete — used in: %s. Remove it from those drinks first.", uses.map(r => r.name).join(', ')));
      S.ingredients = S.ingredients.filter(i => i.id !== ing.id); save(); render();
    };
  });
  // dial-in
  const ab = $('#addBean'); if (ab) ab.onclick = () => {
    openModal(`<h3>${t('New bean')}</h3><div class="frm">
      <div><label>${t('Bean name')}</label><input id="b_name" placeholder="${t('e.g. Colombia Huila decaf')}"></div>
      <div><label>${t('Roaster')}</label><input id="b_roaster" placeholder="${t('who roasts it')}"></div></div>
      <div class="bar"><button class="ghost" data-close>${t('Cancel')}</button><button class="btn" id="b_save">${t('Add bean')}</button></div>`);
    $('#b_save').onclick = () => { S.beans.push({ id: uid(), name: $('#b_name').value.trim() || t('New bean'), roaster: $('#b_roaster').value.trim() }); save(); closeModal(); render(); };
  };
  $$('.bean').forEach(sec => {
    const beanId = sec.dataset.id;
    const log = $('[data-act=logDial]', sec); if (log) log.onclick = () => {
      const g = f => parseFloat($(`[data-f=${f}]`, sec).value);
      const entry = { id: uid(), beanId, ts: Date.now(), grind: g('grind'), dose: g('dose'), yield: g('yield'), time: g('time'), note: $('[data-f=note]', sec).value.trim() };
      if ([entry.grind, entry.dose, entry.yield, entry.time].some(v => isNaN(v))) return alert(t('Grind, dose, yield and time all need numbers.'));
      S.dialins.push(entry); save(); render();
    };
    const del = $('[data-act=delBean]', sec); if (del) del.onclick = () => {
      const used = S.recipes.filter(r => r.bean === beanId);
      if (used.length) return alert(t('This bean is on: %s. Point those drinks at another bean first.', used.map(r => r.name).join(', ')));
      if (confirm(t('Remove bean and its dial-in history?'))) { S.beans = S.beans.filter(b => b.id !== beanId); S.dialins = S.dialins.filter(d => d.beanId !== beanId); save(); render(); }
    };
  });
  // training
  const pAdd = $('#pAdd'); if (pAdd) pAdd.onclick = () => {
    const day = Math.max(1, parseInt($('#pAddDay').value) || 1);
    const rid = $('#pAddRecipe').value, skill = $('#pAddSkill').value.trim();
    if (rid) S.path.push({ id: uid(), type: 'recipe', ref: rid, day });
    if (skill) S.path.push({ id: uid(), type: 'skill', label: skill, day });
    if (rid || skill) { save(); render(); }
  };
  $$('.pathlist [data-act]').forEach(b => b.onclick = () => {
    const id = b.closest('li').dataset.id, ix = S.path.findIndex(p => p.id === id);
    if (ix < 0) return;
    if (b.dataset.act === 'rmPath') S.path.splice(ix, 1);
    else {
      // ↑↓ swap with the neighbour in DISPLAY order, and only inside the same day — the buttons are
      // already disabled at a day boundary, this re-checks it so a stale DOM cannot reorder blindly.
      const o = pathOrder(), j = o[o.indexOf(ix) + (b.dataset.act === 'down' ? 1 : -1)];
      if (j === undefined || S.path[j].day !== S.path[ix].day) return;
      [S.path[ix], S.path[j]] = [S.path[j], S.path[ix]];
    }
    save(); render();
  });
  // step descriptions: save on blur only — a re-render here would steal focus mid-sentence,
  // and nothing else on this view reads p.note (the print pack builds from S on demand).
  $$('.pathlist input.note').forEach(inp => inp.onchange = () => {
    const p = S.path.find(x => x.id === inp.closest('li').dataset.id);
    if (!p) return;
    p.note = inp.value.trim(); save();
    /* The Sign-offs column beside this one shows the same text, so it can no longer be left stale —
       but re-rendering would drop focus when the owner tabs from one description to the next.
       Patch that single cell instead. textContent, never innerHTML: this is the owner's own typing. */
    const cell = $(`.checklist input[data-id="${p.id}"]`)?.nextElementSibling;
    if (!cell) return;
    let n = cell.querySelector('.cknote');
    if (!p.note) { if (n) n.remove(); return; }
    if (!n) { n = document.createElement('div'); n.className = 'cknote'; cell.appendChild(n); }
    n.textContent = p.note;
  });
  // the day badge is editable: changing it re-sorts the list, so this one DOES re-render.
  $$('.pathlist .day input').forEach(inp => inp.onchange = () => {
    const p = S.path.find(x => x.id === inp.closest('li').dataset.id);
    if (!p) return;
    p.day = Math.min(9, Math.max(1, parseInt(inp.value) || 1));
    save(); render();
  });
  const ts = $('#traineeSel'); if (ts) ts.onchange = () => { S._trainee = ts.value; save(); render(); };
  const abar = $('#addBarista'); if (abar) abar.onclick = () => {
    const name = prompt(t('Barista name:')); if (!name) return;
    const b = { id: uid(), name: name.trim() }; S.baristas.push(b); S._trainee = b.id; save(); render();
  };
  const rbar = $('#rmBarista'); if (rbar) rbar.onclick = () => {
    const b = S.baristas.find(x => x.id === S._trainee); if (!b) return;
    if (confirm(t('Remove %s and their sign-offs?', b.name))) { S.baristas = S.baristas.filter(x => x.id !== b.id); delete S.signoffs[b.id]; S._trainee = null; save(); render(); }
  };
  $$('.checklist input[type=checkbox]').forEach(cb => cb.onchange = () => {
    const bid = S._trainee; if (!bid) return;
    S.signoffs[bid] = S.signoffs[bid] || {};
    if (cb.checked) S.signoffs[bid][cb.dataset.id] = new Date().toLocaleDateString(localeTag());
    else delete S.signoffs[bid][cb.dataset.id];
    save(); render();
  });
  // print
  $$('[data-pack]').forEach(b => b.onclick = () => buildPrint(b.dataset.pack));
}

/* top chrome */
$$('.tab').forEach(b => b.onclick = () => { S.tab = b.dataset.tab; save(); render(); });
document.querySelector('.tabs').addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const tabs = $$('.tab'), i = tabs.findIndex(x => x.dataset.tab === S.tab);
  const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
  S.tab = next.dataset.tab; save(); render(); next.focus();
});
$('#shopName').addEventListener('change', () => { S.shop.name = $('#shopName').value.trim() || 'My shop'; save(); render(); });
$('#btnData').onclick = dataMenu;
$('#btnHelp').onclick = helpModal;
/* Language is part of the shop, not the device: it syncs, so the owner sets it once and the
   staff phones follow. Switching does NOT retranslate existing recipes — those are the shop's
   own words. "Reset to demo" reseeds in the new language for anyone who wants that.

   The ONE exception is a shop still sitting on the untouched demo seed: leaving an American menu
   priced in euros behind a Portuguese interface reads as broken, and there is nothing of the
   owner's to protect yet. `demoSig` is a content fingerprint with ids and timestamps left out
   (they are random per seed() call, so a plain stringify never matches — see the uid() trap in
   CLAUDE.md). Deliberately STRICTER than matchesADemoSeed in api/metrics.js: that one only
   classifies a shop for the founder dashboard, where being wrong skews a number. This one
   REPLACES data, so a single logged dial-in, renamed barista or edited price must veto the swap. */
const demoSig = (s) => {
  // item.ing is a random uid, so it can never match a fresh seed(): fingerprint the ingredient's
  // NAME instead. Without this, swapping a latte's whole milk for oat milk at the same qty left
  // the signature identical and a language switch silently threw that edit away.
  const N = {}; (s.ingredients || []).forEach(i => { N[i.id] = i.name; });
  return JSON.stringify([
  s.shop && s.shop.name, s.shop && s.shop.cogsTarget,
  (s.ingredients || []).map(i => [i.name, i.unit, i.unitCost]),
  (s.recipes || []).map(r => [r.name, r.cat, r.size, r.price, r.steps, (r.items || []).map(x => [N[x.ing], x.qty])]),
  (s.beans || []).map(b => [b.name, b.roaster]),
  (s.dialins || []).map(d => [d.grind, d.dose, d.yield, d.time, d.note]),
  (s.baristas || []).map(b => b.name),
  (s.path || []).map(p => [p.type, p.label, p.day, p.note]),
  Object.keys(s.signoffs || {}).length,
  ]);
};
const pristineDemo = (lang) => demoSig(S) === demoSig(seed(lang));

const langSel = $('#langSel');
if (langSel) langSel.onchange = () => {
  const from = getLang(), to = langSel.value === 'pt' ? 'pt' : 'en';
  if (to === from) return;
  const swap = pristineDemo(from); // decide BEFORE anything is mutated
  S.shop.lang = to;
  if (swap) { const tab = S.tab; S = seed(to); S.tab = tab; } // keep them on the tab they were reading
  save(); render();
};

/* ---------------- self-test (?selftest=1) ---------------- */
function selftest() {
  // `sd`, not `t` — `t` is the global translator and a local would shadow it.
  const sd = seed('en'); const fails = []; let total = 0;
  const ok = (name, cond) => { total++; if (!cond) fails.push(name); };
  const latte = sd.recipes.find(r => r.name === 'Latte');
  const beansIng = sd.ingredients.find(i => i.name === 'Espresso beans');
  const milk = sd.ingredients.find(i => i.name === 'Whole milk');
  const cup = sd.ingredients.find(i => i.name === '12oz hot cup + lid + sleeve');
  const expected = 18 * beansIng.unitCost + 9 * milk.unitCost + 1 * cup.unitCost;
  const cost = latte.items.reduce((s, it) => { const i = sd.ingredients.find(x => x.id === it.ing); return s + i.unitCost * it.qty; }, 0);
  ok('latte cost math', Math.abs(cost - expected) < 1e-9);
  ok('latte cost ≈ $1.22', Math.abs(cost - 1.218) < 0.01);
  ok('cogs% sane', cost / latte.price * 100 > 15 && cost / latte.price * 100 < 40);
  const hb = sd.beans[0]; const lat = sd.dialins.filter(d => d.beanId === hb.id).sort((a, b) => b.ts - a.ts)[0];
  ok('latest dial-in picks newest', lat.note === 'humid morning');
  /* Both seeds must be internally consistent. A recipe naming an ingredient that is not in the
     ingredients list gets item.ing === undefined, and then the drink silently costs nothing —
     the single most likely way to break a hand-written seed. */
  ['en', 'pt'].forEach(L => {
    const s = seed(L);
    ok(L + ': shop tagged with its language', s.shop.lang === L);
    ok(L + ': every recipe item resolves', s.recipes.every(r => r.items.length > 0
      && r.items.every(it => it.ing && s.ingredients.some(i => i.id === it.ing))));
    ok(L + ': every path recipe resolves', s.path.every(p => p.type !== 'recipe' || s.recipes.some(r => r.id === p.ref)));
    ok(L + ': every drink priced and has steps', s.recipes.every(r => r.price > 0 && r.steps.length > 0));
    ok(L + ': every ingredient costed', s.ingredients.every(i => i.unitCost > 0 && i.unit));
  });
  /* Scan the words a human wrote, NOT JSON.stringify(seed) — that includes the random uid()s, and
     a base-36 id ending in a digit + "oz" (e.g. "yykz6oz") matches \d\s*oz\b against the closing
     quote. Measured: a ~1% false failure every selftest run, which is exactly the kind of flake
     that trains you to ignore a red suite. */
  const words = s => [s.shop.name,
    ...s.ingredients.map(i => `${i.name} ${i.unit}`),
    ...s.recipes.flatMap(r => [r.name, r.cat, r.size, ...r.steps]),
    ...s.beans.map(b => `${b.name} ${b.roaster}`),
    ...s.dialins.map(d => String(d.note || '')),
    ...s.path.map(p => p.label || '')].join(' ');
  ok('pt seed carries no imperial units', !/\d\s*(fl\s*oz|oz)\b|°F/.test(words(seed('pt'))));
  ok('en seed is still imperial', /°F/.test(words(seed('en'))));
  setLang('pt'); ok('pt money is euro with decimal comma', money(1.5).includes('€') && money(1.5).includes('1,50'));
  setLang('en'); ok('en money is dollar', money(1.5) === '$1.50');
  ok('pt translates, en falls through', (setLang('pt'), t('Recipes') === 'Receitas') && (setLang('en'), t('Recipes') === 'Recipes'));
  // via a variable, so verify-i18n.mjs doesn't read this negative test as a missing translation
  const UNKNOWN = 'a string nobody translated';
  ok('unknown key falls back to english', (setLang('pt'), t(UNKNOWN) === UNKNOWN));
  ok('context suffix stripped in fallback', (setLang('en'), t('Roaster|role') === 'Roaster'));
  applyLang(); // leave the app on whatever language the shop actually uses
  ok('esc() escapes html', esc('<b a="x">') === '&lt;b a=&quot;x&quot;&gt;');
  ok('live: every recipe item resolves', S.recipes.every(r => r.items.every(it => S.ingredients.some(i => i.id === it.ing))));
  ok('live: every path recipe resolves', S.path.every(p => p.type !== 'recipe' || S.recipes.some(r => r.id === p.ref)));
  ok('live: state is a valid backup shape', validBackup(S));
  ok('import validator rejects keyless JSON', !validBackup({ recipes: [], ingredients: [] }));
  const payIng = S.ingredients.find(i => i.unitCost > 0);
  ok('unpriced drink flags underwater', !payIng || cogsBadge({ price: 0, items: [{ ing: payIng.id, qty: 1 }] }) === 'bad');
  const d = document.createElement('div');
  d.className = 'selftest' + (fails.length ? ' fail' : '');
  d.textContent = fails.length ? `SELFTEST FAIL: ${fails.join(', ')}` : `SELFTEST PASS (${total} checks)`;
  document.body.appendChild(d);
  console.log('[crema selftest]', fails.length ? fails : 'all pass');
}

/* ---------------- access gate (fill once, remembered) ---------------- */
const LEAD_KEY = 'portafile.v1.lead';
function gate() {
  // ponytail: skip for file:// (offline copy has no API), automated browsers (test suites/bots
  // would only donate fake emails), and anyone who already filled it in this browser.
  // ALSO skip anyone arriving on a staff link (?k=): that link only exists because an owner already
  // signed up and handed it out, so the lead is captured — asking the barista to name a shop reads
  // as "make an account", which is what made sharing look broken. Staff go straight to the recipes.
  if (location.protocol === 'file:' || navigator.webdriver || localStorage.getItem(LEAD_KEY) || syncKey) return;
  const g = document.createElement('div'); g.className = 'gatewrap';
  /* Role <option> VALUES stay English on purpose: they are submitted to /api/lead and counted in
     the founder's metrics. Translating the value would split "Owner" and "Proprietário" into two
     buckets; only the label the person reads is translated. */
  g.innerHTML = `<form class="sheet gate">
    <h3>${t('Before you brew…')}</h3>
    <p class="hint">${t("Crema is free. Tell us who's using it so we know which shops to build for — and so we can help if something breaks.")}</p>
    <label>${t('Email')} *<input name="email" type="email" required autocomplete="email"></label>
    <label>${t('Shop name')} *<input name="shop" required placeholder="${t('e.g. Northside Espresso')}"></label>
    <label>${t('Your role')}<select name="role"><option value="">—</option><option value="Owner">${t('Owner')}</option><option value="Manager">${t('Manager')}</option><option value="Barista">${t('Barista')}</option><option value="Roaster">${t('Roaster|role')}</option><option value="Just curious">${t('Just curious')}</option></select></label>
    <label>${t('City / country')}<input name="city" autocomplete="address-level2"></label>
    <label>${t('Phone (optional)')}<input name="phone" type="tel" autocomplete="tel"></label>
    <input name="hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
    <div class="bar" style="justify-content:flex-end"><button class="btn" type="submit">${t('Open Crema')}</button></div>
    <p class="hint">${t('No password, no verification email — this browser stays unlocked.')} <a href="${getLang() === 'pt' ? '/site/pt/privacy.html' : '/site/privacy.html'}" target="_blank" rel="noopener">${t('How we handle your details')}</a></p>
  </form>`;
  document.body.appendChild(g);
  g.querySelector('form').onsubmit = ev => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const lead = Object.fromEntries(['email', 'shop', 'role', 'city', 'phone'].map(k => [k, String(f.get(k) || '').trim()]));
    if (!lead.email || !lead.shop) return;
    localStorage.setItem(LEAD_KEY, JSON.stringify(lead)); // unlock first — never hold the door on a network hiccup
    // honeypot value rides along in the POST only (never stored in LEAD_KEY, so the retry path stays clean)
    fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...lead, hp: String(f.get('hp') || '') }) })
      .then(r => { if (r.ok) localStorage.setItem(LEAD_KEY + '.sent', '1'); }).catch(() => {});
    g.remove();
  };
}
// retry a lead that never reached the server (was offline / API down at signup time)
if (localStorage.getItem(LEAD_KEY) && !localStorage.getItem(LEAD_KEY + '.sent') && location.protocol !== 'file:' && !navigator.webdriver)
  fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: localStorage.getItem(LEAD_KEY) })
    .then(r => { if (r.ok) localStorage.setItem(LEAD_KEY + '.sent', '1'); }).catch(() => {});

// once this browser owns a shop, tie its signup lead to the shopId (one re-POST, ever) —
// this is the only record of which signup owns which cloud data; unreconstructable later
if (localStorage.getItem(SHOP_KEY) && localStorage.getItem(LEAD_KEY) && !localStorage.getItem(LEAD_KEY + '.linked') && location.protocol !== 'file:' && !navigator.webdriver)
  fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...JSON.parse(localStorage.getItem(LEAD_KEY)), shopId: localStorage.getItem(SHOP_KEY) }) })
    .then(r => { if (r.ok) localStorage.setItem(LEAD_KEY + '.linked', '1'); }).catch(() => {});

navigator.storage?.persist?.()?.catch(() => {}); // best-effort: ask the browser not to evict localStorage (Safari/Chrome purge unused sites' storage)

// A device whose link was killed stays locked across reloads. Opening a DIFFERENT link clears the
// lock and gets a fresh chance — that's how a re-hired barista comes back with the new link.
const lockedKey = localStorage.getItem(LOCK_KEY);
if (lockedKey && (!syncKey || syncKey === lockedKey)) { locked = true; lockScreen(); }
else {
  if (lockedKey) localStorage.removeItem(LOCK_KEY);
  render();
  gate();
  if (syncKey) { syncPull(); syncPollT = setInterval(syncPull, POLL_MS); syncBadge(); }
  /* Browsers throttle and eventually freeze timers in a background tab, so the POLL_MS timer is
     not a promise — a deleted shop or a dead link could sit unnoticed for minutes behind another
     tab. These two listeners, not the timer, are what makes sync feel live (see POLL_MS).
     Re-check whenever the tab is looked at again, and when the network comes back. syncPull()
     already no-ops without a key or on a locked device. Skipped while a save is still debounced:
     that PUT is about to run, it gets the same 410, and pulling first could apply older cloud
     state over the edit the user just made. */
  const syncRecheck = () => { if (!syncPushT) syncPull(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncRecheck(); });
  window.addEventListener('online', syncRecheck);
  if (location.search.includes('selftest=1')) selftest();
}

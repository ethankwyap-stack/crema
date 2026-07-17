/* Portafile v1 — local-first. All data in localStorage; nothing leaves the browser. */
'use strict';

/* ---------------- state ---------------- */
const KEY = 'portafile.v1';
const uid = () => Math.random().toString(36).slice(2, 9);

function seed() {
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
    shop: { name: 'Demo Espresso Bar', cogsTarget: 30 },
    ingredients, recipes, beans, dialins, baristas, path,
    signoffs: {}, tab: 'recipes',
  };
}

let S = load();
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
  const s = seed(); localStorage.setItem(KEY, JSON.stringify(s)); return s;
}
const save = () => { localStorage.setItem(KEY, JSON.stringify(S)); syncPush(); };

/* ---------------- sync (opt-in secret link, ?k=…) ---------------- */
/* Off by default: with no key the app is pure-local, byte-identical to v1 behavior.
   ponytail: last-write-wins, no merging — local backup + Export remain the safety net. */
const SYNC_KEY = 'portafile.v1.synckey';
const syncKey = (() => {
  const m = location.search.match(/[?&]k=([a-f0-9]{40})\b/);
  if (m) { localStorage.setItem(SYNC_KEY, m[1]); return m[1]; }
  return localStorage.getItem(SYNC_KEY) || '';
})();
let syncStatus = syncKey ? 'connecting' : '';
function syncBadge() {
  let el = document.getElementById('syncBadge');
  if (!syncKey) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'syncBadge'; document.body.appendChild(el); }
  el.className = 'syncbadge ' + syncStatus;
  el.textContent = { connecting: 'sync…', live: 'synced', offline: 'sync offline — working locally' }[syncStatus] || '';
}
let syncPushT;
function syncPush() {
  if (!syncKey) return;
  clearTimeout(syncPushT);
  syncPushT = setTimeout(async () => {
    try {
      const r = await fetch('/api/state?k=' + syncKey, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(S) });
      syncStatus = r.ok ? 'live' : 'offline';
    } catch (e) { syncStatus = 'offline'; }
    syncBadge();
  }, 800);
}
async function syncPull() {
  if (!syncKey) return;
  try {
    const r = await fetch('/api/state?k=' + syncKey);
    if (r.status === 404) { syncStatus = 'live'; syncPush(); syncBadge(); return; } // first device: seed the cloud
    if (!r.ok) throw new Error(r.status);
    const s = await r.json();
    if (validBackup(s) && JSON.stringify({ ...s, tab: 0 }) !== JSON.stringify({ ...S, tab: 0 })) {
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
const money = n => '$' + (Math.round(n * 100) / 100).toFixed(2);
const ingById = id => S.ingredients.find(i => i.id === id);
const recipeCost = r => r.items.reduce((t, it) => { const i = ingById(it.ing); return t + (i ? i.unitCost * it.qty : 0); }, 0);
const cogsPct = r => { const c = recipeCost(r); return r.price > 0 ? c / r.price * 100 : (c > 0 ? Infinity : 0); };
const latestDial = beanId => S.dialins.filter(d => d.beanId === beanId).sort((a, b) => b.ts - a.ts)[0];
const beanById = id => S.beans.find(b => b.id === id);
const ago = ts => { const h = (Date.now() - ts) / 36e5; return h < 1 ? 'just now' : h < 24 ? Math.round(h) + 'h ago' : Math.round(h / 24) + 'd ago'; };
const cogsBadge = r => { const p = Math.round(cogsPct(r)), t = S.shop.cogsTarget; return p <= t ? 'good' : p <= t + 8 ? 'warn' : 'bad'; };
const dialRefText = r => {
  if (!r.bean) return '';
  const b = beanById(r.bean), d = latestDial(r.bean);
  if (!b) return '';
  return d ? `${b.name}: ${d.dose}g in → ${d.yield}g out, ${d.time}s (grind ${d.grind})`
           : `${b.name}: no dial-in logged yet`;
};

/* ---------------- render root ---------------- */
function render() {
  $('#shopName').value = S.shop.name;
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === S.tab));
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
  const avg = priced.length ? priced.reduce((t, r) => t + cogsPct(r), 0) / priced.length : 0;
  const over = rs.filter(r => cogsPct(r) > S.shop.cogsTarget);
  const worst = [...rs].sort((a, b) => cogsPct(b) - cogsPct(a))[0];
  return `
  <div class="dash">
    <div class="stat"><div class="k">drinks</div><div class="v">${rs.length}</div></div>
    <div class="stat"><div class="k">avg cost of goods</div><div class="v ${avg > S.shop.cogsTarget ? 'bad' : 'good'}">${avg.toFixed(1)}%</div></div>
    <div class="stat"><div class="k">over ${S.shop.cogsTarget}% target</div><div class="v ${over.length ? 'bad' : 'good'}">${over.length}</div></div>
    ${worst ? `<div class="stat"><div class="k">thinnest margin</div><div class="v">${esc(worst.name)}</div><div class="hint">${money(recipeCost(worst))} cost on ${money(worst.price)} — ${isFinite(cogsPct(worst)) ? cogsPct(worst).toFixed(0) + '%' : 'no menu price'}</div></div>` : ''}
    <div class="stat"><div class="k">COGS target</div><div class="v"><input id="cogsTarget" style="width:64px;font-family:var(--font-mono);font-size:20px;border:none;background:transparent;border-bottom:1px dashed var(--crema)" value="${S.shop.cogsTarget}">%</div></div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <h2 style="margin:0">Recipe cards</h2>
    <button class="btn" id="addRecipe">+ New drink</button>
  </div>
  <div class="cardgrid">${rs.map(cardHTML).join('')}</div>`;
}
function cardHTML(r) {
  const cost = recipeCost(r), m = r.price - cost, p = cogsPct(r);
  return `<article class="rcard" data-id="${esc(r.id)}">
    <header><h3>${esc(r.name)}</h3><span class="cat">${esc(r.cat)} · ${esc(r.size)}</span></header>
    <div class="money">
      <span>menu <b>${money(r.price)}</b></span>
      <span>costs you <b>${money(cost)}</b></span>
      <span class="badge ${cogsBadge(r)}">${isFinite(p) ? p.toFixed(0) + '% COGS' : 'underwater'}</span>
      <span style="color:var(--spruce)">keeps ${money(m)}</span>
    </div>
    <ul class="ing-list">${r.items.map(it => { const i = ingById(it.ing); return i ? `<li><span>${esc(i.name)} — ${it.qty} ${esc(i.unit)}</span><span class="c">${money(i.unitCost * it.qty)}</span></li>` : ''; }).join('')}</ul>
    <ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    ${r.bean ? `<div class="dial-ref">⏚ ${esc(dialRefText(r))}</div>` : ''}
    <div class="actions">
      <button class="mini" data-act="edit">Edit</button>
      <button class="mini" data-act="dup">Duplicate</button>
      <button class="mini danger" data-act="del">Delete</button>
    </div>
  </article>`;
}

function recipeForm(r) {
  const isNew = !r;
  r = r || { id: uid(), name: '', cat: 'espresso + milk', size: '12 oz', price: 5.00, items: [], steps: [], bean: null };
  const ingOpts = sel => S.ingredients.map(i => `<option value="${esc(i.id)}" ${sel === i.id ? 'selected' : ''}>${esc(i.name)} (${esc(i.unit)})</option>`).join('');
  const beanOpts = S.beans.map(b => `<option value="${esc(b.id)}" ${r.bean === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('');
  openModal(`
    <h3>${isNew ? 'New drink' : 'Edit — ' + esc(r.name)}</h3>
    <div class="frm">
      <div class="row">
        <div><label>Name</label><input id="f_name" value="${esc(r.name)}"></div>
        <div><label>Category</label><input id="f_cat" value="${esc(r.cat)}"></div>
      </div>
      <div class="row">
        <div><label>Size</label><input id="f_size" value="${esc(r.size)}"></div>
        <div><label>Menu price $</label><input id="f_price" type="number" step="0.05" value="${esc(r.price)}"></div>
        <div><label>Espresso bean (for dial-in ref)</label><select id="f_bean"><option value="">— none —</option>${beanOpts}</select></div>
      </div>
      <div><label>Build (ingredient + quantity)</label>
        <div class="ing-rows" id="f_items">${r.items.map(it => `
          <div class="irow"><select>${ingOpts(it.ing)}</select><input type="number" step="0.5" value="${esc(it.qty)}"><button class="mini danger rm">×</button></div>`).join('')}
        </div>
        <button class="linkish" id="f_addItem">+ add ingredient</button>
      </div>
      <div><label>Steps (one per line)</label><textarea id="f_steps" rows="5">${esc(r.steps.join('\n'))}</textarea></div>
    </div>
    <div class="bar"><button class="ghost" data-close>Cancel</button><button class="btn" id="f_save">Save drink</button></div>
  `);
  $('#f_addItem').onclick = () => {
    const d = document.createElement('div'); d.className = 'irow';
    d.innerHTML = `<select>${ingOpts()}</select><input type="number" step="0.5" value="1"><button class="mini danger rm">×</button>`;
    $('#f_items').appendChild(d);
  };
  $('#f_items').addEventListener('click', e => { if (e.target.classList.contains('rm')) e.target.parentElement.remove(); });
  $('#f_save').onclick = () => {
    r.name = $('#f_name').value.trim() || 'Untitled';
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
  return `
  <h2>Ingredient prices</h2>
  <p class="hint">Starter numbers are estimates — put in what you actually pay. Every card re-prices the moment you change a number here. That laminated price list from 2023? This is the version that can't go stale.</p>
  <table class="grid"><thead><tr><th>Ingredient</th><th>Unit</th><th>Cost / unit</th><th>Used in</th><th></th></tr></thead>
  <tbody>
    ${S.ingredients.map(i => {
      const uses = S.recipes.filter(r => r.items.some(it => it.ing === i.id));
      return `<tr data-id="${esc(i.id)}">
        <td><input class="wide" data-f="name" value="${esc(i.name)}"></td>
        <td><input style="width:60px" data-f="unit" value="${esc(i.unit)}"></td>
        <td>$<input data-f="unitCost" type="number" step="0.001" value="${esc(i.unitCost)}"></td>
        <td class="uses">${uses.length ? esc(uses.map(r => r.name).join(', ')) : '—'}</td>
        <td><button class="mini danger" data-act="delIng">×</button></td>
      </tr>`;
    }).join('')}
  </tbody></table>
  <p><button class="btn" id="addIng">+ Add ingredient</button></p>`;
}

/* ---------------- dial-in ---------------- */
function viewDialin() {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
    <h2 style="margin:0">Dial-in board</h2>
    <button class="btn" id="addBean">+ Add bean</button>
  </div>
  <p class="hint">The morning question — "what's the grind today?" — answered without asking. Log every adjustment; the history is your shop's memory when that bean comes back next season.</p>
  <div class="beans">
    ${S.beans.map(b => {
      const cur = latestDial(b.id);
      const hist = S.dialins.filter(d => d.beanId === b.id).sort((x, y) => y.ts - x.ts).slice(0, 6);
      return `<section class="bean" data-id="${esc(b.id)}">
        <h3>${esc(b.name)}</h3><div class="roaster">${esc(b.roaster)}</div>
        ${cur ? `<div class="dial-now">
          <div class="cell"><div class="num">${cur.grind}</div><div class="lbl">grind</div></div>
          <div class="cell"><div class="num">${cur.dose}g</div><div class="lbl">dose in</div></div>
          <div class="cell"><div class="num">${cur.yield}g</div><div class="lbl">yield out</div></div>
          <div class="cell"><div class="num">${cur.time}s</div><div class="lbl">time</div></div>
        </div><div class="dial-updated">set ${ago(cur.ts)}${cur.note ? ' — ' + esc(cur.note) : ''}</div>` : '<div class="dial-updated">no dial-in yet — log the first one below</div>'}
        <div class="dial-form">
          <input placeholder="grind" data-f="grind" value="${cur ? esc(cur.grind) : ''}">
          <input placeholder="dose g" data-f="dose" value="${cur ? esc(cur.dose) : ''}">
          <input placeholder="yield g" data-f="yield" value="${cur ? esc(cur.yield) : ''}">
          <input placeholder="sec" data-f="time" value="${cur ? esc(cur.time) : ''}">
          <input class="note" placeholder="note (optional)" data-f="note">
          <button class="btn small" data-act="logDial">Log</button>
        </div>
        <table class="dial-hist">${hist.map(d => `<tr><td>${new Date(d.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td><td>g${d.grind}</td><td>${d.dose}→${d.yield}g</td><td>${d.time}s</td><td class="n">${esc(d.note || '')}</td></tr>`).join('')}</table>
        <p><button class="mini danger" data-act="delBean">remove bean</button></p>
      </section>`;
    }).join('')}
  </div>`;
}

/* ---------------- training ---------------- */
function viewTraining() {
  const recipeOpts = S.recipes.map(r => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('');
  const bar = S.baristas.find(b => b.id === S._trainee) || S.baristas[0];
  if (bar) S._trainee = bar.id;
  const so = (bar && S.signoffs[bar.id]) || {};
  const done = S.path.filter(p => so[p.id]).length;
  return `
  <h2>Training path</h2>
  <p class="hint">The new-hire pack, alive. Reorder the path, then track sign-offs per barista. Print it from the Print tab before their first shift.</p>
  <div class="train-wrap">
    <div>
      <h3 style="font-family:var(--font-display)">The path</h3>
      <ul class="pathlist">
        ${S.path.map((p, ix) => {
          const label = p.type === 'recipe' ? (S.recipes.find(r => r.id === p.ref)?.name || '(deleted drink)') : p.label;
          return `<li data-id="${esc(p.id)}">
            <span class="day">d${p.day}</span><span class="t">${esc(label)}</span>
            <button class="mini" data-act="up" ${ix === 0 ? 'disabled' : ''}>↑</button>
            <button class="mini" data-act="down" ${ix === S.path.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="mini danger" data-act="rmPath">×</button>
          </li>`;
        }).join('')}
      </ul>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        <select id="pAddRecipe"><option value="">+ drink…</option>${recipeOpts}</select>
        <input id="pAddSkill" placeholder="+ custom skill, e.g. 'Closing checklist'" style="flex:1;min-width:180px;border:1px solid var(--line);border-radius:8px;padding:6px 9px">
        <input id="pAddDay" type="number" min="1" max="9" value="1" style="width:52px;border:1px solid var(--line);border-radius:8px;padding:6px">
        <button class="btn small" id="pAdd">Add</button>
      </div>
    </div>
    <div>
      <h3 style="font-family:var(--font-display)">Sign-offs</h3>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
        <select id="traineeSel">${S.baristas.map(b => `<option value="${esc(b.id)}" ${bar && b.id === bar.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>
        <button class="mini" id="addBarista">+ barista</button>
        ${bar ? `<button class="mini danger" id="rmBarista">remove</button>` : ''}
      </div>
      ${bar ? `
      <div class="progress"><div style="width:${S.path.length ? done / S.path.length * 100 : 0}%"></div></div>
      <div class="hint">${done}/${S.path.length} signed off</div>
      <ul class="checklist">
        ${S.path.map(p => {
          const label = p.type === 'recipe' ? (S.recipes.find(r => r.id === p.ref)?.name || '(deleted drink)') : p.label;
          const d = so[p.id];
          return `<li><input type="checkbox" data-id="${esc(p.id)}" ${d ? 'checked' : ''}><span>${esc(label)}</span>${d ? `<span class="done-date">${esc(d)}</span>` : ''}</li>`;
        }).join('')}
      </ul>` : '<p class="hint">Add a barista to start tracking.</p>'}
    </div>
  </div>`;
}

/* ---------------- print ---------------- */
function viewPrint() {
  return `
  <h2>Print packs</h2>
  <p class="hint">Paper survives the rush. Print, laminate, tape where the work happens. Cards and the new-hire pack never show your costs — the Margin Report is the owner-only page.</p>
  <div class="packs">
    <div class="pack"><h3>Recipe cards</h3><p>Every drink as a 4×6-style card: build, steps, current dial-in. Two per page.</p><button class="btn" data-pack="cards">Print cards</button></div>
    <div class="pack"><h3>Station sheet</h3><p>The whole menu on one dense page. Tape it to the low-boy.</p><button class="btn" data-pack="station">Print sheet</button></div>
    <div class="pack"><h3>New-hire pack</h3><p>Cover + training checklist + every card + today's dial-ins. Ready before Monday.</p><button class="btn" data-pack="hire">Print pack</button></div>
    <div class="pack"><h3>Margin report</h3><p>Owner-only: cost, margin and COGS% per drink, flagged against your target.</p><button class="btn sub" data-pack="margin">Print report</button></div>
  </div>`;
}

const pCard = r => `
  <div class="pcard">
    <h3><span>${esc(r.name)}</span><span class="pr">${money(r.price)}</span></h3>
    <div class="meta">${esc(r.cat)} · ${esc(r.size)}</div>
    <ul>${r.items.map(it => { const i = ingById(it.ing); return i ? `<li><span>${esc(i.name)}</span><span>${it.qty} ${esc(i.unit)}</span></li>` : ''; }).join('')}</ul>
    <ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    ${r.bean ? `<div class="dial-ref">⏚ ${esc(dialRefText(r))} — check the board</div>` : ''}
  </div>`;
const pHead = title => `<div class="phead"><span>${esc(S.shop.name)} — ${title}</span><span>portafile · ${new Date().toLocaleDateString()}</span></div>`;

function buildPrint(kind) {
  const root = $('#printRoot');
  if (kind === 'cards') {
    root.innerHTML = pHead('recipe cards') + `<div class="pcards">${S.recipes.map(pCard).join('')}</div>`;
  } else if (kind === 'station') {
    root.innerHTML = pHead('station sheet') + `
      <table class="pstation"><thead><tr><th>Drink</th><th>Build</th><th>Steps</th></tr></thead><tbody>
      ${S.recipes.map(r => `<tr>
        <td><b>${esc(r.name)}</b><br>${esc(r.size)} · ${money(r.price)}</td>
        <td class="m">${r.items.map(it => { const i = ingById(it.ing); return i ? `${it.qty}${esc(i.unit)} ${esc(i.name)}` : ''; }).filter(Boolean).join('<br>')}</td>
        <td>${r.steps.map(esc).join(' → ')}</td>
      </tr>`).join('')}
      </tbody></table>`;
  } else if (kind === 'hire') {
    root.innerHTML = `
      <div class="pcover">
        <div class="big">Welcome to the bar.</div>
        <div class="shop">${esc(S.shop.name)}</div>
        <div class="date">Your training pack — printed ${new Date().toLocaleDateString()} by portafile</div>
      </div>
      ${pHead('training path')}
      <div class="pchecklist">
        ${[...new Set(S.path.map(p => p.day))].sort((a, b) => a - b).map(day => `
          <h4>Day ${day}</h4>
          ${S.path.filter(p => p.day === day).map(p => {
            const label = p.type === 'recipe' ? (S.recipes.find(r => r.id === p.ref)?.name || '') : p.label;
            return `<div class="ck"><div class="box"></div><div>${esc(label)}</div></div>`;
          }).join('')}`).join('')}
      </div>
      <div class="pagebreak"></div>
      ${pHead("today's dial-ins")}
      ${S.beans.map(b => { const d = latestDial(b.id); return d ? `<div class="pdial"><h4>${esc(b.name)} — ${esc(b.roaster)}</h4><div class="nums">grind ${d.grind} · ${d.dose}g in → ${d.yield}g out · ${d.time}s</div></div>` : ''; }).join('')}
      <div class="pagebreak"></div>
      ${pHead('recipe cards')}
      <div class="pcards">${S.recipes.map(pCard).join('')}</div>`;
  } else {
    root.innerHTML = pHead('margin report — owner copy') + `
      <table class="pstation"><thead><tr><th>Drink</th><th>Menu</th><th>Cost</th><th>Keeps</th><th>COGS%</th><th>vs ${S.shop.cogsTarget}% target</th></tr></thead><tbody>
      ${[...S.recipes].sort((a, b) => cogsPct(b) - cogsPct(a)).map(r => {
        const c = recipeCost(r), p = cogsPct(r);
        return `<tr><td><b>${esc(r.name)}</b> ${esc(r.size)}</td><td class="m">${money(r.price)}</td><td class="m">${money(c)}</td><td class="m">${money(r.price - c)}</td><td class="m">${p.toFixed(1)}%</td><td>${p <= S.shop.cogsTarget ? 'OK' : '<b>OVER — reprice or rebuild</b>'}</td></tr>`;
      }).join('')}
      </tbody></table>
      <p style="font-size:8.5pt;color:#666;margin-top:8pt">Ingredient prices as entered on ${new Date().toLocaleDateString()}. Excludes labor and rent — this is drink-level COGS only.</p>`;
  }
  window.print();
}

/* ---------------- modal & data ---------------- */
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.classList.remove('hidden'); m.onclick = e => { if (e.target === m || e.target.hasAttribute('data-close')) closeModal(); }; }
function closeModal() { $('#modal').classList.add('hidden'); $('#modal').innerHTML = ''; }

function dataMenu() {
  openModal(`
    <h3>Your data</h3>
    <p class="hint">Everything lives in this browser only. Export a JSON backup and keep it with the shop docs; import it on any other machine.</p>
    <div class="bar" style="justify-content:flex-start">
      <button class="btn" id="dExport">Export backup</button>
      <label class="ghost" style="display:inline-block;padding:8px 14px;border-radius:9px">Import<input id="dImport" type="file" accept=".json" style="display:none"></label>
      <button class="ghost danger" id="dReset">Reset to demo</button>
    </div>
    ${location.protocol === 'file:' ? '' : `
    <h4 style="margin-top:18px">Sync (share with your staff)</h4>
    ${syncKey ? `
      <p class="hint">This device is synced. Anyone who opens this secret link sees and edits the same live data — no account needed:</p>
      <p><input id="dSyncLink" readonly value="${esc(location.origin + location.pathname + '?k=' + syncKey)}" style="width:100%"></p>
      <div class="bar" style="justify-content:flex-start">
        <button class="btn" id="dSyncCopy">Copy link</button>
        <button class="ghost danger" id="dSyncOff">Turn off sync on this device</button>
      </div>` : `
      <p class="hint">Turn on sync to get a secret link: open it on any phone or laptop and everyone shares the same live data. Your data then also lives in Portafile's cloud storage.</p>
      <div class="bar" style="justify-content:flex-start"><button class="btn" id="dSyncOn">Turn on sync</button></div>`}`}`);
  const syncOn = $('#dSyncOn'); if (syncOn) syncOn.onclick = () => {
    const b = new Uint8Array(20); crypto.getRandomValues(b);
    localStorage.setItem(SYNC_KEY, [...b].map(x => x.toString(16).padStart(2, '0')).join(''));
    location.search = '?k=' + localStorage.getItem(SYNC_KEY); // reload with key: sync boot path takes over
  };
  const syncCopy = $('#dSyncCopy'); if (syncCopy) syncCopy.onclick = () => { $('#dSyncLink').select(); navigator.clipboard.writeText($('#dSyncLink').value); syncCopy.textContent = 'Copied!'; };
  const syncOff = $('#dSyncOff'); if (syncOff) syncOff.onclick = () => { localStorage.removeItem(SYNC_KEY); location.search = ''; };
  $('#dExport').onclick = () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `portafile-${S.shop.name.replace(/\W+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  };
  $('#dImport').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => {
      try {
        const s = JSON.parse(t);
        if (!validBackup(s)) throw new Error('not a portafile backup');
        s.shop.cogsTarget = +s.shop.cogsTarget || 30; s.tab = s.tab || 'recipes';
        const prev = S;
        try { S = s; render(); }
        catch (err) { S = prev; render(); throw new Error('backup is damaged: ' + err.message); }
        save(); closeModal();
      } catch (err) { alert('Could not import: ' + err.message); }
    });
  };
  $('#dReset').onclick = () => { if (confirm('Replace everything with the demo shop?')) { S = seed(); save(); closeModal(); render(); } };
}

function helpModal() {
  openModal(`
    <h3>How Portafile works</h3>
    <div class="helpbody">
      <h4>Recipes</h4><p>Every card shows what the drink <em>costs you</em> next to its menu price. The badge goes red when cost-of-goods passes your target (set it on the dashboard). Espresso drinks carry the live dial-in for their bean.</p>
      <h4>Prices</h4><p>One table of what you pay. Change a number → every card re-prices. When milk or beans jump, you'll see which drinks went underwater the same minute.</p>
      <h4>Dial-in</h4><p>Log grind/dose/yield/time per bean. The newest entry is "the board" — it appears on cards and print packs. History stays forever.</p>
      <h4>Training</h4><p>Order the path (drinks + custom skills, grouped by day), pick a barista, tick sign-offs. Progress is saved per barista.</p>
      <h4>Print</h4><p>Cards and the new-hire pack hide costs on purpose — they get taped where customers can see. The margin report is the owner-only page.</p>
      <h4>Your data</h4><p>Lives in this browser (localStorage). <strong>Data → Export backup</strong> before switching machines. No account, no bill. If you turn on <strong>Sync</strong> (Data menu), your data also lives in Portafile's cloud storage so staff phones share it via a secret link.</p>
    </div>
    <div class="bar"><button class="btn" data-close>Got it</button></div>`);
}

/* ---------------- wiring ---------------- */
function wireView() {
  // recipes
  const add = $('#addRecipe'); if (add) add.onclick = () => recipeForm(null);
  const ct = $('#cogsTarget'); if (ct) ct.onchange = () => { S.shop.cogsTarget = Math.min(95, Math.max(5, parseFloat(ct.value) || 30)); save(); render(); };
  $$('.rcard [data-act]').forEach(b => b.onclick = () => {
    const id = b.closest('.rcard').dataset.id, r = S.recipes.find(x => x.id === id);
    if (b.dataset.act === 'edit') recipeForm(r);
    if (b.dataset.act === 'dup') { const c = JSON.parse(JSON.stringify(r)); c.id = uid(); c.name = r.name + ' (copy)'; S.recipes.push(c); save(); render(); }
    if (b.dataset.act === 'del' && confirm(`Delete "${r.name}"?`)) {
      S.recipes = S.recipes.filter(x => x.id !== id);
      S.path = S.path.filter(p => !(p.type === 'recipe' && p.ref === id));
      save(); render();
    }
  });
  // prices
  const ai = $('#addIng'); if (ai) ai.onclick = () => { S.ingredients.push({ id: uid(), name: 'New ingredient', unit: 'each', unitCost: 0 }); save(); render(); };
  $$('table.grid tr[data-id]').forEach(tr => {
    const ing = S.ingredients.find(i => i.id === tr.dataset.id);
    $$('input[data-f]', tr).forEach(inp => inp.onchange = () => {
      ing[inp.dataset.f] = inp.dataset.f === 'unitCost' ? Math.max(0, parseFloat(inp.value) || 0) : inp.value.trim();
      save(); render();
    });
    const del = $('[data-act=delIng]', tr); if (del) del.onclick = () => {
      const uses = S.recipes.filter(r => r.items.some(it => it.ing === ing.id));
      if (uses.length) return alert(`Can't delete — used in: ${uses.map(r => r.name).join(', ')}. Remove it from those drinks first.`);
      S.ingredients = S.ingredients.filter(i => i.id !== ing.id); save(); render();
    };
  });
  // dial-in
  const ab = $('#addBean'); if (ab) ab.onclick = () => {
    openModal(`<h3>New bean</h3><div class="frm">
      <div><label>Bean name</label><input id="b_name" placeholder="e.g. Colombia Huila decaf"></div>
      <div><label>Roaster</label><input id="b_roaster" placeholder="who roasts it"></div></div>
      <div class="bar"><button class="ghost" data-close>Cancel</button><button class="btn" id="b_save">Add bean</button></div>`);
    $('#b_save').onclick = () => { S.beans.push({ id: uid(), name: $('#b_name').value.trim() || 'New bean', roaster: $('#b_roaster').value.trim() }); save(); closeModal(); render(); };
  };
  $$('.bean').forEach(sec => {
    const beanId = sec.dataset.id;
    const log = $('[data-act=logDial]', sec); if (log) log.onclick = () => {
      const g = f => parseFloat($(`[data-f=${f}]`, sec).value);
      const entry = { id: uid(), beanId, ts: Date.now(), grind: g('grind'), dose: g('dose'), yield: g('yield'), time: g('time'), note: $('[data-f=note]', sec).value.trim() };
      if ([entry.grind, entry.dose, entry.yield, entry.time].some(v => isNaN(v))) return alert('Grind, dose, yield and time all need numbers.');
      S.dialins.push(entry); save(); render();
    };
    const del = $('[data-act=delBean]', sec); if (del) del.onclick = () => {
      const used = S.recipes.filter(r => r.bean === beanId);
      if (used.length) return alert(`This bean is on: ${used.map(r => r.name).join(', ')}. Point those drinks at another bean first.`);
      if (confirm('Remove bean and its dial-in history?')) { S.beans = S.beans.filter(b => b.id !== beanId); S.dialins = S.dialins.filter(d => d.beanId !== beanId); save(); render(); }
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
    if (b.dataset.act === 'up' && ix > 0) [S.path[ix - 1], S.path[ix]] = [S.path[ix], S.path[ix - 1]];
    if (b.dataset.act === 'down' && ix < S.path.length - 1) [S.path[ix + 1], S.path[ix]] = [S.path[ix], S.path[ix + 1]];
    if (b.dataset.act === 'rmPath') S.path.splice(ix, 1);
    save(); render();
  });
  const ts = $('#traineeSel'); if (ts) ts.onchange = () => { S._trainee = ts.value; save(); render(); };
  const abar = $('#addBarista'); if (abar) abar.onclick = () => {
    const name = prompt('Barista name:'); if (!name) return;
    const b = { id: uid(), name: name.trim() }; S.baristas.push(b); S._trainee = b.id; save(); render();
  };
  const rbar = $('#rmBarista'); if (rbar) rbar.onclick = () => {
    const b = S.baristas.find(x => x.id === S._trainee); if (!b) return;
    if (confirm(`Remove ${b.name} and their sign-offs?`)) { S.baristas = S.baristas.filter(x => x.id !== b.id); delete S.signoffs[b.id]; S._trainee = null; save(); render(); }
  };
  $$('.checklist input[type=checkbox]').forEach(cb => cb.onchange = () => {
    const bid = S._trainee; if (!bid) return;
    S.signoffs[bid] = S.signoffs[bid] || {};
    if (cb.checked) S.signoffs[bid][cb.dataset.id] = new Date().toLocaleDateString();
    else delete S.signoffs[bid][cb.dataset.id];
    save(); render();
  });
  // print
  $$('[data-pack]').forEach(b => b.onclick = () => buildPrint(b.dataset.pack));
}

/* top chrome */
$$('.tab').forEach(b => b.onclick = () => { S.tab = b.dataset.tab; save(); render(); });
$('#shopName').addEventListener('change', () => { S.shop.name = $('#shopName').value.trim() || 'My shop'; save(); render(); });
$('#btnData').onclick = dataMenu;
$('#btnHelp').onclick = helpModal;

/* ---------------- self-test (?selftest=1) ---------------- */
function selftest() {
  const t = seed(); const fails = []; let total = 0;
  const ok = (name, cond) => { total++; if (!cond) fails.push(name); };
  const latte = t.recipes.find(r => r.name === 'Latte');
  const beansIng = t.ingredients.find(i => i.name === 'Espresso beans');
  const milk = t.ingredients.find(i => i.name === 'Whole milk');
  const cup = t.ingredients.find(i => i.name === '12oz hot cup + lid + sleeve');
  const expected = 18 * beansIng.unitCost + 9 * milk.unitCost + 1 * cup.unitCost;
  const cost = latte.items.reduce((s, it) => { const i = t.ingredients.find(x => x.id === it.ing); return s + i.unitCost * it.qty; }, 0);
  ok('latte cost math', Math.abs(cost - expected) < 1e-9);
  ok('latte cost ≈ $1.22', Math.abs(cost - 1.218) < 0.01);
  ok('cogs% sane', cost / latte.price * 100 > 15 && cost / latte.price * 100 < 40);
  const hb = t.beans[0]; const lat = t.dialins.filter(d => d.beanId === hb.id).sort((a, b) => b.ts - a.ts)[0];
  ok('latest dial-in picks newest', lat.note === 'humid morning');
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
  console.log('[portafile selftest]', fails.length ? fails : 'all pass');
}

render();
if (syncKey) { syncPull(); setInterval(syncPull, 30000); syncBadge(); }
if (location.search.includes('selftest=1')) selftest();

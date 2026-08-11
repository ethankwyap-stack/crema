/* Tests migrate-costs.mjs's extraction logic (migrateShop()) against an in-memory fixture store —
   no network, no BLOB_READ_WRITE_TOKEN, never touches production. Proves the math is right before
   the script ever runs against real shops.
   Run: node verify-migrate-costs.mjs */
import { migrateShop } from './migrate-costs.mjs';

let failures = 0;
const check = (name, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + name); if (!cond) failures++; };

function fixtureStore(initial = {}) {
  const store = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    store,
    readJson: async path => store.has(path) ? JSON.parse(store.get(path)) : null,
    writeJson: async (path, obj) => { store.set(path, JSON.stringify(obj)); },
  };
}
const quiet = () => {}; // migrateShop logs by default; keep test output to PASS/FAIL lines

/* ---- a normal shop with real costs gets split correctly ---- */
{
  const shopId = 'a'.repeat(40);
  const { store, readJson, writeJson } = fixtureStore({
    [`shops/${shopId}.json`]: {
      shop: { name: 'Real Cafe' }, ts: 5000,
      ingredients: [{ id: 'i1', name: 'Beans', unit: 'g', unitCost: 2.5 }, { id: 'i2', name: 'Milk', unit: 'ml', unitCost: 0.1 }],
    },
  });
  const result = await migrateShop(shopId, { readJson, writeJson, log: quiet });
  check('extracted both ingredient costs', result.n === 2 && result.unitCost.i1 === 2.5 && result.unitCost.i2 === 0.1);
  check('costs/ blob written with the right values', JSON.parse(store.get(`costs/${shopId}.json`)).unitCost.i2 === 0.1);
  check('costs/ blob carries the shop ts, not a fresh one', JSON.parse(store.get(`costs/${shopId}.json`)).ts === 5000);
  check('shops/ blob stripped to zero', JSON.parse(store.get(`shops/${shopId}.json`)).ingredients.every(i => i.unitCost === 0));
  check('shops/ blob keeps everything else (name, ids, units)', JSON.parse(store.get(`shops/${shopId}.json`)).shop.name === 'Real Cafe');
}

/* ---- a negative unitCost (bad data) is clamped to 0, matching extractCosts() in api/state.js ---- */
{
  const shopId = 'b'.repeat(40);
  const { store, readJson, writeJson } = fixtureStore({
    [`shops/${shopId}.json`]: { shop: { name: 'X' }, ts: 1, ingredients: [{ id: 'i1', name: 'Y', unit: 'g', unitCost: -5 }] },
  });
  await migrateShop(shopId, { readJson, writeJson, log: quiet });
  check('a negative unitCost is clamped to 0, not carried through', JSON.parse(store.get(`costs/${shopId}.json`)).unitCost.i1 === 0);
}

/* ---- --dry-run makes no writes ---- */
{
  const shopId = 'c'.repeat(40);
  const { store, readJson, writeJson } = fixtureStore({
    [`shops/${shopId}.json`]: { shop: { name: 'X' }, ts: 1, ingredients: [{ id: 'i1', name: 'Y', unit: 'g', unitCost: 4 }] },
  });
  const result = await migrateShop(shopId, { readJson, writeJson, dry: true, log: quiet });
  check('dry-run still reports the extraction it WOULD do', result.n === 1 && result.unitCost.i1 === 4);
  check('dry-run writes nothing', !store.has(`costs/${shopId}.json`) && JSON.parse(store.get(`shops/${shopId}.json`)).ingredients[0].unitCost === 4);
}

/* ---- idempotent: running twice does not clobber a shop already migrated ---- */
{
  const shopId = 'e'.repeat(40);
  const { store, readJson, writeJson } = fixtureStore({
    [`shops/${shopId}.json`]: { shop: { name: 'X' }, ts: 1, ingredients: [{ id: 'i1', name: 'Y', unit: 'g', unitCost: 0 }] }, // already stripped
    [`costs/${shopId}.json`]: { unitCost: { i1: 9.99 }, ts: 1 }, // already migrated
  });
  const result = await migrateShop(shopId, { readJson, writeJson, log: quiet });
  check('a shop with an existing costs/ blob is skipped, not overwritten', result === 'already-migrated');
  check('the real (already-migrated) cost survives a second run', JSON.parse(store.get(`costs/${shopId}.json`)).unitCost.i1 === 9.99);
}

/* ---- a shopId with no shops/ blob at all is skipped cleanly ---- */
{
  const shopId = 'f'.repeat(40);
  const { readJson, writeJson } = fixtureStore({});
  const result = await migrateShop(shopId, { readJson, writeJson, log: quiet });
  check('a missing shop is skipped, not an error', result === 'no-shop');
}

console.log(failures ? `\n${failures} FAILURES` : '\nall migrate-costs checks passed');
process.exit(failures ? 1 : 0);

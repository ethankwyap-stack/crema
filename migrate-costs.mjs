/* One-time migration for the costs/<shopId>.json split (api/state.js).
   Existing shops/<shopId>.json blobs still carry ingredients[].unitCost inline. This extracts those
   into costs/<shopId>.json, then rewrites shops/<shopId>.json with costs zeroed.

   RUN THIS **BEFORE** DEPLOYING THE NEW api/state.js — not after. Reasoning: the real risk isn't
   the migration order relative to the OLD server, it's a staff device autosaving into the NEW
   server before costs/ exists. New server code always strips costs from shops/ on any PUT
   (stripCosts()) but only WRITES costs/ for a proven owner — so if a staff device's local state
   (still holding real unitCost from a pre-migration pull) autosaves after the new code deploys but
   before this script runs, its real costs get stripped out of shops/ and are gone: no copy in
   costs/ (staff can't write it) and none left in shops/ either. That's permanent loss for a live
   café's pricing, not a display glitch.
   Running this FIRST, against the OLD (still-deployed) server, has no such hole: the old server
   doesn't know about costs/ and would just overwrite shops/ wholesale on any PUT in the gap before
   deploy — at worst that briefly undoes the strip (shops/ regains the real numbers a client still
   had cached), never destroys the costs/ snapshot already written. Worst case with this order is a
   few minutes of every device seeing $0 costs until the new server ships; nothing is unrecoverable.
   Run: BLOB_READ_WRITE_TOKEN=<prod token> node migrate-costs.mjs [--dry-run]   (then deploy)
   Logic tested against a fixture store, no network, via verify-migrate-costs.mjs (migrateShop() is
   exported for exactly that — the extraction math is what a typo would break, not the blob calls). */
import { get, put } from '@vercel/blob';

// Fetched from GET /api/lead 2026-08-11 — only one lead record carries a linked shopId (Double
// Black SF, the owner's own shop). The handoff's memory of a second shop ("187cdea…", "82ebcd8e…")
// was unverified and didn't match anything real — confirmed there's only the one shop.
const SHOP_IDS = [
  '25a8f48cf9b4801399ccdcddc92b82d2c8d61e28',
];

export async function migrateShop(shopId, { readJson, writeJson, dry, log = console.log }) {
  const state = await readJson(`shops/${shopId}.json`);
  if (!state) { log(`skip ${shopId}: no shops/ blob`); return 'no-shop'; }
  const existingCosts = await readJson(`costs/${shopId}.json`);
  if (existingCosts) { log(`skip ${shopId}: costs/ already exists — already migrated`); return 'already-migrated'; }

  const unitCost = {};
  for (const i of (state.ingredients || [])) if (i?.id) unitCost[i.id] = Math.max(0, +i.unitCost || 0);
  const n = Object.keys(unitCost).length;
  log(`${shopId}: extracting ${n} ingredient costs`);
  if (dry) return { unitCost, n };

  await writeJson(`costs/${shopId}.json`, { unitCost, ts: state.ts || Date.now() });
  await writeJson(`shops/${shopId}.json`, { ...state, ingredients: (state.ingredients || []).map(i => ({ ...i, unitCost: 0 })) });
  log(`${shopId}: migrated`);
  return { unitCost, n };
}

// Only run against real Blob when invoked directly (not when imported by the test).
if (import.meta.url === `file://${process.argv[1]}`) {
  const DRY = process.argv.includes('--dry-run');
  const readJson = async path => {
    const r = await get(path, { access: 'private', useCache: false });
    return r?.stream ? new Response(r.stream).json() : null;
  };
  const writeJson = (path, obj) => put(path, JSON.stringify(obj), {
    access: 'private', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true, cacheControlMaxAge: 0,
  });
  for (const shopId of SHOP_IDS) await migrateShop(shopId, { readJson, writeJson, dry: DRY });
}

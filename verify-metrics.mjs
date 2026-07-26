/* Checks the founder-metrics logic with fabricated data — no Blob store, no network, no key.
   Run: node verify-metrics.mjs      (root-level, so .vercelignore keeps it off the deployment) */
import { onboarding, isCustomised, usesTraining, usesDialin, daysUsed } from './api/metrics.js';
import { addDay } from './api/state.js';

let bad = 0;
const ok = (name, cond, extra = '') => { if (!cond) bad++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
const H = 3600e3;
const SHOP_A = 'a'.repeat(40), SHOP_B = 'b'.repeat(40);
const demo = () => ({ shop: { name: 'Demo Espresso Bar' }, recipes: Array(15).fill(0), ingredients: Array(13).fill(0), dialins: Array(3).fill(0), baristas: [{}], signoffs: {} });
// The Portuguese seed (seedPT in product/app.js) — a different shop name and different counts.
const demoPT = () => ({ shop: { name: 'Café da Esquina (demo)' }, recipes: Array(19).fill(0), ingredients: Array(14).fill(0), dialins: Array(3).fill(0), baristas: [{}], signoffs: {} });

/* ---- adoption predicates ---- */
ok('untouched demo counts as nothing adopted', !isCustomised(demo()) && !usesTraining(demo()) && !usesDialin(demo()));
/* A Portuguese shop starts from a different seed. If DEMOS in api/metrics.js does not know it,
   every Lisbon café counts as adopted the moment it opens and adoption silently reads 100%. */
ok('untouched PORTUGUESE demo counts as nothing adopted',
  !isCustomised(demoPT()) && !usesTraining(demoPT()) && !usesDialin(demoPT()));
ok('customised Portuguese shop still counts as customised',
  isCustomised({ ...demoPT(), shop: { name: 'Café da Baixa' } })
  && isCustomised({ ...demoPT(), recipes: Array(20).fill(0) }));
// A cross-language mismatch must not accidentally look untouched (pt name, en counts).
ok('seed name and counts must match the SAME seed',
  isCustomised({ ...demoPT(), recipes: Array(15).fill(0), ingredients: Array(13).fill(0) }));
ok('renamed shop counts as customised', isCustomised({ ...demo(), shop: { name: 'Northside Espresso' } }));
ok('added recipe counts as customised', isCustomised({ ...demo(), recipes: Array(16).fill(0) }));
ok('deleted recipe counts as customised', isCustomised({ ...demo(), recipes: Array(14).fill(0) }));
ok('second barista counts as training', usesTraining({ ...demo(), baristas: [{}, {}] }));
ok('one tick counts as training', usesTraining({ ...demo(), signoffs: { b1: { r1: '1/2/26' } } }));
ok('empty sign-off object is not training', !usesTraining({ ...demo(), signoffs: { b1: {} } }));
ok('fourth dial-in counts as dial-in use', usesDialin({ ...demo(), dialins: Array(4).fill(0) }));
ok('missing arrays do not throw', isCustomised({ shop: { name: 'x' } }) && !usesTraining({}) && !usesDialin({}));

/* ---- onboarding clock ---- */
const owners = { [SHOP_A]: { created: 100 * H }, [SHOP_B]: { created: 210 * H } };
const getOwner = async id => owners[id] || null;

// The regression this whole function exists for: the shopId-linking re-POST is a SECOND record for
// the same email with a LATER server ts. Measuring from it would report ~0h onboarding.
let r = await onboarding([
  { email: 'A@shop.com', ts: 96 * H },                        // real signup
  { email: 'a@shop.com', ts: 99 * H, shopId: SHOP_A },        // link re-POST, later ts, same person
], getOwner);
ok('duplicate link-record collapses to one signup', r.signups === 1, JSON.stringify(r));
ok('clock runs from the EARLIEST record, not the linked one', r.avgHours === 4, `got ${r.avgHours}h`);

r = await onboarding([
  { email: 'a@shop.com', ts: 96 * H, shopId: SHOP_A },   // 4h
  { email: 'b@shop.com', ts: 200 * H, shopId: SHOP_B },  // 10h
  { email: 'c@shop.com', ts: 5 * H },                    // signed up, never synced
], getOwner);
ok('average over two shops', r.avgHours === 7, JSON.stringify(r));
ok('median with even count takes the lower middle', r.medianHours === 4, `got ${r.medianHours}h`);
ok('unlinked signup counted but not timed', r.signups === 3 && r.linkedShops === 2 && r.samples === 2, JSON.stringify(r));

r = await onboarding([{ email: 'd@shop.com', ts: 10 * H, shopId: 'nope' }], getOwner);
ok('malformed shopId is ignored, not looked up', r.linkedShops === 0 && r.samples === 0);

r = await onboarding([
  { email: 'e@shop.com', ts: 150 * H, shopId: SHOP_A },         // shop created at 100h — before this signup
  { email: 'f@shop.com', ts: 10 * H, shopId: 'f'.repeat(40) },  // owner record missing
  { email: '', ts: 10 * H }, { email: 'g@shop.com', ts: 0 },    // junk records
], getOwner);
ok('shop created BEFORE its signup is dropped, not counted as 0h', r.samples === 0, JSON.stringify(r));
ok('missing owner record does not throw', r.linkedShops === 2);
ok('blank email and zero ts are skipped', r.signups === 2, JSON.stringify(r));

r = await onboarding([], getOwner);
ok('no leads at all → nulls, no divide-by-zero', r.samples === 0 && r.avgHours === null && r.medianHours === null);

/* ---- usage dates (levels 2 & 3) ---- */
ok('first visit of the day is recorded', addDay(undefined, '2026-07-22').join() === '2026-07-22');
ok('a repeat visit the same day adds nothing', addDay(['2026-07-21', '2026-07-22'], '2026-07-22').join() === '2026-07-21,2026-07-22');
ok('a revisit does not duplicate a day already in the log', addDay(['2026-07-22', '2026-07-23'], '2026-07-22').join() === '2026-07-23,2026-07-22');
ok('a garbage log does not throw, it just starts over', addDay(null, '2026-07-22').join() === '2026-07-22');
const long = Array.from({ length: 60 }, (_, i) => `2026-01-${String((i % 28) + 1).padStart(2, '0')}-${i}`);
const trimmed = addDay(long, '2026-07-22');
ok('log is trimmed to 60, dropping the OLDEST', trimmed.length === 60 && trimmed[59] === '2026-07-22' && trimmed[0] === long[1]);

const NOW = Date.parse('2026-07-22T18:00:00Z');
const ago = n => new Date(NOW - n * 864e5).toISOString().slice(0, 10);
ok('empty log counts zero days', daysUsed(undefined, NOW) === 0 && daysUsed([], NOW) === 0);
ok('today counts', daysUsed([ago(0)], NOW) === 1);
ok('day 29 is inside the 30-day window, day 30 is outside', daysUsed([ago(29), ago(30)], NOW) === 1, `${ago(29)} / ${ago(30)}`);
ok('a 60-day log counts only its last 30 days', daysUsed(Array.from({ length: 60 }, (_, i) => ago(i)), NOW) === 30);
ok('window size is honoured', daysUsed([ago(0), ago(6), ago(7)], NOW, 7) === 2);
ok('a date in the future is not dropped', daysUsed([ago(-1)], NOW) === 1); // clock skew shouldn't hide usage

console.log(bad ? `\n${bad} FAILURE(S)` : '\nall metrics checks passed');
process.exit(bad ? 1 : 0);

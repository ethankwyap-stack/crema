/* Dictionary hygiene for product/i18n.js.  `node verify-i18n.mjs` — no network, no browser, no keys.
 *
 * The English-string-as-key design has exactly three silent failure modes, and this catches all of
 * them.  None of them throws at runtime; each one just quietly shows English to a Portuguese user:
 *   1. A duplicate key in the pt block — the later one wins and the earlier translation vanishes.
 *   2. A key typo'd on one side — t() falls back to English forever and nothing complains.
 *   3. A translation that drops or adds a %s — the value lands in the wrong place, or not at all.
 *
 * Seed integrity (recipe items resolving, metric units) is checked by selftest() in the browser,
 * where the seed functions actually run — not duplicated here.
 */
import { readFileSync } from 'node:fs';

const i18nSrc = readFileSync(new URL('./product/i18n.js', import.meta.url), 'utf8');
const appSrc = readFileSync(new URL('./product/app.js', import.meta.url), 'utf8');

const fails = [];
let checks = 0;
const ok = (name, cond, detail) => { checks++; if (!cond) fails.push(detail ? `${name}\n    ${detail}` : name); };

/* ---- load the real dictionary ---------------------------------------------------------------
   i18n.js is a classic script with no exports, and it only touches `navigator` inside a function
   body, so evaluating the source and reaching in for the bindings works without any DOM stub. */
const { I18N, t, setLang } = new Function(`${i18nSrc}\nreturn { I18N, t, setLang };`)();
const PT = I18N.pt;
ok('pt dictionary loaded', PT && Object.keys(PT).length > 50, `got ${PT ? Object.keys(PT).length : 0} keys`);

/* ---- decode JS string literals --------------------------------------------------------------- */
function decode(body, quote) {
  // Turn a JS string literal body into its value by routing through JSON.
  const asJson = body
    .replace(/\\(['"])/g, '$1')            // \' and \" -> bare
    .replace(/"/g, '\\"');                 // then re-escape " for JSON
  try { return JSON.parse(`"${asJson}"`); } catch { return null; }
}
function literals(src) {
  const out = [];
  const re = /(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g;
  for (const m of src.matchAll(re)) {
    const v = decode(m[2], m[1]);
    if (v !== null) out.push(v);
  }
  return out;
}
/* First argument of every t('literal', …) call site. */
function tCallKeys(src) {
  const out = [];
  const re = /\bt\(\s*(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g;
  for (const m of src.matchAll(re)) {
    const v = decode(m[2], m[1]);
    if (v !== null) out.push(v);
  }
  return out;
}

/* ---- 1. duplicate keys ----------------------------------------------------------------------
   Object literals silently keep the LAST value, so this has to read the source, not the object. */
const ptBlock = i18nSrc.slice(i18nSrc.indexOf('pt: {'), i18nSrc.lastIndexOf('};'));
const declared = [];
for (const m of ptBlock.matchAll(/(?:^|\n)\s{4}(['"])((?:\\.|(?!\1)[^\\\n])*)\1\s*:/g)) {
  const v = decode(m[2], m[1]);
  if (v !== null) declared.push(v);
}
ok('found the declared pt keys', declared.length > 50, `parsed ${declared.length}`);
const seen = new Set(), dupes = new Set();
for (const k of declared) { if (seen.has(k)) dupes.add(k); seen.add(k); }
/* Self-check: the duplicate scan is only trustworthy if the regex saw EVERY key. If it silently
   missed some, duplicates among those would go unreported — so the unique count parsed from the
   source must equal the object's key count. */
ok('source scan saw every key the object has', seen.size === Object.keys(PT).length,
  `scanned ${seen.size} unique, object has ${Object.keys(PT).length}`);
ok('no duplicate pt keys', dupes.size === 0, [...dupes].map(k => JSON.stringify(k)).join('\n    '));

/* ---- 2. keys line up in both directions ------------------------------------------------------ */
const callKeys = [...new Set(tCallKeys(appSrc))];
const untranslated = callKeys.filter(k => !(k in PT));
ok('every t() literal has a pt translation', untranslated.length === 0,
  untranslated.map(k => JSON.stringify(k)).join('\n    '));

/* A pt key nobody references is almost always a typo on one side. The haystack is both scanners:
   t() call sites, plus every bare string literal — some keys are reached through a map rather than
   a literal call (the sync-badge statuses, the tab labels). The bare-literal scan alone is not
   enough: it does not understand template literals, so `placeholder="${t('dose g')}"` lets it pair
   the HTML attribute's quotes across the key and swallow it. Anchoring on `t(` is exact. */
const appStrings = new Set([...literals(appSrc), ...callKeys]);
const orphans = Object.keys(PT).filter(k => !appStrings.has(k));
ok('no pt key is unreachable from app.js', orphans.length === 0,
  orphans.map(k => JSON.stringify(k)).join('\n    '));

/* ---- 3. placeholders survive translation ----------------------------------------------------- */
const countS = s => (s.match(/%s/g) || []).length;
const mismatched = Object.entries(PT).filter(([k, v]) => countS(k) !== countS(v));
ok('%s count matches in every translation', mismatched.length === 0,
  mismatched.map(([k, v]) => `${countS(k)} vs ${countS(v)}: ${JSON.stringify(k)}`).join('\n    '));

/* ---- 4. t() itself -------------------------------------------------------------------------- */
setLang('pt');
ok('t translates a known key', t('Recipes') === 'Receitas', t('Recipes'));
ok('t fills %s in order', t('%s cost on %s — %s', 'A', 'B', 'C') === 'A de custo sobre B — C', t('%s cost on %s — %s', 'A', 'B', 'C'));
ok('t leaves no %s unfilled when args run short', !t('%s cost on %s — %s', 'A').includes('%s'));
ok('t falls back to english for an unknown key', t('nope nope nope') === 'nope nope nope');
setLang('en');
ok('en returns the key verbatim', t('Recipes') === 'Recipes');
ok('en strips a |context suffix', t('Roaster|role') === 'Roaster');
ok('setLang rejects junk and lands on en', (setLang('klingon'), t('Recipes') === 'Recipes'));

/* Every |context key must have a real translation, or the suffix leaks to a Portuguese user. */
setLang('pt');
const ctxLeaks = Object.keys(PT).filter(k => k.includes('|')).filter(k => t(k).includes('|'));
ok('no |context suffix leaks into pt output', ctxLeaks.length === 0, ctxLeaks.join('\n    '));

console.log(fails.length
  ? `i18n FAIL (${fails.length}/${checks})\n  - ${fails.join('\n  - ')}`
  : `i18n PASS (${checks} checks, ${Object.keys(PT).length} translations)`);
process.exit(fails.length ? 1 : 0);

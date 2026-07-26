# WORKS.md — what Portafile must do
Updated 2026-07-26 (5th run) · Run: `/still-works` (add `live` after a deploy)

The feature checklist and the blast-radius map. `CLAUDE.md` holds the *gotchas* (why the
code is shaped the way it is); this file holds *what must still be true for a user*.

## Shared foundations — what breaks what

| If this changes | These break |
|---|---|
| `product/app.js` | the entire app — it's one file, there is no module boundary |
| `product/i18n.js` | **every rendered string and every price.** It defines the globals `t`, `money`, `num`, `dec`, `setLang`, `currencySymbol`, `localeTag`; `app.js` calls `t()` during its first render, so if this file fails to load the app is not "in English", it is blank. It must stay listed before `app.js` in `product/index.html` |
| an English string used as a `t()` key | that one string reverts to English silently — there is no error for a missing translation, by design. `node verify-i18n.mjs` is the only thing that catches it |
| `brand/brand.css` | every page's palette and type: site, product, admin |
| `site/site.css` | **both** landing pages at once (`/` and `/pt`) — it was extracted from `site/index.html` so branding is edited once. A 404 here leaves fully-worded but completely unstyled pages, which a body-text health check would pass |
| localStorage prefix `portafile.v1*` | all saved shop data. A renamed key silently wipes every existing user, and the revocation/delete wipes are written against this exact prefix (`lead*` is deliberately excluded on revoke, included on delete) |
| `api/state.js` | sync, staff links, revocation, founder delete, usage-date stamping |
| **either demo seed** — EN (15 recipes / 13 ingredients / 3 dial-ins / 1 barista / "Demo Espresso Bar") or PT (19 / 14 / 3 / 1 / "Café da Esquina (demo)") | the `DEMOS` array in `api/metrics.js` is a hard-coded copy of **both**. Change a seed, or add a language without adding its seed there, and every adoption percentage silently lies — no error, just wrong numbers. A new language whose seed is missing makes every shop in that language read as "customised" on first open, i.e. 100% adoption. `node verify-metrics.mjs` covers both seeds |
| `vercel.json` | CSP (inline `<script>` dies on deployed pages), the CORS pin (the localhost:4322 dashboard's fetches), and the `/` → `/site/index.html` and `/pt` → `/site/pt/index.html` rewrites |
| `.vercelignore` | what gets published at all — a new top-level directory silently doesn't deploy |
| `esc()` in `admin/dashboard.html` | XSS safety of every dashboard table; feedback and lead text reach HTML through it |
| the admin-key transport (`x-portafile-admin` header) | all four admin routes at once. The dashboard's three fetches and `api/lead.js`/`api/metrics.js`/`api/state.js` must agree, AND the two lead/metrics functions must advertise the header in `Access-Control-Allow-Headers` — a mismatch means the browser never sends the request at all |
| page copy in `site/` | `health_check.py` matches marker strings and emails a false alarm if they move |
| tab ids in `product/index.html` (`recipes`/`prices`/`dialin`/`training`/`print`) | every verify suite's selectors |
| a **button label** in `product/i18n.js` | the Portuguese guide (`guide/guia-pt.html`) names buttons the owner must click, so a renamed button rots the PDF silently. `node guide/render-pdf.js` checks all 12 labels against the dictionary and exits non-zero — re-render the PDF after any label change. `guide/` is deliberately NOT in `.vercelignore`'s allowlist: it is an internal document Ethan sends by hand, not a deployed page |

## Features

### App — recipes and costing
- [ ] Cost recalculates live when an ingredient price changes
      prove: /product/ → Prices → milk $0.036 → $0.080 → latte card reads $1.61, no reload
      auto: `node product/verify.js`
- [ ] A new recipe can be added and shows a correct cost
      prove: new recipe via modal → card appears, cost $0.59 · auto: `verify.js`
- [ ] Margin report lists every recipe (15 on the demo seed) · auto: `verify.js`
- [ ] Data survives a reload
      prove: add a drink → reload → 16 recipes still there · auto: `verify.js`

### App — dial-in, training, print
- [ ] Logging a dial-in updates history and the board · auto: `verify.js`
- [ ] A sign-off tick registers and date-stamps · auto: `verify.js`
- [ ] New-hire pack prints cover, checklist, dial-ins and cards · auto: `verify.js`
- [ ] **Printed output never shows costs**, on any device — cards, station sheets, packs
      prove: print each pack, then check none of the margin report's 15 Cost figures appear
      in it. Do NOT just grep for `$`: menu prices legitimately print on all three.

### App — sharing, roles, sync
- [ ] Sync on → a second browser opening the `?k=` link sees the same shop
      auto: `node product/verify-sync.js` (64 checks)
- [ ] A staff link opens **straight into the recipes** — never a signup form
      prove: fresh browser + `?k=` → cards visible, no gate · auto: `verify-gate.js`
- [ ] Staff devices see no ingredient costs, margins or price table; owner devices do
      prove: both roles side by side · auto: `verify-sync.js`
- [ ] Reset staff link kills old links; the old device locks and wipes, the owner's does not
      auto: `verify-killpass.js` (10 checks)
- [ ] A revoked device keeps its signup record (no duplicate lead on re-entry) · auto: `verify-killpass.js`
- [ ] Founder delete: EVERY device (owner included) wipes back to the demo shop · auto: `verify-sync.js`
- [ ] Founder delete sends the shop's OWN browser back to the signup gate — even a seeding
      owner whose device has no `synced` marker and whose tombstone lost its ownerHash
      auto: `verify-sync.js` (the five `delete:` cases; three fail on pre-fix code)

### Server API — the real handlers (`node verify-api.mjs`, 27 checks)
Nothing else in this repo executes the API code: `verify-sync.js` drives a JS *mirror* of
`api/state.js` written inside the test, so it can pass while the real handler is broken.
`verify-api.mjs` swaps `@vercel/blob` for an in-memory store and calls the real handlers.
- [ ] A flood of anonymous `GET /api/state` is throttled — but on a read budget (600/10min),
      never the 120 write budget: a whole café shares one public IP and every device polls
      every 30s, so reusing the write bucket would throttle a busy real shop
      prove: 601 GETs from one IP → 429, and that same IP can still SAVE
- [ ] A shopId that already has data but no `owners/` record **cannot be claimed** — that
      takeover would overwrite the café's data and hard-kill every staff device
      prove: PUT with a stranger's owner token → 404, no owner record, data untouched
- [ ] A brand-new shop can still seed the cloud, and its real owner can still repair a lost
      pointer (the regression the claim-guard could plausibly break)
- [ ] All four admin routes take the key as `x-portafile-admin`; the old `?admin=` form is
      refused, and both lead/metrics preflights advertise the header

### App — access gate and feedback
- [ ] First-time visitor (no `?k=`) gets the signup form; it unlocks and never returns
      auto: `node product/verify-gate.js` (11 checks)
- [ ] ? → Send feedback sends, validates "pick 👍 or 👎 first", and survives a server error
      prove: drive the modal with the network stubbed to fail

### App — language and currency (European Portuguese)
- [ ] A browser asking for Portuguese gets the app in pt-PT with **no action taken**: euro prices
      with a decimal comma, metric units, and the Lisbon demo shop (19 drinks, "Café da Esquina")
      prove: open `/product/` with locale pt-PT · auto: the PT block of `product/verify.js`'s
      selftest (27 checks) — and `?selftest=1` asserts both seeds resolve every recipe item
- [ ] An en-US browser is **completely unaffected** — 15 drinks, "Demo Espresso Bar", dollars
      prove: side-by-side contexts; this is the regression that matters most
- [ ] The EN/PT picker retranslates the whole chrome live, with no reload, and the choice
      persists and syncs (it lives in `S.shop.lang`, so staff devices follow the owner)
- [ ] Switching language does **not** retranslate the shop's own recipes — those are the
      owner's words. "Reset to demo" reseeds in the current language
- [ ] **The one exception: an untouched demo swaps menus with the language.** An American menu
      priced in euros behind a Portuguese interface reads as a half-broken translation, and there
      is nothing of the owner's to protect yet. ANY of the owner's own work vetoes it — a renamed
      shop, an edited price, one logged dial-in, a renamed barista, a sign-off, or a swapped
      ingredient. A synced shop pushes the swapped seed so staff devices follow
      prove: pt demo → pick EN → 15 cards, "Demo Espresso Bar"; add one dial-in, switch → still 19
      auto: `node verify-pt.js` (61 checks, the 7b block)
- [ ] Currency follows language (en→USD, pt→EUR). Deliberate: one setting, not two
- [ ] Ingredient cost inputs accept per-ml prices (`step="0.0001"`, e.g. €0.0009/ml milk) —
      at `step="0.001"` a metric milk price is `:invalid` and the spinner jumps
- [ ] Nothing is left in English on any PT screen, including the print packs and the
      new-hire pack cover · auto: 53 checks, `scratchpad/verify-pt.js` pattern
- [ ] `node verify-i18n.mjs` — no duplicate keys, no untranslated `t()` call site, no
      orphaned translation, `%s` count preserved in every string

### Site
- [ ] Landing page loads at `/` with scroll-reveal animations actually running
      prove: load `/`, scroll, watch sections appear (see the headless traps below)
- [ ] **Both** landing pages are styled — the CSS is one shared file now, so check `/` AND `/pt`
      prove: computed `background-color` of body is `rgb(250,244,234)` on both
- [ ] `/pt` serves the Portuguese landing page (a rewrite, like `/`), with euro figures in the
      mock card matching the PT seed, and the EN↔PT switch reachable **on a phone**
      (it sits outside `.navlinks`, which is `display:none` under 600px)
- [ ] Privacy and Terms load and say what the product actually does
      prove: `/site/privacy.html` mentions aggregate counting AND usage dates
- [ ] `/site/pt/privacy.html` and `/site/pt/terms.html` load, and each says the English
      version prevails — they are translations of documents governed by California law

### Founder dashboard (local only, http://127.0.0.1:4322/admin/dashboard.html)
- [ ] Load metrics fills the tiles, the per-cafe table and feedback from live production
- [ ] Phase-0 kill gates read those live metrics: gate 1 shows the higher of ledger vs live
      (neither is a superset), gate 3 keeps its hand-typed number and shows the live one
      beside it labelled *any use* — the usage log stores dates, never which feature
      prove: gates read 0/15 before Load metrics, 1/15 + "live: 1 of 2 synced" after
- [ ] Per-cafe table sorts stalest-first (sorted server-side in `api/metrics.js`) and flags
      14+ days quiet in red
- [ ] A signup with no cloud shop shows "local only — nothing to delete", never a dead button
      prove: a lead with no `shopId` renders the muted span; the row's other buttons keep their index
- [ ] Hostile text in any live-loaded field renders as literal text, never HTML
- [ ] Ledger, email list, signups and labels survive a reload (localStorage `portafile-admin-v1`)

### Production invariants (`live` mode — `python3 health_check.py` covers all 12)
- [ ] `/api/metrics` with no key → 401 · `/api/state?k=0×40` → 404 `unknown-key`
- [ ] **`/admin/dashboard.html` → 404.** The dashboard has no auth; it must never deploy.

## Known traps — bugs that already escaped once
- **A "has the user touched this?" fingerprint must resolve ids to names, or it goes blind
  exactly where the data lives.** `demoSig` (`app.js`) hashed recipe items as `x.qty` alone,
  because `item.ing` is a random `uid()` that can never match a fresh `seed()`. So swapping a
  latte's whole milk for oat milk *at the same quantity* left the signature identical, and the
  language switch silently destroyed that edit — the one thing the veto exists to prevent.
  Fixed by mapping `id → ingredient name` first. Caught pre-deploy on 2026-07-26 by re-reading
  the fingerprint field by field and asking what each *omission* costs. Whenever a check strips
  ids to make a comparison work, list what else got stripped with them.
- **A guard that decides whether to REPLACE data needs a stricter test than one that decides
  what to display.** `matchesADemoSeed` in `api/metrics.js` compares only shop name and
  recipe/ingredient counts — fine for classifying a shop on the dashboard, where being wrong
  skews a number. Reusing it for the language swap would have thrown away a café's week of real
  dial-ins. Same question, different consequence, different threshold — never share the helper.
- **A custom request header turns a dashboard fetch into a *preflighted* one.** Moving the
  admin key from `?admin=` to `x-portafile-admin` (2026-07-25) meant the browser sent an
  `OPTIONS` first — and against not-yet-deployed production that preflight failed, so the
  request never left the browser: `net::ERR_FAILED`, **not** a 401. The dashboard and the two
  API files must therefore deploy together, and any future custom header must be added to
  `Access-Control-Allow-Headers` in the same commit. Observed in a browser, not guessed.
- A `[data-reveal]`/`0 of 0 elements` style assertion passes vacuously when the selector is
  wrong — the site's reveal hook is `[data-reveal]`, and the product's feedback button
  (`#hFeedback`) only exists *inside* the `?` help modal (`#btnHelp`), not on the toolbar.
  A check that matched nothing cost a re-run on 2026-07-25; assert the element count too.
- The dashboard writes `portafile-admin-v1` only on an **edit** (`save()`), never on load, so
  "did it persist" must drive a real change first or it reads as a broken store.
- Dial-in values are only numbers when typed locally (`parseFloat`); nothing coerces them
  when state arrives from the cloud or an import, so every dial-in **render site** must
  `esc()` — the board, the history table, AND the new-hire print pack. The 2026-07-25 audit
  named only the board; the other two were the same live bug.
- Relative asset URLs on the landing page 404 at `/` (root is a rewrite) — use `/site/...`.
  This was **live** until 2026-07-26: the FAQ's "privacy policy" link was `privacy.html`, fine at
  `/site/index.html` and a 404 at the canonical `/`. The other relative links only worked because
  `/site/index.html` and `/` happen to sit at the same depth — coincidence, not design. Every URL
  on both landing pages is absolute now, and `/pt` adds a second rewrite with the same hazard.
- **One English word can need two Portuguese translations.** With English strings as dictionary
  keys, "Roaster" (the company, on the bean form) and "Roaster" (a person, in the signup role
  list) collide on one key, and a duplicate JS object key silently keeps only the last value —
  so one of the two renders wrong with no error. Disambiguate with `t('Roaster|role')`; the
  `|context` suffix is stripped from the English fallback. `verify-i18n.mjs` fails on duplicates.
- **A translated app is not a translated *product*.** Adding a language touches things that are
  not strings: the demo seed (units, prices, the actual menu), the `DEMOS` copy in
  `api/metrics.js`, number formatting (`24,5%` not `24.5%`), `<input step>` for per-ml costs, the
  landing page, the legal pages, and text baked into CSS `content:` (the mock card's
  "4×6 · PRINTS CLEAN"). Translating only the visible UI strings leaves all of those wrong.
- Signup `<option value>`s must stay English while their labels translate — the value is POSTed
  to `/api/lead` and counted by the founder metrics, so translating it splits "Owner" and
  "Proprietário" into two buckets.
- Inline `<script>` is killed by CSP on any deployed page.
- Old headless Chrome clamps width to ~500px (fake mobile overflow — test narrow in an
  iframe) and freezes CSS transitions (blank reveals — use `--headless=new`).
- Playwright `addInitScript` re-runs on every navigation, silently restoring a seed the
  test just wiped — `verify-sync.js` guards this with `pf-test-stopseed`.
- The staff-link signup wall: sharing looked broken while the data was fine. Any change to
  the gate must be re-tested from a *fresh* browser on a `?k=` link.
- Founder delete failed to return the shop's own browser to the gate when the deleting
  device was a *seeding owner* (no `synced` marker yet) whose tombstone had lost its
  ownerHash to a flaky read — both proofs of "is this shop mine?" failed together. Never
  build the client's identity check on a server value an eventually-consistent read can
  erase; the 410 body now carries the dead shopId as local proof.
- Founder delete used to spare the owner device's local data, so the returning signup gate sat
  on top of the owner's still-populated shop and read as "the delete did nothing" (2026-07-24).
  Delete now wipes every device back to the demo seed. A guard the user can't see looks like a
  bug; if a protective rule makes an action half-apply, say so in the confirm copy instead.
- Automated browsers set `navigator.webdriver`, and `gate()` skips itself for them — so no verify
  suite can ever show the signup form. To *see* the gate, spoof it away with an init script
  (`Object.defineProperty(navigator,'webdriver',{get:()=>false})`).
- A shop that never turned on Sync makes zero requests after its signup POST: no cloud data to
  delete, no way to reach that browser. The missing "delete cloud data" button on those rows is
  the design, not a gap — don't "fix" it by adding a phone-home.
- The 30s poll freezes in a background tab; the app re-pulls on `visibilitychange`→visible
  and `online`. That focus-pull is guarded by `!syncPushT` so it can't overwrite an edit
  still inside its 800ms save debounce (`smoke.js` observes both sides).
- **Never pattern-match over `JSON.stringify(seed())`.** The seed is full of random `uid()`s, and
  a base-36 id ending in a digit + "oz" (`yykz6oz`, `33o68oz`) matches an imperial-units regex
  against the closing quote. Measured at a **0.99% false failure per selftest run** on 2026-07-26 —
  frequent enough to appear once in a full sweep and vanish on re-run, which is the worst possible
  frequency: it teaches you the suite is flaky instead of that the code is wrong. Assert against
  the human-authored fields (names, units, sizes, steps, notes), never the serialised object.
- **Test traps that fake a failure** (all three cost a re-run on 2026-07-22):
  - Printed cards/station/pack DO contain `$` — those are *menu prices*, which are supposed
    to print. Only ingredient cost / margin / COGS must be absent. Assert against the
    margin report's Cost column, not against the dollar sign.
  - The feedback modal's heading is "How's Portafile working?" — there is no "feedback"
    text inside the sheet, so a `hasText: /feedback/i` selector finds nothing. The button
    that opens it is `#hFeedback`.
  - The dashboard note now contains the words "Load metrics", so `text=Load metrics`
    matches two nodes — use `button:has-text("Load metrics")`.

## Cannot be tested automatically
- Whether a print actually looks right on paper — the browser print dialog needs a human.
- Whether Blob's eventual consistency window is acceptable in the field; revocation takes
  a few seconds by design and no test can prove "fast enough for firing a barista."
- Real multi-device timing (two baristas editing at once on real phones).

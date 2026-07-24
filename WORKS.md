# WORKS.md — what Portafile must do
Updated 2026-07-24 (3rd run) · Run: `/still-works` (add `live` after a deploy)

The feature checklist and the blast-radius map. `CLAUDE.md` holds the *gotchas* (why the
code is shaped the way it is); this file holds *what must still be true for a user*.

## Shared foundations — what breaks what

| If this changes | These break |
|---|---|
| `product/app.js` | the entire app — it's one file, there is no module boundary |
| `brand/brand.css` | every page's palette and type: site, product, admin |
| localStorage prefix `portafile.v1*` | all saved shop data. A renamed key silently wipes every existing user, and the revocation/delete wipes are written against this exact prefix (`lead*` is deliberately excluded on revoke, included on delete) |
| `api/state.js` | sync, staff links, revocation, founder delete, usage-date stamping |
| **the demo seed** (15 recipes / 13 ingredients / 3 dial-ins / 1 barista / "Demo Espresso Bar") | the `DEMO` constant in `api/metrics.js` is a hard-coded copy of it. Change the seed and every adoption percentage silently lies — no error, just wrong numbers |
| `vercel.json` | CSP (inline `<script>` dies on deployed pages), the CORS pin (the localhost:4322 dashboard's fetches), and the `/` → `/site/index.html` rewrite |
| `.vercelignore` | what gets published at all — a new top-level directory silently doesn't deploy |
| `esc()` in `admin/dashboard.html` | XSS safety of every dashboard table; feedback and lead text reach HTML through it |
| page copy in `site/` | `health_check.py` matches marker strings and emails a false alarm if they move |
| tab ids in `product/index.html` (`recipes`/`prices`/`dialin`/`training`/`print`) | every verify suite's selectors |

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
- [ ] Founder delete: staff devices wipe fully, owner keeps its local copy · auto: `verify-sync.js`
- [ ] Founder delete sends the shop's OWN browser back to the signup gate — even a seeding
      owner whose device has no `synced` marker and whose tombstone lost its ownerHash
      auto: `verify-sync.js` (the five `delete:` cases; three fail on pre-fix code)

### App — access gate and feedback
- [ ] First-time visitor (no `?k=`) gets the signup form; it unlocks and never returns
      auto: `node product/verify-gate.js` (11 checks)
- [ ] ? → Send feedback sends, validates "pick 👍 or 👎 first", and survives a server error
      prove: drive the modal with the network stubbed to fail

### Site
- [ ] Landing page loads at `/` with scroll-reveal animations actually running
      prove: load `/`, scroll, watch sections appear (see the headless traps below)
- [ ] Privacy and Terms load and say what the product actually does
      prove: `/site/privacy.html` mentions aggregate counting AND usage dates

### Founder dashboard (local only, http://127.0.0.1:4322/admin/dashboard.html)
- [ ] Load metrics fills the tiles, the per-cafe table and feedback from live production
- [ ] Phase-0 kill gates read those live metrics: gate 1 shows the higher of ledger vs live
      (neither is a superset), gate 3 keeps its hand-typed number and shows the live one
      beside it labelled *any use* — the usage log stores dates, never which feature
      prove: gates read 0/15 before Load metrics, 1/15 + "live: 1 of 2 synced" after
- [ ] Per-cafe table sorts stalest-first (sorted server-side in `api/metrics.js`) and flags
      14+ days quiet in red
- [ ] Hostile text in any live-loaded field renders as literal text, never HTML
- [ ] Ledger, email list, signups and labels survive a reload (localStorage `portafile-admin-v1`)

### Production invariants (`live` mode — `python3 health_check.py` covers all 8)
- [ ] `/api/metrics` with no key → 401 · `/api/state?k=0×40` → 404 `unknown-key`
- [ ] **`/admin/dashboard.html` → 404.** The dashboard has no auth; it must never deploy.

## Known traps — bugs that already escaped once
- Relative asset URLs on the landing page 404 at `/` (root is a rewrite) — use `/site/...`.
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
- The 30s poll freezes in a background tab; the app re-pulls on `visibilitychange`→visible
  and `online`. That focus-pull is guarded by `!syncPushT` so it can't overwrite an edit
  still inside its 800ms save debounce (`smoke.js` observes both sides).
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

# HANDOFF — the four queued Training tasks are built, verified and LIVE

**Updated 2026-07-27 (second session that day).** Project: `/Users/ethanyap/portafile`. Owner: Ethan
(college student, learning developer). You are picking this up cold.

> **All four approved follow-ups (old §5.1–5.4) are DONE, committed as `8b465f1` and deployed to
> production.** Verified locally and again against `https://portafile.vercel.app/product/` after the
> deploy. Do not rebuild them. §6 (gotchas), §9 (how to work with Ethan) and §10 (machine warnings)
> below are unchanged and still load-bearing.
>
> **Do not confuse this with `.handoff`** (the dotfile beside it) — a separate, already-resolved
> 2026-07-25 security handoff marked ✅ RESOLVED. Leave it alone.

---

## 1. TL;DR

**Shipped and live:** the training-step description now also renders in the Sign-offs column
(read-only), a step's day is editable after it was added, the on-screen path is sorted by day so it
matches the printed pack, and staff (`?k=`) devices get the path read-only.

- Commit `8b465f1` on `main`. **Not pushed to origin** — `git push` is Ethan's to run, and it does
  NOT deploy this project (`vercel deploy --prod --yes` does, and it has already run).
- `guide/Portafile-Guide-EN.pdf` was missing from the working tree at session start; restored with
  `git checkout --` (byte-identical, `guide-en.html` had not changed since it was built). **Ethan has
  not yet said whether he deleted it on purpose — ask him.**
- **Production still holds one shop and two lead records** — `Tester Shop`, his own email, created
  2026-07-27 10:34 UTC, from his own hand-testing that morning. He has NOT answered whether to clear
  it. Do not delete it on your own. Commands are in §4b.
- Cost: **$0.** No new service, account, dependency or external request.

---

## 2. What was built and how it was proved

| Where | What changed |
|---|---|
| `product/app.js` `pathOrder()` | new: returns `S.path` INDICES sorted by day, then array position. Mutates nothing, so synced and legacy shops need no migration |
| `viewTraining()` | both columns iterate `order`; day badge is an `<input type=number>` for owners and a `<span>` for staff; `↑↓×`, the add-step row and the editable fields are owner-only |
| Sign-offs checklist | renders `p.note` as `.cknote` under the label, read-only |
| the `input.note` handler | now hand-patches the Sign-offs cell (`textContent`) instead of leaving it stale |
| the `.day input` handler | clamps 1–9, then `save(); render()` — the re-sort IS the point |
| `product/styles.css` | `.pathlist .day input` (spinner-less, reads as part of the badge), `.checklist .cknote` |
| `product/i18n.js` | one new string + its European-Portuguese translation |

**The bug found and fixed mid-session** (it is now a `CLAUDE.md` gotcha and a `WORKS.md` trap): the
description saves on blur *without* `render()` on purpose — a re-render drops focus when the owner
tabs down the list. That was harmless while the field had one view. Adding a second view made it
stale until an unrelated click refreshed the page. Caught by a test timing out on a node that never
appeared, not by reading the diff.

**Suites, all green this session:** `product/verify.js` (20, includes the new 4b block),
`verify-gate.js` (16, includes the staff-lock checks), `verify-sync.js` (64), `verify-pt.js` (65,
includes note-veto and day-veto), `verify-killpass.js`, `verify-api.mjs`, `verify-metrics.mjs`,
`verify-i18n.mjs` (15 checks / 219 translations), `verify-site.js` (37). Plus a 20-check edge pass
(empty path, single step, day 0 / 99 / empty, a step with no `day` at all, clearing a description)
and a 6-check pass against live production after the deploy. **The `demoSig` veto test was proven to
bite** by temporarily removing `p.note` from the fingerprint and watching it fail.

---

## 3. Verified state

Re-checked by command immediately before this file was written.

| Fact | Value | How known |
|---|---|---|
| Repo / branch | `/Users/ethanyap/portafile` / `main` | — |
| Last commit | `8b465f1` | `git log` |
| Unpushed | **1 commit** (`8b465f1`) — Ethan pushes | `git log origin/main..HEAD` |
| Deployed this session? | **Yes** — `vercel deploy --prod --yes`, ready | deploy output |
| `https://portafile.vercel.app/product/` | serves the new `pathOrder`/`cknote` code | `curl` + a driven browser |
| `/admin/dashboard.html` | **404 — correct**, the no-auth dashboard must never deploy | HTTP probe |
| Production Blob store | **1 shop, 2 lead records**, unchanged before and after the deploy | `GET /api/metrics` with the admin header |
| Admin key | `.admin-key` in repo root, gitignored. **Never echo its contents** | read via `tr -d '\n'` only |
| Cost of everything | **$0** | by construction |

---

## 4. Decisions still open — ask him, do not act alone

### 4a. The test data in production

`Tester Shop` / `43a9a8e8099d2c9d119b0ce389a56975e90327c2` / `ethankw.yap@gmail.com`, created
2026-07-27 10:34:35 UTC, lead `ts` values `1785148459345` and `1785148471418`. It reads as his own
hand-testing, not a customer — but **he has not confirmed, so do not delete it.**

Shop (also removes the usage-activity blob):

```
curl -s -X DELETE -H "x-portafile-admin: $(tr -d '\n' < .admin-key)" \
  -H "x-portafile-shop: 43a9a8e8099d2c9d119b0ce389a56975e90327c2" \
  "https://portafile.vercel.app/api/state"
```

Leads are separate — one DELETE per record, by `ts`:

```
curl -s -X DELETE -H "x-portafile-admin: $(tr -d '\n' < .admin-key)" \
  "https://portafile.vercel.app/api/lead?ts=1785148459345"
```

Confirm with several reads (the blob index lags deletes). **`created` from `/api/metrics` is
`owners.created`, NOT the lead `ts`.** If a DELETE curl gets blocked by a permission classifier, hand
Ethan the exact one-line command to run himself with a `!` prefix rather than routing around it.

### 4b. `guide/Portafile-Guide-EN.pdf`

It had vanished from the working tree without any session deleting it; restored from git this
session. **Tell him it was missing** — he may have deleted it deliberately. `node guide/render-pdf.js`
re-renders every `guide/*.html` and re-checks 12 button labels if it ever needs rebuilding.

### 4c. Push

`8b465f1` is committed but not on `origin/main`. He runs pushes himself.

**Three things are settled and must NOT be reopened:** paid tiers stay in US dollars on `/pt`, GDPR
stays consciously deferred, and the Portuguese work stays as shipped.

---

## 5. The next task

**UNSPECIFIED — ask him. Do not invent the next feature.** He likes being offered 2–3 concrete
options rather than an open-ended "what do you think?"

Known open threads live at the end of `PROGRESS.md`; the loudest is that the launch film still says
**"No server"**, false since sync shipped 2026-07-17.

---

## 6. Gotchas

**From this session, first:**

- **`demoSig()` decides whether a language switch may destroy the shop's data.** Any new
  user-editable field must be added to it in the same commit, or a shop whose only work lives in that
  field reads as pristine and gets erased. `product/app.js`. This is written into `CLAUDE.md` as a
  corollary to the oat-milk bug, and `verify-pt.js` now proves both `p.note` and `p.day` veto the
  swap — remove either from the fingerprint and those checks fail.
- **The training path renders in `pathOrder()` order, not array order** — day ascending, then array
  position within the day, so the screen matches the print pack (which groups by day). It returns
  INDICES and mutates nothing. `↑↓` swap the DISPLAY neighbour and only inside one day; a step moved
  to another day joins that day at its HEAD (the tiebreak is array position). **Both the path column
  and the Sign-offs checklist must iterate `order`, never `S.path`**, or the two columns disagree.
- **CORRECTED (this replaces the previous session's version of this note).** The previous handoff
  said an inline field saving on `change` "must not call `render()`, and that is harmless because
  nothing else on screen reads `p.note`." The second half stopped being true the moment the
  description also appeared in the Sign-offs column — and it shipped stale for one session because of
  it. The rule now: `input.note` still skips `render()` (a re-render drops focus when the owner tabs
  down the list), so **the handler hand-patches the Sign-offs cell itself** with `textContent`, never
  `innerHTML`. The `.day input` handler is the opposite case and DOES `render()`, because the re-sort
  is the point. **Adding a second view of a field means revisiting every handler that writes it.**
- **`class="note"` is used twice in the app** — the training-path description and the dial-in log's
  note field. Both the CSS and the event wiring are scoped with `.pathlist` on purpose, and the
  wiring is `.pathlist input.note` specifically, because staff render the description as a `<div>`.
  Do not widen either selector to a bare `.note`.
- **Staff (`?k=`) get the training path read-only** — same `staffView()` predicate as the Margin
  Report. Say plainly what it is: **visibility, not a security boundary.** A staff device holds the
  whole shop in `localStorage` either way, exactly like the price table.
- **A print-pack change cannot be screenshotted from the normal screen.** The pack lives in a
  print-only stylesheet, so a plain screenshot shows the app underneath and looks like nothing
  happened. Use `page.emulateMedia({ media: 'print' })` before the screenshot, or assert on the DOM.

**Carried forward — language, i18n, seeds:**

- **The English string IS the dictionary key** (`product/i18n.js`, gettext-style). A missing
  translation silently renders readable English. Editing an English string in `app.js` orphans its
  translation with no error; one English word needing two Portuguese words collides on one key and a
  duplicate JS key silently keeps only the last (this really happened with "Roaster"). Disambiguate
  as `t('Roaster|role')`. **`node verify-i18n.mjs` is the only thing that catches any of it.**
- **`product/i18n.js` must load before `app.js`.** `app.js` calls `t()` during first render, so a
  missing `i18n.js` is a **blank app**, not a degraded translation. `health_check.py` probes it.
- **Language lives in `S.shop.lang`, so it SYNCS** to staff devices. Default is browser detection,
  which is why the en-US Playwright suites pass untouched.
- **Currency follows language** (en→USD, pt→EUR) via one `Intl.NumberFormat`. `Intl` emits a
  NON-BREAKING space in "1,22 €" — match `/\d,\d\d\s*€/`, never a literal space.
- **`api/metrics.js`'s `matchesADemoSeed` is NOT safe to reuse for anything destructive.** It ignores
  dial-ins, baristas and sign-offs. Same question as `demoSig()`, different consequence, different
  threshold.
- **Adding a language means editing `api/metrics.js`'s `DEMOS` array too**, or every shop in that
  language reads as "customised" the moment it opens.
- **Signup role `<option value>`s stay English** while labels translate; the value is POSTed and
  counted, so translating it would split "Owner" and "Proprietário" into two buckets.
- **Never pattern-match over `JSON.stringify(seed())`.** A selftest that regexed the serialised shop
  for imperial units matched random base-36 `uid()`s (`yykz6oz` reads as "6 oz"): a measured **0.99%**
  false-failure rate. If any suite fails once and passes on retry, **measure the rate** before
  dismissing it.
- **Both seeds are hand-written**, so the likeliest bug is a recipe naming an ingredient not in the
  list — `I[name]` is `undefined`, the drink silently costs nothing, nothing throws. `?selftest=1`
  asserts every item in BOTH seeds resolves.

**Carried forward — testing and toolchain:**

- **Never run bare `npx playwright ...`.** The suites `require()` Playwright from a pinned npx cache
  path; any bare `npx playwright` command silently upgrades that cache and breaks every suite with
  "Executable doesn't exist", which looks like broken tests rather than a broken toolchain. Fix:
  `npx playwright install chromium`. To drive a browser ad hoc, launch with `{ channel: 'chrome' }`.
- **Grep for `^FAIL`, never for "fail".** Several suites print "failed"/"failure" as part of
  **passing** negative tests. `verify-sync.js` takes over a minute — do not kill it early and read
  that as a failure.
- **`timeout` does not exist on macOS.** `timeout 300 node verify-pt.js` fails with
  `command not found` and looks like a broken suite. Use a background run instead.
- **`verify-sync.js` does not test the real `api/state.js`** — it routes to a JS mirror inside the
  test file. `verify-api.mjs` is the one that executes the real handlers.
- **Playwright `addInitScript` re-runs on every navigation**, restoring a seed the test just wiped;
  `verify-sync.js` guards this with `pf-test-stopseed`.
- **Headless Chromium reports every tab as `visible`**, and `page.bringToFront()` doesn't change it.
- **`#shopName` saves on `change`, not `input`.** A test that fires `input` quietly "passes".
- **`verify-site.js` needs `python3 -m http.server 8899` running in the repo root first** — the pages
  load `/site/site.css` by absolute path.
- **Hand-testing in a real browser writes real records; a private window makes it worse.** `app.js`
  skips the lead POST when `navigator.webdriver` is true, so the suites never pollute the store. A
  human in a normal window meets the gate; a human in a *private* window has no saved lead record
  suppressing it, so **every private-tab test is a fresh signup**. `api/lead.js` stores no IP and no
  user-agent by design, so attribution is forensic only: fixture-looking strings and the record `ts`
  against `git log`. Keep test values obviously fake. Adding `?k=` to the URL skips the gate and is
  the safe way to hand-test.
- **A screenshot of a wrong-looking screen is not a diagnosis.** The 2026-07-26 "missing Portuguese
  translations" report turned out to be an English demo *shop* under a Portuguese *interface*.
  Reproduce before believing a bug report — including Ethan's.
- **The Data menu hides its entire sync section on `file://`** (`app.js:774`). A `file://` probe looks
  like sync is missing. It is present over http/https.

**Carried forward — the expensive ones, do not renegotiate:**

- **`CLAUDE.md` in this repo is the real gotcha list — read it fully before editing `api/state.js`.**
  The eventual-consistency rules ("never build an authorization check on a read", "revocation is a
  value comparison, never a missing blob", "a 404 never means revoked") were expensive and are not
  negotiable.
- **Vercel Blob is eventually consistent.** `list()` lags writes and deletes by seconds — fine for
  counting, never for resolving a known path or deciding authorization.
- **Relative URLs on the landing pages 404 at `/`** because root is a rewrite, and `/pt` is a second
  rewrite with the same hazard. Everything is absolute; do not reintroduce a relative one.
- **CSP blocks all inline `<script>` on deployed pages.** `admin/dashboard.html` uses inline script
  and `onclick=` and is safe only because it never deploys. Never move that pattern into `site/` or
  `product/`.
- **`.vercelignore` is an allowlist** (`/site`, `/product`, `/video`, `/api`, `vercel.json`,
  `package.json`). A new top-level directory is invisible to Vercel unless added. **Do not add
  `guide/` or `admin/`** — both are internal on purpose.
- **`vercel.json` pins CORS to the prod origin except under `/api/`** — the localhost:4322 dashboard
  depends on that exception, and the admin key is a **header** (`x-portafile-admin`), never a query
  string, which makes those fetches preflighted.
- **Dial-in values are not guaranteed to be numbers.** Always `esc(dec(x))`, never `dec(esc(x))` —
  at every render site, not just the one a bug report names. `verify-killpass.js` covers the hostile
  case; re-run it after touching any dial-in render site.
- **Never gate a share link.** `gate()` skips `?k=` staff links deliberately; a form on top of a
  loaded shop is what made baristas report sharing as broken.
- **`health_check.py` runs daily at 15:00 UTC** and emails **every run, pass or fail** — a missing
  email is itself the alarm. If you change page copy, update its expected marker strings or he gets a
  false alarm. Running it locally raises on the *email* step because `GMAIL_ADDRESS` /
  `GMAIL_APP_PASSWORD` live in GitHub secrets, not on his Mac — **that traceback is expected locally.**
- **Do not load-test the GET rate limiter from his machine** — it makes `health_check.py` report a
  false outage for up to 10 minutes.
- **Do not link the launch film from anything Portuguese**, and do not treat it as current:
  `video/portafile-launch.mp4` is English-only and still says **"No server"** out loud, false since
  sync shipped 2026-07-17.

---

## 7. Reboot / persistence

Nothing here depends on a running process; a reboot loses no work that is on disk in
`/Users/ethanyap/portafile`.

**The weak link:** this session's changes are **uncommitted working-tree files**. All commits through
`047418e` are pushed to `origin/main`, so everything older is safe. The scratch verification script
lives in `/private/tmp/...` and **will not survive a reboot** — that is why task 5.1 folds its checks
into `product/verify.js` (the launch film's original ffmpeg command was lost exactly that way).

The deployed site is independent and would survive anything local, but it does **not** contain this
session's work.

---

## 8. Don't redo

- The step-description feature itself. Built, verified in a real browser, documented.
- The `demoSig()` fix for it. Both directions are proven — a note-only edit vetoes the reseed, an
  untouched demo still reseeds.
- `PROGRESS.md` for 2026-07-27 — the entry exists. Extend it; do not add a second heading for the date.
- The `WORKS.md` line and the `CLAUDE.md` corollary — both written.
- The Portuguese translation, seed, landing page, legal pages, auto-reseed and the Portuguese guide —
  all done, committed, pushed and (except the guide) deployed.
- Don't "fix" the English demo shop — it is intentionally 15 drinks, dollars, °F.
- Don't convert the paid tiers to euros, and don't draft GDPR text. Both consciously deferred.
- Don't touch `.handoff` (the resolved 2026-07-25 security handoff). `BUILD-LOG.md` is frozen.
- Don't add a phone-home to reach browsers that never synced. That is a property of a no-accounts
  product, not a bug. Ethan has repeatedly chosen dropping a metric over tracking a user.

---

## 9. How to work with Ethan (durable)

College student, learning developer. Not fluent in git, terminals or deployment, but learning —
teach while doing. Typos are common; infer intent and proceed rather than asking about an obvious one.

- **Zero cost, always.** Cost questions get certainty, never "probably free" — name every service and
  whether it can ever bill him.
- **Terminal steps: numbered, ONE command per step**, say what he should see, then wait for his
  confirmation or screenshot before the next.
- **He runs deploys, pushes and destructive curls himself**, typing the command with a `!` prefix.
- **A question is not a work order.** This session opened with "what does D1 D2 mean?" — the
  deliverable was an explanation, before any code. When he asks for a change, make it without asking
  permission at each step.
- **Verify before saying done** — exercise the real feature, not just the tests. He asks for this
  explicitly and notices when it is skipped.
- **Lead with the outcome.** Short replies ("yes", "proceed", "yes push") mean: do exactly the
  pending step, nothing more.
- **Deploys, deletes and anything outward-facing: confirm first.** Approval is scoped to that one
  action, not to future ones.
- **He likes concrete follow-up options** at the end of a feature (2–3, specific), not open-ended
  "what do you think?" — this session's four queued tasks came from exactly that.
- **Ponytail mode is on**: smallest solution that works; deliberate shortcuts marked with a
  `ponytail:` comment naming the ceiling and the upgrade path.
- **`PROGRESS.md` is required.** At the end of any session that changed something real, append or
  extend that day's entry, unprompted, written for a founder (what shipped, why it mattered to the
  business, what broke and what it taught). One `##` per date, newest at the bottom, "Open threads"
  kept current.
- **After a milestone**, also update the repo `CLAUDE.md` gotchas and the auto-memory at
  `~/.claude/projects/-Users-ethanyap-portafile/memory/`.

---

## 10. Machine-level warnings (these outlive this task — do not drop them)

1. **Never trust System Settings → Storage for free space** — it counts iCloud-purgeable files and has
   been wrong by ~50 GB. Use `df -h /`. Currently **23 GB free of 228 GB**.
2. **Do not touch the `flowise-main` or `open-webui` Docker containers.** Both verified running right
   now (`flowise-main` up 3 weeks, `open-webui` up 6 days, healthy) — a **separate live project**.
3. `Docker.raw` is ~13 GB and does not shrink on prune.
4. **Do not touch `~/Library/Application Support/Claude/vm_bundles`** (~6.8 GB) — Claude Desktop's VM.
5. **Never suggest "Keep Messages: 1 Year"** — it permanently deletes messages across all his devices.
6. Claude Code dies when Wi-Fi drops (`ENOTFOUND`). For an offline test, hand him ONE self-contained
   checklist he can run unattended.
7. `~/Desktop/Claude Projects/` holds **stale 2026-06-27 backups** — never edit them (only
   travel-planner there is live).
8. Before any task touching Flowise, LaunchAgents, travel-planner deploys, or multi-project audits,
   read `~/wargame_master.md` and follow it instead of improvising.
9. **No `pdftotext`, `poppler`, `pypdf`, `PyMuPDF` or PyObjC/Quartz on this machine**, and Spotlight
   returns null for PDF text. Rendering HTML *to* PDF works (headless Chromium via the pinned
   Playwright); reading an existing PDF's text does not — which is why the original
   `Portafile-Guide.pdf` (a Messages attachment, not in this repo) can never be corrected and
   `Portafile-Guide-EN.pdf` supersedes it.

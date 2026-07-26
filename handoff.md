# HANDOFF — language switch now reseeds the demo; Portuguese guide PDF exists

**Written 2026-07-26, ~19:50 UTC.** Project: `/Users/ethanyap/portafile`. Owner: Ethan (college
student, learning developer). You are picking this up cold. Every fact below was re-checked by a
command immediately before this file was written, unless explicitly labelled otherwise.

> **This file replaces the earlier 2026-07-26 handoff** ("Portafile is live in European Portuguese").
> Everything hard-won in it — gotchas, machine warnings, working-style notes — is carried forward
> here in §5, §8 and §9. Nothing was discarded.
>
> **Do not confuse this with `.handoff`** (the dotfile in this same directory). That is a separate,
> already-resolved handoff from 2026-07-25 about four security fixes, marked ✅ RESOLVED at its top.
> **Leave it alone.** `handoff.md` — this file — is the live one.

---

## 1. TL;DR

Two things were built this session and both are **finished and verified locally. Nothing is
committed and nothing is deployed.**

1. **Auto-reseed on language switch** (`product/app.js`). Switching the language picker now also
   swaps the demo *menu* — but only while the shop is still the untouched demo. Any of the owner's
   own work vetoes it.
2. **A Portuguese guide PDF** for the Lisbon cafés — new `guide/` directory holding the HTML source,
   a render script and the output PDF. The old English `Portafile-Guide.pdf` had **no source in the
   repo at all**; it was generated outside it.

- **All nine verify suites pass** — run this session, not remembered. `verify-pt.js` went 53 → 59.
- **Working tree is dirty on purpose**: `product/app.js`, `verify-pt.js` modified; `guide/` untracked.
- **Nothing was deployed and nothing touched production data deliberately** — but see the warning
  immediately below, because production data *did* change.
- **`PROGRESS.md` has NOT been updated for this session's work yet.** It still ends at the Portuguese
  launch entry. Extend the existing `## 2026-07-26` heading; do not add a second one for the date.
- **Two decisions are open and are Ethan's** — see §4. Do not act on either alone.

> ⚠️ **Ethan's own hand-testing wrote two real signup records into production today.** Nobody did
> anything wrong; this is the documented hazard in §5. It changes the cleanup in §4 from one lead to
> four. Details in §4 — read it before touching the founder dashboard or drawing any conclusion from
> the signup count.

---

## 2. What was accomplished

**Where this session started.** Ethan opened the app, switched the language picker from English to
Portuguese, saw English ingredient names, recipe instructions and training steps, and reported it as
missing translations. He asked whether the fix was to *ship fewer demo drinks* so there'd be less to
translate.

**The premise was wrong, and finding that out was most of the value.** The investigation, in order:

- `node verify-i18n.mjs` → 15/15, 217 translations. `node verify-pt.js` → 53/53 at the time,
  including "a pt-PT browser gets the Lisbon seed."
- Read the Portuguese seed (`product/app.js:107-200`) directly: all 19 drinks, every ingredient,
  every recipe step, the dial-in notes and the whole training path were **already fully Portuguese.**
- Scanned `app.js` for English UI text never wrapped in `t()` — the one class of bug `verify-i18n.mjs`
  structurally cannot catch. Found nothing real; the sync-badge strings that looked bare are passed
  through `t()` via a variable at `app.js:295`.
- **Reproduced it in a real browser**, which settled it: an `en-US` browser seeds the *English* demo;
  flipping the picker to PT translates the chrome and flips prices to euros but leaves the shop's own
  recipes in English. That is deliberate and documented at `app.js:1018-1020` — a real café's typed-in
  drinks must never be rewritten by a language switch.

So: **not a translation gap, and cutting demo drinks would have fixed nothing** while making the
Lisbon pitch weaker. He was told that, given options, and chose to build the fix below.

**Built 1 — auto-reseed (`product/app.js`, the `#langSel` handler).** On a deliberate language
switch, if the shop is still the pristine demo, the whole seed is replaced with the other language's
demo, preserving the tab the user was on. A `demoSig()` content fingerprint decides "pristine": shop
name, COGS target, ingredient names/units/costs, recipe names/categories/sizes/prices/steps/quantities,
beans, dial-ins, baristas, the training path, and whether any sign-offs exist. Ids and timestamps are
excluded because `seed()` generates fresh random ones every call.

**This is deliberately stricter than `matchesADemoSeed` in `api/metrics.js:54`,** and the reason is
worth keeping: that function only compares shop name plus recipe and ingredient counts, and it
ignores dial-ins, baristas and sign-offs entirely. That is fine for its job — classifying shops on
the founder dashboard, where being wrong just skews a number. Here the consequence is data
replacement. Under the looser rule, a café that left the demo menu alone but logged a week of real
dial-ins would have had them silently destroyed by a language switch. `verify-pt.js` now covers that
exact case.

**Built 2 — the Portuguese guide.** New `guide/` directory:

| File | Role |
|---|---|
| `guide/guia-pt.html` | The source. European Portuguese, A4 print CSS, brand tokens inlined |
| `guide/render-pdf.js` | `node guide/render-pdf.js` → renders every `guide/*.html` to PDF |
| `guide/Portafile-Guia-PT.pdf` | The output Ethan sends. **2 pages**, 276 KB |

Content is adapted from `ONBOARDING.md`, not translated from it: 19 Portuguese drinks instead of 15
American ones, costs per gram and per ml, and an explicit line that the starting costs are Lisbon
wholesale **estimates** rather than real invoices. Section 1 is the language switch, deliberately
first — if the app opens in English, nothing else in the guide is followable. The pricing section
says plainly that the tiers are placeholder figures still in US dollars, matching the settled
decision in §4.

`render-pdf.js` also **verifies every button name the guide mentions against `product/i18n.js`** on
each render (12 labels, all confirmed) and exits non-zero if one is missing. This was tested by
deliberately inserting a fake button name and watching it fail — it is not a check that only ever
passes.

**Road not taken — do not redo these:**

- Shipping fewer demo drinks. Rejected with evidence: the Portuguese seed was already complete.
- Putting ingredient and recipe text into the i18n dictionary (200+ keys). It breaks the moment a
  real café types its own drink names, which is the entire reason shop data is not translated.
- Translating or modifying the English `ONBOARDING.md` or the English `Portafile-Guide.pdf`. Both are
  untouched. Whether the English guide should gain the same language note is **open** (§4).
- Reading the original English PDF's exact text. It uses subset CID fonts and no local tool can
  extract it cleanly; `ONBOARDING.md` is the authoritative source for that content anyway.

---

## 3. Verified state

Re-checked by command immediately before this file was written.

| Fact | Value | How known |
|---|---|---|
| Repo | `/Users/ethanyap/portafile` | — |
| Branch / last commit | `main` / `8a4e224` | `git log` |
| Working tree | **Dirty, deliberately:** `product/app.js` and `verify-pt.js` modified; `guide/` and `.handoff` untracked | `git status` |
| Pushed to a remote? | **No. 5 commits are local only.** `git push` does NOT deploy this project | `git log origin/main..HEAD` |
| Deployed this session? | **No.** Live site is still the previous deploy | no deploy command was run |
| Deploy command | `vercel deploy --prod --yes` from repo root | `CLAUDE.md` |
| `https://portafile.vercel.app/` | **200** | HTTP probe |
| `/pt` | **200** | HTTP probe |
| `/product/` | **200** | HTTP probe |
| `/site/site.css`, `/product/i18n.js` | **200** | HTTP probe |
| `/admin/dashboard.html` | **404 — correct**, the no-auth dashboard must never deploy | HTTP probe |
| Founder dashboard | `http://localhost:4322/admin/dashboard.html` — port 4322 listening (LaunchAgent) | `lsof` |
| Local test server | **none running**; port 8899 free | `lsof` |
| Admin key | `.admin-key`, present, gitignored. **Never echo its contents** | file read via `tr -d` only |
| Pinned Playwright | present at `~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright` | dir exists |
| Disk | **23 GB free of 228 GB** | `df -h /` |
| Docker | `flowise-main` up 3 weeks, `open-webui` up 5 days (healthy) — **a different project, do not touch** | `docker ps` |
| Cost of everything | **$0.** Static files + existing free Vercel tier. No new service, account, dependency or external request was added this session | by construction |
| **Blob store** | **1 shop, 4 lead records — all Ethan's own.** See §4 | `/api/metrics` + `/api/lead`, this session |

### Test suites — all nine green, all run this session

Run from the repo root. `verify-pt.js` grew from 53 to 59 checks.

| Command | Result | Needs |
|---|---|---|
| `node verify-i18n.mjs` | **PASS** (15 checks, 217 translations) | nothing |
| `node verify-metrics.mjs` | **PASS** (0 FAIL) | nothing |
| `node verify-api.mjs` | **PASS** (0 FAIL) | nothing |
| `node product/verify.js` | **PASS** (0 FAIL, in-page selftest 27) | Playwright |
| `node product/verify-killpass.js` | **PASS** | Playwright |
| `node product/verify-gate.js` | **PASS** | Playwright |
| `node product/verify-sync.js` | **PASS** | Playwright |
| `node verify-pt.js` | **PASS (59)** | Playwright |
| `node verify-site.js` | **PASS (37)** | Playwright **and** `python3 -m http.server 8899` in the repo root first |
| `node guide/render-pdf.js` | 12/12 button labels confirmed, 2-page PDF | Playwright |

`verify-sync.js` takes over a minute — do not kill it early and read that as a failure. Several
suites print lines containing "failed"/"failure" as part of **passing** negative tests.
**Grep for `^FAIL`, never for "fail".**

**Honesty note.** The `/still-works` skill has **not** been invoked as a skill, this session or the
previous two. What exists instead is the nine-suite sweep above plus browser reproduction. The repo's
standing rule is to run it before a deploy; if Ethan deploys, run it first and tell him it had not
been run before.

---

## 4. Decisions still open — ask him, do not act alone

### 4a. Commit and deploy?

The auto-reseed and the guide are finished and green but **uncommitted and undeployed**. Ethan runs
deploys himself. Nothing about the work forces a deploy — the guide is a file he sends by text, and
the auto-reseed only matters to someone who switches language in the live app.

### 4b. His own test data is in the production store, and it grew today

Currently in the Blob store: **one shop** and **four lead records**, all his.

| When (UTC) | Shop name | Email | Note |
|---|---|---|---|
| 2026-07-26 13:56:08 | `Tester` | ethankw.yap@gmail.com | earlier testing |
| 2026-07-26 13:56:10 | `Tester` | ethankw.yap@gmail.com | duplicate 2s later — the shopId-linking re-POST |
| 2026-07-26 19:43:56 | `Portugal` | ethantech1121@gmail.com | **written this session** |
| 2026-07-26 19:48:08 | `Portugalll` | ethankw.yap@gmail.com | **written this session** |

Shop: `ed5bc09a9ae71722332ea48111ac3b883dd0ffc1`, name `Tester`, created 13:56 UTC.

The last two appeared while Ethan was hand-testing the language switch **in a private tab**, which
means he met the real signup gate and filled it in. This is precisely the hazard in §5: the verify
suites are `navigator.webdriver` and skip the gate, but a human in a real browser is not, and a
private window has no prior lead record to suppress the form. No harm done — but it is why the
signup count moved without a customer existing.

**Why it matters:** he is about to send the app to two real Lisbon cafés. Until this is cleared, the
founder dashboard mixes his own testing in with his first real signups and he cannot tell them apart.
Note `ethantech1121@gmail.com` is a *second* address of his, so "is it my email?" is not a reliable
filter — go by timestamp against `git log`.

**He was offered this cleanup and has not answered. Ask him; do not delete his data on your own.**

Shop deletion (also removes its usage-activity blob):

```
curl -s -X DELETE -H "x-portafile-admin: $(tr -d '\n' < .admin-key)" \
  -H "x-portafile-shop: ed5bc09a9ae71722332ea48111ac3b883dd0ffc1" \
  "https://portafile.vercel.app/api/state"
```

Lead records are **separate** and are not removed by that call — one DELETE per record, by `ts`:

```
curl -s -X DELETE -H "x-portafile-admin: $(tr -d '\n' < .admin-key)" \
  "https://portafile.vercel.app/api/lead?ts=1785095288587"
```

The four `ts` values are `1785074168073`, `1785074170758`, `1785095036111`, `1785095288587`. Confirm
deletions with several reads — the blob index lags. **The `created` timestamp shown by `/api/metrics`
is `owners.created`, NOT the lead `ts`** — do not pass it and assume it worked.

**Ethan may need to run these himself.** A `DELETE` curl from the agent was blocked mid-session by a
permission classifier twice in an earlier session. If that happens, hand him the exact one-line
command to run with a `!` prefix rather than routing around it.

### 4c. Should the English guide get the same language note?

`ONBOARDING.md` and the English PDF were left untouched. Offered, not answered.

**Three things are settled and must NOT be reopened:** paid tiers stay in US dollars on `/pt`, GDPR
stays consciously deferred, and the Portuguese work stays as shipped.

---

## 5. Gotchas

**The one that actually bit this session, first:**

- **A screenshot of "English text in a Portuguese app" is not evidence of a missing translation.**
  It took a browser reproduction to see that the *data* was the English demo seed while the *chrome*
  was Portuguese. Two suites were already green and the seed was already fully translated. Reproduce
  before believing a bug report — including Ethan's.
- **Hand-testing in a real browser writes real records; a private window makes it worse.** `app.js`
  skips the lead POST when `navigator.webdriver` is true, so the suites never pollute the store. A
  human in a normal window meets the gate; a human in a *private* window has no saved lead record
  suppressing it, so every private-tab test is a fresh signup. Two landed today. `api/lead.js` stores
  no IP and no user-agent by design, so attribution is forensic only: fixture-looking strings and the
  record `ts` against `git log`. Keep test values obviously fake for that reason.
- **`timeout` does not exist on macOS.** `timeout 300 node verify-pt.js` fails with
  `command not found` and looks like a broken suite. Use a background run instead.
- **The Data menu hides its entire sync section on `file://`** (`app.js:774`). A probe of the local
  file shows only "Exportar cópia" and "Voltar à demonstração" and looks like sync is missing. It is
  present over http/https. Do not document the Data menu from a `file://` screenshot.

**New, from the auto-reseed work:**

- **`pristineDemo()` compares a content fingerprint, never `JSON.stringify(state)` directly.**
  `seed()` mints fresh random `uid()`s and `Date.now()`-based dial-in timestamps on every call, so a
  naive comparison never matches. `demoSig()` strips ids and timestamps deliberately.
- **`api/metrics.js`'s `matchesADemoSeed` is NOT safe to reuse for anything destructive.** It ignores
  dial-ins, baristas and sign-offs. Reusing it here would have thrown away real dial-in history on a
  language switch. Same idea, different consequence, different threshold.
- **Adding a language now means editing three places, not two:** the `seedXX()` function, the `DEMOS`
  array in `api/metrics.js`, and the language-switch path (which reseeds through `seed(to)` and so
  follows automatically — but the `verify-pt.js` counts of 15 and 19 drinks are hard-coded).
- **`verify-pt.js` used to assert the OPPOSITE of the new behaviour.** Its old check "switch keeps the
  shop data (still Portuguese recipes)" expected 19 cards after switching to English. That was
  correct before and is wrong now; it was rewritten, not deleted. If you change this behaviour again,
  that is the check that must move with it.

**Guide-specific:**

- **`guide/` does not deploy, and that is intentional.** `.vercelignore` is an **allowlist**
  (`/site`, `/product`, `/video`, `/api`, `vercel.json`, `package.json`). A new top-level directory
  is invisible to Vercel unless added there. Do not add `guide/` — it is an internal document.
- **The guide names buttons, so it rots silently when the app is renamed.** `render-pdf.js` checks
  all `<span class="btn">` labels against `product/i18n.js` and fails the render. Tab names and the
  `EN`/`PT`/`?` literals are allow-listed in `LITERALS` because they are not dictionary values.
- **The English `Portafile-Guide.pdf` has no source in this repo.** It lives only at
  `~/Library/Messages/Attachments/ca/10/75FFE127-8A58-4466-A78A-5B8BEA5C54B6/Portafile-Guide.pdf`.
  Its text cannot be extracted locally (subset CID fonts; no `pdftotext`, `poppler`, `pypdf` or
  Quartz on this machine, and Spotlight returns null). Treat `ONBOARDING.md` as its content source.
- **Do not link the launch film from anything Portuguese.** `video/portafile-launch.mp4` is
  English-only and still says **"No server"** out loud, false since sync shipped 2026-07-17.

**Portuguese / i18n (carried forward, still true):**

- **The English string IS the dictionary key** (`product/i18n.js`, gettext-style). A missing
  translation silently renders readable English. Editing an English string in `app.js` orphans its
  translation with no error; one English word needing two Portuguese words collides on one key and a
  duplicate JS key silently keeps only the last (this really happened with "Roaster"). Disambiguate
  as `t('Roaster|role')`. **`node verify-i18n.mjs` is the only thing that catches any of it.**
- **`product/i18n.js` must load before `app.js`.** `app.js` calls `t()` during first render, so a
  missing `i18n.js` is a **blank app**, not a degraded translation. `health_check.py` probes it.
- **Language lives in `S.shop.lang`, so it SYNCS** to staff devices. Default is browser detection,
  which is why the en-US Playwright suites still pass untouched.
- **Currency follows language** (en→USD, pt→EUR) via one `Intl.NumberFormat`. `Intl` emits a
  NON-BREAKING space in "1,22 €" — match `/\d,\d\d\s*€/`, never a literal space.
- **Signup role `<option value>`s stay English** while labels translate; the value is POSTed and
  counted, so translating it would split "Owner" and "Proprietário" into two buckets.
- **Never pattern-match over `JSON.stringify(seed())`.** A selftest that regexed the serialised shop
  for imperial units matched random base-36 `uid()`s (`yykz6oz` reads as "6 oz"): a measured **0.99%**
  false-failure rate. If any suite fails once and passes on retry, **measure the rate** before
  dismissing it.
- **Both seeds are hand-written**, so the likeliest bug is a recipe naming an ingredient not in the
  list — `I[name]` is `undefined`, the drink silently costs nothing, nothing throws. `?selftest=1`
  asserts every item in BOTH seeds resolves.

**Carried forward and still true:**

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
- **`vercel.json` pins CORS to the prod origin except under `/api/`** — the localhost:4322 dashboard
  depends on that exception, and the admin key is a **header** (`x-portafile-admin`), never a query
  string, which makes those fetches preflighted.
- **Dial-in values are not guaranteed to be numbers.** Always `esc(dec(x))`, never `dec(esc(x))`.
  `verify-killpass.js` covers the hostile case — re-run it after touching any dial-in render site.
- **Never run bare `npx playwright ...`.** The suites `require()` Playwright from a pinned npx cache
  path; any bare `npx playwright` command silently upgrades that cache and breaks every suite with
  "Executable doesn't exist", which looks like broken tests rather than a broken toolchain. Fix:
  `npx playwright install chromium`. To drive a browser ad hoc, launch with `{ channel: 'chrome' }`.
- **Playwright `addInitScript` re-runs on every navigation**, restoring a seed the test just wiped;
  `verify-sync.js` guards this with `pf-test-stopseed`.
- **`verify-sync.js` does not test the real `api/state.js`** — it routes to a JS mirror inside the
  test file. `verify-api.mjs` is the one that executes the real handlers.
- **Headless Chromium reports every tab as `visible`**, and `page.bringToFront()` doesn't change it.
- **`#shopName` saves on `change`, not `input`.** A test that fires `input` quietly "passes".
- **`health_check.py` runs daily at 15:00 UTC** and emails **every run, pass or fail** — a missing
  email is itself the alarm. If you change page copy, update its expected marker strings or he gets a
  false alarm. Running it locally raises on the *email* step because `GMAIL_ADDRESS` /
  `GMAIL_APP_PASSWORD` live in GitHub secrets, not on his Mac — **that traceback is expected locally.**
- **Do not load-test the GET rate limiter from his machine** — it makes `health_check.py` report a
  false outage for up to 10 minutes.
- **Never gate a share link.** `gate()` skips `?k=` staff links deliberately; a form on top of a
  loaded shop is what made baristas report sharing as broken.

---

## 6. Reboot / persistence

Nothing here depends on a running process. The guide, its source and the code changes are all files
on disk in `/Users/ethanyap/portafile`; a reboot loses nothing.

**The weak link is bigger than last session's.** Five commits are local-only and unpushed, **and this
session's work is not even committed** — `product/app.js`, `verify-pt.js` and the whole `guide/`
directory exist only as working-tree files. A disk failure loses all of it. The deployed site is
independent and would survive, but it does not contain any of this session's work.

Scratch scripts used for the investigation live in a session scratchpad and are disposable; the two
that matter (`guide/render-pdf.js` and the new `verify-pt.js` checks) are in the repo on purpose,
because the launch film's original ffmpeg command was lost exactly that way.

---

## 7. Don't redo

- The Portuguese translation, seed, landing page and legal pages — done, deployed, verified earlier.
- The investigation into "missing Portuguese translations." There were none. §2 has the evidence.
- The auto-reseed and its six new `verify-pt.js` checks. Built and green.
- The Portuguese guide. Built, rendered, visually reviewed at page level, label-checked.
- Don't "fix" the English demo shop — it is intentionally 15 drinks, dollars, °F.
- Don't convert the paid tiers to euros, and don't draft GDPR text. Both decided.
- Don't touch `.handoff` (the resolved 2026-07-25 security handoff).
- `BUILD-LOG.md` is frozen — never edit it.
- Don't add a phone-home to reach browsers that never synced. That is a property of a no-accounts
  product, not a bug. Ethan has repeatedly chosen dropping a metric over tracking a user.

---

## 8. How to work with Ethan (durable)

College student, learning developer. Not fluent in git, terminals or deployment, but learning —
teach while doing. Typos are common; infer intent and proceed rather than asking about an obvious one.

- **Zero cost, always.** Cost questions get certainty, never "probably free" — name every service and
  whether it can ever bill him.
- **Terminal steps: numbered, ONE command per step**, say what he should see, then wait for his
  confirmation or screenshot before the next.
- **He runs deploys, pushes and destructive curls himself**, typing the command with a `!` prefix.
- **A question is not a work order.** When he asks "what are the options?", answer with a
  recommendation and stop — do not start editing. When he asks for a change, make it without asking
  permission at each step.
- **Verify before saying done** — exercise the real feature, not just the tests. He asks for this
  explicitly and notices when it is skipped.
- **Lead with the outcome.** Short replies ("yes", "proceed", "yes push") mean: do exactly the
  pending step, nothing more.
- **Deploys, deletes and anything outward-facing: confirm first.** Approval is scoped to that one
  action, not to future ones.
- **Screenshots are bug reports** — but reproduce what they show before accepting the diagnosis in
  them. This session is the case study.
- **Ponytail mode is on**: smallest solution that works; deliberate shortcuts marked with a
  `ponytail:` comment naming the ceiling and the upgrade path.
- **`PROGRESS.md` is required.** At the end of any session that changed something real, append or
  extend that day's entry, unprompted, written for a founder (what shipped, why it mattered to the
  business, what broke and what it taught). One `##` per date, newest at the bottom, "Open threads"
  kept current. **The 2026-07-26 entry exists — extend it; do not add a second heading for that date.
  This session's work is NOT in it yet.**
- **After a milestone**, also update the repo `CLAUDE.md` gotchas and the auto-memory at
  `~/.claude/projects/-Users-ethanyap-portafile/memory/`.

---

## 9. Machine-level warnings (these outlive this task — do not drop them)

1. **Never trust System Settings → Storage for free space** — it counts iCloud-purgeable files and has
   been wrong by ~50 GB. Use `df -h /`. Currently **23 GB free of 228 GB**.
2. **Do not touch the `flowise-main` or `open-webui` Docker containers.** Both verified running right
   now (`flowise-main` up 3 weeks, `open-webui` up 5 days, healthy) — a **separate live project**.
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
   Playwright); reading an existing PDF's text does not.

---

## 10. The next task

**Immediately pending, in order:**

1. **Ask about §4a — commit and deploy?** The work is finished and green but uncommitted. He decides.
2. **Ask about §4b — the four test lead records and one test shop**, now including two written today.
   Clear them *before* the real Lisbon signups arrive or he cannot tell them apart. **Ask; don't delete.**
3. **Update `PROGRESS.md`** — extend the existing `## 2026-07-26` entry with this session's work. It
   has not been done and the repo requires it.
4. **Add the new gotchas to `CLAUDE.md`** — the `guide/` directory and its non-deployment, the
   `pristineDemo` vs `matchesADemoSeed` distinction, and the private-tab signup hazard.

**Then, the actual business step:** he is sending Portafile to his two Lisbon test cafés.

- **The link to send is `https://portafile.vercel.app/pt`** and the guide to attach is
  `guide/Portafile-Guia-PT.pdf`.
- With the auto-reseed deployed, the old advice line about pressing PT in the corner is still worth
  including, but the demo menu now follows the switch, so no reset step is needed.
- **Do not send the launch film** (English-only, still claims "No server").

**Beyond that, UNSPECIFIED — ask him. Do not invent the next feature.**

Two things worth raising unprompted if they come up:

- The Portuguese cost figures in the demo seed are **estimates of Lisbon wholesale prices**, not
  quoted numbers. A starting point a real owner overwrites — never quote them as market data.
- Once a Lisbon café stops being a tester and starts paying, **GDPR and the euro pricing both stop
  being deferrable.** Both are in `PROGRESS.md`'s open threads.

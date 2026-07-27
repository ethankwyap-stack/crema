# HANDOFF — training-step descriptions are built; four follow-ups are queued and approved

**Written 2026-07-27.** Project: `/Users/ethanyap/portafile`. Owner: Ethan (college student, learning
developer). You are picking this up cold. Every fact below was re-checked by a command immediately
before this file was written, unless explicitly labelled otherwise.

> **This file replaces the 2026-07-26 handoff** ("language switch now reseeds the demo; Portuguese
> guide PDF exists"). That work is finished, committed and pushed — its gotchas, machine warnings and
> working-style notes are carried forward here in §6, §9 and §10. Nothing hard-won was discarded.
>
> **Do not confuse this with `.handoff`** (the dotfile in this same directory). That is a separate,
> already-resolved handoff from 2026-07-25 about four security fixes, marked ✅ RESOLVED at its top.
> **Leave it alone.** `handoff.md` — this file — is the live one.

---

## 1. TL;DR

**One feature was built this session and it is finished and verified locally: every step in the
Training path can now carry an optional description.** Nothing is committed and nothing is deployed.

**Ethan has explicitly approved four follow-up tasks for the next session — do all four (§5).** He
said "complete all 3 items in new chat" (the three I offered him) and added a fourth in his own
words. Do not re-ask whether to do them; the decisions inside them still need him (§4).

- Working tree is dirty on purpose: `product/app.js`, `product/styles.css`, `product/i18n.js`,
  `CLAUDE.md`, `PROGRESS.md`, `WORKS.md` modified.
- **`guide/Portafile-Guide-EN.pdf` is DELETED in the working tree and this session did not delete
  it** — it was already gone when the session started. It is still in git. See §4c before committing:
  a blind `git commit -a` would delete a shipped file from the repo.
- `PROGRESS.md` **is** already updated for this session (a new `## 2026-07-27` entry). Do not add a
  second heading for that date — extend the existing one.
- **Production has one shop and two lead records, and they look like Ethan's own testing from this
  morning** (§4b). Ask before deleting anything.
- Cost this session: **$0.** No new service, account, dependency or external request.

---

## 2. What was accomplished

**He started with a question, not a work order:** "in the training tab, what does D1 D2 mean? I am
confused." The answer, for the record: `D1`/`D2`/`D3` is **Day 1 / Day 2 / Day 3** of the new hire's
first week. It comes from the `day` number typed into the small numeric box next to "+ custom skill"
when a step is added. `product/app.js:652` renders `d${p.day}` and `product/styles.css:106`
uppercases it via `text-transform:uppercase`. The printed new-hire pack spells it out as "Day 1" —
only the on-screen badge is abbreviated.

**Then he asked for the feature:** every step in the training path should be able to carry a
description. Built and verified:

| Where | What changed |
|---|---|
| `product/app.js:656` | Each `.pathlist li` renders an `<input class="note">` holding `p.note` |
| `product/app.js:990` | Saves on `change` (blur), mutates `S.path[i].note`, calls `save()` **without `render()`** — a re-render would steal focus mid-sentence, and nothing else on that view reads the field |
| `product/app.js:738` | The new-hire print pack renders the note as `<div class="cknote">` under the step |
| `product/app.js:1048` | **`demoSig()` now fingerprints `p.note`** — the load-bearing part, see below |
| `product/styles.css:107-109` | The field is a quiet full-width second row: borderless, dashed top rule, only looks like a form field once focused |
| `product/styles.css:181` | `.pchecklist .cknote` — 9pt grey, print-only |
| `product/i18n.js:138` | `'Add a description — prints in the pack'` → `'Adicione uma descrição — sai no dossiê'` |

**The bug that was caught before it existed.** A deliberate language switch reseeds the demo menu,
but only while the shop is still the untouched demo, and "untouched" is decided by `demoSig()` — a
content fingerprint. It listed each path step's `type`, `label` and `day` but nothing else. A shop
whose *only* work was a page of carefully written step descriptions would therefore have read as
pristine, and pressing PT would have thrown all of it away. Same shape as the oat-milk bug from
2026-07-26. The general rule was added to `CLAUDE.md`: **any new user-editable field must be added to
`demoSig()` in the same commit.**

**Verified by driving the real app in headless Chromium, not by reading the diff.** Eleven checks,
all PASS, no JS errors:

- the field exists on every step and carries the description placeholder;
- typing then blurring writes to `localStorage`, and survives a reload;
- pressing `↓` moves the note with its step;
- `<img src=x onerror=alert(1)>` round-trips as **literal text** in both the editor and the printed
  pack, and injects no element;
- the new-hire pack prints the notes (confirmed in the DOM **and** in a `media:'print'` screenshot);
- a note-only edit **vetoes** the language swap;
- an untouched demo **still** reseeds to the Lisbon menu.

**Existing suites re-run this session and green:** `node product/verify.js` (0 FAIL),
`node verify-pt.js` (61), `node verify-i18n.mjs` (15 checks / 218 translations),
`node verify-metrics.mjs`. **Not re-run this session:** `verify-sync.js`, `verify-gate.js`,
`verify-killpass.js`, `verify-api.mjs`, `verify-site.js` — they were green on 2026-07-26 and nothing
this session touched their subjects, but that is an inference, not a measurement.

**Also updated:** `PROGRESS.md` (new `## 2026-07-27` entry), `WORKS.md` (a new checklist line under
"App — dial-in, training, print"), `CLAUDE.md` (the `demoSig()` corollary).

**Road not taken — do not redo:** the scratch verification script lives at
`/private/tmp/claude-501/-Users-ethanyap-portafile/c8417b7d-a44b-41c9-b7a3-500e51b9ee0b/scratchpad/check-note.js`.
It is disposable, and its useful checks should be folded into a repo suite as part of task 5.1 below
rather than resurrected from a temp directory that a reboot will clear.

---

## 3. Verified state

Re-checked by command immediately before this file was written.

| Fact | Value | How known |
|---|---|---|
| Repo | `/Users/ethanyap/portafile` | — |
| Branch / last commit | `main` / `047418e` | `git rev-parse`, `git log` |
| Unpushed commits | **0** — everything committed is on `origin/main` | `git log origin/main..HEAD` |
| Working tree | **Dirty, deliberately:** `CLAUDE.md`, `PROGRESS.md`, `WORKS.md`, `product/app.js`, `product/i18n.js`, `product/styles.css` modified; `guide/Portafile-Guide-EN.pdf` **deleted (not by this session)**; `.handoff` untracked | `git status` |
| Deployed this session? | **No.** Live site is the previous deploy and does not have step descriptions | no deploy command was run |
| Deploy command | `vercel deploy --prod --yes` from repo root. **`git push` does NOT deploy this project** | `CLAUDE.md` |
| `https://portafile.vercel.app/` | **200** | HTTP probe |
| `/pt` · `/product/` · `/site/site.css` · `/product/i18n.js` | **200** each | HTTP probes |
| `/admin/dashboard.html` | **404 — correct.** The no-auth dashboard must never deploy | HTTP probe |
| Founder dashboard | `http://localhost:4322/admin/dashboard.html` — port 4322 listening (LaunchAgent, Python) | `lsof` |
| Local test server | **none running**; port 8899 free | `lsof` |
| Admin key | `.admin-key` in repo root, present, gitignored. **Never echo its contents** | read via `tr -d '\n'` only |
| Pinned Playwright | present at `~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright` | directory exists |
| Disk | **23 GB free of 228 GB** | `df -h /` |
| Docker | `flowise-main` up 3 weeks, `open-webui` up 6 days (healthy) — **a different project, do not touch** | `docker ps` |
| Production Blob store | **1 shop, 2 lead records** — see §4b | `GET /api/metrics` and `GET /api/lead` with the admin header, this session |
| Cost of everything | **$0.** Static files on the existing free Vercel tier | by construction |

---

## 4. Decisions still open — ask him, do not act alone

### 4a. Deploy?

The step-description feature is finished and green but **uncommitted and undeployed**. Task 5.2 below
is his approval to deploy — but the repo rule is that **`/still-works` runs before the commit, not
after**, and it has not been invoked as a skill for three sessions. Run it, report what it says, then
deploy. If it surfaces a real regression, stop and tell him rather than deploying past it.

### 4b. There is test data in production again — ask before deleting

`GET /api/metrics` right now reports **1 shop, 1 signup (2 lead records, deduped by email)**:

| Field | Value |
|---|---|
| Shop id | `43a9a8e8099d2c9d119b0ce389a56975e90327c2` |
| Shop name | `Tester Shop` |
| Email | `ethankw.yap@gmail.com` |
| Created | `1785148475385` = **2026-07-27 10:34:35 UTC** |
| Last active | 2026-07-27 10:43:16 UTC |
| Lead `ts` values | `1785148459345` and `1785148471418` (the second is the automatic shopId-linking re-POST, ~12s later) |

It reads as Ethan's own hand-testing from this morning — the name is a fixture, the email is his, and
it predates this session's work. It is **not** proof of a customer. He cleared the store on
2026-07-26 immediately before emailing the Lisbon cafés (commit `a7f1084`), so anything in there now
arrived after that. **Ask him whether to clear it. Do not delete his data on your own.**

Shop deletion (this also removes the shop's usage-activity blob):

```
curl -s -X DELETE -H "x-portafile-admin: $(tr -d '\n' < .admin-key)" \
  -H "x-portafile-shop: 43a9a8e8099d2c9d119b0ce389a56975e90327c2" \
  "https://portafile.vercel.app/api/state"
```

Lead records are **separate** and are not removed by that call — one DELETE per record, by `ts`:

```
curl -s -X DELETE -H "x-portafile-admin: $(tr -d '\n' < .admin-key)" \
  "https://portafile.vercel.app/api/lead?ts=1785148459345"
```

Confirm deletions with several reads — the blob index lags deletes and a single read is not proof.
**The `created` timestamp from `/api/metrics` is `owners.created`, NOT the lead `ts`** — do not pass
it and assume it worked. If a `DELETE` curl gets blocked by a permission classifier (it has been,
twice), hand Ethan the exact one-line command to run himself with a `!` prefix rather than routing
around it.

### 4c. `guide/Portafile-Guide-EN.pdf` is missing from disk

It is committed in git (`3c6caca`) but **absent from the working tree**, and this session did not
delete it. `guide/` currently holds `guia-pt.html`, `guide-en.html`, `render-pdf.js` and
`Portafile-Guia-PT.pdf` only.

Two clean fixes — **do not just commit the deletion**:
1. `git checkout -- guide/Portafile-Guide-EN.pdf` (restores the committed byte-for-byte copy), or
2. `node guide/render-pdf.js` (re-renders every `guide/*.html`, including the English one, and
   re-checks 12 button labels against `product/i18n.js`).

Prefer (2) if `guide-en.html` has changed since the PDF was built; prefer (1) otherwise. Either way,
**tell him it was missing** — he may have deleted it deliberately.

### 4d. The design question inside task 5.4 (see §5)

Answer it with a recommendation, then build. Don't stall on it.

**Three things are settled and must NOT be reopened:** paid tiers stay in US dollars on `/pt`, GDPR
stays consciously deferred, and the Portuguese work stays as shipped.

---

## 5. The next task — all four are approved, do all four

Ethan's words: *"complete all 3 items in new chat. add this to the tasks: i want the ability to
reorder the days assigned to each task and same with the custom tasks because not every owner will
want the same order."*

All four live in the **Training** tab (`viewTraining()` at `product/app.js:636`, wiring at
`product/app.js:973-1002`).

### 5.1 Show the step description in the Sign-offs column too

Right now the description only appears in the left-hand "The path" editor and in the printed pack.
The right-hand "Sign-offs" checklist (`product/app.js:677-681`) shows the step title only, so the
trainer ticking the box cannot see what they are signing off on. Render `p.note` there as secondary
text under the label — **read-only there**, editing stays in the path column. Keep it visually
lighter than the label so a ten-step checklist does not become a wall of text.

**Leave one runnable check behind.** The eleven checks written this session live only in a scratch
file in a temp directory; fold the durable ones (persistence, reorder, the hostile-string case, the
print pack, and both language-switch cases) into `product/verify.js` so they survive.

### 5.2 Commit and deploy

`/still-works` **first** (§4a), then `vercel deploy --prod --yes` from the repo root, then confirm on
the real site — open `https://portafile.vercel.app/product/`, Training tab, type a description,
reload, print the pack. Watch out for `guide/Portafile-Guide-EN.pdf` (§4c) when staging the commit.
`guide/` deliberately does not deploy; `.vercelignore` is an allowlist.

### 5.3 Lock path editing to owners

Staff devices (those on a `?k=` link) can currently reorder and delete training-path steps, and as of
this session can edit descriptions too. That was already true before today — it is not a regression,
it is a gap. The staff-view predicate is `staffView()` (already used in `viewPrint()` at
`product/app.js:696` to hide the Margin Report). Apply the same treatment to the path editor: staff
see the path and its descriptions, owners get the `↑ ↓ ×` buttons, the add-step row and the
description inputs.

**Verify the right thing:** this is a UI-visibility change, not a security boundary — a staff device
holds the whole shop in `localStorage` either way, exactly like the price table. Say that plainly to
Ethan rather than calling it "locked down". Re-run `node product/verify-gate.js` and
`node product/verify-sync.js` afterwards, since both drive staff-link sessions.

### 5.4 Let owners change which day a step belongs to (his fourth item)

**The gap:** a step's `day` is set once, in the numeric box at `product/app.js:662`, at the moment it
is added. After that there is no way to change it. The `↑ ↓` buttons move a step's position in the
flat `S.path` array; they do not touch `p.day`. So an owner who decides milk steaming belongs on Day
1 instead of Day 2 has to delete the step and re-add it — and for a custom skill that means retyping
the whole label. He is right that this blocks a real need: not every café runs the same week.

**Smallest thing that works:** make the `D1` badge itself an editable day field per row — a small
`<input type="number" min="1" max="9">` in place of the static `<span class="day">`, saving on
`change` and re-rendering. That covers drinks and custom skills identically, since both are just
entries in `S.path`.

**The design question to answer first (§4d):** the on-screen path list is in manual array order,
while the printed pack **groups by day** and sorts days ascending
(`product/app.js:733-739`). Today those agree only because the seed happens to be in day order. The
moment someone sets step 1 to Day 3, the screen and the paper disagree. Recommendation: **sort the
on-screen list by day, then by array position within a day**, so the screen matches the paper — and
make `↑ ↓` reorder within a day. State that as a recommendation to Ethan and proceed unless he says
otherwise; do not silently ship a screen that disagrees with the print-out.

**Do not forget:** `p.day` is already inside `demoSig()` (`product/app.js:1048`), so a day change
correctly vetoes the language reseed. If you add any *new* field while doing this, add it there too.

**Beyond these four: UNSPECIFIED — ask him. Do not invent the next feature.**

---

## 6. Gotchas

**From this session, first:**

- **`demoSig()` decides whether a language switch may destroy the shop's data.** Any new
  user-editable field must be added to it in the same commit, or a shop whose only work lives in that
  field reads as pristine and gets erased. `product/app.js:1036-1051`. This is now written into
  `CLAUDE.md` as a corollary to the oat-milk bug.
- **`class="note"` is used twice in the app** — the training-path description (`app.js:656`) and the
  dial-in log's note field (`app.js:625`). Both the CSS and the event wiring are scoped with
  `.pathlist .note` on purpose. Do not widen either selector to a bare `.note`.
- **An inline field that saves on `change` must not call `render()`.** Re-rendering the view on blur
  is harmless here only because nothing else on screen reads `p.note`; re-rendering on `input` would
  destroy focus mid-sentence. The prices grid gets away with `save(); render()` because it is a
  full-row commit.
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

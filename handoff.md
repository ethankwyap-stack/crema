# HANDOFF — Portafile is live in European Portuguese; sync verified on production

**Written 2026-07-26, ~19:40 UTC.** Project: `/Users/ethanyap/portafile`. Owner: Ethan (college
student, learning developer). You are picking this up cold. Every fact below was re-checked by a
command immediately before this file was written, unless explicitly labelled otherwise.

> **This file replaces the earlier 2026-07-26 handoff** ("Portafile speaks European Portuguese"),
> whose three open questions have all been answered and acted on. Nothing hard-won was discarded —
> its gotchas, machine warnings and working-style notes are carried forward here in §5, §8 and §9.
>
> **Do not confuse this with `.handoff`** (the dotfile in this same directory). That is a separate,
> already-resolved handoff from 2026-07-25 about four security fixes, marked ✅ RESOLVED at its top.
> **Leave it alone.** `handoff.md` — this file — is the live one.

---

## 1. TL;DR

**The Portuguese launch is finished, deployed, and verified working on the live site.** So is
sharing/sync. There is no pending code work.

- **Deployed to production and confirmed by HTTP probe**, not remembered. `/pt`, the shared
  stylesheet, the translation file and both Portuguese legal pages all return 200.
- **Everything is committed.** Working tree is clean apart from the untracked `.handoff` dotfile,
  which is intentional. Three commits this session: `0c32daa`, `dc3a21c`, `0e0f6a8`.
- **Live sync was tested end-to-end on production with two real browsers** and works. Do not retest
  it casually — see the §5 warning, because that test writes real data into Ethan's cloud store.
- **Do not rebuild, re-verify or "tidy" any of this.** It is done and it is green.
- **One cleanup is outstanding and it is Ethan's call, not yours** — his own test shop is still in
  the store and is being counted as a customer. See §4.
- **He is about to send the app to two real café owners in Lisbon.** Anything you break now is
  breaking a live customer demo.

---

## 2. What was accomplished

**Where this session started.** A previous session had built full European-Portuguese support (app,
landing page, privacy, terms) with euro pricing, because Ethan's first two test clients are cafés in
Lisbon. It was verified locally but **nothing was committed and nothing was deployed**, and it left
three decisions explicitly for Ethan. This session's job was to put those to him, then act.

**His three answers, which are now settled — do not reopen them:**

1. **Deploy and commit** → done, both.
2. **Paid tiers stay in US dollars on the `/pt` page**, with the existing line of Portuguese copy
   explaining the euro price is not yet set. Reasoning he accepted: inventing a euro price he has
   never decided is worse than admitting he has not decided it, and both Lisbon testers are on the
   free tier anyway, so nothing is blocked.
3. **GDPR is noted, not solved** — consciously deferred. Nobody is paying yet; the Portuguese legal
   pages are marked as translations with the English governing, which is standard practice and buys
   time but **is not compliance**. It stays on the open-threads list in `PROGRESS.md`.

**What was then done and verified:**

- Committed the whole Portuguese body of work (`0c32daa`), deployed with `vercel deploy --prod
  --yes`, aliased to `portafile.vercel.app`.
- Verified against the **live** site: 12/12 health checks pass; a `pt-PT` browser loads "Café da
  Esquina (demo)" with 19 drinks in euros at 24,5% average cost, while an `en-US` browser still
  loads "Demo Espresso Bar" with 15 drinks in dollars — the English app is untouched, which was the
  main regression risk.
- Confirmed **every** link on both landing pages is absolute and returns 200. The privacy-policy
  404 that had been live for weeks at `/` is genuinely gone.
- **Looked at the signup gate as a real visitor for the first time.** Every automated suite runs
  with `navigator.webdriver === true`, which *skips the gate*, so nobody had ever seen the first
  screen a real Portuguese customer gets. It is correct and fully translated ("Antes de começar… O
  Portafile é gratuito"). This mattered: it is the literal first impression of the product.
- **Tested sharing/sync live on production with two independent browsers** (§3 table).
- Journalled all of it in `PROGRESS.md` and marked the previous handoff resolved.

**Road not taken — do not redo these explorations:**

- The previous session's rejected options stand: a single landing page with JS-swapped text (in
  favour of a separate `site/pt/`), duplicating the CSS (in favour of the shared `site/site.css`),
  and any i18n library or build step (this repo has no build step by design).
- Converting the paid tiers to euros — deliberately not done, see above.
- Drafting GDPR legal text — deliberately not done, and **do not draft legal text unprompted**.

---

## 3. Verified state

Re-checked by command immediately before this file was written.

| Fact | Value | How known |
|---|---|---|
| Repo | `/Users/ethanyap/portafile` | — |
| Branch / last commit | `main` / `0e0f6a8` | `git log` |
| Working tree | **Clean.** Only `.handoff` is untracked, deliberately | `git status` |
| This session's commits | `0c32daa` (PT work), `dc3a21c` (journal + old handoff resolved), `0e0f6a8` (sync verification) | `git log` |
| Pushed to a remote? | **No.** Commits are local only. `git push` does NOT deploy this project | `git status` |
| `https://portafile.vercel.app/` | **200** | HTTP probe |
| `/pt` | **200 — live** | HTTP probe |
| `/product/` | **200** | HTTP probe |
| `/site/site.css` | **200 — live** | HTTP probe |
| `/product/i18n.js` | **200 — live** | HTTP probe |
| `/site/pt/privacy.html`, `/site/pt/terms.html` | **200 — live** | HTTP probe |
| `/admin/dashboard.html` | **404 — correct**, the no-auth dashboard must never deploy | HTTP probe |
| Health check | **12/12 ok** (`python3 health_check.py`). It then raises on the *email* step — `GMAIL_ADDRESS`/`GMAIL_APP_PASSWORD` live in GitHub secrets, not on his Mac. **That traceback is expected locally and is not a failure** | run this session |
| Deploy command | `vercel deploy --prod --yes` from repo root. **`git push` does not deploy**, despite `vercel git connect` | `CLAUDE.md`, used successfully this session |
| Founder dashboard | `http://localhost:4322/admin/dashboard.html` — Python listener confirmed on 127.0.0.1:4322 (LaunchAgent) | `lsof` |
| Admin key | `.admin-key`, present, gitignored. **Never echo its contents** | file exists |
| Blob token | `.env.local`, present, gitignored | file exists |
| Pinned Playwright | present at `~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright` | dir exists |
| Local test server | **none running**; port 8899 free | `lsof` |
| Disk | **24 GB free of 228 GB** | `df -h /` |
| Cost of everything | **$0.** Static files + existing free Vercel tier. No new service, account, dependency or external request. Ethan treats "probably free" as a bug — this is certain | by construction |
| **Blob store contents** | **1 shop, 1 lead — and it is Ethan's own test data.** See §4 | `GET /api/metrics` with admin key, this session |

### Live sync test — passed, on production, two separate browsers

| Behaviour | Result |
|---|---|
| Owner turns on sync (`#btnData` → `#dSyncOn`), gets `?k=` staff link | ✅ |
| A second, independent browser opens that link | ✅ loads the same shop |
| Signup gate blocks the staff link | ✅ **correctly does NOT** — never gate a share link |
| Ingredient costs / margins hidden on the staff device | ✅ menu prices visible, costs hidden |
| Owner edits the shop → staff device sees it | ✅ propagated |

### Test suites — 267 checks, 0 failures (as of the previous session's final sweep)

The three no-browser suites were re-run this session and pass. The six Playwright suites were **not**
re-run this session — nothing they cover was edited. Run from the repo root.

| Command | Checks | Needs |
|---|---|---|
| `node verify-i18n.mjs` | 15 | nothing — **re-run this session, PASS** |
| `node verify-metrics.mjs` | 33 | nothing — **re-run this session, PASS** |
| `node verify-api.mjs` | 27 | nothing — **re-run this session, PASS** |
| `node product/verify.js` | 11 (+ in-page selftest of 27) | Playwright |
| `node product/verify-killpass.js` | 16 | Playwright |
| `node product/verify-gate.js` | 11 | Playwright |
| `node product/verify-sync.js` | 64 | Playwright |
| `node verify-pt.js` | 53 | Playwright |
| `node verify-site.js` | 37 | Playwright **and** `python3 -m http.server 8899` running in the repo root first |

`verify-sync.js` takes over a minute — do not kill it early and read that as a failure. Several
suites print lines containing "failed"/"failure" as part of **passing** negative tests
(`lead admin auth failed`). **Grep for `^FAIL`, never for "fail".**

---

## 4. The decision still open — ask him, do not act alone

**Ethan's own test data is sitting in the production store and is being counted as a customer.**

Currently in the Blob store: **one shop**, `ed5bc09a9ae71722332ea48111ac3b883dd0ffc1`, signup name
`"Tester"`, email `ethankw.yap@gmail.com`, created 2026-07-26 13:56 UTC, last active 14:27 UTC —
plus its lead record (`onboarding.signups: 1`). That is his own testing from earlier that day, not
a customer.

Why it matters: he is about to send the app to two real Lisbon cafés. Until this is cleared, his
founder dashboard mixes his own testing in with his first real signups, and the standing rule in his
auto-memory — *"the next lead record that appears is either a real signup or my own testing"* —
stops being usable.

**He was offered the cleanup and had not answered when this file was written. Ask him; do not delete
his data on your own initiative.** If he says yes, the shop deletion is:

```
curl -s -X DELETE -H "x-portafile-admin: $(tr -d '\n' < .admin-key)" \
  -H "x-portafile-shop: ed5bc09a9ae71722332ea48111ac3b883dd0ffc1" \
  "https://portafile.vercel.app/api/state"
```

Expect `{"ok":true}`. **The lead record is separate and is NOT removed by that call** — it needs
`DELETE /api/lead?ts=<ts>`, and the `ts` must be looked up first (the dashboard's "Fetch signups"
button, or a GET to `/api/lead` with the admin header). The `created` timestamp shown in
`/api/metrics` is `owners.created`, **not** the lead `ts` — do not pass it and assume it worked.
Confirm deletions with several reads; the blob index lags.

**Note: Ethan's own delete commands may be needed.** A `DELETE` curl from the agent was blocked
mid-session by a permission classifier, twice. If that happens, hand him the exact one-line command
to run himself with a `!` prefix rather than trying to route around it.

**Three things are settled and must NOT be re-litigated** (see §2): paid tiers stay in USD, GDPR
stays deferred, and the Portuguese work stays as shipped.

---

## 5. Gotchas

**The one that actually bit this session, first:**

- **A live sync test is NOT read-only, and it leaves data behind even when it crashes.** Testing
  sync means clicking "Turn on sync", which immediately writes a real shop into the production Blob
  store. The first attempt this session **crashed partway through** — but it had *already* created
  the shop before dying, leaving a nameless orphan that only turned up by reading `/api/metrics`
  afterwards. **Never assume cleanup from a green run; check the dashboard.** Both test shops were
  deleted and that was confirmed by re-reading the metrics.
- **`#dSyncOn` navigates.** It sets three localStorage secrets then does `location.search = '?k='+k`,
  which **reloads the page and closes the modal**. A script that clicks it and then waits for
  `#dSyncLink` times out — the dialog no longer exists. Re-open `#btnData` after the reload.
- **The verify suites cannot see the signup gate.** `gate()` skips `navigator.webdriver` browsers,
  so every automated suite bypasses the first screen a real customer sees. To inspect it, override
  webdriver in an init script — but **never submit that form**, because a real (non-webdriver)
  submit writes a genuine lead blob into the founder's store.
- **A "carried forward, unverified" fact in a handoff is the one most likely to be wrong.** The
  previous handoff said the Blob store was empty. It was not. It cost nothing this time; assume it
  will cost something next time.

**Portuguese / i18n (still true):**

- **The English string IS the dictionary key** (`product/i18n.js`, gettext-style). A missing
  translation silently renders readable English — that is the design, and it is why mistakes are
  invisible. Two consequences: (1) editing an English string in `app.js` orphans its translation
  with no error; (2) one English word needing two Portuguese words collides on one key, and a
  duplicate key in a JS object literal **silently keeps only the last value** (this really happened
  with "Roaster"). Disambiguate as `t('Roaster|role')` — the `|context` suffix is stripped from the
  English fallback only. **`node verify-i18n.mjs` is the only thing that catches any of this.**
- **`product/i18n.js` must load before `app.js`** in `product/index.html`. `app.js` calls `t()`
  during its first render, so a missing `i18n.js` is not a degraded translation — it is a **blank
  app**. `health_check.py` probes that file directly.
- **Adding a language means editing `api/metrics.js`.** Its `DEMOS` array is a hand-copied list of
  every seed's shop name and recipe/ingredient counts. A seed missing from it makes every shop in
  that language read as fully adopted the instant it opens — silent, no error.
- **Language lives in `S.shop.lang`, so it SYNCS** to staff devices. Default is browser detection,
  which is why the pre-existing en-US Playwright suites still pass untouched.
- **Signup role `<option value>`s stay English while the labels translate.** The value is POSTed to
  `/api/lead` and counted in metrics; translating it would split "Owner" and "Proprietário".
- **`site/site.css` is shared by `/` and `/pt`.** If it 404s, both pages return 200 with all their
  text and render completely unstyled — which a body-text health check would pass, hence the direct
  probe.
- **Never pattern-match over `JSON.stringify(seed())`.** A selftest that regexed the serialised shop
  for imperial units matched the random base-36 `uid()`s (`yykz6oz` reads as "6 oz"): a **measured
  0.99% false-failure rate**, the worst possible frequency, because it teaches you the suite is
  flaky rather than that the code is wrong. **If any suite fails once and passes on retry, measure
  the rate before dismissing it.**

**Carried forward and still true:**

- **`CLAUDE.md` in this repo is the real gotcha list — read it fully before editing `api/state.js`.**
  The eventual-consistency rules ("never build an authorization check on a read", "revocation is a
  value comparison, never a missing blob", "a 404 never means revoked") were expensive to learn and
  are not negotiable.
- **Vercel Blob is eventually consistent.** `list()` lags writes and deletes by seconds — fine for
  counting, never for resolving a known path or deciding authorization.
- **Relative URLs on the landing pages 404 at `/`** because root is a rewrite — and `/pt` is a
  second rewrite with exactly the same hazard. Everything is absolute now; do not reintroduce one.
- **CSP blocks all inline `<script>` on deployed pages.** `admin/dashboard.html` uses inline script
  and `onclick=` and is safe only because it never deploys. Never move that pattern into `site/` or
  `product/`.
- **`.vercelignore` publishes only `site/`, `product/`, `video/`, `api/`, `vercel.json`,
  `package.json`.** A new top-level directory silently does not deploy.
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
- **The feedback modal opens from `#btnHelp` → `#hFeedback`**, not a top-level button.
- **`health_check.py` runs daily at 15:00 UTC** and emails him **every run, pass or fail** — so a
  missing email is itself the alarm. If you change page copy, update its expected marker strings or
  he gets a false alarm.
- **Do not load-test the GET rate limiter from his machine** — it makes `health_check.py` report a
  false outage for up to 10 minutes.

**Honesty note on verification.** The `/still-works` skill has **not** been invoked as a skill for
this body of work, in this session or the previous one. What exists instead: all nine suites green
(three re-run this session), a live two-browser sync test, live HTTP probes, and visual review. If
Ethan wants the skill's own process run, that has not happened and he should be told so plainly.

---

## 6. Reboot / persistence

Nothing here depends on a running process. All work is committed to git in
`/Users/ethanyap/portafile` and deployed to Vercel; a reboot loses nothing. Test scripts written
this session live in a session scratchpad and are disposable.

**The weak link:** the three commits are **local only and not pushed to any remote**. A disk failure
loses them. The deployed site is independent of that and would survive.

---

## 7. Don't redo

- The Portuguese translation, seed, landing page and legal pages — done, deployed, verified.
- The deploy itself, and the live verification of it. It passed.
- The live sync test. It passed, and **re-running it writes real data into his store** (§5).
- The Lisbon pricing model (porcelain vs. paper cup). Written up in `PROGRESS.md` and `CLAUDE.md`.
- Don't "fix" the English demo shop — it is intentionally unchanged (15 drinks, dollars, °F).
- Don't convert the paid tiers to euros, and don't draft GDPR text. Both were decided (§2).
- Don't touch `.handoff` (the resolved 2026-07-25 security handoff).
- `BUILD-LOG.md` is frozen — never edit it.
- **Don't add a phone-home** to reach browsers that never synced. That is a property of a
  no-accounts product, not a bug. Ethan has repeatedly chosen dropping a metric over tracking a user.

---

## 8. How to work with Ethan (durable)

College student, learning developer. Not fluent in git, terminals or deployment, but learning —
teach while doing. Typos are common; infer intent and proceed rather than asking about an obvious one.

- **Zero cost, always.** Cost questions get certainty, never "probably free" — name every service
  and whether it can ever bill him.
- **Terminal steps: numbered, ONE command per step**, say what he should see, then wait for his
  confirmation or screenshot before the next.
- **He runs deploys, pushes and destructive curls himself**, typing the command with a `!` prefix.
- **Verify before saying done** — exercise the real feature, not just the tests. He asks for this
  explicitly ("test it out before you tell me it's done") and notices when it is skipped.
- **Lead with the outcome.** Short replies ("yes", "proceed", "yes push") mean: do exactly the
  pending step, nothing more.
- **Deploys, deletes and anything outward-facing: confirm first.** Approval is scoped to that one
  action, not to future ones.
- **Ponytail mode is on**: smallest solution that works; deliberate shortcuts marked with a
  `ponytail:` comment naming the ceiling and the upgrade path.
- **`PROGRESS.md` is required.** At the end of any session that changed something real, append or
  extend that day's entry, unprompted, written for a founder (what shipped, why it mattered to the
  business, what broke and what it taught). One `##` per date, newest at the bottom, "Open threads"
  kept current. **The 2026-07-26 entry already exists and is current — extend it, don't add a
  second heading for the same date.**
- **After a milestone**, also update the repo `CLAUDE.md` gotchas and the auto-memory at
  `~/.claude/projects/-Users-ethanyap-portafile/memory/` (both updated for this session).

---

## 9. Machine-level warnings (these outlive this task — do not drop them)

1. **Never trust System Settings → Storage for free space** — it counts iCloud-purgeable files and
   has been wrong by ~50 GB. Use `df -h /`. Currently **24 GB free of 228 GB**.
2. **Do not touch the `flowise-main` or `open-webui` Docker containers.** Both verified running right
   now (`flowise-main` up 3 weeks, `open-webui` up 5 days, healthy) and `http://localhost:3010`
   answers 200 — that is a **separate live project** of his.
3. `Docker.raw` is ~13 GB and does not shrink on prune.
4. **Do not touch `~/Library/Application Support/Claude/vm_bundles`** (~6.8 GB) — Claude Desktop's VM.
5. **Never suggest "Keep Messages: 1 Year"** — it permanently deletes messages across all his devices.
6. Claude Code dies when Wi-Fi drops (`ENOTFOUND`). For an offline test, hand him ONE self-contained
   checklist he can run unattended.
7. `~/Desktop/Claude Projects/` holds **stale 2026-06-27 backups** — never edit them (only
   travel-planner there is live).
8. Before any task touching Flowise, LaunchAgents, travel-planner deploys, or multi-project audits,
   read `~/wargame_master.md` and follow it instead of improvising.

---

## 10. The next task

**He is sending Portafile to his two Lisbon test cafés.** The product is ready; the code work is
done. What remains is around it:

1. **Ask about the leftover test data (§4)** — his own "Tester" shop and lead are still counted as a
   customer. This should be cleared *before* the real signups arrive, otherwise he can't tell them
   apart. **Ask; don't delete on your own.**
2. **The link to send is `https://portafile.vercel.app/pt`** — their language, and the app is one
   click away. He was advised to include one line for them: *"se abrir em inglês, carregue em PT no
   canto superior direito"*, because the app follows the **browser's** language, not the country.
3. **Advise him not to send the launch film.** `video/portafile-launch.mp4` is English-only and
   still says **"No server"** out loud, which stopped being true when sync shipped 2026-07-17.
   Neither landing page makes that claim in text — verified this session, zero hits on both. The
   false claim exists only inside the video, which `/pt` links labelled "(em inglês)". Re-cutting
   needs a Portuguese narration voice (`say -v Joana`) and **`say` silently falls back to the
   default on an unknown voice name** — md5 the output against a fake name before believing it.
   Full context in `video-src/HANDOFF.md`.

**Beyond that, UNSPECIFIED — ask him.** Do not invent the next feature.

Two things worth raising unprompted if they come up:

- The Portuguese cost figures in the demo seed are **estimates of Lisbon wholesale prices**, not
  quoted numbers. A starting point a real owner overwrites — never quote them to anyone as market
  data.
- Once a Lisbon café stops being a tester and starts paying, **GDPR and the euro pricing both stop
  being deferrable** (§2). Both are in `PROGRESS.md`'s open threads.

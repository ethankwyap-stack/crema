# HANDOFF — Portafile: build per-cafe usage tracking (Levels 2 + 3), then deploy everything

**Written 2026-07-22. Every fact below was verified by a command run in the session that wrote this,
unless it is explicitly labelled otherwise. You are picking this up cold.** The product is LIVE with
two real coffee shops on it — breaking it is worse than being slow.

This file replaces a 2026-07-21 handoff about a security audit. That work is **finished and shipped**
(see §8). The still-true warnings from it are carried forward in §7 and §9 — do not discard them.

---

> **STATUS 2026-07-22, later that day: Levels 2 and 3 are BUILT and verified — do not rebuild them.**
> Still true and still the point: §6 (deploy is Ethan's call — nothing is deployed), §7 (the two real
> shops), §9 and §10. Everything else below is the spec that was already carried out.

## 1. TL;DR

Ethan asked for founder metrics. **Level 1 is built and verified but NOT deployed.** He then chose to
add **Level 2 and Level 3** — per-cafe usage — which is your job. Level 4 (minutes on site) he
declined; do not build it.

- **Your task:** build Level 2 (per-cafe last active) and Level 3 (days used per cafe), then deploy
  Levels 1–3 together and verify live. Full spec in §4.
- **Do NOT redo:** the Level 1 metrics endpoint, the in-app feedback button, the dashboard metrics
  tiles, or the privacy rewrite. All built, all tested, listed in §8.
- **Do NOT build:** minutes-in-app, session timing, per-section time, print counters, or any client-side
  heartbeat. Ethan explicitly chose against Level 4 after seeing the tradeoff. If you think he needs it,
  say so — do not build it.
- **Nothing is deployed.** The working tree has 6 modified and 2 new files, uncommitted, and
  `https://portafile.vercel.app/api/metrics` returns **404** because the function does not exist in
  production yet. Deploy is Ethan's call — see §6.

---

## 2. What happened in the previous session

Ethan asked for dashboard tracking of: number of shops, average time to onboarding, feature adoption
(% using training or print), and feedback sentiment. Before building, four things were found by reading
the code — they shape everything below:

1. **The live privacy page contradicted the feature.** `site/privacy.html` said *"We never look at,
   analyze, or share your recipes or costs"*, and adoption percentages require reading shop data.
   Ethan chose: compute aggregates **inside** the serverless function, return only totals, and amend
   the privacy wording to say so honestly. That is now the governing constraint (§5, first gotcha).
2. **Print adoption was deliberately NOT built.** Nothing records a print, and measuring it means
   writing usage counters into customers' own data. Ethan chose the three signals already stored
   instead. Do not "finish" this by adding a print counter.
3. **The onboarding clock nearly lied.** When a browser links its shopId to a signup, `product/app.js`
   re-POSTs the whole lead and `api/lead.js` stamps a **fresh** server `ts` — a second record for the
   same person. Measuring from it reports onboarding times near zero. Fixed, and `verify-metrics.mjs`
   fails if anyone reverts it.
4. **Only shops with sync ON are visible, ever.** A shop living purely in a browser cannot be counted
   by anything. Say this plainly to Ethan rather than presenting numbers as total users.

He then asked whether per-cafe usage time is a privacy breach. The answer given, which he accepted:
usage *metadata* is not the content he promised to leave alone, but (a) the privacy page needs a line
about it, and (b) in a two-person shop, per-device usage timing **is** one barista's shift behavior,
which turns the product into an employee-monitoring tool. He chose Levels 2 and 3, which record dates
only — never times, never durations, never device identity.

---

## 3. Verified state (checked 2026-07-22)

| Thing | State |
|---|---|
| Repo | `/Users/ethanyap/portafile`, branch `main`, HEAD `c4fe401` |
| Working tree | **Uncommitted.** Modified: `CLAUDE.md`, `PROGRESS.md`, `admin/dashboard.html`, `health_check.py`, `product/app.js`, `site/privacy.html`. New: `api/metrics.js`, `verify-metrics.mjs` |
| Live site | `https://portafile.vercel.app` — up. `/api/state?k=0000…` (40 zeros) → `404 {"error":"unknown-key"}`, which is the healthy answer and proves both the function and the private Blob read path work |
| `/api/metrics` live | **404 — not deployed yet** |
| Founder dashboard | `admin/dashboard.html`, served locally on `http://127.0.0.1:4322` by LaunchAgent `com.ethanyap.portafile-dashboard` (PID 20868, listening — verified). Intentionally never deployed |
| Blob store | Private store, migration **complete** (`api/state.js` and `api/lead.js` both read with `access:'private'`). The old handoff's "HIGH-1 pending" is stale — ignore it |
| Real data in store | **2 shops**, 1 signup record, 0 feedback records, 0 signups linked to a shop (verified by running the metrics endpoint against the real store) |
| Secrets | `BLOB_READ_WRITE_TOKEN` in gitignored `.env.local`; `ADMIN_KEY` in Vercel prod env + gitignored `.admin-key`. Never commit, never echo |
| Cost | Everything is free-tier: Vercel Hobby + Vercel Blob, spend cap $0. Levels 2–3 add no paid service |
| Tests | All 4 existing suites pass (`product/verify.js` 11, `verify-gate.js` 11, `verify-sync.js` 59, `verify-killpass.js` 10) plus `verify-metrics.mjs` (20 checks) |
| Disk | 32 GB free (`df -h /`) |

---

## 4. YOUR TASK — Levels 2 and 3

### 4a. What Ethan was promised

**Level 2 — per-cafe last active.** A row per cafe in the founder dashboard: cafe name, when their shop
first went live, when they last changed anything, sorted so the stalest shop is on top. Costs no new
data collection — every save already writes that shop's file and the store records when.

**Level 3 — days used per cafe.** "Northside: 22 of the last 30 days. Bellview: 2." Plus a silence
alert when a shop has gone quiet for 14+ days, which is his cue to phone them. Dates only — never
times, never durations.

### 4b. The privacy line you must not cross

The previous session shipped a rule, now in `CLAUDE.md`: the metrics endpoint returns **aggregate only,
never a per-shop row**. Levels 2–3 deliberately relax that, and the distinction is narrow and
load-bearing:

- **Allowed as per-cafe rows:** metadata — the shop's name *as the owner typed it into the signup form*,
  when their shop was created, when they last saved, which dates they were active.
- **Still aggregate-only, never per-shop:** anything derived from reading their app data — recipes,
  ingredients, prices, the adoption booleans, the shop name *as stored in their synced state*.

Use the name from the **lead record**, not from the shop state. He gave that name to Ethan directly;
the state is their data. **Update the `CLAUDE.md` gotcha to state the new rule** — leaving it saying
"never a per-shop row" while the code emits per-shop rows is worse than either version alone.

`site/privacy.html` also needs one added line: that Portafile records which days a shop uses the app.
The page was just rewritten for Level 1, so match its voice — plain, specific, no legalese.

### 4c. Level 2 implementation

Extend the GET in `api/metrics.js` with a `perShop` array. Everything needed is already read there:

- `list({prefix:'shops/'})` → `pathname` (shopId) and `uploadedAt` (last save).
- `owners/<shopId>.json` → `created` (first live) and, if it's a tombstone, `deleted`/`deletedAt`.
- The leads it already loads → `shopId` → the cafe name and email.

**Real limitation to surface in the dashboard, not hide:** a name attaches to a shop only when the
owner signs up through the gate form *and* turns on sync in that same browser. **Right now zero of the
two shops are linked**, so both render as anonymous IDs. Show a short ID prefix and a plain-language
note. Recommended (small, and the difference between useful and useless with two shops): let Ethan type
a label per shopId, stored in the dashboard's own localStorage state `S` — the dashboard already
persists `S` under key `portafile-admin-v1` and has export/import for it.

### 4d. Level 3 implementation — the careful part

Store dates in a **separate** blob per shop, `activity/<shopId>.json`, shaped like
`{ days: ["2026-07-22", …] }`, trimmed to the last 60 entries. It must never go inside the shop state
blob — that syncs to customer devices.

Where to stamp, and why it matters: **PUT means someone edited; GET means someone looked.** Staff
devices mostly read recipe cards, so a PUT-only stamp would badly under-count exactly the usage Ethan
cares about. Stamp on **both**, in `api/state.js`, only after the request has already been authorized
and answered successfully.

To keep the cost near zero, copy the pattern the file already uses for rate limiting (the in-memory
`HITS` map): keep a warm-instance `Map` of shopId → last-stamped date, and touch Blob only when the
in-memory date is missing or stale. Devices poll every 30 seconds, so without that cache you would add
a Blob read to every poll. With it, a warm instance does one read plus at most one write per shop per
day. Multiple instances mean a few redundant writes daily — harmless.

**Non-negotiables for this edit** — `api/state.js` is the most dangerous file in the repo:

1. Wrap the stamping in `try/catch` and ignore failures. It is bookkeeping; it must never change a
   status code, never block a save, never turn a 200 into a 500.
2. Do not touch `resolveKey`, the revocation/tombstone branches, the stale-write guard, or the
   `allowOverwrite:false` claim. Read the gotchas in `CLAUDE.md` before editing — the eventual-consistency
   rules there are load-bearing and were expensive to learn.
3. Never stamp for a request that resolved to `revoked`, `deleted`, or `unknown`.
4. **The founder's DELETE path must also `del('activity/<shopId>.json')`.** Otherwise an erased shop
   keeps showing usage, which breaks the "delete my data" promise the delete button exists to honor.
5. Dates are UTC. A late-night close in California lands on the next UTC day; that's acceptable for a
   day-count, but note it with a `ponytail:` comment rather than leaving it as a silent surprise.
6. **No changes to `product/app.js` are needed for Levels 2–3.** If you find yourself editing the client,
   stop — you have probably drifted into Level 4, which Ethan declined.

### 4e. Dashboard rendering

`admin/dashboard.html`, in the "Key metrics (live)" card added last session. Add a per-cafe table under
the existing tiles: cafe (or label), first live, last active, days used of the last 30, and a status
that turns red past 14 days quiet — the file already has a `.due` class doing exactly that for refund
deadlines. Escape everything through the existing `esc()` helper; a feedback/lead string reaching raw
HTML was a real stored-XSS break-out in this file's history.

### 4f. How to prove it works

Do all of these; the last one is the one Ethan actually asked for.

1. Extend `verify-metrics.mjs` (root, runs with `node verify-metrics.mjs`, no network, no key) with the
   day-counting math: de-duplicating a repeat visit on the same day, trimming to 60, counting days
   within a 30-day window, and an empty log.
2. Re-run all four suites in `product/` — they take a few minutes and use Playwright from
   `/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`.
3. Drive `admin/dashboard.html` in Playwright with a stubbed `/api/metrics` response to confirm the new
   table renders, sorts by staleness, flags a quiet shop, and escapes hostile text. The previous session
   did this; a working example is at
   `/private/tmp/claude-501/-Users-ethanyap-portafile/85404df0-c9c0-492f-b99a-4142157aa8c8/scratchpad/verify-dashboard.js`
   (temp directory — copy it before relying on it).
4. After deploy: load the dashboard on `http://127.0.0.1:4322`, press "Load metrics", confirm real
   numbers appear; then open the app, change something, and confirm that shop's "last active" moves and
   today appears in its day count.

---

## 5. Gotchas that will bite you

- **`CLAUDE.md` in the repo root is the real gotcha list — read it fully before editing `api/state.js`.**
  It is auto-loaded into every session in this repo. The eventual-consistency rules ("never build an
  authorization check on a read", "revocation is a value comparison, never a missing blob", "a 404 never
  means revoked") were learned the hard way and are not negotiable.
- **Vercel Blob is eventually consistent.** Back-to-back reads of the same existing path have returned
  found, then null. `list()` lags both writes and deletes by seconds. That's fine for counting; it is
  never acceptable for resolving one known path or deciding authorization.
- **`git push` does NOT deploy.** Despite `vercel git connect`, deployment only happens via
  `vercel deploy --prod --yes` from the repo root.
- **`.vercelignore` publishes only `site/`, `product/`, `video/`, `api/`, `vercel.json`, `package.json`.**
  A new top-level directory will silently not deploy. Root-level files like `verify-metrics.mjs` are
  correctly excluded; do not move test files into `api/`, where they would deploy as functions.
- **CSP blocks all inline `<script>` on deployed pages.** `admin/dashboard.html` uses inline script and
  `onclick=` attributes and is fine **only** because it is never deployed. Never move that pattern into
  `site/` or `product/`.
- **`health_check.py` runs daily at 15:00 UTC and emails Ethan on failure.** It now asserts
  `GET /api/metrics` → **401 unauthorized**. That assertion is currently *failing-by-absence* in the
  sense that the endpoint 404s until deploy — deploy before the next 15:00 UTC run, or expect one alarm
  email. It also asserts `admin/dashboard.html` 404s in production; that must stay true forever.
- **The dashboard fetches the production origin cross-origin.** `vercel.json` pins
  `Access-Control-Allow-Origin` to the prod origin for everything **except** `/api/`, so `/api/*`
  handlers must set their own CORS header or the localhost:4322 dashboard breaks.
- **Playwright `addInitScript` re-runs on every navigation**, so a test whose subject calls
  `location.replace()` after wiping localStorage silently gets its seed restored. `verify-sync.js`
  guards against this with a `pf-test-stopseed` flag.

---

## 6. The decision that is Ethan's, not yours

**Deploying.** Levels 1–3 all go live in one `vercel deploy --prod --yes`, which changes the public site
(the in-app feedback button and the privacy page wording) and adds a publicly-writable feedback endpoint.
The previous session asked and he had not yet answered. **Ask him before deploying; do not deploy as a
"finishing touch."** He also has not committed the working tree — ask rather than assuming.

Everything else about Levels 2–3 he has already decided. Do not re-litigate Level 4 with him; he heard
the tradeoff and said no.

---

## 7. Real data — do not destroy (carried forward, still true)

Two shops in the Blob store are real and must survive anything you do. The metrics run this session
confirmed the store holds exactly 2 shops.

- `187cdeade66450652b3553fe8f758b24d7220ea6` — legacy shop. Its pointer is the same string as its
  shopId and it deliberately has **no `owners/` record**, so its link cannot rotate. Ethan's choice;
  keep it that way.
- `82ebcd8e73ff82f9c96da597cfb81bf3f3facf9c` — Ethan's phone.

Never delete blobs without an explicit yes from him. If you write test data into the real store, delete
it in the same script and prove the count returned to where it started.

---

## 8. Don't redo — completed and verified in the previous session

- `api/metrics.js` (new): admin-gated aggregate GET plus a public feedback POST. Tested against the
  **real** Blob store: auth rejection, bad-input rejection, honeypot, message truncation, no per-shop
  leakage, and cleanup that returned the store to its exact prior state.
- In-app feedback UI in `product/app.js` (**? → Send feedback**): thumbs up/down, optional note and
  email. Driven in a real browser including the validation guard and the server-error path.
- Founder dashboard "Key metrics (live)" tiles and "Feedback" table, including a hostile
  `<img onerror=…>` payload proven inert.
- `site/privacy.html` rewritten so the aggregate counting is disclosed.
- `health_check.py` gained the `/api/metrics` → 401 assertion.
- `verify-metrics.mjs` (new, 20 checks) and `PROGRESS.md` + `CLAUDE.md` updated.
- **Older, from 2026-07-21:** the security audit and its fixes are done, including the migration to a
  **private** Blob store. Do not re-run the audit or re-migrate.

---

## 9. How to work with Ethan (carried forward — durable)

College student, learning developer. Not fluent in git, terminals, or deployment, but learning — teach
while doing. Typos are common; infer intent and proceed.

- **Zero cost, always.** Cost questions get certainty, never "probably free" — name every service and
  whether it can bill him. Levels 2–3 add no paid service; say that plainly.
- **Terminal and dashboard steps: numbered, ONE command per step, say what he should see, then wait**
  for his confirmation or screenshot before the next step. Watch for a stray leading space in a pasted
  command — ` cd …` fails with "command not found".
- **He runs deploys and pushes himself** by typing the command with a `!` prefix in the session. A prior
  session recorded that the agent's own `vercel deploy` and `git push` were blocked; treat deploy as
  his action unless he says otherwise.
- **Verify before saying done** — exercise the real feature, not just the tests. He asks for this
  explicitly and notices when it is skipped.
- **Lead with the outcome.** Short replies ("yes", "proceed", "yes push") mean: do exactly the pending
  step, nothing more.
- **Ponytail mode is on**: smallest solution that works, native/stdlib before dependencies, deliberate
  shortcuts marked with a `ponytail:` comment naming the ceiling. The codebase already uses that
  convention.
- **After a milestone**, update `PROGRESS.md` (the founder's log — write it for a founder, not as a
  changelog), the repo `CLAUDE.md` gotchas, and the auto-memory at
  `~/.claude/projects/-Users-ethanyap-portafile/memory/`. `BUILD-LOG.md` is frozen — never edit it.

## 10. Machine-level warnings (outlive this task)

1. **Never trust System Settings → Storage for free space** — it counts iCloud-purgeable files and has
   been wrong by ~50 GB. Use `df -h /`.
2. **Do not touch the `flowise-main` or `postgres:16-alpine` Docker containers** — a separate live
   project on localhost:3010.
3. `Docker.raw` is ~13 GB and does not shrink on prune. Don't plan on Docker cleanup for space.
4. **Do not touch `~/Library/Application Support/Claude/vm_bundles`** (~6.8 GB) — Claude Desktop's VM.
5. **Never suggest "Keep Messages: 1 Year"** — it permanently deletes messages across all his devices.
   Data loss is a top anxiety.
6. Claude Code dies when Wi-Fi drops (`ENOTFOUND`). For any offline test, hand him ONE self-contained
   checklist he can run unattended, then report back.

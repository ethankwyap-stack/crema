# HANDOFF — Portafile: the founder's "delete cloud data" didn't send the shop's browser back to the signup gate

**Written 2026-07-23. Every fact below was verified by a command run in the session that wrote it,
unless labelled otherwise. You are picking this up cold.**

This file replaces the 2026-07-22 handoff about founder metrics (Levels 1–3). That work is **finished,
deployed and live** — do not rebuild it. The still-true warnings from it are carried forward in §6, §8
and §9. One thing in it is now **false and dangerous to trust**: it said two real shops must survive in
the Blob store. The store is now empty — see §3.

---

## 0. RESOLVED 2026-07-24 — read this before anything below

**This handoff is history. Everything it lists as pending is committed, pushed and
deployed.** `main` is at `6c81a07`, clean and in sync with `origin/main`.

Verified live 2026-07-24, not remembered: `GET /api/state?k=187cdea…` returns
`{"error":"deleted","owner":false,"shopId":"187cdea…"}` — the `shopId` field is
present, which §5 below names as the exact tell that the server half is deployed.
All five verify suites pass (**126 checks**, up from the 96 quoted below).

Two things changed after this file was written, and it contradicts both:

1. **A delete now wipes the owner's device too.** §2 and §5 describe owner devices
   deliberately keeping their local copy. Ethan tested that on 2026-07-24, saw the
   signup form sitting on top of his still-populated shop, and called it a bug —
   correctly, since it reads as "the delete did nothing." Delete now means clean
   slate everywhere, which makes it the one button that can erase a café's last
   copy; the confirm dialog and the privacy page both say so now.
2. **The security audit is fully closed.** `safetysurface.md` was itself stale for
   three days — it described HIGH-1 (public blobs) as open long after the migration
   to the private store. Corrected and re-verified from scratch on 2026-07-24.

**There is no pending task in this file.**

---

## 1. TL;DR *(as written 2026-07-23 — superseded by §0)*

Ethan pressed **delete cloud data** in his founder dashboard while testing, and the shop's own browser
did not return to the signup gate — it just carried on as if nothing happened. That is root-caused,
fixed, and verified. **Nothing is committed and nothing is deployed.**

- **Done:** the bug is reproduced in a test that failed before the fix and passes after it, the fix is
  written in `product/app.js` + `api/state.js`, and all 96 automated checks pass.
- **Pending, and it is Ethan's call:** commit, then `vercel deploy --prod --yes`. The client half of
  the fix works without the server half; the server half only starts helping once deployed. See §5.
- **Do NOT redo:** the investigation, the reproduction, or the test additions. §7 lists them.
- **Do not "fix" the one case that remains unfixable:** a browser that never turned on sync, or that
  already went local-only after an earlier delete, cannot be reached by anything the founder presses.
  There is no channel to it. Say that plainly to Ethan rather than adding a phone-home ping — he has
  repeatedly chosen dropping a metric over tracking a user.

---

## 2. What was actually wrong (the part that would take you an hour to re-derive)

The delete flow is: founder's dashboard → `DELETE /api/state` → a permanent tombstone at
`owners/<shopId>.json` → every later read of that shop answers **410 deleted** → the customer's browser
reacts in `syncDeletedSignal()` in `product/app.js`.

The happy path was never broken. A clean browser, driven against **production**, went back to the gate
in 24 seconds — measured, not assumed. So the reported symptom had to come from a branch nobody had
exercised, and it did:

`syncDeletedSignal()` had to decide "is this dead shop mine?" before wiping anything. It accepted two
proofs, and Ethan's exact test pattern defeats **both at once**:

1. **`portafile.v1.synced`** is only written after a device's first successful *200 GET*. The device
   that **creates** a shop seeds it with a PUT and doesn't GET until its next 30-second poll — so any
   shop deleted within ~30 seconds of being made (i.e. every test cycle) has no `synced` marker.
2. **the server's `owner:true` flag** is computed from `ownerHash` inside the tombstone, which
   `api/state.js` copies from a Blob read that **can flake to null** (this repo already documents
   measuring exactly that), and which a pre-owner-token shop such as the legacy one never had at all.

With neither proof, the code fell into its "stale bookmark of someone else's shop" branch: it dropped
the sync key quietly, left the app open and the signup record intact, and **never showed the gate**.
That is precisely what Ethan saw.

A second, independent reason the delete can *look* dead: the browser only notices on its 30-second
poll, and browsers throttle and eventually freeze timers in a **background tab**. He was looking at the
dashboard, not the app. Both are fixed.

### The fix

- **`api/state.js`** — the 410 `deleted` body now carries the dead `shopId` (`resolveKey` returns it;
  `deleted()` includes it; all three call sites pass it). Safe to disclose *because* it is only ever
  disclosed for a tombstoned shop, which every path answers 410/404 for forever. It is a response body,
  never a URL, so the "shopId never in a URL" rule is untouched.
- **`product/app.js`** — `syncDeletedSignal(isOwner, deletedShop)` now treats
  `deletedShop === localStorage['portafile.v1.shopid']` as proof the dead shop is this browser's own.
  It cannot misfire on a real stale bookmark, because that device's shopid is its own *live* shop.
  The same `mine` flag now decides whether the local copy is kept — so a tombstone that lost its
  `ownerHash` can no longer make the founder's delete destroy an owner's only copy. That was a latent
  data-loss bug, not just a cosmetic one.
- **`product/app.js`** — re-checks sync on `visibilitychange` → visible and on `online`, so a
  backgrounded tab reacts the moment it is looked at instead of whenever the browser next unfreezes its
  timer. Guarded by `if (!syncPushT)`: a focus-pull must not land on top of an edit whose save is still
  inside its 800 ms debounce. `syncPush()` now zeroes `syncPushT` when it fires so that guard is real.

**Measured against live production, same flow, twice:** 24 s via the poll → **4 s** when the tab is
focused (and most of that 4 s was the test's own wait before simulating the focus).

---

## 3. Verified state (checked 2026-07-23)

| Thing | State |
|---|---|
| Repo | `/Users/ethanyap/portafile`, branch `main`, in sync with `origin/main`, HEAD `7c6a818` |
| Working tree | **Uncommitted.** Modified: `product/app.js`, `api/state.js`, `product/verify-sync.js` (+ `PROGRESS.md`, `CLAUDE.md`, `handoff.md` from the wrap-up) |
| Live site | `https://portafile.vercel.app` → 200; `/product/` → 200 |
| Deployed API | The server half is **NOT live**: `GET /api/state?k=187cdea…` returns `{"error":"deleted","owner":false}` with **no `shopId`** — that field appears only after a deploy |
| Founder dashboard | `http://localhost:4322/admin/dashboard.html` → 200, served by the LaunchAgent. Intentionally never deployed; `health_check.py` asserts it 404s in production |
| **Blob store contents** | **EMPTY.** `shops/` 0, `leads/` 0, `feedback/` 0 (metrics endpoint, read twice, agreed). The legacy shop `187cdea…` answers **410 deleted** — its tombstone is permanent and its shopId is dead forever |
| Tests | 96 checks, 0 failures: `verify-sync.js` 64 (was 59 — 5 added here), `verify-gate.js` 11, `verify-killpass.js` 10, `verify.js` 11, plus `verify-metrics.mjs` |
| Secrets | `ADMIN_KEY` in Vercel prod env + gitignored `.admin-key`; `BLOB_READ_WRITE_TOKEN` in gitignored `.env.local`. Never commit, never echo |
| Cost | Unchanged and free: Vercel Hobby + Vercel Blob, spend cap $0. This change adds no service and no new requests beyond one extra GET when a synced tab is focused |

**About the empty store:** the previous handoff insisted two real shops must survive. They no longer
exist — Ethan deleted them himself while testing this feature. Both `187cdeade66450652b3553fe8f758b24d7220ea6`
(the legacy shop, which deliberately had no `owners/` record) and `82ebcd8e73ff82f9c96da597cfb81bf3f3facf9c`
(his phone) are gone from the cloud. By design, an owner device keeps its **local** copy after a founder
delete, so his phone should still hold its own data — that was not verified from here, and it is worth
asking him. Nothing in this session deleted anything of his: the only shops this session created and
deleted were three throwaway test shops it made itself.

---

## 4. How to re-verify, and what was not checked

Run from `/Users/ethanyap/portafile`:

1. `node product/verify-sync.js` — 64 checks. The five that matter here are named
   `delete: seeding owner really has no synced marker`, `delete: nothing has happened yet (30s poll
   not due)`, `delete: tab reacts the moment it is looked at`, `delete: hashless tombstone still leaves
   the owner its data`, `delete: hashless tombstone still clears the dead credentials`. Three of them
   **fail on the pre-fix code** — that is the proof the fix is real, not decorative.
2. `node product/verify.js`, `node product/verify-gate.js`, `node product/verify-killpass.js`,
   `node verify-metrics.mjs`.
3. Two throwaway scripts live in this session's scratchpad — **a temp directory; copy them before
   relying on them**:
   `/private/tmp/claude-501/-Users-ethanyap-portafile/89fcb31d-e40e-43fe-89ea-bd9a212e6f27/scratchpad/`
   - `repro-delete.js` — drives the **real production** site end to end: signs up, turns on sync,
     deletes that shop through the dashboard's own button, then waits for the gate. It creates one real
     shop in the real store and deletes it in the same run; `/api/lead` is intercepted so no junk signup
     is written. It spoofs `navigator.webdriver` off, because the access gate deliberately skips
     automated browsers.
   - `smoke.js` — feedback modal, data menu, and the deep test that a focus-pull cannot clobber an
     unsaved edit.

**Not checked this session (say so, don't imply otherwise):** the marketing site's scroll-reveal
animations, the dashboard's metrics/feedback tables rendering, and printed output — none of their files
were touched. `health_check.py` was not run. Nothing was verified against the deployed version of the
server change, because it is not deployed.

---

## 5. The decision that is Ethan's, not yours

**Committing and deploying.** `git push` does **not** deploy this project; deployment is
`vercel deploy --prod --yes` from the repo root, and a previous session recorded that the agent's own
deploy/push commands were blocked — he runs them himself by typing the command with a `!` prefix.

Worth telling him when you ask:
- The client fix (`product/app.js`) helps as soon as it deploys, on its own.
- The server fix (`api/state.js`) is what closes the "seeding owner device" hole for good; until it
  deploys, a browser can still only fall back on the server's `owner` flag.
- Deploying touches the public product. Project rule: run `/still-works` before a deploy, and
  `/still-works live` after one.

---

## 6. Gotchas that will bite you

New from this session:

- **`admin/` is never deployed, so a dashboard-only change needs no deploy — but this change is not
  dashboard-only.** `product/` and `api/` both changed here, so this one does need a deploy to matter.
- **Headless Chromium reports every tab as `visible`**, and `page.bringToFront()` does not change that.
  You cannot test background-tab behaviour by opening a second page — dispatch the `visibilitychange`
  event directly and say in the test that that is what you did.
- **`#shopName` saves on `change`, not `input`.** A test that fills the field and fires `input` changes
  the DOM and nothing else, then quietly "passes".
- **The feedback modal opens from `#btnHelp` → `#hFeedback`**, not from a top-level button.

Carried forward and still true:

- **The repo's `CLAUDE.md` is the real gotcha list — read it fully before editing `api/state.js`.**
  The eventual-consistency rules ("never build an authorization check on a read", "revocation is a value
  comparison, never a missing blob", "a 404 never means revoked") were expensive to learn and are not
  negotiable. This session added a corollary: **do not build the client's own identity check on a
  server-side value that a flaky read can erase either.**
- **Vercel Blob is eventually consistent.** `list()` lags writes and deletes by seconds — fine for
  counting, never for resolving a known path or deciding authorization.
- **CSP blocks all inline `<script>` on deployed pages.** `admin/dashboard.html` uses inline script and
  `onclick=` and is safe only because it never deploys. Never move that pattern into `site/` or `product/`.
- **`.vercelignore` publishes only `site/`, `product/`, `video/`, `api/`, `vercel.json`, `package.json`.**
  A new top-level directory silently does not deploy.
- **`vercel.json` pins CORS to the prod origin except under `/api/`** — the localhost:4322 dashboard
  depends on that exception.
- **Playwright `addInitScript` re-runs on every navigation**, restoring a seed the test just wiped;
  `verify-sync.js` guards this with `pf-test-stopseed`.
- **`health_check.py` runs daily at 15:00 UTC** and emails him on failure. If you change page copy,
  update its expected marker strings or he gets a false alarm.

---

## 7. Don't redo

- The root-cause investigation in §2. It is settled and evidenced, not a theory.
- The five new cases in `product/verify-sync.js` and the no-key focus case added to
  `no-key: zero API calls (even on tab focus)`.
- Reproducing the happy path against production — done three times; it works.
- Searching for the bug in the founder dashboard. `admin/dashboard.html` is **not** at fault and was not
  changed this session; the previous session's addition of a delete button to the per-cafe table
  (commit `7c6a818`) is committed, pushed and fine.

---

## 8. How to work with Ethan (durable)

College student, learning developer. Not fluent in git, terminals, or deployment, but learning — teach
while doing. Typos are common; infer intent and proceed rather than asking about an obvious one.

- **Zero cost, always.** Cost questions get certainty, never "probably free" — name every service and
  whether it can bill him.
- **Terminal steps: numbered, ONE command per step, say what he should see, then wait** for his
  confirmation or screenshot before the next.
- **He runs deploys and pushes himself**, typing the command with a `!` prefix in the session.
- **Verify before saying done** — exercise the real feature, not just the tests. He asks for this
  explicitly and notices when it is skipped.
- **Lead with the outcome.** Short replies ("yes", "proceed", "yes push") mean: do exactly the pending
  step, nothing more.
- **Ponytail mode is on**: smallest solution that works, deliberate shortcuts marked with a `ponytail:`
  comment naming the ceiling.
- **After a milestone**, update `PROGRESS.md` (a founder's log, not a changelog), the repo `CLAUDE.md`
  gotchas, and the auto-memory at `~/.claude/projects/-Users-ethanyap-portafile/memory/`.
  `BUILD-LOG.md` is frozen — never edit it.

## 9. Machine-level warnings (outlive this task)

1. **Never trust System Settings → Storage for free space** — it counts iCloud-purgeable files and has
   been wrong by ~50 GB. Use `df -h /`.
2. **Do not touch the `flowise-main` or `postgres:16-alpine` Docker containers** — a separate live
   project on localhost:3010.
3. `Docker.raw` is ~13 GB and does not shrink on prune.
4. **Do not touch `~/Library/Application Support/Claude/vm_bundles`** (~6.8 GB) — Claude Desktop's VM.
5. **Never suggest "Keep Messages: 1 Year"** — it permanently deletes messages across all his devices.
6. Claude Code dies when Wi-Fi drops (`ENOTFOUND`). For an offline test, hand him ONE self-contained
   checklist he can run unattended.

---

## 10. The next task

**Ask him — do not guess.** The pending step is: commit the three changed files, then decide whether to
`vercel deploy --prod --yes`. He was told the fix is verified locally and against the live API, and that
the server half only takes effect once deployed.

Two things worth raising with him unprompted:

1. His Blob store is empty — both of his real shops are gone from the cloud (§3). If his phone still has
   its local copy, turning sync back on there re-creates a cloud shop with a **new** shopId; the old one
   is permanently dead.
2. The unreachable case: a browser that never synced, or that already went local-only from an earlier
   delete, will never return to the signup gate no matter what he presses. That is a property of a
   product with no accounts, not a bug to fix.

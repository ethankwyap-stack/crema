# HANDOFF — Portafile: link revocation shipped; NEXT TASK IS A SECURITY CHECK

**Written 2026-07-21 ~17:40 UTC. Every fact below was verified by running a command in this
session unless it is explicitly labelled "Ethan confirmed" or "unverified". Volatile facts (git,
live URLs, blob store, disk) were re-checked immediately before writing this file.**

You are picking this up cold. The product is **live and about to be handed to two real
coffee-shop owners.** Breaking it is worse than being slow.

---

## TL;DR

**Ethan's next task, in his words: "Will run a security check."** That is section 9. Everything
else in this file is background so you don't redo finished work.

**Done, deployed, and verified — do NOT rebuild any of it:** the three-part key model
(shopId / rotatable shareKey / owner token), hard-kill link revocation, three pre-flight UI
fixes, and `ONBOARDING.md` (a user guide for the two shops). Six commits, all deployed to
production, all four test suites green, and Ethan hand-tested the revocation flow on his own
phone and laptop — he confirmed "the steps worked."

**One thing still unconfirmed by a human:** the very last fix (revocation no longer erases the
browser's signup record) was deployed *after* Ethan's manual test. Its code is confirmed live and
it has an automated test, but he has not re-run the browser flow. Ask him whether he did.

**Do not delete blobs without asking.** See sections 4 and 5.

---

## 1. What this product is (one paragraph)

Portafile is a recipe-card + costing app for independent coffee shops: recipe cards carrying live
cost/margin, an espresso dial-in board per bean, training paths with sign-offs, and printable
packs. Static HTML/CSS/JS — **no framework, no build step, no database.** Shop data lives in
browser localStorage; an opt-in cloud copy lives in Vercel Blob, reached by a secret link
(`?k=<40 hex>`). The marketing site shows paid tiers ($29/mo "Shop", $149/mo "Roaster"), but
**no payment gate exists in code and nothing can bill anyone** — `ONBOARDING.md` tells the two
shops in writing that those prices are placeholders.

---

## 2. What was accomplished this session

### 2a. The three-part key model (was "Task 3")
Before: the secret link *was* the identity, the credential, and the storage path
(`shops/<k>.json`). A link could never be revoked, and there was no account object to attach a
subscription to. Now:

| Thing | Where it lives | Purpose |
|---|---|---|
| `shopId` (40 hex) | blob `shops/<shopId>.json`; localStorage `portafile.v1.shopid` | durable identity. **Never appears in a URL.** |
| `shareKey` (40 hex) | URL `?k=`; pointer blob `keys/<shareKey>.json` = `{shopId,created}` | what you hand to staff. Rotatable. |
| `ownerToken` (40 hex) | owner's localStorage `portafile.v1.owner` only; server stores **sha256** in `owners/<shopId>.json` = `{ownerHash,currentKey,created}` | proves ownership. Required to create a shop or rotate its link. Sent in the **`x-portafile-owner` header**, never a query string (query strings land in access logs). |

### 2b. Hard-kill revocation
Ethan's words: *"if a link gets deleted i don't want any of the features to be able to be used."*
A device told its link was replaced now wipes the shop's data out of that browser, sets
`portafile.v1.revoked`, and shows a full-screen lock that survives reload. Opening a *different*
working link clears the lock (the re-hired-barista path).

### 2c. THE ROAD NOT TAKEN — read this before you "fix" anything in `api/state.js`
The first two designs were **abandoned after being disproven by measurement**, not by taste:

1. **Revoke by deleting the old pointer blob.** Shipped, then found broken *in Ethan's real
   production data*: a link he had already reset was still opening his shop. Root cause —
   `list()` lags both writes and deletes, so rotate's "find the old key blob and delete it"
   found nothing to delete and silently succeeded.
2. **Revoke by treating a missing pointer as revocation.** Also wrong. Measured, repeatedly:
   two back-to-back reads of the same *existing* blob returned found, then null; reads after an
   overwrite served the **previous value** for seconds. Absence is not evidence. With a wipe
   attached to absence, a flaky read would erase a real shop off a staff device.

**The design that shipped:** pointers are **never deleted**. A link is dead when it is not
`owners.currentKey` — a value comparison against a blob that always exists — answered as **HTTP
410 `{error:'revoked'}`**. The client wipes **only** on 410, and only after **two** of them.
Every flaky read now fails safe.

### 2d. The three pre-flight UI fixes
- Gate copy no longer promises staff-phone sync "when it ships" (it shipped).
- The gate form (collects email + phone) now links to `/site/privacy.html`.
- Prices table wrapped in `.tablewrap{overflow-x:auto}` — at 390 px it clipped columns and made
  Chromium widen the layout viewport to 557 px, zooming the whole app out. Re-verified at 390 px
  in full Chromium: layout viewport stays 390, delete buttons reachable.

### 2e. `ONBOARDING.md` (repo root)
A ~1,260-word guide Ethan sends to the two shops: cost (free; tiers are placeholders), setup
walkthrough, what each of the five tabs does, sharing/revoking links, limits, how to report bugs.
**Offered but not built:** turning it into a styled shareable web page. He did not take it up.

---

## 3. Verified state (re-checked 2026-07-21 ~17:38 UTC)

| Thing | State |
|---|---|
| Repo | `/Users/ethanyap/portafile`, branch `main`, **working tree clean** |
| Last commit | `3c62a3d` "Add ONBOARDING.md — user guide for the two founding shops" |
| This session's commits | `324c8e1`, `a49654e`, `585f6af`, `fb6bd42`, `4135ad3`, `3c62a3d` |
| Deployed? | **Yes.** Latest production deploy `dpl_CjnRx9qH5s4qnivbsUgBtypokkCS`, aliased to portafile.vercel.app. Confirmed the newest client fix is in the served `app.js`. |
| Live URLs | `/` → 200, `/product/` → 200, `/site/privacy.html` → 200 |
| Live revocation proof | Ethan's leftover link `b555034f…` → **410**; his legacy link `187cdea…` → 200; his current phone-shop link `93af05e0…` → 200 |
| Hosting | Vercel project `ethan16/portafile`, **Hobby plan**. Ethan confirmed he has set the **$0 spend cap** and enabled **2FA** on GitHub + Vercel this session. |
| Blob store | 22 blobs: 13 `keys/`, 4 `shops/`, 3 `owners/`, 2 `leads/`. Only **2 shops are real** (see §5 warning). |
| Secrets | `ADMIN_KEY` in Vercel prod env + gitignored `~/portafile/.admin-key`; `BLOB_READ_WRITE_TOKEN` in gitignored `.env.local`. **Never commit or echo either.** |
| Dependencies | one: `@vercel/blob` 2.6.1, lockfile committed. `node_modules` was missing at session start — `npm install` fixed it. |
| Test suites | 4 in `product/`, **all passing**: `verify.js`, `verify-gate.js`, `verify-killpass.js`, `verify-sync.js` (now ~38 checks) |
| Playwright | present at `/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`; suites `require()` that absolute path |
| Disk | 33 GB free of 228 GB |
| Founder dashboard | `admin/dashboard.html` on http://localhost:4322/admin/dashboard.html via LaunchAgent `com.ethanyap.portafile-dashboard`. **`admin/` is deliberately NOT deployed** (`.vercelignore`) — it has no auth and is safe only because it 404s in production. |

---

## 4. Decisions still open — ASK ETHAN, DO NOT GUESS

1. **~18 leftover test blobs in the store.** My debugging created test shops/pointers/owners.
   I tried to bulk-delete them and **the auto-mode classifier blocked it.** They are harmless and
   free. He knows. He has not said to remove them. **Do not delete blobs without an explicit yes.**
2. **A duplicate signup blob.** `leads/` holds two identical `ethankw.yap@gmail.com` /
   "Tester Coffee" leads (13:46 and 17:02 UTC). The 17:02 one was caused by the signup-record bug
   (§2e / gotcha 4). He can delete it from the founder dashboard; he hasn't said he has.
3. **USPTO trademark knockout search on "Portafile"** — offered, not done. He now knows what
   USPTO means (he asked). Not a blocker for onboarding two shops; it matters before spending
   money on a domain or logo.
4. **Turning `ONBOARDING.md` into a shareable web page** — offered, no answer.

---

## 5. Gotchas — the ones that actually bit, in order of how much they cost

1. **VERCEL BLOB IS EVENTUALLY CONSISTENT. NEVER BUILD AN AUTHORIZATION CHECK ON A READ.**
   This cost most of the session. Measured, not assumed: back-to-back reads of the same existing
   path returned found → null; reads after an overwrite served the old value for seconds;
   `list()` lags writes *and* deletes. Consequences now baked into `api/state.js`, all four
   load-bearing — do not "simplify" any of them away:
   - Pointers are never deleted; revocation is `k !== owners.currentKey` → **410**.
   - A **404 never means revoked** (a flaky read makes one), so the client never wipes on 404.
   - Claiming a shopId — the one place where absence would grant authority — uses
     `put(..., {allowOverwrite:false})`, the store's **only atomic primitive**, instead of
     read-then-write. Without this, a flaky read let a *wrong* owner token claim an existing shop
     (observed).
   - Exact-path work uses `get(path,{access:'public',useCache:false})` and `del(path)`, never
     `list()`. `list()` is fine only for prefix scans like the dashboard's `leads/`.
   **Honest consequence to repeat to anyone:** revocation takes a few seconds to take effect.
   Fine for firing a barista; it is *not* a real-time kill switch.
2. **Do not write tests that assert immediately after a write.** That tests the CDN, not the
   code, and it produces spectacular fake failures. Ethan's explicit instruction when he saw me
   iterating on this: *"Stop tuning the harness — delete the timing-dependent test rather than
   making it pass."* Honor that. `verify-sync.js` mocks the API in-process and is deterministic;
   keep it that way.
3. **`get()` returns metadata in `.blob` and the body in `.stream`.** `r.blob.text()` is not a
   function. Use `new Response(r.stream).json()`. This would have 500'd every request in
   production; it was caught only because the handler was run locally against the real store first.
4. **The revocation wipe must skip `portafile.v1.lead*`.** It originally cleared every
   `portafile.v1*` key, which erased the "this browser already signed up" record — so a wiped
   device was asked to fill the access gate again and **wrote a duplicate lead blob into Ethan's
   store.** He hit this for real. There is a test for it now. The signup record is not a
   credential and grants nothing.
5. **An owner-token device must never be wiped or locked.** It holds the only copy of owner
   powers. On a 410 it settles and retries instead. A rotate also pauses the owner's own sync
   ~2.5 s so the consistency window can't look like a lockout to the person who just pressed the
   button.
6. **Root `/` is a rewrite of `/site/index.html`.** Relative URLs on that page resolve against
   `/` in production and 404. New references must be absolute (`/site/…`). Bit a previous
   session: `src="reveal.js"` → silent 404.
7. **CSP blocks ALL inline `<script>`.** Page JS must be external same-origin files. Inline
   `style=` attributes are fine.
8. **`.vercelignore` publishes ONLY `site/`, `product/`, `video/`.** A new top-level directory
   will not deploy until you edit it. **`admin/` must stay excluded.**
9. **`api/lead.js` must keep `Access-Control-Allow-Origin: *`** or the localhost:4322 founder
   dashboard's "Fetch signups" breaks. `vercel.json` pins every non-`/api/` path to the prod origin.
10. **The access gate skips `navigator.webdriver` browsers by design**, which is why the suites
    pass it. To see the gate in automation, override `navigator.webdriver` in an init script.
11. **Never submit the gate form against production** — it writes a real lead blob into his store.
12. **Deploys do not happen on `git push`** despite `vercel git connect`. Production only updates
    via `vercel deploy --prod --yes`.
13. **The agent cannot deploy or push** — the auto-mode classifier blocks `vercel deploy` and
    `git push`, and blocked a bulk blob delete. Hand Ethan the command prefixed with `!`.
14. **Two shops in the blob store are REAL — do not touch them:**
    `187cdeade66450652b3553fe8f758b24d7220ea6` (his legacy pre-owner-token shop; it has a
    `keys/` pointer but deliberately **no** `owners/` record, so its link works forever and
    cannot rotate — his explicit choice) and
    `82ebcd8e73ff82f9c96da597cfb81bf3f3facf9c` (the shop on his phone, current key
    `93af05e076c00bf4009dac33a288306a10cf701e`).

### Machine-level warnings (carried forward — these outlive any single task)
15. **Never trust System Settings → Storage for free space** — it counts iCloud-purgeable and has
    been wrong by ~50 GB. Always `df -h /`.
16. **Do not touch the `flowise-main` or `postgres:16-alpine` Docker containers** — a separate
    live project serving localhost:3010.
17. **`Docker.raw` is ~13 GB and does not shrink when images are pruned.**
18. **Do not touch `~/Library/Application Support/Claude/vm_bundles`** (~6.8 GB) — Claude
    Desktop's agent VM.
19. **Never suggest "Keep Messages: 1 Year."** It permanently deletes messages across all his
    devices. Data loss is a top anxiety.
20. **Claude Code dies when Wi-Fi goes off** (`ENOTFOUND`). Any offline test must be handed to him
    as ONE self-contained checklist he runs unattended, then reports back after reconnecting.
21. A completed local-AI-stack project provides a **free local LLM** if anything ever needs one:
    Ollama at `http://localhost:11434` (`qwen3.5:9b`), open-webui at `http://localhost:8888`,
    no API key, cannot bill him.

---

## 6. Reboot / persistence

- **The live site survives everything** — it's static files plus serverless functions on Vercel.
- **The founder dashboard** is a LaunchAgent (`com.ethanyap.portafile-dashboard`,
  `python3 -m http.server 4322`); it restarts with the machine. Its data lives in the
  localhost:4322 browser origin's localStorage — use its **Export backup** button before moving
  anything.
- **Weak link:** the owner token exists in exactly one browser per shop. If that browser is
  cleared, the shop's data survives (cloud + other devices) but the ability to revoke links is
  gone forever. There is no account recovery. `ONBOARDING.md` warns the two owners about this.

---

## 7. Don't redo

- The build in §2 — all deployed and verified.
- The 2026-07-18 security audit's fixes (`safetysurface.md`, `THREAT-MODEL.md`, `RE-AUDIT.md` in
  the repo) — but see §9, those documents are now **stale with respect to today's changes**.
- The earlier sync-safety pass (commit `57c2ea2`): PUTs carry a `ts`, the API 409s stale writes,
  the client snapshots to `portafile.v1.presync` before any pull-overwrite, and never pushes
  before its first successful pull.
- Ethan's Vercel $0 spend cap and 2FA — he confirmed both are done this session.

---

## 8. How to work with Ethan

College student, learning developer — not fluent in git, terminals or deployment, but learning,
so teach while doing. His standing rules also live in `~/.claude/CLAUDE.md`, loaded automatically.

- **Zero cost, always.** Cost questions get certainty, never "probably free." Name every service
  and whether it can ever bill him.
- **Terminal steps: numbered, ONE command per step, say what he should see, then wait.** He runs
  deploys himself with a `!` prefix. Watch for stray leading spaces — ` cd ...` failed once with
  `command not found`.
- **Verify before saying done.** Exercise the real feature. If something couldn't be tested, say
  so plainly.
- **Lead with the outcome** in the first sentence; everything important goes in the final message.
- Short replies ("yes", "proceed") mean: do exactly the pending step, nothing more.
- He runs **ponytail mode** (anti-over-engineering): smallest solution that works, stdlib and
  native platform features before dependencies, mark deliberate simplifications with a
  `ponytail:` comment. The codebase uses that convention — match it.
- He interrupts when you over-iterate. When he does, take the instruction literally and move on.

---

## 9. THE NEXT TASK — a security check

**Ethan said: "Will run a security check."** He will likely invoke the `/security-audit` skill
(it exists in `~/.claude/skills/`). Your job is to make that audit correct, not to pre-empt it.

**What the auditor most needs to know:**

- **The existing audit documents are STALE.** `safetysurface.md`, `THREAT-MODEL.md` and
  `RE-AUDIT.md` were written 2026-07-18 and describe the *pre-owner-token* world. Today's session
  replaced the entire key/authorization model and added a client-side data-wipe. Treat those
  files as history and re-audit `api/state.js` and `product/app.js` from scratch.
- **`safetysurface.md` documents sync-link revocation as DEFERRED/impossible. That is now
  obsolete** — it shipped today. Update it rather than trusting it.
- **The highest-value things to scrutinise**, because they are new and security-relevant:
  1. `api/state.js` — the 410-vs-404 distinction, the `allowOverwrite:false` atomic claim, the
     owner-token sha256 comparison, and the "owner may rebuild a lost pointer only with the
     current key" branch.
  2. `product/app.js` — the wipe path (`syncRevoked`), the two-strike rule
     (`syncRevokeSignal`), the `portafile.v1.synced` guard, and the lock screen. **A wrong
     condition here destroys a real shop's data on a real barista's phone.**
  3. Whether a 40-hex shopId leaking anywhere (logs, referrer, the `&shop=` query param on PUT)
     would let someone claim or damage a shop.
- **Known, accepted, already-explained-to-Ethan limits** — not findings, don't re-litigate:
  revocation takes a few seconds; a technical person can clear browser storage to escape the
  lock screen; an offline device never learns it was revoked; a backup exported before a reset
  still exists; edits are last-write-wins with no merging.

**Still open on him personally** (out of repo, unverifiable from here): the USPTO knockout search
and a domain.

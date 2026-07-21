# HANDOFF — Portafile: Task 3 (owner-token split) + 3 pre-flight fixes

> **DONE 2026-07-21** — Task 3 + all 3 fixes built, all 4 suites green (verify-sync now 26 checks), 390px re-verified, legacy blob kept via pointer-only (`keys/187cdea…` written, no owners/ record per Ethan). Awaiting Ethan's deploy, then live verify. Current state lives in `CLAUDE.md` + auto-memory; the spec below is historical.

**Written 2026-07-21 by the prior session. Every fact below was verified by running a command in that session unless explicitly labelled otherwise. Volatile facts (git, live URLs, blob contents, disk) were re-checked immediately before writing.**

You are picking this up cold. Read this whole file before touching code. The product is **live and about to be handed to two real coffee-shop owners** — breaking it is worse than being slow.

---

## TL;DR

**Do:** build Task 3 (owner-token + shopId/shareKey split), plus 3 small pre-flight fixes, run all four verify suites, then hand Ethan (a) the deploy command and (b) a phone dry-run checklist. Full spec below.

**Do NOT redo:** the security audit, the sync-safety pass (commit `57c2ea2`, already deployed and verified live), or the phone/live audit — all findings are recorded here.

**One open decision needs Ethan's answer before you finish Task 3** — the legacy shop blob (§5). Ask him. Do not guess and do not delete anything.

**You cannot deploy.** The auto-mode classifier blocks `vercel deploy` and `git push` for the agent. Ethan runs those himself with the `!` prefix.

---

## 1. What this product is (one paragraph)

Portafile is a recipe-card + costing app for independent coffee shops: recipe cards carrying live cost/margin, an espresso dial-in board per bean, training paths with sign-offs, and printable packs. Static HTML/CSS/JS, **no framework, no build step, no database**. All shop data lives in browser localStorage; an opt-in cloud copy lives in Vercel Blob, reached by a secret link (`?k=<40 hex>`). Business plan sells a $29/mo "Shop" tier whose deliverable is that sync — but **no payment gate exists in code today; everything is free and unlocked for everyone.**

---

## 2. Verified state (re-checked 2026-07-21, immediately before writing)

| Thing | State |
|---|---|
| Repo | `/Users/ethanyap/portafile`, branch `main`, **working tree clean** |
| Last commit | `57c2ea2` "Sync safety: stale-write 409 guard, presync snapshot, no-push-before-pull, state rate limit" |
| Live site | https://portafile.vercel.app → **200**; https://portafile.vercel.app/product/ → **200** |
| Deployed? | Yes — `57c2ea2` is live in production and was verified against the real API (see §3) |
| Hosting | Vercel project `ethan16/portafile`, plan **Hobby**, **no payment method on file** (checked via Vercel API `/v2/user` → `billing.plan = hobby`, no `paymentMethod` key). It cannot bill him. |
| Blob store | `x5ibkklkuewcvfr9.public.blob.vercel-storage.com` — contains **3 lead blobs** and **1 shop blob** (see §5) |
| Secrets | `ADMIN_KEY` in Vercel prod env + gitignored `~/portafile/.admin-key`; `BLOB_READ_WRITE_TOKEN` in gitignored `.env.local`. **Never commit or echo either.** |
| Dependencies | one: `@vercel/blob` 2.6.1, lockfile committed |
| Verify suites | 4 files in `product/`, **all passing** as of this session: `verify.js`, `verify-gate.js`, `verify-killpass.js`, `verify-sync.js` (15 checks) |
| Playwright | reinstalled this session — both `chromium` (full, 171 MB) and `chromium-headless-shell` present in `~/Library/Caches/ms-playwright/`. Suites `require()` it by absolute path `/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright` |
| Disk | 33 GB free of 228 GB |
| Founder dashboard | `admin/dashboard.html`, served at http://localhost:4322/admin/dashboard.html by LaunchAgent `com.ethanyap.portafile-dashboard`. **`admin/` is deliberately NOT deployed** (`.vercelignore`) — it has no auth. That exclusion is load-bearing; never deploy it. |

---

## 3. Already done this session — do not redo

**A full pre-launch audit** (security, data safety, reliability, onboarding, payment-readiness). Findings that were fixed and shipped in `57c2ea2`:

- Sync writes now carry a `ts`; `api/state.js` returns **409** on a PUT older than the stored blob; the client reacts by pulling instead of clobbering.
- Client snapshots local state to `localStorage['portafile.v1.presync']` before any pull overwrites it.
- Client never pushes before its first successful pull (`syncPulled` flag, `app.js:131`) — stops a freshly-reseeded browser overwriting real cloud data.
- `navigator.storage.persist()` best-effort at boot.
- `api/state.js` PUT rate-limited 120/10 min/IP.

**Verified live against production** with a throwaway key: first PUT → 200, older-ts PUT → **409**, newer-ts PUT → 200, GET returned the newest copy. Test blob deleted afterward (confirmed 404).

**Live phone audit** (real Chromium at 390×844 against production, gate never submitted): gate renders correctly; all five tabs render; **zero page errors**; no horizontal overflow on Recipes/Dial-in/Training/Print; tab bar is swipeable so Print is reachable; Data menu offers "Turn on sync" in production; 15 seeded cards load. The **one** problem found is fix #3 below.

---

## 4. THE TASK

### 4a. Task 3 — owner-token + shopId/shareKey split

**Why:** today the secret link is simultaneously the identity, the credential, and the storage path (`shops/<k>.json`). Consequences: a link can never be revoked (a barista who quits keeps access forever), and there is no account object to attach a subscription to. Ethan has 2 shops onboarding imminently and intends to charge later. Doing this now is cheap; doing it after they have data means a migration and a "your link changed" conversation.

**Target model:**

| Thing | Where it lives | Purpose |
|---|---|---|
| `shopId` (40 hex) | blob `shops/<shopId>.json`; client localStorage `portafile.v1.shopid` | durable identity. **Never appears in a shareable URL.** The thing billing attaches to later. |
| `shareKey` (40 hex) | URL `?k=`; pointer blob `keys/<shareKey>.json` = `{"shopId":"…","created":<ms>}` | what you hand to staff. **Rotatable.** |
| `ownerToken` (40 hex) | owner's localStorage `portafile.v1.owner` only; server stores **sha256 hash** in `owners/<shopId>.json` = `{"ownerHash":"…","currentKey":"…","created":<ms>}` | proves ownership. Required to create a shop or rotate its link. Hash-at-rest so a blob leak ≠ ownership. |

**API after the change** (`api/state.js`):

- `GET /api/state?k=<shareKey>` → read `keys/<shareKey>.json`; **miss → 404 `{error:'unknown-key'}`**; hit → return `shops/<shopId>.json`.
- `PUT /api/state?k=<shareKey>` → resolve pointer; **miss → 404 `unknown-key` and CREATE NOTHING**; hit → existing ts/409 guard → write.
- `PUT /api/state?k=<shareKey>&shop=<shopId>` **with header `x-portafile-owner: <ownerToken>`** → the create/claim path. Creates only when `keys/<shareKey>` is absent AND `owners/<shopId>` is absent; otherwise requires `sha256(ownerToken) === stored ownerHash`.
- `POST /api/state?action=rotate&shop=<shopId>` **with header `x-portafile-owner`** → verify hash → mint a new shareKey server-side → write new `keys/<new>.json` → delete `keys/<currentKey>.json` → update `owners/<shopId>.currentKey` → return `{k:"<new>"}`.

> **Put the owner token in the `x-portafile-owner` header, never in the query string.** Query strings land in access logs. The shareKey is already a query param (existing design, leave it); the owner token is strictly more powerful, so it goes in a header. Requests are same-origin, so no CORS complication.

**Client changes** (`product/app.js`):

1. Add `OWNER_KEY = 'portafile.v1.owner'` and `SHOP_KEY = 'portafile.v1.shopid'` near `SYNC_KEY` (**line 116**).
2. **Sync-on handler (line 485–489):** mint three independent 40-hex values (`crypto.getRandomValues`, 20 bytes each) — shopId, ownerToken, shareKey. Store shopId + ownerToken locally, then `location.search = '?k=' + shareKey` as today.
3. `syncPush()` (**line 132**): when localStorage holds an ownerToken + shopId, send `&shop=<shopId>` and the `x-portafile-owner` header. Staff devices simply don't have them and send neither.
4. **`syncPull()` 404 branch (line 148) — THE critical change.** Today 404 means "first device, seed the cloud." That single line is exactly why revocation is impossible (documented as deferred in `safetysurface.md`); if you leave it, rotation is theatre because any old device re-creates the shop. New behaviour:
   - **Holds an ownerToken** → our shop, not created yet → `syncPulled = true; syncPush()` (creation path).
   - **No ownerToken** (staff device, or a revoked link) → **do not create anything**, set a `revoked` sync status, show a badge like *"this link no longer works — ask the owner for a new one"*, stop the 30 s poll, and **leave local data untouched**.
   - A PUT answering 404 `unknown-key` gets the same treatment.
5. **Data menu:** if the device holds an ownerToken, show a **"Reset staff link"** button → POST rotate → store and display the new link, and state plainly that old links have stopped working. Hide it on non-owner devices. (`dSyncOff` at line 491 is local-only and stays as-is.)
6. **Lead↔shop linkage (audit item I3):** when a shop is first created, if `localStorage['portafile.v1.lead']` exists, re-POST it to `/api/lead` once with the `shopId` attached, guarded by a `portafile.v1.lead.linked` flag. Server (`api/lead.js`, lead object at **line 42**) accepts an optional `shopId`, validated as 40 hex, and stores it. This is what lets Ethan answer "which signup owns which data" — impossible to reconstruct later.

**Required test coverage** — extend `product/verify-sync.js` (its mock API must mirror the new endpoints, as it already mirrors the 409 guard) and keep all 15 existing checks green:
- a link whose pointer is missing does **not** create a blob and does **not** wipe local data;
- after rotate, the **old** key fails and the **new** key works;
- creation without an owner token is refused;
- a staff device (no owner token) can still read **and** write normally.

### 4b. The three pre-flight fixes

**Fix 1 — stale gate copy.** `product/app.js:666` currently reads *"Tell us who's using it so we can let you know when staff-phone sync ships."* Sync has shipped; the user turns it on minutes later. Ethan approved this replacement:
> "Portafile is free. Tell us who's using it so we know which shops to build for — and so we can help if something breaks."

**Fix 2 — no privacy link on a form collecting email + phone.** The gate form (`app.js:662–675`) links to nothing. `site/privacy.html` already exists and already says the right things (email only, unsubscribe, delete on request). Add a link near the existing hint at **line 674**, pointing at **`/site/privacy.html`** — absolute path, per the rewrite gotcha in §6 — with `target="_blank" rel="noopener"`.

**Fix 3 — Prices tab is unusable on a phone.** Root cause verified, not guessed: `product/styles.css:71` sets `table.grid { overflow:hidden }` and the inputs are fixed-width (`input.wide` 170 px + numeric 90 px), so the table needs **~540 px**. On a 390 px phone it cannot scroll — it clips the "Used in" column and the delete button, and Chromium responds by widening the layout viewport to 557 px, **zooming the whole app out**. Fix: wrap the table in a scroll container — `<div class="tablewrap">` around the table in `viewPrices()` (opens **app.js:287**, closes **line 299**) plus a CSS rule `.tablewrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }`. Keep `overflow:hidden` on the table itself (it's there for the rounded corners). Native scrolling, no JS. Re-verify at 390 px afterward.

---

## 5. THE OPEN DECISION — ask Ethan, do not guess

The blob store contains **one existing shop blob**:

```
shops/187cdeade66450652b3553fe8f758b24d7220ea6.json   6586 bytes   uploaded ~2026-07-17
```

Under the new model, `shops/<shopId>.json` is reachable only through a `keys/` pointer, so this blob becomes **unreachable unless a pointer is created for it**. Two clean options — both avoid writing any legacy-compatibility code:

- **(a)** It's throwaway test data → delete the blob, do nothing else. *Smallest diff; likely correct — 6586 bytes is about the size of untouched demo seed data.*
- **(b)** He wants it kept → create `keys/187cdeade66450652b3553fe8f758b24d7220ea6.json` pointing at shopId `187cdeade66450652b3553fe8f758b24d7220ea6` (reuse the same string as both shareKey and shopId for this one shop) plus an `owners/` record. His existing link then keeps working with zero compat code.

**Ask him which. Never delete a blob without an explicit yes.** The prior session could not inspect the blob's contents — the classifier blocked fetching the public blob URL — so its actual contents are **unverified**.

Related and also unverified: a lead blob was written **~2 h before this handoff** (`leads/1784641601758-ec977dd0-…json`). It was *not* created by the prior session's testing (that test never submitted the form, and its fake email would have failed the server's regex). It may be a genuine visitor or Ethan's own visit. He can check it in the founder dashboard.

---

## 6. Gotchas — the ones that will actually bite you

**Repo-specific:**
1. **Root `/` is a rewrite of `/site/index.html`.** Relative URLs on that page resolve against `/` in production and 404. Any new script/asset/link reference must be absolute (`/site/…`). This has bitten before (`src="reveal.js"` → silent 404).
2. **CSP blocks ALL inline `<script>`.** Page JS must be external same-origin files. Inline `style=` attributes are fine.
3. **`.vercelignore` publishes ONLY `site/`, `product/`, `video/`.** A new top-level directory will not deploy until you edit it. **`admin/` must stay excluded** — it has no auth and is safe only because it 404s in production.
4. **`api/lead.js` must keep `Access-Control-Allow-Origin: *`** or the localhost:4322 founder dashboard's "Fetch signups" breaks. `vercel.json` pins every non-`/api/` path to the prod origin.
5. **The access gate skips `navigator.webdriver` browsers by design**, which is why the suites pass it. To see the gate in automation, override `navigator.webdriver` in an init script.
6. **Never submit the gate form against production** — it writes a real lead blob into Ethan's store. Bypass it by setting `localStorage['portafile.v1.lead']` **and** `portafile.v1.lead.sent` in an `addInitScript` before load.
7. **`syncPull()`'s "404 → seed the cloud" line is the reason revocation was previously impossible.** If Task 3 leaves it intact, link rotation is fake. See §4a step 4.

**Tooling / environment:**
8. **Playwright's browsers were deleted by an earlier disk cleanup** and had to be reinstalled this session. If a suite dies with "Executable doesn't exist", run `node /Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/cli.js install chromium`.
9. **Old headless Chrome clamps width to ~500 px and fakes mobile overflow.** For real phone-viewport testing launch with `channel: 'chromium'` (the full browser, now installed), not the default headless shell. The prior session's numbers came from the full browser.
10. **You cannot deploy or push.** The auto-mode classifier blocks `vercel deploy` and `git push` for the agent, and also blocked `curl` against the public blob host. Hand Ethan the command prefixed with `!`.
11. **Deploys do not happen on `git push`** despite `vercel git connect`. Production only updates via `vercel deploy --prod --yes`.

**Machine-level (carried forward from the previous handoff; still true):**
12. **Never trust System Settings → Storage for free space** — it counts iCloud-purgeable and has been wrong by 50 GB. Always `df -h /`.
13. **Do not touch the `flowise-main` or `postgres:16-alpine` Docker containers** — a separate live project on localhost:3010.
14. **`Docker.raw` is ~13 GB and does not shrink when images are pruned.**
15. The completed local-AI-stack work (Ollama on `127.0.0.1:11434`, open-webui on `localhost:8888`, zero cost, no API key) is recorded in `~/.claude/projects/-Users-ethanyap/memory/project_local_ai_stack.md`. Free local LLM if anything ever needs one.

---

## 7. Definition of done

1. Task 3 built as specced in §4a, with the four new checks added to `verify-sync.js`.
2. All three fixes from §4b applied.
3. **All four suites pass**: `node product/verify.js`, `verify-gate.js`, `verify-killpass.js`, `verify-sync.js`.
4. Prices tab re-verified at 390 px width with the full Chromium (no clipping, no layout-viewport widening).
5. `product/CLAUDE.md`… actually **`~/portafile/CLAUDE.md`** — add the new key model to Gotchas (the file already documents the `ts`/409 rule; extend it).
6. Auto-memory updated: `~/.claude/projects/-Users-ethanyap/memory/project_portafile.md`.
7. Hand Ethan the two deliverables below.

**Deliverable A — the deploy command** (he runs it, one step at a time):

```
! cd ~/portafile && git add -A && git commit -m "<message>"
! cd ~/portafile && vercel deploy --prod --yes
```

Then verify the live endpoints yourself with a throwaway key (create → rotate → confirm old key 404s → delete the test blobs), as the prior session did for the 409 guard.

**Deliverable B — a phone dry-run checklist** for Ethan to run on his own iPhone before sending anything to the two shops. This exists because **real iOS Safari cannot be tested from here** — emulated Chromium is not Safari, and Safari is exactly where storage eviction and clipboard behaviour differ. The checklist should walk: open the link → fill the gate → rename the shop → turn on sync → copy the link → open it in a second browser → change an ingredient price and watch cards re-price → print one recipe card → reset the staff link and confirm the old one stops working.

---

## 8. How to work with Ethan

He is a college student and a learning developer — not fluent in git, terminals, or deployment, but learning, so teach while doing. His standing rules (also in `~/.claude/CLAUDE.md`, loaded automatically):

- **Zero cost, always.** Cost questions get certainty, never "probably free." Name every service and whether it can ever bill him.
- **Terminal steps: numbered, ONE command per step, say what he should see, then wait** for his confirmation or screenshot before the next step.
- **Verify before saying done.** Exercise the real feature; if something couldn't be tested, say so plainly.
- **Lead with the outcome** in the first sentence. Everything important goes in the final message — he doesn't watch the process.
- Short replies ("yes", "proceed", "do all") mean: do exactly the pending step, nothing more.
- Screenshots from him are bug reports or "where do I click" questions — read the image before answering.
- He is running **ponytail mode** (a laziness/anti-over-engineering skill): prefer the smallest solution that actually works, stdlib and native platform features before dependencies, and mark deliberate simplifications with a `ponytail:` comment. The codebase already uses that convention — match it.

---

## 9. The next task after this one

Nothing is queued beyond §4 and the two deliverables. Once Ethan has deployed and done his phone dry run, he onboards the two coffee-shop owners — each on **their own device with their own link** (one browser = one shop's data; two shops must never share a link, since separate links are the only isolation mechanism).

Known remaining work, deliberately **not** part of this task: no monitoring or alerting exists (he'd learn about an outage from a phone call), and backups are the cloud copy plus whatever JSON a user exports. Both were classed "important, not critical" for two hand-held users. His outstanding non-code to-dos: confirm the Vercel billing page, 2FA on GitHub + Vercel, USPTO knockout search on "Portafile", and a domain.

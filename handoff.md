# HANDOFF — Portafile: security audit DONE; NEXT TASK IS FIXING THE FINDINGS

> **UPDATE 2026-07-21 ~18:55 UTC:** MEDIUM-1 and LOW are **FIXED, deployed, and verified live**
> (commits `2b53edd`, `9a301d7`, pushed). shopId now travels in an `x-portafile-shop` header
> (server, client PUT + rotate, verify-sync mock all updated; 7-check live test passed against prod
> with throwaway data, test blobs cleaned up). CI actions pinned by SHA, dependabot cooldown added,
> and the `pull_request` trigger removed (gitleaks 403'd on Dependabot PRs — pre-existing; push runs
> cover the same commits). **Only HIGH-1 (private Blob store migration, §2) remains — awaiting
> Ethan's go/no-go.** §§1–3 below predate these fixes.

**Written 2026-07-21 ~18:10 UTC. Every fact below was verified by a command run this session unless
labelled "unverified" or "Ethan to confirm." You are picking this up cold. The product is LIVE and
about to onboard two real coffee-shop owners — breaking it is worse than being slow.**

---

## TL;DR — what you're here to do

The security audit is **finished** (report: `safetysurface.md`, dated 2026-07-21). It found **one High,
one Medium, and some Low/cosmetic** issues. **Ethan's instruction: "fix all the security issues."**

The catch: the **High fix is not a code change — it's a live-data migration** (details in §2). It needs
dashboard actions only Ethan can do, and it moves the data for the two shops about to onboard. So
**before touching anything, confirm the plan and scope with Ethan** (§2d) — this is high blast-radius
work on a live product, and he decides go/no-go on the migration. The Medium and Low fixes are small and
independent; you can do those regardless.

**Do NOT re-run the audit or re-derive the findings.** They're verified and written up. Your job is the fixes.

---

## 1. The findings (from `safetysurface.md`, all verified live this session)

| # | Severity | What | Fix shape |
|---|---|---|---|
| HIGH-1 | 🟠 High | Vercel Blob store is **public**, so a revoked staff link can be walked directly against the store host to read all shop data **and recover the current (rotated) link**. Verified: direct reads of `keys/`, `owners/`, `shops/` return 200, and the `owners` blob leaks `currentKey` = the live link. Defeats the revocation feature at the storage layer. | **Migrate to a private Blob store** (§2). Not a one-liner. |
| MEDIUM-1 | 🟡 Med | `product/app.js:201` puts the shopId in the PUT query string (`&shop=…`) → lands in access logs. | Move `shop` into a request header like the owner token. Small. §3. |
| LOW | 🔵 Low | `.github/workflows/security.yml` pins actions by mutable tag; `dependabot.yml` no cooldown. | Pin to commit SHAs; add cooldown. Cosmetic. §3. |
| (n/a) | — | 3 semgrep code hits are **false positives** (favicon data-URI "missing integrity"; localhost test servers; a test-fixture path-join). Don't "fix" them. | Leave as-is. |

**Why HIGH-1 is High and not Critical (don't panic, but don't skip it):** the store hostname
(`x5ibkklkuewcvfr9.public.blob.vercel-storage.com`) is a random subdomain that **never reaches the
browser** — the app only reads storage server-side — and the repo is **private**, and the bucket
**can't be listed** (verified: `?prefix=` → 400). So a normal staff member cannot learn the hostname
through using the app. The whole model rests on that hostname staying secret. It breaks the moment the
repo goes public, a screenshot shows a storage URL, or an error leaks one. The hostname is already in
git history (an old `safetysurface.md`) — harmless while the repo is private; a live exposure the
instant it isn't. The migration to a private store makes the old public hostname dead, resolving that too.

---

## 2. HIGH-1 fix — migrate to a PRIVATE Blob store (the real work)

### 2a. The blocker I discovered (verified — do not re-litigate)
Blob **access is a STORE-LEVEL property, fixed when the store is created.** You cannot flip the existing
public store to private. Proof, run live this session: overwriting a public blob with `access:'private'`
returned `Vercel Blob: Cannot use private access on a public store. The store must be configured with
private access.` And the docs confirm: *"the store itself determines whether files are private or public."*

**So the fix = create a NEW private store, migrate the data into it, swap the token, flip the code.**

### 2b. Verified facts about private stores (so you don't re-research)
- `@vercel/blob` **2.6.1** (already installed) supports it — private storage needs SDK ≥ 2.3.
- Read pattern is nearly identical to what `api/state.js` already does: `get(path, {access:'private',
  useCache:false})` — server-side, authed automatically via `BLOB_READ_WRITE_TOKEN`. Direct browser
  reads of a private-store URL return unauthorized (that IS the fix).
- **Cost (Ethan's #1 anxiety — answer with certainty):** private storage is **not plan-gated** (the
  create-store flow offers Private on any plan; docs mention no Hobby restriction). Reads are billed as
  standard Blob Data Transfer + Fast Origin Transfer. At this workload — 2 shops, ~1 poll/30s, tiny JSON
  blobs — it's **negligible**, and the **$0 spend cap** Ethan set is the hard backstop. The current code
  already reads with `useCache:false` (origin reads), so per-read cost barely changes.
- Private URLs are `https://<newstore>.private.blob.vercel-storage.com/…`.

### 2c. The migration plan (draft — confirm with Ethan first, then walk him through it ONE step at a time)
1. **Ethan (dashboard):** Storage tab → Create → Blob → **access: Private** → name it (e.g.
   `portafile-data-private`) → connect to project `ethan16/portafile`. This adds a **new
   `BLOB_READ_WRITE_TOKEN`** (or a prefixed var) pointing at the private store. **Hazard:** don't let it
   clobber the old token env var until cutover — you need both stores reachable during the copy.
2. **Copy the data** old→new. Real blobs that MUST survive (verified live this session):
   - `shops/82ebcd8e73ff82f9c96da597cfb81bf3f3facf9c.json` (his phone shop) + its `owners/…` +
     `keys/93af05e076c00bf4009dac33a288306a10cf701e.json`.
   - `keys/187cdeade66450652b3553fe8f758b24d7220ea6.json` (legacy shop, shareKey==shopId, **no owners
     record by design** — its link can't rotate; keep it that way).
   - `shops/187cdea….json` if present, and the real `leads/` blobs.
   - Skip the ~18 leftover **test** blobs and the duplicate `leads/…17:02` "Tester Coffee" lead.
   - The SDK `copy()` won't cross stores; do it as get-from-old-token → put-with-new-token (write a
     throwaway node script using both tokens explicitly).
3. **Code:** change `access:'public'` → `access:'private'` on every `put`/`get` in `api/state.js`
   (`readJson`, `writeJson`, both `put` calls) **and** fix `api/lead.js:61` — it reads leads with
   `fetch(b.url)`, which **won't work on a private store**; switch to `get(pathname,{access:'private'})`.
   Keep the leads list via `list()` (still works with the token).
4. **Swap** the prod env token to the new store's, and update the gitignored local `.env.local`.
5. **Deploy** (`vercel deploy --prod --yes` — Ethan runs it with a `!` prefix; the agent can't deploy).
6. **Verify live:** direct fetch of a `.private.blob…` URL without auth → unauthorized; the app on his
   phone still loads/syncs; rotate + revocation flow still works end-to-end. Re-run all four verify suites.

### 2d. STOP-AND-CONFIRM before executing 2c
This moves live data for two onboarding shops, needs Ethan's dashboard actions, and swaps a production
secret. Blast radius is high. **Present the plan, get his explicit go-ahead, and do it as a numbered,
one-command-at-a-time walkthrough.** Also fair to put to him honestly: HIGH-1 is a *gated* risk (not
reachable by a normal user today), so a lower-effort alternative is to **defer the migration and instead
guarantee the hostname never leaks** (keep the repo private; scrub the hostname from committed docs). He
said "fix all issues," so default to the migration — but let him choose with the cost/effort in view.

### 2e. The road NOT to take
Do **not** try to fix this by deleting revoked pointers or dropping `currentKey` from the owners blob —
the shop blob is still directly readable, and the whole design deliberately never deletes pointers
(eventual consistency; see repo CLAUDE.md). Private store is the clean, native fix. Encrypting fields at
rest is more code for less benefit — skip it.

---

## 3. MEDIUM-1 and LOW fixes (small, independent, do anytime)
- **MEDIUM-1:** in `product/app.js` `syncPush()` (line ~201), stop appending `&shop=<shopId>` to the URL;
  send it as a header (e.g. `x-portafile-shop`) alongside `x-portafile-owner`, and read
  `req.headers['x-portafile-shop']` in `api/state.js` instead of `req.query.shop`. Update the PUT-create
  branch accordingly. Re-run `verify-sync.js`.
- **LOW:** in `.github/workflows/security.yml`, replace `@v2`/`@v4` action tags with pinned commit SHAs;
  add a `cooldown:` block to `.github/dependabot.yml`. Cosmetic for a private repo; do last.

---

## 4. Current repo state (verified 2026-07-21 ~18:08 UTC)
- Repo `/Users/ethanyap/portafile`, branch `main`. HEAD = `4f38d0d`.
- **Uncommitted working-tree changes from this audit** (not yet committed — the agent can't push; Ethan
  commits himself): `safetysurface.md` (rewritten, this audit), `RE-AUDIT.md` (updated), and a new
  `extras/safetysurface-2026-07-18.md` (archive of the prior report). Nothing else changed. **No code was
  touched** — the audit is read-only, and HIGH-1 was left for Ethan's go-ahead.
- All four verify suites pass: `verify.js`, `verify-gate.js`, `verify-killpass.js`, `verify-sync.js`.
- Deps clean: `@vercel/blob` 2.6.1 only; osv-scanner 0 CVEs; gitleaks 0 leaks across 27 commits.
- Secrets: `BLOB_READ_WRITE_TOKEN` in gitignored `.env.local`; `ADMIN_KEY` in Vercel prod env + gitignored
  `.admin-key`. Never commit or echo either.
- Live: `/`, `/product/`, `/site/privacy.html` → 200. `/admin*` → 404 in prod (correctly not deployed —
  the no-auth dashboard is safe only because it 404s). Headers all strong (CSP, HSTS preload, nosniff,
  frame DENY, COOP/CORP). Rate limiter fires (429). All still true.

## 5. Real data — DO NOT DESTROY (verified live)
Two shops are real and must survive any migration:
- `187cdeade66450652b3553fe8f758b24d7220ea6` — legacy, pointer==shopId, **no owners record** (link can't
  rotate, Ethan's choice).
- `82ebcd8e73ff82f9c96da597cfb81bf3f3facf9c` — his phone, current key `93af05e076c00bf4009dac33a288306a10cf701e`.
Do **not** delete blobs without an explicit yes (the agent's bulk-delete was blocked by the classifier
anyway). ~18 test blobs and one duplicate lead are harmless leftovers.

## 6. How Portafile works (one paragraph so you don't misread the code)
Static HTML/CSS/JS, no framework, no build. Data lives in browser localStorage; opt-in cloud copy in
Vercel Blob reached by a secret `?k=<40hex>` link. Three-part key model: `shopId` (durable identity, in
`shops/<shopId>.json`, never in a URL), `shareKey` (the rotatable `?k=` link, pointer
`keys/<shareKey>.json`→shopId), `ownerToken` (sha256 at rest in `owners/<shopId>.json`, sent in the
`x-portafile-owner` **header**). Revocation = the link isn't `owners.currentKey` → **410**; the client
wipes a staff device only on **two** 410s, never on a 404, never on an owner device. Blob store is
**eventually consistent** — never build an auth check on a read; that rule is load-bearing (repo CLAUDE.md
has the full list of gotchas — read it before editing `api/state.js`).

## 7. How to work with Ethan
College student, learning dev — not fluent in git/terminals/deploys, but learning; teach while doing.
- **Zero cost, always.** Cost questions get certainty, not "probably free" — name every service and
  whether it can bill him. (Private store: negligible + $0 cap; say so plainly.)
- **Terminal/dashboard steps: numbered, ONE action per step, say what he should see, then wait.** He runs
  deploys/pushes himself with a `!` prefix (the agent's auto-mode classifier blocks `vercel deploy`,
  `git push`, and bulk blob delete). Watch for stray leading spaces — ` cd …` fails with `command not found`.
- **Verify before saying done** — exercise the real feature on the live site.
- **Lead with the outcome; short replies ("yes","proceed") = do exactly the pending step, nothing more.**
- He runs **ponytail mode** (anti-over-engineering) — smallest fix that works, native features over code,
  mark deliberate simplifications with `ponytail:` comments (the codebase uses that convention).

## 8. Machine-level warnings (outlive this task)
1. **Never trust System Settings → Storage for free space** (counts iCloud-purgeable, wrong by ~50GB) —
   use `df -h /`. ~33 GB free as of this session.
2. **Do not touch the `flowise-main` / `postgres:16-alpine` Docker containers** — a separate live project
   on localhost:3010.
3. **`Docker.raw` is ~13 GB and doesn't shrink on prune.** Don't plan on Docker cleanup for space.
4. **Do not touch `~/Library/Application Support/Claude/vm_bundles`** (~6.8 GB) — Claude Desktop's agent VM.
5. **Never suggest "Keep Messages: 1 Year"** — permanently deletes messages across all his devices. Data
   loss is a top anxiety.
6. **Claude Code dies when Wi-Fi drops** (`ENOTFOUND`). Any offline test → hand him ONE self-contained
   checklist he runs unattended, then reports back.
7. **The agent cannot deploy or push** — hand Ethan the command prefixed with `!`.

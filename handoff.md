# HANDOFF — cost-blob split shipped and deployed 2026-08-11 (superseded)

**Superseded 2026-08-11, later same session.** The resume sequence below (§3) is DONE: the one real
shop's shopId was fetched (`25a8f48cf9b4801399ccdcddc92b82d2c8d61e28` — only one real shop, not two;
the "two shopIds" memory in this file was unverified and wrong), `migrate-costs.mjs` was filled in,
dry-run confirmed 13 real ingredient costs, run for real against prod, then committed (`58962c6`) and
deployed via `git push origin main`. `/still-works` was explicitly skipped at Ethan's request before
this deploy. Live and verified (unknown-key canary answers its normal 404). See `PROGRESS.md`'s
`## 2026-08-11` entry for the current record — this file is left in place as a record of the reasoning,
not as something to act on again.

Project: `/Users/ethanyap/portafile`. Owner: Ethan (college student, learning developer).

> **Previous handoff (2026-07-27, the four Training tasks) is fully superseded** — that work shipped,
> deployed, and is long since old news; the rebrand to Crema (2026-07-28), a landing redesign
> (2026-08-01/02/05), a push-to-main deploy hook (2026-08-06), and now this cost-split all happened
> since. Archived at `handoff-archive/2026-07-27.md`. Do not read it for current state — read this
> file, and `CLAUDE.md` for anything durable (it is comprehensive and current as of this session).
>
> **Do not confuse this with `.handoff`** (dotfile) — a separate, already-resolved 2026-07-25 security
> handoff. Leave it alone.

---

## 1. TL;DR

Built and locally tested a real security fix: ingredient costs used to be hidden from staff devices
only in the UI — the actual numbers still synced down to their browser, readable in devtools. Now
`api/state.js` keeps costs in a separate blob (`costs/<shopId>.json`) and only ever sends them to a
request that proves it's the shop's owner. **[verified]** 30 new checks in `verify-api.mjs` all pass,
including the one regression this design exists to prevent (a staff device's autosave can't erase the
owner's real prices). **[verified]** all four other verify suites (`verify-sync.js` 64,
`verify-gate.js`, `verify-killpass.js`, `verify.js`) still green, untouched — client needed zero
changes.

**Nothing is deployed. Nothing is pushed.** Working tree has uncommitted edits; nothing committed this
session. See §3 for the exact resume sequence — it has a specific ORDER that matters (migrate before
deploy, not after) or real customer pricing data can be permanently destroyed. Do not skip reading why.

**Cost: $0.** No new service, account, dependency, or external request.

---

## 2. What was built and why (the reasoning, not just the diff)

Ethan asked "why does the data model dictate everything" (a `/watch` TikTok tip about ERDs led into
this), which turned into "does Portafile's schema already handle this" — answer: mostly yes (the
three-part shopId/shareKey/ownerToken split already existed and is good), but the app's own code had a
comment admitting one honest gap: `product/app.js` staffView() hid costs from the SCREEN only, and
explicitly said "a barista who opens devtools can read them... upgrade path if a shop ever needs a real
guarantee is server-side redaction." Ethan said "split costs into a separate blob owner-only" — this is
that upgrade, built for real.

**The one real danger, and why it took care to get right:** the client PUTs its WHOLE local state on
every save (`app.js` `syncPush()`: `{...S, ts: Date.now()}`), staff devices included. Once the server
redacts costs on GET, a staff device's local `S.ingredients[].unitCost` reads `0` (it never received
real numbers). If the server naively wrote whatever `unitCost` a PUT body carried into the new costs
blob, the NEXT staff autosave (e.g. checking off a sign-off, editing a dial-in) would silently zero out
the owner's real prices — no warning, no error, just gone. The code's own comment named this exact
failure mode before I wrote a line.

**The fix:** `shops/<shopId>.json` (the public blob) never stores a real `unitCost`, full stop,
regardless of who wrote it (`stripCosts()` runs on every PUT). `costs/<shopId>.json` is written ONLY
when the request's owner-token header hashes to match the shop's actual owner (`role === 'owner'`) — a
staff PUT still writes cleanly to `shops/`, but touches `costs/` not at all, so it can never overwrite
real data it doesn't have. Owner GETs merge the two blobs back together; staff GETs get `shops/` as-is,
which never had real numbers in the first place.

| Where | What changed |
|---|---|
| `api/state.js` | new `stripCosts()`/`extractCosts()`/`mergeCosts()` helpers; GET merges `costs/` in only for a proven owner; PUT strips costs from every write to `shops/` and only writes `costs/` for a proven owner; DELETE now also removes `costs/<shop>.json` (real prices must not survive "erase my data") |
| `product/app.js` | one comment updated (staffView() block) — was future-tense ("upgrade path if..."), now describes the shipped mechanism. **No functional client change** — the client already reads its role from the server response header and already tolerates `unitCost: 0` everywhere it's used |
| `verify-api.mjs` | +30 checks: owner sees real costs / staff never does / a staff autosave with zeroed local costs cannot erase the real costs / DELETE removes `costs/` too |
| `migrate-costs.mjs` | **new file**, NOT run yet — see §3 |
| `CLAUDE.md` | new gotcha paragraph documenting the split (search "Ingredient costs ARE now a real security boundary") |
| `PROGRESS.md` | new entry under `## 2026-08-11`, plus a new Open Threads bullet at the top of that list |

---

## 3. State — and the EXACT resume sequence (read the ordering reasoning, don't skip)

| Fact | Value | Confidence |
|---|---|---|
| Repo / branch | `/Users/ethanyap/portafile` / `main` | [verified] |
| Last commit | `f92906b`, matches `origin/main` (nothing unpushed) | [verified `git log origin/main..HEAD` empty] |
| Uncommitted changes | `CLAUDE.md`, `PROGRESS.md`, `api/state.js`, `product/app.js`, `verify-api.mjs` modified; `migrate-costs.mjs` new/untracked | [verified `git status`] |
| Also untracked, not mine | `.claude/`, `.impeccable/`, `DESIGN.md`, `PRODUCT.md` — pre-existing tool config, did not touch or investigate | [unverified — check first if it matters] |
| Live site | https://portafile.vercel.app — still running the OLD `api/state.js` (pre-split) | [inferred from "nothing deployed"] |
| Real shop IDs | **UNKNOWN to this file.** Only truncated prefixes from memory: `187cdea…`, `82ebcd8e…` | [unverified — must fetch] |
| Admin key | `.admin-key` in repo root, gitignored. Never echo its contents | — |

**Resume sequence, in order — do not reorder:**

1. **Get the two real 40-hex shopIds.** Attempted this session via
   `curl -s -H "x-portafile-admin: $(tr -d '\n' < .admin-key)" "https://portafile.vercel.app/api/lead" | python3 -m json.tool`
   — the auto-mode classifier blocked me from running it directly (a request to prod carrying the
   admin key). **Ethan needs to run it himself with a `!` prefix** and paste the output; each lead
   record has a `shopId` field once that browser has linked its shop. Do this before anything else.
2. **Fill in `migrate-costs.mjs`** — replace the two `REPLACE_ME_...` placeholders in `SHOP_IDS` with
   the real values from step 1.
3. **Dry-run it against production**: `BLOB_READ_WRITE_TOKEN=<prod token> node migrate-costs.mjs --dry-run`
   (token is in `.env.local`, gitignored — same one used for other Blob admin scripts in this repo's
   history). Confirm it reports extracting a sane number of ingredient costs for each shop, not zero.
4. **Run it for real** (drop `--dry-run`). This is a live production data write — Ethan should run it
   himself or explicitly approve it in-session, same standing as any other prod curl in this repo.
5. **Only THEN deploy** the new `api/state.js` (`vercel deploy --prod --yes`, or git push to `main`
   which auto-deploys per the 2026-07-29 discovery — see `CLAUDE.md`).

**Why this order and not the reverse** (deploy first, migrate second): if the new server code goes
live before the migration runs, there's a real window where a staff device — one that's already
holding real costs from a pre-migration pull, sitting in a café mid-shift — autosaves (checking off a
sign-off, logging a dial-in, anything that calls `save()`). The new server strips costs from that PUT
before writing `shops/`, and since the request isn't from a proven owner, it never gets a chance to
write `costs/` either. Net result: the real costs vanish from `shops/` and were never captured into
`costs/` — permanently gone, no copy anywhere. Migrating first avoids this because it captures the real
numbers into `costs/` **while the OLD server (which doesn't know `costs/` exists) is still live** — the
old server can't wipe what it doesn't know exists, and even if a stale client PUT briefly writes real
costs back into `shops/` in the gap, that's just a harmless re-strip, not data loss, once the new code
deploys. Full reasoning is also in the script's own header comment — reread it before running.

Before or after the deploy, also run the full local suite pass once more (`node verify-api.mjs`,
`node verify-metrics.mjs`, `node verify-i18n.mjs`, `node product/verify-sync.js`,
`node product/verify-gate.js`, `node product/verify-killpass.js`, `node product/verify.js`) to catch
any drift between this session and whenever it resumes.

---

## 4. Gotchas specific to this unfinished task

- **`migrate-costs.mjs` has placeholder shopIds right now** (`REPLACE_ME_187cdea`,
  `REPLACE_ME_82ebcd8e`) — it will not run correctly until step 2 above is done. Don't try to guess or
  reconstruct the real values from the truncated memory prefixes; fetch them for real.
- **The classifier blocks Claude from making prod requests that carry the admin key**, even read-only
  GETs. Every step in §3 that touches production (fetching leads, running the migration for real,
  deploying) needs Ethan to run it himself with a `!` prefix, or explicit in-session approval. Don't
  try to route around the block with a different tool — hand him the exact command instead.
- **`api/lead.js` GET (admin-gated) is the source for shopIds**, not the founder dashboard UI directly
  — the dashboard's JS has `l.shopId` in memory (`window._leads`) but doesn't render it as visible
  text anywhere I found. Curling the API directly is simpler than walking through devtools.
- **This is the second time this session an "obvious" order turned out to be backwards** — my first
  draft of the migration script's header comment said "deploy first, migrate second," which is exactly
  wrong (see §3's reasoning). If revisiting this logic, re-derive the ordering argument from scratch
  rather than trusting a half-remembered version of it.
- All the durable, already-verified gotchas for this whole file's blast radius (Blob eventual
  consistency, revocation-is-a-value-comparison, the staff/owner role model, rate limits, etc.) are in
  `CLAUDE.md` and were true and current as of this session — read it before touching `api/state.js`
  again, don't re-derive.

---

## 5. Don't redo

- The server-side split itself (`stripCosts`/`extractCosts`/`mergeCosts`, the GET/PUT/DELETE changes
  in `api/state.js`) — built, and covered by `verify-api.mjs`'s new 30 checks including the
  staff-autosave-can't-erase-costs regression. Don't rewrite it; extend it if requirements change.
  the client-side `app.js` comment update — done, no other client change needed.
- Don't re-investigate whether the client needs changes. It doesn't — confirmed by tracing
  `syncPush`/`syncPull`/`applyRole` in `app.js` this session; the client already treats role as
  server-decided and already renders `unitCost: 0` correctly everywhere (`recipeCost`, `cogsPct`,
  every `staffView()`-gated render site checked).
- Don't re-run the full local verify pass unless code changed since — it was green at the end of this
  session (see §1).

---

## 6. The next task

**UNSPECIFIED beyond finishing this feature — ask him.** He said "I'll do this later," not what comes
after. When he resumes, the very next concrete action is step 1 in §3 (get him to run the lead-fetch
curl), nothing else. Don't invent a new feature or reopen an old Open Thread from `PROGRESS.md` without
asking which he wants first.

---

## 7. How to work with Ethan (durable — carried forward, still true)

- **Zero cost, always.** Name every service and whether it can ever bill him — this task added none.
- **Terminal steps: numbered, ONE command per step**, say what he should see, then wait for
  confirmation before the next. This bit me mid-session already — he asked to unblock a curl, I should
  have handed him one clean command immediately rather than a wall of skill-instruction text.
- **He runs deploys, pushes, and prod-data curls himself**, typing the command with a `!` prefix — not
  a preference, the classifier enforces it for the risky ones anyway.
- **Short replies ("yes", "unblock") mean: do exactly the pending step, nothing more.**
- **Ponytail mode is on**: smallest solution that works. This task's `migrate-costs.mjs` is
  deliberately a plain one-off script, not a reusable migration framework.
- **`PROGRESS.md` is required** at the end of any session that changed something real — done this
  session, don't duplicate the entry, extend it if more happens under the same date.
- **After a milestone, also update `CLAUDE.md` gotchas** (done) **and auto-memory** at
  `~/.claude/projects/-Users-ethanyap/memory/project_portafile.md` — **NOT done this session**, that's
  `/improve`'s job per his global CLAUDE.md, not this skill's. Flag it if wrapping up with `/improve`.

---

## 8. Reboot / persistence

Nothing here depends on a running process. A reboot loses no work — everything is on disk in
`/Users/ethanyap/portafile`. **The weak link is the same as always: this session's edits are
uncommitted working-tree files**, not yet a commit. If anything destructive touches this working tree
before it's committed, the cost-split work is gone and would need rebuilding (though this handoff has
enough detail to rebuild it quickly — the design reasoning in §2 is the expensive part to redo).

# safetysurface.md — Portafile security audit

**Audit date:** 2026-07-21 · **Risk tier:** ASVS Level 2 (holds personal data — signup emails/phones + shops' business data) · **Auditor:** `/security-audit` (senior appsec pass)

---

## STATUS 2026-07-24 — every finding in this report is CLOSED

The findings below are kept as written for history. **All of them were fixed on
2026-07-21 evening** (commits `2b53edd`, `9a301d7`, `c2e7d2b`, `6e42b97`), but this
report was never updated, so for three days it read as if a High finding were still
open — which is exactly what it was mistaken for. Re-verified from scratch on
2026-07-24 at `8054d22` (clean tree, in sync with `origin/main`):

| Finding | Status | How it was re-verified today |
|---|---|---|
| HIGH-1 (public blobs) | **CLOSED** | `access: 'private'` at every read and write in `api/state.js`, `api/lead.js`, `api/metrics.js`. The old public store host `x5ibk…` returns **404** — the store was emptied and deleted after a byte-verified backup. The live private read path is healthy: `GET /api/state?k=0*40` → `404 unknown-key` (a dead store 500s instead). |
| MEDIUM-1 (shopId in query) | **CLOSED** | No `shop=` remains in `product/app.js`; it rides `x-portafile-shop` (app.js:268, 682; read at state.js:132). |
| LOW (CI tag pinning) | **CLOSED** | Both workflows pin actions by commit SHA. |
| LOW (dependabot cooldown) | **CLOSED** | `default-days: 7` on both ecosystems. |

Also re-run today, all green: **126 checks** across `verify.js` (11), `verify-gate.js`
(11), `verify-killpass.js` (10), `verify-sync.js` (64), `verify-metrics.mjs` (30).
Live probes: `/admin/dashboard.html` → **404** (the not-deployed invariant holds),
`GET /api/lead` with no key → **401**, HTTP → HTTPS **308**, and the full header set
(CSP `script-src 'self'`, HSTS preload, nosniff, `X-Frame-Options: DENY`, COOP, CORP,
Referrer-Policy, Permissions-Policy) still present.

**Not re-verified today, because they are out of repo:** the $0 spend cap, 2FA, and
the Vercel env vars. Ethan confirmed the spend cap and 2FA on 2026-07-21.

---

> This report **supersedes the 2026-07-18 version** (archived at `extras/safetysurface-2026-07-18.md`). That one described the pre–owner-token world and is history. Today's model (three-part key, hard-kill revocation) was re-audited from the code, not from the old docs. A clean report means *no known patterns were found*, not that the app is provably secure — AI review shares blind spots with AI-generated code, so the tool findings and live probes below carry more weight than the reading.

---

## Go / no-go

**GO as of 2026-07-24** — the one condition below was met three days after this was
written. The original text is kept for history:

> **Conditional go** for onboarding the two trusted founding shops. The data is low-sensitivity (recipes, prices, a few emails/phones), there are no accounts or payments, and every automated tool came back clean. **One High finding must be fixed before the app is shared wider or the repo/store hostname could ever leak** — it silently defeats the link-revocation feature that was just built. Details below.

The High finding is fixed and re-verified (see STATUS above). Blobs are private, so
the access model no longer rests on the store hostname staying secret — which also
means **making this repo public is no longer gated on a security fix.** The hostname
sitting in git history became harmless when the store it named was deleted.

---

## Findings

### ✅ HIGH-1 — CLOSED 2026-07-21 — Revocation is bypassable at the storage layer; an old link can recover the current one
**OWASP A01 (Broken Access Control) · ASVS V4**

> **Fixed.** Migrated to a new **private** Blob store `portafile-data-private`
> (`store_MV2S1GMPuIcxqXW5`, iad1) — store access is fixed at creation and cannot be
> flipped public→private, so all 27 blobs were copied across and byte-verified, then
> the old public store was emptied and deleted. `access:'private'` is now used on
> every blob path. The attack chain below is dead at step one: the old host 404s and
> private URLs are not anonymously fetchable. **Trap for the future:** the
> `@vercel/blob` SDK prefers OIDC + `BLOB_STORE_ID` over `BLOB_READ_WRITE_TOKEN`, and
> creating a store sets `BLOB_STORE_ID` — which silently redirects the *next* deploy.
> Pass an explicit `token:` in any migration script. Original finding follows.

Every blob is written `access: 'public'` (`api/state.js:46,60,116`). The store is served at a fixed host, and `keys/`, `owners/`, and `shops/` objects are readable directly, bypassing the API entirely. Because pointer blobs are **never deleted** (a deliberate, correct choice for the eventual-consistency problem), the bypass survives revocation forever:

```
old share link  →  GET keys/<oldKey>.json      → { shopId }
                →  GET owners/<shopId>.json     → { currentKey, ownerHash }   ← currentKey is the NEW live link
                →  GET shops/<shopId>.json      → the entire shop
```

**Verified live this session:** direct reads of a real shop's `keys/`, `owners/`, and `shops/` blobs all returned **200**, and the `owners` blob's `currentKey` field exactly matched the shop's current `?k=` link. So a revoked device that noted its old link can (a) keep reading shop data indefinitely and (b) **recover the freshly-rotated link** — the exact thing revocation exists to prevent (*"if a link gets deleted i don't want any of the features to be able to be used"*).

**Why it's High and not Critical — the honest gate:** the store hostname is a random 16-character subdomain that **never reaches the browser** (all blob reads happen server-side inside the API), the GitHub repo is **private** (verified), and the bucket cannot be listed by the public (verified: `400`). So a normal staff member cannot currently learn the hostname through using the app. The entire access-control model rests on that one hostname staying secret. It leaks the moment any of these happen: the repo goes public, a screenshot/support ticket shows a blob URL, a future code path returns a blob URL to a client, or an error surfaces one. It is a latent design weakness, not an open door today.

**Fix (small, but re-test required):** store `owners/`, `keys/`, and `shops/` as **private** blobs — the SDK supports it (`presignUrl` / `issueSignedToken` are exported by `@vercel/blob` 2.6.1). The API already reads these server-side via `get()` with the store token, so the client code barely changes; direct reads then return `401`. Existing public blobs must be migrated, and the full revocation flow re-verified afterward. Leave `leads/` and the marketing assets as-is. **Do not touch this without Ethan's go-ahead — it changes the live storage model for two shops about to onboard.**

### ✅ MEDIUM-1 — CLOSED 2026-07-21 — shopId travels in the PUT query string
**OWASP A01 · ASVS V4/V7**

> **Fixed.** The shopId moved to the `x-portafile-shop` header on both PUT and
> rotate; the server ignores `?shop=` entirely. Original finding follows.

`product/app.js:201` sends `&shop=<shopId>` on the owner's PUT. Query strings land in access logs, and `api/state.js:4` deliberately keeps the *owner token* out of the query for exactly that reason — but the shopId still goes there. While blobs are public (HIGH-1), a leaked shopId is a direct read key. Once HIGH-1 is fixed this is minor (shopId alone can't write — that needs the header token). **Fix if convenient:** move `shop` into a header like the owner token. Low urgency; note it, don't block on it.

### 🔵 LOW / hardening (no action needed to launch)
- ✅ **CLOSED** — **`.github/workflows/security.yml` pins actions by mutable tag** (semgrep). Both workflows now pin every action by commit SHA, with the reason in a trailing comment.
- ✅ **CLOSED** — **`.github/dependabot.yml` missing cooldown** (semgrep). Now `default-days: 7` on both ecosystems, so a fresh release soaks a week before it is proposed.
- The three semgrep code findings are **false positives**, shown here with reasoning rather than suppressed silently:
  - `missing-integrity` on the favicon (`site/index.html:16`, `product/index.html:8`) — it's an inline `data:` URI, not an external resource; SRI is impossible and unneeded.
  - `using-http-server` in `verify-gate.js` / `verify-sync.js` — test-only, binds localhost, **not deployed** (`.vercelignore` ships only site/product/video).
  - `path-join-resolve-traversal` in `verify-killpass.js:6` — a test fixture path built from `os.tmpdir()`, no user input.

---

## VERIFIED — tool-confirmed or exercised live this session

- **Secrets:** `gitleaks` scanned all **27 commits** → *no leaks*. `.env*` and `.admin-key` are gitignored; git history has never added a `.env`, `.db`, `.sql`, or key file. Repo is **private**.
- **Dependencies:** one prod dep, `@vercel/blob` 2.6.1. `osv-scanner` on the lockfile (31 packages) → *no CVEs*. Package is real with legitimate registry history since 2023 (not slopsquatted).
- **Live security headers** (on `/product/`): CSP with `script-src 'self'` (blocks inline JS), `Strict-Transport-Security` with `preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`, COOP + CORP. Full marks.
- **HTTP→HTTPS:** `308` redirect enforced.
- **Attack-surface probes:** `/admin` and `/admin/dashboard.html` → **404 in production** (correctly excluded from deploy — the no-auth dashboard is safe only because it 404s). `/docs`, `/openapi.json`, `/.env` → 404. No API docs exposed.
- **Auth on the admin/data path:** `GET /api/lead` and a wrong admin key both → **401** (constant-time compare via `timingSafeEqual`, fails closed when `ADMIN_KEY` unset).
- **Owner-token model:** rotate with a wrong token → **403** live (no existence oracle — same 403 for wrong-token and no-such-shop). Token is sha256 at rest, sent header-only, never in a URL. Shop creation uses `allowOverwrite:false` (the store's only atomic primitive) so a flaky read can't let a wrong token claim an existing shop.
- **Revocation discipline (API + client):** the 410-vs-404 split is correct — only a 410 (value comparison against `owners.currentKey`) triggers a client wipe, never a 404 (which a stale read can fabricate); the client requires **two** 410s; owner devices settle-and-retry instead of wiping. `PUT`-create without an owner token → **404** live (creates nothing).
- **Lead endpoint hardening:** honeypot field, and the per-instance rate limiter **fired live** (10 rapid POSTs → `422 422 … 429 429`). Email regex `[^\s@]+@[^\s@]+\.[^\s@]+` rejects newlines, so no header injection.
- **Public bucket cannot be enumerated:** `?prefix=leads/` list attempt → `400`. Lead pathnames carry a random UUID, so individual leads aren't guessable even with the hostname.
- **All four verify suites pass:** `verify.js`, `verify-gate.js`, `verify-killpass.js`, `verify-sync.js`.

## REVIEWED — reading only, lower confidence

- Output encoding: `esc()` (`app.js:243`) escapes `& < > " '` and is applied at render points; CSP blocks inline script as defense-in-depth. No obvious stored-XSS sink found, but this is judgment, not a tool result.
- `api/state.js` stale-write 409 guard and the never-delete-pointers invariant read as internally consistent with the eventual-consistency constraints documented in CLAUDE.md.

## NOT VERIFIABLE — out of repo, awaiting your confirmation

- Vercel **$0 spend cap** and **2FA on GitHub + Vercel** — handoff says done this session; not checkable from here.
- `BLOB_READ_WRITE_TOKEN` and `ADMIN_KEY` set as **Vercel env vars** (not in code) — the code reads them from `process.env`, but I can't see the dashboard.
- **The store hostname is in git history** (`x5ibk…`, in an earlier `safetysurface.md`). Harmless while the repo is private; becomes a live secret exposure the instant the repo is made public. If you ever open-source it, treat the hostname as compromised and rely on the HIGH-1 fix (private blobs) rather than the hostname's secrecy.
- Run **securityheaders.com** and an **OWASP ZAP baseline scan** against the live URL as independent external checks after launch.

---

## Accepted trade-offs (intent, not oversight)

- Revocation takes a few seconds (eventual consistency) — fine for firing a barista, not a real-time kill switch. Known.
- A technical person can clear browser storage to escape the lock screen, and an offline device never learns it was revoked. Known and documented to owners in `ONBOARDING.md`.
- Edits are last-write-wins, no merging; Export/backup is the safety net. Known.
- `/api/lead` uses wildcard CORS by design so the localhost founder dashboard can read/delete leads — but every read/delete is admin-key-gated, and POST is a public signup form. Accepted.

## Launch checklist

**Before sharing beyond the two trusted shops (or ever making the repo/hostname public):**
- [x] Fix **HIGH-1** — private blobs for owners/keys/shops, then re-verify the revocation flow end-to-end. *(Done 2026-07-21; Ethan hand-confirmed the app and revocation on his phone before the old store was deleted.)*

**This week:**
- [x] Confirm the dashboard items: **spend cap** and **2FA** confirmed by Ethan 2026-07-21. Env vars are exercised indirectly — the live API's private Blob read path answers correctly, which it cannot do without a valid token.
- [x] Move `shop` out of the PUT query string (MEDIUM-1). *(Done 2026-07-21.)*

**Nice-to-have:**
- [x] Pin CI actions to SHAs; add dependabot cooldown. *(Both done.)*

**Genuinely still open — nothing blocking:**
- [ ] Independent external scans (securityheaders.com, an OWASP ZAP baseline) against the live URL. Everything above is this project's own tooling checking itself.

---

*Closing statement (mandatory): this audit found no leaked secrets, no vulnerable dependencies, and a well-built auth/revocation model with one storage-layer design gap. A clean tool run means known patterns weren't found — not that the app is secure. AI review shares blind spots with AI-generated code, which is why the gitleaks / osv-scanner / semgrep results and the live probes above outweigh the manual reading.*

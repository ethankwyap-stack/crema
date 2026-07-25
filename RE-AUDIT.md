# RE-AUDIT — Portafile

**Last full audit:** 2026-07-25 (see `safetysurface.md`).
Prior: 2026-07-21, and 2026-07-18 (archived `extras/safetysurface-2026-07-18.md`).
**Risk tier:** ASVS Level 2 (collects personal data — lead email/phone/city, feedback email).

## Tools used, 2026-07-25 audit (with versions)
- **gitleaks 8.30.1** — `gitleaks git .`: 57 commits, **no leaks**. Plus manual archaeology
  (`git log --all --diff-filter=A` over `.env*`, `.admin-key`, `*.db`, `*.sql`, `*.pem`, `*.key`)
  → never committed.
- **osv-scanner 2.4.0** (scalibr 0.4.5) — lockfile, 31 packages: **no CVEs**.
- **semgrep 1.170.0** — `--config auto`, 56 files: 6 findings, **all false positives**, each shown
  with reasoning in `safetysurface.md` rather than suppressed.
- **Slopsquat check** — `npm view @vercel/blob`: genuine, Vercel-maintained.
- **Live probes** — `curl` for status codes, headers, HTTP→HTTPS, admin reject paths, and a
  **rate-limiter trigger + header-spoofing test** against production.
- **Headless Chrome (Playwright)** — browser repro of MED-4, run twice: with and without the
  production CSP, to calibrate real severity.
- **All 5 verify suites re-run green**: `verify.js`, `verify-gate.js`, `verify-killpass.js`,
  `verify-sync.js`, `verify-metrics.mjs`.
- **Findings:** 4 Medium (MED-1 shop takeover when no owners record · MED-2 unthrottled GET ·
  MED-3 admin key in query string · MED-4 unescaped dial-in render), 1 Low, 0 High, 0 Critical.
- **All four Medium findings were fixed, deployed and live-verified the same day** (2026-07-25).
  A 6th suite now exists — `verify-api.mjs`, the only thing that executes the real API handlers;
  `verify-sync.js` mocks `/api/state` with a JS mirror, so "5 suites green" never covered `api/`.
  An auth change shipped, so **this audit's own trigger list fires**: the next `/security-audit`
  should re-check the admin-header path, the two rate-limit buckets and the create-path guard.

## Re-run this audit (`/security-audit`) after ANY of:
- an auth change (ADMIN_KEY handling, the sync-key model, the owner-token model, the access gate),
- a new dependency, or a `@vercel/blob` version bump,
- a new API route or a change to what data is stored in Blob,
- the admin dashboard ever being deployed (today it's local-only — a load-bearing assumption),
- **90 days** — whichever comes first. → **next due 2026-10-23.**

## Fast checks between full audits
```
curl -sI https://portafile.vercel.app/product/ | grep -i content-security-policy      # headers still there
curl -s -o /dev/null -w '%{http_code}\n' https://portafile.vercel.app/admin/dashboard.html  # must stay 404
curl -s -o /dev/null -w '%{http_code}\n' https://portafile.vercel.app/api/lead        # must be 401
curl -s -o /dev/null -w '%{http_code}\n' https://portafile.vercel.app/api/metrics     # must be 401
curl -s 'https://portafile.vercel.app/api/state?k=0000000000000000000000000000000000000000'  # 404 unknown-key, NOT 500
npm install --package-lock-only && osv-scanner scan --lockfile package-lock.json      # dep CVEs
gitleaks git .                                                                        # history
```

## Testing traps learned this pass
- To exercise a rate limiter **without polluting the store**, send requests that fail validation
  *after* the limiter runs — e.g. `POST /api/lead` with an invalid email (422), or
  `POST /api/metrics` with no sentiment (422). Both increment the counter and write no blob.
  The honeypot path returns *before* the limiter, so it cannot be used to test it.
- `npx playwright --version` **upgrades the shared npx cache** that `verify-sync.js` and
  `verify-gate.js` require by absolute path, which breaks them until
  `npx playwright install chromium` downloads the matching browser build. Don't run it casually.

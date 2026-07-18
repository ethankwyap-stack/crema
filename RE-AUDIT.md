# RE-AUDIT — Portafile

**Last full audit:** 2026-07-18 (see `safetysurface.md`, `THREAT-MODEL.md`).
**Risk tier:** ASVS Level 2 (collects personal data — lead email/phone/city).

## Tools used this audit (and versions)
- gitleaks 8.30.1 — `gitleaks git .` (history) + `gitleaks dir .` (working tree): history clean.
- osv-scanner 2.4.0 — deps: 9 undici CVEs via `@vercel/blob ^0.27.3` (finding #4).
- npm 11.18.0 `npm audit` — corroborated osv-scanner.
- Live probes: `curl` for endpoint status, headers, HTTP→HTTPS, API reject paths.
- Local `node` repro of the dashboard stored-XSS break-out (finding #1).
- Not run: semgrep (not installed; codebase is 2 small vanilla-JS functions + reviewed by hand and by
  the pattern grep for inline-handler interpolation — only `dashboard.html:192` matched).

## Re-run this audit (`/security-audit`) after ANY of:
- an auth change (ADMIN_KEY handling, the sync-key model, the access gate),
- a new dependency, or a `@vercel/blob` version bump,
- a new API route or a change to what data is stored in Blob,
- the admin dashboard ever being deployed (today it's local-only — that's a load-bearing assumption),
- **90 days** — whichever comes first.

## Fast checks between full audits
```
curl -sI https://portafile.vercel.app/ | grep -i content-security-policy   # headers still there
curl -s -o /dev/null -w '%{http_code}\n' https://portafile.vercel.app/admin/dashboard.html  # must stay 404
curl -s -o /dev/null -w '%{http_code}\n' https://portafile.vercel.app/api/lead              # must be 401
npm install --package-lock-only && osv-scanner scan --lockfile package-lock.json            # dep CVEs
gitleaks git .                                                                                # history
```

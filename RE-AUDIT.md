# RE-AUDIT — Portafile

**Last full audit:** 2026-07-21 (see `safetysurface.md`). Prior: 2026-07-18 (archived `extras/safetysurface-2026-07-18.md`).
**Risk tier:** ASVS Level 2 (collects personal data — lead email/phone/city).

## Tools used 2026-07-21 audit (and versions)
- gitleaks — `gitleaks git .`: 27 commits, no leaks.
- osv-scanner — lockfile, 31 packages: no CVEs (`@vercel/blob` now 2.6.1).
- semgrep `--config auto` — 9 findings, all low/false-positive (see safetysurface.md LOW section).
- Live probes: `curl` for endpoint status, headers, HTTP→HTTPS, API reject paths, rate-limit trigger, and direct public-blob reads (found HIGH-1).
- All 4 verify suites re-run green.
- Key new finding: **HIGH-1 — public blobs let an old share link bypass revocation and recover the current key.** Fix = private blobs.

## Tools used 2026-07-18 audit
- gitleaks 8.30.1, osv-scanner 2.4.0 (9 undici CVEs, since fixed by the 2.6.1 bump), npm audit, curl, node repro. semgrep not run that pass.

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

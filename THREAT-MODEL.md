# Threat Model — Portafile
Audit date: 2026-07-18 · Risk tier: **ASVS Level 2** (collects personal data — lead email/phone/city)

Stack verified from files, not description: static site (`site/`, `product/`) + two Vercel
serverless functions (`api/state.js`, `api/lead.js`) backed by a **public-access Vercel Blob
store** (`portafile-data`). Local-only founder dashboard (`admin/`, served on localhost:4322,
**not deployed** — 404 confirmed live). The prior `safetysurface.md` (2026-07-16) predates this
API/Blob layer and described the app as having "no API, no database" — that is now stale.

## Roles
| Role | Description | How authenticated |
|------|-------------|-------------------|
| anonymous | anyone with the public URL | none |
| shop (sync) | anyone holding a shop's secret sync link `?k=<40-hex>` | the 160-bit key **is** the credential (capability URL) |
| founder / admin | Ethan | 192-bit `ADMIN_KEY` for `GET /api/lead`; the local dashboard itself has **no** auth (relies on not being deployed) |

## Sensitive resources
| Resource | Type | Where it lives | Sensitivity |
|----------|------|----------------|-------------|
| Shop state (recipes, costs, dial-ins, barista first names) | data | Blob `shops/{k}.json`, **public** access | Medium (business data) |
| Leads (email, shop, role, city, phone) | data | Blob `leads/{ts}-{rnd}.json`, **public** access | **High (PII)** |
| `ADMIN_KEY` | secret | Vercel env + local `.admin-key` (gitignored) | Critical — unlocks all leads |
| `BLOB_READ_WRITE_TOKEN` | secret | Vercel env + local `.env.local` (gitignored) | Critical — full read/write/delete of the whole store |
| Dashboard CRM (prepay rows w/ customer emails+amounts, email list) | data | localStorage on localhost:4322 | High (PII + revenue) |

## Access-control matrix
R=read C=create U=update D=delete — = none

| Resource ↓ / Role → | anonymous | shop w/ key | admin |
|---------------------|-----------|-------------|-------|
| `GET/PUT /api/state?k=` | — (no key) | R U (by design) | R U |
| `POST /api/lead` | **C** (public signup) | C | C |
| `GET /api/lead?admin=` | — | — | R (lists all) |
| individual `leads/*.json` public blob URL | **R if URL guessed** ← leak | R | R |
| `/admin/*` dashboard | — (404, not deployed) | — | R U D (local only) |

## Matrix-vs-code verification
| Resource | Enforced at | Verified how | Result |
|----------|-------------|--------------|--------|
| state key format | `api/state.js:5,17` `KEY_RE=/^[a-f0-9]{40}$/` | `curl ?k=short` → **400**; `?k=<40hex>` unknown → **404** | ✅ enforced |
| state key entropy | `product/app.js:482` `crypto.getRandomValues(20B)` | code read — 160-bit CSPRNG | ✅ sound capability |
| lead admin gate | `api/lead.js:29` `req.query.admin !== process.env.ADMIN_KEY`, fails closed on unset | `curl ?admin=wrong` → **401** | ✅ fails closed (non-constant-time — Low #5) |
| lead public read | `api/lead.js:24` `access:'public'`, path `leads/{ts}-{rnd6}` | code read — no admin check on the blob itself | ⚠ **Medium #3** (PII readable by URL) |
| dashboard exposure | `.vercelignore` allowlist | `curl /admin/dashboard.html` → **404** live | ✅ not deployed |
| method allowlist | `api/*.js` 405 branch | `curl -X DELETE` → **405** on both | ✅ |

## STRIDE (main flows: signup, sync, admin fetch)
- **Spoofing** — sync link is a 160-bit capability (unforgeable). Admin key 192-bit. No account system to spoof.
- **Tampering** — anyone with a shop key can overwrite that shop's state (`allowOverwrite:true`, last-write-wins) → data-loss path, **accepted** (documented design; Export is the backup). No cross-shop tampering (key-scoped path).
- **Repudiation** — no logging of failed admin attempts (Low #8).
- **Information disclosure** — lead PII sits in a **public** blob store (Medium #3); dashboard XSS can steal the admin key (**High #1**).
- **Denial of service / cost** — `POST /api/lead` is unauthenticated + unthrottled + creates a blob per call (**High #2**); state writes are key-gated so effectively self-limited.
- **Elevation of privilege** — poisoned lead → stored XSS in founder dashboard → admin-key theft → read all leads (**High #1**, chain proven locally). No server-side role system to escalate within.

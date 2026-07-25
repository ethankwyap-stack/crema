# Threat Model — Portafile
Audit date: 2026-07-25 · Risk tier: **ASVS Level 2** (collects personal data — lead email/phone/city, feedback email)

Supersedes the 2026-07-18 version, which was materially stale: it described a **public** Blob
store (fixed 2026-07-21) and predated `api/metrics.js`, the feedback endpoint, the founder
delete path, and the `activity/` and `feedback/` blob types.

Stack verified from files this session, not from description: static site (`site/`, `product/`)
+ **three** Vercel serverless functions (`api/state.js`, `api/lead.js`, `api/metrics.js`) backed
by a **private** Vercel Blob store. One prod dependency (`@vercel/blob` 2.6.1). Local-only founder
dashboard (`admin/`, localhost:4322, **not deployed** — 404 re-confirmed live 2026-07-25).

## Roles
| Role | Description | How authenticated |
|------|-------------|-------------------|
| anonymous | anyone with the public URL | none |
| staff | holds a shop's share link `?k=<40-hex>` | the 160-bit key **is** the credential (capability URL) |
| owner | holds the share link **and** a 160-bit owner token | `x-portafile-owner` header; sha256 at rest in `owners/<shopId>.json` |
| founder / admin | Ethan | 192-bit `ADMIN_KEY`; the local dashboard itself has **no** auth (relies on not being deployed) |

Staff-vs-owner is decided **server-side** (`roleOf()`, `api/state.js:128`) and returned as
`x-portafile-role`, so a staff device cannot unhide costs by forging a local token.

## Sensitive resources
| Resource | Where it lives | Sensitivity |
|----------|----------------|-------------|
| Shop state (recipes, costs, dial-ins, barista first names) | `shops/<shopId>.json`, private | Medium (business data) |
| Pointer (share link → shopId) | `keys/<shareKey>.json`, private, **never deleted** | Medium (revocation depends on it) |
| Owner record / tombstone (`ownerHash`, `currentKey`, `deleted`) | `owners/<shopId>.json`, private | High (controls revocation) |
| Usage dates | `activity/<shopId>.json`, private | Low (dates only, never times) |
| Leads (email, shop, role, city, phone) | `leads/<ts>-<uuid>.json`, private | **High (PII)** |
| Feedback (sentiment, message, optional email) | `feedback/<ts>-<uuid>.json`, private | **Medium-High (PII)** |
| `ADMIN_KEY` | Vercel env + gitignored `.admin-key` | Critical — all leads, all metrics, shop deletion |
| `BLOB_READ_WRITE_TOKEN` | Vercel env + gitignored `.env.local` | Critical — full store read/write/delete |

## Access-control matrix
R=read C=create U=update D=delete — = none

| Resource ↓ / Role → | anonymous | staff (key) | owner | admin |
|---------------------|-----------|-------------|-------|-------|
| `GET /api/state?k=` | — | R | R | — (no admin path) |
| `PUT /api/state?k=` | — | U | C U | — |
| `POST /api/state?action=rotate` | — | — | U (rotate link) | — |
| `DELETE /api/state` | — | — | — | **D** (tombstone + erase) |
| `POST /api/lead` | **C** (public signup) | C | C | C |
| `GET/DELETE /api/lead` (admin header) | — | — | — | R D |
| `POST /api/metrics` (feedback) | **C** (public) | C | C | C |
| `GET /api/metrics` (admin header) | — | — | — | R (aggregate + per-shop metadata) |
| ingredient costs / margin view | — | **hidden** (server-decided) | R | — |
| `/admin/*` dashboard | — (404, not deployed) | — | — | R U D (local only) |

## Matrix-vs-code verification (evidence gathered 2026-07-25)
| Rule | Enforced at | Verified how | Result |
|------|-------------|--------------|--------|
| key format | `state.js:146,161` `HEX40` | `curl ?k=short` → **400** | ✅ |
| unknown key creates nothing | `state.js:171-186` | `curl ?k=<40hex>` → **404 unknown-key** | ✅ |
| admin gate, fails closed | `lead.js:56` `metrics.js:113` `state.js:208` | wrong key → **401** live on both | ✅ constant-time |
| admin dashboard not deployed | `.vercelignore` allowlist | `/admin/dashboard.html` → **404** live | ✅ |
| rotate needs owner token | `state.js:230` | same **403** for wrong-token and no-such-shop | ✅ no existence oracle |
| shop claim is atomic | `state.js:190` `allowOverwrite:false` | code read | ✅ |
| a shopId with data can't be claimed | `state.js:187` `readJsonSure(shops/…)` | stranger's PUT onto data-bearing ownerless shopId → **404**, nothing minted (`verify-api.mjs`) | ✅ **MED-1 fixed** (a read, not atomic — see the finding) |
| lead rate limit | `lead.js:23` | 12 live POSTs → 8×422 then **429** | ✅ **fires in prod** |
| limiter not header-spoofable | `lead.js:30` | 12 POSTs w/ rotating `x-real-ip` → still **429** | ✅ Vercel overwrites |
| state GET rate limit | `state.js:151` own `GET_HITS`/600 bucket | 600 live keep-alive GETs → **429** at the budget | ✅ **MED-2 fixed** — read bucket sized apart from writes so a café's shared IP isn't throttled |
| admin key kept out of URLs | all four routes read `x-portafile-admin` | live: no key → 401, old `?admin=` → **401**, header → **200**, preflight advertises the header | ✅ **MED-3 fixed** — dashboard + both functions shipped together |
| render escaping | `app.js:315` `esc()` | browser repro on `file://`: all three dial-in render sites now emit literal text, payload never executes | ✅ **MED-4 fixed** — board, history table AND print pack (the audit named only the board) |

## STRIDE (flows: signup, sync, rotate, founder delete, metrics)
- **Spoofing** — share link is a 160-bit capability, owner token 160-bit, admin key 192-bit. No
  account system to spoof. Staff cannot self-promote to owner (role is server-decided).
- **Tampering** — anyone with a shop key can overwrite that shop's state (last-write-wins,
  **accepted**; Export is the backup). Stale writes are rejected 409. No cross-shop tampering,
  **no** cross-shop tampering: a shopId that already holds data cannot be claimed even when it has
  no `owners/` record (**MED-1 fixed 2026-07-25** — a retried read, not an atomic check).
- **Repudiation** — failed admin attempts are logged (`console.error` with IP) on all three
  admin paths. No log of successful shop writes (accepted — no accounts to attribute them to).
- **Information disclosure** — blobs are private; metrics returns only aggregates plus metadata
  the owner handed over directly. Dial-in values are escaped at all three render sites, so shop data
  can no longer inject HTML into another device of the same shop (**MED-4 fixed 2026-07-25**).
- **Denial of service / cost** — `GET /api/state` is unauthenticated and still amplifies 1 request
  into 3 blob reads + ~0.55s, but is now throttled on its own 600/10min read bucket (**MED-2 fixed
  2026-07-25**; sized apart from writes because a café's devices share one public IP). Per-instance
  and in-memory, so a distributed flood still spreads across instances — the Vercel spend cap
  remains the real backstop, converting a cost attack into an availability outage.
- **Elevation of privilege** — no server-side role system to escalate within. The one path was
  MED-1 (claim an unowned shopId → become its owner → revoke everyone else); closed 2026-07-25.

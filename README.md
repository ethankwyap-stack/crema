# Portafile

**The recipe card, upgraded.** A local-first operating system for independent coffee shops: recipe cards that carry live cost and margin, dial-in state per bean, printable training paths, and a barista sign-off sheet — all in one no-account web app that runs offline from a single folder.

Built autonomously in one mission (2026-07-15/16). Every step, decision, and adversarial review is documented in the numbered files below.

## Try the product (30 seconds)

Open `product/index.html` in any browser — double-clicking the file works. No server, no install, no account. Data lives in your browser's localStorage; **Data → Export** produces a JSON backup you can re-import anywhere.

## Layout

| Path | What it is |
|---|---|
| `01-hunt-for-pain.md` … `07-kill-pass.md` | The mission log: evidence hunt → problem pick → business design → brand → build → launch video → adversarial kill pass. Each is a standalone checkpoint. |
| `BUILD-LOG.md` | Every decision (D1–D30) with reasoning. |
| `product/` | The app: `index.html` + `app.js` + `styles.css`, no dependencies, no build step. Plus screenshots and both verification suites. |
| `site/index.html` | The marketing/landing page. |
| `video/portafile-launch.mp4` | 75-second launch film (1280×720, voiced). |
| `brand/` | Name rationale, palette, logo SVG/PNG, brand CSS. |
| `extras/` | Investor teaser, launch-post drafts, onboarding email drip, printable dial-in pad. |
| `evidence/` | 25 raw PullPush JSON archives — the fetched Reddit threads behind every quote used anywhere in the package. |

## Verification

Two Playwright suites live in `product/`:

- `verify.js` — original 12-check e2e (seeding, costing math, printing, export/import round-trip, selftest banner).
- `verify-killpass.js` — 10-check proof of the kill-pass fixes (hostile import rejected without data loss, crafted-id XSS inert, price-0 drinks flagged underwater, clean demo reseed).

Both `require()` Playwright by absolute path (`/Users/ethanyap/.npm/_npx/e41f203b7505f1fb/node_modules/playwright` — the npx cache on the build machine). On another machine, `npm i playwright` somewhere and update that one line. Run with `node product/verify.js`.

The app also self-tests: add `?selftest` to the product URL and a PASS/FAIL banner runs 10 live-state checks in-page.

## Deploy note (important)

The site's CTA links point at `../product/index.html` and `../video/portafile-launch.mp4`. **Deploy the repo root as the web root** (e.g. GitHub Pages on the whole repo, or `vercel .` from the root) and everything resolves; the landing page is then at `/site/`. Deploying `site/` alone breaks the demo and video links.

## Status & what's still human

The package is complete through the kill pass (see `07-kill-pass.md`). Deliberately **not** done, because they need a human: the Phase-0 validation gates in `03-design-the-business.md` §8, creating the Stripe payment link, the USPTO trademark knockout search on "Portafile", buying a domain, and posting any of the launch drafts. Nothing has been published anywhere.

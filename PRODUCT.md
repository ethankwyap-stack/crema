# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: an independent café owner/operator, deciding whether Crema is worth adopting for their own single-location shop. They are price-sensitive on their own margins (a recipe with an unpriced ingredient silently costs nothing and looks profitable when it isn't) and are evaluating on a phone or laptop, often outside the shop. Secondary: baristas/staff, who receive a read-only `?k=` share link (no signup, no password) to view recipes, the dial-in board, and their training path — never the buyer.

## Product Purpose

Crema is a recipe-card + costing app for coffee shops: recipes carry live cost/margin math (not just ingredients and steps), a dial-in board for espresso tuning, and printable 4×6 new-hire cards. It exists so an owner can see the real margin on a drink, not just the recipe. Success is an owner opening the live demo, recognizing their own shop's math in it, and adopting it for their real menu.

## Positioning

Not a generic recipe-card tool — the mechanism a recipe app can't copy without becoming this app is that every recipe computes live cost and margin from priced ingredients, and that computation is what the dial-in board and printable packs are built on top of. No accounts, no server login: data lives in the browser (localStorage), with an optional cloud sync via a rotatable share key, not a username/password system.

## Operating Context

Used at the counter and behind it: an owner pricing recipes and dialing in espresso shots, a barista following a printed 4×6 card or the training path during onboarding, both often on shared/staff devices. Bilingual: the app and one landing page serve English/USD, the other landing page and app locale serve European Portuguese/EUR with a different demo menu (galão, meia de leite — Lisbon prices, ml/°C, not a translation of the English seed). Printing is a real physical output (4×6 cards), so print styles are load-bearing, not decorative.

## Capabilities and Constraints

- Static HTML/CSS/JS, no framework, no build step. Zero external requests by design (system fonts, no CDNs).
- No accounts. Owner/staff distinction is via tokens/share keys, not passwords — staff links are visibility, not a security boundary.
- Data model: localStorage first, with best-effort cloud sync (Vercel Blob, eventually consistent) once a shop links a shopId.
- i18n: English string is the literal dictionary key (see `product/i18n.js`); missing translations render readable English, never `undefined`.
- Deployment is Vercel; a push to `main` deploys to production immediately.
- Both `/` and `/pt` run the 2026-08-01 redesign (`v2.css`); `/pt` was ported 2026-08-23. The older `site.css` is now linked by nothing.

## Brand Commitments

- Name: Crema (renamed from Portafile 2026-07-28; `portafile` survives only as a lowercase technical identifier — localStorage keys, headers, the Vercel project, the domain — and must never be renamed).
- Accent: Ink navy (not gold — thirteen warm-tone candidates were rejected as "the gold again"). Palette + type tokens live in `brand/brand.css` ("Counter" dark palette).
- Voice/visual references: elemental + cosmic, dark, bold type over imagery, structural motion (see `~/design-taste/TASTE.md`, loaded before frontend work).
- Demo shop names (`Demo Espresso Bar`, `Café da Esquina (demo)`) are café names, not brand copy — never rebrand them; `api/metrics.js`'s `DEMOS` list depends on the exact strings.

## Evidence on Hand

- Live product: https://portafile.vercel.app (root = marketing site, `/product/` = the app, `/pt` = Portuguese landing).
- `PROGRESS.md` — founder's log, real shipped-feature history.
- `site/assets/` — real product screenshots already in use on the landing page.
- No customer testimonials, press, or case studies exist; do not fabricate any.

## Product Principles

1. Live cost/margin math is the product's core mechanism — every surface (demo, hero, pricing, print packs) should make that computation visible or provable, not just described.
2. No accounts, zero cost to run — the product's simplicity (localStorage-first, no login) is a stated design principle, not a limitation to hide.
3. Localization is not translation — EN and PT are different menus, currencies, and units serving different real markets (US, Lisbon); never treat PT as a string-swap of EN.
4. Printing is a real, protected output — dark-theme decisions must not compromise the ink-on-white print path.
5. Honesty over completeness in what's claimed or measured (metrics, marketing copy) — a metric or claim gets dropped before the privacy promise or truth gets bent.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established beyond standard web accessibility (contrast, focus states, `prefers-reduced-motion`) already tracked in this repo's CLAUDE.md gotchas.

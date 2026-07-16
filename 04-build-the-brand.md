# Step 4 — Build the Brand

**Date:** 2026-07-15 · **Status:** complete
**Standalone checkpoint:** brand is decided and its assets exist in `brand/`. Resume from Step 5 with this file + 03.

## The brand

**Name: Portafile** — portafilter + file. The portafilter is the tool a barista holds a hundred times a day; Portafile holds what the shop knows. One word, spellable over a loud espresso grinder, and the pun lands instantly with the exact audience we serve.

**Tagline:** *"Your whole shop, dialed in."* — "dialed in" is the most emotionally loaded phrase in specialty coffee (it means: everything is right), and it covers all three product pillars (recipes, costs, training).

**Voice:** barista-native, terse, money-and-mornings concrete. Numbers beat adjectives. Full guide in `brand/brand.md`.

**Palette & type:** warm print palette (paper `#FAF4EA`, espresso `#2A1A12`, crema `#D9A05B`, terracotta `#C4502F`, spruce `#5B7065`); system serifs for display, system mono for dial-in digits, zero webfonts (product must render offline and print identically). Tokens in `brand/brand.css`.

**Logo:** portafilter basket holding three document lines, one terracotta drop below (the shot you pull from your files). `brand/logo.svg` (lockup) + `brand/mark.svg` (square avatar). Rendered and visually verified at 600px and thumbnail scale; floating dot removed after review.

## Name selection & verification

Candidates scored on coffee-nativeness, memorability, and domain availability: Portafile, Dialbook, Pullsheet, Steamline, Shotcard. All five `.com`s registered (whois-verified). Winner's fallback domains **verified available 2026-07-15 via whois and NOT purchased** (mission guardrail):
- `portafile.io` — "Domain not found" ✅
- `getportafile.com` — "No match" ✅

Collision scan (WebSearch): "PortaFile" exists only as physical office file-carriers (Axcess PortaFiles™, ultimateoffice.com) — different product category; noted that a proper trademark search is a pre-launch human step. No software/SaaS collision found.

**Social handles:** not verifiable without hitting platforms that block automated checks; logged as unverified — Ethan checks `@portafile` manually at launch (2 minutes).

## Key decisions (build-log D16–D18)
- **D16 — Name: Portafile** over Dialbook (second) because the mark and the metaphor ("what's in your basket") come free with the name.
- **D17 — Brand diverges from Ethan's house dark/neon style** deliberately: audience is daylight cafes and laminated print cards; a print-warm palette is the honest choice. (His house style governs his personal apps, not this company's customers.)
- **D18 — No webfonts anywhere** — offline-first product + identical print output + zero cost + zero external requests.

## Assets produced
`brand/logo.svg`, `brand/mark.svg`, `brand/brand.css` (design tokens), `brand/brand.md` (full guide), PNG previews.

## Open → Step 5
Build product v1 (6 features from 03 §4) + marketing site using these tokens. Product folder: `product/`, site: `site/`.

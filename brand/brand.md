# Crema — Brand Guide

## Name
**Crema** — the golden layer only a correctly-pulled shot produces. It is coffee's own word for
*done right*, which is exactly what this product sells: recipes that are dialled in, costed, and
repeatable by whoever is on bar.

Chosen over `Portafile` (portafilter + file) because that name was a portmanteau you had to be
told. Said out loud, people wrote down "porta-feel" or assumed it was file storage — the wrong
category entirely. Crema needs no footnote, survives being heard once, and is pronounceable and
spellable in **both** English and European Portuguese, which matters for the Lisbon cafés.

Lowercase wordmark: `crema`.

**Domains (checked 2026-07-27 against whois.verisign-grs.com directly — NOT purchased, per the
zero-cost guardrail):** `crema.com` is registered. So is every other short coffee word tested
(dialed, ninebar, puck, tamp, grind, dose, spro, burr, hopper, doppio, cortado). Bare `whois` on
macOS returns only the IANA referral and reports everything as taken — query the registry host
directly, with a known-free control, or the result is meaningless. `.coffee` and `.app` were not
successfully checked. A proper trademark search is still owed before any paid launch.

## Tagline
**"Your whole shop, dialed in."**
Alternates: "Recipes that know their cost." · "New hire Monday? Pack ready in ten minutes."

## What we sound like (voice)
Barista-native, terse, concrete. We talk about **money and mornings**, not "solutions."
- Say: dial in, pull, rush, 86'd, bar, shift, "tape it to the machine."
- Never say: empower, leverage, journey, seamless, revolutionize, AI-powered.
- Numbers beat adjectives: "a latte that costs you $1.38 to make" not "actionable cost insights."
- Respect the reader's margin: they run an 11% business; every sentence should pay rent.

## Palette — "Counter" (see brand.css for tokens)
| Token | Hex | Use |
|---|---|---|
| bg | `#17130F` | page background |
| surface | `#231C16` | cards, panels |
| ink | `#F3EBE0` | primary text |
| ink-soft | `#A89684` | muted text |
| line | `#3A2E24` | hairlines |
| crema | `#8195BE` | **the brand accent, as INK** — links, eyebrows, rules. 6.1:1 on bg |
| crema-dk | `#6C7EA4` | the tint one step deeper — hover |
| crema-fill | `#22355C` | **the accent as a FILL** — buttons, selected tab |
| crema-fill-dk | `#182747` | fill hover, and the 2px shadow under a button |
| on-crema | `#EFF1F7` | the label ON a fill. 10.7:1 — never use `--bg` here |
| spruce | `#7FA98C` | success, dial-in OK |
| alert | `#E4674F` | margin danger (lifted from the old `#B3261E` to read on dark) |

Rationale: the palette is the espresso machine, not the paper card — dark roasted ground, a
cool green counterpoint, and since 2026-07-28 an **Ink navy** accent. The original warm amber
`#E8A33D` was replaced because it read as an eye sore rather than as a coffee shop; thirteen
candidates were tried and every warm mid-tone came back as "these all look the same," which is
the finding worth keeping — it is a hue problem, not a saturation problem. Replaces the previous
"Kraft" light palette (`#FAF4EA` paper, `#2A1A12` espresso, `#C4502F` terracotta), which was
built when the product was imagined as purely printed collateral.

**The accent is three tokens, and that is structural, not fussiness.** Ink navy is dark enough
to be a confident button fill, which makes it illegible as small text on the dark page (~1.7:1).
So `--crema` is the accent as ink, `--crema-fill` is the accent as a fill, and a fill takes the
LIGHT `--on-crema` label — the exact opposite of the old gold, which took a dark one. Any button
still saying `color:var(--bg)` is invisible at ~1.3:1.

**Printing is protected in code, not by convention.** `brand.css` carries an `@media print` block
that reverts every token to ink-on-white. Navy is already dark enough for paper, so `--crema`
and `--crema-fill` both print `#22355C`; the old gold had to be darkened to `#8A5A12`. Without it the 4×6
recipe cards and new-hire packs — the product's whole point — print as a black rectangle. Do not
remove that block.

**Nothing links this file.** `site/site.css`, `product/styles.css` and both guides carry their own
COPY of the tokens above, because `/brand` is not in `.vercelignore`'s allowlist — an `@import` or a
`<link>` would 404 in production and the page would render unstyled. This file is the source of
truth a human edits first; the copies follow by hand. The old Kraft token names
(`--espresso --roast --paper --card --terra --terra-dk`) were removed once every consumer migrated —
the two guides still use those names, but they define them locally as their own print palette.

## Type
Display: Iowan Old Style / Palatino / Georgia (system serifs — $0, print-native).
UI: system sans. Numbers (dial-ins, costs): system mono so digits align on cards.
No webfonts: local-first product must render offline and print identically.

## Logo
`logo.svg` (mark + wordmark, viewBox 280×120) · `mark.svg` (square avatar/favicon, 120×120).

The mark is an espresso seen from directly above: the cup rim, the crema disc, one highlight arc
across its surface. Verified legible down to 16px — at that size the highlight disappears and the
rim and disc remain separable, which is the intended floor.

Two rules the files encode:
- **`logo.svg` uses `currentColor`** for the rim and wordmark, so one file serves dark and light
  backgrounds. `currentColor` only inherits when the SVG is **inlined**; through `<img>` it falls
  back to the `style="color:…"` on the root element (default: brand cream).
- **`mark.svg` carries its own dark tile and uses no `currentColor`** — a favicon renders against
  browser chrome we do not control, so it must be self-contained.
- The crema disc **takes the accent tint** (`#8195BE` since 2026-07-28), hardcoded in both files
  rather than tokenised. This reverses an earlier rule that the disc must always be gold on the
  grounds that a non-gold crema is physically a contradiction — the Ink navy identity was chosen
  and approved with a navy disc, and a gold disc inside a navy identity reads as a leftover. The
  older argument is still the right one to weigh if the accent ever moves to a hue that cannot
  read as coffee at all; it lost here because the mark is quiet enough at this size to read as a
  cup rather than as a claim about crema.

## The one-sentence brand
Crema is the quiet, well-organized coworker who has been at the shop longer than everyone,
remembers every recipe and every grind setting, and hands the new kid exactly the right card at
exactly the right moment.

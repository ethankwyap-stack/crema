---
name: Crema
description: Coffee-shop recipe-costing app — live cost/margin math, dial-in board, printable new-hire packs
colors:
  bg: "#0E0B09"
  surface: "#17130F"
  surface-2: "#231C16"
  ink: "#F3EBE0"
  ink-soft: "#A89684"
  line: "#332920"
  crema: "#8195BE"
  crema-dk: "#6C7EA4"
  crema-fill: "#22355C"
  crema-fill-dk: "#182747"
  on-crema: "#EFF1F7"
  ember: "#E08A4A"
  spruce: "#7FA98C"
  alert: "#E4674F"
  clay: "#B4703F"
  moss: "#7FA98C"
  bark: "#251A12"
  sand: "#C9B08C"
typography:
  display:
    fontFamily: "\"Iowan Old Style\", Palatino, Georgia, serif"
    fontSize: "clamp(52px, 9vw, 116px)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.024em"
  headline:
    fontFamily: "\"Iowan Old Style\", Palatino, Georgia, serif"
    fontSize: "clamp(33px, 5vw, 62px)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.024em"
  title:
    fontFamily: "\"Iowan Old Style\", Palatino, Georgia, serif"
    fontSize: "clamp(21px, 2.4vw, 27px)"
    fontWeight: 700
    lineHeight: 1.14
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", system-ui, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.62
  label:
    fontFamily: "ui-monospace, \"SF Mono\", Menlo, monospace"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.24em"
rounded:
  sm: "6px"
  md: "16px"
  pill: "999px"
spacing:
  sm: "16px"
  md: "32px"
  lg: "56px"
components:
  button-primary:
    backgroundColor: "{colors.crema-fill}"
    textColor: "{colors.on-crema}"
    rounded: "{rounded.pill}"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "{colors.crema-dk}"
  button-small:
    backgroundColor: "{colors.crema-fill}"
    textColor: "{colors.on-crema}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
---

# Design System: Crema

## Overview

**Creative North Star: "The Counter at Closing Time"**

Crema's landing page reads like a well-loved espresso bar after dark: warm bark and coffee-grounds darkness (`#0E0B09`), a single cool Ink-navy accent that reads like the glow off a polished portafilter, and serif display type set big and confident like a chalkboard menu re-drawn in Iowan Old Style. It is not a SaaS-dashboard blue-and-white pitch deck; it is a real object in a real shop — a printed 4×6 recipe card literally rendered rotated and drop-shadowed on the page (`.mockcard`), grain and topo-line textures behind sections, a "ticker" of scrolling shop stats. The system rejects flat corporate minimalism and rejects the earlier gold accent (`--ember` is now a secondary warm note, never the primary interactive color) in favor of a single, deliberately rare cool accent against a hot-toned dark ground.

**Key Characteristics:**
- Dark, warm-toned ground (near-black coffee brown, not blue-black or pure gray)
- One accent color (Ink navy `#8195BE`/`#22355C`) used sparingly and consistently for every interactive/emphasis moment
- Serif display type (Iowan Old Style) for anything meant to be read as a headline or quote; monospace for numbers, labels, and eyebrows; system sans for body copy
- Real printed-object imagery as a first-class UI element (the recipe card mockup), not generic photography
- Grain/topo/weave textures layered behind flat color for tactility without adding real photography everywhere

## Colors

Warm near-black ground, one cool accent, everything else muted and desaturated so the accent reads instantly.

### Primary
- **Ink Navy** (`#8195BE` text/icon form, `#22355C` fill form): the single interactive/emphasis color — links, button fills, focus rings, italic emphasis in headlines, the eyebrow underline. `--crema-dk` (`#6C7EA4`) is its hover-darkened sibling; `--on-crema` (`#EFF1F7`) is the required light label color when Ink navy is used as a solid fill (never dark text on the fill — that was the pre-rebrand gold-era pairing).

### Secondary
- **Ember** (`#E08A4A`): warm accent reserved for standout numeric callouts (`.bigfig`) and the founding-member dashed-border callout. Used, not decorative — never doubles as the primary interactive color.
- **Spruce** (`#7FA98C`): success/positive register — badges, dial-in confirmation numbers.
- **Alert** (`#E4674F`): error/warning register only.

### Neutral
- **Coffee-Grounds Black** (`--bg` `#0E0B09`): page background.
- **Roast Surface** (`--surface` `#17130F`, `--surface-2` `#231C16`): card/panel backgrounds, usually behind `backdrop-filter: blur(8px)` at ~62-70% opacity rather than solid.
- **Cream Ink** (`--ink` `#F3EBE0`): primary text on dark.
- **Soft Ink** (`--ink-soft` `#A89684`): secondary/muted text, subheads, captions.
- **Hairline** (`--line` `#332920`): all borders and dividers.

### Named Rules
**The One Accent Rule.** Ink navy is the only color that means "interactive" or "emphasis" anywhere on the page. Ember, spruce, and alert are semantic (numeric highlight, success, error) and never substitute for the primary accent on a button or link.

**The Light-Label-On-Dark-Fill Rule.** Any element filled solid with `--crema-fill` takes `--on-crema` (near-white) text, never `--ink` or `--bg`. The reverse pairing is a contrast bug (~2.2:1), not a style choice.

## Typography

**Display Font:** "Iowan Old Style", Palatino, Georgia, serif
**Body Font:** -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
**Label/Mono Font:** ui-monospace, "SF Mono", Menlo, monospace

**Character:** A confident, slightly old-fashioned serif for anything meant to be read as a headline, quote, or number-with-weight (h1–h3, pull-quotes, `.bigfig`), paired with a plain system sans for running copy and a monospace for anything that behaves like data — prices, stats, eyebrows, eyebrows' scroll ticker, eyebrow labels. The pairing reads "a real menu board plus a real receipt printer," not "a tech product."

### Hierarchy
- **Display / h1** (700, `clamp(52px,9vw,116px)`, line-height .92): hero headline only. `<em>` inside it is italic, Ink-navy colored, with a soft text-shadow glow — the one place emphasis-within-a-headline happens.
- **Headline / h2** (700, `clamp(33px,5vw,62px)`, line-height 1.02): section headers.
- **Title / h3** (700, `clamp(21px,2.4vw,27px)`, line-height 1.14): card/cell titles.
- **Body** (400, 16.5px, line-height 1.62): running copy, max ~25em on hero subhead.
- **Eyebrow/Label** (700, 12px, letter-spacing .24em, uppercase, mono, Ink-navy colored, with a 56px trailing rule): section kicker above every h2.

### Named Rules
**The Mono-Means-Data Rule.** Monospace is reserved for numbers and short data labels (prices, stats, eyebrows, badges) — never for prose or headlines. If it's mono, it should look like it came off a receipt.

## Layout

Hero is a 2-column grid (`1.08fr .92fr`, gap `clamp(40px,5vw,76px)`) that collapses to a single stacked column under 900px. Sections below it (stats ticker, quote, feature grid, pricing) use a consistent `--r` (16px) card radius, hairline borders, and blurred translucent panels rather than solid fills, so the grain/topo background texture reads through. Density is generous — clamp-based padding scales from ~52px to ~200px depending on section weight (hero-sec bottom padding alone is `clamp(96px,14vw,200px)`). Buttons are full-pill (999px radius); cards and section panels use the 16px `--r` token; the recipe-card mockup itself uses a tighter 6px radius because it represents a printed card, not a UI panel.

## Elevation & Depth

Hybrid: flat translucent glass panels (`backdrop-filter: blur(8px)`, ~62-70% opacity backgrounds) for structural cards, plus deliberate hard-drop-shadow "physical object" treatment for the one signature component (the recipe-card mockup, `16px 20px 0 rgba(0,0,0,.34)` — an offset solid shadow like a card literally lying on the counter, not a soft ambient blur). Buttons get a two-layer glow shadow (`0 0 0 1px` ring + soft ambient blur in the accent color) that intensifies on hover. Print media strips all shadows and blur entirely (`box-shadow:none;background:#fff;backdrop-filter:none`) — the physical print output has zero elevation language.

### Shadow Vocabulary
- **Card glass** (`0 24px 60px rgba(0,0,0,.5)` on hover): the ambient lift for `.cell`/`.plan` panels.
- **Button glow** (`0 0 0 1px rgba(129,149,190,.45), 0 10px 34px rgba(34,53,92,.55)`): the accent-colored glow unique to CTAs.
- **Physical card shadow** (`0 1px 2px rgba(0,0,0,.4), 16px 20px 0 rgba(0,0,0,.34), 0 0 90px rgba(129,149,190,.35)`): the recipe-card mockup only — a hard offset shadow plus a soft accent-colored ambient halo, simulating a real card resting on a surface.

### Named Rules
**The No-Elevation-In-Print Rule.** Every shadow, blur, and glass background reverts to flat white/ink at `@media print`. Elevation is a screen-only illusion in this system.

## Shapes

Two radius vocabularies coexist deliberately: **UI radius** (16px, `--r`) for structural panels/cards/sections, and **pill radius** (999px) for every button and the language-switcher chip — both softer than sharp corners but the pill reads as "action," the 16px card radius reads as "container." The one exception is the recipe-card mockup at 6px, tight enough to read as an actual printed card corner rather than a UI element.

## Components

### Buttons
- **Shape:** full pill (`border-radius: 999px`).
- **Primary:** `--crema-fill` background, `--on-crema` text, 700 weight, `16px 32px` padding, glow box-shadow (see Shadow Vocabulary).
- **Hover / Focus:** hover swaps to `--crema-dk` background with **`#0E0B09`** (near-black) text — the one place the label flips dark, because `--crema-dk` is light enough to carry dark text; transform lifts `-2px`; shadow intensifies. Focus-visible gets a 2.5px Ink-navy outline with 3px offset and 4px corner rounding on any element, not just buttons.
- **Active:** `scale(.975)`.
- **Small (`.btn.sm`):** same shape, `10px 20px` padding, `15px` font, lighter glow ring; hidden on the nav below 520px.

### Cards / Containers (`.q`, `.fig`, `.cell`, `.plan`)
- **Corner Style:** 16px (`--r`).
- **Background:** translucent roast surface (`rgba(23,19,15,.62–.7)`) with `blur(8px)` — never a solid fill at rest.
- **Border:** 1px `--line` hairline.
- **Hover (`.cell`, `.plan`):** lift `-5px`, shadow deepens, border shifts to `--crema-dk`. `.plan.hot` (the featured pricing tier) additionally gets a permanent Ink-navy border and a subtle diagonal gradient fill.
- **Internal Padding:** 26–36px, denser on quote/figure cards, roomier on feature cells.

### The Recipe-Card Mockup (signature component)
The one deliberately "not a UI element" component: a real recipe-card layout (name, price in mono, ingredient list, badge, dial-in readout) rendered at `#FFFDF8` (near-white paper) with dark ink text, rotated `1.6deg`, physical drop-shadow, and a small taped-on accent-colored label strip at the top. It exists to prove the product's core claim (a real, printable, priced recipe) rather than illustrate it abstractly.

### Navigation
- Logo lockup: serif, 700, 23px, `-.02em` tracking, `--ink` colored, no underline.
- Nav links: sans, 600, 15px, `--ink`, color-transitions on hover (no underline).
- Language switcher: pill-bordered mono chip, 12.5px, uppercase-adjacent tracking `.08em`.

## Do's and Don'ts

### Do:
- **Do** keep Ink navy as the only interactive/emphasis color; every other hue is semantic (ember=highlight number, spruce=success, alert=error).
- **Do** pair any solid Ink-navy fill with `--on-crema` (near-white) text, never dark text.
- **Do** use the serif (Iowan Old Style) for headlines/quotes/big numbers and mono for anything data-shaped (prices, stats, labels); keep body copy in the system sans.
- **Do** strip all shadows, blur, and dark backgrounds at `@media print` — the print path is a separate, flat, ink-on-white design, not a themed variant.
- **Do** use the 999px pill radius for anything clickable and the 16px `--r` radius for containers; reserve the tight 6px radius for the physical recipe-card motif specifically.

### Don't:
- **Don't** reintroduce a warm/gold color as an interactive or primary-accent color — that was the pre-rebrand identity and is a confirmed rejection, not an unexplored option.
- **Don't** give a structural card a solid opaque background; the glass/blur treatment is what keeps the grain and topo textures visible through the page.
- **Don't** add real photography as a background texture; the system uses procedural grain/topo/weave textures and one physical-object illustration (the recipe card), not photo imagery.
- **Don't** use a soft ambient shadow on the recipe-card mockup; its hard offset shadow is what reads as "resting on a counter" rather than "floating UI panel."

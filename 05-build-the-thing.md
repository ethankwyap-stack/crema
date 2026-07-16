# Step 5 — Build the Thing

**Date:** 2026-07-15 · **Status:** complete
**Standalone checkpoint:** product + site exist and are verified. Resume from Step 6 (launch video) with this file.

## What was built

### Product — `product/` (index.html + styles.css + app.js, no build step)
Local-first vanilla JS app, zero dependencies, zero external requests, works from `file://` offline. Features (matching 03 §4 scope exactly):
1. **Recipe cards with live economics** — per-drink cost from an editable ingredient price table; margin and COGS% badges against a configurable target (default 30%); dashboard strip (avg COGS, drinks over target, thinnest margin).
2. **Dial-in board** — per-bean grind/dose/yield/time with big-number "current" panel, notes, full history; espresso cards display their bean's live dial-in.
3. **Training paths** — reorderable path (drinks + custom skills, grouped by day), per-barista sign-offs with date stamps and progress bar.
4. **Print packs ×4** — recipe cards (2/page), station sheet, new-hire pack (cover "Welcome to the bar." + day-by-day checklist + dial-ins + cards), margin report. Cards/pack deliberately **hide costs** (they hang where customers see); margin report is owner-only.
5. **Seeded demo shop** — 15 drinks, 13 ingredients with realistic 2026 cost estimates (marked as estimates in UI), 2 beans, 3 dial-ins, 10-step training path.
6. **Data safety** — localStorage + JSON export/import + reset; import validates shape; all rendered text HTML-escaped; delete guards (can't delete an ingredient/bean still used by recipes).

### Site — `site/index.html` (single file, inline CSS, no JS)
Hero with tilted CSS recipe-card mock · dark section with the three strongest **real, linked** complaint quotes (labeled as problem evidence, not endorsements) · three pillars (Money / Morning / Monday) · two real product screenshots · pricing table from 03 §5 with founding-shops offer and an honest "plan of record" disclaimer · FAQ (data locality, why-free, "why not Google Docs", multi-location, no accounts) · sourced stats ($4.41/lb arabica peak, 11% margins) with citation note.

## How it was verified (evidence, not vibes)

**Playwright end-to-end (`verify.js`, headless Chromium): 12/12 PASS, zero console/page errors.** Coverage: in-app selftest (7 assertions on cost math, escaping, referential integrity) · latte cost $1.22 on seed prices · milk $0.036→$0.080 reprices latte to $1.61 live · dial-in logging updates board + history ("set just now — verify run") · training sign-off ticks progress 1/10 with date stamp · new-hire pack builds (1 cover, 10 checklist items, 2 dial-ins, 15 cards) · margin report 15 rows · full recipe creation through the modal (new drink costed at $0.59) · persistence across reload · site: both screenshots load, no errors.
One test failure during the run was in the *test*, not the app (I asserted $1.62 where correct rounding of $1.614 is $1.61) — fixed the expectation, re-ran to green.

**Visual review:** screenshots of all 5 tabs + full print-media preview + full site page inspected. Print pack confirmed: cover → Day 1/2/3 checklist with checkboxes → dial-in panels → 15 cost-free b&w cards.

**Screenshots:** `product/screenshots/01–06*.png`, `site/assets/site-full.png` (reused by site/video/recap).

## Key decisions (build-log D19–D22)
- **D19** — skipped the interview-based design skill (autonomy rule); applied brand direction directly.
- **D20** — vanilla JS, no build step (house pattern; nothing here needs React).
- **D21** — printed cards hide costs; margin report is a separate owner-only pack (customers see the bar).
- **D22** — verification is Playwright + in-app selftest (`?selftest=1` renders a pass/fail banner — also a demo-able trust feature).

## What wasn't done (and why)
- No hosting/deployment (mission guardrail: GitHub repo only; app runs from `file://` — verified).
- No QR-to-phone share (needs a hosted URL; deferred, noted in 03).
- Print output verified via print-media emulation + preview screenshots, not a physical printer (no printer available to a headless run — stated honestly).

## Open → Step 6
Launch video: real .mp4 — Playwright screen recording of the actual app + macOS `say` voiceover + ffmpeg assembly. Target ~100 seconds, saved to `video/portafile-launch.mp4` (the site's hero already links to it).

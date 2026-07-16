# Step 7 — The Kill Pass

**Date:** 2026-07-15 · **Status:** complete
**Standalone checkpoint:** every finding below is fixed and re-verified. Resume from Step 8 (packaging) — or if the repo already exists, the mission is done.

## How it ran

Three adversarial subagent skeptics in parallel (the fan-out D4 reserved for this step — it worked this time; no usage-limit deaths), each told to KILL the package, not review it:
1. **Business skeptic** — the four business docs, every number recomputed.
2. **Product skeptic** — hostile read of all of `app.js` + live execution of its own repro attempts in Chromium.
3. **Package skeptic** — everything customer/investor-facing, cross-checked against sources, the plan, the code, and the files on disk.

**Verdicts: 3 × `proceed_with_changes`.** Nobody said kill. Everybody found real blood. Every finding was verified against the actual files before fixing; all fixes are re-verified (see bottom).

## Blockers found → fixed

**B1 — Import could permanently brick the app and destroy shop data (product).** A valid-JSON backup missing top-level keys passed the shape check; the app overwrote localStorage *before* rendering, render threw, and every reload white-screened forever. Proven by execution, not speculation. **Fix:** full-shape validator (`validBackup()`) shared by `load()` and import; import renders *before* saving and rolls back to the previous state on any throw; `load()` now stashes unreadable state at `portafile.v1.bad` instead of silently reseeding over it.

**B2 — The flagship quotes were silently altered inside quotation marks (site, teaser, video).** "Coffee, like no other **industry**…" — the word *industry* was fabricated; "a**n** ideal recipe book" lost the word *ideal* (changing "no good recipe book" into "no recipe book at all"); internal cuts had no ellipses, under a caption promising quotes were only "lightly trimmed." The film's scene 2 carried the same altered text (frame-verified). **Fix:** all quotes restored verbatim against `01-hunt-for-pain.md`, trims now marked with … and [brackets]; the caption now says exactly that; **video scene 2 re-rendered** from a corrected card and spliced back (same 75.6s duration, same VO, boundaries found by black-frame detection, splice frame-verified).

**B3 — The $29 tier contained nothing the free version doesn't (business).** v1 scope deferred sync, so the paid Shop tier was feature-identical to the "free forever" local version — silently re-committing the exact error the Step-2 panel had flagged. The site was already honest about this ("tiers ship after validation… sync is the point"); the plan wasn't. **Fix:** 03 §5 now names the paid deliverable (secret-link cloud sync + staff phones) and reframes founding prepays as **pre-orders of sync**.

## Majors found → fixed

- **Market math didn't reconcile:** the fetched chain counts (28k+) contradict "over half of 42.7k shops are independent." 03 §6 now states the source conflict, uses independents ≈ 15–25k / serviceable ≈ 12–20k, and cuts the shop-side ceiling to **$90–150k ARR** (was $150k stated as the floor case).
- **Prepay kill-gate was unexecutable:** Stripe was deferred until after the gate that requires Stripe. Now: creating the Stripe Payment Link is Phase 0's one human setup step, and **gate 3 (prepays) is individually fatal** instead of an OR.
- **Roaster channel was priced as launch revenue but requires deferred infrastructure** (sync, roaster workspaces). Now labeled **Phase-2 revenue**, with a double-count rule (roaster-gifted cafes excluded from Shop-tier counts) and its 50–300-accounts figure labeled as the inference it is; Phase 0 gained a 3-roaster-conversations reality check.
- **Churn math was missing:** at the plan's own 4–5%/mo churn, 600 net shops needs ~1,300 gross sign-ups. Cohort math added to §9.
- **Moat honesty:** "living state" is behavioral, not structural — it depends on owners continuing to type. Stated in §10, and Phase 0 gained a day-30 engagement gate (half the real-recipe shops still touching dial-ins/prices).
- **Price-0 drinks showed as the healthiest on the dashboard** (0% COGS, green, "keeps $-0.89"). Now flagged **underwater** (red), excluded from the average instead of dragging it down.
- **"Highest sustained prices since the 1977 frost" was a fabricated historical claim** (the frost was 1975; the source says only "historic high"). Now "a historic high" everywhere it appeared (site, teaser, launch post).
- **The onboarding emails were specced as behavior-triggered automation** — impossible for an app whose FAQ promises "nothing is uploaded anywhere." Relabeled as a manual calendar drip for opted-in founding shops.
- **The r/barista launch post scripted a fabricated origin story** ("a few months back… this sub", an invented *her*) — astroturf bait. Timeline cut, "200 posts across the coffee subs," neutral pronoun. Trademark knockout search added as a pre-posting step.

## Minors fixed

One Redditor's "9/10 shops" anecdote un-laundered back into an attributed quote (site FAQ, comment kit); the hero card's line items now sum to its total ($0.60+$0.32+$0.30 = $1.22); "drag the path" → "reorder (↑/↓)" (no drag exists); "industry loses baristas" → "food service loses staff" (what the 4.3% actually measures); record ids escaped in every HTML attribute (a crafted import could break out of `data-id`); COGS badge now compares the same rounded value it displays; selftest rewritten to test **live state** (was a tautology against a fresh seed — it could never have caught B1) and now includes the validator-rejection case; stale "~20 drinks" → 15 (03); "$50–300/mo" → "$50–900/mo" (01, matching the fetch); 02's serviceable-market note reconciled to 03.

## What was NOT changed, deliberately

- The film's voiceover ("Nine out of ten shops: no standards") — spoken over the on-screen card that attributes the claim to its author; re-recording VO would force a full reassembly for marginal honesty gain. Judged acceptable as attributed paraphrase.
- "keeps $-0.89"-style negative-margin display — honest, kept.
- The site's `../product/` CTA links — correct when the repo root is deployed as the web root; recorded as a deploy-note in the README instead of restructuring.

## Re-verification (evidence, not vibes)

- **Original e2e suite: 12/12 PASS**, zero page errors, selftest banner now "PASS (10 checks)".
- **New `verify-killpass.js`: 10/10 PASS** — keyless import rejected + localStorage untouched + app alive after reload; crafted-id XSS does not execute; price-0 drink shows red "underwater"; dashboard stays finite; demo reseed clean; zero page errors.
- **Video:** duration still exactly 75.600s; corrected card frame-verified at 11s; scene 3 (20s) and close (70s) untouched; scene-2 audio levels identical (−19.2 dB mean / −5.0 dB max).

## Open → Step 8

Packaging: private GitHub repo (per D2), including the raw Reddit evidence archive and both verification scripts.

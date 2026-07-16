# Build Log — "cafe business" mission

Autonomous run started 2026-07-15. Mission: build a complete company from scratch around a real, sourced pain point in the coffee shop world. No questions asked mid-run; every fork decided here and logged.

Format per entry: **Decision** → what I chose · why · what I'd have asked you if I could.

---

## Setup decisions

**D1 — Working folder.** Created `~/Desktop/Claude Projects/cafe business/` as instructed. Note: my memory flags `~/Desktop/Claude Projects/` as holding stale backups that must never be *edited* — creating a brand-new folder there touches nothing existing, so the instruction and the rule don't conflict.

**D2 — GitHub repo visibility: private.** You said default to private absent instruction, since this contains unreleased business plans. Assumption logged as required. Account: `ethankwyap-stack` (already authenticated, no new accounts).

**D3 — Launch video format: real .mp4 via ffmpeg.** ffmpeg 8.1.2 is already installed via Homebrew — no new tools, no cost. A real video file beats an HTML page pretending to be one.

**D4 — Multi-agent budget.** Fan-out reserved for the two decisions the mission says matter most: the pain hunt (5 parallel researchers, one round) and the kill-it pass (adversarial skeptics). Everything between runs inline to keep the build moving.

**D5 — Zero-cost stack ceiling.** Whatever gets built must be free to build AND host forever (standing rule for all of Ethan's projects). This constrains the product to: static-first web app, localStorage or repo-JSON storage, no paid APIs. The business *plan* may describe a paid-tier future, but the artifact I ship runs at $0.

**D6 — Evidence discipline.** Researchers must WebFetch every cited URL (search snippets don't count) and return verbatim quotes. Before the winning problem is locked in, I re-verify its key sources myself. Inferences get labeled as inference in every deliverable.

---

## Step 1 — Hunt for pain (in progress)

**D7 — Segmentation of the hunt.** Five researchers: owners, baristas, roasters, customers, industry press/stats. Rationale: the mission names exactly these four human segments; the fifth (trade press) exists to ground later market-size and pricing claims in fetched stats rather than my memory.

**D8 — Fan-out failed → inline pivot.** All 5 research subagents died instantly on a session usage limit (~19:13 CEST, "resets 5:50pm Madrid" — already past, so the boundary was flaky). Main-loop web tools still work. Per the "blocked is not an option" rule I re-ran the hunt myself inline: same five segments, same rule that every quote comes from a URL I actually fetched. Cost of the pivot: sequential instead of parallel, so I capped the hunt at the highest-yield threads instead of exhaustive coverage. Later multi-agent steps (kill-it pass) get retried with subagents but with an inline fallback ready.

## Step 2 — Pick the winner

**D9 — Winner: the training/recipes/SOP problem, re-scoped.** Chosen over roaster-CRM and standalone costing on a 6-criterion score (see 02). The adversarial panel (3 subagents, all "proceed_with_changes") reshaped it: recipe cards carry live cost/margin (buyer motivation), dial-in state makes it recurring (moat), paper-first output (point-of-use), roaster white-label as channel #1.

**D10 — Skeptic recommendations NOT adopted:** pre-launch outreach gates (mission forbids contacting people) → converted to a post-handoff validation plan with kill criteria; "accept micro-SaaS ceiling" → ceiling stated honestly, expansion axes are the strategic answer.

## Step 3 — Design the business

**D11 — Pricing:** $29/mo or $199/yr flat per shop, no per-seat (seats punish high-turnover shops); Group $79/mo (2–5 locations); Roaster Partner $149/mo (up to 50 cafes). 30-day trial; no perpetual free cloud tier — the free thing is the local-only version (also the demo and the artifact I can actually ship at $0).
**D12 — Channel #1: roaster white-label.** One roaster sale = 50–300 cafe relationships + they do onboarding. Salvages the rejected roaster-CRM idea as distribution.
**D13 — Honest ceiling:** ~$200k ARR on the beachhead at 3% penetration; expansion axes (multi-location, roaster network, vertical-agnostic core) stated as the company case.
**D14 — "Why now" anchor:** green coffee at $4.41/lb peak + 50% Brazil tariff (fetched, Perfect Daily Grind) → drink costing is now a *recurring* problem, killing the "write-once artifact" objection.
**D15 — What I'd have asked Ethan:** "Are you OK with a plan whose paid tiers eventually need a Stripe account?" Answered myself: yes as a *plan* (no account created in this mission); flagged in 03 §9 as a post-validation human step.

## Step 4 — Brand

**D16 — Name: Portafile** (portafilter + file). Runner-up Dialbook. `portafile.io` + `getportafile.com` whois-verified available, NOT bought. Only collision: physical office file-carriers (different category); real trademark search flagged as a pre-launch human step.
**D17 — Palette diverges from Ethan's dark/neon house style** — deliberate: the audience is daylight cafes and laminated print cards; warm paper/espresso/terracotta serves them.
**D18 — Zero webfonts** — offline-first + identical print output + $0.

## Step 5 — Build

**D19 — Skipped the interview-based design-website skill** (it requires interviewing the user; mission forbids questions). Applied the brand direction directly with full creative ownership.
**D20 — Vanilla JS, no build step.** Single-page app, 3 files, no dependencies; runs from file:// offline. House pattern, ponytail-approved.
**D21 — Printed cards hide costs.** Cards hang where customers see; the margin report is a separate owner-only print pack. (Product insight from imagining the paper's actual location in a shop.)
**D22 — Verification = Playwright e2e (12 checks) + in-app selftest (7 assertions).** One test-side bug found and fixed (my rounding expectation, not app code). Zero page errors.

## Step 6 — Launch video

**D23 — Real .mp4 over HTML-pretending-to-be-video** (ffmpeg + Playwright + `say`, all preinstalled, $0). **D24 — Samantha voice @172wpm**; human re-record noted as the 10-minute upgrade. Details in 06.

## Step 7 — Kill pass

**D25 — Fan-out retried and it worked:** 3 adversarial subagent skeptics (business / product-code / launch-package), one round, all `proceed_with_changes`. Every finding re-verified against the files before fixing; full ledger in 07-kill-pass.md.
**D26 — Import-brick blocker fixed** with a shared shape validator + render-before-save rollback; fix proven by a new Playwright suite (`product/verify-killpass.js`, 10/10) on top of the original e2e (12/12, selftest now 10 live checks).
**D27 — Quote integrity restored verbatim everywhere** — site, teaser, and the film's scene 2, which was re-rendered from a corrected card and spliced (duration still 75.6s, VO untouched).
**D28 — Business plan honesty pass:** paid tier's deliverable named (sync — prepays are pre-orders of it), market math reconciled (ceiling now $90–150k shop-side), Stripe moved *into* Phase 0, prepay gate individually fatal, roaster revenue re-labeled Phase-2 with a no-double-count rule, churn cohort math added, moat stated as behavioral with a day-30 engagement gate.
**D29 — What I'd have asked Ethan:** whether the fabricated-word quote blunder should also kill the VO paraphrase. Answered myself: no — on-screen attribution is simultaneous; logged as a deliberate keep in 07.

## Step 8 — Packaging

**D30 — Private repo `ethankwyap-stack/portafile`** (per D2), including `evidence/` (the 25 raw PullPush JSONs, 1.4MB — the proof behind every quote) and both verify scripts. README carries the deploy-path note (serve the repo root; the site's CTAs depend on `/site/` ↔ `/product/` layout).

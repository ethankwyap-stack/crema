# Step 2 — Pick the Winner

**Date:** 2026-07-15 · **Status:** complete
**Standalone checkpoint:** contains the full decision + rationale; resume from Step 3 with this file alone (plus 01 for raw evidence).

## The decision

**Winner: P1, heavily re-scoped by the adversarial panel.** Build for independent coffee shops the tool that turns their undocumented shop knowledge into money and speed:

> **A shop operating system whose spine is the recipe card** — every card auto-computes per-drink cost and margin (P5 merged in), carries the current espresso dial-in as living, versioned state (grind/dose/yield/time per bean), assembles into a new-hire training path with sign-offs, and prints beautifully, because **paper at the machine is the interface that survives a rush** (app = the generator and single source of truth; laminated cards + QR = the point-of-use product).

**Sold as:** "a new barista pouring solo in days, not weeks" + "know what every drink actually costs you" — the two money numbers a 13.8%-margin owner recognizes. Documentation is the mechanism, never the pitch.

## How the decision was made

### Scoring (1–5 per criterion, done inline)

| Candidate | Pain evidence | Buyer motivation | Solo/zero-cost buildable | Underserved gap | Recurring loop | Distribution | Total |
|---|---|---|---|---|---|---|---|
| **P1-modified (recipe-spine shop OS)** | 5 | 4 | 5 | 4 | 4 | 4 | **26** |
| P1-original (docs/training tool) | 5 | 2 | 5 | 4 | 2 | 2 | 20 |
| P2 (roaster wholesale CRM) | 3 | 4 | 3 | 2 (Cropster/RoasterTools) | 4 | 3 | 19 |
| P5 (standalone costing calculator) | 2 | 4 | 5 | 3 | 2 | 2 | 18 |
| P3 (throughput chaos) | 3 | 3 | 1 (consulting, not product) | 3 | 3 | 1 | 14 |
| P4 (tipping friction) | 5 | 1 | 1 (structural) | 2 | 1 | 1 | 11 |

### Adversarial panel (3 subagents, all returned `proceed_with_changes`, medium confidence)

**Skeptic 1 — Alternatives advocate.** Strongest objection: *"You selected the problem with the loudest complainers instead of the problem with the most motivated payer"* — every pain quote is from a non-buyer; the 13.8% margin stat points at P5 (money), not documentation. **Adopted:** merge P5 into the recipe card (cost/margin auto-computed) so the owner has a selfish economic reason to enter recipes; stop citing "75% staffing challenge" as if it uniquely supports documentation; tie the recurring loop to the quit rate (every departure triggers re-onboarding).

**Skeptic 2 — Adoption skeptic.** Strongest objection: owners' revealed preference (free Docs existed for 15 years; 9/10 shops still document nothing) proves the constraint is **motivation, not tooling**. Mid-rush, *"a laminated cheat sheet taped to the machine beats any app at the moment of need."* **Adopted:** paper-first output as a core feature, not an export afterthought; anchor marketing to the trigger event ("new hire starts Monday — pack ready in 10 minutes"); effortless input (start from pre-seeded cards, tweak — never blank page).

**Skeptic 3 — Business skeptic.** Strongest objection: free tier as specced gives away 100% of single-location value; no moat in templates ("ChatGPT will generate a recipe book in ten minutes"); TAM ceiling math says micro-SaaS (~$180–360k ARR at 3% of ~25k serviceable shops) unless expanded. *(Kill-pass note: Step 7's source reconciliation cut serviceable to ~12–20k and the ceiling to ~$90–150k shop-side — see 03 §6.)* **Adopted:** flat per-shop pricing (no seats — seats punish high-turnover shops), 30-day full trial instead of perpetual free in the business model; moat = shop-specific **living state** (versioned dial-ins, sign-off records) which templates and AI can't replicate; **roaster channel** — specialty roasters touch 50–300 cafe accounts each and already give training as a wholesale value-add → white-label the tool as the roaster's onboarding gift (salvages P2 as a channel, collapses CAC); coffee = beachhead, data model kept vertical-agnostic under the hood (bars/bakeries/juice later).

### What I explicitly did NOT adopt, and why
- **Pre-sale kill-gate before building** (10 owners prepaying in 30 days): correct in real life, impossible in this mission (no outreach/posting allowed). Converted into the **post-launch validation plan** in Step 3 — first 30 days, with kill criteria, for Ethan to run.
- **"Accept it's a lifestyle micro-SaaS"** as a limit: partially adopted. The honest ceiling math goes in the business plan; the expansion path (multi-location tier, roaster white-label, adjacent verticals) is the answer to it, stated as strategy rather than hedge.

## Why this wins (the one-paragraph case)
The pain is real, current, and verbatim-sourced (11 quotes, 2024–2026). The gap is real: incumbent tools cost $50–900/mo and chase multi-location operators; the single-location indie's current tool is a paper binder or nothing (verified by fetched pricing/positioning). The skeptics' buyer-motivation objection is answered structurally: the owner enters a recipe because it shows margin (money in), keeps it alive because dial-in changes daily (operations), and the training pack falls out as a byproduct (the thing they were never motivated to do gets done without being asked). Zero-cost buildable as a local-first web app; nothing in the core loop needs a server.

## Sources relied on this step
- All Step 1 evidence (see 01-hunt-for-pain.md for quotes + URLs).
- Fetched: https://www.getbrewspace.com/blog/the-best-tools-to-run-a-multi-location-coffee-business (Brewspace $50–900/mo; ops stacks $300–600/mo/location; "cost of NOT having tools is 3–5× higher").
- Fetched: https://trainual.com/pricing (pricing demo-gated — enterprise sales motion, hostile to single-shop buyers).
- Fetched: https://www.ibisworld.com/united-states/number-of-businesses/coffee-snack-shops/1973/ (94,331 US coffee & snack shops, 2026, +3.4% YoY).
- Fetched: https://www.scrapehero.com/coffee-shop-industry-statistics-us/ (chain counts: Starbucks 17,137; Dunkin 9,830; Dutch Bros 1,020…).
- Failed fetches (noted): simplysops.com (403), pos.toasttab.com stats page (403).

## Open / carried to Step 3
- Serviceable-market number needs a defensible independent-shop count (IBISWorld covers "coffee & snack shops" broadly; derive + label the indie estimate as inference).
- Pricing point ($19–29/mo flat vs $199/yr) to be set with unit-economics sanity math.
- Roaster-channel mechanics to be designed (white-label what, exactly?).
- Name/brand: Step 4. Product architecture: Step 5 (local-first, print-first, seeded card library).

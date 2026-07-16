# Step 1 — Hunt for Pain

**Date:** 2026-07-15 · **Status:** complete
**Mission context:** Autonomous build of a complete company around a real, sourced pain point in the coffee shop world. This file is a standalone checkpoint: paste it into a fresh chat and the mission can resume from Step 2.

## What was done

Planned as a 5-agent parallel fan-out (owners / baristas / roasters / customers / industry). All five subagents died instantly on a session usage limit, so the hunt ran **inline** instead — same segments, same evidence rule. Route into Reddit (which blocks both curl and WebFetch): **PullPush.io**, the public Reddit archive API. Two sweeps, 24 queries, ~200 posts retrieved, full selftexts archived locally at `~/.claude/jobs/dde0cee3/tmp/hunt_raw/`. Industry stats came from WebSearch + WebFetch on trade press.

**Citation discipline note:** Reddit quotes below were fetched from `api.pullpush.io` (the URL actually fetched); the `reddit.com` permalinks are the canonical human-readable locations. Reddit blocks our fetcher, so live-existence of each post could not be re-verified — posts marked deleted in the archive were excluded, and full text of every quoted post is saved locally as proof of what was fetched.

## The pain map (evidence-backed)

### P1 — Nothing is written down: training, recipes, and SOPs live in people's heads ⭐ strongest cluster
Independent cafes run on undocumented knowledge. Owners (often first-time, no food-service background) have no training guide, no recipe book, no station checklists. Consequences pile up on every side: baristas improvise, drinks are inconsistent, new hires are terrified, skilled staff get dumped with unpaid curriculum-writing, customers get bad drinks.

Evidence (all fetched via PullPush archive, dates shown):
- **Owner, 7 yrs specialty experience** (r/barista, 2025-04-24, 29pts): *"coffee like no other, has the absolute WORST training standards... and the thing that appalls me the most about it, is how prevalent it is. 9/10 of the coffee shops I visit these days have absolutely no standards."* https://www.reddit.com/r/barista/comments/1k6ee41/
- **Barista told to invent the training program** (r/barista, 2025-03-14): *"the shop is lacking a lot of basics such as guidelines on making drinks, how our beans should be ground, information on how to use the machines, protocols for distraught customers... Now on top of all this my boss expects me to make this training guide and then train the new barista. It's unbelievable."* https://www.reddit.com/r/barista/comments/1jb70yd/
- **No recipe book** (r/barista, 2024-04-22): *"we really don't have a ideal recipe book to make sure things and drinks are being made the same... The cafe is a non profit so we wouldn't want to do anything too expensive either."* https://www.reddit.com/r/barista/comments/1c9z6b2/
- **No training at all** (r/barista, 2025-04-30): *"The cafe I work at does almost no training and I just don't feel comfortable making drinks when I know that I'm lacking in ability."* https://www.reddit.com/r/barista/comments/1kbptqu/
- **First-shift terror** (r/barista, 2024-10-05): *"I wish I took pictures of the menu and all the recipe books so I could be burning all of it into my mind right now."* https://www.reddit.com/r/barista/comments/1fwio42/
- **Newbie hunting for cheat sheets** (r/barista, 2025-04-17, 15pts): *"i also want to make sure i can refer back to it when making a drink or food so i don't run around looking for the cheat sheets."* https://www.reddit.com/r/barista/comments/1k12esx/
- **Trainer with no materials** (r/barista, 2025-04-02, 53pts, 31 comments): *"I'm worried that since it's been 4 years, I won't remember at all where the knowledge gaps exist for people."* https://www.reddit.com/r/barista/comments/1jpzts5/
- **Undocumented safety-relevant SOP** (r/barista, 2025-05-07): syrup-making on an open flame *"was not listed in the job description nor was it spoken about during training or written in the manual."* https://www.reddit.com/r/barista/comments/1kh7sj2/
- **Role-creep on the one skilled barista** (r/barista, 2025-03-19, 24pts): *"I have been making recipes, making syrups, making the specials, helping with marketing, doing the ordering, training, and i get paid .90 cents more than all the other baristas."* https://www.reddit.com/r/barista/comments/1jexntr/
- **Customer-side symptom** (r/barista, 2024-11-16): a badly made flat white prompts *"a flat white really shows the ability of the barista as well as the quality of coffee"* — inconsistency is visible to paying customers. https://www.reddit.com/r/barista/comments/1gsrrm0/

Macro amplifiers (fetched directly from the live pages):
- *"75% of shop owners"* identified **staffing as their biggest challenge**; average indie margin 13.8%. — 2025 Independent Coffee Shop Industry Report, https://www.coffeeshopkeys.com/post/the-2025-independent-coffee-shop-industry-report
- Food-services **quit rate 4.3% in March 2026 — nearly double the private-sector average**; 77% of operators cite retention as a significant challenge (NRA 2025 report, cited therein); *"unlike many entry-level hospitality roles, coffee requires a significant level of technical skill"* (context of the piece: turnover's greatest cost is the training investment lost). — Coffee Intelligence, June 2026, https://intelligence.coffee/2026/06/barista-retention-coffee-shop-growth/

High turnover × zero documentation = the same training cost paid over and over, from a 13.8% margin.

### P2 — Microroaster wholesale ops are spreadsheets and awkward phone calls
- **Wholesale pricing opacity** (r/roasting, 2025-01-10, 13pts/32c): *"I'm finding it really difficult to track down actual pricing for wholesale coffee on roasters' websites—most require filling out applications and creating accounts before showing any bulk pricing."* https://www.reddit.com/r/roasting/comments/1hy9r5m/
- **Chasing overdue invoices** (r/roasting, 2024-03-12): *"what do you pros do when wholesale accounts are past due?... some of my recent relationships are making me nervous with the bill they're racking up."* https://www.reddit.com/r/roasting/comments/1bcmdry/
- Lost wholesale shipments, no playbook (r/roasting, 2025-05-16): https://www.reddit.com/r/roasting/comments/1ko7ocb/
Real but a much smaller audience (micro-roasteries), and Cropster/RoasterTools already chase the paying end of it.

### P3 — Two people, twelve product lines: throughput chaos in small shops
- (r/barista, 2025-05-09, 73pts): shop sells 20 ice-cream flavors + coffee + alcohol + made-to-order food with **2 staff**: *"All of these things don't have time restrictions... someone could come at 12 and order an Aperol Spritz, icecream, and a sandwich, while the next person just wants a cappuccino to go."* https://www.reddit.com/r/barista/comments/1kigd1m/
- Matcha latte takes ~6 minutes each at a high-volume bar (r/barista, 2025-05-17, 37pts/73c): https://www.reddit.com/r/barista/comments/1kov08a/
Symptom of menu sprawl — an ops-consulting problem more than a software one, but overlaps P1 (no systems).

### P4 — Tipping-culture friction burning out staff
- The "$6.66" thread (r/barista, 2025-05-14, **958pts/100c**): customer tips one cent over a $6.66 total; the thread is a massive vent about tip dependence. https://www.reddit.com/r/barista/comments/1km3cj8/
Huge emotional resonance, but structural (wage model), not something a small product fixes.

### P5 — Cost/pricing uncertainty for owners
Content-marketing pages confirm owners struggle to price drinks (Toast: https://pos.toasttab.com/blog/on-the-line/how-to-price-coffee, Coffee Shop Startups: https://coffeeshopstartups.com/how-to-price-your-coffee-beverages/), but the Reddit sweeps surfaced **no strong first-person owner complaints** about costing tools specifically. Weaker evidence than P1 — parked.

## Existing-solution scan (why P1 is underserved)
Search of the space (fetched search results, 2026): coffee-specific management suites are **$50–900/month** (corrected at kill-pass to match the Brewspace fetch cited in 02/03; originally written as $50–300), POS-anchored, multi-location oriented (Brewspace, Restaurant365, Supy, SimplySOPs). Generic SOP tools (Trainual etc.) are HR-department products. The people quoted above — a nonprofit cafe that "wouldn't want anything too expensive," a first-time owner with no food-service background — are exactly who these tools skip. Their current tool is a paper binder or nothing. (Deeper competitor teardown with fetched pricing pages: Step 3.)

## Key decisions this step
- **D8 (build log):** subagent fan-out failed on session limits → ran the hunt inline via PullPush. Coverage cost: fewer segments probed exhaustively (customer-segment sweep was thinnest).
- Chose PullPush archive as the Reddit route after reddit.com blocked curl, api.reddit.com, and WebFetch (old.reddit).
- Excluded posts the archive marks as later-deleted.

## Dead ends / cut
- 5-agent workflow: all agents failed on usage limit (~19:13 CEST).
- r/coffeeshopowner subreddit: empty/nonexistent in archive.
- r/Entrepreneur query: HTTP 429, not retried (14th of 14 queries, marginal value).
- site:-restricted WebSearches: returned nothing usable.
- Customer segment: thin evidence beyond tipping threads; noted honestly rather than padded.

## Open for next steps
- Step 2 candidates: **P1 (favorite on evidence), P2, P5-as-a-feature-of-P1**.
- Need at Step 3: fetched pricing pages for 2–3 named competitors; US shop-count stats (Statista/IBISWorld pages found but not yet fetched: https://www.ibisworld.com/united-states/number-of-businesses/coffee-snack-shops/1973/).
- All raw evidence JSONs: `~/.claude/jobs/dde0cee3/tmp/hunt_raw/` (copy into repo at packaging if useful).

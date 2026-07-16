# Step 3 — Design the Business

**Date:** 2026-07-15 · **Status:** complete
**Standalone checkpoint:** this is the business plan. Resume from Step 4 (brand) with this file + 02.

---

## 1. What the company is

**One-liner:** The operating system for independent coffee shops, built on the one artifact every shop already believes in — the recipe card — where every card knows its cost, its margin, its current dial-in, and how to train the next new hire.

**The insight that survived the adversarial panel:** owners don't buy "documentation" (they've ignored free Google Docs for 15 years). They buy *money* and *time*: what does this drink actually cost me now that green coffee doubled, and how fast can the new hire pour solo. Documentation falls out as a byproduct.

**Form factor:** local-first web app (single source of truth) that generates **paper** — laminated recipe cards, station sheets, a new-hire pack — because paper taped to the espresso machine is the only interface that survives a morning rush (adoption skeptic's finding, adopted as product principle).

## 2. Who it's for

**ICP (beachhead):** US independent coffee shop, 1 location (secondary: 2–5), 3–12 staff, owner-operated, no ops software beyond a POS. Buyer = owner. Daily users = owner + baristas. The same shop where our Step-1 evidence lives: no recipe book, no training guide, new hire every few months (food-service quit rate 4.3%/mo, ~2× private sector — Coffee Intelligence, fetched).

**Trigger moments we sell into** (not ambient pain): a new hire starts Monday; a new bean arrives and nobody knows the dial-in; the owner raises prices and needs to know which drinks are underwater.

## 3. Why now (all fetched sources)

- **Input-cost chaos made drink costing a *recurring* problem:** arabica futures hit a historic $4.41/lb Feb 2025, still above 5-yr average; 50% US tariff on Brazil cut its coffee exports to the US 46% in one month (Perfect Daily Grind, Feb 2026 — https://perfectdailygrind.com/2026/02/will-2026-be-different-coffee-industry-challenges/). A static price list laminated in 2023 is now silently wrong. Cost-per-drink must live and update — which kills the "write-once artifact" objection.
- **Margins have no room for guessing:** average shop margin 11% (range 6–18%) (https://www.coffeedasher.com/coffee-shop-industry-statistics/); indie-report average 13.8% (https://www.coffeeshopkeys.com/post/the-2025-independent-coffee-shop-industry-report).
- **Turnover makes training a treadmill:** 75% of indie owners call staffing their #1 challenge (same indie report); every quit re-triggers the new-hire pack.
- **The tooling gap is documented:** coffee ops suites run $50–900/mo and target multi-location (Brewspace article, fetched); Trainual won't even show a price without a sales demo (fetched). Nothing serves the single-location shop at its price point: **$0-to-cheap, zero setup, no sales call.**

## 4. Product (v1 scope — buildable this month at $0)

1. **Recipe cards with live economics** — ingredients + quantities; per-drink cost auto-computed from an ingredient price list; margin vs menu price; when an ingredient price changes, every affected card re-prices and flags margin erosion. *(P5 merged in — the owner's selfish reason to type recipes.)*
2. **Dial-in board** — per bean: grind setting, dose, yield, time, updated in seconds; full history preserved (the "living state" moat — templates and ChatGPT can't know YOUR shop's current dial-in).
3. **Training paths** — drag cards into an ordered path ("Day 1: espresso basics → steaming → top 5 drinks"); sign-off checkboxes per barista.
4. **Print packs** — 4×6 recipe cards, station sheets, a complete new-hire pack — print-perfect from the browser. Paper is the point-of-use product.
5. **Seeded library** — 15 standard drinks with editable specs and typical ingredient costs. Never a blank page: tweak, don't author.
6. **Local-first, no accounts** — data in the browser (localStorage), JSON export/import for backup/sharing. Nothing to sign up for, nothing that can bill.

**Deliberately later:** cloud sync via secret link, multi-location workspaces, roaster partner workspaces, quiz/audit trail, POS integration. (Data model kept vertical-agnostic — bars/bakeries/juice shops share the same pathology; that's the answer to the TAM ceiling, below.)

## 5. Business model

| Tier | Price | For | Notes |
|---|---|---|---|
| Trial | 30 days full | everyone | No card. No perpetual free tier for shops (business skeptic adopted: free tier = 100% of single-shop value given away). The local-only open version stays free forever — it's the demo, the trust anchor, and the top-of-funnel. |
| **Shop** | **$29/mo or $199/yr** | single location | Flat. **No per-seat pricing** — seats punish exactly the high-turnover shops we serve. Anchor: one no-show shift or one week of a mis-dialed grinder costs more. |
| Group | $79/mo | 2–5 locations | Consistency across sites is where recurring value compounds. |
| **Roaster Partner** | **$149/mo** | roasters, up to 50 cafe accounts | White-label: roaster's wholesale cafes get the tool as an onboarding gift, cards pre-seeded with the roaster's beans + recommended dial-ins; when the roaster updates a seasonal bean spec, every partner cafe's dial-in card updates. Roaster pays because it cuts "what grind should I use?" support calls and locks in wholesale accounts. *(This is Step-1's P2 salvaged as a channel.)* |

**What the $29 actually buys (kill-pass fix):** the free local version keeps 100% of single-machine value forever; the Shop tier's named deliverable is **secret-link cloud sync + staff-phone access** (multi-device, multi-person). That feature ships after Phase-0 validation, so founding prepays are explicitly **pre-orders of sync** at $99 — the site already states this ("The Local tier is the product you can open today; Shop & Roaster tiers ship after founding-shop validation"). Without this, the paid tier would be feature-identical to the free one — the exact error the Step-2 panel flagged.

**Roaster Partner is Phase-2 revenue (kill-pass fix):** its core mechanic ("roaster updates a seasonal bean spec → every partner cafe's board follows") requires cloud sync and roaster workspaces, both post-validation. It is priced here as plan-of-record, not launch-window revenue. Double-count rule: cafes reached via a roaster's white-label are **excluded** from Shop-tier counts — roaster ARR is channel revenue, never added on top of the same shops' subscriptions. Note the tier caps at 50 cafe accounts while the channel case imagines up to 300-account roasters; larger networks are an unpriced custom tier until a real roaster conversation prices one.

**Pricing decisions logged:** $29/$199 chosen at the top of the skeptic's $19–29 band because the anchor is labor cost, not software comps; annual prepay pushed hard (≈43% discount) because prepay is the practical answer to SMB churn.

## 6. Market (sourced, inferences labeled)

- 94,331 US coffee & snack shops, 2026, +3.4% YoY (IBISWorld, fetched — category broader than cafes).
- 42.7K+ US coffee shops; "over half of all U.S. coffee shops are independently owned"; US branded coffee market $54B 2024 (coffeedasher.com aggregator, fetched; cites World Coffee Portal/Statista/NCA).
- **Source conflict (found at kill-pass, stated honestly):** the chain counts fetched in 02 (Starbucks 17,137 + Dunkin 9,830 + Dutch Bros 1,020 = 27,987 before counting any other chain) cannot reconcile with "over half of 42.7k independent" — the two sources count different universes (standalone cafes vs kiosks/licensed counters). The favorable reading is not assumed.
- **Inference (labeled):** independents ≈ 15–25k US shops depending on universe (42.7k minus majors ≈ ~15k; the broader IBISWorld category supports the higher end). Serviceable (English-speaking, owner-operated, reachable online) ≈ **12–20k US**.
- **Honest ceiling (revised at kill-pass):** at 3% penetration in 3 years ≈ 360–600 shops × blended ~$250/yr ≈ **$90–150k ARR**, plus roaster partners (Phase-2, excluded from shop counts per §5) up to ~$54k → **beachhead ceiling ~$150–200k ARR at the optimistic end, nearer $100k on the conservative read.** The company case rests on the expansion axes: multi-location tier, roaster network (each roaster touches 50–300 cafes), and the vertical-agnostic core (bars/bakeries/juice = same disease, >5× the venue count). Stated as strategy, not hedge: coffee is the beachhead because that's where the evidence is.

## 7. Competition (fetched where possible)

| Alternative | Price | Why it loses the single-location indie |
|---|---|---|
| Paper binder / nothing | $0 | The incumbent. Loses on: never updated, unreadable, no costing, walks out the door with the barista who wrote it. We beat it by *generating better paper*. |
| Google Docs / Notion | $0 | Blank page + no drink-costing + no dial-in state + ugly to print at 4×6. 15 years of revealed preference says owners don't start. |
| Brewspace & coffee ops suites | $50–900/mo (fetched) | Multi-location DNA, POS-anchored, sales-led. Overkill and overpriced for one shop. |
| Trainual (generic SOP/LMS) | demo-gated pricing (fetched) | HR-department product; no cafe would book a sales call to store 15 recipes. |
| SimplySOPs | unknown (site 403'd — noted honestly) | Cafe-specific SOP checklists, but no live costing/dial-in state (per its search positioning). |
| 7shifts / Homebase | scheduling-anchored | Own the schedule, could bolt on templates overnight (real threat) — but their wedge is labor compliance, not recipes; our moat is living shop state they don't capture. |
| ChatGPT-generated handbook | ~$0 | Generates generic docs in minutes (real threat, acknowledged) — but can't know this shop's dial-in today, this shop's ingredient costs, this hire's sign-off state. Static output rots the day the bean changes. |

## 8. Go-to-market

**Phase 0 — validation gates (first 30 days after handoff; requires human outreach, so these are Ethan's moves, not mine — the no-posting guardrail):**
1. Post the landing page + free local version to r/barista, r/cafe, r/roasting, 2 indie-owner Facebook groups (the exact communities the evidence came from).
2. Gate: **15 owners** import or enter their real recipes within 2 weeks (content submission = the only demand signal that matters — adoption skeptic).
3. Gate: **10 founding-member prepays at $99 first year** within 30 days (pre-sale kill-gate — business skeptic). **Mechanism (kill-pass fix):** creating a Stripe account + Payment Link is Phase 0's one human setup step — it happens *before* this gate, not after it (the old wording deferred Stripe until the gates passed, which made the prepay gate unexecutable).
4. Moat gate (kill-pass addition): at day 30, **at least half the shops that entered real recipes have touched a dial-in or price in the last 10 days** — the "living state" moat only exists if state actually lives.
5. Soft check: **3 real roaster conversations**; if none would gift the tool to their accounts, demote the roaster channel from #1 before spending on it.
6. **Gate 3 is individually fatal:** zero prepays after real effort = thesis falsified, regardless of the other gates. Miss gate 2 as well → stop entirely, keep the free tool as a portfolio piece.

**Channels (ranked):**
1. **Roaster Partner white-label** — the only channel in this segment with collapsing CAC: one roaster sale = 50–300 cafe relationships, and the roaster does the onboarding for us. *(Kill-pass label: the 50–300 accounts-per-roaster figure and "roasters already give training as a wholesale value-add" are **inference, not fetched** — Step-1's roaster evidence was about invoicing/pricing pain. Phase 0's roaster conversations exist to test this.)*
2. **The templates ARE the ads:** free printable recipe-card/new-hire-pack generator as SEO top-of-funnel ("latte recipe card printable", "barista training checklist template") → the tool that made the free card is one click away.
3. **Community-native content** in r/barista etc. (dial-in threads, costing breakdowns) — genuine participation where the Step-1 complaints live.
4. No paid ads (zero budget, and CAC math fails at this ACV — skeptic's LTV/CAC analysis adopted).

## 9. Unit economics (honest version)

- Blended ARPU ≈ $250/shop/yr (mix of monthly/annual). Roaster ≈ $1,788/yr.
- Churn assumption: SMB software churn ~4–5%/mo *plus* cafe business mortality (commonly cited ~50% within 5 years — **not independently verified, labeled as industry folklore**); annual prepay + roaster-channel lock-in are the two structural mitigations.
- **Cohort math (added at kill-pass):** at 4–5%/mo churn, ending year 3 with ~600 *net* shops requires ~1,300 *gross* sign-ups (~430/yr) through $0-cash channels — that is the real ask hiding inside "3% penetration." Annual prepay is pushed precisely because it collapses effective monthly churn; if the mix stays monthly, halve the ceiling in §6 again.
- CAC: $0-cash channels only (community + SEO + roaster partners); the cost is founder time. At $200+ paid CAC this business fails (skeptic math, agreed) — so it is designed never to buy customers.
- Infra cost at launch: **$0** (local-first app, static hosting). First real cost: payments (Stripe) — needed *inside* Phase 0 for the prepay gate (§8), the one account creation validation requires; still a human step, just correctly sequenced now.

## 10. Risks (kept from the panel, with mitigations)

1. **Owner apathy is the disease** (strongest surviving objection, all 3 skeptics): mitigated by money-first framing, trigger-event marketing, zero-setup seeded library — *mitigated, not solved; Phase-0 gates exist to falsify cheaply.*
2. **Copycat/platform bolt-on** (7shifts template pack, AI handbooks): moat = living state (dial-in history, sign-offs, cost history) + roaster network effects. **Kill-pass honesty: this moat is behavioral, not structural** — it exists only while owners keep entering data by hand (no price feed, no POS integration in v1), i.e. it depends on risk 1 being solved. That dependency is why Phase 0 gained the day-30 engagement gate (§8.4): if state stops living, the moat and the anti-churn story fall together.
3. **Solo-founder key-person risk:** local-first architecture means the product keeps working even if the company pauses.
4. **TAM ceiling:** answered by expansion axes; accepted as micro-SaaS if they fail.

## Key decisions this step (build-log cross-ref D11–D15)
- Pricing $29/$199 flat per shop; no seats; 30-day trial; no perpetual free shop tier (free = local-only version).
- Roaster white-label at $149/mo as channel #1.
- Honest ~$200k-ARR beachhead ceiling stated; expansion strategy is the answer.
- Validation kill-gates specced for Ethan (I can't do outreach under mission guardrails).
- v1 product scope locked (6 features above); QR/cloud-sync/Pages hosting explicitly deferred (no deployments allowed beyond the GitHub repo).

## Open → Step 4
Name + brand + voice; domain availability check (no purchase). Then Step 5 builds v1 + marketing site.

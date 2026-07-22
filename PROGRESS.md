# Portafile — Progress Journal

Founder's log. What shipped, why it mattered, what it cost. Newest entries at the bottom.

- **Product:** recipe cards with live cost/margin + dial-in board + printable new-hire packs, for coffee shops.
- **Live:** https://portafile.vercel.app
- **Running cost to date: $0.** Vercel free tier (hosting + serverless functions + Blob), GitHub free tier (Actions, Dependabot), Gmail SMTP for alerts. No paid service is in the stack.
- Origin story and the business/strategy decisions live in `BUILD-LOG.md`; this file tracks what happened *after* the first build.

---

## 2026-07-15 → 07-16 — Company in a weekend

Went from "find a real pain point in coffee shops" to a deployed product. Researched the market, picked training/recipes/SOPs over two rival ideas, ran an adversarial kill-pass on it, then built and shipped.

The key reframe: recipe cards alone are a nice-to-have. Recipe cards that show **live cost and margin per drink** are something an owner will pay for, and a **dial-in board** is the thing that makes them open it every day.

Shipped: the app, the marketing site, privacy policy + terms + CAN-SPAM email footer, Vercel deploy config, security headers, and a local-only founder dashboard (kill gates, prepay ledger, email list, post tracker).

Decisions worth remembering: $29/mo or $199/yr flat per shop (no per-seat — that punishes high-turnover shops); roaster white-label as channel #1 (one roaster = 50–300 cafe relationships); no free cloud tier, the free thing is the local-only version.

## 2026-07-17 — It works on more than one device

Two features that turn a personal tool into something a shop can use.

**Cloud sync via secret link.** Opt-in. A shop's data lives in Vercel Blob and is reached with a `?k=` link — no accounts, no passwords. That was deliberate: baristas will not sign up for anything, and asking them to would kill adoption.

**Access gate.** Email + shop name before first use. This is the lead list — every person who tries the product is now someone I can contact. Leads land in Blob and show up in the founder dashboard.

Also fixed mobile tab overflow and made the tabs keyboard-accessible.

## 2026-07-18 — Made it look like a real company, then attacked it

Redesigned the landing page in a café-ephemera style with scroll-reveal animation. Nearly shipped broken — the animation script 404'd in production because the site root is a *rewrite*, so relative paths resolve against `/`. Now a permanent gotcha in `CLAUDE.md`.

Ran a security audit on my own product and fixed what it found: an XSS hole in the dashboard, lead-spam abuse controls, a stricter Content-Security-Policy, CORS scoped to the production origin, GDPR lead deletion, `security.txt`, a dependency bump, and CI that actually runs.

Lesson: auditing my own work found eight real issues. Building it and reviewing it are different jobs even when it's the same person.

## 2026-07-21 — The day the security model got serious

The biggest engineering day so far. The naive secret link had a fatal business flaw: **you can't fire a barista.** One shared link, no way to revoke it, and anyone who ever had it keeps access forever.

Rebuilt the whole access model in three parts: shop data at one address, a rotatable pointer that the `?k=` link resolves through, and an owner token that never appears in a URL. "Reset staff link" is now real revocation — the old link dies.

That took four attempts to get right, and the failures are the interesting part:

1. Rotation could leave the old link alive, because the index I read from lagged behind the write.
2. **Vercel Blob is eventually consistent** — I measured it, didn't assume. Reads returned stale values for seconds; a "missing" file might just be a slow read. So authorization can never be built on absence. A dead link is now a *value comparison* answered with an explicit `410 revoked`, and the device only wipes itself after two of those.
3. The wipe cleared the signup record too, which made users re-fill the access gate and wrote a duplicate lead into my own store. Now tested against.
4. A device holding *some other shop's* owner token could not be revoked at all — it retried forever. Owner status is now decided by the server, not by what the device claims.

Also moved every stored file to a **private** Blob store (previously public-by-URL), moved the shop ID out of the query string into a header, and pinned CI actions by commit SHA.

Honest limitation, stated rather than hidden: revocation takes a few seconds to propagate. That's fine for firing a barista; it is not a real-time guarantee.

Shipped `ONBOARDING.md` — a plain-language guide for the two founding shops.

## 2026-07-22 — It watches itself now

**Daily health check.** A script probes the live site every day at 15:00 UTC with no credentials and emails me if anything breaks, plus a Monday all-clear so I know the alarm itself still works. It retries once after 20 seconds — one blip is not an outage. It also asserts the no-auth founder dashboard is **not** reachable in production, which is the check I'd most regret not having.

**Staff view.** Devices on a staff link no longer see costs or margins. Baristas need the recipe; they should not see what the owner pays for oat milk. Fixed a bug where a device holding an unrelated shop's owner token was wrongly treated as the owner and shown costs. Privacy policy updated to describe this honestly.

**Erase a shop's cloud data.** The founder dashboard can now delete a shop's data off the server. This is the thing I'd have to be able to do on demand the first time a customer emails "delete my data" — and I'd rather have it before that email than after.

Two design calls that matter more than the code:

- **The tombstone is written before the data is deleted.** Blob is eventually consistent, so if I deleted the data first, a customer's browser mid-save could quietly write it all back. Marking the shop dead first closes that window; the data is then deleted twice, a second apart, to catch the lag.
- **The owner's own device keeps its local copy.** My delete button erases *my* server copy, never a shop's last remaining copy of their own recipes. Their staff's devices wipe fully — including the signup record, so those devices see the signup prompt again if they come back.

Verified end-to-end against the live site with a throwaway shop, then deleted the test data. Both real shops untouched.

**The share link was asking baristas to sign up.** I sent my staff link to someone else's phone and it opened a form asking for their email and a shop name. They closed it and told me sharing was broken — which, as a product, it was.

The data was never the problem. I probed the real link and the server returned the whole shop, correctly marked staff-view. Then I drove a phone-sized browser at the live site and watched it happen: the shop synced fully into storage while the signup form sat on top of it, hiding the thing it had just finished loading. The gate skipped `file://`, test browsers, and anyone who'd already filled it in — it never asked whether the visitor had arrived on a staff link. One condition, one line.

The lesson is about what the gate was actually buying me. It captures the owner on their first visit and ties that email to their shop ID — that's the signup worth having, and it's untouched. Every barista pushed through it wrote a row into my leads store with a guessed shop name and no shop ID attached to it: unusable data, collected at the cost of the core feature. And it gated nothing — no password, no verification, so it only ever filtered honest people. Sharing *is* the product; a recipe app one person can see is a notes file.

Cost: one line of code, and some junk rows in the leads store that need a cleanup pass. Staff links now open straight into the recipes.

**I can finally see whether anyone is using this.** The founder dashboard now loads live numbers: how many shops have sync on, how many edited something in the last 7 and 30 days, how long it takes a signup to become a live shop, what share of shops have made the app their own instead of sitting on the demo, and what share use training sign-offs or dial-ins. Underneath it is one new serverless function that computes those numbers and hands back nothing else.

Three decisions worth remembering:

- **The privacy page contradicted the feature before I wrote a line of it.** It said "We never look at, analyze, or share your recipes or costs" — and adoption percentages are computed by reading shop data. So the numbers are computed *inside* the function and only totals come out; no recipe, price, or shop name is ever returned, displayed, or exportable, not even to me. The policy now says exactly that, including the part where I count feature usage in aggregate. A metric that forces you to quietly break a promise you published is not worth having.
- **Print adoption is the one thing I asked for and did not build.** Nothing records a print, and the only way to measure it is to start writing usage counters into customers' own data. The three signals already stored — did they rename the shop, do they have sign-offs, do they log dial-ins — answer "is this being used and for what" without watching anybody. I'd rather have three honest numbers than four with a tracker behind one of them.
- **The onboarding clock nearly lied to me.** When a browser links its signup to a shop, the app re-sends the whole signup and the server stamps it with a *fresh* time. Measuring "signup → shop live" from that record would have reported onboarding times near zero and told me the funnel was perfect. The clock now starts from the earliest record for an email; there's a test that fails if anyone changes it back.

Baristas and owners can now send feedback from the app (**? → Send feedback**), a thumbs up or down with an optional note, and it lands in a table on the dashboard with a positive-percentage tally. That's the sentiment metric, and it's the one number here that comes from a person rather than an inference.

Blind spot, stated plainly: every number counts shops with sync **on**. A shop living only in someone's browser is invisible, and no amount of dashboard work can change that without tracking people. Cost: zero — same storage, one more function on the free plan.

**I can now see which cafes are alive and which are drifting away.** The dashboard grew a row per cafe: when their shop first went live, when they last changed anything, how many of the last 30 days they actually used it, and a red flag when nobody has touched it in two weeks. Stalest shop sits on top, because that's the one I should be phoning.

The aggregate numbers told me *how many* shops were using it. They could never tell me *which* shop was quietly dying — which is the only version of that question I can act on with two customers.

Three things I had to get right:

- **Reading recipe cards has to count as usage.** A save is easy to notice; the server sees it. But a barista pulling up a build sheet mid-shift only *reads* — and that's the whole product working exactly as intended. Counting only saves would have told me a busy shop was idle. So both reads and writes stamp the day, which means the usage number reflects the people I built this for and not just the owner doing admin.
- **Dates only. Never times, never durations, never which device.** In a two-person shop, "when was the app open" is one barista's shift behaviour, and the moment I record that I've built a staff-monitoring tool without anyone asking me to. A list of calendar dates tells me "this shop is alive"; it can't tell me who was working late. The privacy page now says this in those words, and the usage log is deleted along with everything else when a shop asks me to erase their data.
- **A cafe's name comes from what they typed into my signup form, never from their app.** Their shop data is theirs; the name they handed me is mine to use. It's a narrow line and I wrote it into the project rules, because the aggregate-only promise still holds for everything read out of their recipes. Right now neither real shop is named — linking a name to a shop needs the owner to sign up and turn on sync in the same browser, and neither did — so I can type my own label per shop instead of squinting at ID prefixes.

The cost concern was real and it's handled: devices poll every 30 seconds, and a naive version would have added a storage read to every single poll. Each server instance remembers which shops it already stamped today, so a warm one does one read and at most one write per shop per day. Still $0, still on the free plan, no new service.

Verified against the real store with a throwaway shop: created it, read and wrote as a staff device, confirmed a revoked link and a deleted shop stamp nothing, confirmed my delete button erases the usage log too — then removed every test blob and checked the store was back to exactly the two real shops. The dashboard table was driven in a real browser, including a shop name containing an image tag with a script in it, which rendered as plain text.

Still not deployed. Levels 1, 2 and 3 all go live together, and that deploy changes the public site — the feedback button and the privacy wording — so it's mine to press, not something to slip in as a finishing touch.

---

## Open threads

- Two founding shops to onboard — the first real users.
- Post-launch validation with kill criteria (from `BUILD-LOG.md`) hasn't run yet.
- Roaster white-label channel is a plan, not a conversation with a roaster.

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

**It's live now** — and the first thing it told me was uncomfortable.

I fed an AI's business advice about Portafile into a session and asked for it to be checked rather than agreed with. Most of it was already built. One piece was actively wrong: it wanted a permanent Free / Basic / Pro ladder with team collaboration in the top tier. Team collaboration *is* the $29 Shop tier — staff-phone sync is the only thing the paid tier sells. Following that advice would have made the paid tier feature-identical to the free one, which is the exact mistake my own kill-pass caught months ago. Generic advice can't know what you already decided; the decision log was worth more than the consultant.

Then I stopped arguing and read the numbers off the live store.

**Nobody has ever signed up.** One lead record exists and it's my own test. Both founding shops are live and syncing, and neither owner ever passed through the signup form — because I onboarded them by hand, and a device arriving on a `?k=` link deliberately skips the gate. Everything downstream of that follows: time-to-onboarding has **zero samples** and structurally cannot get one from these two, and both cafes show as unnamed in the dashboard because the name comes from the signup form. This isn't a bug — every line of it is working as designed — but it means the onboarding metric I was proud of is measuring a funnel my only two customers never entered. If I keep onboarding shops personally, it stays at zero forever.

**Nobody is logging dial-ins, and nobody is using training sign-offs.** Zero percent on both, across both shops. One of the two has entered real recipes; the other is still sitting on the demo. My own day-30 moat gate says half the shops with real recipes must have touched a dial-in or a price recently — the "living state" moat only exists if state actually lives. Right now it doesn't. That is the single most important number on the board and no amount of building changes it; it's a phone call.

So the kill gates now read the live metrics instead of waiting for me to hand-type them. Gate 1 takes the higher of the ledger count and the server count, because neither is a superset — the ledger knows local-only shops the server can't see, the server knows synced shops I forgot to log. Gate 3 keeps its manual number and shows the live one beside it, clearly labelled as *any* use: the usage log stores dates only, never which feature was touched, so "opened the app" is not "touched a dial-in" and I refuse to let the dashboard imply otherwise. That's the same line I drew when I killed print tracking — a gate that quietly grades itself on a weaker measure is worse than one I have to fill in myself.

Verified by driving the real dashboard in a browser against the real production store: gates read 0/15 from the ledger alone, then 1/15 with "live: 1 of 2 synced · ledger: 0" after loading metrics, and the per-cafe labels survive the extra redraw.

---

## 2026-07-23 — The policy caught up with the feedback button

Ran a second opinion on my legal and privacy setup past what I'd already written, and the useful thing it produced was not its advice — most of which was wrong about my own app, telling me I don't store costs on my servers (I do, when sync is on), don't analyze user data (the adoption percentages read shop state), and that browser data disappears when you close the tab (it doesn't). Pasting its suggested wording onto the site would have published four false statements on the one page whose whole job is to be true. **The risk was never the collecting. It was the claiming.**

What it did surface, indirectly: the in-app 👍/👎 feedback button sends a note, an optional email and the owner/staff role to my server and keeps it, and the privacy policy never said so. The modal says it in context; the modal is not the document anyone reads when they're deciding whether to trust me. Added a "Feedback you send us" paragraph, bumped the effective date, deployed, confirmed live.

Still open: both legal pages describe Stripe payments, refunds and auto-renewal as though the payment path exists. It doesn't yet. A refund clause for a charge that can't happen is the same class of untrue as everything I just rejected.

---

## 2026-07-23 — I orphaned my own test shop, and found a hole in the delete path

Deleted a signup record during a test without first erasing that shop's cloud data, and discovered the "delete cloud data" button only exists on rows of the *signups* table — it reads the shopId out of the lead record. Delete the record and you throw away the only copy of the id the dashboard holds, while the actual data blob sits in storage with nothing pointing at it. No way back through the UI.

The data was never lost — the metrics endpoint enumerates the shop blobs themselves, so the orphan was sitting right there in the per-cafe table with its id, just with no button next to it. That's the fix: the per-cafe table is the one view that can always see an orphan, so the delete button belongs there too. Both buttons now call one `wipeShop(shopId, label)` so the confirm wording and the auth can't drift apart.

Why it matters beyond my own mess: if a customer ever asks me to erase their data and I'd already tidied up their signup record, I'd have had no honest way to do it. "Delete my data" has to work from whichever view I happen to be standing in, or it's a promise with a footnote.

Verified by driving the real dashboard against production: all three shops rendered a button, clicking the orphan's returned ok, and it was gone from the table on reload with the other two untouched. Cost: nothing. `admin/` is never deployed, so this ships to my laptop only.

---

## 2026-07-23 — "Delete my data" was quietly a no-op on the one device that mattered

Pressed delete cloud data again, this time on a shop I'd just made, and the app in the other tab carried on as if nothing had happened. No gate, no disconnect, nothing.

First thing I did was try to reproduce it on a clean browser against the real site — and it worked perfectly, back to the signup form in 24 seconds. So the feature wasn't broken; a branch nobody had ever exercised was. The client, before wiping anything, has to answer "is this dead shop mine?" It had two ways to know, and my exact test pattern kills both at once. A device that *creates* a shop doesn't get its "I pulled this" marker until its first poll thirty seconds later — so any shop I delete right after making it has none. And the server's "you owned this" flag is read out of the tombstone, which copies it from a storage read that this project already knows can come back empty (and the legacy shop never had one at all). With neither proof, the app decided the dead shop belonged to someone else, silently switched sync off, and left everything on screen.

The same missing flag had a nastier twin: it also decided whether to *keep* the local copy. So on an unlucky read, my own delete button could have wiped a shop's last remaining copy off the owner's laptop — the exact thing the whole tombstone design exists to prevent. That one never bit me and I'd never have found it looking at the symptom I was chasing.

Fix is small: the server now says *which* shop died in the 410, and the browser compares that to the shopId it created. That's a fact it can check itself instead of trusting a flag that can go missing. Second half: the app now re-checks whenever you look at the tab again, because browsers freeze background timers and I was staring at the dashboard, not the app. Live, that's 24 seconds down to 4.

Wrote the failing test first — three checks red on the old code, green on the new — so this exact hole can't come back. 96 checks pass. Honest limit, worth saying out loud: a browser that never turned sync on can't be reached by anything I press. There's no account to disable. If someone wants their local copy gone, they have to clear it themselves, and I should say that plainly rather than pretend the button is stronger than it is.

---

## 2026-07-24 — shipped it, then watched it work on the real site

Deployed the delete-to-gate fix to production and proved it end to end against the live API, not just the tests. The run that matters recreated the exact case that broke: a freshly-seeded owner device with no "I pulled this" marker yet. Deleted it through the dashboard's real button, and the app returned to the signup gate in 4 seconds while keeping its own local copy — the owner's data on their own machine is never what my delete button erases. Health check 8/8, and the one production fact I most wanted to see is now true: the server names the dead shop in its reply, which is the whole reason the browser can recognize its own without trusting a flag that can vanish.

Ran the regression pass before deploying and again after. The only thing that could have gone wrong here wasn't the delete at all — it was the second half of the fix, which re-checks sync every time you look at the tab. If that ever pulled the cloud copy on top of an edit I'd just typed, I'd have traded one silent bug for a worse one. Watched both sides of it: mid-edit, the focus check stays out of the way; once the save lands, it pulls. Cost of the whole thing: nothing new, one extra read when a synced tab regains focus.

**Then I noticed I'd never seen a health email, and that turned out to be the design's fault, not a bug.** The checker had run four times, passed every time, and mailed me exactly once — the forced test on Wednesday, which was sitting in my inbox the whole time. It was built to stay quiet unless something breaks, plus a Monday all-clear so silence would still mean something. On paper that's correct. In practice I spent a week unable to tell "the site is fine" from "the alarm is dead," which is the only question an alarm exists to answer. So it now emails every single run, pass or fail. A missing email is now itself the alarm.

The obvious objection is that a daily email you stop reading is exactly how a real outage gets ignored. Two things make that survivable: the subject line is either *Portafile healthy* or *Portafile DOWN — N checks failing*, so it's a glance and not a read; and I'd rather scan a boring inbox line than trust silence from a job I can't see. Cost is zero — stdlib Python on GitHub's free runners, about 15 seconds a day, no model and no API anywhere in it. Also found that the delete→gate work from yesterday was still sitting on my laptop, never pushed. GitHub had no copy of it. Fixed that in the same push.

**Later that day: my own testing found the delete only half worked, and the reason was a safety rule I'd written on purpose.** I added a custom drink, deleted the shop from the dashboard, and got the signup form back — sitting on top of my shop, with my drink still on the card behind it. Signing up again just put me back into the same shop. The code was doing exactly what I told it to: staff devices got wiped, but an owner's device deliberately kept its recipes so my delete button could never destroy a café's only copy. Defensible on paper. On screen it reads as "the delete did nothing," which is worse than either honest answer.

Changed it: delete now means clean slate on every device, owner included — back to the demo shop, signup form, nothing carried over. That makes it the one button in the whole product that can erase a café's last copy of their recipes, so the confirmation dialog now says that in plain words instead of promising the opposite, and the privacy page says it too (it was telling customers we'd delete "your cloud copy" when we now clear their device as well). Watched it happen in a real browser, not just the tests: shop name back to Demo Espresso Bar, custom drink gone, gate up. The regression suites needed their assertions flipped — one of them would have quietly passed either way, so I made the test rename the shop first, otherwise it was checking nothing.

**The second bug wasn't a bug, and saying so is the fix.** Shops that never turned on Sync show no "delete cloud data" button, and I read that as the dashboard being incomplete. It isn't: those browsers never contact my server at all after their one signup POST, so there's nothing of theirs to delete and no way to reach them. That's the same local-first promise the landing page sells. I could have added a check-in on every app load to make everyone reachable, but that means putting a phone-home into an app whose whole pitch is that your data stays in your browser — for a gate that isn't a password anyway. Instead those rows now say "local only — nothing to delete," so future-me doesn't go looking for a broken button. Deleting their signup record already erases everything I actually hold about them.

Shipped both. Regression pass first — the five suites, plus the marketing site and the dashboard, which no suite had ever covered: 36 of 36 scroll-reveal sections firing, hostile text in a signup row still rendering as plain text, live metrics and signups still loading from production. Then deployed and re-tested against the real site: the deployed app really is the new one, and running the delete against production's own copy gives back the signup form on a clean demo shop. Health check 8/8 before and after. One thing I chose not to redo live: creating a throwaway shop just to delete it for real. The earlier fix already proved that path against production, this change is entirely in the browser, and a real delete leaves a permanently dead shopId behind — not worth littering the store to re-prove the half I'd already watched work.

**Last thing today: I went to fix a security hole and found I'd already fixed it — the stale report was the actual bug.** My notes said the audit's one High finding was still open: every file in my cloud storage was publicly readable, which meant a barista whose link I'd revoked could still walk the storage directly and even recover the *new* link. That's the finding that makes revocation decorative. I sat down to fix it and found it closed three days ago — I'd migrated everything to a private store, copied all 27 files across and checked them byte for byte, then deleted the old public one. The code has said `private` on every read and write since.

What never happened was updating `safetysurface.md`. So for three days the report sat there saying a High finding was open, and every time I picked the project back up, that's what I read. It had already cost me one wrong decision — I'd been treating "share Portafile more widely" as blocked on a security fix that was done. A security report nobody updates is worse than no report, because it spends your attention on the wrong thing and quietly makes you distrust work that's actually finished.

So I re-proved it from scratch instead of trusting either the report or my memory: the old public storage host is gone (404), the live API's private read path answers correctly, all 126 automated checks pass, the founder dashboard still correctly 404s in production, the admin endpoint still refuses an unkeyed request, and the full set of security headers is intact. Then I rewrote the report to say what's true, kept the original findings underneath as history, and left the one honestly-open item on the list: every check so far is my own tooling checking itself, so an independent outside scan is still worth running. **The practical upshot: making this repo public is no longer gated on anything security-related.** Cost of the whole pass: nothing, no service touched.

**A signup appeared that I couldn't place, and it turned out to be me.** One lead record was sitting in the store — "Ethan Test Cafe", from an email I didn't recognise. That's a genuinely bad thirty seconds when you have two customers and no way to tell which of them you're looking at: a real signup is the single most important event this product can produce, and I couldn't tell it from noise.

It was mine, and the proof was already in the repo. The email `o@y.z` exists in exactly one place in the whole codebase — the fixture that seeds the owner's lead record in the delete test — and the shopId attached to it was forty `c`s, which is that same test file's owner shopId. A real one is twenty random bytes, so it can't happen by accident. The record was written at 17:19:26, ninety seconds after I committed the clean-slate delete change and thirty seconds before I committed the line saying I'd verified it live. I was hand-driving production with the test fixtures pasted into localStorage, and the app's "tie this signup to its shop" POST fired for real.

The lesson isn't "clean up after yourself." It's that **my automated suites can't write to production but I can.** The lead POST is deliberately skipped for webdriver browsers, so Playwright never pollutes the store — but that guard does nothing for a human with a real browser doing exactly what a test does. Testing against the live site with fixture values in localStorage writes real records into the founder's store, and there is no field in a lead record that says where it came from: `api/lead.js` stores no IP and no user-agent, on purpose. So attribution is forensics — fixture strings and commit timestamps — not a lookup. What saved me is that the fixtures are distinctive. If I'd typed a plausible email and a plausible café name, I would have had no way at all to know whether my first real signup was real.

Deleted the record through the admin endpoint and confirmed it with three consecutive reads (the store's index lags, so one read proves nothing). The funnel reads zero signups again, which is the honest number. Cost: nothing.

---

## 2026-07-25 — Closed all four security findings, and found out my sync tests were testing a copy of my server

Yesterday's audit left four Medium findings and a written plan for fixing them. All four are now fixed, deployed and checked against the live site, so the security report has nothing open on it for the first time — the thing that had been quietly sitting between me and onboarding more shops. Cost: nothing, on any of it.

**The plan was right about three of the four, and I'm glad I read the code instead of trusting it.** The injection finding pointed at four lines on the dial-in board. Those four lines were real, but the same unescaped values were also being printed in the dial-in *history table* and in the *new-hire training pack* — the thing I hand to a brand-new barista. Same data, same bug, two more places, both live. The reason is worth writing down: dial-in numbers are only numbers when someone types them into the app; when they arrive from the cloud or from an imported backup, nothing checks they're numbers at all. So the root cause isn't "line 485 forgot to escape," it's "every place that displays a dial-in is a sink," and a fix aimed at the line number in the report would have left two of three holes open.

**The one-line fix in the plan would have broken a busy café.** The finding was that anyone can hammer my sync endpoint for free, and the obvious fix reuses the throttle already guarding saves: 120 requests per ten minutes. But reads aren't saves. Every device re-checks the cloud every 30 seconds, and **a whole shop's phones and tablets come from one internet connection**, so they look like one visitor to my server — six devices are already at that 120 limit before anyone has edited anything. Shipping that would have meant the app going quiet mid-rush at exactly the shops using it most, which is a worse outcome than the attack. Reads got their own, much larger budget instead. A security fix that takes the product down during service isn't a fix.

**Then the thing I didn't expect.** Moving the admin key out of the web address (it was being written into server logs on every dashboard refresh) also meant my founder dashboard now sends a custom piece of information with each request — and browsers ask permission first for those. Against the not-yet-deployed server that permission was refused, so the request never left the browser: the dashboard reported the site unreachable, *not* "wrong key." I only know that because I ran it and watched, rather than reasoning about it. If I'd deployed the dashboard and the server separately, I'd have spent the evening debugging a key that was completely fine.

**The real find of the day: my sync tests never touched my sync server.** I have 64 automated checks covering staff links, revoking a barista's access, and the founder delete — the most dangerous code I own. They all pass. It turns out they were passing against a *copy of the server's logic written inside the test file itself*. The actual server code — the thing running in production, handling every café's data — had no test coverage at all. So a mistake in it would sail through a fully green test run, which is worse than having no tests, because green convinces you to stop looking. I wrote one that runs the real thing (swapping in a fake storage layer so it costs nothing and needs no keys), and it found nothing broken — but it now covers the takeover fix, both throttles and the admin key on all four routes. Then I did the part I should always do: I deliberately un-did each fix and re-ran, to watch every new check fail. **A check that has never been seen failing isn't evidence of anything.**

Verified live after deploying, not just locally: created a throwaway shop straight against production, watched it sync back and identify me as its owner, deleted it, saw the link go dead, and confirmed my shop count returned to zero. Fired 600 real requests at the sync endpoint and got a genuine refusal at exactly the limit — which also proved the throttle can actually see who's calling, since if it couldn't, it would have silently done nothing forever. The dashboard loads signups and metrics over the new scheme. And unlike yesterday, none of today's live testing wrote a stray record into my store: I used the command line, not a real browser with test values pasted in.

**One self-inflicted false alarm, worth knowing about.** Right after the 600-request burst, my daily health check reported the site DOWN. It wasn't — the check's canary request was being throttled by the very limiter I'd just installed, because it came from the same internet connection I'd just hammered. The real daily run comes from a different machine and sends one request, so it can never trip it. But for ten minutes I had a red alarm caused entirely by my own testing, and if I hadn't known why, that's exactly the kind of thing that gets a working alarm ignored.

---

## 2026-07-26 — My launch film is telling people something that isn't true anymore

Watched my own launch video today and didn't like the voice. It sounds like a robot because it **is** a robot — I built the narration with the `say` command that ships with every Mac, using its lowest-quality voice at a flat speaking rate. That was the right call at the time (it cost nothing and needed no accounts), but it's the first thing a café owner hears about Portafile, and a synthetic voice undercuts the whole pitch that this was made by a person who actually understands their problem.

**The obvious free fix doesn't exist anymore.** Apple gives away much better neural voices, so the plan was to download one and regenerate — a one-word change. Except my Mac has none installed, and macOS 26 removed the screen you download them from entirely. The dropdown does offer a Siri voice, but Siri isn't reachable from the command line that makes the audio. **And the command lies about it.** Ask `say` for a voice it doesn't have and it doesn't complain — it quietly hands you the default. I only caught it by asking for a deliberately made-up voice name and getting a file byte-for-byte identical to the old one. That's a nasty class of bug: a command that appears to succeed while doing nothing you asked for. So the real fix is the one I should have wanted anyway — record it in my own voice, which for this product is a feature, not a compromise.

**Then the actual find, which has nothing to do with the voice.** The film closes with "No account. No server. No catch." I shipped opt-in cloud sync on July 17, **two days after cutting that video.** So there is a server now, and my launch film has been telling every visitor there isn't one. My website copy was updated honestly at the time ("sync to staff phones only if you choose") — the video was never revisited. That's a false claim sitting on my marketing page for nine days, and it's the reason to re-cut this regardless of how the voice sounds. Worth generalizing: **when a claim changes, it changes in every asset that makes it, not just the one I happened to be editing that day.** Same lesson as the dial-in escaping bug last week, in a completely different medium.

**I also nearly lost the ability to fix any of this.** All the raw material for the film — the screen recordings, the title cards, the original narration script — was sitting in a scratch folder that gets cleaned up without warning. One cleanup and the only options would have been "keep the robot voice" or "rebuild the entire film from zero." Copied into the repo, in a folder that deliberately doesn't publish to the live site. Free, four megabytes, and it means the film is now editable instead of frozen.

Rewrote the narration for a human read while I was in there: ten beats instead of eight, because the money moment was fifteen seconds of unbroken speech, and cut the tics that made the script read as machine-written even before a machine read it aloud — every scene ending on a slogan, lists of three everywhere. Nothing is deployed. The recording is the part I have to do myself and I'm doing it later; there's a handoff written so I don't have to re-derive any of this.

---

## Open threads

- **The launch film says "No server" and that's false.** Sync shipped 2026-07-17, the film was cut 07-15. Fixing it needs me to record the new narration in my own voice — script and instructions are in `video-src/script-v2.md`, full context in `video-src/HANDOFF.md`. Until then a false claim is live on the site. Also: `video-src/` isn't committed yet, and it's the only non-temporary copy of the film's source material.
- **The store is empty.** I deleted both founding shops while testing this. Those shopIds are dead forever — re-syncing makes a brand-new shop. Note the rule changed as of 2026-07-24: a delete now wipes the owner's device too, so anyone I delete from here on loses their local recipes unless they exported a backup first. Worth a message to whoever was on the second one.
- Neither founding shop had a signup record, so onboarding time and cafe names stayed blank. Either walk the next owner through the signup form on their own device, or accept the metric only covers shops that arrive on their own. As of 2026-07-24 the `leads/` store is empty too, so **the next lead record that appears is either a real signup or my own testing — and I should assume it's real until the fixtures say otherwise.**
- Post-launch validation with kill criteria (from `BUILD-LOG.md`) hasn't run yet.
- **Independent outside security scan.** Everything verified so far is my own tooling checking my own app. securityheaders.com and an OWASP ZAP baseline run against the live URL are both free and neither needs an account. Not blocking anything. (As of 2026-07-25 this is the *only* unticked security item — all four findings from the re-audit are closed and live.)
- **Someone who uses the in-app feedback button can't have their data erased.** Feedback can carry an email address, and unlike signups there's no delete path for it anywhere — the audit's one remaining Low finding. It's a promise-shaped gap rather than a hole: I'd have to fix it by hand today if anyone asked.
- **My own tests can lie in a specific way, and I've only fixed half of it.** The sync suite tests a hand-written copy of the server that lives inside the test file, so the two can drift apart silently — the copy could stay right while the real server goes wrong, or vice versa. There's now a suite that runs the real handlers, but the mirror is still there and nothing forces the two to agree. Worth remembering before trusting a green sync run again.
- Roaster white-label channel is a plan, not a conversation with a roaster.

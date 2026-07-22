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

---

## Open threads

- Two founding shops to onboard — the first real users.
- Post-launch validation with kill criteria (from `BUILD-LOG.md`) hasn't run yet.
- Roaster white-label channel is a plan, not a conversation with a roaster.

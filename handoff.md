# HANDOFF — Portafile speaks European Portuguese and prices in euros

**Written 2026-07-26.** Project: `/Users/ethanyap/portafile`. Owner: Ethan (learning developer).
You are picking this up cold. Every fact below was checked by a command in the session that wrote
this file, unless labelled otherwise.

> **This file replaces the 2026-07-23 handoff** about the founder's "delete cloud data" bug. That
> work is **finished, deployed and live** — do not rebuild it. Its still-true warnings are carried
> forward here in §5, §8 and §9; nothing hard-won was thrown away.
>
> **Do not confuse this with `.handoff`** (the dotfile in this same directory). That is a *third*,
> also-resolved handoff from 2026-07-25 about four security fixes, marked ✅ RESOLVED at the top.
> Leave it alone. `handoff.md` — this file — is the live one.

---

## 1. TL;DR

Portafile's app and marketing site now work in European Portuguese (pt-PT) with euro pricing,
because Ethan's first two test clients are cafés in Lisbon.

- **The work is finished and verified.** 267 automated checks pass, 0 failures. Do not rebuild any
  of it and do not re-run the whole sweep "to be sure" unless something changed.
- **Nothing is committed. Nothing is deployed.** The working tree is dirty on `main`. Production
  still serves the old English-only site — confirmed by HTTP probe, not remembered.
- **Ethan opened the new chat to answer three open questions and possibly deploy.** They are in §4.
  **Ask him. Do not decide any of them yourself.**
- The English app is deliberately, verifiably unchanged: same 15 drinks, same "Demo Espresso Bar",
  same dollars, same °F. That was the main regression risk and it is covered by tests.

---

## 2. What was accomplished

**The ask.** Ethan said: *"the first two test clients are from portugal… in order for the two
testers to work i need it in euros and in lisbon portugese."* From an explicit menu he chose:
everything translated (app + landing + privacy + terms), a real EN/PT switch (not Portuguese-only),
metric units, and a Portuguese demo shop.

**The reframing that is invisible in the diff.** An early estimate said there were "91 hardcoded
`$`". That was wrong and was corrected mid-session — most were the jQuery-style `$()` selector
shorthand, not currency. Currency lived in exactly **one** function, so euros were nearly free. The
real work was everything that is *not* a string:

- **The demo seed had to become a different product, not a translation.** A Lisbon café menu is
  café, café duplo, abatanado, pingado, garoto, meia de leite, galão — not Latte and Cold Brew.
  19 Portuguese drinks, 14 ingredients, Lisbon prices, millilitres and °C.
- **A domain error that looked exactly like an arithmetic bug.** The first pass priced a €1.00
  espresso with a paper cup in it → 54% cost → every traditional drink red, i.e. a demo that looks
  like a café losing money on coffee. In Portugal a café is drunk at the counter in **porcelain**;
  there is no cup to buy. Traditional drinks now carry a €0.02 `Louça (lavagem)` (dishwashing) line
  and only takeaway/iced drinks carry packaging. Espresso now reads 18%, while Mocha, Cold Brew,
  Chai and hot chocolate are genuinely over the 30% target — which is the product doing its job.
- **Founder metrics would have silently lied.** `api/metrics.js` infers adoption by diffing a shop
  against the demo seed. A second seed meant every Portuguese shop read as "customised" the instant
  it opened → 100% adoption, no error, a dashboard confidently wrong about the only two customers
  Ethan has. Fixed by turning the `DEMO` constant into a `DEMOS` array holding both seeds.

**Two pre-existing problems fixed on the way past:**

1. **A live 404.** `site/index.html`'s FAQ linked the privacy policy as `privacy.html` (relative).
   That resolves at `/site/index.html` and **404s at `/`**, the canonical URL everyone actually
   uses. Verified against production. Every URL on both landing pages is absolute now.
2. **A 1%-flaky test this session introduced and then caught** — see §5, first bullet.

**Road not taken — do not redo these explorations:**

- *A single landing page with JS-swapped text* was rejected in favour of a separate
  `site/pt/index.html`. Reason: ~120 `data-i18n` attributes plus a dictionary is a bigger, riskier
  diff than a copy; it flashes English before swapping; it gives the wrong `<html lang>` until JS
  runs; and it would have meant touching the `reveal.js` scroll-animation CSS that `CLAUDE.md`
  explicitly warns about.
- *Duplicating the CSS* into the PT page was also rejected — the 150-line `<style>` block was
  extracted to `site/site.css` and both pages link it, so branding is edited once, not twice.
- *An i18n library or a build step* was never on the table; this repo has no build step by design.
- *Inventing euro prices for the paid tiers* was deliberately NOT done — that is open question B.

---

## 3. Verified state

Re-checked by command immediately before this file was written.

| Fact | Value | How known |
|---|---|---|
| Repo | `/Users/ethanyap/portafile` | — |
| Branch / last commit | `main` / `552bde3` ("Rescue the launch film's source assets…") | `git log` |
| Working tree | **Dirty. Nothing committed this session.** 13 modified, 7 untracked (one of those, `.handoff`, is pre-existing and not from this session) | `git status` |
| Production | `https://portafile.vercel.app/` → **200** | HTTP probe |
| `/pt` in production | **404 — not deployed** | HTTP probe |
| `/site/site.css` in production | **404 — not deployed** | HTTP probe |
| `/product/i18n.js` in production | **404 — not deployed** | HTTP probe |
| `/site/pt/privacy.html` in production | **404 — not deployed** | HTTP probe |
| `/privacy.html` in production | 404 — the **pre-existing live bug**, fixed locally, not yet deployed | HTTP probe |
| Deploy command | `vercel deploy --prod --yes` from repo root. **`git push` does NOT deploy**, despite `vercel git connect` | `CLAUDE.md` |
| Founder dashboard | `http://localhost:4322/admin/dashboard.html` → **200**, served by a LaunchAgent. Intentionally never deployed; `health_check.py` asserts it 404s in production | HTTP probe |
| Admin key | `.admin-key` present locally, gitignored. **Never echo its contents** | file exists |
| Blob token | `.env.local` present locally, gitignored | file exists |
| Pinned Playwright | present at `~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright` | dir exists |
| Local test server | none running; port 8899 free | `lsof` |
| Disk | 24 GB free of 228 GB (getting tight — see §9.1 for the right way to check) | `df -h /` |
| **Cost of everything added** | **$0.** Static files on the existing free Vercel tier. No new service, no new account, no new dependency, no new external request. Ethan treats "probably free" as a bug — this is certain | by construction |
| Blob store contents | Reported **empty** (`shops/` 0, `leads/` 0, `feedback/` 0) as of 2026-07-24. **Not re-verified this session** — checking costs an authenticated production call, which wasn't needed for this work | carried forward, unverified |

### Test suites — 267 checks, 0 failures

Run from the repo root. Counts are what they printed on the final sweep.

| Command | Checks | Needs |
|---|---|---|
| `node verify-i18n.mjs` | 15 | nothing |
| `node verify-metrics.mjs` | 33 | nothing |
| `node verify-api.mjs` | 27 | nothing |
| `node product/verify.js` | 11 (+ an in-page selftest of 27) | Playwright |
| `node product/verify-killpass.js` | 16 | Playwright |
| `node product/verify-gate.js` | 11 | Playwright |
| `node product/verify-sync.js` | 64 | Playwright |
| `node verify-pt.js` | 53 | Playwright |
| `node verify-site.js` | 37 | Playwright **and** `python3 -m http.server 8899` running in the repo root first |

`verify-sync.js` takes over a minute — don't kill it early and read that as a failure. Several
suites print lines containing the words "failed" or "failure" as part of **passing** negative tests
(`lead admin auth failed`, `A: offline badge on API failure`); grep for `^FAIL`, not for "fail".

### Files

**New (8):** `product/i18n.js` (pt-PT dictionary, 217 translations) · `site/site.css` (shared
landing stylesheet) · `site/pt/index.html`, `site/pt/privacy.html`, `site/pt/terms.html` ·
`verify-i18n.mjs` · `verify-pt.js` · `verify-site.js`. The three root-level `verify-*` files are
kept off the deployment by `.vercelignore`'s leading `/*`.

**Modified (13):** `product/app.js` (two seeds, `t()` throughout, language picker, extended
selftest) · `product/index.html` (loads `i18n.js` **before** `app.js`; adds `#langSel`) ·
`site/index.html` (CSS extracted out, all URLs absolute, PT link) · `site/privacy.html`,
`site/terms.html` (PT links) · `vercel.json` (`/pt` and `/pt/` rewrites) · `api/metrics.js`
(`DEMOS`) · `verify-metrics.mjs` · `health_check.py` (4 new probes, now 12 checks) ·
`CLAUDE.md`, `WORKS.md`, `PROGRESS.md`, and this `handoff.md`.

`.handoff` (untracked) is **not** from this session — see the note at the top of this file.

---

## 4. The decisions that are Ethan's, not yours

He opened the new chat specifically to answer these. Present them, take his answers, then act.
**Do not pick for him.**

**A. Deploy, and commit?** Everything is built and verified locally; nothing is live. Note that
**he runs deploys and pushes himself**, typing the command with a `!` prefix in the session — a
previous session recorded that the agent's own deploy/push commands were blocked. So offer him the
exact command rather than running it. Commit and deploy are *separate* approvals: "yes deploy" is
not "yes commit". The repo's standing rule in `CLAUDE.md` is to run `/still-works` before any
deploy — see the honesty note at the end of §5 about what was and wasn't run this session.

**B. Currency on the paid tiers of the `/pt` page.** The Local tier shows `0 €`. The Shop and
Roaster tiers still show `$29/mo`, `$199/yr`, `$149/mo` and the `$99` founding price, with a line
in the Portuguese copy saying the paid tiers are in US dollars and the euro price will be set
before those plans launch. Deliberate: converting would invent a price he has never set, and that
is a pricing decision, not a translation one. **Ask what the euro prices should be, or whether to
leave it.**

**C. GDPR.** His first two customers are in the EU. The privacy policy and terms are governed by
California law and do not address GDPR obligations (lawful basis, data-subject access and erasure
requests, an EU representative). The Portuguese legal pages are labelled as translations with the
English version prevailing — standard practice, and it buys time, but it **is not compliance**.
This was flagged, not solved, and it matters more once money changes hands. **Ask how he wants to
handle it; do not draft legal text unprompted.**

---

## 5. Gotchas

**The one that actually bit this session, first:**

- **Never pattern-match over `JSON.stringify(seed())`.** A new selftest asserted the Portuguese seed
  contains no imperial units by regexing the serialised shop. That includes the randomly generated
  `uid()`s, and a base-36 id ending in a digit + `oz` (`yykz6oz`, `33o68oz`) matches `\d\s*oz\b`
  against the closing quote. **Measured false-failure rate: 0.99% per selftest run** — it appeared
  once in a full sweep and vanished on re-run, the worst possible frequency, because it teaches you
  the suite is flaky rather than that the code is wrong. It now scans only human-authored fields;
  200 consecutive runs, 0 failures. **If any suite ever fails once and passes on retry, measure the
  rate before dismissing it.**

New from this session:

- **The English string IS the dictionary key** (`product/i18n.js`, gettext-style). A missing
  translation silently renders readable English — that is the design, and it is also why mistakes
  are invisible. Two consequences: (1) editing an English string in `app.js` orphans its translation
  with no error; (2) one English word needing two Portuguese words collides on one key, and a
  duplicate key in a JS object literal **silently keeps only the last value**. That really happened
  with "Roaster" (the company on the bean form vs. a person in the signup role list). Disambiguate
  as `t('Roaster|role')` — the `|context` suffix is stripped from the English fallback only.
  **`node verify-i18n.mjs` is the only thing that catches any of this.**
- **`product/i18n.js` must load before `app.js`** in `product/index.html` (it does, lines 46–47).
  `app.js` calls `t()` during its first render, so a missing `i18n.js` is not a degraded translation
  — it is a **blank app**. `health_check.py` now probes that file directly, because the existing
  "App shell" probe would still pass.
- **Adding a language means editing `api/metrics.js`.** Its `DEMOS` array is a hand-copied list of
  every seed's shop name and recipe/ingredient counts. A seed missing from it makes every shop in
  that language read as adopted on first open. `verify-metrics.mjs` covers both seeds.
- **Language lives in `S.shop.lang`, so it SYNCS** to staff devices — the owner sets it once and the
  baristas' phones follow on the next poll. The default is browser detection, which is why every
  pre-existing Playwright suite (en-US) still passes untouched.
- **Signup role `<option value>`s stay English while the labels translate.** The value is POSTed to
  `/api/lead` and counted in founder metrics; translating it would split "Owner" and "Proprietário".
- **`site/site.css` is shared by `/` and `/pt`.** If it 404s, both pages return 200 with all their
  text and render completely unstyled — which a body-text health check would pass, hence the direct
  probe. The only English baked into it is the mock card's `content:"4×6 · PRINTS CLEAN"`,
  overridden by `html[lang="pt-PT"] .mockcard::after`.

Carried forward and still true:

- **`CLAUDE.md` in this repo is the real gotcha list — read it fully before editing `api/state.js`.**
  The eventual-consistency rules ("never build an authorization check on a read", "revocation is a
  value comparison, never a missing blob", "a 404 never means revoked") were expensive to learn and
  are not negotiable. Corollary added later: don't build the *client's* identity check on a
  server-side value that a flaky read can erase either.
- **Vercel Blob is eventually consistent.** `list()` lags writes and deletes by seconds — fine for
  counting, never for resolving a known path or deciding authorization.
- **Relative URLs on the landing pages 404 at `/`** because root is a rewrite — and `/pt` is now a
  **second** rewrite with exactly the same hazard. Everything is absolute now; don't reintroduce one.
- **CSP blocks all inline `<script>` on deployed pages.** `admin/dashboard.html` uses inline script
  and `onclick=` and is safe only because it never deploys. Never move that pattern into `site/` or
  `product/`.
- **`.vercelignore` publishes only `site/`, `product/`, `video/`, `api/`, `vercel.json`,
  `package.json`.** A new top-level directory silently does not deploy.
- **`vercel.json` pins CORS to the prod origin except under `/api/`** — the localhost:4322 dashboard
  depends on that exception.
- **Dial-in values are not guaranteed to be numbers** (only `parseFloat`'d when typed locally; a
  synced or imported shop can hold any string). They render through `dec()`, which formats only
  genuinely finite values and passes everything else through untouched. Always `esc(dec(x))`, never
  `dec(esc(x))`. `verify-killpass.js` covers the hostile case — re-run it after touching any
  dial-in render site.
- **Never run bare `npx playwright ...`.** The suites `require()` Playwright from a pinned npx cache
  path; any bare `npx playwright` command silently upgrades that cache and breaks every suite with
  "Executable doesn't exist", which looks like broken tests rather than a broken toolchain. Fix:
  `npx playwright install chromium`.
- **Playwright `addInitScript` re-runs on every navigation**, restoring a seed the test just wiped;
  `verify-sync.js` guards this with `pf-test-stopseed`.
- **Headless Chromium reports every tab as `visible`**, and `page.bringToFront()` doesn't change it.
- **`#shopName` saves on `change`, not `input`.** A test that fires `input` quietly "passes".
- **The feedback modal opens from `#btnHelp` → `#hFeedback`**, not a top-level button.
- **`health_check.py` runs daily at 15:00 UTC** and emails him **every run, pass or fail** — so a
  missing email is itself the alarm. If you change page copy, update its expected marker strings or
  he gets a false alarm.

**Honesty note on verification.** The `/still-works` skill was **not** invoked as a skill this
session. What was done instead: all 9 suites run to green, two purpose-written browser suites
(`verify-pt.js`, `verify-site.js`), a 200-run flake hunt, and visual screenshot review of the PT app
and both landing pages. `WORKS.md` was updated by hand with the new feature checks and
blast-radius entries. If Ethan wants the skill's own process run before deploying, that has not
happened.

**Not verified, and cannot be locally:** the `/pt` and `/pt/` rewrites in `vercel.json` only take
effect in production; locally the pages were tested at `/site/pt/index.html`. **After any deploy,
the first thing to check is that `https://portafile.vercel.app/pt` returns 200**, along with
`/site/site.css`, `/product/i18n.js` and `/site/pt/privacy.html`. `python3 health_check.py` covers
all four.

---

## 6. Reboot / persistence

Nothing here depends on a running process. All work is files on disk in
`/Users/ethanyap/portafile`; a reboot loses nothing. Test screenshots go to a system temp directory
and are disposable.

**The weak link is that nothing is committed.** 12 modified and 5 new files exist only in the
working tree.

---

## 7. Don't redo

- The translation, the Portuguese seed, the PT landing and legal pages — done and tested.
- The Lisbon pricing model (porcelain vs. paper cup). Written up in `PROGRESS.md` and `CLAUDE.md`.
- The whole verification sweep, unless something changed. It was green.
- Don't "fix" the English demo shop — it is intentionally unchanged (15 drinks, dollars, °F).
- Don't convert the paid tiers to euros on your own initiative — open question B.
- Don't touch `.handoff` (the resolved 2026-07-25 security handoff).
- `BUILD-LOG.md` is frozen — never edit it.
- **Don't add a phone-home** to reach browsers that never synced. A browser that never turned on
  sync, or already went local-only after an earlier delete, cannot be reached by anything the
  founder presses. That is a property of a no-accounts product, not a bug. Ethan has repeatedly
  chosen dropping a metric over tracking a user.

---

## 8. How to work with Ethan (durable)

College student, learning developer. Not fluent in git, terminals or deployment, but learning —
teach while doing. Typos are common; infer intent and proceed rather than asking about an obvious one.

- **Zero cost, always.** Cost questions get certainty, never "probably free" — name every service
  and whether it can ever bill him.
- **Terminal steps: numbered, ONE command per step**, say what he should see, then wait for his
  confirmation or screenshot before the next.
- **He runs deploys and pushes himself**, typing the command with a `!` prefix in the session.
- **Verify before saying done** — exercise the real feature, not just the tests. He asks for this
  explicitly and notices when it is skipped.
- **Lead with the outcome.** Short replies ("yes", "proceed", "yes push") mean: do exactly the
  pending step, nothing more.
- **Deploys, deletes and anything outward-facing: confirm first.** Approval is scoped to that one
  action, not to future ones.
- **Ponytail mode is on**: smallest solution that works, deliberate shortcuts marked with a
  `ponytail:` comment naming the ceiling and the upgrade path.
- **`PROGRESS.md` is required.** At the end of any session that changed something real, append or
  extend that day's entry, unprompted, written for a founder (what shipped, why it mattered to the
  business, what broke and what it taught). One `##` per date, newest at the bottom, "Open threads"
  kept current. Today's 2026-07-26 entry is already written — **extend it, don't add a second
  heading for the same date.**
- **After a milestone**, also update the repo `CLAUDE.md` gotchas and the auto-memory at
  `~/.claude/projects/-Users-ethanyap-portafile/memory/` (both already updated for this session).

---

## 9. Machine-level warnings (these outlive this task — do not drop them)

1. **Never trust System Settings → Storage for free space** — it counts iCloud-purgeable files and
   has been wrong by ~50 GB. Use `df -h /`. Currently 24 GB free of 228 GB.
2. **Do not touch the `flowise-main` or `open-webui` Docker containers.** Verified running right
   now, and `http://localhost:3010` answers 200 — that is a **separate live project** of his.
3. `Docker.raw` is ~13 GB and does not shrink on prune.
4. **Do not touch `~/Library/Application Support/Claude/vm_bundles`** (~6.8 GB) — Claude Desktop's VM.
5. **Never suggest "Keep Messages: 1 Year"** — it permanently deletes messages across all his devices.
6. Claude Code dies when Wi-Fi drops (`ENOTFOUND`). For an offline test, hand him ONE self-contained
   checklist he can run unattended.
7. `~/Desktop/Claude Projects/` holds **stale 2026-06-27 backups** — never edit them (only
   travel-planner there is live).
8. Before any task touching Flowise, LaunchAgents, travel-planner deploys, or multi-project audits,
   read `~/wargame_master.md` and follow it instead of improvising.

---

## 10. The next task

**Ethan stated it explicitly:** *"I will answer these questions and perhaps deploy in new chat."*

Present the three open questions in §4 (deploy+commit / paid-tier currency / GDPR), take his
answers, and act on them. If he greenlights a deploy:

1. Ask whether to commit first, and with what message.
2. Give him `vercel deploy --prod --yes` to run from the repo root with a `!` prefix — **only on
   his explicit go-ahead**, and remember `git push` does not deploy this project.
3. Immediately after: `python3 health_check.py`, and confirm `https://portafile.vercel.app/pt`,
   `/site/site.css`, `/product/i18n.js` and `/site/pt/privacy.html` all return 200, and that the
   landing page's FAQ privacy link now resolves instead of 404ing.
4. Then extend today's `PROGRESS.md` entry with what actually shipped.

Two things worth raising with him unprompted if they come up:

- The Portuguese cost figures in the demo seed are **estimates of Lisbon wholesale prices**, not
  quoted numbers. They are a starting point a real owner overwrites — don't quote them back to
  anyone as market data.
- The launch film is English-only and still claims "No server", which has been false since sync
  shipped 2026-07-17. The `/pt` page labels the film "(em inglês)", which is honest but not a fix.
  That remains an open thread in `PROGRESS.md`.

**Do not pick answers for him.**

# Portafile

Coffee-shop recipe-card + costing app (recipes with live cost/margin, dial-in board, printable new-hire packs). Static HTML/CSS/JS, no framework, no build step.

## Live deployment
- https://portafile.vercel.app — root rewrites to `/site/`, app at `/product/` (Vercel project `ethan16/portafile`).
- Deploy: `vercel deploy --prod --yes` from repo root. **git push does NOT auto-deploy** despite `vercel git connect`.
- Secrets: ADMIN_KEY in Vercel prod env, local copy in gitignored `.admin-key`; Blob token in `.env.local`.

## Layout
- `site/` — marketing landing (+ privacy/terms, `reveal.js` scroll animations, `assets/` screenshots)
- `product/` — the app (localStorage data, `verify-*.js` check suites)
- `admin/` — founder dashboard, **intentionally not deployed** (no auth); served locally on :4322 by LaunchAgent
- `api/` — Vercel functions (Blob sync, signups)
- `brand/brand.css` — palette + type tokens, single source of truth

## Local run
`python3 -m http.server <port>` from repo root, open `/site/index.html`. Verify suites: `node product/verify*.js`.

## Gotchas
- Root `/` is a REWRITE of /site/index.html — relative URLs in that page resolve against `/` in production and 404 (only `/assets/:file` has a rewrite). Any new script/asset reference must be absolute (`/site/...`). Bit us: `src="reveal.js"` → silent 404 at root, no animations.
- CSP (vercel.json) blocks ALL inline `<script>` — page JS must be external same-origin files. Inline `style=` attrs are allowed.
- `.vercelignore` publishes ONLY site/product/video — adding a new top-level dir won't deploy without editing it.
- Zero external requests by design: system fonts only, no CDNs; keep it that way.
- CORS: vercel.json pins `Access-Control-Allow-Origin` to the prod origin on everything EXCEPT `/api/` — `api/lead.js` must keep `*` or the localhost:4322 dashboard's "Fetch signups" breaks.
- Site scroll-reveal: hiding styles are gated behind a JS-added `.js` class at zero specificity (`:where()`) — don't raise their specificity or components lose their transforms (see ~/.ai/patterns/scroll-reveal-static-site.md).
- Headless-Chrome screenshot verification: old headless clamps width to ~500px (fake mobile overflow — test narrow widths via iframe) and virtual-time freezes transitions (blank reveals — use `--headless=new` or `--force-prefers-reduced-motion`).
- Access gate skips webdriver browsers by design, so verify suites pass it; a real barista hits the gate once per browser.
- Sync writes carry a `ts` stamp; `api/state.js` 409s any PUT older than the stored blob (client reacts by pulling). Clients never push before their first successful pull — protects a real cloud copy from a freshly-reseeded browser. Before overwriting local state, the client snapshots it to `portafile.v1.presync`.
- Three-part key model: data lives at `shops/<shopId>.json`, reached only via pointer `keys/<shareKey>.json` (the `?k=` link, rotatable); `owners/<shopId>.json` holds a sha256 of the owner token (`x-portafile-owner` header, localStorage `portafile.v1.owner` — never in a URL). A 404 on an unknown key must CREATE NOTHING — the client only seeds the cloud when it holds an owner token; that rule is what makes "Reset staff link" real revocation. Legacy shop `187cdea…` has a pointer (same string as its shopId) but deliberately NO owners/ record — its link can't rotate, per Ethan.
- Revoking is a HARD kill: a staff device that gets 404 `unknown-key` wipes every `portafile.v1*` key, sets `portafile.v1.revoked`, and shows a lock screen that survives reload (opening a different link clears it). Three guards make that safe, don't remove any: (1) only the exact body `{error:'unknown-key'}` triggers it — any other 404 is treated as a hiccup; (2) it only fires when `portafile.v1.synced` equals the current key, so clicking a stale link can't destroy someone's own local shop; (3) owner-token devices are never wiped or locked. Matching server rule: `readJson()` returns null ONLY when a blob is absent and THROWS on a failed fetch — if it swallowed errors, one Blob hiccup would read as "pointer missing" and wipe every staff device.
- **Vercel Blob is eventually consistent — never build an authorization check on a read.** Measured, not assumed: back-to-back reads of the same existing path returned found then null; reads after an overwrite returned the PREVIOUS value for up to several seconds; `list()` lags both writes and deletes. So: (1) revocation is a VALUE comparison, never a missing blob — pointers are never deleted, a link is dead when `k !== owners.currentKey`, answered as **410 revoked**; (2) a 404 never means revoked (a flaky read produces one), so the client only wipes on 410, and only after TWO of them; (3) the one place absence would grant authority — claiming a shopId — uses `put(..., {allowOverwrite:false})`, the store's only atomic check, instead of read-then-write; (4) use `get(path,{access:'public',useCache:false})` and `del(path)` by pathname, never `list()`, for exact-path work. Consequence to state honestly: revocation takes a few seconds to take effect, which is fine for firing a barista and is NOT a strong real-time guarantee.
- Rotate order is: write the new pointer, then flip `owners.currentKey`. That flip IS the revocation, so a half-failure leaves the old link working and returns an error, rather than telling the owner a live link is dead. Owner devices never wipe or lock and get a settle-and-retry on 410; a rotate also pauses the owner's own sync ~2.5s so the consistency window can't look like a lockout.
- The revocation wipe clears every `portafile.v1*` key EXCEPT `portafile.v1.lead*` — the signup record is not a credential, and clearing it makes the user re-fill the access gate and writes a DUPLICATE lead blob into the founder's store. That shipped once; there's a test for it now.

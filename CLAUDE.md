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

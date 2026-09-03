#!/usr/bin/env python3
"""Run: python3 test_serve_dashboard.py  — must pass before this goes on the tailnet."""
from serve_dashboard import blocked

MUST_REFUSE = [
    "/.env.local", "/.admin-key", "/.DS_Store",
    "/.git/config", "/.vercel/project.json", "/.claude/settings.json",
    "/node_modules/foo/index.js", "/__pycache__/x.pyc",
    "/site/../.env.local",              # climbing back out
    "/%2Eenv.local", "/.%67it/config",  # percent-encoded dot and g
    "/serve.log", "/id_rsa.pem",
]
MUST_SERVE = [
    "/site/index.html", "/site/assets/x.png", "/product/app.js",
    "/README.md", "/", "/site/",
]

bad = [p for p in MUST_REFUSE if not blocked(p)] + \
      [p for p in MUST_SERVE if blocked(p)]

if bad:
    raise SystemExit("FAIL — wrong answer for: " + ", ".join(bad))
print(f"ok — {len(MUST_REFUSE)} refused, {len(MUST_SERVE)} served")

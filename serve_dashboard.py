#!/usr/bin/env python3
"""Static server for the portafile dashboard.

`python3 -m http.server` served this whole folder, .env.local and .admin-key
included. Anything that is not part of the site is refused here, by path,
before the file is ever opened.
"""
import html
import io
import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
PORT = 4322

# whole directories that are never part of the site
DENY_DIRS = {".git", ".vercel", ".claude", ".github", ".impeccable",
             "node_modules", "__pycache__", "handoff-archive"}

DENY_EXT = re.compile(r"\.(pem|key|sqlite|db|log|env|local)$", re.I)


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        return str(ROOT / clean(path))

    def send_head(self):
        if blocked(self.path):
            self.send_error(403, "not part of the site")
            return None
        return super().send_head()

    def list_directory(self, path):
        # the stock listing would advertise every name it then refuses
        names = sorted(n for n in os.listdir(path) if not blocked("/" + n))
        rows = "".join(
            f'<li><a href="{html.escape(n, quote=True)}">{html.escape(n)}</a></li>'
            for n in names
        )
        body = f"<h1>{html.escape(self.path)}</h1><ul>{rows}</ul>".encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return io.BytesIO(body)


def clean(path):
    """Path under ROOT, with anything that could climb out of it removed."""
    p = unquote(urlparse(path).path).lstrip("/")
    return "/".join(x for x in p.split("/") if x not in ("", ".", ".."))


def blocked(path):
    parts = clean(path).split("/")
    if any(p.startswith(".") for p in parts):      # .env.local, .admin-key, .DS_Store
        return True
    if any(p in DENY_DIRS for p in parts):
        return True
    return bool(DENY_EXT.search(parts[-1]))


if __name__ == "__main__":
    print(f"portafile on http://127.0.0.1:{PORT} (dotfiles and build dirs refused)")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()

"""Crema site health check — run daily by .github/workflows/health.yml.

Probes the live site the way a real visitor does (plain HTTPS, no credentials) and
emails the operator the result every run, pass or fail. Stdlib only: urllib + smtplib,
so the workflow needs no pip install and nothing can drift or cost money.

  python3 health_check.py            # check + email the result, pass or fail
  python3 health_check.py --dry-run  # check + print, never email; exit 1 if broken

Needs GMAIL_ADDRESS + GMAIL_APP_PASSWORD (same 16-char app password reg-diff-engine
uses) in the environment. Reads them from a local .env line as a fallback.
"""
import os, smtplib, ssl, sys, time, urllib.error, urllib.request
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

BASE = os.environ.get("BASE_URL", "https://portafile.vercel.app")
TO = "ethankw.yap@gmail.com"
TIMEOUT = 20
RETRY_AFTER = 20  # seconds — a single blip is not an outage (learned on reg-diff-engine)

# (label, path, expected status, expected text in body or None)
CHECKS = [
    ("Landing page",        "/",                        200, "Crema"),
    ("Privacy page",        "/site/privacy.html",       200, "Privacy"),
    # The landing pages' CSS lives in one shared file now. If it 404s the page still returns 200
    # with all its text, so only a direct check catches it — an unstyled site looks broken to a
    # visitor but passes a body-text assertion.
    ("Landing stylesheet",  "/site/site.css",           200, "--crema:"),
    # Portuguese landing page, reached through a rewrite like "/" is. Guards both the rewrite and
    # .vercelignore: a new directory under site/ that fails to publish would 404 silently.
    ("Portuguese landing",  "/pt",                      200, "afinado"),
    ("Portuguese privacy",  "/site/pt/privacy.html",    200, "Privacidade"),
    ("App shell",           "/product/",                200, 'src="app.js"'),
    ("App code",            "/product/app.js",          200, "portafile.v1"),
    # app.js calls t() during its first render, so a missing i18n.js is not a degraded
    # translation — it is a blank app. The shell check above would still pass.
    ("App translations",    "/product/i18n.js",         200, "Receitas"),
    # An unknown key must 404 with unknown-key. Proves the serverless function runs AND
    # can read the private Blob store — a dead store throws and turns this into a 500.
    ("Sync API + Blob",     "/api/state?k=" + "0" * 40, 404, "unknown-key"),
    # Founder metrics must stay admin-only: an unauthenticated GET has to be refused, never served.
    ("Metrics API locked",  "/api/metrics",             401, "unauthorized"),
    # Load-bearing invariant: admin/ has no auth, so it must never be deployed.
    ("Admin NOT deployed",  "/admin/dashboard.html",    404, None),
]


def fetch(path):
    """GET a path. Returns (status, body, headers). Network errors become status 0."""
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "portafile-healthcheck"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.status, r.read().decode("utf-8", "replace"), dict(r.headers)
    except urllib.error.HTTPError as e:  # 4xx/5xx are answers, not failures
        return e.code, e.read().decode("utf-8", "replace"), dict(e.headers)
    except Exception as e:
        return 0, f"{type(e).__name__}: {e}", {}


def run_checks():
    """Returns (results, seconds) where each result is (ok, label, detail)."""
    results, t0 = [], time.monotonic()
    for label, path, want_status, want_text in CHECKS:
        status, body, headers = fetch(path)
        if status != want_status:
            results.append((False, label, f"{path} → HTTP {status or 'no response'} (expected {want_status})"))
        elif want_text and want_text not in body:
            results.append((False, label, f"{path} → {status} but missing {want_text!r} (page changed?)"))
        else:
            results.append((True, label, f"{path} → {status}"))
        if path == "/":  # security headers ride along with the landing-page fetch
            csp = headers.get("Content-Security-Policy")
            results.append((bool(csp), "Security headers",
                            "CSP present" if csp else "Content-Security-Policy header MISSING"))
    return results, time.monotonic() - t0


def check(retry=True):
    """Run every check; anything that fails gets one retry before we call it broken."""
    results, secs = run_checks()
    if retry and any(not ok for ok, _, _ in results):
        time.sleep(RETRY_AFTER)
        second, secs2 = run_checks()
        healed = [r[1] for r, s in zip(results, second) if not r[0] and s[0]]
        results, secs = second, secs2
        for name in healed:  # passed on retry — worth knowing, not worth an alarm
            results.append((True, f"{name} (blipped, OK on retry)", "recovered within 20s"))
    return results, secs


def report(results, secs):
    failures = [r for r in results if not r[0]]
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    head = (f"{len(results) - len(failures)}/{len(results)} checks passed  ·  {secs:.1f}s  ·  {stamp}\n"
            f"{BASE}\n")
    lines = [("  FAIL  " if not ok else "  ok    ") + f"{label}: {detail}" for ok, label, detail in results]
    body = head + "\n" + "\n".join(lines) + "\n"
    if failures:
        subject = f"Crema DOWN — {len(failures)} check{'s' if len(failures) > 1 else ''} failing"
        body += ("\nWhat to do: open https://portafile.vercel.app in a browser, then check the Vercel\n"
                 "dashboard (Deployments → latest → Runtime Logs). Re-run this check any time from\n"
                 "GitHub → Actions → Site health check → Run workflow.\n")
    else:
        subject = "Crema healthy — everything is running fine"
    return subject, body, failures


def cred(name):
    if os.environ.get(name):
        return os.environ[name]
    envf = Path(__file__).resolve().parent / ".env"
    if envf.exists():
        for line in envf.read_text().splitlines():
            if line.startswith(name + "="):
                return line.split("=", 1)[1].strip().strip('"')
    return None


def send(subject, body):
    addr, pw = cred("GMAIL_ADDRESS"), cred("GMAIL_APP_PASSWORD")
    if not addr or not pw:
        raise RuntimeError("Set GMAIL_ADDRESS and GMAIL_APP_PASSWORD (repo secrets or .env).")
    msg = EmailMessage()
    msg["From"] = f"Crema Health <{addr}>"
    msg["To"] = TO
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as s:
        s.starttls(context=ssl.create_default_context())
        s.login(addr, pw.replace(" ", ""))
        s.send_message(msg)


def main():
    dry = "--dry-run" in sys.argv
    results, secs = check(retry=not dry)
    subject, body, failures = report(results, secs)
    print(subject + "\n" + body)
    # ponytail: mail every run, pass or fail — a daily all-clear, so a MISSING email is
    # itself the alarm (it means the workflow stopped running).
    if not dry:
        send(subject, body)
        print(f"emailed {TO}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

#!/bin/bash
# Blocks `git push` when it would land on main — which on this repo IS a
# production deploy (Vercel git integration is live; measured 2026-07-29).
# Exit 2 = block the tool call and show stderr to Claude.
# Feature-branch pushes pass through untouched.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Not a push? Nothing to do.
grep -qE '(^|[;&|[:space:]])git([[:space:]]+-[^[:space:]]+)*[[:space:]]+push' <<<"$cmd" || exit 0

block() {
  echo "BLOCKED: pushing to main deploys Crema to production (portafile.vercel.app)." >&2
  echo "Run /still-works and get Ethan's explicit approval for the DEPLOY first." >&2
  echo "To override deliberately, Ethan runs the push himself with ! in the prompt." >&2
  exit 2
}

# Explicit main target: `git push origin main`, `git push -u origin main`, `HEAD:main`
grep -qE '(^|[[:space:]:])main([[:space:]]|$)' <<<"$cmd" && block

# Bare `git push` (no explicit remote/refspec) pushes the CURRENT branch.
# Only then does the checked-out branch decide. An explicit non-main target
# above already fell through, and must not be second-guessed here.
args=$(sed -E 's/.*git([[:space:]]+-[^[:space:]]+)*[[:space:]]+push//' <<<"$cmd" \
       | tr ' ' '\n' | grep -vE '^-|^$' | head -1)
if [ -z "$args" ]; then
  branch=$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null)
  [ "$branch" = "main" ] && block
fi

exit 0

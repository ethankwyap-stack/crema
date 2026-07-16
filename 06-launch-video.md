# Step 6 — The Launch Video

**Date:** 2026-07-15 · **Status:** complete
**Standalone checkpoint:** `video/portafile-launch.mp4` exists and is verified. Resume from Step 7.

## The film

**`video/portafile-launch.mp4` — 75.6 seconds, 1280×720 @30fps, H.264+AAC, 7.7MB.** A real video file, not a slideshow: live screen recordings of the actual verified product, with a spoken voiceover.

**Structure (8 scenes):**
1. Open (title card): *"For the shops where the recipes live in somebody's head."*
2. The problem (card): the three real r/barista quotes, attributed on screen.
3. Product: recipe cards tour (screen recording).
4. **The money moment** — milk price typed from $0.036 to $0.080 on camera, cut to the cards having re-priced themselves; latte economics spoken aloud.
5. Dial-in board: logging "humid again — tightened" live.
6. Training: sign-offs ticked, progress bar moves.
7. Print: scrolling the actual print-media new-hire pack (cover → checklist → dial-ins → cards).
8. Close (card): logo, tagline, *"free · local-first · no account · no catch."*

## How it was made ($0, no new tools)
- **Voiceover:** macOS `say -v Samantha -r 172` → 8 AIFF segments (67s of narration), durations measured with `afinfo` and used as the pacing spec.
- **Screen capture:** Playwright `recordVideo` (cached Chromium) driving the real app with human-paced actions (`pressSequentially` with keystroke delays, slow mouse-wheel scrolls, hovers).
- **Title cards:** brand-styled HTML → 1280×720 screenshots.
- **Assembly:** single ffmpeg filter-graph — per-scene trim/clone-pad to voiceover length, 0.3s fades, VO delayed 0.5s into each scene, concat of 8 A/V pairs, `yuv420p + faststart` for universal playback.

## Verification
- `ffprobe`: 75.6s duration, sane size.
- 8 frames extracted across the timeline and visually inspected (title, quotes, recipes, **milk edit mid-keystroke**, latte hover, dial-in, training, print pack, close) — all correct scenes at expected timestamps.
- `volumedetect` on scenes 2–3: mean −19dB / max −5dB — VO present, not clipping.
- Site hero link updated to say "75-second film" (was a placeholder claiming 100).

## Decisions (build log D23–D24)
- **D23 — Real .mp4 over HTML-pretending-to-be-video**; ffmpeg + Playwright + `say` were all already installed → $0 and zero new accounts.
- **D24 — Samantha voice at 172wpm** — the most natural bundled US voice; a human VO re-record is a 10-minute upgrade path post-handoff (script is in this file's history / `narration.sh`).

## What was cut
- Music bed: no free, license-clean, offline source available without a new download/account; VO-only keeps it clean. (Ethan can drop a YouTube Audio Library track under it in iMovie in minutes — noted as an upgrade path.)

## Open → Step 7
Adversarial kill pass on the entire package (subagents if limits allow, inline otherwise), then fixes, then packaging.

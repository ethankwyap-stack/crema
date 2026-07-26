# HANDOFF — Portafile launch film: replace the robotic voiceover with Ethan's own voice

**Written 2026-07-26. Every fact below was verified by a command run in the session that wrote it,
unless explicitly labelled otherwise. You are picking this up cold.**

> **This is NOT the file at the repo root.** `/Users/ethanyap/portafile/handoff.md` is a *resolved*
> handoff from 2026-07-23 about a founder-dashboard delete bug — it is history, already deployed,
> and unrelated to this work. Do not edit it, do not overwrite it, do not act on it.

---

## 1. TL;DR

Ethan watched the launch film on the live site and said the voice "sounds too AI." It is:
the narration is Apple's built-in `say -v Samantha -r 172` text-to-speech.

**Done this session:** root cause confirmed, the free-better-TTS-voice escape hatch proven
impossible on his Mac, all the original film source assets rescued out of a temp folder into the
repo, and a rewritten human-read script written.

**Pending — the entire actual fix:** Ethan records the new narration in his own voice, then the
film gets re-cut around it and redeployed. He has not recorded yet. He said "I want to do this
later."

**Do not redo:** the search for a better macOS voice (§4 — it is definitively dead), and the hunt
for the original build assets (§3 — they are already in `video-src/`).

**Nothing was deployed this session.** The live site still has the old Samantha film.

---

## 2. What was accomplished, and why

The ask was "propose some changes" to fix the AI-sounding voice. That produced two findings.

**The voice is literally a robot voice.** `video-src/narration.sh` (rescued, see §3) is the exact
script that generated the audio: eight `say -v Samantha -r 172` calls. Samantha is Apple's
"compact" tier — the lowest-quality synthesizer on the machine — read at a flat rate with no
pauses. No rewording fixes the timbre.

**The script also reads as machine-written**, independent of the voice. All eight scenes end on an
aphorism ("Guessing is over." / "Your shop finally has a memory." / "Paper survives the rush. The
app keeps the paper honest."). There are three-item lists throughout ("No standards. No training
guide. No recipe book." / "No account. No server. No catch."). Scene 4 is **15.4 seconds of
unbroken speech** at a fixed rate — the single most synthetic stretch in the film.

**Road not taken, and why it's closed:** the obvious cheap fix was downloading one of Apple's free
Enhanced/Premium neural voices (Ava, Evan, Tom, Zoe) and regenerating with a one-word change to
`narration.sh`. That path is dead on Ethan's machine — see §4. Do not spend a turn re-attempting it.

**Bonus defect found, unrelated to the voice.** The film's closing line says **"No server."**
Opt-in cloud sync shipped on **2026-07-17**, two days *after* the film was cut (verified:
`git log --diff-filter=A -- api/state.js`). `site/index.html` already carries the honest version
("sync to staff phones only if you choose"); the film does not. That line is currently false on a
public marketing asset. The rewritten script fixes it. **This alone justifies the re-cut even if
Ethan changes his mind about the voice.**

---

## 3. Verified state

| Thing | State | How it was verified |
|---|---|---|
| Live film | `https://portafile.vercel.app/video/portafile-launch.mp4` → **HTTP 200**, still the old Samantha audio | `curl -sI` |
| Film specs | 75.6s, 1280×720, H.264 + AAC 48kHz stereo, 8,372,268 bytes | `ffprobe` |
| Hero link text | Live homepage says "Watch the 75-second film" | `curl -s https://portafile.vercel.app/ \| grep` |
| Source of that string | `site/index.html:193` | `grep -n` |
| Branch | `main`, clean except two untracked paths | `git status --porcelain` |
| `video-src/` | **UNTRACKED (`??`)** — exists on disk only, 4.4 MB, not committed | `git status --porcelain`, `du -sh` |
| `.handoff` | Untracked, pre-existing, unrelated to this work — leave it alone | `git status --porcelain` |
| Screen recordings | `video-src/rec/s3–s7.webm`, all five open and report sane durations | `ffprobe` on each |
| Title cards | `video-src/card1.png`, `card2.png`, `card8.png` (+ their `.html` sources) | `ls` |
| Original VO script | `video-src/narration.sh` — the exact eight lines that were spoken | read in full |
| New script | `video-src/script-v2.md` — ten beats, written this session | written this session |
| Ethan's mic | Works. `ffmpeg -f avfoundation -i ":1"` captured real audio (mean −45 dB room tone, not digital silence) → terminal has mic permission | `ffmpeg` + `volumedetect` |
| Available mics | `[0] Ethan Yap's iPhone Microphone`, `[1] MacBook Air Microphone` | `ffmpeg -list_devices` |
| macOS | 26.5.2 | `sw_vers` |
| Cost of everything here | **$0.** ffmpeg is already installed at `/opt/homebrew/bin/ffmpeg`. No accounts, no APIs, no uploads. | — |

### Original scene timings (the picture the audio has to fit)

| Scene | Picture source | Old VO length |
|---|---|---|
| 1 Title card | `card1.png` | 3.50 s |
| 2 r/barista quotes | `card2.png` | 10.33 s |
| 3 Recipe cards tour | `rec/s3.webm` (9.56 s) | 8.37 s |
| 4 Money moment | `rec/s4.webm` (15.04 s) | 15.40 s |
| 5 Dial-in board | `rec/s5.webm` (7.76 s) | 9.56 s |
| 6 Training sign-offs | `rec/s6.webm` (5.60 s) | 4.62 s |
| 7 Print pack scroll | `rec/s7.webm` (8.48 s) | 8.36 s |
| 8 Close card | `card8.png` | 7.02 s |

Note scene 5's VO (9.56 s) is longer than its recording (7.76 s). The original assembly padded each
scene's picture out to its VO length by cloning the final frame. So **narration longer than the
recording is fine; much shorter means trimming picture.**

---

## 4. Do not redo: the better-TTS-voice path is definitively dead

Three independent confirmations, all from commands run this session:

1. **No better voice is installed.** `say -v '?'` lists 184 voices; `grep -ic "premium|enhanced"`
   returns **0**. Ava, Evan, Tom, Zoe, Allison, Nicky, Susan — none present.
2. **No way to install one.** macOS 26.5.2 renamed System Settings → Accessibility → Spoken Content
   to **"Read & Speak"**, and there is **no "Manage Voices…" item** anywhere in the System Voice
   dropdown (Ethan scrolled to the bottom and confirmed; screenshots reviewed). The premium voice
   asset folder `/System/Library/AssetsV2/com_apple_MobileAsset_MacinTalkVoiceAssets/` contains one
   entry (an index), i.e. nothing downloaded and nothing staged. `assetutil` rejects `--list-installed`
   on this version.
3. **Siri's voice is not reachable from the command line.** The dropdown does offer `Siri › Voice 4`.
   But `say` **silently falls back to the default voice for any name it does not recognise** —
   proven by generating the same sentence three ways:

   ```
   Samantha           md5=cdee545e490b4d5d93d6525dfcaa9b60
   Siri Voice 4       md5=cdee545e490b4d5d93d6525dfcaa9b60
   BogusMadeUpVoice   md5=cdee545e490b4d5d93d6525dfcaa9b60
   ```

   Byte-identical, including the deliberately fake name. `say` never errors on a bad voice, so a
   command that appears to succeed proves nothing. **Always md5-compare against a nonsense voice
   name before believing `say` used the voice you asked for.**

---

## 5. The next task

**Record Ethan reading `video-src/script-v2.md`, then re-cut the film.** He agreed to this approach
and then deferred it ("I want to do this later"). Do not restart the analysis — go straight to
recording when he says he's ready.

The agreed method, already set up and tested:

1. Open `video-src/script-v2.md` for him to read from (`open -a TextEdit …` works).
2. Record **one continuous take** of all ten beats, ~2 s of silence between each, straight from the
   terminal — no Voice Memos, no exporting, no file shuffling:
   ```
   ffmpeg -f avfoundation -i ":1" -t 180 -ar 48000 -ac 1 -y take1.wav
   ```
   Recording starts the instant the command runs, so **confirm he is ready before running it.**
3. Split on the pauses with `silencedetect`, expect ten segments, drop flubbed re-takes.
4. Clean up: `loudnorm`, a high-pass around 80 Hz for room rumble, light compression. That makes him
   sound present and even — it **cannot** add energy that isn't in the take.
5. Re-cut and re-encode (§6), verify, then deploy (§7).

**Open question — ask him, do not guess:** he has not chosen between the **MacBook Air mic** (device
`:1`, tested working) and his **iPhone mic** (device `:0`, untested, likely warmer). Either is free.

**Guidance already given to him**, so it does not need re-litigating: he asked whether he has to
"sound like marketing" or whether editing can add energy. He was told plainly — do *not* perform;
the marketing cadence is exactly what's being removed; editing can trim, level and clean but cannot
make a flat read energetic; and the three things that actually help are sitting a hand's width from
the mic, talking slightly faster than feels natural, and smiling on beats 1 and 8.

---

## 6. Gotchas

**The one that bit hardest this session, again:** `say` silently accepts any voice name and falls
back to the default. See §4. Verify with an md5 against a fake name.

**The original assembly command is LOST.** The temp folder preserved `narration.sh` (the VO script)
and `record.js` (the Playwright screen recorder) but **not** the ffmpeg assembly script. The film was
built as a single filter-graph: per-scene trim/clone-pad to VO length, 0.3 s fades, VO delayed 0.5 s
into each scene, concat of eight A/V pairs, `yuv420p` + `faststart`. That is described in
`06-launch-video.md` but the actual command must be rewritten from scratch. Budget for that.

**`video-src/` is untracked.** It is the only surviving copy of the film's source assets that isn't
in a temp directory. The originals are still at
`/Users/ethanyap/.claude/jobs/dde0cee3/tmp/vid/` **as of 2026-07-26**, but that is a scratch path
that gets cleaned up without warning. **Recommend committing `video-src/` early.** Ethan was told it
exists; he has not been asked to commit it.

**`video/` IS published; `video-src/` is not.** `.vercelignore` publishes only `site`, `product`,
`video`, `api`, `vercel.json`, `package.json`. So working files must never be dropped in `video/` —
they would go live. `video-src/` was chosen for exactly this reason. Adding any *other* new
top-level directory that needs to deploy requires editing `.vercelignore`.

**If the re-cut changes the film's length, `site/index.html:193` must change too.** It currently
promises a "75-second film" and that string is live. There is a precedent for this being missed —
the original hero text claimed 100 seconds before it was corrected.

**`timeout` does not exist on macOS.** `timeout 12 ffmpeg …` fails with `command not found`. Use
ffmpeg's own `-t` flag instead.

**`say` writes AIFF, and `afinfo … | grep "estimated duration"` is how segment lengths were
measured** — that is the pacing spec the original assembly used.

---

## 7. Deploying, when the new film is ready

- Run `/still-works` **before** the deploy, not after. That is a standing rule and `WORKS.md` is the
  map it uses.
- Deploy is `vercel deploy --prod --yes` from the repo root. **`git push` does NOT deploy this
  project**, despite `vercel git connect` having been run.
- Deploying is outward-facing — **confirm with Ethan first.** Approval for one deploy is not
  approval for the next.
- After deploying, re-fetch `https://portafile.vercel.app/video/portafile-launch.mp4` and confirm a
  200 plus a changed byte size.
- The new mp4 replaces `video/portafile-launch.mp4` (currently 8.4 MB, committed in git).

---

## 8. How to work with Ethan

- **Cost is his #1 anxiety.** Everything in this task is $0 and stays $0 — ffmpeg is local, the
  recording is local, nothing is uploaded to any service. Say so with certainty, never "probably free."
- **Terminal steps: one command at a time.** Say what he should see, then wait for his confirmation
  or screenshot before the next one. He sends screenshots as bug reports or "where do I click" —
  read them carefully and answer what they actually show.
- **Verify before saying done.** Watch the re-cut film, don't just check that ffmpeg exited 0.
- **Admit limits.** A model cannot hear audio. It can measure levels and locate pauses; whether a
  take *sounds good* is Ethan's call. Play each beat back to him rather than asserting it's fine.
- **Lead with the outcome** in the first sentence, detail after.

---

## 9. Files this session created or changed

| Path | What |
|---|---|
| `video-src/rec/s3–s7.webm`, `card{1,2,8}.{html,png}`, `narration.sh`, `record.js` | Rescued from the temp build folder. Unmodified copies. |
| `video-src/script-v2.md` | **New.** The ten-beat human-read narration, delivery notes, and a written explanation of why the old script reads as machine-written. |
| `video-src/HANDOFF.md` | This file. |

No existing project file was modified. Nothing was deployed.

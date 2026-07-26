# Portafile launch film — narration v2 (human read)

Replaces the `say -v Samantha` VO in `narration.sh`. Read it the way you'd
explain it to another shop owner across the counter — not the way you'd read
an ad.

**Delivery notes**
- Use contractions. If a line feels stiff in your mouth, change the words.
- Pause *between* beats, not inside them. Silence is what the robot version had none of.
- Don't over-enunciate. A tiny stumble is fine — it's what makes it not-AI.
- One beat per take. Restart any line as often as you like; I cut the good take.
- Approximate lengths are the old picture's timings. Going over is fine — the
  picture pads to your audio. Going way under means I trim picture.

---

**1 — Title card** *(~3.5s)*
> This one's for the shops where the recipes just live in somebody's head.

**2 — The three r/barista quotes on screen** *(~10s)*
> These are real posts, from real shops. Most of them have nothing written down anywhere. And when somebody quits, all of it walks out the door with them.

**3 — Recipe cards tour** *(~9.5s)*
> So Portafile starts with the thing every shop already trusts. The recipe card. Fifteen drinks are already in there — edit them, or leave them. You're never staring at a blank page.

**4a — before the milk edit** *(~4s)*
> Except these cards know something a laminated one never did. What the drink actually costs you.

**4b — as the price is typed** *(~3s)*
> Watch what happens when milk goes up.

**4c — after the cards re-price** *(~7s)*
> Every card just re-priced itself. That latte's still making you three seventy-eight.

**5 — Dial-in board** *(~9.5s)*
> Then there's the morning question. What's the grind today? Log it per bean, takes about ten seconds, and tomorrow it's sitting there with everything you tried before it.

**6 — Training sign-offs** *(~5.5s)*
> New hire starting Monday? Put the training in order, tick off sign-offs by name.

**7 — Print pack scroll** *(~8.5s)*
> Then print the whole thing. Paper's what survives a rush — this just keeps the paper honest.

**8 — Close card** *(~7s)*
> That's Portafile. It's free, there's no account, and your recipes stay in your browser unless you choose to sync them.

---

## Why the old script sounded synthetic

Beyond the voice itself (`say -v Samantha -r 172`, Apple's lowest-quality
tier — and note macOS 26 removed the Manage Voices pane, so no better voice is
installable, and `say` silently falls back to the default for any name it
doesn't know, including Siri's):

- Every one of the 8 scenes ended on an aphorism. "Guessing is over." "Your shop finally has a memory." "Paper survives the rush. The app keeps the paper honest." Nobody talks in eight consecutive epigrams.
- Three-item lists everywhere: *no standards / no training guide / no recipe book*, *no account / no server / no catch*, *cover / checklist / cards / dial-ins*.
- Nested em-dash asides ("The morning question — what's the grind today? — answered before anyone has to ask") that a synthesizer reads perfectly flat.
- Scene 4 was **15.4 seconds of unbroken speech** at a fixed rate. Split into 4a/4b/4c above.

## Factual fix (independent of the voice)

The old scene 8 said **"No server."** Opt-in cloud sync shipped 2026-07-17, two
days after the film was cut. `site/index.html` already says the honest version;
the film didn't. Beat 8 above is corrected.

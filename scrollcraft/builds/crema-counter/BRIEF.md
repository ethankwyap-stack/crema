# BRIEF — Crema landing page v3

Interviewed 2026-08-22. Not self-authored.

## 1. Vibe (3–5 words) + references
Ethan picked from offered ranges rather than free text. Resolved from
`~/design-taste/TASTE.md`: **elemental, dark, editorial, real, unhurried.**
References already logged there: everest.suraj.work (one continuous choreographed
scroll, photographic realism, pacing tells the story), Fusion Sketch (real
mountain/fog photography with type laid over it), Sandhill "Lourve" (single
dominant glow, serif editorial headline).

## 2. The scroll journey, in his words
"Redesign my landing page Crema so it has more premium feel to it but also
compelling to sign up and look trusted. Don't make it look like a bunch of AI
generated assets."

Journey as scored from that:
1. Recognition — the counter at 6:41am, before open
2. Tension — the two numbers: $4.41 a pound, 11¢ kept per dollar
3. Turn — **the price change**: milk moves, every card re-prices itself
4. Substance — the three jobs (money / morning / Monday), shown in the real app
5. Trust — the founder. One person, in public, no company behind it
6. Commitment — open it, free, no account

## 3. Energy curve
Calm open (the empty counter), tighten through the numbers, PEAK at the
re-price, settle into substance, quiet and human at the founder, firm at close.

## 4. Feeling curve + the peak
| Act | Feeling | What causes it |
|---|---|---|
| 1 Counter | recognition, calm | a real photographed counter before open, his own light |
| 2 Numbers | unease | two figures with sources, on near-black, nothing else on screen |
| 3 Re-price | **relief / control** | he drags milk's price and 15 drinks re-cost live under his hand |
| 4 Three jobs | competence | real app screenshots panning past, not mockups |
| 5 Founder | trust, warmth | a face, a name, one honest paragraph about what is and isn't built |
| 6 Close | resolve | one button, held, nothing after it |

**Peak:** act 3. The sentence a visitor tells a friend:
*"There's this thing where you slide the milk price and every drink on the
menu re-costs itself while you watch."*

Peak gets the largest span (3.6vh) and the quietest act before it (act 2 at 2.4).

## 5. The one thing no other site does
The **cost slider**. The visitor edits the demo shop's ingredient price directly
in the landing page and watches real margin maths run. Not a video of the
product. The product's actual arithmetic, running in the page. This is the
signature move.

## 6. Distance from premium-minimal
**Editorial.** Print-magazine discipline: big type, wide margins, real photos,
one accent (Ink navy), sources printed small under claims.

## 7. One unbroken world or distinct scenes
**One unbroken world** — a single cafe counter travelled along, top to bottom.
Built in CSS/photography, not video: no paid generation, per Ethan's zero-cost
rule and his "no AI-generated assets" instruction.

## 8. Assets he already has
- `site/assets/01-recipes.png`, `03-dialin.png` — real app screenshots
- `site/assets/ridge.jpg`, `weave.jpg` — real photographs already in repo
- `brand/brand.css` — Counter dark palette, Ink navy accent
- A verbatim, sourced r/barista quote and two sourced industry figures
- **Needed from Ethan: one photo of his face** for act 5. Placeholder until then.
- Everything else: free real photos from Unsplash/Pexels, committed to the repo.
  Zero generated imagery. Zero spend.

## Authored silence
Between act 2 and act 3 the page holds a near-empty dark screen for ~0.4vh
before the slider arrives. That is deliberate, not dead scroll.

## Honest limits
- No customer testimonials: none exist yet. Trust is carried by the founder
  section, the printed sources, and the working slider, not by invented social proof.
- No stat counters: every number on the page is sourced or computed live.

---

# Post-build addendum (2026-08-22)

## Grammar reversal, with the user's consent
Q7 was answered "one unbroken world". That grammar (**Continuous world**)
REQUIRES worldflight mode and a rendered camera flight, which means paid AI
generation. That is both a spend and precisely the "bunch of AI generated
assets" look Ethan told me to avoid. I put the conflict to him and he chose
**Chaptered editorial**. Structure decided by him, twice.

## Feel check (scrolled cold, then diffed against the curve above)
| Act | Intended | Felt | Verdict |
|---|---|---|---|
| Title page | calm, recognition | calm, expensive | matches |
| 01 The room | recognition | recognition, then indignation at the quote | matches, slightly hotter |
| 02 The arithmetic | unease | unease | matches |
| Intertitle | authored silence | **anticipation**, not silence | better than intended; kept |
| 03 Move the milk | relief / control | control | matches. This is the peak |
| 04 Three jobs | competence | competence | matches |
| 05 Who made this | trust, warmth | trust | matches, warmth is thin without the photo |
| Colophon | resolve | resolve | matches |

Nothing changed as a result of the diff except keeping the intertitle, which
was almost cut for being too quiet.

## What the feel check could NOT confirm
Act 05's warmth. The founder portrait is a monogram placeholder. A face is the
whole mechanism of that chapter and it is not in yet.

## Corrections found during the build
The landing page's app screenshots were **stale**: they showed the pre-rebrand
gold theme and pre-rebrand prices. Retaken from the running app. The live v2
page's ticker still quotes prices the app no longer produces (cappuccino $0.98
vs the real $1.07, cortado $0.87/$4.25 vs $0.98/$4.50). Flagged, not fixed:
that page is out of this build's scope.

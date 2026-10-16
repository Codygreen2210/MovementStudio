# Production Playbook

These are the house rules for every new episode. They are adapted from the *YouTube Growth & Production Architecture Manual*, checked against what this pipeline can do, and set wherever the manual's numbers can't be verified.

## Channel map
- **Hub:** "How a Rolex Ticks 28,800 Times an Hour" (long form, LfXM0WRtF8k).
- **Spokes:** the Everyday Machines Shorts. Every Short's description and its "Related video" link point back to the hub, or to the closest spoke.
- **Theme:** small machines hidden inside things you touch every day. Ideas outside that theme score 0 for graph fit.

## Packaging (decide before the script)
- Pick one archetype:
  - **Paradox:** "Why a Closed Zipper Can't Be Pulled Apart".
  - **Hidden System:** "The Hidden Machine Inside Every Click Pen".
  - **Scale:** "Your Headphones Shake Up to 20,000 Times a Second".
  - **Failure/Warning.**
- A thumbnail has at most 3 focal points, and its text never repeats the title.
- Sentence one of the script states the title's promise.

## Script
- **4-beat hook, scaled for Shorts:**
  - 0–3 s: the promise, said and shown.
  - 3–8 s: "most people think…, but…".
  - 8–14 s: a fast preview of the best animation.
  - 14–20 s: a question that launches node 1.
- **Nodes:** 30–45 s each in a Short; 45–75 s in long form. Each node runs hook → visual metaphor → payoff → **cascade pivot**. The pivot asks the next question before the current one closes.
- Never let the narration question and the motion resolve on the same frame.
- **Dual-column script:**
  - Columns: Time | Visual + SFX | Voiceover with marks.
  - The visual carries half the explanation, so never narrate what's already plain on screen.
- **Prosody marks:**
  - `*word*` = punch;
  - `[↑]` = rising end;
  - `[↓]` = chest drop at payoffs;
  - `//` = 0.4–0.7 s silence;
  - `>>…<<` = faster.
- **Ending:** no "subscribe" and no "next time". Use a node bridge in the last 10–15 s: open a question the hub video answers, and set the Short's Related video to it.

## Voice and edit
- **Gaps:** 120–250 ms between sentences. Use a 0.4–0.7 s `//` pause only at a reveal. The three Everyday Shorts measured 1.3–1.6 s median between lines, too slow.
- **Mix:**
  - Voice is the loudest layer.
  - Tactile SFX sit 6–10 dB under the voice.
  - Music sits 18–22 dB under the voice. The Everyday Shorts measured 11–12 dB under, too loud.
- Cut the music 2 frames before each big reveal word, then bring it back on the next beat.
- Start the next scene's sound 4–8 frames before its picture (J-cut).
- Prefer tactile foley (clicks, slides, paper, sub drops) over air whooshes.

## Motion
- **Visual resets:** a visible change every 2–4 s; the current engine runs ~1 s, which is fine. A reset can be:
  - a 15% push-in;
  - dimming the background to spotlight one part;
  - a label unfolding;
  - a colour flip when a problem appears.
- **Easing:** fast out, long settle, slight overshoot. Never linear.
- **Eye trace:** the next shot's subject lands in the same screen quadrant as the last one.

## Idea scorecard (25 points)
Score each 1–5:
- **Packaging:** one clear archetype and one object.
- **Hook inversion:** a real "most people think" to break.
- **Visual payoff:** a mechanism that animates beautifully.
- **Graph fit:** how well it links to the hub and spokes.
- **Search demand:** people already type "how does ___ work".

| Idea | Pack | Hook | Visual | Graph | Search | Total |
|---|---|---|---|---|---|---|
| Seatbelt: why it locks when you yank it, but not when you lean | 5 | 5 | 5 | 4 | 5 | **24** |
| Pin-tumbler lock and key | 5 | 4 | 5 | 4 | 5 | **23** |
| Quartz watch: the crystal that vibrates 32,768 times a second | 4 | 5 | 4 | 5 | 4 | **22** |
| Smoke detector: the radioactive speck in your ceiling | 5 | 5 | 3 | 3 | 4 | **20** |
| Tape measure: why the curved blade stands up in mid-air | 4 | 4 | 4 | 3 | 4 | **19** |
| Toilet tank: the siphon that empties it | 3 | 4 | 4 | 2 | 5 | **18** |
| Bike freewheel: why it clicks when you coast | 3 | 3 | 4 | 4 | 3 | **17** |
| Stapler | 2 | 2 | 3 | 3 | 3 | **13** |

Build 20 and up; rework 16–19; skip 15 and below.

## What to measure (YouTube Studio → each Short → Analytics)
- **Viewed vs. swiped away:** the first gate. The manual's 75% target is not an official YouTube figure.
- **Average percentage viewed:** for a 2–3 min Short, compare each episode against our own previous ones, not against the manual's ">95%".
- **Subscribers gained** and **Related video clicks**.

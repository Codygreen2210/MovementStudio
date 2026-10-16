# Everyday Machines

Three vertical Shorts (1080×1920, under 3 minutes) in the same style as the Calibre 3235 breakdown: the watchmaker's bench, a British narrator, burned-in captions and a subscribe ending.

| Video | Length | File |
|---|---|---|
| Inside the Click Pen | 2:25 | `videos/click-pen-short-1080x1920.mp4` |
| Inside the Headphones | 2:27 | `videos/headphones-short-1080x1920.mp4` |
| Inside the Zipper | 2:14 | `videos/zipper-short-1080x1920.mp4` |

Captions are in `captions/`, and titles, descriptions and tags are in `Everyday Machines upload details.txt`.

## The reusable engine
`engine/kit.js` is a generic breakdown engine. It handles the camera, timing locked to the narration, labels, captions, the call to action and the studio set. Each object is a single module (`obj_pen.js`, `obj_phones.js`, `obj_zip.js`) that defines its drawing, its mechanism and its scenes. To make a new episode:

1. Write a script in `scripts/` (`cap` for captions, `say` for speech, `marks` for words that trigger animation).
2. Record it: `python3 pipeline/rec_flow.py scripts/s_<name>.json narr_<name>`.
3. Write `engine/obj_<name>.js` and a matching `<name>.html` page.
4. Add a format entry in `pipeline/render2.py`, then run `timeline`, `segment`, `audio` and `srt`.

# Movement Studio: master set

Masters and the reusable production kit for animated watch-movement breakdowns. First episode: **Calibre 3235**.

## Episode 01: Calibre 3235
| File | What it is |
|---|---|
| `videos/calibre-3235-long-1080p.mp4` | Long-form YouTube master, 1920×1080, 30 fps, 5:28 |
| `videos/calibre-3235-short-1080x1920.mp4` | YouTube Short master, 1080×1920, 30 fps, 0:45 |
| `videos/calibre-3235-3min-short-1080x1920.mp4` | Full-story vertical Short, 1080×1920, 30 fps, 2:45, with subscribe call to action |
| `thumbnails/calibre-3235-long-thumbnail.jpg` | Long-form thumbnail, 1280×720 |
| `captions/*.en.srt` | English captions for both videos |
| `YouTube upload details.txt` | Titles, descriptions, chapters, tags |

## Reusable kit for the next movement
| Folder | What it is |
|---|---|
| `studio/` | Watchmaker's bench set: 4K stills (16:9 and 9:16) and `studio.js`, the animated version with lamp light and dust |
| `engine/` | The movement renderer: mechanism, camera moves, watch case, flip and case-back reveal (`film.js` is assembled from the parts by `pipeline/assemble.py`) |
| `pipeline/` | Narration recording (offline British voice), timeline, frame rendering, sound design and the motion check |
| `scripts/` | Narration scripts for the long video and the Short |

### Making the next episode
1. Write a new script in `scripts/` (one entry per scene, with `cap` for captions and `say` for how it should be spoken).
2. Record narration: `python3 pipeline/rec_flow.py scripts/<file>.json <name>` (one continuous take per line).
3. Add the new movement's geometry and scenes in `engine/`, then `python3 pipeline/assemble.py`.
4. Render: `python3 pipeline/render2.py <format> timeline|frames|audio|srt`.
5. Check pacing: `python3 pipeline/motioncheck.py <video>` (no stretch of more than 3 s without motion).

Independent, schematic explainers. Not affiliated with or endorsed by any watch brand.

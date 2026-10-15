WATCHMAKER STUDIO SET
Reusable background for movement-breakdown videos.

WHAT'S HERE
• Watchmaker Studio 16x9 (4K).png: still of the set for long-form YouTube (3840×2160).
• Watchmaker Studio 9x16 (4K).png: still of the set for Shorts / Reels / TikTok (2160×3840).
• studio.js: the live, animated version used in the Calibre 3235 video. It draws a walnut bench, a parts cabinet, a stitched green leather mat, tools (screwdriver stand, tweezers, loupe, oil cups, parts tray, case knife, pegwood, Rodico) and a warm bench lamp with floating dust.

USING THE STILLS
Drop either PNG under your footage or animation in any editor (Premiere, Resolve, CapCut, Final Cut). The centre of the green mat is left clear for the movement.
For gentle life, add a slow 2–4% push-in and a light grain or dust overlay.

USING THE LIVE VERSION (for future animated breakdowns)
  const set = Studio.create(1920, 1080, {seed: 7});   // or 1080, 1920 for vertical
  // each frame:
  set.draw(ctx, seconds, {x: panX, y: panY, s: zoom}); // bench, mat and tools with parallax
  // ...draw the movement...
  set.drawLight(ctx, seconds);                          // lamp glow, vignette, drifting dust
Changing the seed rearranges the wood grain and the parts in the tray, so each video can look slightly different while keeping the same studio.

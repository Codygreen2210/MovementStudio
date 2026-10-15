"""Find the longest stretch where the picture barely changes (frame-to-frame), to enforce 'never still for 3 s'."""
import subprocess, sys, numpy as np
path = sys.argv[1]; w, h = 320, 180
if len(sys.argv) > 2 and sys.argv[2] == 'portrait': w, h = 180, 320
p = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', path, '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
prev = None; diffs = []
while True:
    b = p.stdout.read(w * h)
    if len(b) < w * h: break
    f = np.frombuffer(b, np.uint8).astype(np.float32)
    if prev is not None: diffs.append(np.mean(np.abs(f - prev)))
    prev = f
d = np.array(diffs); fps = 30
for thr in (0.05, 0.15, 0.3):
    still = d < thr; best = run = 0; best_end = 0
    for i, s in enumerate(still):
        run = run + 1 if s else 0
        if run > best: best, best_end = run, i
    print(f'threshold {thr}: longest near-still stretch {best / fps:.2f}s ending at {best_end / fps:.1f}s')
print(f'median frame change {np.median(d):.2f}, 5th pct {np.percentile(d, 5):.3f}')

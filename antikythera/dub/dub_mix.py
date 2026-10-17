"""Build dubbed audio tracks (Spanish, Hindi) for the Antikythera video.
Each scene's take is split into sentences at its longest pauses, then each sentence is placed at the
English sentence's start time (sliding later when needed, gently sped up when a scene runs long)
and mixed over the film's no-voice bed. Output: dub/<lang>.m4a, same length as the video."""
import json, subprocess, sys, os, wave, numpy as np
from scipy.signal import butter, sosfilt
sys.path.insert(0, '/home/claude/anti/subs')
import make_srt as M
A = '/home/claude/anti'; SR = 48000
FETCH = '/home/claude/movementstudio/antikythera/fetch/out'
TL = json.load(open(f'{A}/tl.json'))
VIDEO_DUR = 514.533
TAKES = json.load(open(f'{A}/dub_takes.json'))
GROUPS = json.load(open(f'{A}/dub_groups.json'))
SENT = M.sentences()
STATS = {}
CAP = float(os.environ.get('CAP', '1.25'))
TR = {l: json.load(open(f'{A}/subs/{l}.json'))['sentences'] for l in ('es', 'hi')}
ORDER = ['hook', 'wreck', 'xray', 'crank', 'pinslot', 'back', 'planets', 'who', 'bridge']

def pcm(path, ss=None, t=None):
    cmd = ['ffmpeg', '-loglevel', 'error']
    if ss is not None: cmd += ['-ss', f'{ss:.3f}']
    if t is not None: cmd += ['-t', f'{t:.3f}']
    cmd += ['-i', path, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()

def tempo(x, f):
    if abs(f - 1) < 0.005: return x
    p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                        '-af', f'atempo={f:.4f}', '-f', 'f32le', '-'], input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).copy()

def segments(x, n, weights):
    """Split speech into n sentences at pauses, choosing the pause set whose positions best match the
    expected sentence boundaries (by translated sentence length), favouring longer pauses."""
    hop = SR // 100
    e = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, mode='same')[::hop] + 1e-12)
    thr = np.percentile(e, 95) * 10 ** (-32 / 20)
    voiced = e > thr
    idx = np.flatnonzero(voiced); a0, a1 = idx[0], idx[-1]
    runs, i = [], a0
    while i <= a1:
        if not voiced[i]:
            j = i
            while j <= a1 and not voiced[j]: j += 1
            if j - i >= 12: runs.append((i, j))
            i = j
        else: i += 1
    if n == 1:
        return [(max(0, a0 - 4) * hop, min(len(x), (a1 + 5) * hop))], [0]
    span = a1 - a0
    cum = np.cumsum(weights)[:-1] / sum(weights)
    exp = [a0 + c * span for c in cum]
    m = len(runs)
    mid = [(r0 + r1) / 2 for r0, r1 in runs]; ln = [(r1 - r0) for r0, r1 in runs]
    INF = 1e18
    # dp[j][c]: best cost placing boundary j at candidate c
    cost = lambda j, c: abs(mid[c] - exp[j]) / span * 100 - min(ln[c], 80) * 0.25
    dp = [[INF] * m for _ in range(n - 1)]; bk = [[-1] * m for _ in range(n - 1)]
    for c in range(m): dp[0][c] = cost(0, c)
    for j in range(1, n - 1):
        best, bi = INF, -1
        for c in range(m):
            if c - 1 >= 0 and dp[j - 1][c - 1] < best: best, bi = dp[j - 1][c - 1], c - 1
            if best < INF: dp[j][c] = best + cost(j, c); bk[j][c] = bi
    c = min(range(m), key=lambda c: dp[n - 2][c]); chosen = [c]
    for j in range(n - 2, 0, -1): c = bk[j][c]; chosen.append(c)
    chosen = chosen[::-1]
    bounds, s0 = [], a0
    for c in chosen: bounds.append((s0, runs[c][0])); s0 = runs[c][1]
    bounds.append((s0, a1 + 1))
    pad = 4
    return [(max(0, b0 - pad) * hop, min(len(x), (b1 + pad) * hop)) for b0, b1 in bounds], [ln[c] / 100 for c in chosen]

def build(lang):
    voice = np.zeros(int((VIDEO_DUR + 1) * SR), np.float32)
    report = []
    hp = butter(2, 80, 'high', fs=SR, output='sos')
    for k, sc in enumerate(ORDER):
        ids = GROUPS[sc]; n = len(ids)
        cands = [v for key, v in TAKES.items() if key.startswith(f'{lang}_{sc}_')]
        take = min(cands, key=lambda v: v['dur'])
        x = sosfilt(hp, pcm(f'{FETCH}/{take["file"]}')).astype(np.float32)
        segs, pauses = segments(x, n, [len(TR[lang][i]) for i in ids])
        parts = [x[a:b] for a, b in segs]
        starts = [SENT[i][0]['s'] for i in ids]
        limit = (SENT[GROUPS[ORDER[k + 1]][0]][0]['s'] - 0.35) if k + 1 < len(ORDER) else TL['total'] - 14.0
        gap = 0.22
        need = sum(len(p) for p in parts) / SR + gap * (n - 1)
        window = limit - starts[0]
        f = min(1.2, max(1.0, need / (window * 0.96)))
        L0 = [len(p) / SR for p in parts]
        t_prev = -1e9; placed = []; fs = []
        for j in range(n):
            rest = sum(L0[j + 1:]) / f + gap * (n - 1 - j)
            latest = limit - (L0[j] / f + rest)
            t = max(starts[j], t_prev + gap)
            t = max(min(t, latest), t_prev + gap)
            nxt = (starts[j + 1] - gap) if j + 1 < n else limit
            fj = min(CAP, max(f, L0[j] / max(0.3, nxt - t)))
            seg = tempo(parts[j], fj)
            i0 = int(t * SR); voice[i0:i0 + len(seg)] += seg
            placed.append(t); fs.append(fj); t_prev = t + len(seg) / SR
        STATS.setdefault(lang, []).extend(fs)
        if os.environ.get('DETAIL') == sc: print(sc, [(ids[j], round(placed[j]-starts[j],2), round(fs[j],2)) for j in range(n)])
        drift = [round(p - s, 2) for p, s in zip(placed, starts)]
        report.append(f'{sc:8s} take {take["file"]:22s} tempo x{f:.3f}-{max(fs):.2f}  window {window:5.1f}s need {need:5.1f}s  end {t_prev:6.1f}/{limit:6.1f}  max drift {max(drift):+.2f}s  shortest pause used {min(pauses):.2f}s')
    voice *= 0.5 / np.percentile(np.abs(voice[np.abs(voice) > 1e-4]), 99.9)
    bed = pcm(f'{A}/bed.wav')
    n = min(len(voice), len(bed)); mix = voice.copy(); mix[:n] += bed[:n]
    mix = np.tanh(mix * 1.2) / 1.2
    N = int(VIDEO_DUR * SR); mix = np.pad(mix, (0, max(0, N - len(mix))))[:N]
    os.makedirs(f'{A}/dub', exist_ok=True)
    raw = f'{A}/dub/{lang}_raw.wav'
    with wave.open(raw, 'wb') as wv:
        st = np.stack([mix, mix], 1)
        wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000',
                    '-c:a', 'aac', '-b:a', '192k', f'{A}/dub/The-Antikythera-Mechanism.{lang}.m4a'], check=True)
    return report

if __name__ == '__main__':
    for lang in sys.argv[1:]:
        print('==', lang); print('\n'.join(build(lang)))
        a = np.array(STATS[lang]); print('sentences', len(a), 'tempo>1.15:', int((a > 1.15).sum()), '>1.2:', int((a > 1.2).sum()), 'median', round(float(np.median(a)), 3))

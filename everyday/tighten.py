"""Make narr_<name>2: swap in the new bridge ending and shorten silences inside each take
to the playbook's 120-250 ms, remapping caption cues and animation marks to match.
Usage: python3 tighten.py pen
"""
import sys, os, json, shutil, numpy as np
sys.path.insert(0, '/home/claude/video')
import ttslib as T

E = '/home/claude/everyday'
KEEP = 0.22          # longest silence left inside a line (s)
MIN_SIL = 0.27       # only shorten silences longer than this
HOP = 120            # 5 ms frames at 24 kHz

def silence_runs(a):
    n = len(a) // HOP
    r = np.sqrt(np.mean(a[:n * HOP].reshape(n, HOP) ** 2, axis=1))
    r = np.convolve(r, np.ones(4) / 4, mode='same')
    thr = max(1e-4, 0.035 * np.percentile(r, 95))
    quiet = r < thr
    runs = []; i = 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            if i > 0 and j < n and (j - i) * HOP / T.SR > MIN_SIL:   # interior silences only
                runs.append((i * HOP, j * HOP))
            i = j
        else: i += 1
    return runs

def compress(a):
    runs = silence_runs(a)
    keep = int(KEEP * T.SR); half = keep // 2
    pieces = []; mp = [(0.0, 0.0)]; pos = 0; out_len = 0
    for s, e in runs:
        pieces.append(a[pos:s + half]); out_len += s + half - pos
        mp.append(((s + half) / T.SR, out_len / T.SR))
        pos = e - (keep - half)
        mp.append((pos / T.SR, out_len / T.SR))
    pieces.append(a[pos:]); out_len += len(a) - pos
    mp.append((len(a) / T.SR, out_len / T.SR))
    xs, ys = zip(*mp)
    remap = lambda t: float(np.interp(t, xs, ys))
    return np.concatenate(pieces).astype(np.float32), remap, sum(e - s - keep for s, e in runs) / T.SR

def main(name):
    src, cta = f'{E}/narr_{name}', f'{E}/narr_{name}_cta'
    dst = f'{E}/narr_{name}2'; os.makedirs(dst, exist_ok=True)
    narr = json.load(open(src + '.json'))
    new_end = json.load(open(cta + '.json'))['scenes'][0]
    new_end['lines'][0]['_dir'] = cta
    narr['scenes'][-1] = new_end
    saved = 0
    for sc in narr['scenes']:
        for line in sc['lines']:
            a = T.read_wav(os.path.join(line.pop('_dir', src), line['file']))
            b, remap, cut = compress(a); saved += cut
            T.write_wav(os.path.join(dst, line['file'] if sc is not new_end else 'cta.wav'), b)
            if sc is new_end: line['file'] = 'cta.wav'
            line['dur'] = len(b) / T.SR
            for c in line['cues']: c['s'], c['e'] = round(remap(c['s']), 3), round(remap(c['e']), 3)
            line['marks'] = {k: round(remap(v), 3) for k, v in line['marks'].items()}
    json.dump(narr, open(dst + '.json', 'w'), ensure_ascii=False, indent=1)
    print(f'{name}: removed {saved:.1f}s of in-line silence')

if __name__ == '__main__':
    main(sys.argv[1])

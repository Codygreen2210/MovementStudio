"""Record narration with take selection: several paces per sentence, keep the most expressive take.
Usage: python3 rec.py script2.json narr2 ; python3 rec.py short.json narr_short
"""
import sys, os, json, numpy as np
import ttslib as T

VOICE = T.voice_vec({'bm_fable': 1.0})
ROOT = os.path.dirname(os.path.abspath(__file__))

def f0_std(a, sr=24000):
    hop, win = int(0.01 * sr), int(0.04 * sr)
    f0 = []
    for s in range(0, len(a) - win, hop):
        x = a[s:s + win] * np.hanning(win)
        if np.sqrt(np.mean(x ** 2)) < 0.02: continue
        c = np.fft.irfft(np.abs(np.fft.rfft(x, 2 * win)) ** 2)[:win]
        lo, hi = int(sr / 300), int(sr / 65)
        if c[0] <= 0: continue
        lag = np.argmax(c[lo:hi]) + lo
        if c[lag] / c[0] < 0.45: continue
        f0.append(sr / lag)
    f0 = np.array(f0)
    if len(f0) < 5: return 0.0
    return float(np.std(12 * np.log2(f0 / np.median(f0))))

def main(script_path, name):
    script = json.load(open(os.path.join(ROOT, script_path)))
    outdir = os.path.join(ROOT, name); os.makedirs(outdir, exist_ok=True)
    manifest = []
    for si, sc in enumerate(script):
        S = {'id': sc['id'], 'lines': []}
        for li, line in enumerate(sc['lines']):
            say = line.get('say', line['cap']); pace = line.get('pace', 0.92)
            L = {'cap': line['cap'], 'sents': []}
            sents = T.sentences(say)
            for k, sent in enumerate(sents):
                ph = T.to_phonemes(sent)
                best = None
                for mul in (0.95, 1.0, 1.05):
                    a = T.trim(T.synth(ph, VOICE, pace * mul))
                    score = f0_std(a)
                    if best is None or score > best[0]:
                        best = (score, a, mul)
                score, a, mul = best
                a = a * (0.62 / max(1e-6, np.percentile(np.abs(a), 99.5)))
                fn = f's{si}_{li}_{k}.wav'
                T.write_wav(os.path.join(outdir, fn), a)
                L['sents'].append({'file': fn, 'dur': len(a) / T.SR, 'text': sent, 'score': round(score, 2), 'speed': round(pace * mul, 3)})
                print(f'{name}/{fn} {len(a)/T.SR:5.2f}s pitch-var {score:.2f} speed {pace*mul:.2f} | {sent[:60]}', flush=True)
            S['lines'].append(L)
        manifest.append(S)
    json.dump({'scenes': manifest}, open(os.path.join(ROOT, name + '.json'), 'w'), ensure_ascii=False, indent=1)
    print('done', name)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

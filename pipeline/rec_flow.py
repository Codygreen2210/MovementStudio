"""Record each line as ONE continuous take (natural flow across sentences), then locate
sentence boundaries and named marks in the audio for captions and visual sync.
Usage: python3 rec_flow.py short2.json narr_short2
"""
import sys, os, json, re, numpy as np
import ttslib as T
from rec import f0_std

ROOT = os.path.dirname(os.path.abspath(__file__))
VOICE = T.voice_vec({'bm_fable': 1.0})
TARGET_VAR = 3.8          # natural intonation range; avoids both flat and over-acted takes

def rms_frames(a, hop=240):
    n = len(a) // hop
    return np.sqrt(np.mean(a[:n * hop].reshape(n, hop) ** 2, axis=1)), hop

def snap_to_dip(a, t_est, win=0.45):
    r, hop = rms_frames(a)
    i0 = max(0, int((t_est - win) * T.SR / hop)); i1 = min(len(r), int((t_est + win) * T.SR / hop))
    if i1 <= i0: return t_est
    sm = np.convolve(r, np.ones(5) / 5, mode='same')
    w = sm[i0:i1] + np.abs(np.arange(i0, i1) - t_est * T.SR / hop) * 1e-4
    return float((i0 + np.argmin(w)) * hop / T.SR)

def char_time(text, idx, dur, lead=0.04):
    return lead + (dur - 2 * lead) * idx / max(1, len(text))

def main(script_path, name):
    script = json.load(open(os.path.join(ROOT, script_path)))
    outdir = os.path.join(ROOT, name); os.makedirs(outdir, exist_ok=True)
    manifest = []
    for si, sc in enumerate(script):
        S = {'id': sc['id'], 'lines': []}
        for li, line in enumerate(sc['lines']):
            say = line['say']; pace = line.get('pace', 1.0)
            ph = T.to_phonemes(say)
            takes = []
            for mul in (0.97, 1.0, 1.03):
                a = T.trim(T.synth(ph, VOICE, pace * mul))
                takes.append((abs(f0_std(a) - TARGET_VAR), a, mul))
            _, a, mul = min(takes, key=lambda x: x[0])
            a = a * (0.62 / max(1e-6, np.percentile(np.abs(a), 99.5)))
            dur = len(a) / T.SR
            fn = f'l{si}_{li}.wav'; T.write_wav(os.path.join(outdir, fn), a)
            # sentence boundaries -> caption cues
            sents = T.sentences(say); caps = T.sentences(line['cap'])
            if len(caps) != len(sents): caps = sents
            bounds = [0.0]; pos = 0
            for s in sents[:-1]:
                pos = say.index(s, pos) + len(s)
                bounds.append(snap_to_dip(a, char_time(say, pos, dur)))
            bounds.append(dur)
            cues = [{'s': round(bounds[i], 3), 'e': round(bounds[i + 1], 3), 'text': caps[i]} for i in range(len(sents))]
            marks = {k: round(snap_to_dip(a, char_time(say, say.index(v), dur), 0.3), 3) for k, v in line.get('marks', {}).items()}
            S['lines'].append({'cap': line['cap'], 'file': fn, 'dur': dur, 'cues': cues, 'marks': marks, 'speed': round(pace * mul, 3)})
            print(f'{name}/{fn} {dur:5.2f}s speed {pace*mul:.2f} marks {marks} cues {[c["s"] for c in cues]}', flush=True)
        manifest.append(S)
    json.dump({'scenes': manifest}, open(os.path.join(ROOT, name + '.json'), 'w'), ensure_ascii=False, indent=1)
    print('done', name)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

"""Turn the chosen ElevenLabs takes + word timings into narr.json:
cap long pauses, locate marks, build caption cues. Writes narr/<id>.wav (24 kHz) and narr.json."""
import json, re, sys, numpy as np
sys.path.insert(0, '/home/claude/video')
import ttslib as T

A = '/home/claude/anti'
TAKES = {'hook': 'hook_2', 'wreck': 'wreck_2', 'xray': 'xray_2', 'crank': 'crank_1', 'pinslot': 'pinslot_2',
         'back': 'back_1', 'planets': 'planets_1', 'who': 'who_2', 'bridge': 'bridge_1'}
MAXGAP, KEEPGAP = 0.80, 0.62     # cap inter-word silences longer than MAXGAP to KEEPGAP
# caption display: spoken words -> numerals
DISPLAY = [('nineteen oh one', '1901'), ('nineteen oh two', '1902'), ('nineteen hundred', '1900'),
           ('nineteen seventies', '1970s'), ('two thousand and five', '2005'), ('twenty sixteen', '2016'),
           ('twenty twenty-one', '2021'), ('forty-five metres', '45 metres'), ('seventy to sixty B.C.', '70–60 BC'),
           ('two hundred and twenty-three', '223'), ('two hundred and fifty-four', '254'), ('two hundred and thirty-five', '235'),
           ('four hundred and sixty-two', '462'), ('four hundred and forty-two', '442'), ('a hundred and twenty-seven', '127'),
           ('sixty-four', '64'), ('thirty-eight', '38'), ('forty-eight', '48'), ('twenty-four', '24'), ('thirty-two', '32'),
           ('twenty-seven', '27'), ('eighty-two', '82'), ('eight point eight eight', '8.88'), ('two thousand', '2,000')]
norm = lambda w: re.sub(r"[^a-z0-9']", '', w.lower().replace('’', "'"))

def main():
    script = {s['id']: s for s in json.load(open(f'{A}/script.json'))}
    words_all = json.load(open(f'{A}/words.json'))
    out = {'scenes': []}
    for sid, take in TAKES.items():
        a = T.read_wav(f'{A}/narr/{take}.wav')
        W = [dict(w) for w in words_all[sid]['words']]
        # trim leading silence to 60 ms before first word
        lead = max(0.0, W[0]['start'] - 0.06)
        # build time map with capped gaps
        xs, ys = [0.0, lead], [0.0, 0.0]
        cut = lead
        for i in range(len(W) - 1):
            g0, g1 = W[i]['end'], W[i + 1]['start']
            if g1 - g0 > MAXGAP:
                k0 = g0 + KEEPGAP / 2; k1 = g1 - KEEPGAP / 2
                xs += [k0, k1]; ys += [k0 - cut, k0 - cut]
                cut += k1 - k0
        end = min(len(a) / T.SR, W[-1]['end'] + 0.35)
        xs.append(end); ys.append(end - cut)
        remap = lambda t: float(np.interp(t, xs, ys))
        # rebuild audio by keeping the segments between cuts
        keep = []; t = lead
        for j in range(2, len(xs) - 1, 2):
            keep.append((t, xs[j])); t = xs[j + 1]
        keep.append((t, end))
        b = np.concatenate([a[int(s * T.SR):int(e * T.SR)] for s, e in keep]).astype(np.float32)
        fade = int(0.004 * T.SR)
        T.write_wav(f'{A}/narr/{sid}.wav', b)
        import subprocess, wave
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f'/home/claude/movementstudio/antikythera/fetch/out/{take}.mp3', '-ar', '48000', '-ac', '1', '-f', 'f32le', '-'], capture_output=True).stdout
        a48 = np.frombuffer(raw, np.float32)
        b48 = np.concatenate([a48[int(s0 * 48000):int(e0 * 48000)] for s0, e0 in keep])
        with wave.open(f'{A}/narr/{sid}_48.wav', 'wb') as wv:
            wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(48000); wv.writeframes((np.clip(b48, -1, 1) * 32767).astype(np.int16).tobytes())
        for w in W: w['s'] = round(remap(w['start']), 3); w['e'] = round(remap(w['end']), 3)
        # marks: first word of each phrase
        toks = [norm(w['text']) for w in W]
        marks = {}
        for k, phrase in script[sid]['marks'].items():
            p = [norm(x) for x in phrase.split()]
            p = [x for x in p if x]
            hit = None
            for i in range(len(toks) - len(p) + 1):
                if toks[i:i + len(p)] == p: hit = i; break
            if hit is None:
                for i in range(len(toks)):
                    if toks[i] == p[0]: hit = i; break
                print('  loose match', sid, k, phrase, '->', hit)
            marks[k] = W[hit]['s'] if hit is not None else None
        # caption cues: split at sentence ends / commas, 3..9 words
        cues, cur = [], []
        for w in W:
            cur.append(w)
            txt = w['text']
            if txt.endswith(('.', '?', '!')) or (txt.endswith((',', ':')) and len(cur) >= 4) or len(cur) >= 9:
                cues.append(cur); cur = []
        if cur: cues.append(cur)
        cue_out = []
        for c in cues:
            text = ' '.join(w['text'] for w in c)
            for a_, b_ in DISPLAY: text = re.sub(r'\b' + re.escape(a_) + r'\b', b_, text, flags=re.I)
            cue_out.append({'s': c[0]['s'], 'e': c[-1]['e'], 'text': text})
        out['scenes'].append({'id': sid, 'lines': [{'file': f'{sid}.wav', 'dur': round(len(b) / T.SR, 3), 'marks': marks, 'cues': cue_out,
                                                     'words': [{'t': w['text'], 's': w['s'], 'e': w['e']} for w in W]}]})
        print(f'{sid:8s} {len(a)/T.SR:6.2f}s -> {len(b)/T.SR:6.2f}s  marks {len([m for m in marks.values() if m is not None])}/{len(marks)}')
    json.dump(out, open(f'{A}/narr.json', 'w'), indent=1, ensure_ascii=False)

if __name__ == '__main__':
    main()

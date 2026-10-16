"""Shorts v2: each Short opens with a standalone spoken setup (new ElevenLabs line over establishing
footage + the film's no-voice sound bed), then crossfades into the excerpt from the film.
Short 02 already opens the film cold, so it is re-used as is."""
import json, re, subprocess, os, sys, wave, numpy as np
from scipy.signal import butter, sosfilt
sys.path.insert(0, '/home/claude/anti')
from make_shorts import NUM, ass_time, norm
A = '/home/claude/anti'; SR = 48000
SRC = f'{A}/The Antikythera Mechanism.mp4'
W = json.load(open(f'{A}/tl.json'))['words']
IW = json.load(open(f'{A}/intro_words.json'))
FETCH = '/home/claude/movementstudio/antikythera/fetch/out'
XF = 0.25          # crossfade intro -> excerpt
# name, intro id, footage start, footage end (None = play at normal speed), excerpt start phrase, end word, hold, hook, title
SHORTS = [
    ('01-gear-math', '01', 149.3, None, 'the Moon goes', 'Exactly.', 1.8, 'THE 254 ÷ 19 TRICK', 'This 2,000-Year-Old Gear Math Is Perfect'),
    ('03-pin-and-slot', '03', 168.5, None, 'We now know', 'ago.', 1.4, 'VARIABLE-SPEED GEARS', 'Ancient Greeks Built Variable-Speed Gears'),
    ('04-eclipse-predictor', '04', 279.0, None, 'Two hundred and twenty-three months', 'ahead.', 2.6, 'IT PREDICTED ECLIPSES', 'The Ancient Machine That Predicted Eclipses'),
    ('05-it-vanished', '05', 1.3, None, 'For well over', 'place.', 1.4, 'THEN IT VANISHED', 'This Technology Vanished for 1,000 Years'),
    ('06-sponge-divers', '06', 37.0, 43.5, 'They took shelter', 'wheel.', 1.2, 'FOUND BY SPONGE DIVERS', 'How Sponge Divers Found an Ancient Computer'),
]

def pcm(path, ss=None, t=None, ch=1):
    cmd = ['ffmpeg', '-loglevel', 'error']
    if ss is not None: cmd += ['-ss', f'{ss:.3f}']
    if t is not None: cmd += ['-t', f'{t:.3f}']
    cmd += ['-i', path, '-ar', str(SR), '-ac', str(ch), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()

def rms(x): x = x[np.abs(x) > 1e-4]; return float(np.sqrt(np.mean(x ** 2) + 1e-12))

# master loudness gain: the published mix was loudness-normalised after mix.wav; measure it once
_g = None
def master_gain():
    global _g
    if _g is None:
        a, b = 60.0, 140.0
        _g = rms(pcm(SRC, a, b - a)) / rms(pcm(f'{A}/mix.wav', a, b - a))
    return _g

def write_wav(path, x):
    st = np.stack([x, x], 1)
    with wave.open(path, 'wb') as wv:
        wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())

def intro_audio(iid, v0, Di):
    v = pcm(f'{FETCH}/intro{iid}.mp3')
    v = sosfilt(butter(2, 80, 'high', fs=SR, output='sos'), v).astype(np.float32)
    v *= 0.5 / np.percentile(np.abs(v[np.abs(v) > 1e-4]), 99.9)        # same voice level as the film (audio.py)
    n = int(Di * SR)
    bed = pcm(f'{A}/bed.wav', v0, Di)[:n]
    bed = np.pad(bed, (0, n - len(bed)))
    lead = int(0.25 * SR)                                                 # let the bed breathe before the first word
    voice = np.zeros(n, np.float32); m = min(len(v), n - lead); voice[lead:lead + m] = v[:m]
    mix = np.tanh((voice + bed) * 1.2) / 1.2
    return mix * master_gain(), 0.25

def find(phrase):
    p = [norm(x) for x in phrase.split()]
    return next(i for i in range(len(W)) if [norm(W[j]['t']) for j in range(i, i + len(p))] == p)

def caption_events(words):
    """words: list of dict t,s,e in output time. Same grouping as make_shorts, numerals for spoken numbers."""
    lines, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= 4 or len(' '.join(x['t'] for x in cur)) > 20 or w['t'][-1] in '.,?!:;': lines.append(cur); cur = []
    if cur: lines.append(cur)
    ev = []
    for ln in lines:
        s, e = ln[0]['s'], ln[-1]['e'] + 0.12
        parts, prev = [], ln[0]['s']
        for w in ln:
            k = max(1, int(round((w['e'] - prev) * 100))); prev = w['e']
            parts.append(f'{{\\k{k}}}{w["t"]}')
        text = ' '.join(parts); plain = ' '.join(w['t'] for w in ln)
        for a, b in NUM:
            if re.search(r'\b' + re.escape(a) + r'\b', plain, re.I):
                plain = re.sub(r'\b' + re.escape(a) + r'\b', b, plain, flags=re.I); text = None
        if text is None: text = f'{{\\k{int((e - s) * 30)}}}' + plain
        ev.append((s, e, text))
    return ev

HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Hanken Grotesk,74,&H0074C2E8,&H00FFFFFF,&H00000000,&H96000000,1,0,0,0,100,100,0,0,1,7,3,8,60,60,1330,1
Style: Hook,Hanken Grotesk,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,1,0,0,0,100,100,1,0,1,8,4,8,60,60,300,1
Style: Kicker,IBM Plex Mono,30,&H0074C2E8,&H0074C2E8,&H00000000,&H00000000,0,0,0,0,100,100,6,0,1,3,0,8,60,60,236,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

def make(name, iid, v0, v1, phrase, endword, hold, hook, title):
    iw = IW[iid]
    Di = iw[-1][2] + 0.25 + 0.45 + XF                                    # lead + words + pause + overlap
    i0 = find(phrase)
    t0 = max(W[i0 - 1]['e'] + 0.03, W[i0]['s'] - 0.2)
    i1 = next(i for i in range(i0, len(W)) if W[i]['t'] == endword)
    t1 = W[i1]['e'] + hold
    dur = Di + (t1 - t0) - XF
    off = Di - XF
    # audio
    ia, lead = intro_audio(iid, v0, Di)
    ca = pcm(SRC, t0, t1 - t0)
    nx = int(XF * SR); fin = np.linspace(0, 1, nx, dtype=np.float32)
    out = np.concatenate([ia[:-nx], ia[-nx:] * (1 - fin) + ca[:nx] * fin, ca[nx:]])
    wav = f'{A}/shorts2/{name}.wav'; write_wav(wav, out)
    # captions (output time)
    words = [{'t': t, 's': s + lead, 'e': e + lead} for t, s, e in iw]
    cw = [{'t': w['t'], 's': w['s'] - t0 + off, 'e': w['e'] - t0 + off} for w in W[i0:i1 + 1]]
    cw[0]['t'] = cw[0]['t'][0].upper() + cw[0]['t'][1:]
    ass = f'{A}/shorts2/{name}.ass'
    lines = [f'Dialogue: 0,{ass_time(0)},{ass_time(dur)},Kicker,,0,0,0,,THE ANTIKYTHERA MECHANISM',
             f'Dialogue: 0,{ass_time(0)},{ass_time(dur)},Hook,,0,0,0,,{{\\fad(150,0)}}{hook}']
    for s, e, text in caption_events(words + cw):
        lines.append(f'Dialogue: 1,{ass_time(max(0, s))},{ass_time(min(dur, e))},Cap,,0,0,0,,{text}')
    open(ass, 'w').write(HEAD + '\n'.join(lines) + '\n')
    # video: establishing footage (optionally slowed to fit) -> xfade -> excerpt -> vertical layout
    span = (v1 - v0) if v1 else Di
    speed = span / Di
    slow = f"setpts=(PTS-STARTPTS)/{speed:.5f},framerate=fps=30:interp_start=0:interp_end=255:scene=100" if speed < 0.97 else "fps=30,setpts=PTS-STARTPTS"
    intro_v = f"[0:v]{slow},trim=0:{Di:.3f},setpts=PTS-STARTPTS[iv]"
    fc = (intro_v + ";[1:v]fps=30,setpts=PTS-STARTPTS[cv];"
          f"[iv][cv]xfade=transition=fade:duration={XF}:offset={off:.3f},split=2[a][b];"
          "[a]scale=-2:1920,crop=1080:1920,boxblur=28:3,eq=brightness=-0.22:saturation=0.8[bg];"
          "[b]crop=1620:1080:150:0,scale=1080:720:flags=lanczos[fg];[bg][fg]overlay=0:560,"
          f"ass={ass}:fontsdir=/home/claude/video/fonts,fade=t=in:st=0:d=0.25,fade=t=out:st={dur - 0.35:.2f}:d=0.35[v]")
    af = f"afade=t=in:st=0:d=0.15,afade=t=out:st={dur - 0.4:.2f}:d=0.4,loudnorm=I=-14:TP=-1.5:LRA=11"
    mp4 = f'{A}/shorts2/{name}.mp4'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y',
                    '-ss', f'{v0:.3f}', '-t', f'{span + 0.5:.3f}', '-i', SRC,
                    '-ss', f'{t0:.3f}', '-t', f'{t1 - t0:.3f}', '-i', SRC,
                    '-i', wav, '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-af', af,
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30',
                    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', f'{dur:.3f}', '-movflags', '+faststart', mp4], check=True)
    print(f'{name}: intro {Di:.1f}s (footage {v0}->{v0 + span:.1f}, x{speed:.2f}) + excerpt {t0:.2f}-{t1:.2f} = {dur:.1f}s')
    return {'file': mp4, 'dur': round(dur, 1), 'hook': hook, 'title': title, 'intro': ' '.join(w[0] for w in iw), 'excerpt_start': round(t0, 2)}

if __name__ == '__main__':
    os.makedirs(f'{A}/shorts2', exist_ok=True)
    pick = sys.argv[1:] or [s[0] for s in SHORTS]
    res = [make(*s) for s in SHORTS if s[0] in pick]
    old = {}
    p = f'{A}/shorts2/shorts.json'
    if os.path.exists(p): old = {r['file']: r for r in json.load(open(p))}
    for r in res: old[r['file']] = r
    json.dump(sorted(old.values(), key=lambda r: r['file']), open(p, 'w'), indent=1, ensure_ascii=False)

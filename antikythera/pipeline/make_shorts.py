"""Cut vertical Shorts (1080x1920) from the Antikythera master with burned, word-timed captions."""
import json, re, subprocess, os
A = '/home/claude/anti'
SRC = f'{A}/The Antikythera Mechanism.mp4'
TL = json.load(open(f'{A}/tl.json'))
W = TL['words']
NUM = [('nineteen oh one', '1901'), ('nineteen oh two', '1902'), ('nineteen hundred', '1900'), ('two thousand and five', '2005'),
       ('two hundred and twenty-three', '223'), ('two hundred and fifty-four', '254'), ('two hundred and thirty-five', '235'),
       ('a hundred and twenty-seven', '127'), ('sixty-four', '64'), ('thirty-eight', '38'), ('forty-eight', '48'), ('twenty-four', '24'),
       ('thirty-two', '32'), ('twenty-seven', '27'), ('eight point eight eight', '8.88'), ('two thousand', '2,000'), ('forty-five', '45'),
       ('seventy to sixty', '70–60'), ('thirteen', '13'), ('nineteen', '19'), ('eighteen', '18')]
SHORTS = [
    ('01-gear-math', ('But', 'the', 'Moon', 'goes'), 'Exactly.', 1.8, 'THE 254 ÷ 19 TRICK', 'This 2,000-Year-Old Gear Math Is Perfect'),
    ('02-shipwreck-computer', None, 'work?', 2.6, 'BUILT 2,000 YEARS AGO', 'Divers Found This Inside a Shipwreck'),
    ('03-pin-and-slot', ('But', 'the', 'Moon', 'has'), 'ago.', 1.4, 'VARIABLE-SPEED GEARS', 'Ancient Greeks Built Variable-Speed Gears'),
    ('04-eclipse-predictor', ('The', 'lower', 'spiral'), 'ahead.', 2.6, 'IT PREDICTED ECLIPSES', 'The Ancient Machine That Predicted Eclipses'),
    ('05-it-vanished', ('What', 'we', 'do', 'know'), 'place.', 1.4, 'THEN IT VANISHED', 'This Technology Vanished for 1,000 Years'),
    ('06-sponge-divers', ('In', 'the', 'spring'), 'wheel.', 1.2, 'FOUND BY SPONGE DIVERS', 'How Sponge Divers Found an Ancient Computer'),
]
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())

def locate(start, endword, after):
    if start is None: i0 = 0; t0 = 0.0
    else:
        st = [norm(x) for x in start]
        i0 = next(i for i in range(len(W)) if [norm(W[j]['t']) for j in range(i, i + len(st))] == st)
        t0 = max(0, W[i0]['s'] - 0.25)
        if start[0] == 'In': t0 = 36.4                                    # open on the storm painting
    i1 = next(i for i in range(i0, len(W)) if W[i]['t'] == endword)
    return i0, i1, t0, W[i1]['e'] + after

def ass_time(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f'{h}:{m:02d}:{s:05.2f}'
def caption_lines(ws, t0):
    # group words into short lines (<= 4 words or ~22 chars), break at punctuation
    lines, cur = [], []
    for w in ws:
        cur.append(w)
        txt = ' '.join(x['t'] for x in cur)
        if len(cur) >= 4 or len(txt) > 20 or w['t'][-1] in '.,?!:;': lines.append(cur); cur = []
    if cur: lines.append(cur)
    ev = []
    for ln in lines:
        s, e = ln[0]['s'] - t0, ln[-1]['e'] - t0 + 0.12
        parts = []
        prev = ln[0]['s']
        for w in ln:
            k = max(1, int(round((w['e'] - prev) * 100))); prev = w['e']
            parts.append(f'{{\\k{k}}}{w["t"]}')
        text = ' '.join(parts)
        plain = ' '.join(w['t'] for w in ln)
        for a, b in NUM:
            if re.search(r'\b' + re.escape(a) + r'\b', plain, re.I):
                # numbers: show as numerals, drop karaoke timing inside the phrase
                plain = re.sub(r'\b' + re.escape(a) + r'\b', b, plain, flags=re.I); text = None
        if text is None: text = f'{{\\k{int((e - s) * 30)}}}' + plain
        ev.append((s, e, text))
    return ev

def make(name, start, endword, after, hook, title):
    i0, i1, t0, t1 = locate(start, endword, after)
    dur = t1 - t0
    ass = f'{A}/shorts/{name}.ass'
    head = f"""[Script Info]
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
    lines = [f'Dialogue: 0,{ass_time(0)},{ass_time(dur)},Kicker,,0,0,0,,THE ANTIKYTHERA MECHANISM',
             f'Dialogue: 0,{ass_time(0)},{ass_time(dur)},Hook,,0,0,0,,{{\\fad(150,0)}}{hook}']
    for s, e, text in caption_lines(W[i0:i1 + 1], t0):
        lines.append(f'Dialogue: 1,{ass_time(max(0, s))},{ass_time(min(dur, e))},Cap,,0,0,0,,{text}')
    open(ass, 'w').write(head + '\n'.join(lines) + '\n')
    out = f'{A}/shorts/{name}.mp4'
    fc = ("[0:v]split=2[a][b];[a]scale=-2:1920,crop=1080:1920,boxblur=28:3,eq=brightness=-0.22:saturation=0.8[bg];"
          "[b]crop=1620:1080:150:0,scale=1080:720:flags=lanczos[fg];[bg][fg]overlay=0:560,"
          f"ass={ass}:fontsdir=/home/claude/video/fonts,fade=t=in:st=0:d=0.25,fade=t=out:st={dur - 0.35:.2f}:d=0.35[v]")
    af = f"afade=t=in:st=0:d=0.2,afade=t=out:st={dur - 0.4:.2f}:d=0.4,loudnorm=I=-14:TP=-1.5:LRA=11"
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{t0:.3f}', '-t', f'{dur:.3f}', '-i', SRC, '-filter_complex', fc, '-map', '[v]', '-map', '0:a',
                    '-af', af, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-movflags', '+faststart', out], check=True)
    print(f'{name}: {t0:.2f}-{t1:.2f} ({dur:.1f}s) -> {title}')
    return {'file': out, 'start': round(t0, 2), 'dur': round(dur, 1), 'hook': hook, 'title': title}

if __name__ == '__main__':
    os.makedirs(f'{A}/shorts', exist_ok=True)
    import sys
    pick = sys.argv[1:] or [s[0] for s in SHORTS]
    res = [make(*s) for s in SHORTS if s[0] in pick]
    json.dump(res, open(f'{A}/shorts/shorts.json', 'w'), indent=1)

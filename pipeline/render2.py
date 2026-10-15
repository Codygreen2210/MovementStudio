"""Calibre 3235 film v2 — timeline, frames, sound design, captions.
Usage: python3 render2.py long|short timeline|preview N..|frames|audio|srt
"""
import json, os, sys, base64, subprocess, asyncio, time, re
import numpy as np
import ttslib as TT
ROOT = os.path.dirname(os.path.abspath(__file__))
J = lambda p: os.path.join(ROOT, p)
FPS, SR = 30, 24000
FMT = {
    'long': {'w': 1920, 'h': 1080, 'narr': 'narr2', 'script': 'script2.json', 'tail': 0.9,
             'lead': {'hook': 0.45, 'watch': 1.0, 'calibre': 1.2, 'stack': 2.0, 'dial': 2.2, 'finale': 1.6},
             'after': {('hook', 1): 0.3, ('watch', 1): 0.3, ('watch', 2): 1.3, ('watch', 3): 1.9}},
    'short2': {'w': 1080, 'h': 1920, 'narr': 'narr_short2', 'script': 'short2.json', 'tail': 0.3, 'flow': True,
              'lead': {'s_hook': 0.3, 's_end': 0.45},
              'after': {('s_watch', 0): 1.7, ('s_rotor', 0): 0.7, ('s_esc', 0): 0.6}},
    'short': {'w': 1080, 'h': 1920, 'narr': 'narr_short', 'script': 'short.json', 'tail': 0.45,
              'lead': {'s_hook': 0.35, 's_watch': 0.7, 's_end': 0.5},
              'after': {('s_watch', 0): 2.2, ('s_rotor', 0): 0.6}},
}

def chunk_cue(c, maxw=7):
    words = c['text'].split()
    if len(words) <= maxw: return [c]
    parts, cur = [], []
    for w in words:
        cur.append(w)
        FUNC = {'a', 'an', 'the', 'of', 'in', 'is', 'and', 'on', 'to', 'at', 'it', 'its', 'your', 'this', 'that', 'which', 'times', 'about', 'every', 'little', 'once', 'four', 'blue', 'swings', 'beats', 'half'}
        if (len(cur) >= 3 and w.endswith(',')) or (len(cur) >= maxw and w.lower().strip(',.') not in FUNC) or len(cur) >= maxw + 3: parts.append(cur); cur = []
    if cur:
        if len(cur) <= 2 and parts: parts[-1] += cur
        else: parts.append(cur)
    tot = sum(len(' '.join(p)) for p in parts); t = c['s']; out = []
    for p in parts:
        d = (c['e'] - c['s']) * len(' '.join(p)) / tot
        out.append({'s': round(t, 3), 'e': round(t + d, 3), 'text': ' '.join(p)}); t += d
    return out

def build_flow_timeline(fmt):
    F = FMT[fmt]
    narr = json.load(open(J(F['narr'] + '.json')))
    t = 0.0; scenes = []; clips = []; cues = []
    for sc in narr['scenes']:
        S = {'id': sc['id'], 'start': round(t, 3), 'lines': [], 'marks': {}}
        t += F['lead'].get(sc['id'], 0.55)
        for li, line in enumerate(sc['lines']):
            S['lines'].append(round(t, 3))
            clips.append((round(t, 3), F['narr'] + '/' + line['file']))
            for c in line['cues']:
                cues += chunk_cue({'s': t + c['s'], 'e': t + c['e'], 'text': c['text']})
            for k, v in line['marks'].items(): S['marks'][k] = round(t + v, 3)
            t += line['dur'] + F['after'].get((sc['id'], li), 0)
            if li < len(sc['lines']) - 1: t += 0.25
        t += F['tail']
        scenes.append(S)
    for i, S in enumerate(scenes):
        S['end'] = scenes[i + 1]['start'] if i + 1 < len(scenes) else None
    total = t + 1.6; scenes[-1]['end'] = total
    tl = {'fps': FPS, 'scenes': scenes, 'endStart': None, 'total': round(total, 3), 'frames': int(total * FPS), 'clips': clips, 'cues': cues}
    json.dump(tl, open(J(f'tl_{fmt}.json'), 'w'), indent=1, ensure_ascii=False)
    print(f'{fmt}: total {total:.1f}s, {tl["frames"]} frames')
    for S in scenes: print(f"  {S['start']:5.1f}s  {S['id']}  marks {S['marks']}")
    return tl

def build_timeline(fmt):
    F = FMT[fmt]
    if F.get('flow'): return build_flow_timeline(fmt)
    narr = json.load(open(J(F['narr'] + '.json')))
    script = json.load(open(J(F['script'])))
    t = 0.0; scenes = []; clips = []; cues = []
    for si, sc in enumerate(narr['scenes']):
        S = {'id': sc['id'], 'start': round(t, 3), 'lines': []}
        t += F['lead'].get(sc['id'], 0.9 if fmt == 'short' else 1.35)
        for li, line in enumerate(sc['lines']):
            S['lines'].append(round(t, 3))
            sents = line['sents']
            caps = [x.strip() for x in re.findall(r'[^.!?]+[.!?]+["”’]?|[^.!?]+$', line['cap']) if x.strip()]
            for k, s in enumerate(sents):
                clips.append((round(t, 3), F['narr'] + '/' + s['file']))
                if sc['id'] == 'dial' and li == 2 and s['text'].startswith('It jumps'):
                    S['jump'] = round(t, 3)
                text = caps[k] if len(caps) == len(sents) else s['text'].replace('…', '…')
                cues.append({'s': round(t, 3), 'e': round(t + s['dur'], 3), 'text': text})
                t += s['dur']
                if k < len(sents) - 1:
                    t += 0.5 if s['dur'] < 1.3 else 0.3
            t += F['after'].get((sc['id'], li), 0)
            if li < len(sc['lines']) - 1:
                t += 0.5
        t += F['tail']
        scenes.append(S)
    for i, S in enumerate(scenes):
        S['end'] = scenes[i + 1]['start'] if i + 1 < len(scenes) else None
    if fmt == 'long':
        end_start = t + 0.6
        scenes[-1]['end'] = end_start
        total = end_start + 6.0
    else:
        end_start = None
        total = t + 1.6
        scenes[-1]['end'] = total
    tl = {'fps': FPS, 'scenes': scenes, 'endStart': end_start and round(end_start, 3), 'total': round(total, 3),
          'frames': int(total * FPS), 'clips': clips, 'cues': cues}
    json.dump(tl, open(J(f'tl_{fmt}.json'), 'w'), indent=1, ensure_ascii=False)
    print(f'{fmt}: total {total:.1f}s, {tl["frames"]} frames')
    for S in scenes:
        print(f"  {int(S['start'] // 60)}:{int(S['start'] % 60):02d}  {S['id']}")
    return tl

async def open_page(fmt):
    from playwright.async_api import async_playwright
    tl = json.load(open(J(f'tl_{fmt}.json')))
    F = FMT[fmt]
    pw = await async_playwright().start()
    b = await pw.chromium.launch(args=['--allow-file-access-from-files'])
    pg = await b.new_page(viewport={'width': 800, 'height': 600})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    tl_js = {k: v for k, v in tl.items() if k != 'clips'}
    await pg.add_init_script('window.__TL = ' + json.dumps(tl_js) + '; window.__CFG = ' + json.dumps({'w': F['w'], 'h': F['h']}) + ';')
    await pg.goto('file://' + J('render2.html'))
    ok = await pg.evaluate('window.__init()')
    if errs or not all(ok):
        print('init problems:', errs, ok)
    return pw, b, pg, errs, tl

async def preview(fmt, frames):
    pw, b, pg, errs, tl = await open_page(fmt)
    want = set(frames); out = []
    for i in range(0, max(want) + 1):
        url = await pg.evaluate(f'window.__advance({i}, {str(i in want).lower()})')
        if i in want:
            p = J(f'pv_{fmt}_{i}.jpg'); open(p, 'wb').write(base64.b64decode(url.split(',', 1)[1])); out.append(p)
    print(errs); print(' '.join(out))
    await b.close(); await pw.stop()

async def frames(fmt, a=0, stop=None, out=None):
    pw, b, pg, errs, tl = await open_page(fmt)
    out = J(out or f'{fmt}_noaudio.mp4')
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', str(FPS), out], stdin=subprocess.PIPE)
    n = tl['frames'] if stop is None else stop; t0 = time.time()
    for i in range(a):
        await pg.evaluate(f'window.__advance({i}, false)')
    for i in range(a, n):
        url = await pg.evaluate(f'window.__advance({i}, true)')
        ff.stdin.write(base64.b64decode(url.split(',', 1)[1]))
        if i % 300 == 0:
            el = time.time() - t0
            print(f'{fmt} frame {i}/{n}  {el:.0f}s  eta {el / max(1, i) * (n - i):.0f}s', flush=True)
    json.dump({'ticks': await pg.evaluate('window.__ticks()'), 'sfx': await pg.evaluate('window.__sfx()')}, open(J(f'events_{fmt}.json'), 'w'))
    ff.stdin.close(); ff.wait()
    print('errors:', errs, 'done', round(time.time() - t0))
    await b.close(); await pw.stop()

# ---------------- sound design ----------------
rng = np.random.default_rng(11)
def env_ad(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
def onepole_lp(x, cut):
    cut = np.broadcast_to(cut, x.shape)
    y = np.zeros_like(x); s = 0.0
    al = 1 - np.exp(-2 * np.pi * cut / SR)
    for i in range(len(x)):
        s += al[i] * (x[i] - s); y[i] = s
    return y
def whoosh(dur=0.95, peak=0.6, f0=300, f1=4200):
    n = int(dur * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n).astype(np.float32)
    k = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    cut = f0 + (f1 - f0) * np.sin(np.pi * np.clip(t / dur, 0, 1))
    y = onepole_lp(noise, cut) - onepole_lp(noise, cut * 0.25)
    return (y * k / (np.max(np.abs(y)) + 1e-6) * peak).astype(np.float32)
def ping(f, dur, dec, amp):
    n = int(dur * SR); t = np.arange(n) / SR
    return (amp * (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * np.exp(-t / dec)).astype(np.float32)
def click(f1=3400, f2=6100, amp=1.0):
    L = int(0.045 * SR); tt = np.arange(L) / SR
    c = 0.55 * np.sin(2 * np.pi * f1 * tt) * np.exp(-tt * 140) + 0.35 * np.sin(2 * np.pi * f2 * tt) * np.exp(-tt * 220)
    c += 0.5 * rng.standard_normal(L) * np.exp(-tt * 900)
    return (c * np.exp(-tt * 180) * 1.6 * amp).astype(np.float32)
def thump(amp=0.5):
    n = int(0.35 * SR); t = np.arange(n) / SR
    return (amp * np.sin(2 * np.pi * (90 * t - 40 * t * t)) * np.exp(-t * 14)).astype(np.float32)
def sfx_sound(kind):
    if kind == 'whoosh': return whoosh(1.0, 0.45)
    if kind == 'flip':
        a = whoosh(0.7, 0.55, 500, 6000); b = ping(2900, 0.9, 0.18, 0.12)
        out = np.zeros(max(len(a), len(b) + int(0.35 * SR)), np.float32); out[:len(a)] += a; out[int(0.35 * SR):int(0.35 * SR) + len(b)] += b; return out
    if kind == 'unscrew':
        out = np.zeros(int(2.4 * SR), np.float32)
        for i in range(9):
            s = int((0.1 + i * 0.16 + rng.random() * 0.03) * SR); c = click(2100 + rng.random() * 600, 4300, 0.55)
            out[s:s + len(c)] += c
        th = thump(0.55); s = int(1.65 * SR); out[s:s + len(th)] += th
        w = whoosh(0.8, 0.25, 200, 2500); out[s:s + len(w)] += w[:len(out) - s]
        return out
    if kind == 'date':
        c = click(4200, 7000, 1.0); p = ping(1568, 1.4, 0.35, 0.16) + ping(2349, 1.4, 0.3, 0.08)
        out = np.zeros(len(p), np.float32); out[:len(c)] += c; out += p; return out
    return np.zeros(10, np.float32)

def reverb(x, secs=2.2, wet=0.35):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = rng.standard_normal(n).astype(np.float32) * np.exp(-t * 3.2)
    ir = onepole_lp(ir, np.full(n, 3500.0)); ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n; N = 1 << (L - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[:len(x)]
    return (1 - wet) * x + wet * y.astype(np.float32)

def music(total):
    n = int(total * SR) + SR; out = np.zeros(n, np.float32)
    note = lambda m: 440 * 2 ** ((m - 69) / 12)
    chords = [[50, 57, 61, 64, 66], [47, 54, 57, 62, 64], [43, 50, 54, 57, 62], [45, 52, 57, 59, 61]]   # Dmaj9, Bm11, Gmaj9, Aadd9
    bar = 8.0
    t_all = np.arange(n) / SR
    for ci, start in enumerate(np.arange(0, total + bar, bar)):
        ch = chords[ci % 4]; s0 = int(start * SR); L = int((bar + 3.5) * SR)
        if s0 >= n: break
        L = min(L, n - s0); t = np.arange(L) / SR
        envp = np.minimum(1, t / 2.2) * np.where(t > bar, np.exp(-(t - bar) / 1.4), 1.0)
        pad = np.zeros(L, np.float32)
        for m in ch:
            f = note(m + 12)
            for h, amp in ((1, 1.0), (2, 0.35), (3, 0.12)):
                for det in (-0.12, 0.12):
                    pad += amp * np.sin(2 * np.pi * f * h * (1 + det / 100 * h) * t + rng.random() * 6)
        pad *= (1 + 0.15 * np.sin(2 * np.pi * 0.22 * t))
        out[s0:s0 + L] += 0.018 * pad * envp
        bass = np.sin(2 * np.pi * note(ch[0] - 12) * t) * np.minimum(1, t / 1.5) * np.where(t > bar, np.exp(-(t - bar) / 1.0), 1.0)
        out[s0:s0 + L] += 0.07 * bass
        # gentle plucked arpeggio, 80 bpm eighths
        step = 0.375
        for j, bt in enumerate(np.arange(0, bar, step)):
            if j % 4 == 3 and rng.random() < 0.5: continue
            m = ch[[0, 2, 4, 3, 1, 4, 2, 3][j % 8]] + 24
            p = ping(note(m), 1.6, 0.42, 0.05 * (0.75 + 0.25 * rng.random()))
            s = s0 + int(bt * SR)
            if s + len(p) < n: out[s:s + len(p)] += p
    out = reverb(out, 2.6, 0.45)
    return out

def audio(fmt):
    tl = json.load(open(J(f'tl_{fmt}.json')))
    ev = json.load(open(J(f'events_{fmt}.json')))
    n = int(tl['total'] * SR) + SR
    voice = np.zeros(n, np.float32)
    for t, f in tl['clips']:
        a = TT.read_wav(J(f)); s = int(t * SR); voice[s:s + len(a)] += a[:n - s]
    voice *= 0.9 / max(1e-6, np.max(np.abs(voice)))
    fx = np.zeros(n, np.float32)
    tick, tock = click(3400, 6100), click(2900, 5200)
    for t, odd, g in ev['ticks']:
        s = int(t * SR)
        if s + len(tick) < n: fx[s:s + len(tick)] += (tock if odd else tick) * g * 0.24
    for t, kind in ev['sfx']:
        x = sfx_sound(kind); s = int(t * SR); e = min(n, s + len(x)); fx[s:e] += x[:e - s]
    mus = music(tl['total'])[:n]
    if len(mus) < n: mus = np.pad(mus, (0, n - len(mus)))
    mus *= 0.5 / max(1e-6, np.percentile(np.abs(mus), 99.9))
    fade = np.ones(n, np.float32); fl = int(2.5 * SR); end = int(tl['total'] * SR)
    fade[max(0, end - fl):end] = np.linspace(1, 0, min(fl, end)); fade[end:] = 0
    fade[:int(0.5 * SR)] = np.linspace(0.3, 1, int(0.5 * SR))
    envv = np.convolve(np.abs(voice), np.ones(4800) / 4800, mode='same')
    duck = 1 - 0.55 * np.clip(envv / 0.04, 0, 1)
    duck = np.convolve(duck, np.ones(2400) / 2400, mode='same')
    mlev = 0.30 if fmt == 'long' else 0.42
    mix = voice + fx * (1 - 0.35 * np.clip(envv / 0.04, 0, 1)) + mus * mlev * duck * fade
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    TT.write_wav(J(f'mix_{fmt}.wav'), mix.astype(np.float32))
    print('mixed', fmt, len(ev['ticks']), 'ticks', len(ev['sfx']), 'sfx')

def fmt_t(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}'
def srt(fmt):
    tl = json.load(open(J(f'tl_{fmt}.json')))
    name = 'Inside the Calibre 3235' + (' (Short)' if fmt.startswith('short') else '') + '.en.srt'
    with open(J(name), 'w') as f:
        for i, c in enumerate(tl['cues'], 1):
            f.write(f"{i}\n{fmt_t(c['s'])} --> {fmt_t(c['e'] + 0.25)}\n{c['text']}\n\n")
    print(name, len(tl['cues']))

if __name__ == '__main__':
    fmt, cmd = sys.argv[1], sys.argv[2]
    if cmd == 'timeline': build_timeline(fmt)
    elif cmd == 'preview': asyncio.run(preview(fmt, [int(x) for x in sys.argv[3:]]))
    elif cmd == 'frames': asyncio.run(frames(fmt))
    elif cmd == 'segment': asyncio.run(frames(fmt, int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]))
    elif cmd == 'audio': audio(fmt)
    elif cmd == 'srt': srt(fmt)

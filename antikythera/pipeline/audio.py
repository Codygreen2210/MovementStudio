"""Antikythera film — sound: 48 kHz voice, score, ambiences, tactile foley, music drops. Writes mix.wav"""
import json, subprocess, sys, wave, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
A = '/home/claude/anti'; SR = 48000
TL = json.load(open(f'{A}/tl.json')); EV = json.load(open(f'{A}/sfx.json'))
N = int((TL['total'] + 2) * SR)
rng = np.random.default_rng(7)
SC = {s['id']: s for s in TL['scenes']}
mk = lambda sid, k: SC[sid]['marks'].get(k)

def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x).astype(np.float32)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x).astype(np.float32)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x).astype(np.float32)
def env(n, a, r): t = np.arange(n) / SR; return (np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)).astype(np.float32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def put(buf, t, x, g=1.0):
    s = int(t * SR); e = min(len(buf), s + len(x))
    if s < 0 or s >= len(buf): return
    buf[s:e] += x[:e - s] * g
def reverb(x, secs=2.4, wet=0.35, damp=5000):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = lp(rng.standard_normal(n).astype(np.float32) * np.exp(-t * 3.0), damp); ir /= np.sqrt(np.sum(ir ** 2))
    return ((1 - wet) * x + wet * fftconvolve(x, ir)[:len(x)]).astype(np.float32)

# ---------- foley ----------
def click(f1=3400, f2=6100, amp=1.0, d=0.05):
    n = int(d * SR); t = np.arange(n) / SR
    c = 0.55 * np.sin(2 * np.pi * f1 * t) * np.exp(-t * 150) + 0.35 * np.sin(2 * np.pi * f2 * t) * np.exp(-t * 240) + 0.5 * rng.standard_normal(n) * np.exp(-t * 900)
    return (c * amp).astype(np.float32)
def thud(amp=1.0): n = int(0.7 * SR); t = np.arange(n) / SR; return (amp * np.sin(2 * np.pi * (62 * t - 22 * t * t)) * np.exp(-t * 6) + 0.3 * lp(noise(0.7), 300) * np.exp(-t * 20)).astype(np.float32)
def slide(d=0.4, amp=0.5, f=1600): x = bp(noise(d), f * 0.5, f * 1.7); return (x * env(len(x), 0.03, d * 0.4) / (np.abs(x).max() + 1e-6) * amp).astype(np.float32)
def shimmer(d=2.2, amp=0.25):
    out = np.zeros(int(d * SR), np.float32); t = np.arange(len(out)) / SR
    for f in (2093, 2637, 3136, 3951, 4699): out += np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / (0.6 + rng.random()))
    return (out * np.minimum(1, t / 0.4) * amp / 5).astype(np.float32)
def ratchet(d=3.0, rate=11, amp=0.5):
    out = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * rate)): put(out, k / rate + rng.random() * 0.006, click(1700 + rng.random() * 500, 3600, 0.6), amp * (0.8 + 0.2 * rng.random()))
    return out
def sub(amp=1.0): n = int(2.0 * SR); t = np.arange(n) / SR; return (amp * 0.8 * np.sin(2 * np.pi * (48 * t - 6 * t * t)) * np.minimum(1, t / 0.08) * np.exp(-t * 1.6)).astype(np.float32)
def scan(d=1.8, amp=0.4): x = noise(d); t = np.arange(len(x)) / SR; f = 400 + 3000 * t / d; y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + bp(x, 2000, 6000) * 0.5; return (y * np.sin(np.pi * t / d) * amp).astype(np.float32)
def bell(amp=0.5):
    n = int(4 * SR); t = np.arange(n) / SR; out = np.zeros(n, np.float32)
    for f, a, r in ((392, 1, 2.2), (392 * 2.76, 0.4, 1.0), (392 * 5.4, 0.2, 0.5), (196, 0.5, 2.8)): out += a * np.sin(2 * np.pi * f * t) * np.exp(-t / r)
    return (out * amp * 0.25).astype(np.float32)
def sting():
    n = int(4.5 * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) for f in (73.4, 110, 146.8, 220)) * np.exp(-t / 1.8) * np.minimum(1, t / 0.02) * 0.18
    x[:int(2 * SR)] += sub(0.9); return x.astype(np.float32)
def eclipse_s(): n = int(5 * SR); t = np.arange(n) / SR; x = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((110, 164.8, 220, 329.6))) * np.sin(np.pi * t / 5) ** 2; return (x * 0.1).astype(np.float32)
def swell(): n = int(6 * SR); t = np.arange(n) / SR; x = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((146.8, 220, 293.7, 440, 587.3))) * (t / 6) ** 2 * np.exp(-np.maximum(0, t - 5) * 4); return (x * 0.09).astype(np.float32)
def whirr(d=2.0, amp=0.35): x = bp(noise(d), 300, 1800); t = np.arange(len(x)) / SR; return (x * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * np.sin(np.pi * t / d) * amp).astype(np.float32)
def tickloop(d=13.0, amp=0.32):
    out = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * 8)): put(out, k / 8, click(4200 if k % 2 else 3600, 7000, 0.5, 0.03), amp)
    return out
FOLEY = {'slide': lambda: slide(), 'sub': lambda: sub(), 'scan': lambda: scan(), 'thud': lambda: thud(), 'click': lambda: click(3900, 7200, 1.0),
         'tick3': lambda: np.concatenate([click(3600, 6800, 0.8), np.zeros(int(0.12 * SR), np.float32), click(3600, 6800, 0.7), np.zeros(int(0.12 * SR), np.float32), click(3600, 6800, 0.6)]),
         'sting': lambda: sting(), 'paper': lambda: slide(0.5, 0.4, 2600), 'glint': lambda: shimmer(1.6, 0.35), 'lightbox': lambda: np.concatenate([click(900, 2400, 0.9), slide(0.3, 0.15, 6000)]),
         'scanner': lambda: whirr(4.0, 0.3), 'whirr': lambda: whirr(), 'shimmer': lambda: shimmer(), 'ratchet': lambda: ratchet(), 'clack': lambda: click(2300, 4600, 1.0),
         'flip': lambda: np.concatenate([slide(0.3, 0.4, 1200), click(2100, 4200, 0.8)]), 'eclipse': lambda: eclipse_s(), 'swell': lambda: swell(), 'bell': lambda: bell(),
         'storm': lambda: np.zeros(10, np.float32), 'under': lambda: np.zeros(10, np.float32), 'tickloop': lambda: tickloop()}

# ---------- score: modal, dark, built from pads, pulse and a hand-plucked figure ----------
def ping(f, d, dec, amp): n = int(d * SR); t = np.arange(n) / SR; return (amp * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 5)) * np.exp(-t / dec)).astype(np.float32)
def score(total):
    note = lambda m: 440 * 2 ** ((m - 69) / 12)
    chords = [[45, 52, 59, 60, 64], [41, 48, 55, 57, 64], [48, 55, 59, 62, 64], [40, 47, 55, 59, 62]]   # Am(add9) Fmaj7 Cmaj9 Em7
    bar = 8.0; n = int(total * SR) + SR
    pads = np.zeros(n, np.float32); pl = np.zeros(n, np.float32); bass = np.zeros(n, np.float32)
    for ci, start in enumerate(np.arange(0, total + bar, bar)):
        ch = chords[ci % 4]; s0 = int(start * SR)
        if s0 >= n: break
        L = min(int((bar + 4) * SR), n - s0); t = np.arange(L) / SR
        ev = (np.minimum(1, t / 2.5) * np.where(t > bar, np.exp(-(t - bar) / 1.6), 1.0)).astype(np.float32)
        p = np.zeros(L, np.float32)
        for m in ch:
            f = note(m + 12)
            for h, a in ((1, 1), (2, 0.3), (3, 0.08)):
                for det in (-0.15, 0.15): p += a * np.sin(2 * np.pi * f * h * (1 + det / 100) * t + rng.random() * 6)
        pads[s0:s0 + L] += 0.012 * p * ev
        bass[s0:s0 + L] += (0.06 * np.sin(2 * np.pi * note(ch[0] - 12) * t) * ev).astype(np.float32)
        for j, bt in enumerate(np.arange(0, bar, 0.5)):
            if rng.random() < 0.3: continue
            m = ch[[0, 2, 4, 3, 1, 4, 2, 3][j % 8]] + 24
            put(pl, start + bt, ping(note(m), 1.8, 0.5, 0.04 * (0.7 + 0.3 * rng.random())))
    pads = lp(pads, 3500); pl = reverb(pl, 2.8, 0.5)
    return pads, pl, bass

def main():
    # voice at 48 kHz from the source takes, cut exactly like prep_narr did
    voice = np.zeros(N, np.float32)
    for t, f in TL['clips']:
        sid = f.split('/')[-1][:-4]
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f'{A}/narr/{sid}_48.wav', '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'], capture_output=True).stdout
        put(voice, t, np.frombuffer(raw, np.float32))
    voice = hp(voice, 80)
    pk = np.percentile(np.abs(voice[voice != 0]), 99.9); voice *= 0.5 / pk
    venv = np.convolve(np.abs(voice), np.ones(4800) / 4800, mode='same')
    # score with scene intensity
    pads, pl, bass = score(TL['total'])
    pads, pl, bass = [np.pad(x, (0, max(0, N - len(x))))[:N] for x in (pads, pl, bass)]
    inten = np.zeros(N, np.float32)
    lev = {'hook': 0.9, 'title': 1.2, 'wreck': 0.55, 'xray': 0.75, 'crank': 0.9, 'pinslot': 0.85, 'back': 0.95, 'planets': 1.0, 'who': 0.7, 'bridge': 0.95, 'end': 1.15}
    for s in TL['scenes']: inten[int(s['start'] * SR):int(s['end'] * SR)] = lev[s['id']]
    inten = np.convolve(inten, np.ones(SR * 2) / (SR * 2), mode='same')
    mus = (pads * 1.0 + pl * 1.0 + bass) * inten
    # music drops: cut 2 frames before a reveal, bring back on the next bar
    drop = np.ones(N, np.float32)
    for sid, k, hold in [('hook', 'inside', 1.3), ('crank', 'exact', 1.0), ('who', 'nothing', 3.2), ('planets', 'cosmos', 0.6), ('bridge', 'open', 0.8)]:
        t0 = mk(sid, k)
        if t0 is None: continue
        s = int((t0 - 2 / 30) * SR); r = int(0.05 * SR); h = int(hold * SR); b = int(0.9 * SR)
        drop[s - r:s] = np.minimum(drop[s - r:s], np.linspace(1, 0, r)); drop[s:s + h] = 0
        drop[s + h:s + h + b] = np.minimum(drop[s + h:s + h + b], np.linspace(0, 1, b))
    duck = 1 - 0.5 * np.clip(venv / 0.03, 0, 1); duck = np.convolve(duck, np.ones(4800) / 4800, mode='same')
    mus = mus * drop * duck
    # ambiences
    amb = np.zeros(N, np.float32)
    w = SC['wreck']
    st0, st1 = w['start'], mk('wreck', 'map') + 0.6
    x = noise(st1 - st0 + 1); t = np.arange(len(x)) / SR
    wind = bp(x, 300, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t)) ; waves = lp(noise(len(x) / SR), 400) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.09 * t + 1) ** 2)
    a = (wind * 0.25 + waves * 0.9) * np.minimum(1, t / 1.0) * np.clip((t[-1] - t) / 1.0, 0, 1); put(amb, st0, a.astype(np.float32), 0.35)
    for a0, a1 in [(mk('wreck', 'dive'), mk('wreck', 'haul')), (mk('who', 'sank'), SC['who']['end'] + 0.5)]:
        x = noise(a1 - a0 + 1); t = np.arange(len(x)) / SR
        u = lp(x, 180, 3) * 1.6 + bp(noise(len(x) / SR), 900, 2400) * 0.02 * (rng.random(len(x)) > 0.9994)
        u = u * np.minimum(1, t / 1.2) * np.clip((t[-1] - t) / 1.0, 0, 1)
        for k in range(int((a1 - a0) * 1.6)): put(u, rng.random() * (a1 - a0), bp(noise(0.25), 600, 2000) * env(int(0.25 * SR), 0.01, 0.06), 0.06)
        put(amb, a0, u.astype(np.float32), 0.45)
    room = lp(noise(TL['total'] + 1), 900) * 0.012; put(amb, 0, room)
    # foley
    fx = np.zeros(N, np.float32)
    for t0, kind, g in EV: put(fx, t0, FOLEY[kind](), 0.55 * g)
    # crank ratchet while the handle turns
    c = SC['crank']; put(fx, c['start'] + 0.5, ratchet(mk('crank', 'handle') - c['start'], 4, 0.18))
    fx = reverb(fx, 1.2, 0.18, 7000)
    # stems to levels: voice -> loudest, foley ~8 dB under, music ~19 dB under, ambience bed
    def rms(x): return np.sqrt(np.mean(x[np.abs(x) > 1e-5] ** 2) + 1e-12)
    vr = rms(voice); fx *= (vr * 10 ** (-8 / 20)) / rms(fx); mus *= (vr * 10 ** (-19 / 20)) / rms(mus[venv > 0.01] if np.any(venv > 0.01) else mus); amb *= (vr * 10 ** (-24 / 20)) / rms(amb)
    mix = voice + fx + mus + amb
    end = int(TL['total'] * SR); fo = int(1.5 * SR); mix[end - fo:end] *= np.linspace(1, 0, fo); mix[end:] = 0
    mix = np.tanh(mix * 1.2) / 1.2
    st = np.stack([mix, mix], 1)
    with wave.open(f'{A}/mix.wav', 'wb') as wv:
        wv.setnchannels(2); wv.setsampwidth(2); wv.setframerate(SR); wv.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())
    print('mix written', round(len(mix) / SR, 1), 's')

if __name__ == '__main__':
    main()

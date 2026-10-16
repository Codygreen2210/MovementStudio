"""Build timed SRTs from sentence-level translations.
subs/<lang>.json = {"title": str, "description": str, "sentences": [98 strings]}
Each translated sentence is split across the same number of cues as the English sentence,
in proportion to the English cue lengths, breaking at spaces (or at punctuation / any char for CJK)."""
import json, re, sys, os
A = '/home/claude/anti'
TL = json.load(open(f'{A}/tl.json'))
CUES = TL['cues']
NOSPACE = {'zh-Hans', 'ja'}
PUNCT = '，、。；：！？,.;:!?»”）)،۔؟।'

def sentences():
    out, cur = [], []
    for c in CUES:
        cur.append(c)
        if c['text'].rstrip().endswith(('.', '?', '!', '."', '?"')): out.append(cur); cur = []
    if cur: out.append(cur)
    return out

PARTICLES = set('はがをにでとものへやか的了在和把被')
def _kind(ch):
    if ch.isascii() and (ch.isalnum() or ch in '.,%'): return 'a'
    if '\u30a0' <= ch <= '\u30ff': return 'k'
    return 'o'

def cjk_cost(text, c, tg):
    a, b = text[c - 1], text[c]
    pen = 14.0
    if a in PUNCT: pen = 0.0
    elif a in PARTICLES: pen = 6.0
    if a == '以': pen += 40
    if _kind(a) == _kind(b) and _kind(a) in 'ak': pen += 40
    if b in PUNCT or b in 'ーゃゅょっャュョッぁぃぅぇぉ前後年月日個枚回周多个次': pen += 40
    return abs(c - tg) + pen

def split(text, weights, nospace):
    n = len(weights)
    if n == 1: return [text.strip()]
    tot = sum(weights); targets = []; acc = 0
    for w in weights[:-1]: acc += w; targets.append(acc / tot * len(text))
    if nospace: cands = list(range(1, len(text)))
    else: cands = [m.end() for m in re.finditer(r'\s+', text)]
    parts, last = [], 0
    for k, tg in enumerate(targets):
        pool = [c for c in cands if c > last + 1 and c < len(text) - 1]
        if not pool: break
        if nospace:
            best = min(pool, key=lambda c: cjk_cost(text, c, tg))
        else:
            win = max(4, len(text) * 0.12)
            good = [c for c in pool if abs(c - tg) <= win and text[:c].rstrip()[-1:] in PUNCT]
            best = min(good or pool, key=lambda c: abs(c - tg))
        parts.append(text[last:best].strip()); last = best
    parts.append(text[last:].strip())
    while len(parts) < n: parts.append('')
    return parts

def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'

def build(lang):
    d = json.load(open(f'{A}/subs/{lang}.json'))
    S = sentences(); tr = d['sentences']
    assert len(tr) == len(S), (lang, len(tr), len(S))
    rows = []
    for cues, t in zip(S, tr):
        parts = split(t, [max(1, len(c['text'])) for c in cues], lang in NOSPACE)
        # merge empties into neighbour cue timing
        for c, p in zip(cues, parts):
            if p: rows.append([c['s'], c['e'], p])
            elif rows: rows[-1][1] = c['e']
    out = []
    for i, (s, e, p) in enumerate(rows):
        e2 = min(e + 0.25, rows[i + 1][0] - 0.04) if i + 1 < len(rows) else e + 0.6
        out.append(f'{i + 1}\n{ts(s)} --> {ts(max(e2, s + 0.5))}\n{p}\n')
    os.makedirs(f'{A}/subs/srt', exist_ok=True)
    open(f'{A}/subs/srt/The-Antikythera-Mechanism.{lang}.srt', 'w', encoding='utf-8').write('\n'.join(out))
    return len(rows)

if __name__ == '__main__':
    for lang in sys.argv[1:]: print(lang, build(lang), 'cues')

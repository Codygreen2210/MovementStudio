"""Offline British narration: locally built espeak-ng (en-GB phonemes) + Kokoro ONNX."""
import re, os, subprocess, importlib.util, wave
import numpy as np, onnxruntime as rt

ESPEAK = '/tmp/claude-0/espeak-ng/build/src/espeak-ng'
ENV = dict(os.environ, ESPEAK_DATA_PATH='/tmp/claude-0/espeak-ng/build')
MODEL = '/tmp/claude-0/kmodel/kokoro-v1.0.onnx'
VOICES = '/tmp/claude-0/kmodel/voices-v1.0.bin'
SR = 24000

_spec = importlib.util.spec_from_file_location('kcfg', '/tmp/claude-0/kokoro-onnx/src/kokoro_onnx/config.py')
_k = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_k)
VOCAB = _k.DEFAULT_VOCAB

E2M = sorted({
    'ʔˌn̩': 'tᵊn', 'ʔn̩': 'tᵊn', 'ʔn': 'tᵊn', 'ʔ': 't',
    'a^ɪ': 'I', 'a^ʊ': 'W', 'd^ʒ': 'ʤ', 'e^ɪ': 'A', 't^ʃ': 'ʧ', 'ɔ^ɪ': 'Y',
    'ə^ʊ': 'Q', 'e^ə': 'ɛː', 'ɪ^ə': 'ɪə', 'ʊ^ə': 'ʊə', 'ə^l': 'ᵊl',
    'ʲo': 'jo', 'ʲə': 'jə', 'ʲ': '', 'ɚ': 'əɹ', 'r': 'ɹ', 'x': 'k', 'ç': 'k',
    'ɐ': 'ə', 'ɬ': 'l', '̃': '', '^': '',
}.items(), key=lambda kv: -len(kv[0]))

FIX = {r'\bwound\b': 'wownd', r'\bwinds\b': 'whinds', r'\bwind\b': 'whind', r'\bniobium\b': 'nyobium',
       r'\bChronergy\b': 'Kronnergy', r'\bnickel-phosphorus\b': 'nickel phosphorus', r'\bRolex’s\b': "Rolex's"}

# exact pronunciations (Kokoro phonemes), bypassing espeak's guess
PHON = {'Submariner': 'sʌbmˈɛːɹɪnə'}
PHON_RE = r'\b(' + '|'.join(PHON) + r')\b'

def espeak(text):
    out = subprocess.run([ESPEAK, '-v', 'en-gb', '-q', '--ipa', '--tie=^', text], env=ENV, capture_output=True, text=True).stdout
    return ' '.join(out.split())

def to_phonemes(sentence):
    for a, b in FIX.items():
        sentence = re.sub(a, b, sentence)
    s = sentence.replace('’', "'").replace('“', '"').replace('”', '"').replace('...', '…')
    parts = re.split(r'([,;:.!?…—])', s)
    out = ''
    for i in range(0, len(parts), 2):
        chunk = parts[i].strip()
        punct = parts[i + 1] if i + 1 < len(parts) else ''
        if chunk:
            ph = ''
            for seg in re.split(PHON_RE, chunk):
                if not seg.strip(): continue
                if seg in PHON: ph += ' ' + PHON[seg] + ' '; continue
                p2 = espeak(seg.strip())
                for a, b in E2M:
                    p2 = p2.replace(a, b)
                ph += ' ' + p2 + ' '
            out += ph.strip()
        if punct:
            out += (' ' if punct == '—' else '') + punct
        out += ' '
    return re.sub(r'\s+', ' ', ''.join(c for c in out.strip() if c in VOCAB))

_sess = rt.InferenceSession(MODEL, providers=['CPUExecutionProvider'])
_voices = np.load(VOICES)

def voice_vec(spec):
    if isinstance(spec, str):
        return _voices[spec]
    tot = sum(spec.values())
    return sum(_voices[k] * (w / tot) for k, w in spec.items())

def synth(ph, voice, speed):
    toks = [VOCAB[c] for c in ph]
    assert len(toks) <= 510, ph
    style = voice[len(toks)]
    a = _sess.run(None, {'tokens': np.array([[0, *toks, 0]], dtype=np.int64),
                         'style': np.asarray(style, dtype=np.float32),
                         'speed': np.array([speed], dtype=np.float32)})[0]
    return np.squeeze(a).astype(np.float32)

def trim(a, thr=0.01, pad=0.04):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx): return a
    s = max(0, idx[0] - int(pad * SR)); e = min(len(a), idx[-1] + int(pad * SR))
    return a[s:e]

def write_wav(path, a, sr=SR):
    pcm = (np.clip(a, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())

def read_wav(p):
    with wave.open(p) as w:
        return np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32767

def sentences(t):
    return [s.strip() for s in re.findall(r'[^.!?]+[.!?]+["”’]?|[^.!?]+$', t) if s.strip()]

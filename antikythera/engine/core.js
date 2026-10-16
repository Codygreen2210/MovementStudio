/* Antikythera film — core: canvas, time, marks, easing, camera, text, overlays.
   Every scene is a pure function of time, so any frame renders on its own. */
'use strict';
const TAU = Math.PI * 2;
const cv = document.getElementById('cv'); let X = cv.getContext('2d');
const W = 1920, H = 1080; cv.width = W; cv.height = H;
const TL = window.__TL;
const FPS = TL.fps;
const C = {gilt: '#d8b46e', gilt2: '#f3dca6', blue: '#6fb4ff', cyan: '#8fe6ff', ruby: '#d84a5a', fg: '#efeae0', muted: '#9aa3b2',
           ink: '#07090d', bronze: '#b8864a', verd: '#5f9c86', green: '#62c48a', amber: '#ffb54a'};
const clamp01 = v => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
// 80/20 curve from the playbook: fast departure, long cushioned settle with a touch of overshoot
const settle = t => { t = clamp01(t); const s = 1.12; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
let SEED = 1;
const rnd = () => (SEED = (SEED * 16807) % 2147483647) / 2147483647;
const seeded = (s, f) => { const o = SEED; SEED = s; const r = f(); SEED = o; return r; };

/* ---------- time & marks ---------- */
const F = {T: 0, scene: null, si: 0};
function sceneIndexAt(t) { let i = 0; TL.scenes.forEach((s, j) => { if (t >= s.start) i = j; }); return i; }
function sceneById(id) { return TL.scenes.find(s => s.id === id); }
// absolute time of a mark in scene sid (falls back to the voice start)
function M(sid, name) { const s = sceneById(sid); if (!s) return 0; if (name == null) return s.voice ?? s.start; const v = s.marks && s.marks[name]; return v == null ? (s.voice ?? s.start) : v; }
// eased progress from time a over d seconds
const P = (a, d = 1, f = ease) => f(clamp01((F.T - a) / d));
const PL = (a, d = 1) => clamp01((F.T - a) / d);
// visibility window: fades in at a, out at b
const WIN = (a, b, fi = 0.5, fo = 0.5) => clamp01((F.T - a) / fi) * clamp01((b - F.T) / fo);

/* ---------- drawing helpers ---------- */
const lin = (x0, y0, x1, y1, st) => { const g = X.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
const rad = (x, y, r0, r1, st, x1 = x, y1 = y) => { const g = X.createRadialGradient(x, y, r0, x1, y1, r1); st.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
function hexRgb(h) { h = h.replace('#', ''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const rgba = (hex, a) => { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; };
function txt(s, x, y, font, color, align = 'left', a = 1, sp = 0, base = 'alphabetic') {
  if (a <= 0.005) return;
  X.save(); X.globalAlpha *= a; X.font = font; X.fillStyle = color; X.textAlign = align; X.textBaseline = base;
  if ('letterSpacing' in X) X.letterSpacing = sp + 'px';
  X.fillText(s, x, y); X.restore();
}
function txtShadow(s, x, y, font, color, align = 'left', a = 1, sp = 0, base = 'alphabetic') {
  if (a <= 0.005) return;
  X.save(); X.shadowColor = 'rgba(0,0,0,0.75)'; X.shadowBlur = 24; X.shadowOffsetY = 4; txt(s, x, y, font, color, align, a, sp, base); X.restore();
}
function measure(s, font, sp = 0) { X.save(); X.font = font; if ('letterSpacing' in X) X.letterSpacing = sp + 'px'; const w = X.measureText(s).width; X.restore(); return w; }
const FONT = {mono: (px) => `500 ${px}px "IBM Plex Mono", "DejaVu Sans Mono", monospace`, serif: (px, it) => `${it ? 'italic ' : ''}400 ${px}px "Bodoni Moda", serif`,
              sans: (px, w = 700) => `${w} ${px}px "Hanken Grotesk", sans-serif`, num: (px, w = 600) => `${w} ${px}px "Hanken Grotesk", sans-serif`, greek: (px, w = 500) => `${w} ${px}px "DejaVu Serif", "Noto Serif", serif`};

/* chip: small mono label in a dark pill, slides in */
function chip(s, x, y, a, o = {}) {
  if (a <= 0.01) return;
  const fs = o.size || 22, f = FONT.mono(fs), sp = 3, w = measure(s, f, sp) + fs * 1.4, h = fs * 2.0;
  const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  const sl = (1 - ease(a)) * 16;
  X.save(); X.globalAlpha *= a;
  X.fillStyle = o.bg || 'rgba(7,9,13,0.78)'; X.beginPath(); X.roundRect(x0, y - h / 2 + sl, w, h, 8); X.fill();
  X.strokeStyle = o.stroke || 'rgba(216,180,110,0.65)'; X.lineWidth = 1.5; X.stroke();
  X.restore();
  txt(s, x0 + fs * 0.7, y + sl + 1, f, o.color || C.gilt, 'left', a, sp, 'middle');
}
/* lower third: name card */
function lowerThird(title, sub, a, x = 120, y = 860) {
  if (a <= 0.01) return;
  const sl = (1 - ease(a)) * 30;
  X.save(); X.globalAlpha *= a;
  X.fillStyle = lin(x - 40, 0, x + 900, 0, [[0, 'rgba(7,9,13,0.85)'], [0.7, 'rgba(7,9,13,0.6)'], [1, 'rgba(7,9,13,0)']]);
  X.fillRect(x - 40, y - 70, 1000, 130);
  X.fillStyle = C.gilt; X.fillRect(x - 16, y - 50 + sl, 4, 92);
  X.restore();
  txt(title, x + sl, y, FONT.serif(46), C.fg, 'left', a);
  if (sub) txt(sub.toUpperCase(), x + sl, y + 38, FONT.mono(19), C.gilt, 'left', a, 3);
}
/* callout with leader line from a point */
function callout(px, py, lx, ly, s, a, o = {}) {
  if (a <= 0.01) return;
  const fs = o.size || 20, f = FONT.mono(fs), w = measure(s, f, 2);
  const right = lx >= px, tx = right ? lx + 12 : lx - 12 - w;
  const grow = ease(a);
  X.save(); X.globalAlpha *= a;
  X.strokeStyle = o.line || 'rgba(239,234,224,0.75)'; X.lineWidth = 2;
  X.beginPath(); X.moveTo(px, py); X.lineTo(lerp(px, lx, grow), lerp(py, ly, grow)); X.stroke();
  X.fillStyle = o.dot || C.fg; X.beginPath(); X.arc(px, py, 5, 0, TAU); X.fill();
  X.fillStyle = 'rgba(7,9,13,0.82)'; X.beginPath(); X.roundRect(tx - 12, ly - fs, w + 24, fs * 2, 6); X.fill();
  X.restore();
  txt(s, tx, ly + 1, f, o.color || C.fg, 'left', a, 2, 'middle');
}
/* big centred statement */
function bigLine(s, y, a, o = {}) {
  if (a <= 0.01) return;
  const sl = (1 - ease(a)) * 26;
  txtShadow(s, W / 2, y + sl, o.font || FONT.serif(o.size || 84, o.italic), o.color || C.fg, 'center', a, o.sp || 0);
}

/* ---------- images (Runway illustrations) ---------- */
const IMG = {};
function kenBurns(name, t, o = {}) {
  const im = IMG[name]; if (!im) { X.fillStyle = '#111'; X.fillRect(0, 0, W, H); return; }
  const z0 = o.z0 ?? 1.04, z1 = o.z1 ?? 1.16, dur = o.dur ?? 10;
  const k = clamp01(t / dur), z = lerp(z0, z1, smooth(k));
  const fx = lerp(o.x0 ?? 0.5, o.x1 ?? 0.5, smooth(k)), fy = lerp(o.y0 ?? 0.5, o.y1 ?? 0.5, smooth(k));
  const s = Math.max(W / im.width, H / im.height) * z, iw = im.width * s, ih = im.height * s;
  const x = W / 2 - fx * iw + (iw - W) * 0 , y = H / 2 - fy * ih;
  X.save(); X.globalAlpha *= (o.a ?? 1);
  X.drawImage(im, Math.min(0, Math.max(W - iw, x)), Math.min(0, Math.max(H - ih, y)), iw, ih);
  X.restore();
}

/* ---------- particles: dust, bubbles, spray (deterministic in t) ---------- */
function particles(kind, t, a = 1, n = 90) {
  if (a <= 0.01) return;
  X.save(); X.globalAlpha *= a;
  for (let i = 0; i < n; i++) {
    const r1 = seeded(1000 + i * 7 + (kind === 'bubble' ? 3 : kind === 'spray' ? 5 : 0), () => [rnd(), rnd(), rnd(), rnd()]);
    let x, y, s, al;
    if (kind === 'dust') { x = (r1[0] * W + t * (8 + r1[2] * 14)) % W; y = (r1[1] * H + Math.sin(t * 0.3 + i) * 20 - t * 4) % H; if (y < 0) y += H; s = 0.8 + r1[3] * 2.2; al = 0.1 + 0.25 * r1[2]; X.fillStyle = `rgba(255,230,190,${al})`; }
    else if (kind === 'bubble') { x = r1[0] * W + Math.sin(t * 1.3 + i) * 8; y = H - ((r1[1] * H + t * (40 + r1[2] * 80)) % (H + 40)); s = 1.5 + r1[3] * 4; al = 0.15 + 0.3 * r1[2]; X.strokeStyle = `rgba(200,240,255,${al})`; X.lineWidth = 1.2; X.beginPath(); X.arc(x, y, s, 0, TAU); X.stroke(); continue; }
    else if (kind === 'spray') { x = (r1[0] * W - t * (300 + r1[2] * 500)) % W; if (x < 0) x += W; y = (r1[1] * H + t * (200 + r1[3] * 300)) % H; X.strokeStyle = `rgba(220,230,240,${0.12 + 0.2 * r1[2]})`; X.lineWidth = 1.2; X.beginPath(); X.moveTo(x, y); X.lineTo(x + 18, y - 12); X.stroke(); continue; }
    else if (kind === 'stars') { x = r1[0] * W; y = r1[1] * H; s = 0.6 + r1[3] * 1.8; al = (0.3 + 0.6 * r1[2]) * (0.7 + 0.3 * Math.sin(t * (1 + r1[3] * 3) + i)); X.fillStyle = `rgba(230,240,255,${al})`; }
    X.beginPath(); X.arc(x, y, s, 0, TAU); X.fill();
  }
  X.restore();
}

/* ---------- film finish ---------- */
let GRAIN = null;
function makeGrain() {
  GRAIN = document.createElement('canvas'); GRAIN.width = 512; GRAIN.height = 512;
  const g = GRAIN.getContext('2d'), im = g.createImageData(512, 512);
  SEED = 99; for (let i = 0; i < im.data.length; i += 4) { const v = rnd() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
}
function finish(t) {
  // vignette
  X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
  X.fillStyle = rad(W / 2, H / 2, H * 0.35, W * 0.75, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.55)']]); X.fillRect(0, 0, W, H);
  // grain
  X.globalAlpha = 0.045; X.globalCompositeOperation = 'overlay';
  const ox = Math.floor((t * 977) % 512), oy = Math.floor((t * 571) % 512);
  for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) X.drawImage(GRAIN, x, y);
  X.restore();
}

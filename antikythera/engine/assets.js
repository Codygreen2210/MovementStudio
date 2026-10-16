/* Antikythera film — procedural assets: noise, corroded fragment, gears, dials, spirals, case, map. */
'use strict';

/* ---------- value noise + fbm ---------- */
function makeNoise(seed) {
  const P = new Uint8Array(512); SEED = seed; const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  const V = new Float32Array(256); for (let i = 0; i < 256; i++) V[i] = rnd();
  const sm = t => t * t * (3 - 2 * t);
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = V[P[P[xi & 255] + (yi & 255)]], b = V[P[P[(xi + 1) & 255] + (yi & 255)]];
    const c = V[P[P[xi & 255] + ((yi + 1) & 255)]], d = V[P[P[(xi + 1) & 255] + ((yi + 1) & 255)]];
    const u = sm(xf), v = sm(yf); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, o = 5) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * n2(x * f, y * f); n += a; a *= 0.5; f *= 2.03; } return s / n; };
  return {n2, fbm};
}
const NZ = makeNoise(11);

/* ---------- gear geometry ---------- */
// triangular teeth, slightly irregular like hand-filed bronze
function gearPath(g, r, n, o = {}) {
  const pitch = TAU * r / n, depth = Math.min(r * 0.12, pitch * (o.depth || 0.8));
  const rr = r - depth;
  SEED = 500 + n;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, jit = (rnd() - 0.5) * (o.jitter ?? 0.12);
    const tipA = a + (0.5 + jit * 0.5) / n * TAU, tipR = r * (1 - (rnd() * (o.jitter ?? 0.12)) * 0.02);
    if (i === 0) g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    g.lineTo(Math.cos(tipA) * tipR, Math.sin(tipA) * tipR);
    g.lineTo(Math.cos(a + TAU / n) * rr, Math.sin(a + TAU / n) * rr);
  }
  g.closePath();
}
function spokeWindows(g, r, k, o = {}) {
  const ri = r * (o.ri || 0.2), ro = r * (o.ro || 0.78), sw = o.sw || 0.13;
  for (let s = 0; s < k; s++) {
    const a0 = s / k * TAU + sw, a1 = (s + 1) / k * TAU - sw;
    g.moveTo(Math.cos(a0) * ri, Math.sin(a0) * ri);
    g.arc(0, 0, ro, a0 + sw * ri / ro * 0.3, a1 - sw * ri / ro * 0.3);
    g.arc(0, 0, ri, a1, a0, true); g.closePath();
  }
}
const GEARS = {};
const PAL = {
  new: ['#ffe2a6', '#d7a35a', '#8e5d27', 'rgba(60,32,8,0.55)'],
  old: ['#d2ad72', '#8a7040', '#3e3220', 'rgba(30,22,10,0.6)'],
  steel: ['#ffffff', '#b8c0c9', '#59616b', 'rgba(20,24,30,0.5)'],
  dark: ['#8fa6b8', '#4d6474', '#1e2a33', 'rgba(10,16,22,0.7)']
};
function gearSprite(n, r, style = 'new', o = {}) {
  const key = [n, r, style, o.spokes || 0, o.hub || 0, o.depth || 0].join('|');
  if (GEARS[key]) return GEARS[key];
  const pad = 24, s = Math.ceil(2 * r + pad * 2), c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d'); g.translate(s / 2, s / 2);
  if (style === 'xray' || style === 'ghost') {
    const col = style === 'xray' ? '#a8ecff' : '#7fb8ff';
    g.strokeStyle = col; g.lineWidth = style === 'xray' ? 2.2 : 1.8; g.shadowColor = style === 'xray' ? '#41c8ff' : '#3b82f6'; g.shadowBlur = 12;
    if (style === 'ghost') { g.fillStyle = 'rgba(80,150,255,0.16)'; gearPath(g, r, n); g.fill(); }
    gearPath(g, r, n); g.stroke();
    if (o.spokes) { g.beginPath(); spokeWindows(g, r, o.spokes); g.stroke(); }
    g.beginPath(); g.arc(0, 0, Math.max(4, r * 0.07), 0, TAU); g.stroke();
  } else {
    const pal = PAL[style];
    gearPath(g, r, n, {depth: o.depth});
    g.fillStyle = (() => { const l = g.createLinearGradient(-r, -r, r, r); l.addColorStop(0, pal[0]); l.addColorStop(0.5, pal[1]); l.addColorStop(1, pal[2]); return l; })();
    g.fill();
    g.save(); g.clip();
    // brushed / hand-filed surface and patina
    SEED = 900 + n + Math.round(r); for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(${style === 'old' ? '20,30,18' : '255,240,210'},${0.03 + 0.04 * rnd()})`; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, r * (0.15 + 0.85 * i / 60), 0, TAU); g.stroke(); }
    const rg = g.createRadialGradient(-r * 0.35, -r * 0.4, 0, 0, 0, r * 1.15); rg.addColorStop(0, 'rgba(255,255,255,0.32)'); rg.addColorStop(0.55, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = rg; g.fillRect(-r, -r, 2 * r, 2 * r);
    if (style === 'old') { SEED = n * 3; for (let i = 0; i < r * 1.2; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * r; g.fillStyle = rnd() < 0.6 ? `rgba(95,156,134,${0.15 + 0.25 * rnd()})` : `rgba(40,30,18,${0.2 + 0.3 * rnd()})`; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, 1 + rnd() * r * 0.05, 0, TAU); g.fill(); } }
    g.restore();
    g.globalCompositeOperation = 'destination-out'; g.beginPath();
    if (o.spokes) spokeWindows(g, r, o.spokes);
    g.arc(0, 0, Math.max(3, r * 0.05), 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = pal[3]; g.lineWidth = Math.max(1, r * 0.008); gearPath(g, r, n); g.stroke();
    if (o.spokes) { g.beginPath(); spokeWindows(g, r, o.spokes); g.stroke(); }
    // hub
    const hr = Math.max(6, r * (o.hub || 0.11));
    g.fillStyle = (() => { const l = g.createLinearGradient(-hr, -hr, hr, hr); l.addColorStop(0, pal[0]); l.addColorStop(1, pal[2]); return l; })();
    g.beginPath(); g.arc(0, 0, hr, 0, TAU); g.fill(); g.strokeStyle = pal[3]; g.stroke();
    g.fillStyle = 'rgba(10,8,4,0.8)'; g.beginPath(); g.arc(0, 0, hr * 0.32, 0, TAU); g.fill();
  }
  GEARS[key] = c; return c;
}
// draw a gear sprite at x,y rotated a (radians), with a soft drop shadow
function gear(x, y, n, r, a, style = 'new', o = {}) {
  const s = gearSprite(n, r, style, o);
  X.save(); X.translate(x, y); X.rotate(a);
  if (style !== 'xray' && style !== 'ghost' && o.shadow !== false) { X.shadowColor = 'rgba(0,0,0,0.55)'; X.shadowBlur = o.blur || 22; X.shadowOffsetY = o.sy ?? 10; }
  X.globalAlpha *= (o.alpha ?? 1);
  X.drawImage(s, -s.width / 2, -s.height / 2);
  X.restore();
}
// rotation angle of a gear driven at `turns` revolutions per unit, with mesh phase so teeth interlock
const meshPhase = (n, k = 0.5) => k * TAU / n;

/* ---------- the corroded fragment (Fragment A) ---------- */
let FRAG = null;
function makeFragment() {
  const w = 1000, h = 860, cxs = 520, cys = 440;
  // gear relief mask: the big four-spoked wheel, partly lost to corrosion
  const gm = document.createElement('canvas'); gm.width = w; gm.height = h; const g = gm.getContext('2d');
  g.translate(cxs, cys); g.rotate(0.35); g.fillStyle = '#fff'; gearPath(g, 300, 223); g.fill();
  g.globalCompositeOperation = 'destination-out'; g.beginPath(); spokeWindows(g, 300, 4, {ri: 0.2, ro: 0.8, sw: 0.1}); g.fill();
  g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 36, 0, TAU); g.fill();
  // a smaller gear peeking out lower right
  g.setTransform(1, 0, 0, 1, 0, 0); g.translate(cxs + 250, cys + 200); g.fillStyle = 'rgba(255,255,255,0.8)'; gearPath(g, 70, 38); g.fill();
  const gmd = g.getImageData(0, 0, w, h).data;
  // outline of the slab
  const facets = 9, fr = []; SEED = 23; for (let i = 0; i < facets; i++) fr.push(0.78 + rnd() * 0.22);
  const shapeR = (a) => { const u = ((a + Math.PI) / TAU) * facets, i = Math.floor(u) % facets, f = u - Math.floor(u);
    return lerp(fr[i], fr[(i + 1) % facets], f) + 0.06 * (NZ.fbm(Math.cos(a) * 3 + 5, Math.sin(a) * 3 + 5, 4) - 0.5) * 2; };
  const color = document.createElement('canvas'); color.width = w; color.height = h;
  const cx = color.getContext('2d'), im = cx.createImageData(w, h), d = im.data;
  const xr = document.createElement('canvas'); xr.width = w; xr.height = h;
  const xx = xr.getContext('2d'), xim = xx.createImageData(w, h), xd = xim.data;
  const Hf = new Float32Array(w * h), Ed = new Float32Array(w * h), inside = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x - cxs) / 470, dy = (y - cys) / 400, rr = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const edge = shapeR(a) - rr; const i = y * w + x;
    if (edge <= 0) continue;
    inside[i] = 1; Ed[i] = edge;
    const gearv = gmd[i * 4] / 255;
    const corr = NZ.fbm(x * 0.012, y * 0.012, 6);
    const lost = smooth(clamp01((NZ.fbm(x * 0.006 + 9, y * 0.006 + 3, 4) - 0.42) * 4));   // patches where the gear is eaten away
    Hf[i] = 0.35 * clamp01(edge * 5) + gearv * 0.42 * (1 - lost * 0.7) + (corr - 0.5) * 0.16 + NZ.fbm(x * 0.05, y * 0.05, 3) * 0.06;
  }
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (!inside[i]) continue;
    const nx = (Hf[i - 1] - Hf[i + 1]) * 40, ny = (Hf[i - w] - Hf[i + w]) * 40;
    const L = clamp01(0.55 + (nx * -0.6 + ny * -0.75) * 0.9);
    const c1 = NZ.fbm(x * 0.02 + 40, y * 0.02, 5), c2 = NZ.fbm(x * 0.008 + 7, y * 0.008 + 21, 4), crack = NZ.fbm(x * 0.03 + 3, y * 0.03 + 8, 5);
    let r = 62, gg = 58, b = 40;                                                     // dark bronze-brown base
    const ver = smooth(clamp01((c1 - 0.52) * 3.2)) * 0.85;                           // verdigris green, patchy
    r = lerp(r, 84, ver); gg = lerp(gg, 128, ver); b = lerp(b, 100, ver);
    const rust = smooth(clamp01((c2 - 0.58) * 4)); r = lerp(r, 128, rust); gg = lerp(gg, 86, rust); b = lerp(b, 48, rust);
    const crust = smooth(clamp01((NZ.fbm(x * 0.04 + 50, y * 0.04 + 50, 3) - 0.66) * 6)); r = lerp(r, 196, crust * 0.6); gg = lerp(gg, 200, crust * 0.6); b = lerp(b, 170, crust * 0.6);
    const gearv = gmd[i * 4] / 255; r = lerp(r, 138, gearv * 0.45); gg = lerp(gg, 118, gearv * 0.45); b = lerp(b, 70, gearv * 0.45);
    const cr = Math.abs(crack - 0.5) < 0.012 ? 0.45 : 1;
    const sh = (0.35 + 1.05 * L) * cr;
    d[i * 4] = Math.min(255, r * sh); d[i * 4 + 1] = Math.min(255, gg * sh); d[i * 4 + 2] = Math.min(255, b * sh); d[i * 4 + 3] = 255;
    // radiograph: dense metal = bright
    const dens = 0.14 + gearv * 0.3 * (0.55 + 0.9 * NZ.fbm(x * 0.025 + 3, y * 0.025, 4)) + (NZ.fbm(x * 0.03 + 90, y * 0.03, 4) - 0.5) * 0.18 + clamp01(Ed[i] * 3) * 0.06;
    const v = Math.min(255, 255 * dens);
    xd[i * 4] = v * 0.74; xd[i * 4 + 1] = v * 0.9; xd[i * 4 + 2] = v; xd[i * 4 + 3] = 255;
  }
  cx.putImageData(im, 0, 0); xx.putImageData(xim, 0, 0);
  // x-ray: add hidden gears behind the big wheel
  xx.save(); xx.globalCompositeOperation = 'lighter';
  [[cxs + 250, cys + 200, 70, 38], [cxs - 120, cys + 40, 44, 24], [cxs + 60, cys - 150, 58, 32], [cxs - 220, cys - 120, 38, 20], [cxs + 180, cys - 30, 30, 15], [cxs - 30, cys + 230, 52, 27]].forEach(([x, y, r, n], k) => {
    xx.save(); xx.translate(x, y); xx.rotate(k * 0.7); xx.strokeStyle = 'rgba(200,235,255,0.42)'; xx.lineWidth = 2.5; xx.shadowColor = 'rgba(160,230,255,0.8)'; xx.shadowBlur = 8; gearPath(xx, r, n); xx.stroke(); xx.restore();
  });
  xx.restore();
  xx.save(); xx.globalCompositeOperation = 'destination-in'; xx.drawImage(color, 0, 0); xx.restore();
  FRAG = {color, xray: xr, w, h, cx: cxs, cy: cys};
}
function drawFragment(x, y, s, o = {}) {
  if (!FRAG) makeFragment();
  X.save(); X.translate(x, y); X.rotate(o.rot || 0); X.scale(s * (o.sx ?? 1), s);
  if (o.shadow !== false) { X.shadowColor = 'rgba(0,0,0,0.7)'; X.shadowBlur = 60; X.shadowOffsetY = 28; }
  X.globalAlpha *= (o.alpha ?? 1);
  X.drawImage(o.xray ? FRAG.xray : FRAG.color, -FRAG.cx, -FRAG.cy);
  X.restore();
}

/* ---------- front dial (reconstruction) ---------- */
const ZOD = ['ΚΡΙΟΣ', 'ΤΑΥΡΟΣ', 'ΔΙΔΥΜΟΙ', 'ΚΑΡΚΙΝΟΣ', 'ΛΕΩΝ', 'ΠΑΡΘΕΝΟΣ', 'ΧΗΛΑΙ', 'ΣΚΟΡΠΙΟΣ', 'ΤΟΞΟΤΗΣ', 'ΑΙΓΟΚΕΡΩΣ', 'ΥΔΡΟΧΟΟΣ', 'ΙΧΘΥΕΣ'];
const EGY = ['ΘΩΘ', 'ΦΑΩΦΙ', 'ΑΘΥΡ', 'ΧΟΙΑΚ', 'ΤΥΒΙ', 'ΜΕΧΙΡ', 'ΦΑΜΕΝΩΘ', 'ΦΑΡΜΟΥΘΙ', 'ΠΑΧΩΝ', 'ΠΑΥΝΙ', 'ΕΠΙΦΙ', 'ΜΕΣΟΡΗ'];
const GREEKTXT = 'ΚΑΙΤΟΥΗΛΙΟΥΣΕΛΗΝΗΣΦΑΣΕΙΣΕΚΛΕΙΨΕΙΣΑΣΤΕΡΩΝΠΛΑΝΗΤΩΝΚΥΚΛΟΣΜΗΝΩΝΕΤΗΤΟΥΔΕΙΚΤΟΥΚΙΝΗΣΙΣ';
let FRONT = null, BACK = null;
function bronzePlate(g, w, h, tone = 1) {
  const l = g.createLinearGradient(0, 0, w, h); l.addColorStop(0, `rgb(${196 * tone},${150 * tone},${86 * tone})`); l.addColorStop(0.5, `rgb(${168 * tone},${122 * tone},${66 * tone})`); l.addColorStop(1, `rgb(${120 * tone},${84 * tone},${44 * tone})`);
  g.fillStyle = l; g.beginPath(); g.roundRect(0, 0, w, h, 10); g.fill();
  SEED = 77; for (let i = 0; i < 2200; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '255,235,200' : '60,36,14'},${0.02 + rnd() * 0.04})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1); }
  for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(255,240,210,${0.012 + 0.012 * Math.sin(y * 0.7)})`; g.fillRect(0, y, w, 1); }
  g.strokeStyle = 'rgba(70,40,14,0.8)'; g.lineWidth = 3; g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, 10); g.stroke();
}
function inscriptionBlock(g, x, y, w, h, seed, a = 0.55) {
  g.save(); g.fillStyle = `rgba(60,34,12,${a})`; g.font = '15px "DejaVu Serif", serif'; SEED = seed;
  for (let ly = y + 16; ly < y + h; ly += 19) { let s = ''; while (g.measureText(s).width < w - 10) s += GREEKTXT[Math.floor(rnd() * GREEKTXT.length)]; g.fillText(s, x, ly); }
  g.restore();
}
function makeFront() {
  const w = 760, h = 980, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  bronzePlate(g, w, h);
  inscriptionBlock(g, 40, 30, w - 80, 120, 3); inscriptionBlock(g, 40, h - 150, w - 80, 120, 4);
  const cx = w / 2, cy = h / 2, R0 = 340, R1 = 300, R2 = 250;
  // Egyptian calendar ring (outer, 365 day ticks)
  g.fillStyle = 'rgba(80,46,16,0.35)'; g.beginPath(); g.arc(cx, cy, R0, 0, TAU); g.arc(cx, cy, R1, 0, TAU, true); g.fill();
  g.strokeStyle = 'rgba(60,32,10,0.85)'; g.lineWidth = 2; [R0, R1, R2].forEach(r => { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); });
  for (let i = 0; i < 365; i++) { const a = i / 365 * TAU; g.lineWidth = i % 30 === 0 ? 2.4 : 1; g.beginPath(); g.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); g.lineTo(cx + Math.cos(a) * (R0 - (i % 30 === 0 ? 14 : 7)), cy + Math.sin(a) * (R0 - (i % 30 === 0 ? 14 : 7))); g.stroke(); }
  g.fillStyle = 'rgba(50,26,8,0.9)'; g.font = '600 17px "DejaVu Serif", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  EGY.forEach((m, i) => { const a = (i + 0.5) / 12.17 * TAU - Math.PI / 2; g.save(); g.translate(cx + Math.cos(a) * (R0 - 26), cy + Math.sin(a) * (R0 - 26)); g.rotate(a + Math.PI / 2); g.fillText(m, 0, 0); g.restore(); });
  // zodiac ring (inner)
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2; g.lineWidth = 2.2; g.beginPath(); g.moveTo(cx + Math.cos(a) * R1, cy + Math.sin(a) * R1); g.lineTo(cx + Math.cos(a) * R2, cy + Math.sin(a) * R2); g.stroke();
    for (let k = 1; k < 30; k++) { const b = a + k / 360 * TAU; g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx + Math.cos(b) * R1, cy + Math.sin(b) * R1); g.lineTo(cx + Math.cos(b) * (R1 - (k % 5 ? 5 : 10)), cy + Math.sin(b) * (R1 - (k % 5 ? 5 : 10))); g.stroke(); } }
  g.font = '600 18px "DejaVu Serif", serif';
  ZOD.forEach((z, i) => { const a = (i + 0.5) / 12 * TAU - Math.PI / 2; g.save(); g.translate(cx + Math.cos(a) * (R2 + 25), cy + Math.sin(a) * (R2 + 25)); g.rotate(a + Math.PI / 2); g.fillText(z, 0, 0); g.restore(); });
  // dial centre: darker field
  g.fillStyle = 'rgba(60,34,12,0.35)'; g.beginPath(); g.arc(cx, cy, R2, 0, TAU); g.fill();
  FRONT = {c, w, h, cx, cy, R0, R1, R2};
}
function makeBack() {
  const w = 760, h = 980, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  bronzePlate(g, w, h, 0.94);
  const up = {cx: w / 2, cy: 330, r0: 70, r1: 290, turns: 5, cells: 235}, lo = {cx: w / 2, cy: 760, r0: 62, r1: 196, turns: 4, cells: 223};
  [up, lo].forEach(S => {
    g.strokeStyle = 'rgba(60,32,10,0.85)'; g.lineWidth = 2.2;
    for (const off of [0, 1]) { g.beginPath(); for (let k = 0; k <= 720; k++) { const f = k / 720, a = f * S.turns * TAU - Math.PI / 2, r = S.r0 + (S.r1 - S.r0) * f + off * (S.r1 - S.r0) / S.turns; const x = S.cx + Math.cos(a) * r, y = S.cy + Math.sin(a) * r; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    g.lineWidth = 1;
    for (let i = 0; i <= S.cells; i++) { const f = i / S.cells, a = f * S.turns * TAU - Math.PI / 2, r = S.r0 + (S.r1 - S.r0) * f, rw = (S.r1 - S.r0) / S.turns; g.beginPath(); g.moveTo(S.cx + Math.cos(a) * r, S.cy + Math.sin(a) * r); g.lineTo(S.cx + Math.cos(a) * (r + rw), S.cy + Math.sin(a) * (r + rw)); g.stroke(); }
  });
  // subsidiary dials inside the upper spiral (games, Callippic) and lower (Exeligmos)
  const sub = (x, y, r, k) => { g.strokeStyle = 'rgba(60,32,10,0.85)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); for (let i = 0; i < k; i++) { const a = i / k * TAU - Math.PI / 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); } };
  sub(up.cx + 28, up.cy, 34, 4); sub(up.cx - 28, up.cy, 34, 4); sub(lo.cx, lo.cy, 40, 3);
  g.fillStyle = 'rgba(50,26,8,0.9)'; g.font = '600 9px "DejaVu Serif", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  [['ΙΣΘΜΙΑ', 'ΟΛΥΜΠΙΑ'], ['ΝΕΜΕΑ', 'ΝΑΑ'], ['ΙΣΘΜΙΑ', 'ΠΥΘΙΑ'], ['ΝΕΜΕΑ', 'ΑΛΙΕΙΑ']].forEach((s, i) => { const a = (i + 0.5) / 4 * TAU - Math.PI / 2; g.font = '600 5.5px "DejaVu Serif", serif'; g.fillText(s[0], up.cx + 28 + Math.cos(a) * 20, up.cy + Math.sin(a) * 20 - 3.5); g.fillText(s[1], up.cx + 28 + Math.cos(a) * 20, up.cy + Math.sin(a) * 20 + 3.5); });
  // eclipse glyphs on the Saros spiral: Σ (Moon) every eclipse season, Η (Sun) at 27 of them
  const seasons = []; for (let k = 0; k < 38; k++) seasons.push(Math.round(k * 223 / 38 + 2));
  const solar = new Set(); SEED = 31; const order = seasons.slice().sort(() => rnd() - 0.5); order.slice(0, 27).forEach(c => solar.add(c));
  g.font = '700 12px "DejaVu Serif", serif';
  seasons.forEach(cn => { const f = (cn + 0.5) / lo.cells, a = f * lo.turns * TAU - Math.PI / 2, r = lo.r0 + (lo.r1 - lo.r0) * f + (lo.r1 - lo.r0) / lo.turns / 2; g.fillText(solar.has(cn) ? 'ΣΗ' : 'Σ', lo.cx + Math.cos(a) * r, lo.cy + Math.sin(a) * r); });
  inscriptionBlock(g, 40, h - 40, w - 80, 30, 9, 0.4);
  BACK = {c, w, h, up, lo, seasons, solar};
}
function spiralPos(S, f, inner = 0.5) { const a = f * S.turns * TAU - Math.PI / 2, rw = (S.r1 - S.r0) / S.turns, r = S.r0 + (S.r1 - S.r0) * f + rw * inner; return [S.cx + Math.cos(a) * r, S.cy + Math.sin(a) * r, a]; }

/* ---------- wooden case ---------- */
let WOOD = null;
function makeWood() {
  const w = 900, h = 1120, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = NZ.fbm(x * 0.004, y * 0.05, 4), ring = Math.sin((y * 0.06 + n * 18)) * 0.5 + 0.5, i = (y * w + x) * 4;
    const v = 0.55 + 0.25 * ring + 0.2 * NZ.fbm(x * 0.05, y * 0.4, 2);
    d[i] = 96 * v; d[i + 1] = 60 * v; d[i + 2] = 32 * v; d[i + 3] = 255;
  }
  g.putImageData(im, 0, 0); WOOD = c;
}
function drawCase(cx, cy, s, face, o = {}) {
  if (!WOOD) makeWood(); if (!FRONT) makeFront(); if (!BACK) makeBack();
  const P = face === 'back' ? BACK : FRONT;
  X.save(); X.translate(cx, cy); X.scale(s * (o.sx ?? 1), s);
  X.shadowColor = 'rgba(0,0,0,0.65)'; X.shadowBlur = 70; X.shadowOffsetY = 34;
  X.drawImage(WOOD, -450, -560); X.shadowColor = 'transparent';
  X.strokeStyle = 'rgba(30,16,6,0.9)'; X.lineWidth = 4; X.strokeRect(-450, -560, 900, 1120);
  X.fillStyle = 'rgba(0,0,0,0.35)'; X.fillRect(-392, -502, 784, 1004);
  X.drawImage(P.c, -P.w / 2, -P.h / 2);
  X.restore();
}

/* ---------- maps ---------- */
// simplified coastlines (lon, lat) — stylised, not survey-accurate
const COAST = {
  pelop: [[21.1, 37.9], [21.6, 37.5], [21.7, 36.9], [22.1, 36.8], [22.38, 36.42], [22.5, 36.85], [22.75, 36.8], [23.05, 36.45], [23.2, 36.45], [23.1, 37.0], [22.8, 37.55], [23.2, 37.65], [23.15, 37.95], [22.6, 38.15], [22.0, 38.3], [21.4, 38.2]],
  attica: [[22.95, 38.05], [23.4, 37.95], [23.75, 37.75], [24.05, 37.65], [24.0, 38.1], [23.6, 38.35], [23.0, 38.3]],
  crete: [[23.5, 35.55], [23.6, 35.25], [24.2, 35.3], [24.8, 35.15], [25.5, 35.0], [26.1, 35.0], [26.3, 35.25], [25.8, 35.35], [25.2, 35.4], [24.7, 35.5], [24.1, 35.55], [23.7, 35.65]],
  kythera: [[22.9, 36.35], [23.0, 36.15], [23.1, 36.2], [23.05, 36.38]],
  anti: [[23.27, 35.89], [23.31, 35.84], [23.34, 35.87], [23.3, 35.9]],
  asia: [[26.4, 38.6], [26.8, 38.2], [27.2, 37.8], [27.3, 37.3], [27.6, 37.0], [28.2, 36.7], [28.6, 36.8], [29.0, 36.6], [29.5, 36.2], [29.5, 38.8]],
  symi: [[27.8, 36.6], [27.88, 36.56], [27.9, 36.62], [27.83, 36.65]],
  rhodes: [[27.75, 36.4], [28.2, 36.45], [28.25, 36.1], [27.75, 35.9], [27.7, 36.15]],
  euboea: [[22.9, 38.95], [23.6, 38.5], [24.1, 38.2], [24.6, 37.95], [24.4, 38.2], [23.8, 38.7], [23.2, 39.0]]
};
const CYCLADES = [[24.9, 37.4], [25.35, 37.1], [25.4, 36.4], [24.4, 36.75], [25.0, 37.05], [25.5, 36.85], [24.7, 37.6], [25.6, 37.5]];
function mapProj(lon, lat, view) { return [(lon - view.lon0) / (view.lon1 - view.lon0) * W, (view.lat1 - lat) / (view.lat1 - view.lat0) * H]; }
function drawAegean(view, a = 1, t = 0) {
  X.save(); X.globalAlpha *= a;
  X.fillStyle = lin(0, 0, 0, H, [[0, '#0b1c2a'], [1, '#06111b']]); X.fillRect(0, 0, W, H);
  // lat/lon graticule
  X.strokeStyle = 'rgba(140,190,220,0.07)'; X.lineWidth = 1;
  for (let lo = Math.ceil(view.lon0); lo <= view.lon1; lo++) { const [x] = mapProj(lo, 0, view); X.beginPath(); X.moveTo(x, 0); X.lineTo(x, H); X.stroke(); }
  for (let la = Math.ceil(view.lat0); la <= view.lat1; la++) { const [, y] = mapProj(0, la, view); X.beginPath(); X.moveTo(0, y); X.lineTo(W, y); X.stroke(); }
  const smoothPoly = (poly) => { const pts = poly.map(([lo, la]) => mapProj(lo, la, view)); const n = pts.length; X.beginPath();
    for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (i === 0) X.moveTo(p1[0], p1[1]);
      X.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); }
    X.closePath(); };
  window.__smoothPoly = smoothPoly;
  Object.values(COAST).concat(window.__extraCoast || []).forEach(poly => {
    smoothPoly(poly); X.save(); X.shadowColor = 'rgba(120,200,255,0.25)'; X.shadowBlur = 30; X.fillStyle = lin(0, 0, 0, H, [[0, '#3a3a2e'], [1, '#26261d']]); X.fill(); X.restore();
    X.strokeStyle = 'rgba(216,180,110,0.75)'; X.lineWidth = 2.2; X.stroke();
  });
  CYCLADES.forEach(([lo, la]) => { const [x, y] = mapProj(lo, la, view); X.fillStyle = '#2a2a22'; X.beginPath(); X.ellipse(x, y, 10, 7, 0.3, 0, TAU); X.fill(); X.strokeStyle = 'rgba(216,180,110,0.5)'; X.stroke(); });
  X.restore();
}

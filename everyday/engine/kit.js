/* Everyday Machines — breakdown engine core.
   Loads after studio.js and one object module (window.OBJECT = K => ({...})).
   The object supplies: layers, state (extra animatable keys), scenes, simulate(dt), render(), cta.
   This core supplies: camera + easing, narration-locked timeline (marks/events), callouts,
   captions, titles, call-to-action card, studio set, sound-event log, and the frame API. */
(() => {
'use strict';
const TAU = Math.PI * 2;
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const CFG = window.__CFG || {w: 1080, h: 1920};
const W = CFG.w, H = CFG.h; cv.width = W; cv.height = H;
const PORTRAIT = H > W;
const TL = window.__TL, FPS = TL.fps, DT = 1 / FPS;
const C = {gilt: '#cfab6e', blue: '#5d9dff', ruby: '#cc3a4e', fg: '#ebe7de', muted: '#8e97a7', stage: '#07090d', copper: '#d9824a'};
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = t => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function shade(hex, f, a = 1) {
  const [r, g, b] = hexRgb(hex);
  const m = f >= 0 ? (c => c + (255 - c) * f) : (c => c * (1 + f));
  return `rgba(${Math.round(m(r))},${Math.round(m(g))},${Math.round(m(b))},${a})`;
}

const K = {ctx, cv, W, H, C, TAU, PORTRAIT, clamp01, ease, smooth, lerp, shade, T: 0, rt: 0, dt: DT, sceneClock: 0, sceneId: '', anchors: {}};
const cur = {zoom: 1, fx: 0, fy: 0, sx: 0, sy: 0, spin: 0, tilt: 0, explode: 0, veil: 0};
const alpha = {};
K.cur = cur; K.alpha = alpha;

/* ---------- animation ---------- */
const anims = [];
function animate(obj, key, to, dur, start) {
  for (let i = anims.length - 1; i >= 0; i--) if (anims[i].obj === obj && anims[i].key === key) anims.splice(i, 1);
  if (!(dur > 0)) { obj[key] = to; return; }
  anims.push({obj, key, to, dur, start, from: null});
}
function stepAnims(T) {
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i];
    if (T < a.start) continue;
    if (a.from === null) a.from = a.obj[a.key] ?? 0;
    const e = ease((T - a.start) / a.dur);
    a.obj[a.key] = a.from + (a.to - a.from) * e;
    if (e >= 1) anims.splice(i, 1);
  }
}
function camTo(cam, al, dur, start) {
  if (cam) for (const k in cam) animate(cur, k, cam[k], dur, start);
  if (al) for (const k in al) animate(alpha, k, al[k], dur, start);
}
K.camTo = (cam, dur) => camTo(cam, null, dur, K.T);

/* ---------- view ---------- */
let VIEW = {k: 1, cx: W / 2, cy: H / 2, mn: Math.min(W, H), spin: 0, br: {sx: 0, sy: 0}};
function computeView() {
  const mn = Math.min(W, H), rt = K.rt;
  const br = {sx: 0.007 * Math.sin(0.31 * rt) + 0.004 * Math.sin(0.83 * rt + 2), sy: 0.006 * Math.sin(0.23 * rt + 1),
              z: 1 + 0.016 * Math.sin(0.19 * rt + 0.5), sp: 0.008 * Math.sin(0.15 * rt)};
  const k = cur.zoom * br.z * mn / 330;
  VIEW = {k, mn, br, cx: W / 2 + (cur.sx + br.sx) * mn, cy: H / 2 + (cur.sy + br.sy) * mn, spin: cur.spin + br.sp};
}
K.view = (z = 0, o = {}) => {
  const tilt = o.tilt ?? cur.tilt;
  const k = VIEW.k * (o.scale || 1);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(VIEW.cx + (o.dx || 0), VIEW.cy - z * Math.sin(tilt) * k + (o.dy || 0));
  ctx.scale(k, k * Math.cos(tilt));
  ctx.rotate(o.spin ?? VIEW.spin);
  ctx.translate(-(o.fx ?? cur.fx), -(o.fy ?? cur.fy));
};
K.screen = () => ctx.setTransform(1, 0, 0, 1, 0, 0);
K.px = () => VIEW.k;
K.anchor = (name, x, y) => { const p = ctx.getTransform().transformPoint(new DOMPoint(x, y)); K.anchors[name] = [p.x, p.y]; };
K.anchorScreen = (name, x, y) => { K.anchors[name] = [x, y]; };

/* ---------- drawing helpers ---------- */
K.lin = (x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
K.rad = (x0, y0, r0, x1, y1, r1, stops) => { const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
K.cylGrad = (r, hex, a = 1, y0 = 0) => K.lin(0, y0 - r, 0, y0 + r, [[0, shade(hex, -0.45, a)], [0.16, shade(hex, 0.42, a)], [0.32, shade(hex, 0.08, a)], [0.7, shade(hex, -0.3, a)], [0.92, shade(hex, -0.55, a)], [1, shade(hex, -0.2, a)]]);
K.steel = (x0, y0, x1, y1) => K.lin(x0, y0, x1, y1, [[0, '#f2f4f7'], [0.35, '#8b949f'], [0.62, '#e4e8ec'], [1, '#6f7884']]);
K.gilt = (x0, y0, x1, y1) => K.lin(x0, y0, x1, y1, [[0, '#f3dda8'], [0.35, '#b88f4c'], [0.62, '#f1dcac'], [1, '#8e6c37']]);
K.rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
K.txt = (s, x, y, font, color, align = 'left', a = 1, spacing = 0, base = 'alphabetic') => {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  if ('letterSpacing' in ctx) ctx.letterSpacing = spacing + 'px';
  ctx.fillText(s, x, y); ctx.restore();
};
const UI = PORTRAIT ? {fs: 26, sc: 1.15} : {fs: 20, sc: 1.6};
K.label = (px, py, dx, dy, text, a) => {
  if (a <= 0.01) return;
  const fs = UI.fs, sc = UI.sc;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `500 ${fs}px "IBM Plex Mono", monospace`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
  const t = text.toUpperCase(), tw = ctx.measureText(t).width;
  let lx = px + dx * sc, ly = py + dy * sc;
  const right = dx >= 0;
  let tx = right ? lx + 14 : lx - 14 - tw;
  tx = Math.max(40, Math.min(W - tw - 40, tx));
  ly = Math.max(400, Math.min(H - 640, ly));
  lx = right ? tx - 12 : tx + tw + 12;
  ctx.globalAlpha = a;
  ctx.strokeStyle = 'rgba(235,231,222,0.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(lx, ly); ctx.stroke();
  ctx.fillStyle = C.fg; ctx.beginPath(); ctx.arc(px, py, 5.5, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(7,9,13,0.82)'; K.rr(tx - 12, ly - fs * 0.98, tw + 24, fs * 1.96, 6); ctx.fill();
  ctx.fillStyle = C.fg; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(t, tx, ly + 1);
  ctx.restore();
};
K.card = (text, y, a, sub) => {
  if (a <= 0.01) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
  ctx.font = '500 28px "IBM Plex Mono", monospace'; if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  const tw = Math.max(ctx.measureText(text).width, sub ? (ctx.font = '500 20px "IBM Plex Mono", monospace', ctx.measureText(sub).width) : 0);
  const h = sub ? 96 : 64, slide = (1 - ease(a)) * 24;
  ctx.fillStyle = 'rgba(7,9,13,0.86)'; K.rr(W / 2 - tw / 2 - 30, y - h / 2 + slide, tw + 60, h, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(207,171,110,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  K.txt(text, W / 2, y + (sub ? -10 : 2) + slide, '500 28px "IBM Plex Mono"', C.gilt, 'center', a, 3, 'middle');
  if (sub) K.txt(sub, W / 2, y + 24 + slide, '500 20px "IBM Plex Mono"', C.fg, 'center', a, 2, 'middle');
};
K.veil = a => { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.fillStyle = C.stage; ctx.fillRect(0, 0, W, H); ctx.restore(); };

/* ---------- sound events ---------- */
const ticks = [], sfx = [];
K.tick = (g, odd = 0) => ticks.push([+K.T.toFixed(4), odd, g]);
K.sfx = kind => sfx.push([+K.T.toFixed(3), kind]);

/* ---------- timeline ---------- */
let O = null, SCENES = [], curScene = -1, studio = null;
const fired = new Set();
K.mark = name => { const S = TL.scenes[curScene]; return S && S.marks ? S.marks[name] : undefined; };
K.since = name => { const m = K.mark(name); return m == null ? -1e9 : K.T - m; };
K.lineAt = i => { const S = TL.scenes[curScene]; return S ? S.lines[i] : undefined; };
K.sceneEnd = () => { const S = TL.scenes[curScene]; return S ? S.end : 0; };
function sceneAt(t) { let i = -1; TL.scenes.forEach((s, j) => { if (t >= s.start) i = j; }); return i; }
function applyTimeline() {
  const T = K.T, i = sceneAt(T);
  if (i >= 0 && i !== curScene) {
    curScene = i;
    const sc = SCENES[i];
    K.sceneId = sc.id; K.sceneIndex = i;
    camTo(sc.cam, sc.alpha, sc.camDur ?? 2.2, T);
    if (i > 0 && !sc.quiet) K.sfx('whoosh');
    if (O.enter) O.enter(sc.id);
  }
  if (i < 0) return;
  const S = TL.scenes[i];
  K.sceneClock = T - S.start;
  (SCENES[i].events || []).forEach((ev, j) => {
    const key = i + ':' + j;
    if (fired.has(key)) return;
    const useMark = ev.mark && S.marks && S.marks[ev.mark] != null;
    if (ev.mark && !useMark) return;
    const base = useMark ? S.marks[ev.mark] : (ev.line == null ? S.start : S.lines[ev.line]);
    if (base == null || T < base + (ev.at || 0)) return;
    fired.add(key);
    camTo(ev.cam, ev.alpha, ev.dur ?? 1, T);
    if (ev.sfx) K.sfx(ev.sfx);
    if (ev.call && O[ev.call]) O[ev.call](ev);
  });
}
function drawCallouts() {
  const sc = SCENES[curScene], S = TL.scenes[curScene];
  if (!sc || !sc.callouts) return;
  const endFade = clamp01((S.end - K.T) / 0.45);
  sc.callouts.forEach(c => {
    const p = K.anchors[c.a];
    if (!p) return;
    let t0;
    if (c.mark != null) { const m = S.marks && S.marks[c.mark]; if (m == null) return; t0 = m + (c.after || 0); }
    else t0 = (S.lines[c.line || 0] ?? S.start) + (c.after ?? 1.2);
    let a = clamp01((K.T - t0) / 0.5) * endFade;
    if (c.until) { const u = S.marks && S.marks[c.until]; if (u != null) a *= clamp01((u - K.T) / 0.4 + 1); }
    if (c.hide) a *= clamp01(1 - (cur[c.hide] || 0) * 2);
    if (c.show) a *= clamp01((cur[c.show] || 0) * 2 - 0.6);
    K.label(p[0], p[1], c.dx, c.dy, c.t, a);
  });
}

/* ---------- overlays: titles, captions, call to action, fades ---------- */
function wrapWords(words, font, maxW) {
  ctx.font = font; const lines = []; let line = [];
  words.forEach(w => { const t = line.concat(w).join(' '); if (ctx.measureText(t).width > maxW && line.length) { lines.push(line); line = [w]; } else line.push(w); });
  if (line.length) lines.push(line);
  return lines;
}
function overlays() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const S = TL.scenes[curScene], sc = SCENES[curScene];
  if (S && sc && sc.title) {
    const a = clamp01((K.T - S.start - 0.2) / 0.5) * clamp01((S.end - K.T) / 0.4);
    const slide = (1 - ease((K.T - S.start - 0.2) / 0.6)) * 30;
    K.txt(sc.title.toUpperCase(), W / 2, 300 + slide, '500 30px "IBM Plex Mono"', C.gilt, 'center', a, 5);
    if (sc.spec) K.txt(sc.spec.toUpperCase(), W / 2, 344 + slide, '500 22px "IBM Plex Mono"', C.muted, 'center', a, 3);
  }
  const cue = (TL.cues || []).find(c => K.T >= c.s - 0.05 && K.T <= c.e + 0.3);
  if (cue) {
    const words = cue.text.split(/\s+/), n = words.length;
    const wi = Math.min(n - 1, Math.floor(clamp01((K.T - cue.s) / Math.max(0.3, cue.e - cue.s)) * n));
    const font = '700 62px "Hanken Grotesk"';
    const lines = wrapWords(words, font, W - 170);
    const pop = 0.92 + 0.08 * ease((K.T - cue.s + 0.05) / 0.18);
    const y0 = 1400 - (lines.length - 1) * 38;
    ctx.save(); ctx.translate(W / 2, y0); ctx.scale(pop, pop);
    let idx = 0;
    lines.forEach((ln, li) => {
      ctx.font = font; let x = -ctx.measureText(ln.join(' ')).width / 2; const y = li * 78;
      ln.forEach(w => {
        const ww = ctx.measureText(w).width;
        ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(w, x, y);
        ctx.fillStyle = idx === wi ? C.gilt : (idx < wi ? '#ffffff' : 'rgba(255,255,255,0.82)');
        ctx.fillText(w, x, y);
        x += ww + ctx.measureText(' ').width; idx++;
      });
    });
    ctx.restore();
  }
  if (S && sc && sc.cta) {
    const S0 = S.start + (O.ctaDelay || 0);
    const a = clamp01((K.T - S0 - 0.4) / 0.7);
    ctx.save(); ctx.globalAlpha = a;
    const bg = ctx.createLinearGradient(0, 180, 0, 800);
    bg.addColorStop(0, 'rgba(7,9,13,0)'); bg.addColorStop(0.2, 'rgba(7,9,13,0.82)'); bg.addColorStop(0.8, 'rgba(7,9,13,0.82)'); bg.addColorStop(1, 'rgba(7,9,13,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 180, W, 620); ctx.restore();
    const rise = (1 - ease(a)) * 40;
    K.txt(O.cta[0], W / 2, 330 + rise, '400 78px "Bodoni Moda"', C.fg, 'center', a);
    K.txt(O.cta[1], W / 2, 425 + rise, 'italic 400 88px "Bodoni Moda"', C.gilt, 'center', a);
    const b = clamp01((K.T - S0 - 1.2) / 0.5);
    const pulse = 1 + 0.045 * Math.sin((K.T - S0) * 5.2) * b;
    ctx.save(); ctx.globalAlpha = b; ctx.translate(W / 2, 560 + (1 - ease(b)) * 30); ctx.scale(pulse, pulse);
    if (O.bridge) {
      ctx.strokeStyle = C.gilt; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-300, -56, 600, 112, 56); ctx.stroke();
      ctx.fillStyle = 'rgba(214,180,106,0.16)'; ctx.fill();
      ctx.fillStyle = C.gilt; ctx.font = '700 44px "Hanken Grotesk"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(O.bridge, 0, 3);
      ctx.restore();
      const c = clamp01((K.T - S0 - 2.0) / 0.6);
      K.txt(O.next || 'LINKED BELOW', W / 2, 690, '500 30px "IBM Plex Mono"', C.fg, 'center', c, 5);
      for (let i = 0; i < 3; i++) {
        const ph = ((K.T - S0) * 1.6 - i * 0.22) % 1, y = 750 + i * 34 + ph * 18;
        ctx.save(); ctx.globalAlpha = c * (0.35 + 0.65 * Math.sin(Math.PI * ph)); ctx.strokeStyle = C.gilt; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(W / 2 - 26, y); ctx.lineTo(W / 2, y + 22); ctx.lineTo(W / 2 + 26, y); ctx.stroke(); ctx.restore();
      }
    } else {
    ctx.fillStyle = '#d6303f'; ctx.beginPath(); ctx.roundRect(-230, -56, 460, 112, 56); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '800 50px "Hanken Grotesk"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SUBSCRIBE', 0, 3);
    ctx.restore();
    K.txt(O.next || 'NEXT: ANOTHER EVERYDAY MACHINE', W / 2, 690, '500 28px "IBM Plex Mono"', C.fg, 'center', clamp01((K.T - S0 - 2.2) / 0.6), 4);
    }
  }
  let b = 0;
  if (K.T < 0.35) b = 1 - K.T / 0.35;
  if (K.T > TL.total - 1.2) b = Math.max(b, clamp01((K.T - (TL.total - 1.2)) / 1.0));
  if (b > 0) { ctx.fillStyle = 'rgba(0,0,0,' + b.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
}

/* ---------- frame ---------- */
function render() {
  computeView();
  K.anchors = {};
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const k = VIEW.k, mn = VIEW.mn, cl = v => Math.max(-60, Math.min(60, v));
  studio.draw(ctx, K.rt, {x: cl(-cur.fx * k * 0.08 - VIEW.br.sx * mn * 0.8), y: cl(-cur.fy * k * 0.08 - VIEW.br.sy * mn * 0.8),
                          s: Math.min(1.12, 1 + Math.max(0, cur.zoom - 0.85) * 0.03)});
  K.veil(cur.veil);
  ctx.save(); O.render(); ctx.restore();
  ctx.globalAlpha = 1;
  studio.drawLight(ctx, K.rt);
  if (O.overlay) { ctx.save(); O.overlay(); ctx.restore(); }
  drawCallouts();
  overlays();
}
window.__init = async () => {
  const fams = ['400 40px "Bodoni Moda"', 'italic 400 40px "Bodoni Moda"', '400 20px "Hanken Grotesk"', '700 20px "Hanken Grotesk"', '800 20px "Hanken Grotesk"', '500 20px "IBM Plex Mono"'];
  await Promise.all(fams.map(f => document.fonts.load(f)));
  O = window.OBJECT(K);
  Object.assign(cur, O.state || {});
  (O.layers || []).forEach(l => { alpha[l] = 1; });
  SCENES = TL.scenes.map(s => {
    const d = O.scenes[s.id];
    if (!d) throw new Error('No scene definition for ' + s.id);
    return Object.assign({id: s.id}, d);
  });
  studio = Studio.create(W, H, {seed: O.seed || 7});
  if (O.init) O.init();
  return fams.map(f => document.fonts.check(f));
};
window.__advance = (i, draw) => {
  K.T = i / FPS;
  applyTimeline();
  stepAnims(K.T);
  K.rt += DT;
  if (O.simulate) O.simulate(DT);
  if (!draw) return null;
  render();
  return cv.toDataURL('image/jpeg', 0.93);
};
window.__ticks = () => ticks;
window.__sfx = () => sfx;
window.__clean = () => { render(); return cv.toDataURL('image/png'); };
})();

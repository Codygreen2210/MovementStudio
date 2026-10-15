/* ---------- Watch exterior (generic, unbranded) ---------- */
const CASE_R = 186, LUG_W = 72;
function strapPath(dirY) {
  const p = new Path2D(), w = LUG_W, y0 = dirY * 150, y1 = dirY * 760;
  p.moveTo(-w, y0); p.lineTo(w, y0); p.lineTo(w * 0.9, y1); p.lineTo(-w * 0.9, y1); p.closePath();
  return p;
}
function drawStrapAndLugs(mirror) {
  [-1, 1].forEach(dy => {
    const sp = strapPath(dy);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 24 * dpr; ctx.shadowOffsetY = 8 * dpr;
    const g = ctx.createLinearGradient(-LUG_W, 0, LUG_W, 0);
    g.addColorStop(0, '#2a170e'); g.addColorStop(0.18, '#5a3520'); g.addColorStop(0.5, '#6b4027'); g.addColorStop(0.82, '#55321e'); g.addColorStop(1, '#24140b');
    ctx.fillStyle = g; ctx.fill(sp); ctx.restore();
    ctx.save(); ctx.clip(sp);
    for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(0,0,0,${0.04 + (i % 7) * 0.006})`; ctx.fillRect(-LUG_W + ((i * 37) % (2 * LUG_W)), dy * (190 + ((i * 53) % 560)), 3, 2); }
    ctx.restore();
    ctx.save(); ctx.setLineDash([7, 6]); ctx.strokeStyle = 'rgba(236,222,196,0.55)'; ctx.lineWidth = 1.4;
    [-1, 1].forEach(sx => { ctx.beginPath(); ctx.moveTo(sx * (LUG_W - 10), dy * 196); ctx.lineTo(sx * (LUG_W * 0.9 - 9), dy * 760); ctx.stroke(); });
    ctx.restore();
    [-1, 1].forEach(sx => {
      const lp = new Path2D();
      lp.moveTo(sx * (LUG_W - 4), dy * 140);
      lp.bezierCurveTo(sx * (LUG_W + 30), dy * 150, sx * (LUG_W + 36), dy * 190, sx * (LUG_W + 26), dy * 232);
      lp.lineTo(sx * (LUG_W + 2), dy * 236);
      lp.bezierCurveTo(sx * (LUG_W + 4), dy * 200, sx * (LUG_W - 2), dy * 176, sx * (LUG_W - 10), dy * 160);
      lp.closePath();
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14 * dpr; ctx.shadowOffsetY = 6 * dpr;
      const lg = ctx.createLinearGradient(sx * (LUG_W - 6), 0, sx * (LUG_W + 34), 0);
      lg.addColorStop(0, '#7d8792'); lg.addColorStop(0.45, '#f1f3f5'); lg.addColorStop(0.75, '#a9b2bb'); lg.addColorStop(1, '#5d6670');
      ctx.fillStyle = lg; ctx.fill(lp); ctx.restore();
      ctx.strokeStyle = 'rgba(30,36,44,0.65)'; ctx.lineWidth = 0.9; ctx.stroke(lp);
      ctx.fillStyle = 'rgba(30,36,44,0.6)'; ctx.beginPath(); ctx.arc(sx * (LUG_W + 16), dy * 214, 2.2, 0, TAU); ctx.fill();
    });
  });
}
function drawCaseRing(mirror) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30 * dpr; ctx.shadowOffsetY = 10 * dpr;
  const g = ctx.createLinearGradient(-CASE_R, -CASE_R, CASE_R, CASE_R);
  g.addColorStop(0, '#f2f4f6'); g.addColorStop(0.3, '#8e98a3'); g.addColorStop(0.55, '#e3e7eb'); g.addColorStop(0.8, '#6f7882'); g.addColorStop(1, '#c9cfd5');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, CASE_R, 0, TAU); ctx.arc(0, 0, 150, 0, TAU, true); ctx.fill('evenodd');
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,36,44,0.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, CASE_R, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 166, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,36,44,0.55)'; ctx.beginPath(); ctx.arc(0, 0, 151, 0, TAU); ctx.stroke();
  // crown: 3 o'clock on the dial side, mirrored to 9 o'clock from the back
  const cx = mirror ? -1 : 1;
  ctx.save(); ctx.scale(cx, 1);
  ctx.fillStyle = steelGrad(30); ctx.fillRect(CASE_R - 4, -14, 12, 28);
  const cg = ctx.createLinearGradient(0, -26, 0, 26); cg.addColorStop(0, '#f0f2f4'); cg.addColorStop(0.5, '#8a939e'); cg.addColorStop(1, '#d9dde2');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.roundRect(CASE_R + 8, -26, 22, 52, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(40,48,58,0.55)'; ctx.lineWidth = 0.7;
  for (let y = -22; y <= 22; y += 4) { ctx.beginPath(); ctx.moveTo(CASE_R + 10, y); ctx.lineTo(CASE_R + 28, y); ctx.stroke(); }
  ctx.restore();
}
function drawCaseback(lift) {
  const a1 = Math.min(1, lift / 0.55), a2 = Math.max(0, (lift - 0.55) / 0.45);
  const fade = 1 - a2;
  if (fade <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= fade;
  ctx.translate(0, -a2 * 240); ctx.scale(1 + a2 * 0.35, 1 + a2 * 0.35); ctx.rotate(-a1 * 1.25);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = (16 + a2 * 60) * dpr; ctx.shadowOffsetY = (6 + a2 * 40) * dpr;
  const g = ctx.createRadialGradient(-50, -60, 10, 0, 0, 170);
  g.addColorStop(0, '#eef1f4'); g.addColorStop(1, '#8c96a1');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 168, 0, TAU); ctx.fill();
  ctx.shadowColor = 'transparent';
  for (let r = 20; r < 150; r += 2.2) { ctx.strokeStyle = `rgba(${r % 4.4 < 2.2 ? '255,255,255' : '40,48,58'},${0.06 + 0.04 * Math.sin(r)})`; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(40,48,58,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 148, 0, TAU); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.rotate(i * TAU / 6);
    ctx.fillStyle = '#5d6670'; ctx.fillRect(152, -9, 16, 18);
    ctx.restore();
  }
  ctx.restore();
}
function drawGlint() {
  const ph = ((rt * 0.2) % 1.5) - 0.25;
  if (ph < 0 || ph > 1) return;
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.clip();
  const x = -260 + ph * 520;
  const g = ctx.createLinearGradient(x - 70, -150, x + 70, 150);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,250,235,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(-160, -160, 320, 320);
  ctx.restore();
}

/* ---------- Clocks shown on the dial ---------- */
function liveClock() { const id = SCENES[sceneIdx] && SCENES[sceneIdx].id; return id !== 'dial'; }
function clockMinutes() { return liveClock() ? 10 * 60 + 9 + rt / 60 : dialMinutes(); }

/* ---------- Render ---------- */
const M = {};
let studio = null;
function setLayer(x, y, sxk, syk, spin) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(x, y); ctx.scale(sxk, syk); ctx.rotate(spin); ctx.translate(-cur.fx, -cur.fy);
}
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const mn = Math.min(W, H);
  const br = {sx: 0.007 * Math.sin(0.31 * rt) + 0.004 * Math.sin(0.83 * rt + 2), sy: 0.006 * Math.sin(0.23 * rt + 1), z: 1 + 0.016 * Math.sin(0.19 * rt + 0.5), sp: 0.008 * Math.sin(0.15 * rt)};
  const k = cur.zoom * br.z * mn / 330;
  const cx = W / 2 + (cur.sx + br.sx) * mn, cy = H / 2 + (cur.sy + br.sy) * mn;
  const spin = cur.spin + liveSpin + br.sp;
  studio.draw(ctx, rt, {x: -cur.fx * k * 0.1 - br.sx * mn * 0.8 + cur.sx * mn * 0.15, y: -cur.fy * k * 0.1 - br.sy * mn * 0.8, s: Math.min(1.12, 1 + (cur.zoom - 0.85) * 0.035)});

  const ct = Math.cos(cur.tilt), st = Math.sin(cur.tilt);
  const sgn = Math.cos(Math.PI * cur.flip);
  const flipS = Math.max(0.002, Math.abs(sgn));
  const band = 30 * Math.sin(Math.PI * cur.flip) * Math.min(1, cur.case * 1.5);
  const fcx = cx - band * k * 0.5, bcx = cx + band * k * 0.5;
  const K = kin();
  const caseA = Math.max(0, Math.min(1, cur.case));

  if (band > 0.5) {   // coin edge: the case's thickness, seen mid-flip
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ry = CASE_R * k, rx = CASE_R * k * flipS;
    ctx.globalAlpha = caseA;
    const eg = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
    eg.addColorStop(0, '#cfd5db'); eg.addColorStop(0.5, '#6d7681'); eg.addColorStop(1, '#aeb6bf');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.ellipse(bcx, cy, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillRect(fcx, cy - ry, bcx - fcx, 2 * ry);
    ctx.globalAlpha = 1;
  }

  if (cur.flip < 0.5) {
    if (caseA > 0.01) {
      setLayer(fcx, cy, k * flipS, k * ct, spin);
      ctx.globalAlpha = caseA; drawStrapAndLugs(true); drawCaseRing(true); ctx.globalAlpha = 1;
    } else {
      setLayer(fcx, cy - (1 - 3.5) * 48 * cur.explode * st * k, k * flipS, k * ct, spin);
      if (cur.explode < 0.3) {
        ctx.save(); ctx.globalAlpha = (1 - cur.explode / 0.3) * 0.6 * alpha.plate;
        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 40 * dpr; ctx.shadowOffsetY = 18 * dpr;
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.beginPath(); ctx.arc(0, 0, 146, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
    LAYERS.forEach((L, i) => {
      const z = (i - 3.5) * 48 * cur.explode;
      setLayer(fcx, cy - z * st * k, k * flipS, k * ct, spin);
      M[L] = ctx.getTransform();
      const a = alpha[L];
      if (a < 0.01) return;
      ctx.globalAlpha = a;
      ({dial: drawDialBack, plate: drawPlate, barrel: () => drawBarrel(K), train: () => drawTrain(K), esc: () => drawEsc(K), bal: () => drawBal(K), bridges: drawBridges, rotor: () => drawRotor(K)})[L]();
    });
    ctx.globalAlpha = 1;
    const fa = Math.max(0, 1 - cur.explode / 0.12) * (1 - Math.min(1, cur.flip * 2)) * (1 - caseA * (1 - cur.lift));
    drawFlow(M.train, cur.flow, fa);
    if (caseA > 0.01 && cur.lift < 0.999) {
      setLayer(fcx, cy, k * flipS, k * ct, spin);
      ctx.globalAlpha = caseA; drawCaseback(cur.lift); ctx.globalAlpha = 1;
    }
  } else {
    setLayer(fcx, cy, k * flipS, k * ct, spin);
    if (caseA > 0.01) { ctx.globalAlpha = caseA; drawStrapAndLugs(false); drawCaseRing(false); ctx.globalAlpha = 1; }
    M.dialview = ctx.getTransform();
    const dT = drawFrontDial(K);
    dateAng += (dT - dateAng) * 0.35;
    if (caseA > 0.01) { setLayer(fcx, cy, k * flipS, k * ct, spin); ctx.globalAlpha = caseA; drawGlint(); ctx.globalAlpha = 1; }
  }

  if (cur.explode > 0.4 && cur.flip < 0.5) {
    const la = (cur.explode - 0.4) / 0.6;
    LAYERS.forEach(L => {
      const o = proj(M[L], cur.fx, cur.fy);
      drawCallout(o[0] + 150 * k * flipS, o[1], 46, 0, LNAME[L], la * 0.95);
    });
  }
  const s = SCENES[sceneIdx];
  if (s && s.callouts && curScene >= 0 && sceneClock > 1.8) {
    s.callouts.forEach(c => {
      if (lineIdx < c.line || !M[c.L]) return;
      if (c.L === 'dialview' && cur.flip < 0.5) return;
      const t0 = Math.max(1.8, lineStarts[c.line] ?? 0);
      const a = Math.min(1, Math.max(0, (sceneClock - t0) / 0.6));
      if (a <= 0) return;
      const [px, py] = proj(M[c.L], c.p[0], c.p[1]);
      drawCallout(px, py, c.dx, c.dy, c.t, a);
    });
  }
  studio.drawLight(ctx, rt);
}

/* ---------- Video harness ---------- */
const TL = window.__TL, FPS = TL.fps, DT = 1 / FPS;
let mode = 'playing', sceneIdx = 0, lineIdx = 0, curScene = -1, T = 0, lastTickN = null;
const ticks = [], sfx = [];
const fired = new Set();
const TICK_GAIN = {hook:0.5, watch:0.22, calibre:0.12, stack:0.06, rotor:0.06, barrel:0.05, train:0.14, esc:0.65, bal:0.38, dial:0.07, finale:0.14,
  s_hook:0.45, s_watch:0.2, s_rotor:0.06, s_esc:0.65, s_bal:0.4, s_end:0.15};
const clamp01 = v => Math.max(0, Math.min(1, v));
function sceneAt(t) { let i = -1; TL.scenes.forEach((s, j) => { if (t >= s.start) i = j; }); return i; }
function applyTimeline() {
  const i = sceneAt(T);
  if (i >= 0 && i !== curScene) {
    curScene = i; sceneIdx = i; lineIdx = 0; lineStarts = []; dialAnchor = null;
    if (SCENES[i].id === 'dial') { dateShown = 14; dateAng = -13 * TAU / 31; }
    else { dateShown = 15; dateAng = -14 * TAU / 31; }
    enterScene(SCENES[i], T);
    if (i > 0 && !['calibre', 'dial'].includes(SCENES[i].id)) sfx.push([+T.toFixed(3), 'whoosh']);
    if (SCENES[i].id === 'dial') sfx.push([+T.toFixed(3), 'flip']);
  }
  if (i < 0) { sceneClock = 0; return; }
  const S = TL.scenes[i];
  sceneClock = T - S.start;
  let started = 0; S.lines.forEach(ls => { if (T >= ls) started++; });
  for (let j = 0; j < started; j++) lineStarts[j] = S.lines[j] - S.start;
  lineIdx = Math.max(0, started - 1);
  if (SCENES[i].id === 'dial' && started >= 3 && !dialAnchor) dialAnchor = {t: sceneClock, m: dialMinutes(), jump: S.jump - S.start};
  (SCENES[i].events || []).forEach((ev, j) => {
    const key = i + ':' + j;
    if (fired.has(key)) return;
    const useMark = ev.mark && S.marks && S.marks[ev.mark] != null;
    const base = useMark ? S.marks[ev.mark] : (ev.line == null ? S.start : S.lines[ev.line]);
    const off = useMark ? (ev.markAt || 0) : (ev.at || 0);
    if (base == null || T < base + off) return;
    fired.add(key);
    camTo(ev.cam, ev.alpha, ev.dur, T);
    if (ev.sfx) sfx.push([+T.toFixed(3), ev.sfx]);
  });
}
let lastDate = 15;
function simulate() {
  const d = DT;
  stepAnims(T);
  wt += d * cur.ts; rt += d;
  if (curScene >= 0 && SCENES[sceneIdx].spinLive) liveSpin += d * 0.13 * cur.explode;
  const prev = rotorAngle;
  rotorAngle = cur.swing * (1.5 * Math.sin(0.9 * rt) + 0.6 * Math.sin(2.1 * rt + 1.3)) + 0.04 * rt;
  revAng += Math.abs(rotorAngle - prev) * 2.6;
  let wTarget = 0.85;
  const sid = SCENES[sceneIdx] ? SCENES[sceneIdx].id : '';
  if (sid === 'barrel') wTarget = Math.min(1, 0.1 + sceneClock / 15);
  if (sid === 'rotor') wTarget = Math.min(0.85, 0.35 + sceneClock / 30);
  if (sid === 's_rotor') { const S2 = TL.scenes[curScene]; const mk = (S2.marks && S2.marks.barrel != null ? S2.marks.barrel - S2.start + 0.5 : 3.3); wTarget = sceneClock < mk ? 0.3 : Math.min(1, 0.3 + (sceneClock - mk) / 3); }
  wind += (wTarget - wind) * (1 - Math.exp(-d * 2.5));
  const daTarget = (sid === 'dial' && lineIdx < 2) ? 0.6 : (sid === 'dial' ? 0.96 : 1);
  dialA += (daTarget - dialA) * (1 - Math.exp(-d * 2));
  if (sid === 'dial' && dialMinutes() >= 1440 && lastDate === 14) { sfx.push([+T.toFixed(3), 'date']); lastDate = 15; }
  if (sid === 'dial' && dialMinutes() < 1440) lastDate = 14;
  const phase = TAU * 4 * wt, q = phase / Math.PI + 0.5, n = Math.floor(q), f = q - n;
  const tn = f >= 0.62 ? n : n - 1;
  if (lastTickN === null) lastTickN = tn;
  else if (tn > lastTickN) {
    let g = TICK_GAIN[sid] ?? 0.1;
    if (TL.endStart && T > TL.endStart) g *= clamp01(1 - (T - TL.endStart) / 3);
    for (let kk = lastTickN + 1; kk <= Math.min(tn, lastTickN + 3); kk++) ticks.push([+T.toFixed(4), kk & 1, g]);
    lastTickN = tn;
  }
}
function txt(s, x, y, font, color, align = 'left', alpha = 1, spacing = 0) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = spacing + 'px';
  ctx.fillText(s, x, y); ctx.restore();
}
function lineStartAbs(id, li) { const S = TL.scenes.find(s => s.id === id); return S ? S.lines[li] : null; }
function overlaysLandscape() {
  // lower-third title during the watch introduction
  const S = TL.scenes[curScene];
  if (S && S.id === 'watch') {
    const tin = S.start + 0.8, tout = lineStartAbs('watch', 2);
    const a = clamp01((T - tin) / 0.7) * clamp01((tout - T) / 0.5);
    const slide = (1 - ease(clamp01((T - tin) / 0.9))) * -60 + (1 - clamp01((tout - T) / 0.5)) * -40;
    const pa = clamp01((T - tin) / 0.7) * clamp01((tout - T) / 0.6);
    if (pa > 0) {
      ctx.save(); ctx.globalAlpha = pa;
      const gg = ctx.createLinearGradient(0, 0, W * 0.5, 0);
      gg.addColorStop(0, 'rgba(7,9,13,0.82)'); gg.addColorStop(0.6, 'rgba(7,9,13,0.55)'); gg.addColorStop(1, 'rgba(7,9,13,0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, W * 0.5, H); ctx.restore();
    }
    if (a > 0) {
      ctx.save(); ctx.globalAlpha = a * 0.85; ctx.fillStyle = C.gilt; ctx.fillRect(140 + slide, 452, 70 * ease(clamp01((T - tin) / 1.1)), 3); ctx.restore();
      txt('A BREAKDOWN, LAYER BY LAYER', 140 + slide, 430, '500 22px "IBM Plex Mono"', C.gilt, 'left', a, 4);
      txt('Inside the', 136 + slide, 540, '400 96px "Bodoni Moda"', C.fg, 'left', a);
      txt('Calibre 3235', 136 + slide * 1.4, 646, 'italic 400 104px "Bodoni Moda"', C.gilt, 'left', a);
    }
  }
  if (curScene >= 0 && S && S.id !== 'hook' && S.id !== 'watch' && (!TL.endStart || T < TL.endStart)) {
    const a = clamp01((T - S.start - 0.4) / 0.8) * clamp01((S.end - T) / 0.5);
    const slide = (1 - ease(clamp01((T - S.start - 0.4) / 0.9))) * -30;
    const n = String(curScene - 1).padStart(2, '0');
    txt(n, 72 + slide, 96, '500 24px "IBM Plex Mono"', C.gilt, 'left', a, 2);
    txt(SCENES[curScene].title, 122 + slide, 98, 'italic 400 50px "Bodoni Moda"', C.fg, 'left', a);
    txt(SCENES[curScene].spec.toUpperCase(), W - 72, 92, '500 21px "IBM Plex Mono"', C.muted, 'right', a, 2);
    ctx.save(); ctx.globalAlpha = a * 0.5; ctx.fillStyle = C.gilt; ctx.fillRect(72, 118, 36 * ease(clamp01((T - S.start - 0.4) / 1.2)), 2); ctx.restore();
  }
  if (S && S.id === 'watch') {
    const t1 = lineStartAbs('watch', 0) + 3.2;
    const a = clamp01((T - t1) / 0.6) * clamp01((lineStartAbs('watch', 2) - T) / 0.5);
    const sl = (1 - ease(clamp01((T - t1) / 0.8))) * -40;
    txt('FOUND IN', 140 + sl, 720, '500 20px "IBM Plex Mono"', C.muted, 'left', a, 4);
    ['Datejust', 'Submariner Date', 'Sea-Dweller'].forEach((m, i) => {
      const ai = a * clamp01((T - t1 - 0.25 * i) / 0.5);
      txt(m, 140 + sl, 772 + i * 50, 'italic 400 40px "Bodoni Moda"', C.fg, 'left', ai);
    });
  }
  if (TL.endStart && T >= TL.endStart) {
    const a = clamp01((T - TL.endStart) / 1.0);
    ctx.save(); ctx.globalAlpha = a * 0.72; ctx.fillStyle = C.stage; ctx.fillRect(0, 0, W, H); ctx.restore();
    const rise = (1 - ease(a)) * 30;
    txt('SUPERLATIVE CHRONOMETER', W / 2, 360 + rise, '500 26px "IBM Plex Mono"', C.muted, 'center', a, 6);
    ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const SIGN = '300 150px "Hanken Grotesk"', NUM = '400 230px "Bodoni Moda"';
    const parts = [['−', C.gilt, SIGN], ['2', C.gilt, NUM], ['  /  ', C.muted, SIGN], ['+', C.gilt, SIGN], ['2', C.gilt, NUM]];
    const wid = q => { ctx.font = q[2]; return ctx.measureText(q[0]).width; };
    let x = W / 2 - parts.reduce((s2, q) => s2 + wid(q), 0) / 2;
    parts.forEach(q => { ctx.font = q[2]; ctx.fillStyle = q[1]; ctx.fillText(q[0], x, (q[2] === SIGN ? 580 : 610) + rise); x += wid(q); });
    ctx.restore();
    txt('SECONDS PER DAY, AFTER CASING', W / 2, 690 + rise, '500 26px "IBM Plex Mono"', C.muted, 'center', a, 6);
    txt('An independent, schematic explainer. Not affiliated with or endorsed by Rolex.', W / 2, H - 70, '400 22px "Hanken Grotesk"', C.muted, 'center', a * 0.8);
  }
}
function wrapWords(words, font, maxW) {
  ctx.font = font; const lines = []; let cur2 = [];
  words.forEach(w => { const t = cur2.concat(w).join(' '); if (ctx.measureText(t).width > maxW && cur2.length) { lines.push(cur2); cur2 = [w]; } else cur2.push(w); });
  if (cur2.length) lines.push(cur2);
  return lines;
}
function overlaysPortrait() {
  const S = TL.scenes[curScene];
  if (S && SCENES[curScene].title) {
    const a = clamp01((T - S.start - 0.2) / 0.5) * clamp01((S.end - T) / 0.4);
    const slide = (1 - ease(clamp01((T - S.start - 0.2) / 0.6))) * 30;
    txt(SCENES[curScene].title.toUpperCase(), W / 2, 300 + slide, '500 30px "IBM Plex Mono"', C.gilt, 'center', a, 5);
    if (SCENES[curScene].spec) txt(SCENES[curScene].spec.toUpperCase(), W / 2, 344 + slide, '500 22px "IBM Plex Mono"', C.muted, 'center', a, 3);
  }
  // burned-in captions with the spoken word highlighted
  const cue = (TL.cues || []).find(c => T >= c.s - 0.05 && T <= c.e + 0.3);
  if (cue) {
    const words = cue.text.split(/\s+/), n = words.length;
    const wi = Math.min(n - 1, Math.floor(clamp01((T - cue.s) / Math.max(0.3, cue.e - cue.s)) * n));
    const font = '700 62px "Hanken Grotesk"';
    const lines = wrapWords(words, font, W - 170);
    const pop = 0.92 + 0.08 * ease(clamp01((T - cue.s + 0.05) / 0.18));
    const y0 = 1380 - (lines.length - 1) * 38;
    ctx.save(); ctx.translate(W / 2, y0); ctx.scale(pop, pop);
    let idx = 0;
    lines.forEach((ln, li) => {
      ctx.font = font; const full = ln.join(' '); let x = -ctx.measureText(full).width / 2; const y = li * 78;
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
  if (S && S.id === 's_end') {
    const a = clamp01((T - S.start - 0.3) / 0.7);
    ctx.save(); ctx.globalAlpha = a * 0.45; ctx.fillStyle = C.stage; ctx.fillRect(0, 0, W, H); ctx.restore();
    const rise = (1 - ease(a)) * 40;
    txt('Inside the', W / 2, 560 + rise, '400 84px "Bodoni Moda"', C.fg, 'center', a);
    txt('Calibre 3235', W / 2, 660 + rise, 'italic 400 96px "Bodoni Moda"', C.gilt, 'center', a);
    txt('FULL BREAKDOWN ON THE CHANNEL', W / 2, 740 + rise, '500 28px "IBM Plex Mono"', C.fg, 'center', a, 4);
  }
}
function overlays() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  PORTRAIT ? overlaysPortrait() : overlaysLandscape();
  let b = 0;
  if (T < 0.35) b = 1 - T / 0.35;
  if (T > TL.total - 1.2) b = Math.max(b, clamp01((T - (TL.total - 1.2)) / 1.0));
  if (b > 0) { ctx.fillStyle = 'rgba(0,0,0,' + b.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
}
window.__init = async () => {
  const fams = ['400 40px "Bodoni Moda"', 'italic 400 40px "Bodoni Moda"', '400 20px "Hanken Grotesk"', '300 20px "Hanken Grotesk"', '700 20px "Hanken Grotesk"', '500 20px "IBM Plex Mono"'];
  await Promise.all(fams.map(f => document.fonts.load(f)));
  studio = Studio.create(W, H, {seed: 7});
  return fams.map(f => document.fonts.check(f));
};
window.__advance = (i, draw) => {
  T = i / FPS; applyTimeline(); simulate();
  if (!draw) return null;
  render(); overlays();
  return cv.toDataURL('image/jpeg', 0.93);
};
window.__ticks = () => ticks;
window.__clean = () => { render(); return cv.toDataURL('image/png'); };
window.__sfx = () => sfx;

/* ---------- Mechanism clocks ---------- */
let wt = 0, rt = 0, sceneClock = 0, rotorAngle = 0, revAng = 0, wind = 0.8, dateShown = 14, dateAng = -(13) * TAU / 31, dialA = 1;
let dialAnchor = null, lineStarts = [];
function kin() {
  const phase = TAU * 4 * wt;
  const theta = 4.0 * Math.sin(phase);
  const p = phase / Math.PI, q = p + 0.5, n = Math.floor(q), f = q - n, w = 0.12;
  const s = Math.max(0, Math.min(1, (f - (0.5 - w)) / (2 * w)));
  const ss = s * s * (3 - 2 * s);
  const sign = (n % 2 === 0) ? 1 : -1;
  const esc = (n + ss) * TAU / 30;
  const fork = 0.17 * sign * (1 - 2 * ss);
  const fourth = -esc / 16, third = -fourth / 7.5, center = -third / 8, barrel = -center / 6;
  return {theta, esc, fork, fourth, third, center, barrel};
}
function dialMinutes() {
  const base = 23 * 60 + 50 + Math.min(sceneClock * 0.4, 7.5);
  if (dialAnchor) {
    const s = sceneClock - dialAnchor.t;
    const rate = Math.max(0.6, (1440 - dialAnchor.m) / Math.max(0.6, (dialAnchor.jump ?? (dialAnchor.t + 2.4)) - dialAnchor.t));
    return dialAnchor.m + Math.min(s * rate, (1440 - dialAnchor.m) + 3);
  }
  return base;
}

/* ---------- Drawing helpers ---------- */
function giltGrad(R) {
  const g = ctx.createLinearGradient(-R, -R, R, R);
  g.addColorStop(0, '#ecd29c'); g.addColorStop(0.35, '#b88f4c'); g.addColorStop(0.6, '#f1dcac'); g.addColorStop(1, '#93713b');
  return g;
}
function steelGrad(R) {
  const g = ctx.createLinearGradient(-R, -R, R, R);
  g.addColorStop(0, '#e2e7ed'); g.addColorStop(0.5, '#8d97a4'); g.addColorStop(1, '#cdd4dc');
  return g;
}
function drawGear(path, x, y, a, R, fill, edge) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = fill === 'steel' ? steelGrad(R) : giltGrad(R);
  ctx.fill(path, 'evenodd');
  ctx.strokeStyle = edge || (fill === 'steel' ? 'rgba(40,48,58,0.75)' : 'rgba(70,46,12,0.7)');
  ctx.lineWidth = 0.45; ctx.stroke(path);
  ctx.restore();
}
function jewel(x, y, r = 3.4) {
  ctx.fillStyle = giltGrad(6); ctx.beginPath(); ctx.arc(x, y, r + 2.2, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0.2, x, y, r);
  g.addColorStop(0, '#ff9aa8'); g.addColorStop(0.45, C.ruby); g.addColorStop(1, '#5e0f1c');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a0a10'; ctx.beginPath(); ctx.arc(x, y, r * 0.28, 0, TAU); ctx.fill();
}
function arbor(x, y) {
  ctx.fillStyle = '#d9dee4'; ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(30,36,44,0.8)'; ctx.lineWidth = 0.4; ctx.stroke();
}

/* ---------- Layers ---------- */
function drawDialBack() {
  const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 150);
  g.addColorStop(0, '#1b2a45'); g.addColorStop(1, '#0d1626');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(207,171,110,0.6)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#d8d3c6'; ctx.beginPath(); ctx.arc(0, 0, 140, 0, TAU); ctx.arc(0, 0, 112, 0, TAU, true); ctx.fill('evenodd');
  ctx.strokeStyle = 'rgba(60,60,60,0.5)'; ctx.lineWidth = 0.4;
  for (let i = 0; i < 31; i++) { const a = i * TAU / 31; ctx.beginPath(); ctx.moveTo(...polar(114, a)); ctx.lineTo(...polar(119, a)); ctx.stroke(); }
  drawGear(P.hourW, 0, 0, 0, 23, 'gilt');
  drawGear(P.minuteW, -19.8, -19.8, 0, 20, 'gilt');
  drawGear(P.cannon, 0, 0, 0, 8, 'steel');
}
function drawPlate() {
  const t = TEX.plate; ctx.drawImage(t.c, -t.half, -t.half, t.half * 2, t.half * 2);
}
function drawMainspring(w, a0) {
  const N = 600, turns = 10 + 3.5 * w, rin = 10, rout = 56;
  ctx.save(); ctx.translate(G.barrel.x, G.barrel.y);
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const rW = s < 0.9 ? rin + 20 * (s / 0.9) : rin + 20 + (rout - rin - 20) * ((s - 0.9) / 0.1);
    const rU = s < 0.08 ? rin + (rout - 20 - rin) * (s / 0.08) : rout - 20 + 20 * ((s - 0.08) / 0.92);
    const r = rU + (rW - rU) * w;
    const a = s * turns * TAU + a0 * (1 - s);
    const x = r * Math.cos(a), y = r * Math.sin(a);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.strokeStyle = '#b9c3cf'; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.strokeStyle = 'rgba(20,26,34,0.55)'; ctx.lineWidth = 0.3; ctx.stroke();
  ctx.restore();
}
function drawBarrel(k) {
  const b = G.barrel;
  drawGear(P.barrel, b.x, b.y, k.barrel, 62, 'gilt');
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = '#1a212b'; ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.fill();
  const lid = ctx.createRadialGradient(-20, -20, 5, 0, 0, 58);
  lid.addColorStop(0, 'rgba(236,210,156,0.20)'); lid.addColorStop(1, 'rgba(147,113,59,0.10)');
  ctx.fillStyle = lid; ctx.fill();
  ctx.restore();
  drawMainspring(wind, k.barrel * 3 + wind * 2.4);
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = steelGrad(10); ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(40,48,58,0.8)'; ctx.lineWidth = 0.5; ctx.stroke();
  ctx.rotate(k.barrel * 4);
  ctx.strokeStyle = '#4a535e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(207,171,110,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(b.x, b.y, 58.5, 0, TAU); ctx.stroke();
  if (cur.gauge > 0.01) {
    const a0 = -Math.PI * 1.25, span = Math.PI * 1.5, r = 72;
    ctx.save(); ctx.translate(b.x, b.y); ctx.globalAlpha *= cur.gauge;
    ctx.strokeStyle = 'rgba(142,151,167,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, a0, a0 + span); ctx.stroke();
    ctx.strokeStyle = C.blue; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 0, r, a0, a0 + span * wind); ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = '500 6px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let h = 0; h <= 70; h += 10) {
      const a = a0 + span * h / 70;
      ctx.strokeStyle = 'rgba(142,151,167,0.7)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(...polar(r + 3, a)); ctx.lineTo(...polar(r + 6.5, a)); ctx.stroke();
      if (h % 20 === 0 || h === 70) ctx.fillText(String(h), ...polar(r + 12, a));
    }
    ctx.fillStyle = C.blue; ctx.font = '500 11px "IBM Plex Mono", monospace';
    const tip = polar(r - 14, a0 + span * wind);
    ctx.fillText(Math.round(wind * 70) + ' h', tip[0], tip[1]);
    ctx.restore();
  }
}
function drawTrain(k) {
  drawGear(P.centerPin, 0, 0, k.center * 7, 10, 'steel');
  drawGear(P.thirdPin, G.third.x, G.third.y, k.third * 7, 9, 'steel');
  drawGear(P.fourthPin, G.fourth.x, G.fourth.y, k.fourth * 6, 8, 'steel');
  drawGear(P.center, 0, 0, k.center, 46, 'gilt');
  drawGear(P.third, G.third.x, G.third.y, k.third, 36, 'gilt');
  drawGear(P.fourth, G.fourth.x, G.fourth.y, k.fourth, 32, 'gilt');
  arbor(0, 0); arbor(G.third.x, G.third.y); arbor(G.fourth.x, G.fourth.y);
}
function drawEsc(k) {
  drawGear(P.escapePin, G.escape.x, G.escape.y, k.esc * 2, 7, 'steel');
  drawGear(P.escape, G.escape.x, G.escape.y, k.esc, 20, 'steel', 'rgba(30,38,48,0.9)');
  arbor(G.escape.x, G.escape.y);
  ctx.save(); ctx.translate(G.fork.x, G.fork.y); ctx.rotate(k.fork);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const L = polar(34, BAL_DIR);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(STONES[0].x * 0.82, STONES[0].y * 0.82); ctx.quadraticCurveTo(0, 0, STONES[1].x * 0.82, STONES[1].y * 0.82);
    ctx.moveTo(0, 0); ctx.lineTo(L[0], L[1]);
  };
  ctx.strokeStyle = 'rgba(30,38,48,0.9)'; ctx.lineWidth = 4.2; body(); ctx.stroke();
  ctx.strokeStyle = steelGrad(20); ctx.lineWidth = 3.2; body(); ctx.stroke();
  const n = [-Math.sin(BAL_DIR), Math.cos(BAL_DIR)], f = [Math.cos(BAL_DIR), Math.sin(BAL_DIR)];
  ctx.strokeStyle = '#c9d0d8'; ctx.lineWidth = 1.4;
  [1, -1].forEach(sg => {
    ctx.beginPath(); ctx.moveTo(L[0] + n[0] * 2.6 * sg, L[1] + n[1] * 2.6 * sg);
    ctx.lineTo(L[0] + n[0] * 2.6 * sg + f[0] * 4.5, L[1] + n[1] * 2.6 * sg + f[1] * 4.5); ctx.stroke();
  });
  STONES.forEach(st => {
    ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(st.a);
    const g = ctx.createLinearGradient(-3, 0, 3, 0); g.addColorStop(0, '#ff8b9a'); g.addColorStop(1, '#8c1a2b');
    ctx.fillStyle = g; ctx.fillRect(-3.2, -1.3, 6.4, 2.6);
    ctx.restore();
  });
  ctx.fillStyle = '#d9dee4'; ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawBal(k) {
  const b = G.balance, th = k.theta;
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.save(); ctx.rotate(th);
  ctx.fillStyle = giltGrad(46); ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.arc(0, 0, 40.5, 0, TAU, true); ctx.fill('evenodd');
  ctx.strokeStyle = 'rgba(70,46,12,0.7)'; ctx.lineWidth = 0.5; ctx.stroke();
  ctx.strokeStyle = giltGrad(46); ctx.lineWidth = 4; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(-41, 0); ctx.lineTo(41, 0); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const [x, y] = polar(42.5, Math.PI / 4 + i * Math.PI / 2);
    ctx.fillStyle = giltGrad(4); ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(70,46,12,0.8)'; ctx.lineWidth = 0.4; ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = steelGrad(8); ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, TAU); ctx.fill();
  const ij = polar(6.2, ROLLER_DIR + th);
  ctx.fillStyle = C.ruby; ctx.beginPath(); ctx.arc(ij[0], ij[1], 1.4, 0, TAU); ctx.fill();
  const N = 520, turns = 12.5, r0 = 8, r1 = 35, stud = -2.3;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const s = i / N, r = r0 + (r1 - r0) * s;
    const a = stud - (1 - s) * turns * TAU + th * (1 - s);
    const x = r * Math.cos(a), y = r * Math.sin(a);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  const end = polar(r1, stud);
  ctx.quadraticCurveTo(end[0] * 1.08 + 6, end[1] * 1.08 - 6, ...polar(26, stud + 0.55));
  ctx.strokeStyle = C.blue; ctx.lineWidth = 0.62;
  ctx.shadowColor = 'rgba(93,157,255,0.55)'; ctx.shadowBlur = 4 * dpr;
  ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#8d97a4'; ctx.beginPath(); ctx.arc(end[0], end[1], 1.8, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#7fb0ff'; ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + 0.3; ctx.moveTo(...polar(2.2, a)); ctx.quadraticCurveTo(...polar(7.5, a + 0.6), ...polar(4.2, a + 1.4)); }
  ctx.stroke();
  jewel(0, 0, 2.2);
  ctx.restore();
}
function drawBridges() {
  const plateG = ctx.createLinearGradient(-150, -150, 150, 150);
  plateG.addColorStop(0, '#dce1e6'); plateG.addColorStop(0.5, '#a3acb6'); plateG.addColorStop(1, '#ccd2d9');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const shapes = [
    [() => { ctx.beginPath(); ctx.moveTo(G.barrel.x, G.barrel.y); ctx.lineTo(-128, -72); }, 44],
    [() => { ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(0, 0); ctx.lineTo(G.third.x, G.third.y); ctx.lineTo(G.fourth.x, G.fourth.y); ctx.lineTo(G.escape.x, G.escape.y); ctx.lineTo(G.fork.x, G.fork.y); }, 22],
    [() => { ctx.beginPath(); ctx.moveTo(0, 140); ctx.lineTo(100, 84); }, 13]
  ];
  ctx.fillStyle = '#4b545f'; ctx.beginPath(); ctx.arc(G.barrel.x, G.barrel.y, 40, 0, TAU); ctx.fill();
  shapes.forEach(([f, w]) => { ctx.strokeStyle = '#4b545f'; ctx.lineWidth = w + 2; f(); ctx.stroke(); });
  shapes.forEach(([f, w]) => { ctx.strokeStyle = plateG; ctx.lineWidth = w; f(); ctx.stroke(); });
  ctx.fillStyle = plateG; ctx.beginPath(); ctx.arc(G.barrel.x, G.barrel.y, 39, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 0.5;
  for (let r = 8; r < 39; r += 5) { ctx.beginPath(); ctx.arc(G.barrel.x, G.barrel.y, r, 0, TAU); ctx.stroke(); }
  [[0, 140], [100, 84], [-128, -72], [-12, 8]].forEach(([x, y]) => {
    ctx.fillStyle = steelGrad(4); ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3e4650'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x - 2.4, y + 1); ctx.lineTo(x + 2.4, y - 1); ctx.stroke();
  });
  [[G.barrel.x, G.barrel.y, 4.6], [0, 0, 3.4], [G.third.x, G.third.y, 3], [G.fourth.x, G.fourth.y, 3], [G.escape.x, G.escape.y, 2.6], [G.fork.x, G.fork.y, 2.4], [G.balance.x, G.balance.y, 3]].forEach(([x, y, r]) => jewel(x, y, r));
}
function drawRotor(k) {
  ctx.save();
  [[-12, 4], [12, -4]].forEach(([dx, dy], i) => drawGear(P.rev, G.rev.x + dx, G.rev.y + dy, (i ? -1 : 1) * revAng, 10, 'steel'));
  ctx.rotate(rotorAngle);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 14 * dpr;
  const t = TEX.rotor; ctx.drawImage(t.c, -t.half, -t.half, t.half * 2, t.half * 2);
  ctx.restore();
}
function drawFrontDial(k) {
  const mins = clockMinutes();
  const minA = (mins % 60) / 60 * TAU, hrA = (mins % 720) / 720 * TAU, secA = ((mins * 60) % 60) / 60 * TAU;
  const want = (liveClock() || mins >= 1440) ? 15 : 14;
  if (want !== dateShown) dateShown = want;
  const dTarget = -(dateShown - 1) * TAU / 31;
  ctx.save(); ctx.rotate(dateAng);
  ctx.fillStyle = '#e6e1d4'; ctx.beginPath(); ctx.arc(0, 0, 141, 0, TAU); ctx.arc(0, 0, 112, 0, TAU, true); ctx.fill('evenodd');
  ctx.fillStyle = '#16181c'; ctx.font = '600 13px "Hanken Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let d = 1; d <= 31; d++) {
    const a = (d - 1) * TAU / 31; ctx.save(); ctx.translate(...polar(128, a)); ctx.rotate(a); ctx.fillText(String(d), 0, 1); ctx.restore();
  }
  ctx.restore();
  drawGear(P.hourW, 0, 0, hrA, 23, 'gilt');
  drawGear(P.minuteW, -19.8, -19.8, -minA * 0.4, 20, 'gilt');
  drawGear(P.cannon, 0, 0, minA, 8, 'steel');
  ctx.save();
  ctx.globalAlpha *= dialA;
  const dg = ctx.createRadialGradient(-30, -40, 10, 0, 0, 150);
  dg.addColorStop(0, '#22375c'); dg.addColorStop(1, '#0c1526');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(0, 0, 148, 0, TAU); ctx.rect(118, -9, 21, 18); ctx.fill('evenodd');
  for (let a = 0; a < TAU; a += 0.02) { ctx.strokeStyle = `rgba(255,255,255,${0.015 + 0.02 * Math.abs(Math.sin(a * 23))})`; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(...polar(146, a)); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = C.gilt; ctx.lineWidth = 1; ctx.strokeRect(117.5, -9.5, 22, 19);
  ctx.strokeStyle = 'rgba(207,171,110,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 148, 0, TAU); ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const a = i * TAU / 60 - Math.PI / 2; ctx.strokeStyle = 'rgba(235,231,222,0.55)'; ctx.lineWidth = i % 5 ? 0.5 : 1;
    ctx.beginPath(); ctx.moveTo(...polar(141, a)); ctx.lineTo(...polar(146, a)); ctx.stroke();
  }
  for (let i = 0; i < 12; i++) {
    if (i === 3) continue;
    const a = i * TAU / 12 - Math.PI / 2;
    ctx.save(); ctx.rotate(a); const w = i === 0 ? 7 : 4.6;
    ctx.fillStyle = giltGrad(10); ctx.fillRect(112, -w / 2, 24, w);
    ctx.fillStyle = '#efe8d6'; ctx.fillRect(114, -w / 2 + 1.1, 20, w - 2.2);
    ctx.restore();
  }
  const hand = (a, len, w, tail) => {
    ctx.save(); ctx.rotate(a);
    ctx.fillStyle = giltGrad(len); ctx.beginPath(); ctx.moveTo(-w / 2, tail); ctx.lineTo(-w / 2, -len + w); ctx.lineTo(0, -len); ctx.lineTo(w / 2, -len + w); ctx.lineTo(w / 2, tail); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#efe8d6'; ctx.fillRect(-w / 2 + 1.2, -len + w + 2, w - 2.4, len * 0.62);
    ctx.restore();
  };
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6 * dpr; ctx.shadowOffsetY = 2 * dpr;
  hand(hrA, 82, 7, 14); hand(minA, 128, 5, 16);
  ctx.save(); ctx.rotate(secA);
  ctx.strokeStyle = '#ece6d6'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(0, 28); ctx.lineTo(0, -138); ctx.stroke();
  ctx.fillStyle = '#ece6d6'; ctx.beginPath(); ctx.arc(0, -104, 3.6, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = giltGrad(6); ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
  return dTarget;
}

/* ---------- Flow line & labels ---------- */
const FLOW = [G.rev, G.barrel, G.center, G.third, G.fourth, G.escape, G.fork, G.balance];
function drawFlow(m, f, a) {
  if (f < 0.02 || a < 0.02) return;
  ctx.save(); ctx.setTransform(m);
  const s = Math.hypot(m.a, m.b) / dpr;
  ctx.globalAlpha = a;
  ctx.beginPath(); ctx.moveTo(FLOW[0].x, FLOW[0].y);
  const full = Math.floor(f), part = f - full;
  for (let i = 1; i <= Math.min(full, FLOW.length - 1); i++) ctx.lineTo(FLOW[i].x, FLOW[i].y);
  if (full < FLOW.length - 1 && part > 0) {
    const A = FLOW[full], B = FLOW[full + 1];
    ctx.lineTo(A.x + (B.x - A.x) * part, A.y + (B.y - A.y) * part);
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(93,157,255,0.22)'; ctx.lineWidth = 7 / s; ctx.stroke();
  ctx.setLineDash([7 / s, 9 / s]); ctx.lineDashOffset = -rt * 34 / s;
  ctx.strokeStyle = C.blue; ctx.lineWidth = 2.2 / s;
  ctx.shadowColor = 'rgba(93,157,255,0.8)'; ctx.shadowBlur = 10 * dpr;
  ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0;
  for (let i = 0; i <= Math.min(Math.ceil(f), FLOW.length - 1); i++) {
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(FLOW[i].x, FLOW[i].y, 3.2 / s, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function proj(m, x, y) { const p = m.transformPoint(new DOMPoint(x, y)); return [p.x / dpr, p.y / dpr]; }
function labelFont(px) { ctx.font = `500 ${px}px "IBM Plex Mono", ui-monospace, monospace`; }
function drawCallout(px, py, dx, dy, text, a) {
  const sc = UI.sc;
  const fs = UI.fs;
  labelFont(fs);
  const tw = ctx.measureText(text.toUpperCase()).width;
  let lx = px + dx * sc, ly = py + dy * sc;
  const right = dx >= 0;
  let tx = right ? lx + 14 : lx - 14 - tw;
  tx = Math.max(40, Math.min(W - tw - 40, tx));
  ly = Math.max(150, Math.min(H - 70, ly));
  lx = right ? tx - 12 : tx + tw + 12;
  ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = a;
  ctx.strokeStyle = 'rgba(235,231,222,0.6)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(lx, ly); ctx.stroke();
  ctx.fillStyle = C.fg; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(7,9,13,0.78)'; ctx.fillRect(tx - 10, ly - fs * 0.95, tw + 20, fs * 1.9);
  ctx.fillStyle = C.fg; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(text.toUpperCase(), tx, ly + 0.5);
  ctx.restore();
}


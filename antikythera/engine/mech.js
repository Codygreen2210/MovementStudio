/* Antikythera film — the working model: astronomy, gear train, front and back dials, pin-and-slot. */
'use strict';
const YEAR = 365.2422, SYN = 29.5306, SID = 27.3217, ANOM = 27.5546, APSE = 3232.6;
function sky(d) {
  const sun = d / YEAR * TAU;
  const meanMoon = d / SID * TAU, anom = d / ANOM * TAU - d / APSE * TAU * 0;
  const moon = meanMoon + 0.11 * Math.sin(anom);                          // the pin-and-slot's job: the Moon's uneven speed
  const phase = ((moon - sun) % TAU + TAU) % TAU;                          // 0 new, PI full
  const months = d / SYN;
  return {sun, moon, phase, months, metonic: (months / 235) % 1, saros: (months / 223) % 1, games: (d / YEAR / 4) % 1, exel: (months / 669) % 1};
}
// gear train angles (radians) driven by b1 turning once per year
function train(d) {
  const b = d / YEAR * TAU;
  const c = -b * 64 / 38, dd = -c * 48 / 24, e = -dd * 127 / 32;
  return {b, c, d: dd, e};
}

/* phase ball: half silver, half black, seen side-on */
function phaseBall(x, y, r, phase) {
  X.save(); X.translate(x, y);
  X.fillStyle = '#16120c'; X.beginPath(); X.arc(0, 0, r, 0, TAU); X.fill();
  const k = Math.cos(phase);                                                // 1 new .. -1 full
  X.fillStyle = rad(-r * 0.3, -r * 0.3, 0, r * 1.2, [[0, '#ffffff'], [1, '#9aa3ad']]);
  X.beginPath();
  if (phase < Math.PI) { X.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); X.ellipse(0, 0, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0); }
  else { X.arc(0, 0, r, Math.PI / 2, -Math.PI / 2); X.ellipse(0, 0, Math.abs(k) * r, r, 0, -Math.PI / 2, Math.PI / 2, k > 0); }
  X.fill();
  X.strokeStyle = 'rgba(40,24,8,0.9)'; X.lineWidth = 2; X.beginPath(); X.arc(0, 0, r, 0, TAU); X.stroke();
  X.restore();
}
function pointer(cx, cy, a, len, w, col, o = {}) {
  X.save(); X.translate(cx, cy); X.rotate(a);
  X.shadowColor = 'rgba(0,0,0,0.5)'; X.shadowBlur = 8; X.shadowOffsetY = 4;
  X.fillStyle = col; X.beginPath(); X.moveTo(-w, 0); X.lineTo(0, -len); X.lineTo(w, 0); X.lineTo(0, len * 0.12); X.closePath(); X.fill();
  X.restore();
}
/* front face with live pointers. s = scale, d = days */
function frontDial(cx, cy, s, d, o = {}) {
  if (!FRONT) makeFront();
  const k = sky(d), F0 = FRONT;
  X.save(); X.translate(cx, cy); X.scale(s * (o.sx ?? 1), s);
  if (o.case !== false) { drawCase(0, 0, 1, 'front', {}); } else { X.save(); X.shadowColor = 'rgba(0,0,0,0.6)'; X.shadowBlur = 50; X.shadowOffsetY = 24; X.drawImage(F0.c, -F0.w / 2, -F0.h / 2); X.restore(); }
  const ox = F0.cx - F0.w / 2, oy = F0.cy - F0.h / 2;
  // planetary rings (2021 reconstruction), drawn under the Sun and Moon
  const pr = o.planets || 0;
  if (pr > 0.01) {
    const P = [['MERCURY', 0.2408, '#c9c3b6'], ['VENUS', 0.6152, '#f4e3b5'], ['MARS', 1.8808, '#e0715a'], ['JUPITER', 11.862, '#e9c27d'], ['SATURN', 29.457, '#cdb98c']];
    P.forEach(([nm, per, col], i) => {
      const r = 230 - i * 30;
      X.save(); X.globalAlpha *= pr;
      X.strokeStyle = 'rgba(111,180,255,0.8)'; X.lineWidth = 3; X.setLineDash([10, 6]); X.beginPath(); X.arc(ox, oy, r, 0, TAU); X.stroke(); X.setLineDash([]);
      const a = d / YEAR / per * TAU + i * 1.3 - Math.PI / 2;
      X.fillStyle = col; X.shadowColor = col; X.shadowBlur = 14; X.beginPath(); X.arc(ox + Math.cos(a) * r, oy + Math.sin(a) * r, 9, 0, TAU); X.fill();
      X.restore();
      if (o.planetLabels) txt(nm, ox + Math.cos(-Math.PI / 2 - 0.12) * r * 0 + 0, oy - r - 6, FONT.mono(13), '#bfe0ff', 'center', pr * o.planetLabels, 2);
    });
  }
  // Sun / date pointer
  pointer(ox, oy, k.sun, F0.R1 - 6, 7, lin(0, -300, 0, 0, [[0, '#ffe39a'], [1, '#b98a3c']]));
  X.save(); X.translate(ox, oy); X.rotate(k.sun); X.fillStyle = rad(0, -F0.R2 + 6, 0, 18, [[0, '#fff4c2'], [0.5, '#ffc94a'], [1, '#b8781e']]); X.shadowColor = '#ffb83a'; X.shadowBlur = 20; X.beginPath(); X.arc(0, -F0.R2 + 6, 16, 0, TAU); X.fill(); X.restore();
  // Moon pointer with phase ball
  pointer(ox, oy, k.moon, F0.R2 - 40, 6, lin(0, -220, 0, 0, [[0, '#e9edf2'], [1, '#7c848e']]));
  const mx = ox + Math.sin(k.moon) * (F0.R2 - 80), my = oy - Math.cos(k.moon) * (F0.R2 - 80);
  phaseBall(mx, my, 20, k.phase);
  X.fillStyle = rad(ox - 6, oy - 6, 0, 22, [[0, '#ffe8b0'], [1, '#7a5222']]); X.beginPath(); X.arc(ox, oy, 18, 0, TAU); X.fill();
  X.restore();
  return {ox, oy, k};
}
function backDial(cx, cy, s, d, o = {}) {
  if (!BACK) makeBack();
  const k = sky(d), B = BACK;
  X.save(); X.translate(cx, cy); X.scale(s * (o.sx ?? 1), s);
  if (o.case !== false) drawCase(0, 0, 1, 'back', {}); else X.drawImage(B.c, -B.w / 2, -B.h / 2);
  const tx = -B.w / 2, ty = -B.h / 2;
  // highlight sweeps
  const hl = (S, frac, col, a) => { if (a <= 0.01) return; X.save(); X.translate(tx, ty); X.globalAlpha *= a; X.strokeStyle = col; X.lineWidth = (S.r1 - S.r0) / S.turns * 0.8; X.lineCap = 'round'; X.beginPath();
    const n = Math.max(2, Math.floor(400 * frac)); for (let i = 0; i <= n; i++) { const [x, y] = spiralPos(S, i / 400); i ? X.lineTo(x, y) : X.moveTo(x, y); } X.stroke(); X.restore(); };
  hl(B.up, o.upFill || 0, 'rgba(255,200,110,0.28)', o.upA ?? 1);
  hl(B.lo, o.loFill || 0, 'rgba(120,200,255,0.28)', o.loA ?? 1);
  // glyph glow
  if (o.glyphs > 0) { X.save(); X.translate(tx, ty); B.seasons.forEach((cn, j) => { const ga = clamp01(o.glyphs * 38 - j); if (ga <= 0) return; const [x, y] = spiralPos(B.lo, (cn + 0.5) / B.lo.cells); X.fillStyle = B.solar.has(cn) ? `rgba(255,190,80,${0.75 * ga})` : `rgba(160,220,255,${0.75 * ga})`; X.shadowColor = X.fillStyle; X.shadowBlur = 14; X.beginPath(); X.arc(x, y, 9, 0, TAU); X.fill(); }); X.restore(); }
  // pointers with follower pins
  const ptr = (S, f, col) => { const [x, y, a] = spiralPos(S, f); X.save(); X.translate(tx + S.cx, ty + S.cy); X.rotate(a + Math.PI / 2);
    X.shadowColor = 'rgba(0,0,0,0.5)'; X.shadowBlur = 8; X.fillStyle = col; X.fillRect(-4, -S.r1 - 18, 8, S.r1 + 18); X.restore();
    X.fillStyle = '#fff2d0'; X.beginPath(); X.arc(tx + x, ty + y, 6.5, 0, TAU); X.fill(); X.strokeStyle = '#4a2a0a'; X.lineWidth = 2; X.stroke(); return [tx + x, ty + y]; };
  const pu = ptr(B.up, o.metonic ?? k.metonic, 'rgba(240,215,160,0.95)');
  const pl = ptr(B.lo, o.saros ?? k.saros, 'rgba(240,215,160,0.95)');
  // games dial: the one pointer that turns the other way
  const ga = -(o.games ?? k.games) * TAU;
  X.save(); X.translate(tx + B.up.cx + 28, ty + B.up.cy); X.rotate(ga); X.fillStyle = '#ffe2a0'; X.fillRect(-2.5, -32, 5, 34); X.restore();
  X.save(); X.translate(tx + B.up.cx - 28, ty + B.up.cy); X.rotate((k.months / 940) * TAU); X.fillStyle = '#e8d6aa'; X.fillRect(-2, -30, 4, 31); X.restore();
  X.save(); X.translate(tx + B.lo.cx, ty + B.lo.cy); X.rotate((o.exel ?? k.exel) * TAU); X.fillStyle = '#e8d6aa'; X.fillRect(-2.5, -36, 5, 37); X.restore();
  X.restore();
  return {pu, pl, k};
}
/* the gear train in a 2.5D cutaway. returns screen positions of gear centres */
const TRAIN = [ // name, teeth, radius(px at s=1), x, y, angleKey  (same module for each meshing pair)
  ['b1', 223, 312, 0, 0, 'b'], ['a1', 48, 67, 379, -10, 'a'], ['b2', 64, 90, 0, 0, 'b'], ['c1', 38, 53, 143, 0, 'c'], ['c2', 48, 67, 143, 0, 'c'],
  ['d1', 24, 34, 240.6, 26, 'd'], ['d2', 127, 178, 240.6, 26, 'd'], ['e2', 32, 45, 461.4, 57, 'e']];
function gearTrain(cx, cy, s, d, o = {}) {
  const A = train(d), pos = {};
  A.a = A.b * 223 / 48 * -1;
  X.save(); X.translate(cx, cy); X.scale(s, s * (o.tilt ?? 1));
  const hl = o.hl || {};
  const order = ['b1', 'a1', 'd2', 'b2', 'c1', 'c2', 'd1', 'e2'];
  order.forEach(nm => {
    const g = TRAIN.find(q => q[0] === nm); const [, n, r, x, y, key] = g;
    const al = (o.alpha && o.alpha[nm] != null) ? o.alpha[nm] : 1; if (al <= 0.01) return;
    const lift = nm === 'b2' || nm === 'c2' || nm === 'd2' ? -14 : 0;
    gear(x, y + lift, n, r, A[key] + meshPhase(n, nm.length), o.style || 'new', {spokes: nm === 'b1' ? 4 : (r > 80 ? 4 : 0), alpha: al, blur: 18});
    if (hl[nm] > 0.01) { X.save(); X.globalAlpha *= hl[nm]; X.strokeStyle = C.cyan; X.lineWidth = 4; X.shadowColor = C.cyan; X.shadowBlur = 20; X.beginPath(); X.arc(x, y + lift, r + 6, 0, TAU); X.stroke(); X.restore(); }
    const p = X.getTransform().transformPoint(new DOMPoint(x, y + lift)); pos[nm] = [p.x, p.y, r * s];
  });
  X.restore();
  return pos;
}
/* pin-and-slot: k1 turns evenly, k2 is dragged by a pin riding in its slot */
function pinSlot(cx, cy, s, th, o = {}) {
  const e = (o.e ?? 44), rp = 120;                    // offset between centres (exaggerated), pin radius
  const p1 = [Math.cos(th) * rp, Math.sin(th) * rp];
  const th2 = Math.atan2(p1[1], p1[0] - e);
  X.save(); X.translate(cx, cy); X.scale(s, s);
  gear(0, 0, 50, 170, th, 'new', {blur: 20, depth: 0.5, spokes: 4});
  // k2 sits in front, drawn translucent so both wheels read
  X.save(); X.globalAlpha *= 0.62; gear(e, 0, 50, 168, th2 + 0.06, 'dark', {blur: 26, sy: 16, depth: 0.5}); X.restore();
  X.save(); X.translate(e, 0); X.rotate(th2); X.strokeStyle = 'rgba(190,220,240,0.85)'; X.lineWidth = 3; X.beginPath(); X.arc(0, 0, 160, 0, TAU); X.stroke();
  X.fillStyle = 'rgba(8,10,12,0.95)'; X.beginPath(); X.roundRect(55, -11, 120, 22, 11); X.fill(); X.strokeStyle = 'rgba(190,220,240,0.7)'; X.lineWidth = 2; X.stroke(); X.restore();
  // pin on k1
  X.fillStyle = rad(p1[0] - 3, p1[1] - 3, 0, 12, [[0, '#fff3c8'], [1, '#a07032']]); X.shadowColor = '#ffcf6a'; X.shadowBlur = o.pinGlow ? 30 : 8; X.beginPath(); X.arc(p1[0], p1[1], 10, 0, TAU); X.fill(); X.shadowBlur = 0;
  [[0, 0, C.gilt], [e, 0, '#cfe3f0']].forEach(([x, y, c]) => { X.fillStyle = c; X.beginPath(); X.arc(x, y, 8, 0, TAU); X.fill(); });
  X.restore();
  return {th2};
}

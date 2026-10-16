/* Antikythera film — scenes: the crank, the pin-and-slot, the back dials. */
'use strict';
function crankArm(x, y, s, a, al = 1) {
  X.save(); X.globalAlpha *= al; X.translate(x, y); X.scale(s, s);
  X.fillStyle = lin(-20, -20, 20, 20, [[0, '#b98a4a'], [1, '#6b4720']]); X.beginPath(); X.arc(0, 0, 22, 0, TAU); X.fill();
  const kx = Math.cos(a) * 95, ky = Math.sin(a) * 30;
  X.strokeStyle = '#8a6030'; X.lineWidth = 16; X.lineCap = 'round'; X.beginPath(); X.moveTo(0, 0); X.lineTo(kx, ky); X.stroke();
  X.fillStyle = lin(kx - 14, ky - 30, kx + 14, ky + 30, [[0, '#7a5328'], [1, '#3e2810']]); X.beginPath(); X.roundRect(kx - 13, ky - 46, 26, 60, 12); X.fill();
  X.restore();
}
function equation(terms, y, a) {
  // terms: [{s, a}] ; drawn centred
  const f = FONT.num(64, 500), gap = 28; let wtot = 0; const ws = terms.map(q => { const w = measure(q.s, f); wtot += w + gap; return w; }); wtot -= gap;
  let x = W / 2 - wtot / 2;
  terms.forEach((q, i) => { txtShadow(q.s, x + ws[i] / 2, y + (1 - ease(q.a)) * 20, f, q.c || C.fg, 'center', q.a * a); x += ws[i] + gap; });
}

/* ---------- 5. CRANK ---------- */
function sCrank(t) {
  const s = 'crank', T = F.T, S = F.scene;
  const tCase = m(s, 'case'), tH = m(s, 'handle'), tB1 = m(s, 'b1'), tY = m(s, 'year'), tSun = m(s, 'sun'), tEg = m(s, 'egypt'), tMp = m(s, 'moonp'), tFa = m(s, 'faster'), tRa = m(s, 'ratio'), tNd = m(s, 'need'), tBu = m(s, 'built'), tG1 = m(s, 'g1'), tG2 = m(s, 'g2'), tG3 = m(s, 'g3'), tMu = m(s, 'mult'), tEx = m(s, 'exact');
  bench(T);
  // crank turning: slow by default, one full year between `year` and `sun`
  let d = (T - S.start) * 3;
  if (T > tY) d += 365.24 * P(tY + 0.4, 3.6, smooth);
  if (T > tFa) d += 365.24 * P(tFa + 0.3, 5.5, smooth);
  if (T > tBu) d += (T - tBu) * 12;
  const crankA = d / 78 * TAU;                                                     // roughly 78 days per turn of the handle
  if (T < tH) {
    const z = 0.6 + 0.08 * P(S.start, 3) + 0.02 * Math.sin(T * 0.4);
    X.save(); cam(z * 1.15, 0, 30); frontDial(W / 2, H / 2, 1, d, {}); crankArm(W / 2 + 470, H / 2 + 40, 1, crankA, P(S.start + 0.6, 1)); X.restore();
    const da = WIN(tCase + 0.6, tH - 0.1);
    if (da > 0) { X.save(); X.globalAlpha = da; X.strokeStyle = C.fg; X.lineWidth = 2; X.beginPath(); X.moveTo(W / 2 - 300, 1040); X.lineTo(W / 2 + 300, 1040); X.stroke(); X.restore(); txt('ABOUT 34 × 18 CM — SHOEBOX-SIZED', W / 2, 1020, FONT.mono(20), C.fg, 'center', da, 3); }
    RECON(WIN(S.start + 0.5, S.end));
  } else if (T < tSun) {
    // cutaway: the drive wheel b1
    const k = P(tH, 1.2);
    X.save(); cam(lerp(0.6, 0.95, k), lerp(0, -40, k), 30);
    X.save(); X.globalAlpha = 1 - k; frontDial(W / 2, H / 2, 1, d, {}); X.restore();
    const pos = gearTrain(W / 2, H / 2, 1, d, {alpha: {a1: k, b2: 0, c1: 0, c2: 0, d1: 0, d2: 0, e2: 0, b1: k}, hl: {b1: WIN(tB1, tY + 0.5)}});
    crankArm(W / 2 + 560, H / 2 - 10, 1, crankA, 1);
    X.restore();
    if (T > tB1) {
      const n = Math.min(223, Math.floor(P(tB1 + 0.2, 2.2, x => x) * 223));
      txtShadow(String(n), 330, 520, FONT.num(140), C.gilt2, 'center', WIN(tB1, tY + 0.2)); txt('TEETH', 330, 580, FONT.mono(28), C.fg, 'center', WIN(tB1, tY + 0.2), 8);
    }
    if (T > tY) { txtShadow('1 turn = 1 year', 330, 540, FONT.serif(64, true), C.gilt2, 'center', WIN(tY + 0.4, tSun)); }
    chip('THE MAIN DRIVE WHEEL', 80, 990, WIN(tH + 0.5, tSun), {size: 20}); RECON(1);
  } else if (T < tBu) {
    const z = T < tMp ? 0.9 : lerp(0.9, 0.82, P(tMp, 1));
    X.save(); cam(z, 0, 20); const r = frontDial(W / 2, H / 2, 1, d, {}); X.restore();
    const ox = W / 2 + (r.ox) * z, oy = H / 2 + 20 + r.oy * z;   // dial centre on screen (approx)
    const cx0 = W / 2, cy0 = H / 2 + 20;
    const sa = WIN(tSun + 0.3, tMp + 2.5), ea = WIN(tEg + 0.2, tMp + 2.5), ma = WIN(tMp + 0.2, tRa);
    const sp = [cx0 + Math.sin(r.k.sun) * 250 * z, cy0 - Math.cos(r.k.sun) * 250 * z];
    callout(sp[0], sp[1], 260, 300, 'SUN · ZODIAC RING', sa);
    if (ea > 0) { X.save(); X.globalAlpha = ea * (0.6 + 0.4 * Math.sin(T * 3)); X.strokeStyle = C.gilt2; X.lineWidth = 5; X.shadowColor = C.gilt; X.shadowBlur = 20; X.beginPath(); X.arc(cx0, cy0, 320 * z, 0, TAU); X.stroke(); X.restore(); callout(cx0 - 230 * z, cy0 + 230 * z, 260, 820, 'EGYPTIAN CALENDAR', ea); }
    const mp = [cx0 + Math.sin(r.k.moon) * 170 * z, cy0 - Math.cos(r.k.moon) * 170 * z];
    callout(mp[0], mp[1], 1440, 260, 'MOON · WITH PHASE BALL', ma);
    if (T > tFa) {
      const yr = Math.max(0, d - (T > tY ? 365.24 : 0) - (T - S.start) * 3);
      const la = WIN(tFa + 0.2, tRa);
      txt('SUN', 1500, 760, FONT.mono(24), C.muted, 'left', la, 4); txt((r.k.sun / TAU % 100).toFixed(2) + '', 1700, 760, FONT.mono(30), C.gilt2, 'right', 0);
      const sunL = clamp01(P(tFa + 0.3, 5.5, smooth)), moonL = sunL * 254 / 19;
      txt(sunL.toFixed(2) + ' LAPS', 1820, 760, FONT.mono(30), C.gilt2, 'right', la, 2);
      txt('MOON', 1500, 820, FONT.mono(24), C.muted, 'left', la, 4); txt(moonL.toFixed(2) + ' LAPS', 1820, 820, FONT.mono(30), C.fg, 'right', la, 2);
    }
    if (T > tRa) { dim(0.55 * P(tRa, 0.6)); bigLine('254 laps of the zodiac', 470, WIN(tRa + 0.2, tBu), {size: 84}); bigLine('every 19 years', 580, WIN(tRa + 0.9, tBu), {size: 84, italic: true, color: C.gilt2}); }
    if (T > tNd) { txtShadow('254 : 19', W / 2, 770, FONT.num(110), C.gilt2, 'center', WIN(tNd + 0.2, tBu)); }
    RECON(1);
  } else {
    // the lunar train
    const k = P(tBu, 1.4, settle);
    X.save(); cam(lerp(0.7, 1.4, k), lerp(0, -330, k), lerp(0, 60, k));
    const hl = {b2: WIN(tG1, tG2 + 0.2), c1: WIN(tG1 + 0.4, tG2 + 0.2), c2: WIN(tG2, tG3 + 0.2), d1: WIN(tG2 + 0.4, tG3 + 0.2), d2: WIN(tG3, tMu + 0.2), e2: WIN(tG3 + 0.4, tMu + 0.2)};
    if (T > tMu) Object.keys(hl).forEach(q => hl[q] = 0.5 * WIN(tMu + 0.4, tEx));
    const pos = gearTrain(W / 2, H / 2, 1, d, {tilt: 0.9, alpha: {b1: 0.35, a1: 0.35}, hl});
    X.restore();
    const lab = (nm, s1, a) => { const p = pos[nm]; if (!p || a <= 0.01) return; X.save(); X.globalAlpha = a * 0.8; X.fillStyle = 'rgba(7,9,13,0.8)'; X.beginPath(); X.arc(p[0], p[1], 30, 0, TAU); X.fill(); X.restore(); txt(s1, p[0], p[1] + 2, FONT.num(30, 700), C.gilt2, 'center', a, 0, 'middle'); };
    lab('b2', '64', WIN(tG1, S.end)); lab('c1', '38', WIN(tG1 + 0.4, S.end)); lab('c2', '48', 0); lab('d1', '24', WIN(tG2 + 0.4, S.end)); lab('d2', '127', WIN(tG3, S.end)); lab('e2', '32', WIN(tG3 + 0.4, S.end));
    const e1 = P(tG1, 0.6), e2 = P(tG2, 0.6), e3 = P(tG3, 0.6), e4 = P(tMu + 0.6, 0.8);
    const eqA = WIN(tG1, S.end + 1, 0.4, 0.4);
    if (T < tMu + 0.6) equation([{s: '64/38', a: e1}, {s: '×', a: e2, c: C.muted}, {s: '48/24', a: e2}, {s: '×', a: e3, c: C.muted}, {s: '127/32', a: e3}], 960, eqA);
    else equation([{s: '64/38 × 48/24 × 127/32', a: 1 - e4 * 0.6, c: C.muted}, {s: '=', a: e4, c: C.muted}, {s: '254/19', a: e4, c: C.gilt2}], 960, eqA);
    if (T > tEx) { const fl = Math.max(0, 1 - (T - tEx) * 3); if (fl > 0) { X.fillStyle = `rgba(255,236,190,${fl * 0.18})`; X.fillRect(0, 0, W, H); } bigLine('Exactly.', 160, WIN(tEx + 0.05, S.end + 1, 0.3, 0.5), {italic: true, size: 100, color: C.gilt2}); }
    chip('THE MOON TRAIN', 80, 120, WIN(tBu + 0.5, S.end), {size: 20}); RECON(1);
  }
  benchLight(T);
}

/* ---------- 6. PIN AND SLOT ---------- */
function kepler(Mn, e) { let E = Mn; for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - Mn) / (1 - e * Math.cos(E)); return E; }
function sPinslot(t) {
  const s = 'pinslot', T = F.T, S = F.scene;
  const tOr = m(s, 'orbit'), tNe = m(s, 'near'), tFa = m(s, 'far'), tHi = m(s, 'hipp'), tBr = m(s, 'bronze'), tPa = m(s, 'pair'), tPi = m(s, 'pin'), tSl = m(s, 'slide'), tAh = m(s, 'ahead'), tBk = m(s, 'back'), tPl = m(s, 'platform'), tYr = m(s, 'years'), tVa = m(s, 'variable');
  if (T < tBr + 0.6) {
    X.fillStyle = '#04060a'; X.fillRect(0, 0, W, H); particles('stars', T, 1, 220);
    const e = 0.42, a = 520, b = a * Math.sqrt(1 - e * e), cx = W / 2 + a * e * 0, cy = H / 2 + 20;
    const fx = W / 2 + a * e;                                                         // Earth at a focus
    X.save(); X.globalAlpha = WIN(S.start + 0.3, tBr + 0.6); X.strokeStyle = 'rgba(160,200,255,0.35)'; X.lineWidth = 2; X.setLineDash([8, 8]); X.beginPath(); X.ellipse(W / 2, cy, a, b, 0, 0, TAU); X.stroke(); X.setLineDash([]); X.restore();
    X.save(); X.globalAlpha = WIN(S.start + 0.3, tBr + 0.6); X.fillStyle = rad(fx - 10, cy - 10, 0, 46, [[0, '#9fd3ff'], [0.6, '#2a6fb0'], [1, '#0d2a4a']]); X.beginPath(); X.arc(fx, cy, 40, 0, TAU); X.fill(); X.restore();
    // trail: brightness = speed
    const per = 7.5, al = WIN(S.start + 0.6, tBr + 0.6);
    for (let i = 40; i >= 0; i--) {
      const tt = T - i * 0.05, Mn = (tt - S.start) / per * TAU, E = kepler(Mn, e);
      const x = W / 2 + a * Math.cos(E), y = cy + b * Math.sin(E);
      const v = Math.sqrt((1 + e * Math.cos(E)) / (1 - e * Math.cos(E)));
      X.fillStyle = `rgba(${200 + 55 * v / 2},${220},${255},${al * (1 - i / 41) * 0.8})`; X.beginPath(); X.arc(x, y, i === 0 ? 20 : 6 + 3 * (1 - i / 41), 0, TAU); X.fill();
    }
    { const Mn = (T - S.start) / per * TAU, E = kepler(Mn, e); txt('MOON', W / 2 + a * Math.cos(E), cy + b * Math.sin(E) - 36, FONT.mono(18), C.fg, 'center', al, 3); }
    txt('EARTH', fx, cy + 80, FONT.mono(20), C.muted, 'center', al, 4);
    txt('FASTER', W / 2 + a + 40, cy, FONT.mono(28), C.amber, 'left', WIN(tNe, tBr), 4, 'middle');
    txt('SLOWER', W / 2 - a - 40, cy, FONT.mono(28), '#8fb8ff', 'right', WIN(tFa, tBr), 4, 'middle');
    chip('ORBIT SHAPE EXAGGERATED', 80, 990, WIN(tOr + 0.3, tBr), {size: 18});
    lowerThird('Hipparchus', 'Astronomer · 2nd century BC', WIN(tHi + 0.2, tBr + 0.2), 120, 900);
    if (T > tBr) { X.fillStyle = `rgba(0,0,0,${P(tBr, 0.6)})`; X.fillRect(0, 0, W, H); }
    return;
  }
  bench(T);
  const th = (T - tBr) * 1.1;                                                      // k1 turns evenly
  const zout = P(tPl, 2.2, settle), zin = P(tPi, 1.2) * (1 - P(tSl + 1.5, 1.2));
  const z = lerp(1.15, 0.72, zout) * (1 + 0.45 * zin);
  X.save(); cam(z, lerp(-200, -120, zout) * (1 - zin), lerp(0, 40, zout));
  if (zout > 0.01) { X.save(); X.globalAlpha = zout; gear(W / 2, H / 2, 223, 430, (T - tPl) * 0.08, 'old', {spokes: 4, blur: 30}); X.restore(); }
  X.save(); X.translate(W / 2, H / 2); X.rotate((T - tPl) * 0.08 * zout); X.translate(-W / 2, -H / 2);
  const r = pinSlot(W / 2 + 60 * zout, H / 2, 1, th, {pinGlow: T > tPi && T < tSl + 3});
  X.restore();
  X.restore();
  const pa = WIN(tPa + 0.5, tPi);
  callout(W / 2 - 320, H / 2 - 120, 200, 260, 'EVEN SPEED', pa); callout(W / 2 + 80, H / 2 + 150, 1200, 900, 'UNEVEN SPEED', pa);
  // speed graph
  const ga = WIN(tSl, tPl + 0.5);
  if (ga > 0) {
    X.save(); X.globalAlpha = ga; X.fillStyle = 'rgba(7,9,13,0.75)'; X.beginPath(); X.roundRect(1240, 140, 600, 300, 14); X.fill();
    X.strokeStyle = 'rgba(255,255,255,0.15)'; X.beginPath(); X.moveTo(1270, 290); X.lineTo(1810, 290); X.stroke();
    X.strokeStyle = C.gilt2; X.lineWidth = 3; X.beginPath();
    for (let i = 0; i <= 120; i++) { const tt = T - (120 - i) * 0.04, th1 = (tt - tBr) * 1.1, p1 = [Math.cos(th1) * 120, Math.sin(th1) * 120], th2 = Math.atan2(p1[1], p1[0] - 44); let ld = th2 - th1; ld = ((ld + Math.PI) % TAU + TAU) % TAU - Math.PI; const x = 1270 + i / 120 * 540, y = 290 - ld * 260; i ? X.lineTo(x, y) : X.moveTo(x, y); }
    X.stroke(); X.restore();
    txt('AHEAD', 1260, 175, FONT.mono(16), C.amber, 'left', ga * (0.4 + 0.6 * WIN(tAh, tBk + 0.6)), 3); txt('BEHIND', 1260, 425, FONT.mono(16), '#8fb8ff', 'left', ga * (0.4 + 0.6 * WIN(tBk, tPl)), 3);
    txt('SECOND GEAR VS FIRST', 1820, 175, FONT.mono(16), C.muted, 'right', ga, 3);
  }
  chip('PIN AND SLOT', 80, 990, WIN(tPa, tPl), {size: 20});
  if (T > tPl) chip('ONE TURN EVERY 8.88 YEARS', 80, 990, WIN(tYr, S.end), {size: 20});
  if (T > tVa) bigLine('a variable-speed gear train', 150, WIN(tVa + 0.2, S.end + 1, 0.5, 0.4), {italic: true, size: 70, color: C.gilt2});
  RECON(1); benchLight(T);
}

/* ---------- 7. BACK DIALS ---------- */
function eclipseInset(x, y, r, k, a) {
  if (a <= 0.01) return;
  X.save(); X.globalAlpha = a; X.beginPath(); X.arc(x, y, r, 0, TAU); X.fillStyle = '#05070c'; X.fill(); X.clip();
  const tot = 1 - Math.abs(k * 2 - 1);
  X.fillStyle = rad(x, y, r * 0.18, r * 0.9, [[0, `rgba(255,240,210,${0.25 + 0.6 * tot})`], [1, 'rgba(255,240,210,0)']]); X.fillRect(x - r, y - r, 2 * r, 2 * r);
  X.fillStyle = rad(x, y, 0, r * 0.3, [[0, '#fff8e0'], [1, '#ffcf6a']]); X.beginPath(); X.arc(x, y, r * 0.28, 0, TAU); X.fill();
  X.fillStyle = '#05070c'; X.beginPath(); X.arc(x + lerp(-r * 0.7, r * 0.7, k), y + lerp(-r * 0.05, r * 0.05, k), r * 0.29, 0, TAU); X.fill();
  X.restore();
  X.save(); X.globalAlpha = a; X.strokeStyle = 'rgba(216,180,110,0.7)'; X.lineWidth = 3; X.beginPath(); X.arc(x, y, r, 0, TAU); X.stroke(); X.restore();
}
function sBack(t) {
  const s = 'back', T = F.T, S = F.scene;
  const tTu = m(s, 'turn'), tSp = m(s, 'spirals'), tMe = m(s, 'metonic'), tCy = m(s, 'cycle'), tPo = m(s, 'pointer'), tGr = m(s, 'groove'), tGa = m(s, 'games'), tOt = m(s, 'other'), tSa = m(s, 'saros'), tS2 = m(s, 's223'), tBa = m(s, 'babylon'), tGl = m(s, 'glyphs'), tM38 = m(s, 'moon38'), tS27 = m(s, 'sun27'), tCo = m(s, 'coming');
  bench(T);
  let d = 1200 + (T - S.start) * 25;
  if (T > tPo) d += (T - tPo) * 40;
  if (T > tCo) d += 0;
  // flip from front to back
  const fl = P(S.start + 0.2, 1.6, smooth), ph = fl * Math.PI, sx = Math.max(0.02, Math.abs(Math.cos(ph)));
  // camera targets in plate coordinates (plate centre = 0,0)
  if (!BACK) makeBack();
  const fol = spiralPos(BACK.up, sky(d).metonic), folR = [fol[0] - BACK.w / 2, fol[1] - BACK.h / 2];
  const keys = [[S.start, 0.85, 0, 0], [tMe, 1.3, 0, -160], [tGr, 2.6, folR[0], folR[1]], [tGa, 4.5, 28, -160], [tSa - 0.3, 4.5, 28, -160], [tSa + 0.9, 1.5, 0, 270], [tCo, 1.6, 0, 270], [S.end, 1.7, 0, 270]];
  let ki = 0; keys.forEach((q, i) => { if (T >= q[0]) ki = i; });
  const k0 = keys[Math.max(0, ki - 1)], k1 = keys[ki], u = settle(clamp01((T - k1[0]) / 1.6));
  const z = lerp(k0[1], k1[1], u), px = lerp(k0[2], k1[2], u), py = lerp(k0[3], k1[3], u);
  X.save(); cam(z, -px * z, -py * z);
  let pts = null;
  if (ph < Math.PI / 2) frontDial(W / 2, H / 2, 1, d, {sx});
  else {
    let saros = null;
    if (T > tCo) { const tgt = (BACK ? (BACK.seasons[9] + 0.5) / 223 : 0.2); saros = lerp(sky(d).saros, tgt, P(tCo, 1.5, smooth)); }
    pts = backDial(W / 2, H / 2, 1, d, {sx, upFill: P(tMe, 3, x => x) * WIN(tMe, tSa + 1), loFill: P(tS2, 3, x => x), glyphs: P(tGl, 2.5, x => x), saros});
  }
  X.restore();
  const A = (a, b) => WIN(a, b, 0.4, 0.4);
  chip('BACK FACE', 80, 990, A(tTu, tMe), {size: 20});
  if (T > tMe && T < tPo) { txtShadow('235', 1600, 470, FONT.num(130), C.gilt2, 'center', A(tMe + 0.2, tPo)); txt('MONTHS · 5 TURNS', 1600, 530, FONT.mono(24), C.fg, 'center', A(tMe + 0.4, tPo), 4); txt('19 YEARS', 1600, 640, FONT.serif(64, true), C.fg, 'center', A(tCy + 0.2, tPo)); }
  chip('METONIC CALENDAR', 80, 990, A(tCy, tGa), {size: 20});
  if (T > tGr && T < tGa) chip('A PIN RIDES IN THE GROOVE', W / 2, 140, A(tGr + 0.3, tGa), {align: 'center', size: 22});
  if (T > tGa && T < tSa) {
    chip('THE GAMES DIAL · 4-YEAR CYCLE', 80, 990, A(tGa + 0.3, tOt), {size: 20});
    const la = A(tGa + 1.2, tSa);
    [['YEAR 1', 'ISTHMIAN · OLYMPIC'], ['YEAR 2', 'NEMEAN · NAA'], ['YEAR 3', 'ISTHMIAN · PYTHIAN'], ['YEAR 4', 'NEMEAN · HALIEIA']].forEach(([yv, n], i) => { const y = 300 + i * 90; txt(yv, 1380, y, FONT.mono(20), C.muted, 'left', la, 4); txt(n, 1380, y + 36, FONT.mono(28), i === 0 ? C.gilt2 : C.fg, 'left', la, 3); });
    if (T > tOt) { const aa = A(tOt + 0.2, tSa); X.save(); X.globalAlpha = aa; X.strokeStyle = C.amber; X.lineWidth = 6; X.beginPath(); X.arc(W / 2, H / 2, 210, -0.6, -2.2, true); X.stroke();
      const ex = W / 2 + Math.cos(-2.2) * 210, ey = H / 2 + Math.sin(-2.2) * 210; X.fillStyle = C.amber; X.beginPath(); X.moveTo(ex - 22, ey + 6); X.lineTo(ex + 14, ey - 18); X.lineTo(ex + 10, ey + 22); X.fill(); X.restore();
      bigLine('the only pointer that turns backwards', 980, aa, {size: 54, italic: true, color: C.amber}); }
  }
  if (T > tSa) {
    chip('SAROS ECLIPSE DIAL', 80, 990, A(tSa + 0.4, S.end), {size: 20});
    if (T < tGl) { txtShadow('223', 1620, 470, FONT.num(130), '#bfe6ff', 'center', A(tS2 + 0.2, tGl)); txt('MONTHS · 4 TURNS', 1620, 530, FONT.mono(24), C.fg, 'center', A(tS2 + 0.4, tGl), 4); txt('≈ 18 YEARS', 1620, 640, FONT.serif(64, true), C.fg, 'center', A(tS2 + 1.2, tGl)); }
    chip('BABYLONIAN ECLIPSE CYCLE', W - 80, 120, A(tBa + 0.2, tGl), {align: 'right', size: 20});
    if (T > tGl) {
      const la = A(tGl + 0.4, S.end);
      txt('Σ', 1540, 380, FONT.greek(70, 700), '#bfe6ff', 'center', la); txt('ΣΕΛΗΝΗ · MOON', 1600, 380, FONT.mono(22), C.fg, 'left', la, 3, 'middle');
      txt('Η', 1540, 470, FONT.greek(70, 700), C.amber, 'center', la); txt('ΗΛΙΟΣ · SUN', 1600, 470, FONT.mono(22), C.fg, 'left', la, 3, 'middle');
      if (T > tM38) txtShadow(String(Math.min(38, Math.floor(P(tM38, 1, x => x) * 38))), 1560, 640, FONT.num(100), '#bfe6ff', 'center', A(tM38, S.end));
      if (T > tS27) txtShadow(String(Math.min(27, Math.floor(P(tS27, 1, x => x) * 27))), 1760, 640, FONT.num(100), C.amber, 'center', A(tS27, S.end));
      if (T > tM38) { txt('LUNAR', 1560, 690, FONT.mono(18), C.muted, 'center', A(tM38, S.end), 3); }
      if (T > tS27) { txt('SOLAR', 1760, 690, FONT.mono(18), C.muted, 'center', A(tS27, S.end), 3); }
    }
    if (T > tCo) eclipseInset(300, 420, 170, P(tCo + 0.8, 4.5, x => x), A(tCo + 0.5, S.end + 1));
  }
  RECON(fl > 0.5 ? 1 : 0); benchLight(T);
}

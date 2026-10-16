/* Antikythera film — scenes: the planets, who built it, the bridge, the end screen. */
'use strict';
const MED = {
  sicily: [[12.4, 38.1], [13.3, 38.2], [14.5, 38.05], [15.6, 38.3], [15.1, 37.3], [15.3, 36.7], [14.3, 36.8], [12.6, 37.6]],
  italy: [[15.65, 38.0], [16.1, 38.0], [16.6, 38.4], [17.2, 39.0], [16.6, 39.6], [17.1, 40.5], [18.5, 40.15], [18.4, 39.8], [16.9, 41.1], [15.9, 41.8], [14.9, 42.6], [13.9, 43.5], [12.4, 44.5], [11.0, 44.5], [11.0, 42.4], [12.4, 41.6], [13.7, 41.2], [14.9, 40.3], [15.7, 39.9], [16.1, 38.9]],
  greece: [[19.4, 41.9], [19.6, 40.6], [20.1, 39.6], [20.7, 38.95], [21.1, 38.35], [22.6, 38.3], [23.1, 38.5], [22.9, 39.4], [22.6, 40.0], [23.3, 40.3], [24.0, 40.85], [26.0, 40.8], [26.1, 42.2], [19.4, 42.2]],
  africa: [[11.0, 37.1], [11.1, 36.4], [10.2, 34.2], [11.5, 33.0], [15.2, 32.3], [19.9, 30.8], [20.3, 32.4], [22.4, 32.8], [25.0, 31.6], [29.0, 31.0], [29.5, 30.0], [11.0, 30.0]]
};
function drawMed(view, a) { window.__extraCoast = Object.values(MED); drawAegean(view, a); window.__extraCoast = null; }
function cityDot(view, lo, la, name, a, o = {}) {
  if (a <= 0.01) return; const [x, y] = mapProj(lo, la, view), p = (F.T * 0.9 + (o.ph || 0)) % 1;
  X.save(); X.globalAlpha = a; X.fillStyle = o.col || C.gilt2; X.beginPath(); X.arc(x, y, 9, 0, TAU); X.fill();
  X.strokeStyle = o.col || C.gilt2; X.lineWidth = 2.5; X.globalAlpha = a * (1 - p); X.beginPath(); X.arc(x, y, 12 + p * 36, 0, TAU); X.stroke(); X.restore();
  txt(name, x + (o.dx ?? 0), y + (o.dy ?? -26), FONT.mono(o.size || 24), o.col || C.gilt2, o.align || 'center', a, 3);
  if (o.sub) txt(o.sub, x + (o.dx ?? 0), y + (o.dy ?? -26) + 30, FONT.mono(17), C.fg, o.align || 'center', a, 2);
}

/* ---------- 8. PLANETS ---------- */
function sPlanets(t) {
  const s = 'planets', T = F.T, S = F.scene;
  const tNa = m(s, 'names'), tLo = m(s, 'lost'), t16 = m(s, 'y2016'), tVe = m(s, 'venus'), tSa = m(s, 'saturn'), tUc = m(s, 'ucl'), tFi = m(s, 'fit'), tRi = m(s, 'rings'), tUn = m(s, 'uncertain'), tCo = m(s, 'cosmos');
  if (T > tCo) { X.fillStyle = '#03050a'; X.fillRect(0, 0, W, H); particles('stars', T, P(tCo, 1.5), 260); } else bench(T);
  const d = 3000 + (T - S.start) * (T > tRi ? 160 : 20);
  // camera: dial -> inscription (top of plate) -> dial -> pull back
  let z = 0.78, cy = 20;
  if (T > t16) { const k = P(t16, 1.4, settle) * (1 - P(tUc - 0.5, 1.4, settle)); z = lerp(0.78, 2.4, k); cy = lerp(20, 940, k); }
  if (T > tRi) { z = lerp(0.78, 0.95, P(tRi, 2)); }
  if (T > tCo) { z = lerp(0.95, 0.42, P(tCo, 4, smooth)); }
  X.save(); cam(z, 0, cy * z * 0.45);
  frontDial(W / 2, H / 2, 1, d, {planets: P(tRi, 1.5) + 0.4 * WIN(tFi, tRi + 0.5), planetLabels: 0});
  // lost planetary gearing: ghost gears around the dial
  const ga = WIN(tLo, t16 + 0.3) + WIN(tFi, tCo + 1);
  if (ga > 0.01) seeded(5, () => { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3, r = 200 + rnd() * 60; gear(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r * 1.1, 14 + Math.floor(rnd() * 18), 55 + rnd() * 35, (F.T - S.start) * (i % 2 ? 0.4 : -0.3), 'ghost', {alpha: Math.min(1, ga) * 0.9}); } });
  X.restore();
  if (T > t16 && T < tUc) {
    X.save(); X.globalAlpha = WIN(t16 + 0.4, tUc, 0.5, 0.5) * 0.35; X.fillStyle = '#1b5a8a'; X.fillRect(0, 0, W, H); X.restore();
    const n1 = WIN(tVe, tUc, 0.4, 0.4), n2 = WIN(tSa, tUc, 0.4, 0.4);
    txtShadow('ΥΞΒ', 700, 520, FONT.greek(130, 700), '#bfe6ff', 'center', n1); txt('= 462 · VENUS', 700, 610, FONT.mono(34), C.fg, 'center', n1, 4);
    txtShadow('ΥΜΒ', 1220, 520, FONT.greek(130, 700), '#bfe6ff', 'center', n2); txt('= 442 · SATURN', 1220, 610, FONT.mono(34), C.fg, 'center', n2, 4);
    chip('GREEK NUMERALS FOUND IN CT SCANS · 2016', W / 2, 990, WIN(t16 + 0.5, tUc), {align: 'center', size: 20, color: C.cyan, stroke: 'rgba(143,230,255,0.6)'});
  }
  if (T < t16) {
    chip('STILL DEBATED', 80, 990, WIN(S.start + 1, tNa), {size: 20});
    const na = WIN(tNa + 0.3, t16, 0.4, 0.4);
    ['MERCURY', 'VENUS', 'MARS', 'JUPITER', 'SATURN'].forEach((p, i) => txt(p, 1500, 330 + i * 70, FONT.mono(34), C.fg, 'left', na * clamp01((T - tNa - 0.3) * 2.5 - i * 0.5), 6));
    if (T > tLo) bigLine('the gears are lost', 1000, WIN(tLo + 0.2, t16), {italic: true, size: 60, color: '#bfe0ff'});
  }
  lowerThird('University College London', 'Reconstruction · 2021', WIN(tUc + 0.2, tFi + 1.5));
  if (T > tUn && T < tCo + 1) { chip('BRONZE = SURVIVES', 80, 940, WIN(tUn + 0.2, tCo + 0.6), {size: 20}); chip('BLUE = RECONSTRUCTED', 80, 1000, WIN(tUn + 0.5, tCo + 0.6), {size: 20, color: '#bfe0ff', stroke: 'rgba(111,180,255,0.7)'}); }
  if (T > tCo) bigLine('a model of the known cosmos', 960, WIN(tCo + 0.5, S.end + 1, 0.6, 0.4), {italic: true, size: 70, color: C.gilt2});
  RECON(T < t16 ? 0 : 1); if (T < tCo) benchLight(T);
}

/* ---------- 9. WHO ---------- */
function sWho(t) {
  const s = 'who', T = F.T, S = F.scene;
  const tCo = m(s, 'corinth'), tSy = m(s, 'syracuse'), tCi = m(s, 'cicero'), tNt = m(s, 'notthis'), tAf = m(s, 'after'), tNo = m(s, 'nothing'), tGa = m(s, 'gap'), tCl = m(s, 'clocks'), tVa = m(s, 'vanished'), tSa = m(s, 'sank');
  if (T < tCo) {
    kenBurns('workshop', T - S.start, {dur: tCo - S.start + 1, z0: 1.05, z1: 1.18, x0: 0.45, x1: 0.55});
    particles('dust', T, 0.7, 60);
    txtShadow('?', W / 2, 600, FONT.serif(260), C.gilt2, 'center', WIN(m(s, 'dontknow'), tCo, 0.4, 0.3));
  } else if (T < tCi) {
    const view = {lon0: 10.5, lon1: 29.5, lat0: 33.2, lat1: 43.9};
    drawMed(view, 1);
    cityDot(view, 22.93, 37.94, 'CORINTH', WIN(tCo + 0.3, tCi), {sub: 'MONTH NAMES ON THE BACK DIAL', dy: -40});
    cityDot(view, 15.29, 37.08, 'SYRACUSE', WIN(tSy + 0.2, tCi), {sub: 'HOME OF ARCHIMEDES · DIED 212 BC', dy: 60, ph: 0.4});
  } else if (T < tAf) {
    kenBurns('city', T - tCi, {dur: tAf - tCi, z0: 1.04, z1: 1.16, x0: 0.4, x1: 0.56});
    lowerThird('Cicero', 'Roman writer · 1st century BC', WIN(tCi + 0.2, tNt));
    chip('PROBABLY NOT THIS ONE', 80, 990, WIN(tNt + 0.2, tAf), {size: 20});
  } else if (T < tSa) {
    X.fillStyle = '#05070b'; X.fillRect(0, 0, W, H); particles('dust', T, 0.4, 40);
    const x0 = 160, x1 = 1760, yr0 = -300, yr1 = 1500, yx = yr => lerp(x0, x1, (yr - yr0) / (yr1 - yr0)), ya = 620;
    const la = WIN(tAf, tVa + 1.4, 0.6, 1.2) * (T > tCl + 0.3 && T < tVa ? 1 : 1);
    X.save(); X.globalAlpha = la; X.strokeStyle = 'rgba(239,234,224,0.6)'; X.lineWidth = 4; X.beginPath(); X.moveTo(x0, ya); X.lineTo(lerp(x0, x1, P(tAf, 1.5)), ya); X.stroke();
    [-200, 0, 500, 1000, 1500].forEach(y => { const x = yx(y); X.fillStyle = 'rgba(239,234,224,0.6)'; X.fillRect(x - 1, ya - 10, 2, 20); txt(y < 0 ? (-y) + ' BC' : y === 0 ? 'AD 1' : 'AD ' + y, x, ya + 52, FONT.mono(24), C.muted, 'center', 1, 2); });
    X.restore();
    // the mechanism
    X.save(); X.globalAlpha = la; X.fillStyle = C.gilt2; X.shadowColor = C.gilt; X.shadowBlur = 20; X.fillRect(yx(-205), ya - 8, yx(-60) - yx(-205), 16); X.restore();
    txt('THE MECHANISM', yx(-130), ya - 44, FONT.mono(26), C.gilt2, 'center', la, 3);
    // simpler geared devices
    [[520, 'BYZANTINE GEARED SUNDIAL'], [1000, 'GEARED CALENDAR (AL-BIRUNI)']].forEach(([y, n], i) => { const a = la * P(tGa + 1.2 + i * 0.6, 0.6); X.save(); X.globalAlpha = a; X.fillStyle = C.muted; X.beginPath(); X.arc(yx(y), ya, 7, 0, TAU); X.fill(); X.restore(); txt(n, yx(y), ya + (i ? -50 : 100), FONT.mono(19), C.muted, 'center', a, 2); });
    txt('SIMPLER GEARING ONLY', yx(760), ya + 150, FONT.mono(20), C.muted, 'center', la * P(tGa + 2.4, 0.6), 3);
    const ga = la * P(tNo, 0.8);
    if (ga > 0) { X.save(); X.globalAlpha = ga; X.strokeStyle = C.ruby; X.lineWidth = 3; X.beginPath(); X.moveTo(yx(-60), ya - 120); X.lineTo(yx(-60), ya - 140); X.lineTo(yx(1330), ya - 140); X.lineTo(yx(1330), ya - 120); X.stroke(); X.restore();
      txt('NOTHING THIS COMPLEX SURVIVES', yx(635), ya - 172, FONT.mono(34), '#ff9aa4', 'center', ga, 5); }
    const ca = la * P(tCl, 0.6);
    if (ca > 0) { X.save(); X.globalAlpha = ca; X.fillStyle = C.gilt2; X.fillRect(yx(1330), ya - 8, yx(1400) - yx(1330), 16); X.restore(); txt('ASTRONOMICAL CLOCKS', yx(1330), ya + 100, FONT.mono(22), C.gilt2, 'center', ca, 3); txt('1300s', yx(1330), ya + 132, FONT.mono(22), C.fg, 'center', ca, 3);
      X.save(); X.globalAlpha = ca; X.beginPath(); X.roundRect(1240, 110, 520, 292, 14); X.clip(); const im = IMG.medclock; if (im) X.drawImage(im, 1240, 110, 520, 292); X.restore(); }
  } else {
    kenBurns('seafloor', T - tSa, {dur: S.end - tSa + 1, z0: 1.02, z1: 1.14, x0: 0.5, x1: 0.42});
    particles('bubble', T, 0.4, 30);
  }
}

/* ---------- 10. BRIDGE + END ---------- */
function balance(cx, cy, r, t, o = {}) {
  const a = 1.45 * Math.sin(TAU * 4 * t);                                         // 4 Hz: 8 beats a second
  X.save(); X.translate(cx, cy);
  // hairspring
  X.strokeStyle = 'rgba(140,180,255,0.85)'; X.lineWidth = Math.max(1, r * 0.012); X.beginPath();
  for (let i = 0; i <= 900; i++) { const f = i / 900, ang = f * 13 * TAU + a * (1 - f) * 0.9, rr = r * (0.1 + 0.48 * f); const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr; i ? X.lineTo(x, y) : X.moveTo(x, y); }
  X.stroke();
  X.rotate(a);
  X.strokeStyle = lin(-r, -r, r, r, [[0, '#fff1c9'], [0.5, '#c99a4c'], [1, '#7b5622']]); X.lineWidth = r * 0.11; X.beginPath(); X.arc(0, 0, r * 0.9, 0, TAU); X.stroke();
  X.lineWidth = r * 0.06; X.beginPath(); X.moveTo(-r * 0.9, 0); X.lineTo(r * 0.9, 0); X.stroke();
  for (let i = 0; i < 18; i++) { const ang = i / 18 * TAU; X.fillStyle = '#e9d6a8'; X.beginPath(); X.arc(Math.cos(ang) * r * 0.97, Math.sin(ang) * r * 0.97, r * 0.03, 0, TAU); X.fill(); }
  X.fillStyle = '#d84a5a'; X.beginPath(); X.arc(0, 0, r * 0.07, 0, TAU); X.fill();
  X.restore();
}
function pocketWatch(cx, cy, r, t) {
  X.save(); X.translate(cx, cy);
  X.fillStyle = lin(-r, -r, r, r, [[0, '#fff0c0'], [0.5, '#c99a4c'], [1, '#6b4a1c']]); X.beginPath(); X.arc(0, 0, r, 0, TAU); X.fill();
  X.fillStyle = '#d9b46a'; X.beginPath(); X.arc(0, -r - 34, 30, 0, TAU); X.fill(); X.strokeStyle = '#b48a44'; X.lineWidth = 10; X.beginPath(); X.arc(0, -r - 70, 34, 0, TAU); X.stroke();
  X.fillStyle = '#1c1b18'; X.beginPath(); X.arc(0, 0, r * 0.88, 0, TAU); X.fill();
  X.restore();
  gear(cx - r * 0.35, cy + r * 0.25, 60, r * 0.38, t * 0.5, 'new', {blur: 8, sy: 4}); gear(cx + r * 0.2, cy - r * 0.3, 40, r * 0.25, -t * 0.75, 'new', {blur: 8, sy: 4});
  balance(cx + r * 0.32, cy + r * 0.28, r * 0.3, t);
}
function sBridge(t) {
  const s = 'bridge', T = F.T, S = F.scene;
  const tId = m(s, 'idea'), tSk = m(s, 'sky'), tCl = m(s, 'clocks2'), tPo = m(s, 'pocket'), tWr = m(s, 'wrists'), tNb = m(s, 'nobat'), tBu = m(s, 'builder'), tOp = m(s, 'open');
  if (T < tId) { kenBurns('museumtoday', T - S.start, {dur: tId - S.start + 1, z0: 1.03, z1: 1.12}); chip('82 FRAGMENTS · ATHENS', 80, 990, WIN(m(s, 'fragments'), tId), {size: 20}); }
  else if (T < tCl) {
    if (T < tSk) { bench(T); X.save(); cam(1.1); drawFragment(W / 2, H / 2 + 20, 0.8, {}); X.globalCompositeOperation = 'lighter'; X.globalAlpha = 0.6 * P(tId + 0.5, 1); drawFragment(W / 2, H / 2 + 20, 0.8, {xray: true, shadow: false}); X.restore(); benchLight(T); }
    else { X.fillStyle = '#03050a'; X.fillRect(0, 0, W, H); particles('stars', T, 1, 260); X.save(); cam(0.7 + 0.1 * P(tSk, 4)); frontDial(W / 2, H / 2, 1, (T - tSk) * 120, {case: false}); X.restore(); }
  } else if (T < tPo) { kenBurns('medclock', T - tCl, {dur: 3, z0: 1.15, z1: 1.25}); chip('1300s', 80, 990, WIN(tCl + 0.2, tPo), {size: 20}); }
  else if (T < tWr) { bench(T); pocketWatch(W / 2, H / 2 + 60, 300, T); benchLight(T); chip('1500s →  POCKET WATCHES', 80, 990, WIN(tPo + 0.2, tWr), {size: 20}); }
  else if (T < tBu) {
    bench(T);
    X.save(); cam(1 + 0.05 * P(tWr, 6));
    gear(W / 2 - 330, H / 2 + 120, 80, 210, T * 0.12, 'new', {spokes: 4}); gear(W / 2 - 60, H / 2 - 160, 60, 150, -T * 0.16, 'new', {spokes: 4}); gear(W / 2 + 120, H / 2 + 200, 15, 60, T * 0.64, 'steel');
    balance(W / 2 + 330, H / 2 - 20, 230, T);
    X.restore(); benchLight(T);
    chip('A MODERN MECHANICAL MOVEMENT', 80, 990, WIN(tWr + 0.2, tNb), {size: 20});
    chip('NO BATTERY', 80, 990, WIN(tNb + 0.2, tBu + 0.3), {size: 22, color: C.green, stroke: 'rgba(98,196,138,0.7)'});
  } else {
    bench(T);
    const k = P(tOp, 2.4, smooth);
    X.save(); cam(1 + 1.8 * k, -700 * k, 0);
    gear(W / 2 - 430, H / 2, 223, 300, T * 0.05, 'old', {spokes: 4});
    balance(W / 2 + 420, H / 2, 240, T); gear(W / 2 + 140, H / 2 + 260, 70, 130, -T * 0.2, 'new', {spokes: 4});
    X.restore(); benchLight(T);
    txt('2,000+ YEARS AGO', W / 2 - 430, 960, FONT.mono(26), C.muted, 'center', WIN(tBu + 0.3, tOp), 4); txt('TODAY', W / 2 + 420, 960, FONT.mono(26), C.muted, 'center', WIN(tBu + 0.6, tOp), 4);
  }
}
function sEnd(t) {
  const S = F.scene, T = F.T, lt = T - S.start;
  bench(T);
  X.save(); X.globalAlpha = 0.9; balance(560, 560, 300, T); X.restore();
  gear(330, 880, 80, 200, T * 0.1, 'new', {spokes: 4, alpha: 0.6});
  benchLight(T); dim(0.25);
  const a = WIN(S.start + 0.4, S.end - 0.4, 0.8, 0.8);
  // space for YouTube's end-screen video element (right)
  X.save(); X.globalAlpha = a * 0.9; X.strokeStyle = 'rgba(216,180,110,0.55)'; X.lineWidth = 3; X.beginPath(); X.roundRect(1060, 300, 720, 405, 16); X.stroke(); X.restore();
  txt('NEXT', 1080, 270, FONT.mono(22), C.gilt, 'left', a, 8);
  txtShadow('See one up close', 1080, 790, FONT.serif(64), C.fg, 'left', a);
  txt('28,800 BEATS AN HOUR · NO BATTERY', 1082, 840, FONT.mono(22), C.gilt2, 'left', a, 4);
  // fade out
  if (T > S.end - 1.2) { X.fillStyle = `rgba(0,0,0,${P(S.end - 1.2, 1.1)})`; X.fillRect(0, 0, W, H); }
}

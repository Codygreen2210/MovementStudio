/* Antikythera film — the scenes. Each is drawn purely from F.T and the narration marks. */
'use strict';
let STUDIO = null;
function bench(t, par = {}) {
  X.save(); STUDIO.draw(X, t, {x: par.x || Math.sin(t * 0.07) * 18, y: par.y || Math.cos(t * 0.05) * 10, s: par.s || 1.02}); X.restore();
}
function benchLight(t) { X.save(); STUDIO.drawLight(X, t); X.restore(); }
function dim(a) { if (a <= 0) return; X.fillStyle = `rgba(4,5,8,${a})`; X.fillRect(0, 0, W, H); }
function cam(z, x = 0, y = 0, r = 0) { X.translate(W / 2 + x, H / 2 + y); X.rotate(r); X.scale(z, z); X.translate(-W / 2, -H / 2); }
const m = (sid, k) => M(sid, k);
const RECON = (a) => chip('RECONSTRUCTION', W - 60, 60, a, {align: 'right', size: 16, color: '#bfe0ff', stroke: 'rgba(111,180,255,0.6)'});

/* ---------- 1. HOOK ---------- */
function sHook(t) {
  const s = 'hook', T = F.T;
  const tIn = m(s, 'medieval'), tBack = m(s, 'inside') - 0.15, tMoon = m(s, 'moon'), tWho = m(s, 'who');
  if (T < tIn || (T >= tBack && T < tMoon)) {
    bench(T);
    const z = 1 + 0.06 * smooth(T / 12) + 0.25 * P(m(s, 'teeth'), 1.4, settle);
    X.save(); cam(z, -60 * P(m(s, 'teeth'), 1.4), -20 * P(m(s, 'teeth'), 1.4));
    const rot = -0.08 + 0.05 * Math.sin(T * 0.35);
    drawFragment(W / 2 + 40, H / 2 + 30, 0.86, {rot});
    // x-ray sweep reveals gears
    const sw = P(m(s, 'inside') + 0.2, 1.6, x => x);
    if (sw > 0) {
      const sx = lerp(W / 2 - 520, W / 2 + 600, sw);
      X.save(); X.beginPath(); X.rect(0, 0, sx, H); X.clip();
      X.fillStyle = 'rgba(3,10,18,0.92)'; X.fillRect(0, 0, W, H);
      drawFragment(W / 2 + 40, H / 2 + 30, 0.86, {rot, xray: true, shadow: false});
      X.restore();
      if (sw < 1) { X.save(); X.fillStyle = lin(sx - 30, 0, sx + 4, 0, [[0, 'rgba(140,230,255,0)'], [1, 'rgba(200,245,255,0.9)']]); X.fillRect(sx - 30, 0, 34, H); X.restore(); }
    }
    X.restore();
    if (T < tIn) benchLight(T);
    const thirty = WIN(m(s, 'thirty'), m(s, 'teeth') + 0.3, 0.3, 0.3);
    if (thirty > 0) { txtShadow('30', 300, 560, FONT.num(200), C.gilt2, 'center', thirty); txt('GEARS', 300, 620, FONT.mono(30), C.fg, 'center', thirty, 8); }
    const tee = WIN(m(s, 'teeth') + 0.4, tMoon - 0.1, 0.4, 0.3);
    if (tee > 0) { X.save(); X.globalAlpha = tee; X.strokeStyle = C.fg; X.lineWidth = 3; X.beginPath(); X.moveTo(1460, 900); X.lineTo(1660, 900); X.moveTo(1460, 888); X.lineTo(1460, 912); X.moveTo(1660, 888); X.lineTo(1660, 912); X.stroke(); X.restore(); txt('TEETH ABOUT 1.6 MM APART', 1560, 950, FONT.mono(24), C.fg, 'center', tee, 4); }
    chip('FRAGMENT A · BRONZE', 80, 990, WIN(1.5, tIn - 0.2) * (1 - (sw > 0 ? 1 : 0)), {size: 18});
    if (sw > 0.05) chip('X-RAY VIEW', 80, 990, WIN(m(s, 'inside') + 0.3, tMoon - 0.2), {size: 18, color: C.cyan, stroke: 'rgba(143,230,255,0.6)'});
  } else if (T < tBack) {
    kenBurns('medclock', T - tIn, {dur: 4, z0: 1.12, z1: 1.2, x0: 0.45, x1: 0.55});
    dim(0.15);
    chip('14TH-CENTURY EUROPE', 80, 990, WIN(tIn + 0.3, tBack, 0.4, 0.3), {size: 20});
  } else if (T < tWho) {
    // three rapid previews: Moon, eclipses, games
    bench(T); dim(0.35);
    const k = T < m(s, 'eclipse') ? 0 : T < m(s, 'games') ? 1 : 2;
    const d = (T - tMoon) * 120;
    if (k === 0) { X.save(); cam(1.9, 0, 0); frontDial(W / 2, H / 2, 0.52, d * 2, {}); X.restore(); chip('TRACKS THE MOON', W / 2, 960, WIN(tMoon + 0.1, m(s, 'eclipse')), {align: 'center'}); }
    if (k === 1) { X.save(); cam(1.7, 0, -252); backDial(W / 2, H / 2, 0.55, 2000 + d * 20, {glyphs: 1, loA: 0}); X.restore(); chip('PREDICTS ECLIPSES', W / 2, 960, WIN(m(s, 'eclipse') + 0.05, m(s, 'games')), {align: 'center'}); }
    if (k === 2) { X.save(); cam(3.4, -52, 299); backDial(W / 2, H / 2, 0.55, 300 + d * 6, {}); X.restore(); chip('COUNTS THE GAMES', W / 2, 960, WIN(m(s, 'games') + 0.05, m(s, 'built') + 0.3), {align: 'center'}); }
    if (T > m(s, 'built')) { dim(0.6 * P(m(s, 'built'), 0.5)); bigLine('more than 2,000 years old', 560, WIN(m(s, 'built') + 0.3, tWho, 0.5, 0.3), {size: 92, italic: true}); }
    RECON(WIN(tMoon, m(s, 'built')));
  } else {
    bench(T);
    const z = 0.62 + 0.5 * P(m(s, 'how'), 2.6);
    X.save(); cam(z, 0, 40 - 120 * P(m(s, 'how'), 2.6));
    frontDial(W / 2, H / 2 + 20, 0.86, (T - tWho) * 60, {});
    X.restore(); benchLight(T); RECON(WIN(tWho + 0.3, F.scene.end));
  }
}

/* ---------- 2. TITLE ---------- */
function sTitle(t) {
  const S = sceneById('title'), T = F.T, lt = T - S.start;
  X.fillStyle = '#050608'; X.fillRect(0, 0, W, H);
  X.save(); X.globalAlpha = 0.5; gear(W / 2, H / 2, 223, 520, lt * 0.06, 'old', {spokes: 4, shadow: false}); X.restore();
  X.save(); X.globalAlpha = 0.35; gear(W / 2 + 610, H / 2 + 140, 64, 150, -lt * 0.2, 'old', {shadow: false}); X.restore();
  dim(0.45);
  const a = WIN(S.start + 0.3, S.end - 0.2, 0.9, 0.5);
  txt('THE', W / 2, 430, FONT.mono(30), C.gilt, 'center', a, 18);
  txtShadow('Antikythera', W / 2, 560, FONT.serif(150), C.fg, 'center', a);
  txtShadow('Mechanism', W / 2, 690, FONT.serif(150, true), C.gilt2, 'center', a);
  txt('A COMPUTER FROM THE ANCIENT WORLD', W / 2, 780, FONT.mono(24), C.muted, 'center', a * P(S.start + 1, 1), 8);
}

/* ---------- 3. WRECK ---------- */
function sWreck(t) {
  const s = 'wreck', T = F.T, S = F.scene;
  const tMap = m(s, 'map'), tDive = m(s, 'dive'), tSt = m(s, 'statues'), tHaul = m(s, 'haul'), tLump = m(s, 'lumpup'), tIgn = m(s, 'ignored'), t02 = m(s, 'y1902'), tGear = m(s, 'gear');
  if (T < tMap) {
    kenBurns('storm', T - S.start, {dur: tMap - S.start, z0: 1.04, z1: 1.18, x0: 0.42, x1: 0.56, y0: 0.5, y1: 0.46});
    particles('spray', T, 0.8, 160);
    const fl = Math.max(0, Math.sin((T - S.start) * 2.3) - 0.985) * 40; if (fl > 0) { X.fillStyle = `rgba(220,230,255,${fl * 0.4})`; X.fillRect(0, 0, W, H); }
    chip('SPRING 1900', 80, 990, WIN(S.start + 1.2, tMap - 0.2), {size: 20});
  } else if (T < tDive) {
    const k = P(tMap - 0.3, 3.2);
    const view = {lon0: lerp(19.6, 21.2, k), lon1: lerp(30.4, 28.8, k), lat0: lerp(33.6, 34.4, k), lat1: lerp(40.6, 38.7, k)};
    drawAegean(view, 1, T);
    const lab = (lo, la, s1, a, o = {}) => { const [x, y] = mapProj(lo, la, view); txt(s1, x + (o.dx || 0), y + (o.dy || 0), o.font || FONT.mono(o.size || 18), o.col || C.fg, o.align || 'center', a, 3); };
    const a = WIN(tMap - 0.2, tDive);
    lab(22.3, 37.4, 'PELOPONNESE', a * 0.8); lab(24.9, 35.05, 'CRETE', a * 0.8); lab(23.72, 38.08, 'ATHENS', a, {dy: -14}); lab(27.86, 36.75, 'SYMI', a * P(tMap, 0.6));
    // storm-driven route from the south
    const route = [[27.85, 36.6], [26.8, 35.7], [25.2, 35.95], [24.0, 35.9], [23.32, 35.87]];
    const rk = P(tMap, 2.4, smooth);
    X.save(); X.globalAlpha = a; X.strokeStyle = C.gilt; X.lineWidth = 3; X.setLineDash([12, 9]); X.beginPath();
    const n = 60; for (let i = 0; i <= n * rk; i++) { const f = i / n * (route.length - 1), j = Math.min(route.length - 2, Math.floor(f)), u = f - j; const lo = lerp(route[j][0], route[j + 1][0], u), la = lerp(route[j][1], route[j + 1][1], u); const [x, y] = mapProj(lo, la, view); i ? X.lineTo(x, y) : X.moveTo(x, y); }
    X.stroke(); X.restore();
    const [ax, ay] = mapProj(23.3, 35.87, view), pulse = (T * 1.2) % 1;
    X.save(); X.globalAlpha = a * P(tMap + 2.2, 0.5); X.strokeStyle = C.gilt; X.lineWidth = 3; X.beginPath(); X.arc(ax, ay, 14 + pulse * 40, 0, TAU); X.globalAlpha *= 1 - pulse; X.stroke(); X.restore();
    lab(23.3, 35.87, 'ANTIKYTHERA', a * P(tMap + 2.2, 0.5), {dy: 52, size: 26, col: C.gilt});
  } else if (T < tSt) {
    kenBurns('diver', T - tDive, {dur: tSt - tDive, z0: 1.05, z1: 1.2, x0: 0.5, x1: 0.5, y0: 0.4, y1: 0.58});
    particles('bubble', T, 0.9, 70);
    const dep = Math.round(45 * P(tDive + 0.5, tSt - tDive - 1.5, smooth));
    X.save(); X.globalAlpha = WIN(tDive + 0.4, tSt); X.fillStyle = 'rgba(7,9,13,0.6)'; X.beginPath(); X.roundRect(80, 300, 120, 480, 12); X.fill();
    X.strokeStyle = 'rgba(143,230,255,0.6)'; X.lineWidth = 2; X.stroke();
    for (let i = 0; i <= 45; i += 5) { const y = 330 + i / 45 * 420; X.fillStyle = 'rgba(200,240,255,0.6)'; X.fillRect(170, y, i % 15 ? 12 : 22, 2); }
    X.fillStyle = C.cyan; X.fillRect(96, 330 + dep / 45 * 420 - 2, 74, 4); X.restore();
    txt(dep + ' M', 140, 830, FONT.mono(34), C.cyan, 'center', WIN(tDive + 0.4, tSt), 2);
  } else if (T < tHaul) {
    kenBurns('seafloor', T - tSt, {dur: tHaul - tSt, z0: 1.18, z1: 1.04, x0: 0.6, x1: 0.45});
    particles('bubble', T, 0.4, 40); particles('dust', T, 0.5, 60);
    chip('WRECK · c. 70–60 BC', 80, 990, WIN(m(s, 'ship'), tHaul - 0.1), {size: 20});
  } else if (T < tLump) {
    kenBurns('haul', T - tHaul, {dur: tLump - tHaul, z0: 1.05, z1: 1.16, x0: 0.45, x1: 0.55});
    chip('1900–1901', 80, 990, WIN(tHaul + 0.3, tLump), {size: 20});
  } else if (T < tIgn) {
    bench(T);
    X.save(); cam(1 + 0.05 * smooth((T - tLump) / 6)); drawFragment(W / 2, H / 2 + 20, 0.8, {rot: -0.1}); X.restore(); benchLight(T);
    chip('RECOVERED · 1901', 80, 990, WIN(tLump + 0.3, tIgn), {size: 20});
  } else {
    kenBurns('museum1902', T - tIgn, {dur: S.end - tIgn, z0: 1.04, z1: 1.3, x0: 0.5, x1: 0.52, y0: 0.5, y1: 0.6});
    particles('dust', T, 0.8, 80);
    chip('ATHENS · MAY 1902', 80, 990, WIN(t02, S.end), {size: 20});
    const ga = WIN(tGear - 0.1, S.end + 1, 0.5, 0.5);
    if (ga > 0) { X.save(); X.globalAlpha = ga; X.strokeStyle = C.gilt2; X.lineWidth = 3; X.shadowColor = C.gilt; X.shadowBlur = 24; const r = 70 + 10 * Math.sin(T * 3); X.beginPath(); X.arc(W * 0.5, H * 0.6, r, 0, TAU); X.stroke(); X.restore(); callout(W * 0.5 + 60, H * 0.6 - 50, W * 0.5 + 260, H * 0.6 - 180, 'A GEAR WHEEL', ga); }
  }
}

/* ---------- 4. X-RAY ---------- */
function sXray(t) {
  const s = 'xray', T = F.T, S = F.scene;
  const tMus = m(s, 'museum'), tPr = m(s, 'price'), tXr = m(s, 'xr'), tCt = m(s, 'ct'), tSl = m(s, 'slice'), tFd = m(s, 'found'), t30 = m(s, 'count30'), tLt = m(s, 'letters'), tMn = m(s, 'manual');
  if (T < tMus) {
    bench(T); X.save(); cam(1.08 + 0.04 * Math.sin(T * 0.3)); drawFragment(W / 2, H / 2 + 20, 0.82, {rot: 0.04 * Math.sin(T * 0.4)}); X.restore(); benchLight(T);
    bigLine('a gear?', 200, WIN(m(s, 'sense'), tMus, 0.4, 0.4), {italic: true, size: 70});
  } else if (T < tXr) {
    kenBurns('museum1902', T - tMus, {dur: tXr - tMus, z0: 1.25, z1: 1.08, x0: 0.4, x1: 0.48, y0: 0.62, y1: 0.55});
    X.save(); X.globalCompositeOperation = 'saturation'; X.fillStyle = 'rgba(0,0,0,0.6)'; X.fillRect(0, 0, W, H); X.restore();
    const yr = Math.round(lerp(1902, 1951, P(tMus + 0.5, tPr - tMus - 0.5, smooth)));
    txt(String(yr), W - 120, 140, FONT.serif(90), C.fg, 'right', WIN(tMus + 0.3, tPr));
    lowerThird('Derek de Solla Price', 'Historian of science', WIN(tPr + 0.2, tXr + 0.4));
  } else if (T < tCt) {
    // radiograph on a lightbox
    X.fillStyle = '#070b10'; X.fillRect(0, 0, W, H);
    const fl = 0.92 + 0.08 * Math.sin(T * 37) * Math.sin(T * 13);
    X.save(); X.globalAlpha = fl; X.fillStyle = rad(W / 2, H / 2, 100, 900, [[0, '#24323e'], [1, '#0a1016']]); X.fillRect(160, 80, W - 320, H - 160); X.restore();
    X.save(); cam(1 + 0.12 * P(tXr, 8)); X.globalCompositeOperation = 'lighter'; drawFragment(W / 2, H / 2, 0.86, {xray: true, shadow: false, rot: 0.02}); X.restore();
    const see = P(m(s, 'see'), 1.4);
    if (see > 0) { X.save(); X.globalAlpha = see; X.globalCompositeOperation = 'lighter'; cam(1 + 0.12 * P(tXr, 8)); gear(W / 2 + 4, H / 2 + 6, 223, 258, 0.37, 'xray', {spokes: 4}); X.restore(); }
    chip('X-RAY · EARLY 1970s', 80, 990, WIN(tXr + 0.2, tCt), {size: 20, color: C.cyan, stroke: 'rgba(143,230,255,0.6)'});
    lowerThird('with Charalampos Karakalos', 'Greek physicist', WIN(tXr + 1.2, tXr + 5.5), 120, 860);
  } else if (T < tFd) {
    // CT scanner ring + slicing
    X.fillStyle = '#05080c'; X.fillRect(0, 0, W, H);
    const rk = P(tCt, 1.2, settle);
    X.save(); X.translate(W / 2, H / 2); X.scale(rk, rk);
    X.strokeStyle = 'rgba(200,220,235,0.85)'; X.lineWidth = 46; X.beginPath(); X.arc(0, 0, 470, 0, TAU); X.stroke();
    X.strokeStyle = 'rgba(20,26,32,1)'; X.lineWidth = 30; X.beginPath(); X.arc(0, 0, 470, 0, TAU); X.stroke();
    X.rotate(T * 2.2); X.fillStyle = C.cyan; X.shadowColor = C.cyan; X.shadowBlur = 30; X.fillRect(-12, -492, 24, 44); X.restore();
    X.save(); cam(0.9); drawFragment(W / 2, H / 2, 0.8, {rot: 0}); X.restore();
    const sl = P(tSl, 3.5, x => x);
    if (sl > 0) { const y = lerp(H / 2 - 260, H / 2 + 260, (sl * 3) % 1); X.save(); X.fillStyle = 'rgba(143,230,255,0.25)'; X.fillRect(W / 2 - 330, y - 3, 660, 6); X.shadowColor = C.cyan; X.shadowBlur = 20; X.fillStyle = C.cyan; X.fillRect(W / 2 - 330, y - 1, 660, 2); X.restore(); }
    chip('CT SCAN · 2005 · 8-TONNE MACHINE', 80, 990, WIN(tCt + 0.4, tFd), {size: 20, color: C.cyan, stroke: 'rgba(143,230,255,0.6)'});
    if (sl > 0) txt('THOUSANDS OF VIRTUAL SLICES', W - 100, 990, FONT.mono(22), C.cyan, 'right', WIN(tSl, tFd), 3);
  } else if (T < tLt) {
    // the gears float out: thirty of them
    bench(T); dim(0.55);
    const ex = P(tFd, 2.2, settle);
    seeded(41, () => {
      const L = []; for (let i = 0; i < 30; i++) L.push({n: [223, 64, 38, 48, 24, 127, 32, 32, 50, 50, 223, 188, 53, 30, 54, 96, 15, 27, 60, 12, 57, 15, 48, 20, 60, 38, 63, 32, 24, 48][i], x: 0, y: 0});
      L.forEach((g, i) => { const col = i % 10, row = Math.floor(i / 10); g.x = 260 + col * 156; g.y = 330 + row * 230; });
      L.forEach((g, i) => {
        const r = Math.min(70, 26 + g.n * 0.28), x = lerp(W / 2, g.x, ex), y = lerp(H / 2, g.y, ex);
        const a = clamp01((F.T - t30) * 6 - i * 0.2 + 3) * clamp01(ex * 3);
        gear(x, y, g.n, r, F.T * 0.4 * (i % 2 ? 1 : -1) * 30 / g.n, 'old', {alpha: Math.max(0.35, a), blur: 12, spokes: g.n > 60 ? 4 : 0});
      });
    });
    const c = Math.min(30, Math.floor(P(t30, 1.6, x => x) * 30));
    if (T > t30) { txtShadow(String(c), W / 2, 1000, FONT.num(84), C.gilt2, 'center', WIN(t30, tLt)); }
    chip('30 SURVIVING GEARS · ILLUSTRATIVE LAYOUT', 80, 120, WIN(tFd + 0.6, tLt), {size: 18});
  } else {
    // Greek letters rising out of the bronze
    bench(T);
    X.save(); cam(1.25); drawFragment(W / 2 - 60, H / 2 + 60, 0.75, {rot: -0.05}); X.restore();
    dim(0.35 * P(tLt, 1));
    const page = P(tMn, 1.6, settle);
    seeded(7, () => {
      for (let i = 0; i < 220; i++) {
        const ch = GREEKTXT[Math.floor(rnd() * GREEKTXT.length)], x0 = W / 2 - 300 + rnd() * 600, y0 = H / 2 - 250 + rnd() * 500;
        const col = i % 22, row = Math.floor(i / 22), x1 = W / 2 - 360 + col * 33, y1 = 300 + row * 52;
        const a = clamp01((F.T - tLt) * 3 - rnd() * 2);
        txt(ch, lerp(x0, x1, page), lerp(y0, y1, page), FONT.greek(30, 600), `rgba(255,220,150,${0.9})`, 'center', a);
      }
    });
    chip('INSCRIPTIONS', 80, 990, WIN(tLt + 0.3, tMn), {size: 20});
    bigLine('its own instruction manual', 900, WIN(tMn + 0.4, S.end + 1, 0.6, 0.4), {italic: true, size: 64, color: C.gilt2});
  }
}

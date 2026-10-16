/* Everyday Machines — the retractable ballpoint pen. Local units ≈ 0.5 mm; pen axis along +x, tip at the right. */
window.OBJECT = K => {
  const {ctx, TAU, cur, clamp01, ease, smooth, lerp, shade, C} = K;
  const NAVY = '#22355e', IVORY = '#ece6d6', INK = '#1d3b8f', GRIP = '#2a2e35';
  const P = 220, VB = 1040, BASEX = 260;

  /* ---------- click mechanism state ---------- */
  let clicks = 0, phase = 'rest', lug = {u: 0, v: -110}, ext = 0, camPhase0 = 0, roll = 0, trail = 0, paper = 0, gripPh = 0;
  const rest = n => ({u: n * P / 2, v: n % 2 === 0 ? -110 : -40});
  const bottom = n => ({u: n * P / 2 + P / 4, v: 22});
  const pressPath = (n, f) => { const r = rest(n), b = bottom(n); return f < 0.6 ? {u: r.u, v: lerp(r.v, 10, f / 0.6)} : {u: lerp(r.u, b.u, (f - 0.6) / 0.4), v: lerp(10, 22, (f - 0.6) / 0.4)}; };
  const releasePath = (n, q) => {
    const b = bottom(n), r = rest(n + 1);
    if (q < 0.25) return {u: b.u, v: lerp(22, 4, q / 0.25)};
    if (q < 0.75) return {u: lerp(b.u, b.u + P / 4, (q - 0.25) / 0.5), v: lerp(4, -26, (q - 0.25) / 0.5)};
    return {u: r.u, v: lerp(-26, r.v, (q - 0.75) / 0.25)};
  };
  function updateLug() {
    const p = cur.press;
    if (phase === 'rest' && p > 0.001) phase = 'press';
    if (phase === 'press' && p >= 0.999) phase = 'down';
    if (phase === 'down' && p < 0.999) phase = 'release';
    if (phase === 'press' && p <= 0.001) phase = 'rest';
    if (phase === 'release' && p <= 0.001) { clicks++; phase = 'rest'; }
    lug = phase === 'rest' ? rest(clicks) : phase === 'press' ? pressPath(clicks, p) : phase === 'down' ? bottom(clicks) : releasePath(clicks, 1 - p);
    ext = lug.v <= -40 ? (lug.v + 110) / 70 : 1 + (lug.v + 40) / 62 * 0.25;
  }

  /* ---------- part drawing (assembled coordinates) ---------- */
  function cyl(x0, x1, r, hex, a = 1) { ctx.fillStyle = K.cylGrad(r, hex, a); ctx.fillRect(x0, -r, x1 - x0, 2 * r); }
  function drawRefill(sh) {
    ctx.fillStyle = K.cylGrad(3.2, '#dfe6ee', 0.45); ctx.fillRect(-86 + sh, -3.2, 198, 6.4);
    const il = clamp01(cur.ink); if (il > 0.005) cyl(106 - 174 * il + sh, 106 + sh, 2.3, INK);
    cyl(84 + sh, 88.5 + sh, 4.7, IVORY);
    ctx.fillStyle = K.gilt(0, -3.2, 0, 3.2);
    ctx.beginPath(); ctx.moveTo(110 + sh, -3.2); ctx.lineTo(126 + sh, -1.3); ctx.lineTo(126 + sh, 1.3); ctx.lineTo(110 + sh, 3.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = K.rad(127.2 + sh, -0.5, 0.1, 127.6 + sh, 0, 1.4, [[0, '#e9edf2'], [0.5, '#7b828c'], [1, '#2f343b']]);
    ctx.beginPath(); ctx.arc(127.6 + sh, 0, 1.35, 0, TAU); ctx.fill();
  }
  function drawSpring(x0, x1) {
    const N = 9, r = 4.6, steps = N * 28;
    for (const front of [false, true]) {
      ctx.beginPath(); let pen = false;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps, a = t * N * TAU, x = x0 + (x1 - x0) * t, y = r * Math.sin(a);
        const isFront = Math.cos(a) > 0;
        if (isFront === front) { pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } else pen = false;
      }
      ctx.strokeStyle = front ? '#e3e8ee' : '#6b7480'; ctx.lineWidth = front ? 1.15 : 0.9; ctx.stroke();
    }
  }
  function drawCam(sh, rot) {
    cyl(-104 + sh, -86 + sh, 7.4, IVORY);
    for (let j = 0; j < 4; j++) {
      const a = rot + j * TAU / 4, y = 7.4 * Math.sin(a), c = Math.cos(a);
      if (c < -0.15) continue;
      ctx.fillStyle = shade('#cfc6b2', -0.35 + 0.5 * c, 0.95);
      ctx.fillRect(-104 + sh, y - 1.5, 11, 3);
    }
    ctx.strokeStyle = 'rgba(80,70,50,0.6)'; ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) ctx.lineTo(-104 + sh + (i % 2 ? 2.2 : 0), -7.4 + i * 14.8 / 8);
    ctx.stroke();
  }
  function drawButtonStem(bx, camL) { cyl(bx + 24, camL, 3.4, IVORY); }
  function drawButtonCap(bx) {
    ctx.fillStyle = K.cylGrad(6.6, '#c9d0d8');
    ctx.beginPath(); ctx.moveTo(bx + 24, -6.6); ctx.lineTo(bx + 5, -6.6); ctx.quadraticCurveTo(bx, -6.6, bx, -3); ctx.lineTo(bx, 3); ctx.quadraticCurveTo(bx, 6.6, bx + 5, 6.6); ctx.lineTo(bx + 24, 6.6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,46,54,0.6)'; ctx.lineWidth = 0.5; ctx.stroke();
  }
  function drawUpper(a) {
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = K.cylGrad(11, NAVY);
    ctx.beginPath(); ctx.moveTo(12, -11); ctx.lineTo(-126, -11); ctx.quadraticCurveTo(-131, -11, -131, -6); ctx.lineTo(-131, 6); ctx.quadraticCurveTo(-131, 11, -126, 11); ctx.lineTo(12, 11); ctx.closePath(); ctx.fill();
    for (let x = 4; x < 12; x += 2.2) { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x, -10.6, 0.8, 21.2); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= Math.max(a, 0.85);
    ctx.fillStyle = K.lin(0, -18, 0, -11, [[0, '#f4f6f8'], [0.5, '#9aa3ad'], [1, '#d7dce2']]);
    ctx.beginPath(); ctx.moveTo(-124, -10.5); ctx.lineTo(-118, -16.4); ctx.lineTo(-52, -16.4); ctx.quadraticCurveTo(-44, -16.4, -44, -13.6); ctx.quadraticCurveTo(-44, -11.4, -52, -11.6); ctx.lineTo(-116, -11.6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawLower(a) {
    ctx.save(); ctx.globalAlpha *= a;
    cyl(12, 98, 11, NAVY);
    ctx.fillStyle = K.cylGrad(11.7, GRIP); ctx.fillRect(22, -11.7, 66, 23.4);
    for (let x = 24; x < 88; x += 2.6) { ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(x, -11.7, 0.9, 23.4); }
    for (let j = 0; j < 3; j++) {
      const y = 11 * Math.sin(gripPh + j * TAU / 3), c = Math.cos(gripPh + j * TAU / 3);
      if (c > 0) { ctx.fillStyle = `rgba(255,255,255,${0.10 * c})`; ctx.fillRect(22, y - 1.2, 66, 2.4); }
    }
    ctx.fillStyle = K.lin(0, -11, 0, 11, [[0, shade(NAVY, -0.4)], [0.2, shade(NAVY, 0.4)], [0.5, NAVY], [1, shade(NAVY, -0.55)]]);
    ctx.beginPath(); ctx.moveTo(98, -11); ctx.lineTo(120, -4.6); ctx.lineTo(120, 4.6); ctx.lineTo(98, 11); ctx.closePath(); ctx.fill();
    cyl(119, 124, 4.6, '#c9d0d8');
    ctx.restore();
  }
  function outline(x0, x1, r) { ctx.strokeStyle = 'rgba(214,226,246,0.55)'; ctx.lineWidth = 0.6; ctx.strokeRect(x0, -r, x1 - x0, 2 * r); }

  /* ---------- exploded layout ---------- */
  const PARTS = {button: {cx: -128, row: 0, re: -104}, cam: {cx: -95, row: 1, re: -86}, spring: {cx: 103, row: 2, re: 118},
                 refill: {cx: 20, row: 3, re: 129}, upper: {cx: -59, row: 4, re: 12}, lower: {cx: 68, row: 5, re: 124}};
  const ORDER = ['button', 'cam', 'spring', 'refill', 'upper', 'lower'];
  function off(id) {
    const p = PARTS[id], i = ORDER.indexOf(id);
    const t = ease(clamp01(cur.explode * 1.5 - i * 0.1));
    const bob = Math.sin(K.rt * 0.9 + i * 1.1) * 1.4 * t;
    let dx = -p.cx * t, dy = (-150 + p.row * 58) * t + bob;
    if (id === 'lower') dx += 36 * cur.open * (1 - t);
    if (id === 'refill' || id === 'spring') { dx += 30 * cur.swap; dy -= 78 * cur.swap; }
    return [dx, dy, t];
  }
  function drawPen() {
    const ex = cur.explode, xr = cur.xray;
    const sh = 12 * ext * (1 - ex), bx = -152 + 0.4 * sh + 3 * cur.press * (1 - ex);
    K.view();
    if (ex < 0.6) {
      ctx.save(); ctx.globalAlpha = 0.5 * (1 - ex / 0.6); ctx.filter = 'blur(10px)'; ctx.fillStyle = '#000';
      K.rr(-150, 6, 276 + 36 * cur.open, 22, 11); ctx.fill(); ctx.restore();
    }
    const at = id => { const [dx, dy] = off(id); K.view(); ctx.translate(dx, dy); };
    at('refill'); drawRefill(sh); K.anchor('refillE', 128, 0); K.anchor('tipA', 127.6 + sh, 0);
    at('spring');
    const s0 = 88.5 + sh, s1 = 114 + 4 * off('spring')[2];
    drawSpring(lerp(s0, 88, off('spring')[2]), lerp(s1, 118, off('spring')[2])); K.anchor('springE', 118, 0); K.anchor('springA', 104, -4);
    at('cam'); drawCam(sh, lug.u / P * TAU / 4); K.anchor('camE', -86 + sh, 0);
    at('button'); drawButtonStem(bx, -104 + sh * (1 - off('button')[2])); K.anchor('buttonE', -104, 0);
    const ba = 1 - 0.82 * xr;
    at('upper'); drawUpper(ba); if (xr > 0.01) { ctx.globalAlpha = xr; outline(-131, 12, 11); ctx.globalAlpha = 1; } K.anchor('upperE', 12, 0);
    at('lower'); drawLower(ba); if (xr > 0.01) { ctx.globalAlpha = xr; outline(12, 98, 11); ctx.globalAlpha = 1; } K.anchor('lowerE', 124, 0);
    at('button'); drawButtonCap(bx);
  }

  /* ---------- unrolled cam diagram ---------- */
  function drawDiagram(a) {
    const x0 = 70, y0 = 740, w = 940, h = 500;
    ctx.save(); ctx.globalAlpha = a;
    K.rr(x0, y0, w, h, 26); ctx.fillStyle = 'rgba(9,13,20,0.93)'; ctx.fill();
    ctx.strokeStyle = 'rgba(207,171,110,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); K.rr(x0, y0, w, h, 26); ctx.clip();
    const top = y0 + 120;
    for (let kk = -2; kk <= 5; kk++) {
      const c0 = BASEX + kk * P, hw = 22;
      const n0 = c0 + P / 2, c1 = c0 + P;
      ctx.beginPath();
      ctx.moveTo(c0 + hw, top); ctx.lineTo(c0 + hw, VB - 28); ctx.lineTo(c0 + P / 4 - 20, VB - 28); ctx.lineTo(c0 + P / 4 - 20, VB);
      ctx.lineTo(n0 - hw, VB - 28); ctx.lineTo(n0 - hw, VB - 40); ctx.lineTo(n0 + hw, VB - 40); ctx.lineTo(n0 + hw, VB - 28);
      ctx.lineTo(c0 + 3 * P / 4 - 20, VB - 28); ctx.lineTo(c0 + 3 * P / 4 - 20, VB); ctx.lineTo(c1 - hw, VB - 28); ctx.lineTo(c1 - hw, top); ctx.closePath();
      ctx.fillStyle = K.lin(0, top, 0, VB, [[0, '#1b2a4c'], [1, '#2d4478']]); ctx.fill();
      ctx.strokeStyle = 'rgba(150,178,230,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    }
    const lx = BASEX + (lug.u - camPhase0 * P / 2) - Math.floor((lug.u - camPhase0 * P / 2) / (2 * P)) * 0, lt = VB + lug.v;
    ctx.fillStyle = K.lin(0, lt + 70, 0, lt + 112, [[0, '#d8d0bd'], [1, '#9c9380']]);
    ctx.fillRect(x0, lt + 70, w, 40);
    for (let j = -3; j <= 4; j++) {
      const x = lx + j * P;
      ctx.fillStyle = K.lin(x - 20, 0, x + 20, 0, [[0, '#f4efe2'], [1, '#bdb39c']]);
      ctx.beginPath(); ctx.moveTo(x - 20, lt); ctx.lineTo(x + 20, lt - 21); ctx.lineTo(x + 20, lt + 72); ctx.lineTo(x - 20, lt + 72); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(60,50,30,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
    K.txt('UNROLLED VIEW · INSIDE THE BARREL', x0 + 30, y0 + 34, '500 20px "IBM Plex Mono"', C.gilt, 'left', a, 3);
    const pa = clamp01(cur.press * 3) * a;
    if (pa > 0.01) {
      ctx.globalAlpha = pa; ctx.fillStyle = C.gilt;
      ctx.beginPath(); ctx.moveTo(x0 + w - 60, y0 + 70); ctx.lineTo(x0 + w - 60, y0 + 150); ctx.lineTo(x0 + w - 74, y0 + 136); ctx.moveTo(x0 + w - 60, y0 + 150); ctx.lineTo(x0 + w - 46, y0 + 136);
      ctx.strokeStyle = C.gilt; ctx.lineWidth = 4; ctx.stroke();
      K.txt('PRESS', x0 + w - 60, y0 + 182, '500 20px "IBM Plex Mono"', C.gilt, 'center', pa, 3);
    }
    ctx.restore();
    K.anchorScreen('dRidge', BASEX + P * 1.62, VB - 100);
    K.anchorScreen('dChannel', BASEX, VB - 150);
    K.anchorScreen('dLedge', BASEX + P / 2, VB - 44);
    K.anchorScreen('dCam', lx, lt + 40);
  }

  /* ---------- magnified tip ---------- */
  function drawMacro(a) {
    const cx = 540, cy = 860, R = 400, r = 130, by = cy;
    ctx.save(); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(cx, cy - 40, R, 0, TAU); ctx.fillStyle = '#0b0f15'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy - 40, R - 6, 0, TAU); ctx.clip();
    const py = by + r;
    ctx.fillStyle = K.lin(0, py, 0, py + 300, [[0, '#efe9dc'], [1, '#cfc7b4']]); ctx.fillRect(cx - R, py, 2 * R, 400);
    for (let i = -12; i < 14; i++) { const x = cx + i * 60 - (paper % 60); ctx.fillStyle = 'rgba(120,110,90,0.08)'; ctx.fillRect(x, py, 1.5, 400); }
    if (trail > 0) {
      ctx.beginPath(); const tx0 = Math.max(cx - R, cx - trail);
      for (let x = cx; x >= tx0; x -= 6) ctx.lineTo(x, py + 4 + 2.5 * Math.sin((x + paper) * 0.03));
      ctx.strokeStyle = 'rgba(29,59,143,0.92)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.fillStyle = K.lin(cx - 280, 0, cx + 280, 0, [[0, '#7c6a45'], [0.3, '#e7cf98'], [0.55, '#a8874b'], [1, '#6f5c38']]);
    ctx.beginPath();
    const lipA = Math.PI / 3;
    ctx.moveTo(cx - 280, cy - R); ctx.lineTo(cx - 168, by + r * Math.cos(lipA) - 6);
    ctx.lineTo(cx - r * Math.sin(lipA) - 4, by + r * Math.cos(lipA));
    ctx.arc(cx, by, r + 6, Math.PI / 2 + lipA, Math.PI / 2 - lipA, true);
    ctx.lineTo(cx + 168, by + r * Math.cos(lipA) - 6); ctx.lineTo(cx + 280, cy - R); ctx.closePath(); ctx.fill();
    const inkG = K.lin(0, cy - R, 0, by - r, [[0, '#0f2160'], [1, '#2445a3']]);
    ctx.fillStyle = inkG;
    ctx.beginPath(); ctx.moveTo(cx - 210, cy - R); ctx.lineTo(cx + 210, cy - R); ctx.lineTo(cx + 190, cy - R + 70);
    ctx.quadraticCurveTo(cx + 60, cy - R + 110, cx + 34, cy - R + 150); ctx.lineTo(cx + 22, by - r + 6); ctx.lineTo(cx - 22, by - r + 6);
    ctx.lineTo(cx - 34, cy - R + 150); ctx.quadraticCurveTo(cx - 60, cy - R + 110, cx - 190, cy - R + 70); ctx.closePath(); ctx.fill();
    for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sg * 30, by - r - 40); ctx.quadraticCurveTo(cx + sg * 70, by - r - 10, cx + sg * 92, by - 92); ctx.strokeStyle = inkG; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(cx - 200, cy - R + 8, 400, 6);
    if (cur.grav > 0.01) {
      ctx.globalAlpha = a * cur.grav; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      const yA = cy - R + 110 + ((K.rt * 60) % 40);
      ctx.beginPath(); ctx.moveTo(cx + 120, cy - R + 70); ctx.lineTo(cx + 120, cy - R + 220); ctx.moveTo(cx + 104, cy - R + 200); ctx.lineTo(cx + 120, cy - R + 220); ctx.lineTo(cx + 136, cy - R + 200); ctx.stroke();
      ctx.fillStyle = 'rgba(80,120,230,0.9)'; ctx.beginPath(); ctx.arc(cx, yA, 7, 0, TAU); ctx.fill();
      ctx.globalAlpha = a;
    }
    ctx.save(); ctx.translate(cx, by); ctx.rotate(roll);
    ctx.fillStyle = K.rad(-45, -50, 10, 0, 0, r, [[0, '#9aa1ab'], [0.45, '#545b65'], [1, '#22262c']]);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    for (let i = 0; i < 16; i++) { const aa = i * 2.39996, rr = r * Math.sqrt((i + 0.5) / 16) * 0.92; ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.arc(rr * Math.cos(aa), rr * Math.sin(aa), 6, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, by, r - 5, -Math.PI * 0.95, Math.PI * 0.5); ctx.strokeStyle = 'rgba(40,80,200,0.75)'; ctx.lineWidth = 9; ctx.stroke();
    ctx.fillStyle = K.rad(cx - 50, by - 60, 2, cx - 50, by - 60, 40, [[0, 'rgba(255,255,255,0.75)'], [1, 'rgba(255,255,255,0)']]);
    ctx.beginPath(); ctx.arc(cx - 50, by - 60, 40, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy - 40, R - 3, 0, TAU); ctx.strokeStyle = 'rgba(207,171,110,0.8)'; ctx.lineWidth = 6; ctx.stroke();
    ctx.restore();
    K.anchorScreen('mBall', cx + r * 0.62, by + r * 0.42);
    K.anchorScreen('mSocket', cx - 230, by - 190);
    K.anchorScreen('mInk', cx + 26, cy - R + 70);
    K.anchorScreen('mPaper', cx + 250, py + 70);
    K.anchorScreen('mGrav', cx + 120, cy - R + 150);
  }

  const press = (mark, at = 0, down = 0.4, up = 0.7) => [
    {mark, at, cam: {press: 1}, dur: down, sfx: 'click'},
    {mark, at: at + down + 0.08, cam: {press: 0}, dur: up, sfx: 'clack'}];
  const pressL = (at, down = 0.35, up = 0.55) => [
    {line: 0, at, cam: {press: 1}, dur: down, sfx: 'click'},
    {line: 0, at: at + down + 0.08, cam: {press: 0}, dur: up, sfx: 'clack'}];

  return {
    seed: 11, cta: ['Inside the', 'Click Pen'],
    state: {press: 0, xray: 0, open: 0, diag: 0, macro: 0, write: 0, grav: 0, swap: 0, ink: 1, card: 0},
    scenes: {
      p_hook: {camDur: 0, cam: {zoom: 2.7, fx: 108, fy: 0, spin: -0.42, sy: -0.06},
        events: [{at: 0.05, cam: {zoom: 1.05, fx: -10, spin: -0.52}, dur: 5.5}, ...pressL(0.06, 0.1, 0.16), ...pressL(0.86, 0.1, 0.16),
                 {at: 5.6, cam: {spin: -0.4, zoom: 1.12}, dur: 6}]},
      p_intro: {title: 'The Click Pen', spec: 'Retractable ballpoint', camDur: 2.2, cam: {zoom: 1.0, fx: -10, fy: 0, spin: -0.62, sy: -0.03},
        events: [{at: 2.4, cam: {spin: -0.5, zoom: 1.06}, dur: 5}, {mark: 'open', cam: {open: 1}, dur: 1.8, sfx: 'twist'},
                 {mark: 'open', at: 1.9, cam: {zoom: 0.92, spin: -0.36}, dur: 3.5}]},
      p_stack: {title: 'Six Parts', spec: 'Laid out in a line', camDur: 2.6,
        cam: {explode: 1, spin: 0, zoom: 0.9, sx: -0.13, sy: -0.1, fx: 0, fy: -5},
        events: [{mark: 'l5', at: 1.6, cam: {zoom: 0.95, sx: -0.14}, dur: 5}],
        callouts: [{a: 'buttonE', t: 'Push button', dx: 22, dy: 0, mark: 'l1'}, {a: 'camE', t: 'Rotating cam', dx: 22, dy: 0, mark: 'l2'},
                   {a: 'springE', t: 'Spring', dx: 22, dy: 0, mark: 'l3'}, {a: 'refillE', t: 'Ink refill', dx: 18, dy: -18, mark: 'l4'},
                   {a: 'upperE', t: 'Upper barrel', dx: 22, dy: 0, mark: 'l5'}, {a: 'lowerE', t: 'Lower barrel', dx: 18, dy: 16, mark: 'l5', after: 0.3}]},
      p_cam: {title: 'The Rotating Cam', spec: 'One button, two jobs', camDur: 2.4,
        cam: {explode: 0, open: 0, spin: 0, zoom: 0.93, fx: -10, fy: 0, sx: 0, sy: -0.27, xray: 1},
        events: [{at: 1.0, cam: {diag: 1}, dur: 1.1}, ...press('p1', 0, 0.45, 0.8), ...press('p2', 0, 0.45, 0.01).slice(0, 1),
                 {mark: 'r2', at: 0, cam: {press: 0}, dur: 0.9, sfx: 'clack'}],
        callouts: [{a: 'dRidge', t: 'Ridges', dx: 30, dy: -110, line: 0, after: 1.6}, {a: 'dChannel', t: 'Deep channel', dx: -30, dy: -68, line: 0, after: 2.6},
                   {a: 'dLedge', t: 'Short ledge', dx: 10, dy: -170, line: 0, after: 3.6, until: 'p2'},
                   {a: 'tipA', t: 'Tip held out', dx: -40, dy: -60, mark: 'r1', after: 0.9, until: 'p2'},
                   {a: 'tipA', t: 'Tip back home', dx: -40, dy: -60, mark: 'r2', after: 0.9}]},
      p_spring: {title: 'The Spring', spec: 'Always pushing back', camDur: 2.0,
        cam: {diag: 0, zoom: 2.0, fx: 72, fy: 0, sy: -0.12, xray: 1},
        events: [...pressL(0.4), ...pressL(2.2), ...pressL(4.0)],
        callouts: [{a: 'springA', t: 'Spring', dx: -40, dy: -70, line: 0, after: 0.6}]},
      p_refill: {title: 'The Refill', spec: 'Swap it, keep the pen', camDur: 2.2,
        cam: {open: 2.2, explode: 0, xray: 0.75, zoom: 1.02, spin: -0.12, sy: -0.06, fx: 4, fy: 0},
        events: [{mark: 'dry', cam: {ink: 0.1}, dur: 1.4}, {mark: 'swap', cam: {swap: 1}, dur: 0.9, sfx: 'lift'},
                 {mark: 'swap', at: 1.0, cam: {ink: 1}, dur: 0.01}, {mark: 'swap', at: 1.05, cam: {swap: 0}, dur: 1.1},
                 {mark: 'swap', at: 2.3, cam: {open: 0, xray: 0.4}, dur: 1.3, sfx: 'twist'},
                 {mark: 'swap', at: 3.8, cam: {press: 1}, dur: 0.22, sfx: 'click'}, {mark: 'swap', at: 4.1, cam: {press: 0}, dur: 0.35, sfx: 'clack'}],
        callouts: [{a: 'refillE', t: 'Ink refill', dx: -20, dy: -60, line: 0, after: 1.0, until: 'swap'}]},
      p_tip: {title: 'The Tip', spec: 'Patented 1938', camDur: 2.6,
        cam: {zoom: 5.4, fx: 124, fy: 0, sy: -0.1, xray: 0.5, spin: 0, open: 0},
        events: [{at: 1.4, cam: {macro: 1}, dur: 1.4}, {line: 0, at: 2.4, cam: {card: 1}, dur: 0.6}, {mark: 'answer', cam: {card: 0, write: 0.3}, dur: 0.8},
                 {mark: 'ball', at: 3.2, cam: {write: 0.35}, dur: 2}],
        callouts: [{a: 'mBall', t: 'Ball · 0.7 mm', dx: 40, dy: 60, mark: 'ball', after: 0.6},
                   {a: 'mSocket', t: 'Socket', dx: -10, dy: -70, mark: 'ball', after: 4.5}]},
      p_ink: {title: 'Rolling Ink', spec: 'Oil-based paste', camDur: 1.6, cam: {macro: 1, write: 1},
        events: [{mark: 'grav', cam: {grav: 1}, dur: 0.8}, {mark: 'stop', cam: {write: 0, grav: 0}, dur: 1.2}],
        callouts: [{a: 'mPaper', t: 'Paper', dx: 20, dy: 40, line: 0, after: 1.0}, {a: 'mInk', t: 'Oil-based ink', dx: 60, dy: -10, line: 0, after: 3.0, until: 'grav'},
                   {a: 'mGrav', t: 'Gravity feed', dx: 60, dy: 0, mark: 'grav', after: 0.4, until: 'stop'},
                   {a: 'mBall', t: 'Ball seals the socket', dx: 40, dy: 60, mark: 'stop', after: 0.8}]},
      p_finale: {title: 'Reassembled', spec: 'A machine in your pocket', camDur: 2.6,
        cam: {macro: 0, write: 0, grav: 0, xray: 0, zoom: 1.08, fx: -10, fy: 0, sy: -0.03, spin: -0.48},
        events: [...press('click', 0, 0.25, 0.4), ...press('click', 1.3, 0.25, 0.4), {mark: 'click', at: 3, cam: {spin: -0.36, zoom: 1.14}, dur: 6}]},
      p_cta: {cta: true, quiet: true, camDur: 2.0, cam: {zoom: 0.86, sy: 0.18, spin: -0.3, fx: -10},
        events: [...pressL(1.6, 0.2, 0.35), ...pressL(3.2, 0.2, 0.35)]}
    },
    enter(id) { if (id === 'p_cam') camPhase0 = clicks; },
    simulate(dt) {
      updateLug();
      gripPh += dt * 7 * (cur.open > 0.02 && cur.open < 0.98 ? 1 : 0.03);
      const v = 170 * cur.write;
      paper += v * dt; roll += v * dt / 130;
      if (cur.write > 0.02) trail += v * dt;
    },
    render() { drawPen(); },
    overlay() {
      if (cur.diag > 0.01) drawDiagram(cur.diag);
      if (cur.macro > 0.01) drawMacro(cur.macro);
      K.card('1938 · LÁSZLÓ BÍRÓ', 1278, cur.card, 'NEWSPAPER EDITOR, BUDAPEST');
    }
  };
};

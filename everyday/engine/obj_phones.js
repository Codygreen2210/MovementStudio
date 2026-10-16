/* Everyday Machines — the headphone speaker (dynamic driver). Local units ≈ 0.55 mm. */
window.OBJECT = K => {
  const {ctx, TAU, cur, clamp01, ease, smooth, lerp, shade, C} = K;
  const CUPX = 108, CUPY = 30;
  const GRAPH = '#2b2f36', CUSH = '#26201c';
  let ph = 0, dispNow = 0, sigPh = 0, wavesT = 0, glow = 0;

  /* ---------- helpers ---------- */
  function ell(x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); }
  function side(r, h, tilt, fill) {
    const d = h * Math.tan(tilt);
    if (d < 0.05) return;
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(-r, d); ctx.arc(0, d, r, Math.PI, 0, true); ctx.lineTo(r, 0); ctx.arc(0, 0, r, 0, Math.PI, false); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function ring(ro, ri) { ctx.beginPath(); ctx.arc(0, 0, ro, 0, TAU); ctx.arc(0, 0, ri, 0, TAU, true); }

  /* ---------- whole headphones (top view, cushions up) ---------- */
  function drawCup(x, y, open, waves) {
    ctx.save(); ctx.translate(x, y);
    ell(0, 0, 72, 90); ctx.fillStyle = K.rad(-20, -30, 10, 0, 0, 95, [[0, '#4a505a'], [1, '#1a1d22']]); ctx.fill();
    ctx.strokeStyle = 'rgba(220,226,234,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
    drawDriverFront(0, 0, 1);
    if (open < 0.999) {
      const lift = ease(open);
      ctx.save(); ctx.globalAlpha *= 1 - lift; ctx.translate(lift * 30, -lift * 110); ctx.scale(1 + lift * 0.35, 1 + lift * 0.35);
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 20 + lift * 40; ctx.shadowOffsetY = 8 + lift * 30;
      ell(0, 0, 62, 80); ctx.fillStyle = K.rad(-18, -26, 8, 0, 0, 84, [[0, '#57483d'], [0.6, CUSH], [1, '#120e0b']]); ctx.fill();
      ctx.shadowColor = 'transparent';
      ell(0, 0, 40, 56); ctx.fillStyle = K.rad(-8, -12, 4, 0, 0, 56, [[0, '#3a3f47'], [1, '#1d2026']]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.6;
      for (let i = -54; i < 56; i += 3) { ctx.beginPath(); ctx.moveTo(-40, i); ctx.lineTo(40, i); ctx.stroke(); }
      ctx.setLineDash([2.4, 2.2]); ctx.strokeStyle = 'rgba(210,190,170,0.45)'; ctx.lineWidth = 0.8; ell(0, 0, 51, 68); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    if (waves > 0.01) drawRings(0, 0, 40, 150, waves, 1);
    ctx.restore();
  }
  function drawRings(x, y, r0, r1, a, sp) {
    for (let i = 0; i < 5; i++) {
      const f = ((wavesT * 0.55 * sp + i / 5) % 1);
      const r = r0 + (r1 - r0) * f;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
      ctx.strokeStyle = `rgba(150,190,255,${0.55 * a * (1 - f)})`; ctx.lineWidth = 2.2 * (1 - f) + 0.6; ctx.stroke();
    }
  }
  function drawPhones(a) {
    if (a <= 0.01) return;
    K.view();
    ctx.save(); ctx.globalAlpha = a;
    ctx.save(); ctx.globalAlpha = a * 0.45; ctx.filter = 'blur(12px)'; ctx.fillStyle = '#000';
    ell(-CUPX, CUPY + 14, 74, 92); ctx.fill(); ell(CUPX, CUPY + 14, 74, 92); ctx.fill(); ctx.restore();
    const band = () => { ctx.beginPath(); ctx.moveTo(-CUPX, -66); ctx.bezierCurveTo(-118, -250, 118, -250, CUPX, -66); };
    band(); ctx.strokeStyle = '#121418'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.stroke();
    band(); ctx.strokeStyle = K.lin(0, -230, 0, -60, [[0, '#4b515b'], [1, '#2a2e35']]); ctx.lineWidth = 24; ctx.stroke();
    band(); ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(210,214,220,0.35)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    for (const s of [-1, 1]) {
      ctx.fillStyle = K.steel(s * CUPX - 6, 0, s * CUPX + 6, 0); ctx.fillRect(s * CUPX - 4, -108, 8, 44);
      ctx.beginPath(); ctx.ellipse(s * CUPX, CUPY, 80, 98, 0, Math.PI * 1.12, Math.PI * 1.88); ctx.strokeStyle = K.steel(-80, 0, 80, 0); ctx.lineWidth = 6; ctx.stroke();
    }
    drawCup(-CUPX, CUPY, 0, cur.wavesL);
    drawCup(CUPX, CUPY, cur.open, cur.wavesR);
    K.view(); K.anchor('cupL', -CUPX - 72, CUPY); K.anchor('cupR', CUPX + 72, CUPY); K.anchor('drv', CUPX + 34, CUPY - 10);
    ctx.restore();
  }

  /* ---------- driver, face-on ---------- */
  function drawDriverFront(x, y, a) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a;
    const d = dispNow * 0.012;
    ring(36, 30); ctx.fillStyle = '#16181c'; ctx.fill('evenodd');
    for (let i = 0; i < 8; i++) { const aa = i * TAU / 8 + 0.2; ctx.beginPath(); ctx.arc(33 * Math.cos(aa), 33 * Math.sin(aa), 1.4, 0, TAU); ctx.fillStyle = '#050607'; ctx.fill(); }
    ctx.save(); ctx.scale(1 + d, 1 + d);
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fillStyle = K.rad(-10, -12, 2, 0, 0, 30, [[0, 'rgba(235,238,242,0.55)'], [1, 'rgba(120,128,138,0.35)']]); ctx.fill();
    for (let r = 24; r <= 29.5; r += 1.4) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.5; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.strokeStyle = 'rgba(217,130,74,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fillStyle = K.rad(-3, -3.5, 0.5, 0, 0, 9, [[0, 'rgba(255,255,255,0.85)'], [0.5, 'rgba(190,198,208,0.55)'], [1, 'rgba(110,118,128,0.5)']]); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  /* ---------- exploded stack (tilted) ---------- */
  function drawStack(a) {
    if (a <= 0.01) return;
    const tilt = cur.tilt, sp = 36 * cur.explode, ox = CUPX, oy = CUPY;
    const at = z => { K.view(z); ctx.translate(ox, oy); };
    ctx.save(); ctx.globalAlpha = a;
    // frame
    at(0); side(36, 5, tilt, K.lin(-36, 0, 36, 0, [[0, '#0d0e10'], [0.4, '#2c3036'], [1, '#0a0b0d']]));
    at(5); ring(36, 22); ctx.fillStyle = K.rad(-12, -12, 4, 0, 0, 36, [[0, '#3a3f47'], [1, '#141619']]); ctx.fill('evenodd');
    for (let i = 0; i < 8; i++) { const aa = i * TAU / 8 + 0.2; ctx.beginPath(); ctx.arc(29 * Math.cos(aa), 29 * Math.sin(aa), 1.8, 0, TAU); ctx.fillStyle = '#050607'; ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fillStyle = '#1b1d21'; ctx.fill();
    K.anchor('frameE', 36, 0);
    // magnet assembly
    const zm = sp * 1;
    at(zm); side(17, 7, tilt, K.lin(-17, 0, 17, 0, [[0, '#6c7480'], [0.35, '#e9edf1'], [0.6, '#9aa3ae'], [1, '#55606b']]));
    at(zm + 7); ring(17, 8); ctx.fillStyle = K.rad(-6, -6, 2, 0, 0, 17, [[0, '#f4f6f8'], [1, '#8d96a1']]); ctx.fill('evenodd');
    side(6, -0.01, tilt, '#000');
    at(zm + 7); ctx.translate(0, 0); side(6, 4, tilt, K.lin(-6, 0, 6, 0, [[0, '#5e6670'], [0.4, '#d9dde2'], [1, '#4b535c']]));
    at(zm + 11); ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fillStyle = K.rad(-2, -2, 0.5, 0, 0, 6, [[0, '#ffffff'], [1, '#7f8893']]); ctx.fill();
    K.anchor('magE', 17, 0);
    // voice coil
    const zc = sp * 2 + 4;
    at(zc); side(7.4, 9, tilt, K.lin(-7.4, 0, 7.4, 0, [[0, '#7a3d1a'], [0.35, '#f0a46a'], [0.6, '#c06a35'], [1, '#6a3415']]));
    at(zc); for (let i = 1; i < 9; i++) { ctx.beginPath(); ctx.arc(0, i * Math.tan(tilt) * 1, 7.4, 0.05, Math.PI - 0.05); ctx.strokeStyle = 'rgba(80,30,10,0.35)'; ctx.lineWidth = 0.35; ctx.stroke(); }
    at(zc + 9); ring(7.6, 6.8); ctx.fillStyle = '#e6955c'; ctx.fill('evenodd');
    ctx.beginPath(); ctx.moveTo(6.5, 1); ctx.quadraticCurveTo(16, 4, 24, 0); ctx.moveTo(-6.5, 1); ctx.quadraticCurveTo(-16, 4, -24, 0); ctx.strokeStyle = '#d9824a'; ctx.lineWidth = 0.6; ctx.stroke();
    K.anchor('coilE', 7.6, 2);
    // diaphragm
    const zd = sp * 3 + 8, dd = dispNow * 0.02;
    at(zd); ctx.beginPath(); ctx.arc(0, 0, 31, 0, TAU);
    ctx.fillStyle = K.rad(-10, -12, 2, 0, 0, 31, [[0, 'rgba(240,243,246,0.62)'], [1, 'rgba(150,158,168,0.42)']]); ctx.fill();
    for (let r = 24; r <= 30; r += 1.5) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.45; ctx.stroke(); }
    at(zd + 3 + dd * 30); ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fillStyle = K.rad(-3, -3.5, 0.5, 0, 0, 9, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(140,148,158,0.55)']]); ctx.fill();
    at(zd); K.anchor('diaE', 31, 0); K.anchor('surL', -28, 0);
    ctx.restore();
  }

  /* ---------- cross-section ---------- */
  function diaY(x, d) {
    const u = Math.min(1, Math.abs(x) / 400), w = Math.max(0, 1 - u * u);
    let y = 820 - 20 * w + d * Math.pow(w, 0.6);
    if (Math.abs(x) < 70) y -= 18 * (1 - (x / 70) ** 2);
    if (Math.abs(x) > 368) y -= 11 * Math.sin(Math.PI * (Math.abs(x) - 368) / 32);
    return y;
  }
  function drawSection(a) {
    if (a <= 0.01) return;
    const cx = 540 + 5 * Math.sin(K.rt * 0.4), dy = 4 * Math.sin(K.rt * 0.31);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(cx - 540, dy);
    K.rr(80, 430, 920, 820, 30); ctx.fillStyle = 'rgba(9,13,20,0.94)'; ctx.fill(); ctx.strokeStyle = 'rgba(207,171,110,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    K.txt('CROSS-SECTION · ONE DRIVER', 120 + cx - 540, 474 + dy, '500 20px "IBM Plex Mono"', C.gilt, 'left', a, 3);
    const X = v => 540 + v;
    const mic = cur.mic, d = dispNow;
    // waves
    const wa = cur.waves * (1 - 0.0 * mic);
    if (wa > 0.01) {
      const lam = 70 + 90 / Math.max(0.6, cur.fv);
      for (let i = 0; i < 8; i++) {
        let f = ((wavesT * (mic > 0.5 ? -1 : 1) * Math.max(0.5, cur.fv) * 0.35 + i / 8) % 1 + 1) % 1;
        const y = 790 - f * 300;
        ctx.beginPath(); ctx.moveTo(X(-330), y + 14); ctx.quadraticCurveTo(X(0), y - 26, X(330), y + 14);
        ctx.strokeStyle = `rgba(150,190,255,${0.5 * wa * Math.sin(Math.PI * f)})`; ctx.lineWidth = 3; ctx.stroke();
      }
      if (mic > 0.01) {
        ctx.globalAlpha = a * mic; ctx.strokeStyle = '#9fc0ff'; ctx.lineWidth = 4;
        for (const s of [-160, 160]) { ctx.beginPath(); ctx.moveTo(X(s), 520); ctx.lineTo(X(s), 600); ctx.moveTo(X(s) - 12, 586); ctx.lineTo(X(s), 600); ctx.lineTo(X(s) + 12, 586); ctx.stroke(); }
        K.txt('SOUND IN', X(0) + cx - 540, 560 + dy, '500 22px "IBM Plex Mono"', '#9fc0ff', 'center', a * mic, 3);
        ctx.globalAlpha = a;
      }
    }
    // frame
    ctx.fillStyle = '#23272e';
    for (const s of [-1, 1]) { ctx.fillRect(X(s * 400) - (s > 0 ? 0 : 30), 806, 30, 344); }
    ctx.fillRect(X(-430), 1150, 860, 18);
    // bottom plate, magnet, top plate, pole
    const stl = K.lin(0, 990, 0, 1150, [[0, '#e3e7ec'], [1, '#8a939e']]);
    ctx.fillStyle = stl; ctx.fillRect(X(-240), 1100, 480, 50); ctx.fillRect(X(-55), 990, 110, 110);
    ctx.fillStyle = K.lin(0, 1020, 0, 1100, [[0, '#a9b6c9'], [0.5, '#6f7d93'], [1, '#4b566a']]);
    ctx.fillRect(X(-240), 1020, 145, 80); ctx.fillRect(X(95), 1020, 145, 80);
    ctx.fillStyle = stl; ctx.fillRect(X(-240), 990, 165, 30); ctx.fillRect(X(75), 990, 165, 30);
    // field
    if (cur.field > 0.01) {
      ctx.save(); ctx.globalAlpha = a * cur.field; ctx.strokeStyle = '#8cbcff'; ctx.lineWidth = 3.4; ctx.setLineDash([10, 7]); ctx.lineDashOffset = -K.rt * 34;
      ctx.shadowColor = 'rgba(120,170,255,0.8)'; ctx.shadowBlur = 10;
      for (const s of [-1, 1]) for (let j = 0; j < 4; j++) { const y = 994 + j * 8; ctx.beginPath(); ctx.moveTo(X(s * 77), y); ctx.lineTo(X(s * 53), y); ctx.stroke(); }
      for (const s of [-1, 1]) for (const e of [0, 34]) { ctx.beginPath(); ctx.moveTo(X(s * 240), 1004 - e * 0.3); ctx.bezierCurveTo(X(s * (300 + e)), 1004 - e, X(s * (300 + e)), 1126 + e, X(s * 240), 1126 + e * 0.3); ctx.stroke(); }
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
      if (cur.gapHL > 0.01) { ctx.globalAlpha = a * cur.gapHL; ctx.strokeStyle = C.gilt; ctx.lineWidth = 3; for (const s of [-1, 1]) ctx.strokeRect(X(s > 0 ? 55 : -75), 988, 20, 34); }
      ctx.restore();
    }
    // coil + former
    const lift = 90 * (1 - cur.coilIn), cy0 = 940 + d - lift;
    const ghosts = cur.fv > 5 ? [-1, 1, 0] : [0];
    for (const gk of ghosts) {
      const amp = cur.amp * cur.osc, dd = gk * amp;
      const gy = cy0 + dd, ga = gk === 0 ? 1 : 0.35;
      ctx.save(); ctx.globalAlpha = a * ga * clamp01(cur.coilIn * 1.6);
      ctx.strokeStyle = '#c9ced5'; ctx.lineWidth = 3;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(X(s * 65), gy); ctx.lineTo(X(s * 65), diaY(s * 65, d + dd) + 4); ctx.stroke(); }
      const gl = glow;
      for (const s of [-1, 1]) {
        ctx.fillStyle = K.lin(X(s * 58), 0, X(s * 72), 0, [[0, shade('#b4622f', gl * 0.5)], [0.5, shade('#f2a76d', gl * 0.4)], [1, shade('#8a4520', gl * 0.5)]]);
        ctx.fillRect(X(s > 0 ? 58 : -72), gy, 14, 60);
        if (gl > 0.05) { ctx.shadowColor = `rgba(255,150,70,${0.8 * gl})`; ctx.shadowBlur = 24 * gl; ctx.fillRect(X(s > 0 ? 58 : -72), gy, 14, 60); ctx.shadowBlur = 0; }
        for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(90,40,15,0.35)'; ctx.fillRect(X(s > 0 ? 58 : -72), gy + 4 + k * 10, 14, 2); }
      }
      const cs = Math.sign(cur.hold + (cur.osc > 0.1 ? Math.sin(ph) : 0)) * (cur.sigOn > 0.5 ? 1 : 0);
      if (cs !== 0 && gk === 0) {
        for (const s of [-1, 1]) {
          const x = X(s * 65), y = gy + 30, dot = (cs * s) > 0;
          ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fillStyle = 'rgba(10,12,16,0.85)'; ctx.fill(); ctx.strokeStyle = '#ffd9a8'; ctx.lineWidth = 2; ctx.stroke();
          if (dot) { ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fillStyle = '#ffd9a8'; ctx.fill(); }
          else { ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke(); }
        }
      }
      // diaphragm
      ctx.globalAlpha = a * ga;
      ctx.beginPath();
      for (let x = -400; x <= 400; x += 8) { const y = diaY(x, d + dd); x === -400 ? ctx.moveTo(X(x), y) : ctx.lineTo(X(x), y); }
      ctx.strokeStyle = 'rgba(232,236,242,0.95)'; ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
    }
    // force arrow
    if (cur.arrow > 0.01) {
      const up = cur.hold >= 0, y0 = 700, len = 80 * cur.arrow;
      ctx.save(); ctx.globalAlpha = a * cur.arrow; ctx.strokeStyle = C.gilt; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X(0), y0); ctx.lineTo(X(0), up ? y0 - len : y0 + len);
      const ty = up ? y0 - len : y0 + len, sg = up ? 1 : -1;
      ctx.moveTo(X(0) - 16, ty + 16 * sg); ctx.lineTo(X(0), ty); ctx.lineTo(X(0) + 16, ty + 16 * sg); ctx.stroke(); ctx.restore();
      K.txt(up ? 'PUSH' : 'PULL', X(40) + cx - 540, y0 - (up ? 40 : -50) + dy, '500 26px "IBM Plex Mono"', C.gilt, 'left', a * cur.arrow, 4);
    }
    // signal trace
    if (cur.sigOn > 0.01) {
      const gx = 130, gy = 520, gw = 300;
      ctx.save(); ctx.globalAlpha = a * cur.sigOn;
      ctx.strokeStyle = 'rgba(255,190,120,0.9)'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = i / 60, v = cur.hold * 0.8 + cur.osc * Math.sin(ph - t * 6 * Math.max(1, cur.fv * 0.8));
        const x = X(-410) + t * gw, y = gy + 40 - v * 30;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke(); ctx.restore();
      K.txt(mic > 0.5 ? 'SIGNAL OUT →' : 'SIGNAL', X(-410) + cx - 540, gy + 112 + dy, '500 20px "IBM Plex Mono"', 'rgba(255,200,140,1)', 'left', a * cur.sigOn, 3);
    }
    if (cur.lowL > 0.01) K.txt('20 Hz', X(300) + cx - 540, 560 + dy, '400 64px "Bodoni Moda"', C.fg, 'right', a * cur.lowL);
    if (cur.highL > 0.01) K.txt('20,000 Hz', X(380) + cx - 540, 560 + dy, '400 64px "Bodoni Moda"', C.fg, 'right', a * cur.highL);
    ctx.restore();
    const ox = cx - 540;
    K.anchorScreen('sMagnet', X(-170) + ox, 1060 + dy);
    K.anchorScreen('sGap', X(65) + ox, 1005 + dy);
    K.anchorScreen('sPole', X(-20) + ox, 1060 + dy);
    K.anchorScreen('sCoil', X(-65) + ox, cy0 + 30 + dy);
    K.anchorScreen('sDia', X(-250) + ox, diaY(-250, d) + dy);
    K.anchorScreen('sWaves', X(200) + ox, 640 + dy);
  }

  return {
    seed: 23, cta: ['Now look inside', 'a Rolex'], bridge: '28,800 BEATS AN HOUR', ctaDelay: 3.0,
    state: {open: 0, hp: 1, stack: 0, section: 0, field: 0, gapHL: 0, coilIn: 0, sigOn: 0, glowT: 0, hold: 0, osc: 0, fv: 1.6, amp: 22,
            waves: 0, wavesL: 0, wavesR: 0, arrow: 0, mic: 0, lowL: 0, highL: 0},
    scenes: {
      h_hook: {camDur: 0, cam: {open: 1, zoom: 4.4, fx: CUPX, fy: CUPY, spin: 0.1, wavesR: 1, osc: 1, fv: 2.2, amp: 26},
        events: [{at: 0.05, cam: {zoom: 2.6, spin: -0.06}, dur: 6.5}]},
      h_intro: {title: 'Headphones', spec: 'Over-ear', camDur: 2.4, cam: {open: 0, zoom: 0.7, fx: 0, fy: -40, spin: -0.05, sy: -0.04, wavesR: 0, osc: 0},
        events: [{at: 2.6, cam: {spin: 0.04, zoom: 0.74}, dur: 4}, {mark: 'open', cam: {zoom: 2.3, fx: CUPX, fy: CUPY, spin: 0}, dur: 1.6},
                 {mark: 'open', at: 0.8, cam: {open: 1}, dur: 1.4, sfx: 'lift'}],
        callouts: [{a: 'drv', t: 'The driver', dx: 30, dy: -70, mark: 'open', after: 2.0}]},
      h_stack: {title: 'The Driver', spec: '≈ 40 mm across', camDur: 2.6,
        cam: {hp: 0, stack: 1, tilt: 1.02, explode: 1, zoom: 1.75, fx: CUPX, fy: CUPY, sy: 0.08, spin: 0},
        events: [{mark: 'sur', at: 1.0, cam: {zoom: 1.85, spin: 0.08}, dur: 5}],
        callouts: [{a: 'diaE', t: 'Diaphragm', dx: 26, dy: 0, mark: 'l1'}, {a: 'coilE', t: 'Voice coil', dx: 30, dy: 0, mark: 'l2'},
                   {a: 'magE', t: 'Magnet', dx: 30, dy: 0, mark: 'l3'}, {a: 'frameE', t: 'Frame', dx: 26, dy: 0, mark: 'l4'},
                   {a: 'surL', t: 'Surround', dx: -30, dy: -40, mark: 'sur', after: 0.3}]},
      h_magnet: {title: 'The Magnet', spec: 'Neodymium', camDur: 2.2, cam: {section: 1, coilIn: 0, field: 0.25},
        events: [{at: 1.6, cam: {field: 0.6}, dur: 2}, {mark: 'gap', cam: {field: 1, gapHL: 1}, dur: 0.8}],
        callouts: [{a: 'sMagnet', t: 'Neodymium magnet', dx: -10, dy: 70, line: 0, after: 1.4}, {a: 'sPole', t: 'Pole piece', dx: 40, dy: 80, line: 0, after: 3.4},
                   {a: 'sGap', t: 'Magnetic gap', dx: 60, dy: -110, mark: 'gap', after: 0.3}]},
      h_coil: {title: 'The Voice Coil', spec: 'Fine copper wire', camDur: 1.6, cam: {gapHL: 0},
        events: [{at: 0.4, cam: {coilIn: 1}, dur: 2.2}, {mark: 'sig', cam: {sigOn: 1}, dur: 0.8}, {mark: 'em', at: 0.4, cam: {glowT: 1, hold: 0.25}, dur: 0.8}],
        callouts: [{a: 'sCoil', t: 'Voice coil', dx: -60, dy: -70, line: 0, after: 1.2}, {a: 'sDia', t: 'Diaphragm', dx: -10, dy: -110, line: 0, after: 4.2},
                   {a: 'sCoil', t: 'Electromagnet', dx: -60, dy: 90, mark: 'em', after: 0.8}]},
      h_push: {title: 'Push & Pull', spec: 'Current one way, then the other', camDur: 1.2,
        events: [{mark: 'fwd', cam: {hold: 1, arrow: 1}, dur: 0.5}, {mark: 'back', cam: {hold: -1}, dur: 0.6},
                 {mark: 'shake', cam: {hold: 0, arrow: 0, osc: 1, fv: 1.6, amp: 24}, dur: 0.8}]},
      h_air: {title: 'Making Sound', spec: 'Pressure waves', camDur: 1.2, cam: {waves: 0.5},
        events: [{mark: 'air', cam: {waves: 1}, dur: 1.0}],
        callouts: [{a: 'sWaves', t: 'Pressure waves', dx: 40, dy: -40, mark: 'air', after: 0.6}]},
      h_freq: {title: 'Low to High', spec: '20 Hz to 20,000 Hz', camDur: 1.2,
        events: [{mark: 'low', cam: {fv: 0.8, amp: 34, lowL: 1}, dur: 0.8, sfx: 'bass'}, {mark: 'high', cam: {fv: 9, amp: 5, lowL: 0, highL: 1}, dur: 0.8, sfx: 'treble'},
                 {mark: 'stiff', cam: {fv: 2.4, amp: 16, highL: 0}, dur: 1.0}],
        callouts: [{a: 'sDia', t: 'Light and stiff', dx: -10, dy: -110, mark: 'stiff', after: 0.6}]},
      h_stereo: {title: 'Stereo', spec: 'One driver per ear', camDur: 2.6,
        cam: {section: 0, waves: 0, sigOn: 0, glowT: 0, osc: 1, fv: 1.6, amp: 18, stack: 0, explode: 0, tilt: 0, hp: 1, open: 0, zoom: 0.68, fx: 0, fy: -40, sy: -0.04, spin: 0.03, wavesL: 0.5, wavesR: 0.5},
        events: [{mark: 'left', cam: {wavesL: 1.2, wavesR: 0.15}, dur: 0.8}, {mark: 'mid', cam: {wavesL: 0.9, wavesR: 0.9}, dur: 0.8}],
        callouts: [{a: 'cupL', t: 'Left channel', dx: -10, dy: -170, line: 0, after: 2.4}, {a: 'cupR', t: 'Right channel', dx: 10, dy: -170, line: 0, after: 3.0}]},
      h_mic: {title: 'In Reverse', spec: 'A microphone', camDur: 2.4,
        cam: {section: 1, coilIn: 1, field: 1, wavesL: 0, wavesR: 0, mic: 1, waves: 1, fv: 1.6, amp: 18, glowT: 0.4, sigOn: 0},
        events: [{mark: 'out', cam: {sigOn: 1}, dur: 0.8}],
        callouts: [{a: 'sCoil', t: 'Coil moves in the field', dx: -60, dy: 90, line: 0, after: 4.6}]},
      h_finale: {title: 'Reassembled', spec: 'Fits in your palm', camDur: 2.6,
        cam: {section: 0, mic: 0, waves: 0, sigOn: 0, glowT: 0, field: 0, hp: 1, zoom: 0.68, fx: 0, fy: -40, sy: -0.04, spin: -0.04, wavesL: 0.6, wavesR: 0.6, osc: 1, fv: 1.8, amp: 16},
        events: [{at: 3.0, cam: {spin: 0.05, zoom: 0.74}, dur: 8}]},
      h_cta: {cta: true, quiet: true, camDur: 2.0, cam: {zoom: 0.56, sy: 0.22, fy: -40, spin: 0.02, wavesL: 0.4, wavesR: 0.4}}
    },
    simulate(dt) {
      ph += TAU * cur.fv * dt;
      wavesT += dt;
      dispNow = (cur.hold * 34) * -1 + cur.osc * cur.amp * Math.sin(ph) * -1;
      const g = cur.sigOn * (cur.glowT * 0.6 + 0.4 * Math.min(1, Math.abs(cur.hold) + cur.osc * Math.abs(Math.sin(ph))));
      glow += (g - glow) * Math.min(1, dt * 8);
    },
    render() {
      drawPhones(cur.hp);
      drawStack(cur.stack * (1 - cur.section));
    },
    overlay() { drawSection(cur.section); }
  };
};

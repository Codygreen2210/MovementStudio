/* Watchmaker's Studio — reusable procedural set for movement breakdown videos.
   Usage:
     const set = Studio.create(width, height, {seed: 7});
     // every frame:
     set.draw(ctx, timeSeconds, {x: panPx, y: panPx, s: scale});   // background + props
     ... draw your subject ...
     set.drawLight(ctx, timeSeconds);                                // lamp glow, vignette, dust motes on top
   Works for landscape (16:9) and portrait (9:16); the layout adapts to the aspect ratio.
   Everything is drawn procedurally, so it renders identically every time and has no external assets. */
(function (global) {
  'use strict';
  const TAU = Math.PI * 2;

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }

  function create(W, H, opts = {}) {
    const R = rng(opts.seed || 7);
    const portrait = H > W;
    const OV = 1.14;                         // oversize for parallax
    const BW = Math.round(W * OV), BH = Math.round(H * OV);
    const ox = (BW - W) / 2, oy = (BH - H) / 2;
    const U = Math.min(W, H) / 1080;         // unit scale (1 at 1080p)
    const P = (fx, fy) => [fx * BW, fy * BH];

    /* ---------- far layer: back cabinet + bench grain (heavily blurred) ---------- */
    const far = document.createElement('canvas'); far.width = BW; far.height = BH;
    const f = far.getContext('2d');
    // walnut bench
    const wood = f.createLinearGradient(0, 0, 0, BH);
    wood.addColorStop(0, '#120b07'); wood.addColorStop(0.25, '#2b1a10'); wood.addColorStop(1, '#1c110a');
    f.fillStyle = wood; f.fillRect(0, 0, BW, BH);
    for (let i = 0; i < 520; i++) {
      const y = R() * BH, amp = 2 + R() * 9, len = 0.004 + R() * 0.01, ph = R() * TAU;
      f.strokeStyle = R() < 0.5 ? `rgba(120,78,44,${0.05 + R() * 0.08})` : `rgba(8,4,2,${0.1 + R() * 0.15})`;
      f.lineWidth = (0.6 + R() * 2.2) * U;
      f.beginPath();
      for (let x = -20; x <= BW + 20; x += 24) {
        const yy = y + Math.sin(x * len + ph) * amp + Math.sin(x * len * 3.1 + ph * 2) * amp * 0.3;
        x < 0 ? f.moveTo(x, yy) : f.lineTo(x, yy);
      }
      f.stroke();
    }
    // parts cabinet along the back edge (top band)
    const cabH = BH * (portrait ? 0.13 : 0.2);
    const cab = f.createLinearGradient(0, 0, 0, cabH);
    cab.addColorStop(0, '#1d130c'); cab.addColorStop(1, '#2e1d12');
    f.fillStyle = cab; f.fillRect(0, 0, BW, cabH);
    const cols = portrait ? 6 : 12, rows = 2;
    const dw = BW / cols, dh = cabH / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * dw, y = r * dh;
      const g = f.createLinearGradient(x, y, x, y + dh);
      g.addColorStop(0, '#3b261a'); g.addColorStop(1, '#24170e');
      f.fillStyle = g; f.fillRect(x + 6 * U, y + 6 * U, dw - 12 * U, dh - 12 * U);
      f.fillStyle = '#b48a4e'; f.fillRect(x + dw / 2 - 26 * U, y + dh * 0.28, 52 * U, 16 * U);
      f.fillStyle = '#e8dcc0'; f.fillRect(x + dw / 2 - 22 * U, y + dh * 0.28 + 3 * U, 44 * U, 10 * U);
      f.fillStyle = '#c9a160'; f.beginPath(); f.arc(x + dw / 2, y + dh * 0.68, 7 * U, 0, TAU); f.fill();
    }
    f.fillStyle = 'rgba(0,0,0,0.55)'; f.fillRect(0, cabH - 4 * U, BW, 14 * U);
    const farB = document.createElement('canvas'); farB.width = BW; farB.height = BH;
    const fb = farB.getContext('2d'); fb.filter = `blur(${Math.round(9 * U)}px)`; fb.drawImage(far, 0, 0);
    fb.filter = 'none';
    // keep bench grain a little sharper below the cabinet
    fb.save(); fb.globalAlpha = 0.5; fb.filter = `blur(${Math.round(2 * U)}px)`;
    fb.drawImage(far, 0, cabH, BW, BH - cabH, 0, cabH, BW, BH - cabH); fb.restore();

    /* ---------- mid layer: leather mat + tools ---------- */
    const mid = document.createElement('canvas'); mid.width = BW; mid.height = BH;
    const m = mid.getContext('2d');
    const mat = portrait ? {x: 0.1, y: 0.19, w: 0.8, h: 0.64} : {x: 0.22, y: 0.27, w: 0.56, h: 0.78};
    const mx = mat.x * BW, my = mat.y * BH, mw = mat.w * BW, mh = mat.h * BH, mr = 34 * U;
    const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    m.save(); m.shadowColor = 'rgba(0,0,0,0.7)'; m.shadowBlur = 40 * U; m.shadowOffsetY = 12 * U;
    rr(m, mx, my, mw, mh, mr); m.fillStyle = '#16302c'; m.fill(); m.restore();
    m.save(); rr(m, mx, my, mw, mh, mr); m.clip();
    const lg = m.createRadialGradient(mx + mw * 0.45, my + mh * 0.3, 20, mx + mw / 2, my + mh / 2, Math.max(mw, mh) * 0.75);
    lg.addColorStop(0, '#244a43'); lg.addColorStop(1, '#0f2421');
    m.fillStyle = lg; m.fillRect(mx, my, mw, mh);
    for (let i = 0; i < 9000; i++) {
      m.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.05)';
      m.fillRect(mx + R() * mw, my + R() * mh, (1 + R() * 2) * U, (1 + R() * 2) * U);
    }
    m.restore();
    m.save(); m.setLineDash([10 * U, 8 * U]); m.strokeStyle = 'rgba(207,171,110,0.45)'; m.lineWidth = 2 * U;
    rr(m, mx + 16 * U, my + 16 * U, mw - 32 * U, mh - 32 * U, mr * 0.6); m.stroke(); m.restore();

    const props = document.createElement('canvas'); props.width = BW; props.height = BH;
    const p = props.getContext('2d');
    const steel = (c, x0, y0, x1, y1) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#eef1f4'); g.addColorStop(0.5, '#8a939e'); g.addColorStop(1, '#d4d9df'); return g; };
    const brass = (c, x0, y0, x1, y1) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#f0d9a6'); g.addColorStop(0.5, '#a5813f'); g.addColorStop(1, '#e2c07f'); return g; };
    const shadow = (c, on) => { if (on) { c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 18 * U; c.shadowOffsetX = 8 * U; c.shadowOffsetY = 12 * U; } else { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; } };

    function screwdriverStand(cx, cy, r) {
      shadow(p, true); p.fillStyle = brass(p, cx - r, cy - r, cx + r, cy + r); p.beginPath(); p.arc(cx, cy, r, 0, TAU); p.fill(); shadow(p, false);
      p.strokeStyle = 'rgba(60,40,10,0.6)'; p.lineWidth = 2 * U; p.stroke();
      p.fillStyle = '#2a1d10'; p.beginPath(); p.arc(cx, cy, r * 0.3, 0, TAU); p.fill();
      const caps = ['#c0392b', '#2e6fb5', '#2f8f5b', '#d9a92b', '#222', '#e6e6e6', '#7b3fb5', '#d26a1f'];
      caps.forEach((col, i) => {
        const a = i * TAU / caps.length - 0.4, x = cx + Math.cos(a) * r * 0.66, y = cy + Math.sin(a) * r * 0.66, cr = r * 0.17;
        shadow(p, true); p.fillStyle = steel(p, x - cr, y - cr, x + cr, y + cr); p.beginPath(); p.arc(x, y, cr, 0, TAU); p.fill(); shadow(p, false);
        p.fillStyle = col; p.beginPath(); p.arc(x, y, cr * 0.62, 0, TAU); p.fill();
        p.strokeStyle = 'rgba(0,0,0,0.35)'; p.lineWidth = 1 * U;
        for (let k = 0; k < 24; k++) { const b = k * TAU / 24; p.beginPath(); p.moveTo(x + Math.cos(b) * cr * 0.8, y + Math.sin(b) * cr * 0.8); p.lineTo(x + Math.cos(b) * cr, y + Math.sin(b) * cr); p.stroke(); }
      });
    }
    function tweezers(x0, y0, x1, y1, w) {
      const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
      p.save(); p.translate(x0, y0); p.rotate(a); shadow(p, true);
      [-1, 1].forEach(sg => {
        p.fillStyle = steel(p, 0, -w, L, w);
        p.beginPath(); p.moveTo(0, sg * w * 0.9); p.lineTo(L * 0.82, sg * w * 0.55); p.lineTo(L, sg * w * 0.06); p.lineTo(L, 0); p.lineTo(0, 0); p.closePath(); p.fill();
      });
      shadow(p, false);
      p.strokeStyle = 'rgba(30,36,44,0.6)'; p.lineWidth = 1.2 * U; p.beginPath(); p.moveTo(0, 0); p.lineTo(L, 0); p.stroke();
      p.restore();
    }
    function loupe(cx, cy, r) {
      shadow(p, true); p.fillStyle = '#121214'; p.beginPath(); p.arc(cx, cy, r, 0, TAU); p.fill(); shadow(p, false);
      p.strokeStyle = '#2a2a2e'; p.lineWidth = 6 * U; p.beginPath(); p.arc(cx, cy, r * 0.86, 0, TAU); p.stroke();
      const g = p.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 4, cx, cy, r * 0.7);
      g.addColorStop(0, 'rgba(210,235,255,0.75)'); g.addColorStop(0.35, 'rgba(70,110,140,0.5)'); g.addColorStop(1, 'rgba(10,20,30,0.9)');
      p.fillStyle = g; p.beginPath(); p.arc(cx, cy, r * 0.7, 0, TAU); p.fill();
    }
    function oilCups(cx, cy, r) {
      shadow(p, true); p.fillStyle = brass(p, cx - r, cy - r, cx + r, cy + r); p.beginPath(); p.arc(cx, cy, r, 0, TAU); p.fill(); shadow(p, false);
      for (let i = 0; i < 4; i++) {
        const a = i * TAU / 4 + 0.6, x = cx + Math.cos(a) * r * 0.52, y = cy + Math.sin(a) * r * 0.52, cr = r * 0.28;
        p.fillStyle = 'rgba(220,235,245,0.85)'; p.beginPath(); p.arc(x, y, cr, 0, TAU); p.fill();
        const g = p.createRadialGradient(x - cr * 0.3, y - cr * 0.3, 1, x, y, cr * 0.75);
        g.addColorStop(0, '#ffe2a0'); g.addColorStop(1, '#a86a12');
        p.fillStyle = g; p.beginPath(); p.arc(x, y, cr * 0.7, 0, TAU); p.fill();
      }
    }
    function partsTray(x, y, w, h) {
      shadow(p, true); rr(p, x, y, w, h, 14 * U); p.fillStyle = '#d9dde2'; p.fill(); shadow(p, false);
      const cx = 4, cy = 3, cw = w / cx, ch = h / cy;
      for (let i = 0; i < cx; i++) for (let j = 0; j < cy; j++) {
        const X = x + i * cw + 8 * U, Y = y + j * ch + 8 * U, Wc = cw - 16 * U, Hc = ch - 16 * U;
        const g = p.createLinearGradient(X, Y, X, Y + Hc); g.addColorStop(0, '#9ea6af'); g.addColorStop(1, '#c9ced4');
        rr(p, X, Y, Wc, Hc, 8 * U); p.fillStyle = g; p.fill();
        const n = 3 + Math.floor(R() * 5);
        for (let k = 0; k < n; k++) {
          const px = X + 10 * U + R() * (Wc - 20 * U), py = Y + 10 * U + R() * (Hc - 20 * U);
          if ((i + j) % 3 === 0) { // tiny gears
            const gr = 6 * U + R() * 7 * U; p.fillStyle = brass(p, px - gr, py - gr, px + gr, py + gr);
            p.beginPath(); for (let t = 0; t < 28; t++) { const a = t * TAU / 28, rad = t % 2 ? gr : gr * 0.85; p.lineTo(px + Math.cos(a) * rad, py + Math.sin(a) * rad); } p.closePath(); p.fill();
            p.fillStyle = '#6c737b'; p.beginPath(); p.arc(px, py, gr * 0.25, 0, TAU); p.fill();
          } else { // screws
            p.fillStyle = (i + j) % 2 ? '#3f6fb8' : '#5b636c'; p.beginPath(); p.arc(px, py, 2.6 * U, 0, TAU); p.fill();
          }
        }
      }
    }
    function rodico(cx, cy, r) {
      shadow(p, true); p.fillStyle = '#2aa59b'; p.beginPath();
      for (let i = 0; i < 40; i++) { const a = i * TAU / 40, rad = r * (0.88 + 0.09 * Math.sin(i * 0.9) + 0.05 * Math.sin(i * 2.1)); p.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.8); }
      p.closePath(); p.fill(); shadow(p, false);
      p.fillStyle = 'rgba(255,255,255,0.22)'; p.beginPath(); p.ellipse(cx - r * 0.25, cy - r * 0.25, r * 0.35, r * 0.2, -0.4, 0, TAU); p.fill();
    }
    function pegwood(x0, y0, x1, y1) {
      shadow(p, true); p.strokeStyle = '#cfae7c'; p.lineCap = 'round'; p.lineWidth = 9 * U;
      p.beginPath(); p.moveTo(x0, y0); p.lineTo(x1, y1); p.stroke(); shadow(p, false);
      p.strokeStyle = 'rgba(255,240,210,0.35)'; p.lineWidth = 2 * U; p.beginPath(); p.moveTo(x0, y0 - 2 * U); p.lineTo(x1, y1 - 2 * U); p.stroke();
    }
    function caseKnife(x, y, a, L) {
      p.save(); p.translate(x, y); p.rotate(a); shadow(p, true);
      p.fillStyle = '#3a2516'; rr(p, 0, -14 * U, L * 0.6, 28 * U, 12 * U); p.fill();
      p.fillStyle = steel(p, L * 0.6, -10 * U, L, 10 * U); p.beginPath(); p.moveTo(L * 0.6, -9 * U); p.lineTo(L, -2 * U); p.lineTo(L, 4 * U); p.lineTo(L * 0.6, 9 * U); p.closePath(); p.fill();
      shadow(p, false); p.restore();
    }
    if (!portrait) {
      screwdriverStand(...P(0.115, 0.6), 140 * U);
      tweezers(...P(0.1, 0.95), ...P(0.3, 0.8), 11 * U);
      tweezers(...P(0.74, 0.97), ...P(0.86, 0.86), 9 * U);
      pegwood(...P(0.08, 0.86), ...P(0.2, 0.78));
      rodico(...P(0.17, 0.33), 40 * U);
      loupe(...P(0.87, 0.36), 88 * U);
      oilCups(...P(0.9, 0.6), 70 * U);
      partsTray(...P(0.79, 0.74), 280 * U, 190 * U);
      caseKnife(...P(0.66, 0.255), 0.12, 240 * U);
    } else {
      loupe(...P(0.84, 0.15), 70 * U);
      rodico(...P(0.2, 0.14), 38 * U);
      screwdriverStand(...P(0.17, 0.9), 120 * U);
      tweezers(...P(0.36, 0.97), ...P(0.62, 0.88), 10 * U);
      oilCups(...P(0.86, 0.75), 62 * U);
      partsTray(...P(0.6, 0.865), 250 * U, 150 * U);
      pegwood(...P(0.12, 0.17), ...P(0.34, 0.11));
    }
    const midB = document.createElement('canvas'); midB.width = BW; midB.height = BH;
    const mb = midB.getContext('2d');
    mb.drawImage(mid, 0, 0);
    mb.filter = `blur(${Math.max(1, Math.round(2.4 * U))}px)`; mb.drawImage(props, 0, 0); mb.filter = 'none';

    /* ---------- dust motes ---------- */
    const motes = Array.from({length: portrait ? 90 : 110}, () => ({
      x: R() * W, y: R() * H, r: (0.8 + R() * 2.6) * U, sp: 6 + R() * 16, ph: R() * TAU, wob: 8 + R() * 22, a: 0.25 + R() * 0.6
    }));
    const lamp = portrait ? {x: 0.3, y: 0.05} : {x: 0.32, y: 0.0};

    function draw(ctx, t, par = {x: 0, y: 0, s: 1}) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const s = par.s || 1;
      ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
      ctx.drawImage(farB, -ox + par.x * 0.5, -oy + par.y * 0.5);
      ctx.drawImage(midB, -ox + par.x, -oy + par.y);
      ctx.restore();
    }
    function drawLight(ctx, t) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const lx = W * (lamp.x + 0.015 * Math.sin(t * 0.21)), ly = H * lamp.y;
      ctx.globalCompositeOperation = 'soft-light';
      const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, Math.max(W, H) * 0.95);
      g.addColorStop(0, 'rgba(255,214,150,0.75)'); g.addColorStop(0.5, 'rgba(255,190,120,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen';
      const h = ctx.createRadialGradient(W * 0.5, H * 0.5, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.55);
      h.addColorStop(0, 'rgba(255,200,140,0.10)'); h.addColorStop(1, 'rgba(255,200,140,0)');
      ctx.fillStyle = h; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      const v = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.78);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.62)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      motes.forEach(mo => {
        const x = (mo.x + Math.sin(t * 0.3 + mo.ph) * mo.wob + t * mo.sp * 0.35) % (W + 40) - 20;
        const y = (mo.y - t * mo.sp * 0.6 + Math.cos(t * 0.23 + mo.ph) * mo.wob + H * 10) % (H + 40) - 20;
        const d = Math.hypot((x - lx) / W, (y - ly) / H);
        const a = mo.a * Math.max(0, 1 - d * 1.15) * (0.6 + 0.4 * Math.sin(t * 1.3 + mo.ph));
        if (a <= 0.01) return;
        const gg = ctx.createRadialGradient(x, y, 0, x, y, mo.r * 2.4);
        gg.addColorStop(0, `rgba(255,232,190,${a})`); gg.addColorStop(1, 'rgba(255,232,190,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, y, mo.r * 2.4, 0, TAU); ctx.fill();
      });
      ctx.restore();
    }
    return {draw, drawLight, layers: {far: farB, mid: midB}, W, H, mat: {x: mat.x, y: mat.y, w: mat.w, h: mat.h}};
  }
  global.Studio = {create};
})(typeof window !== 'undefined' ? window : this);

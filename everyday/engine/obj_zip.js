/* Everyday Machines — the zip. Local units ≈ 0.25 mm; zip runs vertically along x = 0, y grows downward. */
window.OBJECT = K => {
  const {ctx, TAU, cur, clamp01, ease, smooth, lerp, shade, C} = K;
  const PITCH = 10, Y0 = -320, Y1 = 320, TOPSTOP = -326, BOTTOM = 318;
  const JACKET = '#3d4a3b', TAPE = '#1b2231';
  let lastN = null, flashT = -9, twill = null, weave = null, lastS = 0;

  function makePatterns() {
    const a = document.createElement('canvas'); a.width = a.height = 24; const g = a.getContext('2d');
    g.fillStyle = JACKET; g.fillRect(0, 0, 24, 24); g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 2;
    for (let i = -24; i < 48; i += 6) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 24, 24); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,0.12)'; for (let i = -21; i < 48; i += 6) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 24, 24); g.stroke(); }
    twill = ctx.createPattern(a, 'repeat');
    const b = document.createElement('canvas'); b.width = b.height = 8; const h = b.getContext('2d');
    h.fillStyle = TAPE; h.fillRect(0, 0, 8, 8); h.fillStyle = 'rgba(255,255,255,0.07)'; h.fillRect(0, 0, 8, 1); h.fillRect(0, 4, 8, 1); h.fillStyle = 'rgba(0,0,0,0.2)'; h.fillRect(0, 2, 1, 8); h.fillRect(4, 2, 1, 8);
    weave = ctx.createPattern(b, 'repeat');
  }

  /* ---------- geometry ---------- */
  function sep(y) {
    const s = cur.sY;
    let v;
    if (y > s + 30) v = 0;
    else if (y < s - 35) v = Math.min(52, 8 + (s - 35 - y) * 0.34);
    else v = 8 * clamp01((s + 30 - y) / 65);
    return v + 30 * cur.spread;
  }
  function sideOff(s, y) {
    let dx = s * sep(y);
    if (s < 0 && y > BOTTOM - 220) dx -= 70 * cur.boxSep * smooth((y - (BOTTOM - 220)) / 120);
    if (s < 0 && cur.boxSep > 0 && y > cur.sY - 40) dx -= 70 * cur.boxSep * 0;
    const tug = cur.tug * (1.6 + 0.6 * Math.sin(K.rt * 23 + y * 0.3));
    if (y > cur.sY + 30) dx += s * tug;
    return dx;
  }

  /* ---------- drawing ---------- */
  function tooth(gold, hl) {
    ctx.beginPath(); ctx.moveTo(-17, -3.0); ctx.lineTo(-7, -3.0); ctx.lineTo(-7, -2.4); ctx.lineTo(1.6, -2.4); ctx.quadraticCurveTo(5, -2.4, 5, 0); ctx.quadraticCurveTo(5, 2.4, 1.6, 2.4); ctx.lineTo(-7, 2.4); ctx.lineTo(-7, 3.0); ctx.lineTo(-17, 3.0); ctx.closePath();
    ctx.fillStyle = gold; ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,10,0.55)'; ctx.lineWidth = 0.35; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.5, 0, 2.2, 1.3, 0, 0, TAU); ctx.fillStyle = 'rgba(255,240,200,0.55)'; ctx.fill();
    if (hl) { ctx.strokeStyle = C.gilt; ctx.lineWidth = 1.2; ctx.stroke(); }
  }
  function drawRows(alpha) {
    const gold = K.lin(0, -3, 0, 3, [[0, '#f2d79c'], [0.4, '#b98d46'], [1, '#7d5c2a']]);
    for (const s of [-1, 1]) {
      // jacket panel and tape follow the teeth
      if (cur.jacket > 0.01) {
        ctx.save(); ctx.globalAlpha = alpha * cur.jacket;
        ctx.beginPath(); ctx.moveTo(s * 70 + sideOff(s, Y0 - 20), Y0 - 30);
        for (let y = Y0 - 20; y <= Y1 + 20; y += 10) ctx.lineTo(s * 60 + sideOff(s, y), y);
        ctx.lineTo(s * 172, Y1 + 30); ctx.lineTo(s * 172, Y0 - 30); ctx.closePath();
        ctx.fillStyle = twill; ctx.fill();
        ctx.setLineDash([4, 3]); ctx.strokeStyle = 'rgba(220,214,190,0.4)'; ctx.lineWidth = 0.9;
        ctx.beginPath(); for (let y = Y0 - 20; y <= Y1 + 20; y += 10) ctx.lineTo(s * 66 + sideOff(s, y), y); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let y = Y0 - 10; y <= Y1 + 10; y += 6) ctx.lineTo(s * 14 + sideOff(s, y), y);
      for (let y = Y1 + 10; y >= Y0 - 10; y -= 6) ctx.lineTo(s * 62 + sideOff(s, y), y);
      ctx.closePath(); ctx.fillStyle = weave; ctx.fill();
      ctx.beginPath(); for (let y = Y0 - 10; y <= Y1 + 10; y += 6) ctx.lineTo(s * 14 + sideOff(s, y), y);
      ctx.strokeStyle = '#0c1018'; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    }
    const fy = cur.stagY;
    for (const s of [-1, 1]) {
      for (let j = 0; ; j++) {
        const y = Y0 + j * PITCH + (s > 0 ? PITCH / 2 : 0);
        if (y > Y1) break;
        const dx = sideOff(s, y), ang = s * Math.min(0.35, sep(y) * 0.006);
        ctx.save(); ctx.globalAlpha = alpha; ctx.translate(dx, y); ctx.scale(-s, 1); ctx.rotate(-ang * s);
        const hl = cur.stagHL > 0.5 && s < 0 && Math.abs(y - fy) < PITCH / 2;
        tooth(gold, hl);
        ctx.restore();
        if (cur.stagHL > 0.01 && s > 0 && Math.abs(y - PITCH / 2 - fy) < PITCH / 2) {
          ctx.save(); ctx.globalAlpha = alpha * cur.stagHL; ctx.strokeStyle = C.gilt; ctx.lineWidth = 1.1; ctx.setLineDash([2, 1.5]);
          ctx.strokeRect(dx - 8, y - PITCH + 2.4, 14, PITCH - 4.8); ctx.setLineDash([]);
          ctx.beginPath(); ctx.moveTo(sideOff(-1, fy) + 5, fy); ctx.lineTo(dx - 8, y - PITCH / 2); ctx.stroke(); ctx.restore();
          K.anchor('gapR', dx, y - PITCH / 2);
        }
      }
    }
    // stops
    ctx.save(); ctx.globalAlpha = alpha;
    for (const s of [-1, 1]) { const dx = sideOff(s, TOPSTOP); ctx.fillStyle = K.steel(0, -3, 0, 3); ctx.fillRect(dx + (s < 0 ? -24 : 8), TOPSTOP - 3, 16, 6); }
    const bl = sideOff(-1, BOTTOM);
    ctx.fillStyle = K.steel(0, BOTTOM - 10, 0, BOTTOM + 14);
    ctx.fillRect(bl - 26, BOTTOM - 8, 22, 26);
    K.rr(4, BOTTOM - 10, 26, 30, 3); ctx.fill();
    ctx.restore();
    K.anchor('stopTop', sideOff(1, TOPSTOP) + 24, TOPSTOP); K.anchor('box', 30, BOTTOM + 4); K.anchor('pin', bl - 26, BOTTOM + 4);
    K.anchor('tapeE', 62 + sideOff(1, cur.sY + 80), cur.sY + 80); K.anchor('teethE', sideOff(1, cur.sY + 60) + 6, cur.sY + 60);
    K.anchor('cord', 14 + sideOff(1, cur.sY + 110), cur.sY + 110); K.anchor('stagL', sideOff(-1, fy) - 10, fy);
    K.anchor('closed', 6, cur.sY + 140);
  }
  function sliderBody(a, xr) {
    const s = cur.sY;
    ctx.save(); ctx.globalAlpha = a * (1 - 0.72 * xr);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    ctx.beginPath(); ctx.moveTo(-27, s - 35); ctx.lineTo(27, s - 35); ctx.quadraticCurveTo(29, s - 35, 28, s - 30); ctx.lineTo(18, s + 33); ctx.quadraticCurveTo(17, s + 36, 14, s + 36);
    ctx.lineTo(-14, s + 36); ctx.quadraticCurveTo(-17, s + 36, -18, s + 33); ctx.lineTo(-28, s - 30); ctx.quadraticCurveTo(-29, s - 35, -27, s - 35); ctx.closePath();
    ctx.fillStyle = K.lin(-28, 0, 28, 0, [[0, '#6f7782'], [0.3, '#e9edf1'], [0.55, '#a7b0ba'], [1, '#5d6570']]); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a * (1 - 0.72 * xr);
    ctx.fillStyle = K.lin(0, s - 20, 0, s + 6, [[0, '#d9dde2'], [1, '#8b939d']]); K.rr(-7, s - 22, 14, 26, 5); ctx.fill();
    ctx.restore();
    if (xr > 0.01) {
      ctx.save(); ctx.globalAlpha = a * xr;
      const hl = cur.chanHL;
      ctx.strokeStyle = hl > 0.5 ? C.gilt : 'rgba(200,215,240,0.85)'; ctx.lineWidth = 1.4 + hl;
      for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sg * 25, s - 35); ctx.lineTo(sg * 14, s + 4); ctx.lineTo(sg * 14, s + 36); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, s - 35); ctx.lineTo(-8, s - 20); ctx.lineTo(0, s - 4); ctx.lineTo(8, s - 20); ctx.closePath();
      ctx.fillStyle = cur.wedgeHL > 0.5 ? 'rgba(207,171,110,0.9)' : 'rgba(170,180,195,0.75)'; ctx.fill();
      ctx.strokeStyle = cur.wedgeHL > 0.5 ? C.gilt : 'rgba(220,230,245,0.9)'; ctx.lineWidth = 1; ctx.stroke();
      const fa = cur.flashOn * clamp01(1 - (K.T - flashT) / 0.22);
      if (fa > 0.01) { ctx.globalAlpha = a * fa; ctx.fillStyle = K.rad(0, s + 26, 0, 0, s + 26, 12, [[0, 'rgba(255,225,150,0.95)'], [1, 'rgba(255,225,150,0)']]); ctx.beginPath(); ctx.arc(0, s + 26, 12, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    K.anchor('chan', 19, s - 12); K.anchor('wedge', 0, s - 20); K.anchor('lockPt', 0, s + 26); K.anchor('bodyE', 28, s - 10);
  }
  function tab(a) {
    const s = cur.sY, fl = cur.tabFlat;
    const len = lerp(34, 76, fl);
    ctx.save(); ctx.globalAlpha = a;
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10 + 8 * fl; ctx.shadowOffsetY = 4 + 6 * (1 - fl);
    ctx.beginPath(); ctx.moveTo(-6, s - 14); ctx.lineTo(6, s - 14); ctx.lineTo(11, s - 14 + len * 0.3); ctx.lineTo(11, s - 14 + len); ctx.quadraticCurveTo(11, s - 8 + len, 0, s - 8 + len); ctx.quadraticCurveTo(-11, s - 8 + len, -11, s - 14 + len); ctx.lineTo(-11, s - 14 + len * 0.3); ctx.closePath();
    ctx.fillStyle = K.lin(-11, 0, 11, 0, [[0, '#7a838e'], [0.35, '#f1f3f6'], [0.6, '#aab3bd'], [1, '#626b76']]); ctx.fill();
    ctx.shadowColor = 'transparent';
    K.rr(-4, s - 14 + len * 0.62, 8, len * 0.24, 3.5); ctx.fillStyle = 'rgba(20,24,30,0.85)'; ctx.fill();
    ctx.restore();
    if (cur.pinShow > 0.01) {
      ctx.save(); ctx.globalAlpha = a * cur.pinShow; ctx.fillStyle = C.gilt;
      ctx.beginPath(); ctx.arc(0, s + 2, 2.4 + 1.2 * cur.pinShow, 0, TAU); ctx.fill(); ctx.restore();
    }
    K.anchor('tabE', 11, s - 14 + len * 0.7); K.anchor('lockPin', 0, s + 2);
  }
  function drawZip() {
    const ex = cur.explode;
    K.view(0); drawRows(1);
    K.view(60 * ex); sliderBody(1, cur.xray);
    K.view(120 * ex); tab(1 - 0.72 * cur.xray);
  }

  /* ---------- big single tooth ---------- */
  function drawMacro(a) {
    const cx = 540, cy = 830, S = 13;
    ctx.save(); ctx.globalAlpha = a;
    K.rr(110, 450, 860, 760, 30); ctx.fillStyle = 'rgba(9,13,20,0.93)'; ctx.fill(); ctx.strokeStyle = 'rgba(207,171,110,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    K.txt('ONE TOOTH · MAGNIFIED', 150, 494, '500 20px "IBM Plex Mono"', C.gilt, 'left', a, 3);
    const fl = cur.flip, c = Math.cos(Math.PI * fl), under = fl > 0.5;
    const wob = 0.12 * Math.sin(K.rt * 0.9);
    ctx.translate(cx, cy); ctx.rotate(wob); ctx.scale(S, S * Math.max(0.06, Math.abs(c)));
    const th = 3.2 * Math.sin(Math.PI * fl) + 1.2;
    const shape = () => { ctx.beginPath(); ctx.moveTo(-23, -6); ctx.lineTo(-6, -6); ctx.lineTo(-6, -4.6); ctx.lineTo(9, -4.6); ctx.quadraticCurveTo(16, -4.6, 16, 0); ctx.quadraticCurveTo(16, 4.6, 9, 4.6); ctx.lineTo(-6, 4.6); ctx.lineTo(-6, 6); ctx.lineTo(-23, 6); ctx.closePath(); };
    ctx.save(); ctx.translate(0, th / Math.max(0.06, Math.abs(c)) * 0.5); shape(); ctx.fillStyle = '#5c4320'; ctx.fill(); ctx.restore();
    shape(); ctx.fillStyle = K.lin(0, -6, 0, 6, under ? [[0, '#8a6a35'], [1, '#c79e58']] : [[0, '#f4dba2'], [0.45, '#c39a54'], [1, '#86642f']]); ctx.fill();
    ctx.strokeStyle = 'rgba(50,34,10,0.6)'; ctx.lineWidth = 0.15; ctx.stroke();
    if (!under) {
      ctx.beginPath(); ctx.ellipse(7, 0, 4.2, 2.6, 0, 0, TAU);
      ctx.fillStyle = K.rad(5.6, -1, 0.2, 7, 0, 4.2, [[0, '#fff3cf'], [1, '#b78e47']]); ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,12,0.7)'; ctx.lineWidth = 0.18; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(7, 0, 4.2, 2.6, 0, 0, TAU);
      ctx.fillStyle = K.rad(8, 1, 0.2, 7, 0, 4.2, [[0, '#1b1407'], [0.7, '#3c2c12'], [1, '#7a5b2b']]); ctx.fill();
    }
    ctx.fillStyle = 'rgba(20,24,30,0.55)'; ctx.fillRect(-23, -1.2, 17, 2.4);
    ctx.restore();
    K.anchorScreen('tBump', cx + 7 * S, cy);
    K.anchorScreen('tBody', cx - 16 * S, cy);
  }

  function zipTo(y, dur, sfx) { return {cam: {sY: y, fy: y}, dur, sfx}; }

  return {
    seed: 31, cta: ['Now look inside', 'a Rolex'], bridge: '28,800 BEATS AN HOUR', ctaDelay: 3.5,
    state: {sY: 250, xray: 0, spread: 0, jacket: 1, tug: 0, boxSep: 0, tabFlat: 1, pinShow: 0, chanHL: 0, wedgeHL: 0, flashOn: 0,
            macro: 0, flip: 0, stagHL: 0, stagY: 0, card1: 0, card2: 0, card3: 0},
    scenes: {
      z_hook: {camDur: 0, cam: {zoom: 2.3, fx: 0, fy: 250, sY: 250, spin: 0.06, sy: -0.06},
        events: [{at: 0.05, ...zipTo(-250, 1.0, 'zip')}, {at: 1.2, cam: {zoom: 0.82, fy: 0, spin: 0.02, sy: -0.02}, dur: 3.2}]},
      z_intro: {title: 'The Zip', spec: 'Two tapes, two rows, one slider', camDur: 2.2, cam: {zoom: 0.8, fx: 0, fy: 0, spin: -0.03},
        events: [{at: 1.6, ...zipTo(40, 2.6, 'zipslow')}, {at: 1.6, cam: {fy: 0}, dur: 2.6},
                 {mark: 'xray', cam: {zoom: 2.5, fy: 40, spin: 0}, dur: 1.6}, {mark: 'xray', at: 0.9, cam: {xray: 1}, dur: 1.2}],
        callouts: [{a: 'chan', t: 'Inside the slider', dx: 40, dy: -60, mark: 'xray', after: 2.2}]},
      z_stack: {title: 'Taken Apart', spec: 'Five kinds of part', camDur: 2.6,
        cam: {xray: 0, explode: 1, tilt: 0.95, zoom: 0.72, fy: 0, sY: 0, spin: 0, jacket: 0, spread: 0.6, sy: -0.03},
        events: [{mark: 'cord', cam: {zoom: 1.6, fy: 110, spread: 0.6}, dur: 1.6}],
        callouts: [{a: 'tabE', t: 'Pull tab', dx: 40, dy: -30, mark: 'l1'}, {a: 'bodyE', t: 'Slider body', dx: 40, dy: -20, mark: 'l2'},
                   {a: 'teethE', t: 'Teeth', dx: 50, dy: 30, mark: 'l3', until: 'cord'}, {a: 'tapeE', t: 'Fabric tape', dx: 40, dy: 40, mark: 'l4', until: 'cord'},
                   {a: 'stopTop', t: 'Top stop', dx: 40, dy: 10, mark: 'l5', until: 'cord'}, {a: 'box', t: 'Bottom stop', dx: 40, dy: -10, mark: 'l5', after: 0.3, until: 'cord'},
                   {a: 'cord', t: 'Corded edge', dx: 40, dy: 20, mark: 'cord', after: 1.4}]},
      z_teeth: {title: 'One Tooth', spec: 'A bump and a hollow', camDur: 2.4,
        cam: {explode: 0, tilt: 0, spread: 0, jacket: 1, zoom: 1.6, fy: 40, sY: 120, macro: 1, flip: 0},
        events: [{mark: 'hollow', cam: {flip: 1}, dur: 1.4, sfx: 'lift'}, {mark: 'stag', cam: {macro: 0, zoom: 2.9, fy: 10, stagY: 10, stagHL: 1}, dur: 1.4}],
        callouts: [{a: 'tBump', t: 'Bump', dx: 40, dy: -80, mark: 'bump', after: 0.3, until: 'hollow'}, {a: 'tBump', t: 'Hollow', dx: 40, dy: -80, mark: 'hollow', after: 1.2, until: 'stag'},
                   {a: 'stagL', t: 'Faces a gap', dx: -40, dy: -70, mark: 'stag', after: 1.6}]},
      z_slider: {title: 'The Y Channel', spec: 'Guide, then squeeze', camDur: 2.0,
        cam: {stagHL: 0, zoom: 3.1, fy: 120, sY: 120, xray: 1, tabFlat: 0.25},
        events: [{mark: 'y', cam: {chanHL: 1}, dur: 0.6}, {mark: 'up', ...zipTo(40, 7.5, 'zipslow')}, {mark: 'lock', cam: {flashOn: 1}, dur: 0.4}],
        callouts: [{a: 'chan', t: 'Y-shaped channel', dx: 40, dy: -70, mark: 'y', after: 0.5}, {a: 'lockPt', t: 'Locked', dx: 40, dy: 60, mark: 'lock', after: 0.6}]},
      z_unzip: {title: 'Unzipping', spec: 'The wedge', camDur: 1.4, cam: {chanHL: 0, flashOn: 0},
        events: [{mark: 'down', ...zipTo(120, 6.5, 'zipslow')}, {mark: 'wedge', cam: {wedgeHL: 1}, dur: 0.5}],
        callouts: [{a: 'wedge', t: 'Wedge', dx: 50, dy: -80, mark: 'wedge', after: 0.4}]},
      z_hold: {title: 'Why It Holds', spec: 'Bump trapped in hollow', camDur: 2.2,
        cam: {wedgeHL: 0, xray: 0.4, zoom: 2.5, fy: 230, tabFlat: 1},
        events: [{mark: 'pull', cam: {tug: 1}, dur: 0.6}, {mark: 'angle', cam: {tug: 0}, dur: 0.6}, {mark: 'angle', at: 0.6, cam: {zoom: 2.9, fy: 120, xray: 1, wedgeHL: 1}, dur: 1.8}],
        callouts: [{a: 'closed', t: 'Locked tight', dx: 50, dy: -60, mark: 'pull', after: 0.8, until: 'angle'}]},
      z_lock: {title: 'Locking Slider', spec: 'A pin on the tab', camDur: 1.8,
        cam: {wedgeHL: 0, xray: 0.5, zoom: 3.0, fy: 135, tabFlat: 0.1},
        events: [{mark: 'flat', cam: {tabFlat: 1}, dur: 1.0, sfx: 'clack'}, {mark: 'flat', at: 0.9, cam: {pinShow: 1}, dur: 0.6}],
        callouts: [{a: 'lockPin', t: 'Locking pin', dx: 60, dy: -60, mark: 'flat', after: 1.4}]},
      z_box: {title: 'Pin and Box', spec: 'Separating zip', camDur: 2.4,
        cam: {pinShow: 0, xray: 0, sY: 290, zoom: 2.4, fy: 250, spin: 0},
        events: [{mark: 'apart', cam: {boxSep: 1}, dur: 1.2, sfx: 'lift'}, {mark: 'back', cam: {boxSep: 0}, dur: 1.0}, {mark: 'back', at: 1.0, cam: {}, dur: 0.1, sfx: 'click'}],
        callouts: [{a: 'pin', t: 'Pin', dx: -40, dy: -70, line: 0, after: 1.6}, {a: 'box', t: 'Box', dx: 40, dy: -70, line: 0, after: 2.2}]},
      z_history: {title: 'A Short History', spec: '1893 to 1923', camDur: 2.4,
        cam: {zoom: 0.8, fy: 0, spin: 0.02, card1: 0, card2: 0, card3: 0},
        events: [{line: 0, at: 0.6, cam: {card1: 1}, dur: 0.6}, {line: 0, at: 1.0, ...zipTo(60, 9, 'zipslow')}, {line: 0, at: 1.0, cam: {fy: 0}, dur: 9},
                 {mark: 'y1913', cam: {card1: 0, card2: 1}, dur: 0.6}, {mark: 'y1923', cam: {card2: 0, card3: 1}, dur: 0.6},
                 {mark: 'y1923', at: 0.4, ...zipTo(-180, 6, 'zipslow')}, {mark: 'y1923', at: 0.4, cam: {fy: 0}, dur: 6}]},
      z_finale: {title: 'Reassembled', spec: 'Hundreds of tiny locks', camDur: 2.0, cam: {card3: 0, zoom: 0.84, spin: -0.02},
        events: [{line: 0, at: 0.4, ...zipTo(220, 2.2, 'zipslow')}, {line: 0, at: 0.4, cam: {fy: 0}, dur: 2.2}, {mark: 'pull', ...zipTo(-270, 1.1, 'zip')}, {mark: 'pull', cam: {fy: 0}, dur: 1.1}]},
      z_cta: {cta: true, quiet: true, camDur: 2.0, cam: {zoom: 0.7, sy: 0.18, spin: 0.02, fy: 0}}
    },
    init() { makePatterns(); },
    simulate(dt) {
      const yc = cur.sY + 25, n = Math.floor((yc - Y0) / (PITCH / 2));
      if (lastN !== null && n !== lastN) {
        const steps = Math.min(4, Math.abs(n - lastN)), speed = Math.abs(cur.sY - lastS) / dt;
        const g = Math.min(0.5, 0.08 + speed * 0.0012) * (K.sceneId === 'z_slider' || K.sceneId === 'z_unzip' ? 1.6 : 1);
        for (let i = 0; i < steps; i++) K.tick(g, i & 1);
        flashT = K.T;
      }
      lastN = n; lastS = cur.sY;
    },
    render() { drawZip(); },
    overlay() {
      if (cur.macro > 0.01) drawMacro(cur.macro);
      K.card('1893 · CLASP LOCKER', 470, cur.card1, 'WHITCOMB JUDSON');
      K.card('1913 · HOOKLESS FASTENER', 470, cur.card2, 'GIDEON SUNDBÄCK · 10–11 TEETH PER INCH');
      K.card('1923 · “ZIPPER”', 470, cur.card3, 'B. F. GOODRICH · RUBBER BOOTS');
    }
  };
};

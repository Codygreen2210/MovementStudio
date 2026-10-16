/* Movement film engine: calibre 3235 mechanism, camera, watch exterior, studio set and video harness. */
(() => {
'use strict';
const TAU = Math.PI * 2;
const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = {getPropertyValue: () => ''};
const C = {
  gilt: css.getPropertyValue('--gilt').trim() || '#cfab6e',
  blue: css.getPropertyValue('--blue').trim() || '#5d9dff',
  ruby: css.getPropertyValue('--ruby').trim() || '#cc3a4e',
  fg: css.getPropertyValue('--fg').trim() || '#ebe7de',
  muted: css.getPropertyValue('--muted').trim() || '#8e97a7',
  stage: css.getPropertyValue('--stage').trim() || '#07090d'
};

/* ---------- Movement geometry (units: 1 = ~0.095 mm; plate radius 150) ---------- */
const G = {
  barrel: {x:-58, y:-43, R:62},
  center: {x:0, y:0, R:46, p:10},
  third: {x:47.6, y:-27.5, R:36, p:9},
  fourth: {x:69.6, y:10.6, R:32, p:8},
  escape: {x:79.7, y:48.3, R:20, p:7},
  fork: {x:69.4, y:76.5},
  balance: {x:48.4, y:112.9, R:46},
  rev: {x:-22, y:-104}
};
const dirE = Math.atan2(G.fork.y - G.escape.y, G.fork.x - G.escape.x);
const STONES = [0.72, -0.72].map(o => ({
  x: G.escape.x + 21 * Math.cos(dirE + o) - G.fork.x,
  y: G.escape.y + 21 * Math.sin(dirE + o) - G.fork.y,
  a: dirE + o
}));
const BAL_DIR = Math.atan2(G.balance.y - G.fork.y, G.balance.x - G.fork.x);
const ROLLER_DIR = Math.atan2(G.fork.y - G.balance.y, G.fork.x - G.balance.x);
const LAYERS = ['dial', 'plate', 'barrel', 'train', 'esc', 'bal', 'bridges', 'rotor'];
const LNAME = {
  dial: 'Dial side · motion works & date', plate: 'Main plate', barrel: 'Mainspring barrel',
  train: 'Gear train', esc: 'Chronergy escapement', bal: 'Balance & Parachrom hairspring',
  bridges: 'Bridges · 31 jewels', rotor: 'Perpetual rotor'
};

/* ---------- Gear path builder ---------- */
function polar(r, a) { return [r * Math.cos(a), r * Math.sin(a)]; }
function gearPath(R, N, o = {}) {
  const p = new Path2D();
  const d = o.depth ?? Math.min(R * 0.12, 2.6 + R * 0.035);
  const rr = R - d, pitch = TAU / N;
  for (let i = 0; i < N; i++) {
    const a = i * pitch;
    const pts = o.club
      ? [[rr, a], [R, a + pitch * 0.40], [R - d * 0.35, a + pitch * 0.52], [rr, a + pitch * 0.62]]
      : [[rr, a], [R, a + pitch * 0.22], [R, a + pitch * 0.46], [rr, a + pitch * 0.68]];
    pts.forEach(([r, ang], j) => { const [x, y] = polar(r, ang); (i === 0 && j === 0) ? p.moveTo(x, y) : p.lineTo(x, y); });
  }
  p.closePath();
  if (o.spokes) {
    const ri = rr - (o.rim ?? Math.max(2.2, R * 0.1));
    const rh = o.hub ?? R * 0.24;
    const sw = o.spokeW ?? Math.max(2, R * 0.09);
    for (let s = 0; s < o.spokes; s++) {
      const a0 = s * TAU / o.spokes, a1 = (s + 1) * TAU / o.spokes;
      const hr = sw / (2 * ri), hh = sw / (2 * rh);
      if (a1 - hh <= a0 + hh) continue;
      p.moveTo(...polar(ri, a0 + hr));
      p.arc(0, 0, ri, a0 + hr, a1 - hr);
      p.lineTo(...polar(rh, a1 - hh));
      p.arc(0, 0, rh, a1 - hh, a0 + hh, true);
      p.closePath();
    }
  }
  if (o.hole) { p.moveTo(o.hole, 0); p.arc(0, 0, o.hole, 0, TAU); }
  return p;
}
const P = {
  barrel: gearPath(62, 84, {depth: 2.6, hole: 0}),
  center: gearPath(46, 70, {spokes: 4, hub: 9, hole: 2}),
  centerPin: gearPath(10, 10, {depth: 2.4}),
  third: gearPath(36, 60, {spokes: 4, hub: 7, hole: 1.6}),
  thirdPin: gearPath(9, 8, {depth: 2.2}),
  fourth: gearPath(32, 56, {spokes: 4, hub: 6, hole: 1.6}),
  fourthPin: gearPath(8, 8, {depth: 2}),
  escape: gearPath(20, 15, {club: true, depth: 4.2, spokes: 5, hub: 4.2, rim: 2.6, spokeW: 1.8, hole: 1.2}),
  escapePin: gearPath(7, 7, {depth: 1.8}),
  rev: gearPath(10, 18, {spokes: 3, hub: 2.6, hole: 1}),
  cannon: gearPath(8, 12, {depth: 1.8, hole: 2.4}),
  minuteW: gearPath(20, 36, {spokes: 3, hub: 4, hole: 1.2}),
  hourW: gearPath(23, 40, {spokes: 4, hub: 11, hole: 7.5})
};

/* ---------- Pre-rendered textures ---------- */
function makePlate() {
  const S = 4, R = 150, size = Math.ceil(R * 2 * S) + 8;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.translate(size / 2, size / 2); g.scale(S, S);
  g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
  const base = g.createRadialGradient(-50, -70, 10, 0, 0, R * 1.1);
  base.addColorStop(0, '#d3d8de'); base.addColorStop(1, '#8a939e');
  g.fillStyle = base; g.fillRect(-R, -R, R * 2, R * 2);
  let row = 0;
  for (let y = -R - 6; y <= R + 6; y += 9, row++) {
    for (let x = -R - 6 + (row % 2 ? 4.5 : 0); x <= R + 6; x += 9) {
      const gr = g.createRadialGradient(x - 1.8, y - 1.8, 0.4, x, y, 7);
      gr.addColorStop(0, 'rgba(255,255,255,0.24)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.04)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 6.6, 0, TAU); g.fill();
    }
  }
  [[G.barrel, 66], [G.center, 50], [G.third, 40], [G.fourth, 36], [G.escape, 25], [G.balance, 52]].forEach(([o, r]) => {
    g.fillStyle = 'rgba(16,22,30,0.30)'; g.beginPath(); g.arc(o.x, o.y, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 0.6; g.stroke();
  });
  g.restore();
  g.lineWidth = 3; g.strokeStyle = '#5b6470'; g.beginPath(); g.arc(0, 0, R - 1.5, 0, TAU); g.stroke();
  g.lineWidth = 0.8; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(0, 0, R - 3.4, 0, TAU); g.stroke();
  return {c, half: size / 2 / S};
}
function makeRotor() {
  const S = 4, R = 147, size = Math.ceil(R * 2 * S) + 8;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.translate(size / 2, size / 2); g.scale(S, S);
  const shape = new Path2D(); shape.arc(0, 0, R, Math.PI, TAU); shape.lineTo(24, 0); shape.arc(0, 0, 24, 0, Math.PI, true); shape.closePath();
  g.save(); g.clip(shape);
  const base = g.createLinearGradient(-R, -R, R, 0);
  base.addColorStop(0, '#aeb6c0'); base.addColorStop(0.5, '#e1e5ea'); base.addColorStop(1, '#8f99a5');
  g.fillStyle = base; g.fillRect(-R, -R, R * 2, R);
  for (let a = Math.PI; a <= TAU; a += 0.012) {
    g.strokeStyle = `rgba(255,255,255,${0.05 + 0.08 * Math.abs(Math.sin(a * 37))})`;
    g.lineWidth = 0.35; g.beginPath(); g.moveTo(0, 0); g.lineTo(...polar(R, a)); g.stroke();
  }
  g.fillStyle = 'rgba(40,48,58,0.38)'; g.beginPath(); g.arc(0, 0, R, Math.PI, TAU); g.arc(0, 0, 124, TAU, Math.PI, true); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.7; g.beginPath(); g.arc(0, 0, 124, Math.PI, TAU); g.stroke();
  g.restore();
  g.strokeStyle = '#4c5560'; g.lineWidth = 1.2; g.stroke(shape);
  const hub = g.createRadialGradient(-6, -6, 2, 0, 0, 24);
  hub.addColorStop(0, '#eef1f4'); hub.addColorStop(1, '#7d8794');
  g.fillStyle = hub; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.fill();
  g.strokeStyle = '#4c5560'; g.lineWidth = 0.8; g.stroke();
  for (let i = 0; i < 10; i++) {
    const [x, y] = polar(14, i * TAU / 10);
    const b = g.createRadialGradient(x - 0.8, y - 0.8, 0.2, x, y, 2.8);
    b.addColorStop(0, '#ffffff'); b.addColorStop(1, '#6f7884');
    g.fillStyle = b; g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill();
  }
  g.fillStyle = '#9aa3ae'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill();
  g.strokeStyle = '#3e4650'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.stroke();
  return {c, half: size / 2 / S};
}
const TEX = {plate: makePlate(), rotor: makeRotor()};

/* ---------- Scenes: camera, layer visibility, timed moves ---------- */
const CFG = window.__CFG || {w: 1920, h: 1080};
const PORTRAIT = CFG.h > CFG.w;
const CAM_DEF = {tilt:0, explode:0, zoom:1, fx:0, fy:0, sx:0, sy:0, spin:0, flip:0, ts:1, swing:0.3, flow:0, gauge:0, case:0, lift:1};
const ALL = v => { const o = {}; LAYERS.forEach(l => o[l] = v); return o; };
const A_ROTOR = {rotor:0.9, bridges:0.12, bal:0.2, esc:0.2, train:0.28, barrel:0.7, plate:0.4, dial:0};
const A_BARREL = {rotor:0, bridges:0, bal:0.12, esc:0.12, train:0.3, barrel:1, plate:0.42, dial:0};
const A_TRAIN = {rotor:0, bridges:0, bal:0.35, esc:0.6, train:1, barrel:0.85, plate:0.38, dial:0};
const A_ESC = {rotor:0, bridges:0, bal:0.7, esc:1, train:0.35, barrel:0.1, plate:0.32, dial:0};
const A_BAL = {rotor:0, bridges:0, bal:1, esc:0.5, train:0.2, barrel:0.1, plate:0.32, dial:0};
const C_ROTOR = {tilt:0.45, explode:0, zoom:1.02, fx:0, fy:-18, ts:1, swing:1, flow:1, case:0};
const C_BARREL = {tilt:0, explode:0, zoom:1.8, fx:-52, fy:-40, ts:1, swing:0.2, flow:2, gauge:1, case:0};
const C_ESC = {tilt:0, explode:0, zoom:3, fx:68, fy:72, ts:0.08, swing:0.1, flow:6, case:0};
const C_BAL = {tilt:0, explode:0, zoom:2.6, fx:52, fy:104, ts:0.5, swing:0.1, flow:7, case:0};
const CO_ROTOR = [
  {L:'rotor', p:[0,0], t:'Ball bearing', dx:80, dy:-60, line:1},
  {L:'rotor', p:[G.rev.x,G.rev.y], t:'Reversing wheels', dx:-110, dy:-36, line:2}];
const CO_ESC = [
  {L:'esc', p:[G.escape.x+12,G.escape.y-12], t:'Escape wheel', dx:80, dy:-60, line:1},
  {L:'esc', p:[G.fork.x+STONES[0].x,G.fork.y+STONES[0].y], t:'Pallet stones', dx:110, dy:40, line:1},
  {L:'esc', p:[G.fork.x,G.fork.y], t:'Pallet fork', dx:-120, dy:-30, line:1}];

const DEFS = {
  hook: {title:'', spec:'', camDur:0,
    cam:{flip:1, case:1, lift:0, zoom:2.5, fx:-40, fy:30, spin:0.3, swing:0.2},
    alpha:ALL(1),
    events:[{at:0.02, cam:{zoom:1.0, fx:0, fy:0, spin:-0.05}, dur:9.5}, {at:9.6, cam:{zoom:0.9, spin:-0.16, tilt:0.2}, dur:7}]},
  watch: {title:'The Watch', spec:'Found in: Datejust · Submariner Date · Sea-Dweller', camDur:2.6, lowerThird:true,
    cam:{flip:1, case:1, lift:0, zoom:0.8, sx:0.29, fx:0, fy:0, spin:0.04},
    alpha:ALL(1),
    events:[{at:2.6, cam:{spin:-0.16, zoom:0.9, tilt:0.34}, dur:7}, {at:9.6, cam:{spin:0.08, zoom:0.86, tilt:0.12, sy:-0.02}, dur:7},
            {at:16.6, cam:{spin:-0.06, zoom:0.93, tilt:0.3, sy:0.01}, dur:4.4},
            {line:2, at:0.15, cam:{flip:0, sx:0, sy:0, tilt:0, zoom:0.95, spin:0}, dur:1.8, sfx:'flip'},
            {line:3, at:0.25, cam:{lift:1, zoom:1.04}, dur:3.0, sfx:'unscrew'}]},
  calibre: {title:'The Calibre', spec:'Cal. 3235 · 31 jewels · 28,800 vph · ≈70 h',
    cam:{flip:0, case:0, lift:1, zoom:1, swing:0.35}, alpha:ALL(1),
    events:[{line:1, at:0, cam:{zoom:1.08, spin:0.05}, dur:6}]},
  stack: {title:'The Stack', spec:'8 layers · case back ↑ · dial ↓', spinLive:true,
    cam:{tilt:1.02, explode:1, zoom:0.56, sx:-0.17, sy:0.03, swing:0.25, case:0}, alpha:ALL(1)},
  rotor: {title:'Perpetual Rotor', spec:'Bidirectional · ball bearing · patented 1931', cam:C_ROTOR, alpha:A_ROTOR, callouts:CO_ROTOR},
  barrel: {title:'Mainspring Barrel', spec:'High-capacity barrel · ≈70 h reserve', cam:C_BARREL, alpha:A_BARREL,
    callouts:[{L:'barrel', p:[G.barrel.x-18,G.barrel.y+20], t:'Mainspring', dx:-120, dy:70, line:0},
              {L:'barrel', p:[G.barrel.x+40,G.barrel.y-47], t:'Barrel wall', dx:90, dy:-40, line:1}]},
  train: {title:'Gear Train', spec:'Barrel → centre → third → fourth → escape',
    cam:{tilt:0, explode:0, zoom:1.28, fx:12, fy:16, ts:1, swing:0.2, flow:5, case:0}, alpha:A_TRAIN,
    events:[{line:1, at:0, cam:{zoom:1.5, fx:0, fy:-4}, dur:3}, {line:2, at:0, cam:{zoom:1.6, fx:55, fy:5}, dur:3}, {line:3, at:0, cam:{zoom:1.25, fx:15, fy:20}, dur:3.5}],
    callouts:[{L:'train', p:[G.third.x,G.third.y], t:'Third wheel', dx:70, dy:-70, line:0},
              {L:'train', p:[0,0], t:'Centre wheel · 1 rev / hour', dx:-150, dy:60, line:1},
              {L:'train', p:[G.fourth.x,G.fourth.y], t:'Fourth wheel · 1 rev / min', dx:100, dy:10, line:2}]},
  esc: {title:'Chronergy Escapement', spec:'Nickel-phosphorus · +15% efficiency · slow motion', cam:C_ESC, alpha:A_ESC, callouts:CO_ESC,
    events:[{line:2, at:0, cam:{zoom:3.6, fx:72, fy:66}, dur:4}, {line:3, at:0, cam:{zoom:2.8, fx:66, fy:78}, dur:5}]},
  bal: {title:'Balance & Parachrom', spec:'4 Hz · 8 beats a second · shown at half speed', cam:C_BAL, alpha:A_BAL,
    events:[{line:2, at:0, cam:{zoom:3.1, fx:58, fy:110}, dur:6}, {line:3, at:0, cam:{zoom:2.5, fx:48, fy:112}, dur:4}],
    callouts:[{L:'bal', p:[G.balance.x-33,G.balance.y-31], t:'Balance wheel', dx:-110, dy:-50, line:0},
              {L:'bal', p:[G.balance.x+22,G.balance.y+12], t:'Parachrom hairspring', dx:110, dy:50, line:2},
              {L:'bal', p:[G.balance.x,G.balance.y], t:'Paraflex shock absorber', dx:-130, dy:80, line:3}]},
  dial: {title:'Dial Side', spec:'Motion works 12:1 · instant date change',
    cam:{tilt:0, explode:0, zoom:1, fx:0, fy:0, flip:1, ts:1, swing:0.2, flow:0, case:0}, alpha:ALL(1),
    events:[{line:2, at:0, cam:{zoom:1.5, fx:60, fy:0}, dur:3.2}],
    callouts:[{L:'dialview', p:[0,0], t:'Cannon pinion', dx:-120, dy:-90, line:1},
              {L:'dialview', p:[-19.8,-19.8], t:'Minute wheel', dx:-110, dy:-10, line:1},
              {L:'dialview', p:[0,24], t:'Hour wheel', dx:-100, dy:80, line:1},
              {L:'dialview', p:[128,0], t:'Date window', dx:-20, dy:-110, line:2}]},
  finale: {title:'Reassembly', spec:'Superlative Chronometer · −2/+2 s a day',
    cam:{tilt:0.5, explode:0, zoom:0.95, fx:0, fy:0, flip:0, ts:1, swing:0.7, flow:7, case:0, lift:1},
    alpha:Object.assign(ALL(1), {rotor:0.55, bridges:0.55}),
    events:[{line:1, at:0.2, cam:{case:1, lift:0, tilt:0, flow:0, zoom:0.9}, alpha:ALL(1), dur:3.2, sfx:'unscrew'},
            {line:1, at:3.4, cam:{spin:-0.12, zoom:0.97, tilt:0.24}, dur:6},
            {line:2, at:0.1, cam:{flip:1, zoom:0.86, spin:0.04, tilt:0}, dur:1.8, sfx:'flip'},
            {line:2, at:2.0, cam:{spin:-0.1, zoom:0.95, tilt:0.24}, dur:7}, {line:2, at:9.0, cam:{spin:0.06, zoom:1.02, tilt:0.1}, dur:8}]},

  /* ---- vertical Short ---- */
  s_hook: {title:'', spec:'', camDur:0,
    cam:{flip:0, case:0, lift:1, zoom:3.3, fx:52, fy:104, ts:0.5, flow:0, swing:0.1}, alpha:A_BAL,
    events:[{at:0.02, cam:{zoom:2.2, fx:40, fy:70}, dur:6}]},
  s_watch: {title:'Calibre 3235', spec:'', camDur:0.8,
    cam:{flip:1, case:1, lift:0, zoom:0.95, fx:0, fy:0, ts:1, flow:0, swing:0.3}, alpha:ALL(1),
    events:[{line:0, at:2.3, mark:'flip', cam:{flip:0}, dur:1.1, sfx:'flip'}, {line:0, at:3.6, mark:'lift', markAt:0.1, cam:{lift:1, zoom:1.05}, dur:1.9, sfx:'unscrew'}]},
  s_rotor: {title:'Rotor → mainspring', spec:'', cam:C_ROTOR, alpha:A_ROTOR,
    events:[{line:0, at:3.3, mark:'barrel', markAt:0.5, cam:C_BARREL, alpha:A_BARREL, dur:1.6, sfx:'whoosh'}]},
  s_esc: {title:'Escapement', spec:'Slow motion', cam:C_ESC, alpha:A_ESC,
    events:[{line:1, at:0, mark:'lock', markAt:0, cam:{zoom:3.6, fx:72, fy:66}, dur:3}]},
  s_bal: {title:'Balance & hairspring', spec:'', cam:C_BAL, alpha:A_BAL,
    events:[{line:0, at:1.5, cam:{zoom:3.0, fx:56, fy:110}, dur:5}]},
  s_end: {title:'', spec:'', camDur:1.4,
    cam:{flip:1, case:1, lift:0, zoom:0.9, fx:0, fy:0, ts:1, flow:0, tilt:0, swing:0.3, spin:0.02}, alpha:ALL(1)},
  /* ---- 3-minute vertical cut ---- */
  m_hook: {title:'', spec:'', camDur:0,
    cam:{flip:1, case:1, lift:0, zoom:2.5, fx:-40, fy:30, spin:0.3, swing:0.2}, alpha:ALL(1),
    events:[{at:0.02, cam:{zoom:1.0, fx:0, fy:0, spin:-0.05}, dur:6.5}]},
  m_watch: {title:'Calibre 3235', spec:'Datejust · Submariner Date · Sea-Dweller', camDur:1.6,
    cam:{flip:1, case:1, lift:0, zoom:0.92, sx:0, fx:0, fy:0, spin:0.04}, alpha:ALL(1),
    events:[{at:1.8, cam:{spin:-0.12, zoom:0.98, tilt:0.3}, dur:5},
            {mark:'flip', markAt:0.05, cam:{flip:0, tilt:0, spin:0, zoom:0.95}, dur:1.3, sfx:'flip'},
            {line:1, at:0.1, cam:{lift:1, zoom:1.05}, dur:2.6, sfx:'unscrew'}]},
  m_calibre: {title:'The Calibre', spec:'31 jewels · 28,800 vph · ≈70 h',
    cam:{flip:0, case:0, lift:1, zoom:1, swing:0.35}, alpha:ALL(1),
    events:[{at:3, cam:{zoom:1.1, spin:0.06}, dur:5}]},
  m_stack: {title:'The Stack', spec:'8 layers', spinLive:true,
    cam:{tilt:1.02, explode:1, zoom:0.42, sx:-0.2, sy:0, swing:0.25, case:0}, alpha:ALL(1)},
  m_rotor: {title:'Perpetual Rotor', spec:'Patented 1931', cam:C_ROTOR, alpha:A_ROTOR,
    callouts:[{L:'rotor', p:[0,0], t:'Ball bearing', dx:80, dy:-60, line:0}, {L:'rotor', p:[G.rev.x,G.rev.y], t:'Reversing wheels', dx:-110, dy:-36, line:0, after:6}]},
  m_barrel: {title:'Mainspring Barrel', spec:'≈70 h reserve', cam:C_BARREL, alpha:A_BARREL,
    callouts:[{L:'barrel', p:[G.barrel.x-18,G.barrel.y+20], t:'Mainspring', dx:-120, dy:70, line:0}, {L:'barrel', p:[G.barrel.x+40,G.barrel.y-47], t:'Barrel wall', dx:90, dy:-40, line:0, after:3.5}]},
  m_train: {title:'Gear Train', spec:'Counting the time out',
    cam:{tilt:0, explode:0, zoom:1.28, fx:12, fy:16, ts:1, swing:0.2, flow:5, case:0}, alpha:A_TRAIN,
    events:[{mark:'centre', cam:{zoom:1.5, fx:0, fy:-4}, dur:2.5}, {mark:'fourth', cam:{zoom:1.6, fx:55, fy:5}, dur:2.5}, {mark:'race', cam:{zoom:1.25, fx:15, fy:20}, dur:3}],
    callouts:[{L:'train', p:[0,0], t:'Centre wheel · 1 rev / hour', dx:-150, dy:60, mark:'centre'},
              {L:'train', p:[G.fourth.x,G.fourth.y], t:'Fourth wheel · 1 rev / min', dx:100, dy:10, mark:'fourth'}]},
  m_esc: {title:'Chronergy Escapement', spec:'Slow motion', cam:C_ESC, alpha:A_ESC,
    callouts:CO_ESC.map(c => Object.assign({}, c, {line:0, after:2})),
    events:[{mark:'lock', cam:{zoom:3.6, fx:72, fy:66}, dur:3}, {line:1, at:0, cam:{zoom:2.8, fx:66, fy:78}, dur:4}]},
  m_bal: {title:'Balance & Parachrom', spec:'4 beats a second', cam:C_BAL, alpha:A_BAL,
    events:[{mark:'spring', cam:{zoom:3.1, fx:58, fy:110}, dur:5}],
    callouts:[{L:'bal', p:[G.balance.x-33,G.balance.y-31], t:'Balance wheel', dx:-110, dy:-50, line:0},
              {L:'bal', p:[G.balance.x+22,G.balance.y+12], t:'Parachrom hairspring', dx:110, dy:50, mark:'spring'}]},
  m_dial: {title:'Dial Side', spec:'Instant date change',
    cam:{tilt:0, explode:0, zoom:1, fx:0, fy:0, flip:1, ts:1, swing:0.2, flow:0, case:0}, alpha:ALL(1),
    events:[{mark:'mid', cam:{zoom:1.5, fx:60, fy:0}, dur:2.6}],
    callouts:[{L:'dialview', p:[0,0], t:'Motion works', dx:-120, dy:-90, line:0},
              {L:'dialview', p:[128,0], t:'Date window', dx:-20, dy:-110, mark:'mid'}]},
  m_finale: {title:'Reassembly', spec:'−2/+2 s a day',
    cam:{tilt:0.5, explode:0, zoom:0.95, fx:0, fy:0, flip:0, ts:1, swing:0.7, flow:7, case:0, lift:1},
    alpha:Object.assign(ALL(1), {rotor:0.55, bridges:0.55}),
    events:[{line:1, at:0.2, cam:{case:1, lift:0, tilt:0, flow:0, zoom:0.9}, alpha:ALL(1), dur:3, sfx:'unscrew'},
            {mark:'flip', markAt:0, cam:{flip:1, zoom:0.86, spin:0.04, tilt:0}, dur:1.6, sfx:'flip'},
            {mark:'flip', markAt:1.8, cam:{spin:-0.1, zoom:0.92, tilt:0.2}, dur:6}]},
  m_cta: {title:'', spec:'', camDur:1.6,
    cam:{flip:1, case:1, lift:0, zoom:0.74, sy:0.18, fx:0, fy:0, tilt:0.12, spin:0.03, ts:1, flow:0, swing:0.3},
    alpha:ALL(1), events:[{at:1.8, cam:{spin:-0.06, tilt:0.22, zoom:0.78}, dur:6}]}
};
const SCENES = (window.__TL ? window.__TL.scenes : []).map(s => {
  const d = DEFS[s.id];
  const a = ALL(1); Object.assign(a, d.alpha || {});
  return Object.assign({id: s.id}, d, {cam: Object.assign({}, CAM_DEF, d.cam), alpha: a});
});

/* ---------- Canvas ---------- */
let W = CFG.w, H = CFG.h, dpr = 1; cv.width = W; cv.height = H;
const UI = PORTRAIT ? {fs: 26, sc: 1.15} : {fs: 20, sc: 1.6};

/* ---------- Camera state & animation ---------- */
const cur = Object.assign({}, CAM_DEF);
const alpha = ALL(1);
const anims = [];
let liveSpin = 0;
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function animate(obj, key, to, dur, start) {
  for (let i = anims.length - 1; i >= 0; i--) if (anims[i].obj === obj && anims[i].key === key) anims.splice(i, 1);
  if (dur <= 0) { obj[key] = to; return; }
  anims.push({obj, key, to, dur, start, from: null});
}
function stepAnims(T) {
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i];
    if (T < a.start) continue;
    if (a.from === null) a.from = a.obj[a.key];
    const e = ease(Math.min(1, (T - a.start) / a.dur));
    a.obj[a.key] = a.from + (a.to - a.from) * e;
    if (e >= 1) anims.splice(i, 1);
  }
}
function camTo(cam, al, dur, start) {
  if (cam) for (const k in cam) {
    if (k === 'spin') continue;
    animate(cur, k, cam[k], dur, start);
  }
  if (cam && 'spin' in cam) { cur.spin += liveSpin; liveSpin = 0; const to = cam.spin + Math.round((cur.spin - cam.spin) / TAU) * TAU; animate(cur, 'spin', to, dur, start); }
  if (al) for (const k in al) animate(alpha, k, al[k], dur, start);
}
function enterScene(s, T) {
  const c = Object.assign({}, s.cam);
  if (s.id === 'stack' && W / H < 1.1) { c.sx = -0.1; c.zoom = 0.5; c.sy = -0.02; }
  if (!('spin' in (DEFS[s.id].cam))) {
    cur.spin += liveSpin; liveSpin = 0;
    c.spin = Math.round(cur.spin / TAU) * TAU;
  }
  camTo(c, s.alpha, s.camDur ?? 2.4, T);
}
function idleOffsets() {}

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
const baseId = id => (id || '').replace(/^m_/, '');
function liveClock() { const id = SCENES[sceneIdx] && SCENES[sceneIdx].id; return baseId(id) !== 'dial'; }
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
      if (!M[c.L]) return;
      if (c.mark == null && lineIdx < c.line) return;
      if (c.L === 'dialview' && cur.flip < 0.5) return;
      const Sc = TL.scenes[curScene];
      const t0 = c.mark != null ? ((Sc.marks && Sc.marks[c.mark] != null) ? Sc.marks[c.mark] - Sc.start : 1e9) : Math.max(1.8, (lineStarts[c.line] ?? 0) + (c.after || 0));
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
    const b0 = baseId(SCENES[i].id);
    if (b0 === 'dial') { dateShown = 14; dateAng = -13 * TAU / 31; }
    else { dateShown = 15; dateAng = -14 * TAU / 31; }
    enterScene(SCENES[i], T);
    if (i > 0 && !['calibre', 'dial', 'cta'].includes(b0)) sfx.push([+T.toFixed(3), 'whoosh']);
    if (b0 === 'dial') sfx.push([+T.toFixed(3), 'flip']);
  }
  if (i < 0) { sceneClock = 0; return; }
  const S = TL.scenes[i];
  sceneClock = T - S.start;
  let started = 0; S.lines.forEach(ls => { if (T >= ls) started++; });
  for (let j = 0; j < started; j++) lineStarts[j] = S.lines[j] - S.start;
  lineIdx = Math.max(0, started - 1);
  if (SCENES[i].id === 'dial' && started >= 3 && !dialAnchor) dialAnchor = {t: sceneClock, m: dialMinutes(), jump: S.jump - S.start};
  if (SCENES[i].id === 'm_dial' && S.marks && S.marks.mid != null && T >= S.marks.mid && !dialAnchor) dialAnchor = {t: sceneClock, m: dialMinutes(), jump: S.marks.jump - S.start};
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
  const sid0 = SCENES[sceneIdx] ? SCENES[sceneIdx].id : '';
  const sid = sid0 === 'm_dial' || sid0 === 'm_barrel' || sid0 === 'm_rotor' ? baseId(sid0) : sid0;
  const Sx = TL.scenes[curScene] || {};
  if (sid === 'barrel') wTarget = Math.min(1, 0.1 + sceneClock / 15);
  if (sid === 'rotor') wTarget = Math.min(0.85, 0.35 + sceneClock / 30);
  if (sid === 's_rotor') { const S2 = TL.scenes[curScene]; const mk = (S2.marks && S2.marks.barrel != null ? S2.marks.barrel - S2.start + 0.5 : 3.3); wTarget = sceneClock < mk ? 0.3 : Math.min(1, 0.3 + (sceneClock - mk) / 3); }
  wind += (wTarget - wind) * (1 - Math.exp(-d * 2.5));
  const early = (Sx.marks && Sx.marks.mid != null) ? T < Sx.marks.mid : lineIdx < 2;
  const daTarget = (sid === 'dial' && early) ? 0.6 : (sid === 'dial' ? 0.96 : 1);
  dialA += (daTarget - dialA) * (1 - Math.exp(-d * 2));
  if (sid === 'dial' && dialMinutes() >= 1440 && lastDate === 14) { sfx.push([+T.toFixed(3), 'date']); lastDate = 15; }
  if (sid === 'dial' && dialMinutes() < 1440) lastDate = 14;
  const phase = TAU * 4 * wt, q = phase / Math.PI + 0.5, n = Math.floor(q), f = q - n;
  const tn = f >= 0.62 ? n : n - 1;
  if (lastTickN === null) lastTickN = tn;
  else if (tn > lastTickN) {
    let g = TICK_GAIN[sid0] ?? TICK_GAIN[baseId(sid0)] ?? 0.1;
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
    const n = String(curScene - 2).padStart(2, '0');
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
  if (S && S.id === 'm_cta') {
    const a = clamp01((T - S.start - 0.4) / 0.7);
    ctx.save(); ctx.globalAlpha = a; const bg = ctx.createLinearGradient(0, 180, 0, 800);
    bg.addColorStop(0, 'rgba(7,9,13,0)'); bg.addColorStop(0.2, 'rgba(7,9,13,0.82)'); bg.addColorStop(0.8, 'rgba(7,9,13,0.82)'); bg.addColorStop(1, 'rgba(7,9,13,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 180, W, 620); ctx.restore();
    const rise = (1 - ease(a)) * 40;
    txt('Inside the', W / 2, 330 + rise, '400 78px "Bodoni Moda"', C.fg, 'center', a);
    txt('Calibre 3235', W / 2, 425 + rise, 'italic 400 88px "Bodoni Moda"', C.gilt, 'center', a);
    const b = clamp01((T - S.start - 1.2) / 0.5);
    const pulse = 1 + 0.045 * Math.sin((T - S.start) * 5.2) * b;
    ctx.save(); ctx.globalAlpha = b; ctx.translate(W / 2, 560 + (1 - ease(b)) * 30); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#d6303f'; ctx.beginPath(); ctx.roundRect(-230, -56, 460, 112, 56); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '800 50px "Hanken Grotesk"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SUBSCRIBE', 0, 3);
    ctx.restore();
    const c2 = clamp01((T - S.start - 2.2) / 0.6);
    txt('NEXT: ANOTHER LEGENDARY MOVEMENT', W / 2, 690, '500 28px "IBM Plex Mono"', C.fg, 'center', c2, 4);
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

})();

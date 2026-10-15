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


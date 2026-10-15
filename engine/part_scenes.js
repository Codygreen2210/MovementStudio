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
    cam:{flip:1, case:1, lift:0, zoom:0.9, fx:0, fy:0, ts:1, flow:0, tilt:0, swing:0.3, spin:0.02}, alpha:ALL(1)}
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

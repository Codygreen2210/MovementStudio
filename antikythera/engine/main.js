/* Antikythera film — frame dispatch, transitions, init, sound-event list. */
'use strict';
const SCENES = {hook: sHook, title: sTitle, wreck: sWreck, xray: sXray, crank: sCrank, pinslot: sPinslot, back: sBack, planets: sPlanets, who: sWho, bridge: sBridge, end: sEnd};
const XF = 0.55;   // crossfade length between scenes
function drawScene(i, T) {
  const S = TL.scenes[i]; F.scene = S; F.si = i; F.T = T;
  X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; SCENES[S.id](T - S.start); X.restore();
}
function frame(T) {
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over';
  X.fillStyle = '#000'; X.fillRect(0, 0, W, H);
  const i = sceneIndexAt(T), S = TL.scenes[i];
  if (i > 0 && T < S.start + XF) {
    // render previous scene, then the new one on top with rising opacity
    drawScene(i - 1, T);
    LAYER.ctx.setTransform(1, 0, 0, 1, 0, 0); LAYER.ctx.clearRect(0, 0, W, H);
    const keep = X;
    swapCtx(LAYER.ctx); drawScene(i, T); swapCtx(keep);
    X.save(); X.globalAlpha = smooth((T - S.start) / XF); X.drawImage(LAYER.c, 0, 0); X.restore();
  } else drawScene(i, T);
  F.T = T;
  finish(T);
  // global fades in and out
  if (T < 0.6) { X.fillStyle = `rgba(0,0,0,${1 - T / 0.6})`; X.fillRect(0, 0, W, H); }
}
const LAYER = {c: null, ctx: null};
function swapCtx(c) { X = c; }

window.__init = async () => {
  const fams = ['400 40px "Bodoni Moda"', 'italic 400 40px "Bodoni Moda"', '700 20px "Hanken Grotesk"', '500 20px "IBM Plex Mono"', '600 20px "DejaVu Serif"'];
  await Promise.all(fams.map(f => document.fonts.load(f).catch(() => null)));
  const names = ['storm', 'diver', 'seafloor', 'museum1902', 'workshop', 'medclock', 'city', 'museumtoday', 'haul'];
  await Promise.all(names.map(n => new Promise(res => { const im = new Image(); im.onload = () => { IMG[n] = im; res(); }; im.onerror = () => res(); im.src = 'file:///home/claude/anti/img/' + n + '.jpg'; })));
  LAYER.c = document.createElement('canvas'); LAYER.c.width = W; LAYER.c.height = H; LAYER.ctx = LAYER.c.getContext('2d');
  makeGrain(); makeFragment(); makeFront(); makeBack(); makeWood();
  STUDIO = Studio.create(W, H, {seed: 7});
  return {fonts: fams.map(f => document.fonts.check(f)), images: Object.keys(IMG).length};
};
window.__advance = (i, draw) => { if (!draw) return null; frame(i / FPS); return cv.toDataURL('image/jpeg', 0.93); };
window.__png = (t) => { frame(t); return cv.toDataURL('image/png'); };
/* sound events: [time, kind, gain] from the marks */
window.__sfx = () => {
  const E = [], S = id => sceneById(id), mk = (id, k) => M(id, k);
  const add = (t, k, g = 1) => E.push([+t.toFixed(3), k, g]);
  TL.scenes.forEach((s, i) => { if (i > 0 && !['title', 'end'].includes(s.id)) add(s.start, 'slide', 0.7); });
  add(0.2, 'sub', 0.8); add(mk('hook', 'medieval'), 'slide', 0.8); add(mk('hook', 'inside'), 'scan', 1); add(mk('hook', 'thirty'), 'thud', 1); add(mk('hook', 'teeth'), 'click', 0.8);
  add(mk('hook', 'moon'), 'tick3', 0.7); add(mk('hook', 'eclipse'), 'tick3', 0.7); add(mk('hook', 'games'), 'tick3', 0.7); add(mk('hook', 'built'), 'sub', 0.9);
  add(S('title').start + 0.3, 'sting', 1);
  add(S('wreck').start, 'storm', 1); add(mk('wreck', 'map'), 'paper', 0.8); add(mk('wreck', 'dive'), 'under', 1); add(mk('wreck', 'statues'), 'under', 0.8); add(mk('wreck', 'lumpup'), 'thud', 0.8); add(mk('wreck', 'gear'), 'glint', 1);
  add(mk('xray', 'xr'), 'lightbox', 1); add(mk('xray', 'ct'), 'scanner', 1); add(mk('xray', 'found'), 'whirr', 0.8); add(mk('xray', 'count30'), 'click', 0.6); add(mk('xray', 'letters'), 'shimmer', 0.8);
  add(mk('crank', 'handle'), 'ratchet', 1); add(mk('crank', 'b1'), 'click', 0.6); add(mk('crank', 'year'), 'ratchet', 1); add(mk('crank', 'faster'), 'ratchet', 1);
  add(mk('crank', 'g1'), 'clack', 0.9); add(mk('crank', 'g2'), 'clack', 0.9); add(mk('crank', 'g3'), 'clack', 0.9); add(mk('crank', 'mult'), 'slide', 0.6); add(mk('crank', 'exact'), 'thud', 1.1);
  add(mk('pinslot', 'bronze'), 'slide', 0.7); add(mk('pinslot', 'pin'), 'click', 0.8); add(mk('pinslot', 'platform'), 'whirr', 0.7);
  add(S('back').start + 0.2, 'flip', 1); add(mk('back', 'metonic'), 'shimmer', 0.6); add(mk('back', 'games'), 'click', 0.7); add(mk('back', 'other'), 'ratchet', 0.7); add(mk('back', 'saros'), 'slide', 0.6); add(mk('back', 'glyphs'), 'shimmer', 0.8); add(mk('back', 'coming') + 0.8, 'eclipse', 1);
  add(mk('planets', 'lost'), 'sub', 0.7); add(mk('planets', 'y2016'), 'scan', 0.8); add(mk('planets', 'venus'), 'click', 0.8); add(mk('planets', 'saturn'), 'click', 0.8); add(mk('planets', 'rings'), 'shimmer', 0.8); add(mk('planets', 'cosmos'), 'swell', 1);
  add(mk('who', 'corinth'), 'paper', 0.8); add(mk('who', 'cicero'), 'slide', 0.6); add(mk('who', 'nothing'), 'sub', 1); add(mk('who', 'clocks'), 'bell', 0.8); add(mk('who', 'sank'), 'under', 0.8);
  add(mk('bridge', 'sky'), 'shimmer', 0.7); add(mk('bridge', 'clocks2'), 'bell', 0.6); add(mk('bridge', 'pocket'), 'click', 0.7); add(mk('bridge', 'wrists'), 'tickloop', 1); add(mk('bridge', 'open'), 'slide', 0.8);
  return E;
};

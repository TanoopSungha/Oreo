// Oreo: everything is drawn in code (no image files). Oreo, the family and the places they go.
(function (G) {
  'use strict';
  const D = G.OREO_DATA;
  const TAU = Math.PI * 2;

  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  }
  const OUT = '#2a1a24';  // outline colour for the chunky cartoon look

  // ---------- people ----------
  // look: { skin, hair, hairCol, top, col, legs, acc, build, h }
  // o: { walk (phase or null), face, blink, arm: 'idle'|'wave'|'hold'|'cheer'|'cross'|'point', holdCol, flip, t }
  function person(c, L, x, foot, sc, o) {
    o = o || {};
    const h = (L.h || 1), b = (L.build || 1);
    c.save(); c.translate(x, foot); c.scale(sc * (o.flip ? -1 : 1), sc);
    const t = o.t || 0;
    const step = o.walk != null ? Math.sin(o.walk) : 0;
    const bob = (o.walk != null ? Math.abs(Math.cos(o.walk)) * 4 : Math.sin(t * 2 + (L.seed || 0)) * 1.2) + (o.groove || 0) * 4;
    c.lineWidth = 3.2; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = OUT;
    const legH = 62 * h, torsoH = 82 * h, bw = 30 * b;
    const hipY = -legH - bob, shY = hipY - torsoH, headY = shY - 34;
    // shadow
    c.fillStyle = 'rgba(30,10,20,.22)'; c.beginPath(); c.ellipse(0, 2, bw * 1.4, 8, 0, 0, TAU); c.fill();
    // long hair behind
    hairBack(c, L, headY);
    // legs
    const legCol = L.legs || '#2b3a67';
    for (const sgn of [-1, 1]) {
      const lift = o.walk != null ? Math.max(0, sgn * step) * 10 : 0, sw = o.walk != null ? sgn * step * 8 : 0;
      c.fillStyle = legCol; rr(c, sgn * bw * 0.45 - 10 + sw, hipY - 4, 20, legH - lift + 2 + bob, 8); c.fill(); c.stroke();
      c.fillStyle = L.shoes || '#231a1a'; rr(c, sgn * bw * 0.45 - 13 + sw + sgn * 3, -12 - lift, 26, 13, 6); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(sgn * bw * 0.45 - 13 + sw + sgn * 3 + 2, -3 - lift, 22, 2);
    }
    // arms behind body (when idle they hang at the sides)
    const arm = o.arm || 'idle';
    const sleeve = topColour(L);
    const handCol = L.skin;
    function limb(sx, sy, ex, ey) {
      c.strokeStyle = OUT; c.lineWidth = 17; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = sleeve; c.lineWidth = 11; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
      c.fillStyle = handCol; c.lineWidth = 3; c.strokeStyle = OUT; c.beginPath(); c.arc(ex, ey, 7.5, 0, TAU); c.fill(); c.stroke();
    }
    const swing = o.walk != null ? step * 10 : Math.sin(t * 1.6 + (L.seed || 0)) * 2;
    const ax = bw + 2, ay = shY + 12;
    const arms = {
      idle: [[-ax, ay, -ax - 8 - swing * 0.3, hipY + 6 + swing], [ax, ay, ax + 8 + swing * 0.3, hipY + 6 - swing]],
      wave: [[-ax, ay, -ax - 8, hipY + 6], [ax, ay, ax + 26, ay - 40 + Math.sin(t * 12) * 8]],
      cheer: [[-ax, ay, -ax - 22, ay - 52 + Math.sin(t * 14) * 5], [ax, ay, ax + 22, ay - 52 - Math.sin(t * 14) * 5]],
      hold: [[-ax, ay, -10, ay + 30], [ax, ay, 10, ay + 30]],
      cross: [[-ax, ay, bw * 0.6, ay + 26], [ax, ay, -bw * 0.6, ay + 30]],
      point: [[-ax, ay, -ax - 8, hipY + 6], [ax, ay, ax + 40, ay + 4]],
      think: [[-ax, ay, -ax - 8, hipY + 6], [ax, ay, 14, headY + 30]],
      dig: [[-ax, ay, -16, hipY - 4 + Math.sin(t * 7) * 5], [ax, ay, 18, hipY - 8 + Math.cos(t * 7) * 5]],
    }[arm];
    // torso
    torso(c, L, bw, shY, hipY, torsoH);
    if (L.bag) bag(c, L, bw, shY, hipY);
    if (arm !== 'cross' && arm !== 'hold' && arm !== 'dig') arms.forEach(a => limb(...a));
    // neck + head
    c.fillStyle = L.skin; rr(c, -9, shY - 12, 18, 16, 5); c.fill();
    head(c, L, headY, o);
    if (arm === 'cross' || arm === 'hold' || arm === 'dig') arms.forEach(a => limb(...a));
    if (arm === 'hold' && o.holdCol) { // a record sleeve held to the chest
      c.save(); c.translate(0, ay + 10); c.rotate(-0.08); c.fillStyle = o.holdCol; c.lineWidth = 3; rr(c, -26, -26, 52, 52, 3); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill(); c.restore();
    }
    c.restore();
  }

  function bag(c, L, bw, shY, hipY) {
    // a canvas tote bag with a record printed on it
    c.strokeStyle = OUT; c.lineWidth = 3;
    c.strokeStyle = shade(L.bag, -0.3); c.lineWidth = 4; c.beginPath(); c.moveTo(-bw * 0.4, shY + 2); c.lineTo(-bw - 8, hipY - 30); c.stroke();
    c.fillStyle = L.bag; c.strokeStyle = OUT; c.lineWidth = 3; rr(c, -bw - 22, hipY - 34, 34, 40, 4); c.fill(); c.stroke();
    c.fillStyle = '#1b1820'; c.beginPath(); c.arc(-bw - 5, hipY - 12, 9, 0, TAU); c.fill(); c.fillStyle = '#ff5fa2'; c.beginPath(); c.arc(-bw - 5, hipY - 12, 3, 0, TAU); c.fill();
  }

  function topColour(L) { return L.top === 'leather' ? '#1d1a1f' : L.top === 'denim' ? '#4d6fa8' : L.col; }

  function torso(c, L, bw, shY, hipY, th) {
    const col = topColour(L);
    c.fillStyle = col; c.strokeStyle = OUT; c.lineWidth = 3.2;
    rr(c, -bw, shY, bw * 2, th + 6, Math.min(26, bw)); c.fill(); c.stroke();
    c.save(); rr(c, -bw, shY, bw * 2, th + 6, Math.min(26, bw)); c.clip();
    if (L.pattern === 'stripes' && (L.top === 'tee' || L.top === 'turtleneck' || L.top === 'shirt')) { c.fillStyle = shade(col, col === '#111' || col === '#222' ? 0.35 : -0.25); for (let y = shY + 8; y < hipY; y += 14) c.fillRect(-bw, y, bw * 2, 6); }
    if (L.pattern === 'spots' && L.top !== 'leather') { c.fillStyle = shade(col, 0.45); for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(-bw + ((i * 29) % (bw * 2)), shY + 10 + ((i * 41) % th), 3.5, 0, TAU); c.fill(); } }
    const sh = c.createLinearGradient(-bw, 0, bw, 0); sh.addColorStop(0, 'rgba(255,255,255,.16)'); sh.addColorStop(0.55, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.2)');
    c.fillStyle = sh; c.fillRect(-bw, shY, bw * 2, th + 6); c.restore();
    c.strokeStyle = OUT; c.lineWidth = 3.2; rr(c, -bw, shY, bw * 2, th + 6, Math.min(26, bw)); c.stroke();
    const mid = shY + th / 2;
    c.lineWidth = 2.4;
    switch (L.top) {
      case 'hoodie':
        c.fillStyle = shade(col, -0.18); rr(c, -bw * 0.55, mid + 6, bw * 1.1, th * 0.28, 8); c.fill(); c.stroke();
        c.strokeStyle = '#eee'; c.beginPath(); c.moveTo(-6, shY + 4); c.lineTo(-7, shY + 26); c.moveTo(6, shY + 4); c.lineTo(7, shY + 26); c.stroke(); break;
      case 'leather':
        c.strokeStyle = '#8a8a96'; c.beginPath(); c.moveTo(4, shY + 2); c.lineTo(-2, hipY); c.stroke();
        c.fillStyle = '#2d2a31'; c.beginPath(); c.moveTo(-bw + 4, shY + 4); c.lineTo(-4, shY + 30); c.lineTo(-10, shY + 2); c.fill();
        c.beginPath(); c.moveTo(bw - 4, shY + 4); c.lineTo(8, shY + 30); c.lineTo(12, shY + 2); c.fill();
        c.fillStyle = '#c7c7d0'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-bw + 9, shY + 14 + i * 12, 2, 0, TAU); c.fill(); } break;
      case 'denim':
        c.strokeStyle = '#e9c46a'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(0, shY + 4); c.lineTo(0, hipY); c.moveTo(-bw + 6, shY + 26); c.lineTo(bw - 6, shY + 26); c.stroke(); c.setLineDash([]); break;
      case 'cardigan':
        c.fillStyle = '#f4efe1'; c.beginPath(); c.moveTo(-12, shY + 1); c.lineTo(0, shY + 40); c.lineTo(12, shY + 1); c.fill();
        c.fillStyle = shade(col, -0.35); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, shY + 48 + i * 13, 3, 0, TAU); c.fill(); } break;
      case 'suit':
        c.fillStyle = '#f4f4f4'; c.beginPath(); c.moveTo(-13, shY + 1); c.lineTo(0, shY + 44); c.lineTo(13, shY + 1); c.fill();
        c.fillStyle = '#c3001b'; c.beginPath(); c.moveTo(-3, shY + 6); c.lineTo(3, shY + 6); c.lineTo(5, shY + 38); c.lineTo(0, shY + 44); c.lineTo(-5, shY + 38); c.fill(); break;
      case 'turtleneck':
        c.fillStyle = shade(col, -0.15); rr(c, -14, shY - 10, 28, 16, 6); c.fill(); c.stroke(); break;
      case 'sequin':
        for (let i = 0; i < 26; i++) { const px = -bw + 6 + ((i * 37) % (bw * 2 - 12)), py = shY + 6 + ((i * 53) % (th - 6)); c.fillStyle = i % 2 ? '#fff' : shade(col, 0.5); c.beginPath(); c.arc(px, py, 1.8, 0, TAU); c.fill(); } break;
      case 'shirt':
        c.fillStyle = shade(col, 0.4); c.beginPath(); c.moveTo(-12, shY); c.lineTo(-2, shY + 14); c.lineTo(-14, shY + 12); c.fill(); c.beginPath(); c.moveTo(12, shY); c.lineTo(2, shY + 14); c.lineTo(14, shY + 12); c.fill();
        c.fillStyle = shade(col, -0.4); for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(0, shY + 22 + i * 14, 2.2, 0, TAU); c.fill(); } break;
      default: // tee with a little print
        c.fillStyle = shade(col, col === '#111' || col === '#222' ? 0.5 : 0.45); c.beginPath(); c.arc(0, mid - 4, 11, 0, TAU); c.fill();
        c.fillStyle = col; c.beginPath(); c.arc(0, mid - 4, 4, 0, TAU); c.fill();
    }
    if (L.acc === 'chain') { c.strokeStyle = '#ffd34d'; c.lineWidth = 3; c.beginPath(); c.arc(0, shY + 4, 16, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke(); }
  }

  function hairBack(c, L, hy) {
    const hc = L.hairCol; c.fillStyle = hc; c.strokeStyle = OUT; c.lineWidth = 3.2;
    if (L.hair === 'long') { rr(c, -40, hy - 22, 80, 96, 30); c.fill(); c.stroke(); }
    else if (L.hair === 'locs') { for (let i = -4; i <= 4; i++) { rr(c, i * 9 - 5, hy - 6, 11, 80 - Math.abs(i) * 4, 5); c.fill(); c.stroke(); } }
    else if (L.hair === 'braids') { for (const s of [-1, 1]) { rr(c, s * 34 - 6, hy - 6, 12, 64, 6); c.fill(); c.stroke(); } }
    else if (L.hair === 'afro') { c.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.moveTo(Math.cos(a) * 44, hy - 8 + Math.sin(a) * 40); c.arc(Math.cos(a) * 44, hy - 8 + Math.sin(a) * 40, 14, 0, TAU); } c.fill(); c.beginPath(); c.arc(0, hy - 8, 48, 0, TAU); c.fill(); c.stroke(); }
    else if (L.hair === 'curly') { c.beginPath(); for (let i = 0; i < 11; i++) { const a = Math.PI + i / 10 * Math.PI; c.moveTo(Math.cos(a) * 36, hy - 4 + Math.sin(a) * 32); c.arc(Math.cos(a) * 36, hy - 4 + Math.sin(a) * 32, 11, 0, TAU); } c.fill(); }
    else if (L.hair === 'bob') { rr(c, -40, hy - 30, 80, 66, 26); c.fill(); c.stroke(); }
    else if (L.hair === 'hood') { c.fillStyle = shade(L.col, -0.1); c.beginPath(); c.arc(0, hy - 2, 44, 0, TAU); c.fill(); c.stroke(); }
  }

  function head(c, L, hy, o) {
    const R = 34;
    c.fillStyle = L.skin; c.strokeStyle = OUT; c.lineWidth = 3.2;
    // ears
    for (const s of [-1, 1]) { c.beginPath(); c.arc(s * R, hy + 4, 8, 0, TAU); c.fill(); c.stroke(); }
    c.beginPath(); c.arc(0, hy, R, 0, TAU); c.fill();
    const hg = c.createRadialGradient(-12, hy - 14, 4, 0, hy, R); hg.addColorStop(0, 'rgba(255,255,255,.22)'); hg.addColorStop(0.6, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(60,20,30,.16)');
    c.fillStyle = hg; c.beginPath(); c.arc(0, hy, R, 0, TAU); c.fill(); c.stroke(); c.fillStyle = L.skin;
    if (L.acc === 'beard') { c.fillStyle = L.hairCol; c.beginPath(); c.arc(0, hy + 6, R - 1, 0.1 * Math.PI, 0.9 * Math.PI); c.quadraticCurveTo(0, hy + R + 22, R * Math.cos(0.1 * Math.PI), hy + 6 + R * Math.sin(0.1 * Math.PI)); c.fill(); c.stroke(); }
    if (L.acc === 'earrings') { c.fillStyle = '#ffd34d'; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * (R + 2), hy + 15, 4, 0, TAU); c.fill(); } }
    face(c, L, hy, o);
    hairFront(c, L, hy, R);
    // accessories on the face/head
    c.lineWidth = 3; c.strokeStyle = OUT;
    if (L.acc === 'glasses') { c.strokeStyle = '#2a1a24'; c.lineWidth = 2.6; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 13, hy, 10, 0, TAU); c.stroke(); } c.beginPath(); c.moveTo(-3, hy); c.lineTo(3, hy); c.stroke(); }
    if (L.acc === 'shades') { c.fillStyle = '#16121a'; for (const s of [-1, 1]) { rr(c, s * 13 - 12, hy - 8, 24, 15, 6); c.fill(); } c.fillRect(-4, hy - 4, 8, 3); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(-20, hy - 5, 6, 2); c.fillRect(6, hy - 5, 6, 2); }
    if (L.acc === 'piercing') { c.fillStyle = '#c7c7d0'; c.beginPath(); c.arc(9, hy + 9, 2.5, 0, TAU); c.fill(); c.beginPath(); c.arc(-R - 2, hy + 8, 3, 0, TAU); c.fill(); }
    if (L.acc === 'headphones') { c.strokeStyle = '#222'; c.lineWidth = 5; c.beginPath(); c.arc(0, hy + 30, 26, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); c.fillStyle = '#e23b3b'; for (const s of [-1, 1]) { rr(c, s * 24 - 7, hy + 38, 14, 16, 5); c.fill(); } }
  }

  function face(c, L, hy, o) {
    const f = o.face || 'neutral';
    const blink = o.blink;
    const ey = hy - 2;
    // eyes
    for (const s of [-1, 1]) {
      const ex = s * 12;
      if (f === 'joy') { c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.arc(ex, ey + 3, 6, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); continue; }
      if (f === 'love') { c.fillStyle = '#ff3f7f'; c.beginPath(); c.moveTo(ex, ey + 6); c.bezierCurveTo(ex - 11, ey - 2, ex - 6, ey - 10, ex, ey - 4); c.bezierCurveTo(ex + 6, ey - 10, ex + 11, ey - 2, ex, ey + 6); c.fill(); continue; }
      if (f === 'sus' || f === 'smug') { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey + 1, 7, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#20141c'; c.beginPath(); c.arc(ex + (f === 'sus' ? 2.5 : 0), ey + 1, 3, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 8, ey - 2); c.lineTo(ex + 8, ey - 2); c.stroke(); continue; }
      if (blink) { c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 5, ey); c.lineTo(ex + 5, ey); c.stroke(); continue; }
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, 7, f === 'wow' ? 9 : 8, 0, 0, TAU); c.fill();
      c.fillStyle = '#20141c'; c.beginPath(); c.arc(ex + (o.look || 0) * 2, ey + 1, f === 'wow' ? 3 : 4, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + 1.5, ey - 1.5, 1.3, 0, TAU); c.fill();
    }
    // brows
    c.strokeStyle = shade(L.hairCol || '#3b2414', -0.2); c.lineWidth = 3.4;
    const tilt = f === 'cross' || f === 'angry' ? 6 : f === 'meh' ? -2 : f === 'wow' ? -4 : f === 'sad' ? -6 : 0;
    for (const s of [-1, 1]) { const tt = f === 'sus' && s > 0 ? -5 : tilt; c.beginPath(); c.moveTo(s * 18, ey - 13 - (f === 'wow' ? 4 : 0) + (f === 'sad' ? 2 : 0)); c.lineTo(s * 6, ey - 13 + tt); c.stroke(); }
    if (f === 'angry') { c.fillStyle = 'rgba(230,40,40,.28)'; c.beginPath(); c.arc(0, hy, 33, 0, TAU); c.fill(); c.strokeStyle = '#c3001b'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(20, hy - 30); c.lineTo(28, hy - 22); c.moveTo(28, hy - 30); c.lineTo(20, hy - 22); c.stroke(); }
    // cheeks
    if (f === 'joy' || f === 'happy' || f === 'love') { c.fillStyle = 'rgba(255,90,110,.35)'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 20, hy + 10, 7, 4, 0, 0, TAU); c.fill(); } }
    // nose
    c.strokeStyle = shade(L.skin, -0.3); c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, hy + 2); c.quadraticCurveTo(4, hy + 8, -1, hy + 10); c.stroke();
    // mouth
    c.strokeStyle = OUT; c.lineWidth = 3; c.fillStyle = '#7a1f2e';
    const my = hy + 18;
    if (f === 'joy') { c.beginPath(); c.arc(0, my - 3, 11, 0.05 * Math.PI, 0.95 * Math.PI); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-7, my - 3, 14, 3); }
    else if (f === 'happy') { c.beginPath(); c.arc(0, my - 6, 9, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
    else if (f === 'wow') { c.beginPath(); c.ellipse(0, my, 5, 7, 0, 0, TAU); c.fill(); c.stroke(); }
    else if (f === 'cross') { c.beginPath(); c.arc(0, my + 6, 9, 1.2 * Math.PI, 1.8 * Math.PI); c.stroke(); }
    else if (f === 'meh') { c.beginPath(); c.moveTo(-7, my); c.lineTo(7, my - 2); c.stroke(); }
    else if (f === 'talk') { c.beginPath(); c.ellipse(0, my - 1, 7, 3 + Math.abs(Math.sin((o.t || 0) * 18)) * 4, 0, 0, TAU); c.fill(); c.stroke(); }
    else if (f === 'sad') { c.beginPath(); c.arc(0, my + 6, 8, 1.2 * Math.PI, 1.8 * Math.PI); c.stroke(); c.fillStyle = '#7fc8ff'; c.beginPath(); c.moveTo(-12, ey + 8); c.quadraticCurveTo(-17, ey + 18, -12, ey + 20); c.quadraticCurveTo(-7, ey + 18, -12, ey + 8); c.fill(); }
    else if (f === 'angry') { c.fillStyle = '#7a1f2e'; c.beginPath(); c.ellipse(0, my + 1, 9, 4, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-7, my - 1, 14, 2); }
    else if (f === 'smug') { c.beginPath(); c.moveTo(-8, my - 1); c.quadraticCurveTo(2, my + 3, 10, my - 6); c.stroke(); }
    else if (f === 'sus') { c.beginPath(); c.moveTo(-7, my); c.lineTo(7, my); c.stroke(); }
    else if (f === 'love') { c.beginPath(); c.arc(0, my - 6, 9, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
    else { c.beginPath(); c.arc(0, my - 4, 6, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke(); }
  }

  function hairFront(c, L, hy, R) {
    const hc = L.hairCol; c.fillStyle = hc; c.strokeStyle = OUT; c.lineWidth = 3.2;
    switch (L.hair) {
      case 'short': case 'braids': c.beginPath(); c.arc(0, hy - 4, R + 1, Math.PI * 1.02, Math.PI * 1.98); c.quadraticCurveTo(10, hy - 22, -R, hy - 6); c.fill(); c.stroke(); break;
      case 'quiff': c.beginPath(); c.arc(0, hy - 4, R + 1, Math.PI * 1.05, Math.PI * 1.95); c.quadraticCurveTo(26, hy - 60, -20, hy - 52); c.quadraticCurveTo(-34, hy - 40, -R, hy - 8); c.fill(); c.stroke(); break;
      case 'shaggy': case 'long': c.beginPath(); c.arc(0, hy - 2, R + 3, Math.PI * 1.0, Math.PI * 2.0); for (let i = 0; i < 6; i++) c.lineTo(R - i * 13, hy - 12 + (i % 2) * 10); c.closePath(); c.fill(); c.stroke(); break;
      case 'mohawk': for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(-7, hy - R + 6 + Math.abs(i) * 2 - i * 0); c.lineTo(i * 4, hy - R - 34 + Math.abs(i) * 5); c.lineTo(7, hy - R + 6); c.closePath(); c.fill(); c.stroke(); } break;
      case 'spiky': c.beginPath(); c.moveTo(-R, hy - 6); for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI; c.lineTo(Math.cos(a) * (R + (i % 2 ? 16 : 2)), hy - 4 + Math.sin(a) * (R + (i % 2 ? 16 : 2))); } c.closePath(); c.fill(); c.stroke(); break;
      case 'bob': c.beginPath(); c.arc(0, hy - 4, R + 2, Math.PI * 1.0, Math.PI * 2.0); c.lineTo(R + 2, hy - 8); c.lineTo(-R - 2, hy - 8); c.fill(); c.fillRect(-R - 2, hy - 14, 2 * R + 4, 10); break;
      case 'bun': c.beginPath(); c.arc(0, hy - R - 8, 15, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(0, hy - 4, R + 1, Math.PI * 1.05, Math.PI * 1.95); c.quadraticCurveTo(0, hy - 18, -R, hy - 8); c.fill(); c.stroke(); break;
      case 'afro': case 'curly': c.beginPath(); c.arc(0, hy - 6, R + 4, Math.PI * 1.05, Math.PI * 1.95); c.quadraticCurveTo(0, hy - 16, -R, hy - 10); c.fill(); break;
      case 'locs': c.beginPath(); c.arc(0, hy - 4, R + 2, Math.PI * 1.02, Math.PI * 1.98); c.quadraticCurveTo(0, hy - 14, -R, hy - 6); c.fill(); c.stroke(); break;
      case 'cap': c.fillStyle = shade(L.col, -0.05); c.beginPath(); c.arc(0, hy - 6, R + 2, Math.PI, TAU); c.closePath(); c.fill(); c.stroke(); rr(c, -R - 2, hy - 12, 2 * R + 30, 10, 5); c.fill(); c.stroke(); break;
      case 'beret': c.fillStyle = '#1b1b24'; c.beginPath(); c.ellipse(-6, hy - R + 2, R + 6, 14, -0.15, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(-4, hy - R - 12, 3, 0, TAU); c.fill(); break;
      case 'tam': { const cols = ['#d12d2d', '#ffd000', '#2fb35a']; for (let i = 0; i < 3; i++) { c.fillStyle = cols[i]; c.beginPath(); c.ellipse(0, hy - R - 2 - i * 9, R + 8 - i * 4, 11, 0, 0, TAU); c.fill(); c.stroke(); } break; }
      case 'buckethat': c.fillStyle = L.col; c.beginPath(); c.ellipse(0, hy - 14, R + 14, 9, 0, 0, TAU); c.fill(); c.stroke(); rr(c, -R + 4, hy - R - 14, 2 * R - 8, 30, 12); c.fill(); c.stroke(); break;
      case 'beanie': c.fillStyle = shade(L.col, 0.1); c.beginPath(); c.arc(0, hy - 16, R + 2, Math.PI, TAU); c.closePath(); c.fill(); c.stroke(); rr(c, -R - 3, hy - 27, 2 * R + 6, 12, 5); c.fill(); c.stroke(); break;
      case 'hood': c.fillStyle = shade(L.col, -0.1); c.beginPath(); c.arc(0, hy - 2, R + 9, Math.PI * 0.95, Math.PI * 2.05); c.lineTo(R - 2, hy + 4); c.arc(0, hy, R - 4, 0, Math.PI, true); c.closePath(); c.fill(); c.stroke(); break;
      case 'bald': c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-10, hy - 22, 9, 5, -0.4, 0, TAU); c.fill(); break;
    }
  }

  // ---------- the shop cat ----------
  function cat(c, x, y, sc, t, flip, sleeping) {
    c.save(); c.translate(x, y); c.scale(sc * (flip ? -1 : 1), sc);
    c.fillStyle = '#3a3036'; c.strokeStyle = OUT; c.lineWidth = 3;
    c.fillStyle = 'rgba(30,10,20,.2)'; c.beginPath(); c.ellipse(0, 2, 34, 6, 0, 0, TAU); c.fill();
    c.fillStyle = '#ef9a3a';
    if (sleeping) { c.beginPath(); c.ellipse(0, -14, 30, 16, 0, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(22, -20, 13, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = OUT; c.beginPath(); c.moveTo(17, -20); c.lineTo(22, -19); c.moveTo(25, -19); c.lineTo(30, -20); c.stroke(); c.restore(); return; }
    const w = Math.sin(t * 8);
    c.beginPath(); c.moveTo(-26, -24); c.quadraticCurveTo(-48, -40 + w * 6, -40, -60 + w * 4); c.lineWidth = 7; c.strokeStyle = '#ef9a3a'; c.stroke(); c.lineWidth = 3; c.strokeStyle = OUT;
    c.beginPath(); c.ellipse(0, -24, 30, 16, 0, 0, TAU); c.fill(); c.stroke();
    for (const lx of [-18, -8, 10, 20]) { rr(c, lx - 4, -14 + (lx % 20 ? Math.max(0, w) * 3 : 0), 8, 16, 4); c.fill(); c.stroke(); }
    c.beginPath(); c.arc(26, -38, 15, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(16, -48); c.lineTo(18, -62); c.lineTo(26, -52); c.moveTo(30, -52); c.lineTo(38, -62); c.lineTo(38, -46); c.fill(); c.stroke();
    c.fillStyle = '#20141c'; c.beginPath(); c.arc(21, -39, 2.5, 0, TAU); c.arc(32, -39, 2.5, 0, TAU); c.fill();
    c.fillStyle = '#d0603a'; for (const sx of [-14, -2, 10]) { c.beginPath(); c.ellipse(sx, -34, 3, 8, 0.2, 0, TAU); c.fill(); }
    c.restore();
  }



  // ---------- Oreo, a black-and-white cockapoo ----------
  // A scalloped "fluffy" ellipse: the curly cockapoo coat.
  function fluff(c, cx, cy, rx, ry, n, amp, rot) {
    n = n || 18; amp = amp || 4; rot = rot || 0;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const a0 = rot + (i / n) * TAU, a1 = rot + ((i + 0.5) / n) * TAU, a2 = rot + ((i + 1) / n) * TAU;
      const p = a => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
      const [x0, y0] = p(a0), [x2, y2] = p(a2);
      const bx = cx + Math.cos(a1) * (rx + amp), by = cy + Math.sin(a1) * (ry + amp);
      if (i === 0) c.moveTo(x0, y0); else c.quadraticCurveTo(bx, by, x2, y2);
    }
    c.closePath();
  }
  // little curls drawn over the black fur
  function curls(c, cx, cy, rx, ry, n, col, seed) {
    c.save(); c.strokeStyle = col; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const a = (i * 2.399 + (seed || 0)), r = Math.sqrt((i + 0.5) / n); const x = cx + Math.cos(a) * rx * r * 0.85, y = cy + Math.sin(a) * ry * r * 0.85; c.beginPath(); c.arc(x, y, 3.2, a, a + 3.6); c.stroke(); }
    c.restore();
  }

  // Side view, facing right, origin at the ground between the paws.
  // o: { pose: 'stand'|'walk'|'run'|'sit'|'lie'|'jump'|'beg'|'roll'|'sleep', phase, wag, age 0..1 (0 puppy, 1 old), blink, tongue, flip, look }
  function dog(c, x, y, s, o) {
    o = o || {};
    const age = o.age == null ? 0.5 : o.age;
    const pup = Math.max(0, 1 - age * 3);          // 1 = tiny puppy, fades out as he grows
    const old = Math.max(0, (age - 0.72) / 0.28);  // grey muzzle creeps in at the end
    const BLK = '#1d1b22', WHT = '#fbf7ee', GREY = shade('#1d1b22', 0.55 * old);
    const pose = o.pose || 'stand', ph = o.phase || 0, t = o.t || 0;
    c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 3.4;
    const headK = 1.18 + pup * 0.32;           // puppies have big heads
    const bodyL = 74 - pup * 18, legH = 34 - pup * 10;
    const run = pose === 'run', walk = pose === 'walk' || run;
    const bob = walk ? Math.abs(Math.sin(ph)) * (run ? 6 : 3) : pose === 'jump' ? -40 : 0;
    // shadow
    c.fillStyle = 'rgba(40,20,10,.22)'; c.beginPath(); c.ellipse(0, 2, 58, 9, 0, 0, TAU); c.fill();
    if (pose === 'sleep' || pose === 'lie') { lying(c, o, BLK, WHT, GREY, headK, bodyL, pose === 'sleep', t, old); c.restore(); return; }
    if (pose === 'roll') { c.rotate(Math.sin(t * 6) * 0.3); c.translate(0, -26); c.rotate(Math.PI); c.translate(0, -26); }
    const sit = pose === 'sit' || pose === 'beg';
    c.translate(0, -bob);
    // tail
    const wag = o.wag != null ? o.wag : Math.sin(t * (12 - age * 6)) * 0.6;
    c.save(); c.translate(-bodyL / 2 + 4, sit ? -26 : -legH - 26); c.rotate(-0.9 + wag * 0.6 + (sit ? 0.9 : 0));
    c.lineWidth = 3.4; c.strokeStyle = OUT; c.fillStyle = BLK; fluff(c, -12, -20, 11, 22, 10, 4, 0.3); c.fill(); c.stroke();
    c.fillStyle = WHT; fluff(c, -18, -36, 7, 7, 7, 3); c.fill(); c.stroke();
    c.restore(); c.lineWidth = 3.4; c.strokeStyle = OUT;
    // back legs
    const leg = (lx, ly, ang, col, sock) => { c.save(); c.translate(lx, ly); c.rotate(ang); c.fillStyle = col; rr(c, -8.5, 0, 17, legH + 2, 8); c.fill(); c.stroke(); if (sock) { c.fillStyle = WHT; fluff(c, 0, legH - 3, 10, 7, 8, 2.5); c.fill(); c.stroke(); } c.restore(); };
    if (sit) {
      c.fillStyle = BLK; c.beginPath(); c.ellipse(-bodyL / 2 + 16, -18, 24, 18, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = WHT; rr(c, -bodyL / 2 + 22, -8, 24, 10, 5); c.fill(); c.stroke();
    } else {
      const sw = walk ? Math.sin(ph) * (run ? 0.7 : 0.4) : 0;
      leg(-bodyL / 2 + 12, -legH - 4, sw, shade(BLK, 0.08), true);
      leg(-bodyL / 2 + 22, -legH - 4, -sw, BLK, true);
    }
    // body
    c.save(); if (sit) { c.translate(-6, -legH - 6); c.rotate(-0.85); c.translate(6, legH + 6); }
    c.fillStyle = BLK; fluff(c, 0, -legH - 18, bodyL / 2, 22 - pup * 2, 22, 4.5); c.fill(); c.stroke();
    curls(c, -6, -legH - 22, bodyL / 2 - 10, 14, 14, 'rgba(255,255,255,.13)', 1);
    // white chest and belly
    c.save(); c.beginPath(); c.ellipse(0, -legH - 18, bodyL / 2 - 2, 20 - pup * 2, 0, 0, TAU); c.clip();
    c.fillStyle = WHT; c.beginPath(); c.ellipse(bodyL / 2 - 8, -legH - 10, 22, 22, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(4, -legH - 2, bodyL / 2 - 10, 9, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(-6, -legH - 32, bodyL / 2 - 10, 6, 0, 0, TAU); c.fill();
    c.restore(); c.restore();
    // front legs
    if (pose === 'beg') { leg(bodyL / 2 - 14, -legH - 30, -1.6, BLK, true); leg(bodyL / 2 - 8, -legH - 26, -1.3, BLK, true); }
    else if (sit) { leg(bodyL / 2 - 26, -legH - 4, 0.02, BLK, true); leg(bodyL / 2 - 16, -legH - 4, -0.02, BLK, true); }
    else if (pose === 'jump') { leg(bodyL / 2 - 14, -legH - 10, -1.1, BLK, true); leg(bodyL / 2 - 6, -legH - 10, -0.9, BLK, true); }
    else { const sw = walk ? Math.sin(ph + Math.PI) * (run ? 0.8 : 0.4) : 0; leg(bodyL / 2 - 16, -legH - 4, sw, shade(BLK, 0.08), true); leg(bodyL / 2 - 6, -legH - 4, -sw, BLK, true); }
    // collar
    const hx = bodyL / 2 + 4 - (sit ? 18 : 0), hy = -legH - 44 - (sit ? 28 : 0) + (pose === 'beg' ? -8 : 0);
    c.fillStyle = '#e5203a'; c.save(); c.translate(hx - 8, hy + 18); c.rotate(-0.5); rr(c, -6, -14, 12, 28, 5); c.fill(); c.stroke(); c.restore();
    c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(hx - 2, hy + 30, 5, 0, TAU); c.fill(); c.stroke();
    dogHead(c, hx, hy, headK, o, BLK, WHT, GREY, t, old);
    c.restore();
  }

  function dogHead(c, hx, hy, k, o, BLK, WHT, GREY, t, old) {
    c.save(); c.translate(hx, hy); c.scale(k, k); c.rotate(o.tilt || Math.sin(t * 0.7) * 0.04);
    // back ear (long and curly)
    c.fillStyle = shade(BLK, 0.1); for (let i = 0; i < 4; i++) { fluff(c, -14 - i * 1.5, -8 + i * 9, 10 - i, 8, 8, 2.5); c.fill(); c.stroke(); }
    // head: round and fluffy, with a curly top-knot
    c.fillStyle = BLK; fluff(c, 0, -10, 25, 23, 16, 4); c.fill(); c.stroke();
    fluff(c, 0, -32, 13, 8, 9, 3.5); c.fill(); c.stroke();
    curls(c, -2, -20, 18, 12, 9, 'rgba(255,255,255,.14)', 2);
    // white blaze down the face and a white muzzle
    c.save(); c.beginPath(); c.ellipse(0, -10, 23, 21, 0, 0, TAU); c.clip();
    c.fillStyle = WHT; c.beginPath(); c.moveTo(6, -34); c.quadraticCurveTo(14, -20, 16, -4); c.lineTo(4, -2); c.quadraticCurveTo(2, -20, 6, -34); c.fill();
    c.restore();
    c.fillStyle = old > 0 ? shade(WHT, -0.06) : WHT; fluff(c, 18, -1, 15, 12, 12, 3); c.fill(); c.stroke();
    // a fluffy white beard under the chin
    fluff(c, 14, 10, 10, 6, 8, 3); c.fill(); c.stroke();
    if (old > 0) { c.fillStyle = `rgba(200,200,205,${0.9 * old})`; c.beginPath(); c.ellipse(4, -16, 12, 8, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(16, -24, 7, 4, 0.4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(-10, -2, 8, 10, 0, 0, TAU); c.fill(); }
    // eye
    const ey = -14, ex = 8;
    if (o.blink || o.sleepy) { c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.arc(ex, ey + 1, 5, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke(); }
    else {
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, 7, 8, 0, 0, TAU); c.fill();
      c.fillStyle = '#5a3416'; c.beginPath(); c.arc(ex + 1.5 + (o.look || 0), ey + 1, 5.5, 0, TAU); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(ex + 2 + (o.look || 0), ey + 1, 3, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + 0.5, ey - 2, 2.2, 0, TAU); c.fill();
      // eyebrow dot: the "puppy eyes"
      c.fillStyle = '#b08a6a'; c.beginPath(); c.ellipse(ex - 2, ey - 11, 4, 2.5, -0.3, 0, TAU); c.fill();
    }
    // nose and mouth
    c.fillStyle = '#111'; c.beginPath(); c.ellipse(31, -6, 6, 5, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(30, -8, 1.6, 0, TAU); c.fill();
    c.strokeStyle = OUT; c.lineWidth = 2.6; c.beginPath(); c.moveTo(30, 0); c.quadraticCurveTo(27, 6, 20, 4); c.stroke();
    if (o.tongue) { c.fillStyle = '#ff7aa0'; c.beginPath(); c.ellipse(23, 9 + Math.sin(t * 10) * 1.5, 5, 8, 0.2, 0, TAU); c.fill(); c.stroke(); }
    if (o.ball) { c.fillStyle = '#c6f03a'; c.beginPath(); c.arc(34, 6, 9, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(30, 6, 7, -0.8, 0.8); c.stroke(); }
    // front ear, floppy
    c.strokeStyle = OUT; c.lineWidth = 3.4;
    const flop = Math.sin(t * 5) * 0.08 + (o.ears || 0);
    c.save(); c.translate(-6, -22); c.rotate(0.25 + flop); c.fillStyle = BLK; for (let i = 0; i < 5; i++) { fluff(c, -4 + Math.sin(i * 1.3) * 2, i * 8, 11 - i * 0.6, 8, 8, 3); c.fill(); c.stroke(); } curls(c, -4, 16, 6, 14, 5, 'rgba(255,255,255,.15)', 3); c.restore();
    // a little shine on the head
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(-4, -24, 10, 4, -0.3, 0, TAU); c.fill();
    c.restore();
  }

  function lying(c, o, BLK, WHT, GREY, headK, bodyL, asleep, t, old) {
    const br = asleep ? Math.sin(t * 1.6) * 1.5 : 0;
    // tail curled round
    c.lineWidth = 3.4; c.strokeStyle = OUT; c.fillStyle = BLK; fluff(c, -bodyL / 2 - 6, -10, 14, 10, 9, 3.5); c.fill(); c.stroke();
    c.fillStyle = BLK; fluff(c, 0, -18 - br, bodyL / 2 + 4, 20 + br, 22, 4.5); c.fill(); c.stroke();
    curls(c, -6, -22, bodyL / 2 - 8, 12, 14, 'rgba(255,255,255,.13)', 4);
    c.save(); c.beginPath(); c.ellipse(0, -18 - br, bodyL / 2 + 2, 18 + br, 0, 0, TAU); c.clip(); c.fillStyle = WHT; c.beginPath(); c.ellipse(bodyL / 2 - 6, -8, 20, 16, 0, 0, TAU); c.fill(); c.restore();
    // paws out front
    c.fillStyle = BLK; rr(c, bodyL / 2 - 10, -12, 36, 12, 6); c.fill(); c.stroke(); c.fillStyle = WHT; rr(c, bodyL / 2 + 14, -12, 14, 12, 6); c.fill(); c.stroke();
    dogHead(c, bodyL / 2 + 8, -24, headK, Object.assign({}, o, { blink: asleep || o.blink, sleepy: asleep, tilt: asleep ? 0.25 : 0.1, ears: 0.3 }), BLK, WHT, GREY, t, old);
    if (asleep) { c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '700 16px Fredoka, sans-serif'; for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; c.globalAlpha = 1 - k; c.fillText('z', bodyL / 2 + 30 + k * 30, -60 - k * 40 - i * 4); } c.globalAlpha = 1; }
  }

  // ---------- places ----------
  // Every place is painted once per time of day and cached; things that move are drawn on top.
  const cache = {};
  function place(W, H, id, tod) {
    const key = id + '|' + tod; if (cache[key]) return cache[key];
    const cv = G.document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const SKY = { morning: ['#9fd6ff', '#fff1d6'], day: ['#7ec8ff', '#d9f1ff'], evening: ['#ff9a6a', '#ffd9a0'], night: ['#152048', '#3a3a6a'] }[tod] || ['#7ec8ff', '#d9f1ff'];
    const sky = c.createLinearGradient(0, 0, 0, H * 0.7); sky.addColorStop(0, SKY[0]); sky.addColorStop(1, SKY[1]);
    const fy = H * 0.74;
    if (id === 'home' || id === 'night' || id === 'vet') {
      const wall = id === 'vet' ? ['#cfeee6', '#e6f7f2'] : id === 'night' ? ['#2a2a4a', '#3a3658'] : ['#f6d7b0', '#fbe6c8'];
      const g = c.createLinearGradient(0, 0, 0, fy); g.addColorStop(0, wall[0]); g.addColorStop(1, wall[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < W; x += 70) c.fillRect(x, 0, 34, fy);
      // window
      const wx = 90, wy = 90, ww = 300, wh = 260;
      c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
      if (id === 'night') { c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(wx + 220, wy + 70, 28, 0, TAU); c.fill(); c.fillStyle = SKY[0]; c.beginPath(); c.arc(wx + 232, wy + 62, 25, 0, TAU); c.fill(); for (let i = 0; i < 30; i++) { c.fillStyle = '#fff'; c.fillRect(wx + (i * 53) % ww, wy + (i * 29) % (wh * 0.7), 2, 2); } }
      else { c.fillStyle = '#7cc56a'; c.beginPath(); c.ellipse(wx + 80, wy + wh, 140, 70, 0, 0, TAU); c.fill(); c.fillStyle = '#5fae55'; c.beginPath(); c.ellipse(wx + 240, wy + wh + 10, 120, 80, 0, 0, TAU); c.fill(); cloud(c, wx + 90, wy + 70, 0.8); }
      c.strokeStyle = '#fff8ee'; c.lineWidth = 14; c.strokeRect(wx, wy, ww, wh); c.lineWidth = 7; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.stroke();
      c.fillStyle = id === 'vet' ? '#7fc8c0' : '#d9604c'; for (const sx of [wx - 40, wx + ww - 6]) { c.beginPath(); c.moveTo(sx, wy - 20); c.quadraticCurveTo(sx + 40, wy + wh / 2, sx + 10, wy + wh + 40); c.lineTo(sx + 46, wy + wh + 40); c.quadraticCurveTo(sx + 56, wy + wh / 2, sx + 46, wy - 20); c.fill(); }
      // floor
      const fl = c.createLinearGradient(0, fy, 0, H); fl.addColorStop(0, id === 'vet' ? '#b8d8d0' : '#a87048'); fl.addColorStop(1, id === 'vet' ? '#d8eee8' : '#c98b5e'); c.fillStyle = fl; c.fillRect(0, fy, W, H - fy);
      c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 2; for (let y = fy + 16; y < H; y += 20 + (y - fy) * 0.12) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.fillStyle = '#fff8ee'; c.fillRect(0, fy - 10, W, 12);
      if (id === 'vet') {
        c.fillStyle = '#e8f4f8'; c.strokeStyle = OUT; c.lineWidth = 4; rr(c, W - 470, fy - 150, 320, 26, 8); c.fill(); c.stroke(); c.fillStyle = '#9aa3b5'; c.fillRect(W - 330, fy - 124, 40, 124);
        c.fillStyle = '#fff'; rr(c, W - 560, 120, 200, 140, 8); c.fill(); c.stroke(); c.fillStyle = '#e5203a'; c.fillRect(W - 475, 150, 30, 80); c.fillRect(W - 500, 175, 80, 30);
        c.fillStyle = '#ffcf3f'; c.beginPath(); c.arc(W - 200, fy - 170, 18, 0, TAU); c.fill(); c.stroke();
      } else {
        // rug, sofa, fireplace, dog bed, family photos
        c.save(); c.translate(W / 2 + 40, fy + 90); c.scale(1, 0.24); ['#7a9ad8', '#f4e2b8', '#7a9ad8', '#fff4dc'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(0, 0, 420 - i * 70, 0, TAU); c.fill(); }); c.restore();
        c.strokeStyle = OUT; c.lineWidth = 4;
        c.fillStyle = id === 'night' ? '#3a2a3a' : '#6b3e22'; rr(c, W - 360, fy - 250, 260, 250, 10); c.fill(); c.stroke();
        c.fillStyle = '#2a1a1a'; rr(c, W - 320, fy - 170, 180, 170, 70); c.fill(); c.stroke();
        c.fillStyle = '#c86a3d'; c.fillRect(W - 380, fy - 270, 300, 26); c.strokeRect(W - 380, fy - 270, 300, 26);
        for (let i = 0; i < 3; i++) { c.fillStyle = '#c98b3c'; c.fillRect(W - 360 + i * 90, fy - 360, 66, 74); c.fillStyle = ['#ffd6e0', '#cfe8ff', '#d8f5c8'][i]; c.fillRect(W - 354 + i * 90, fy - 354, 54, 62); c.fillStyle = '#1d1b22'; c.beginPath(); c.ellipse(W - 327 + i * 90, fy - 312, 12, 8, 0, 0, TAU); c.fill(); c.fillStyle = '#fbf7ee'; c.beginPath(); c.arc(W - 318 + i * 90, fy - 318, 5, 0, TAU); c.fill(); }
        c.fillStyle = '#e29a5a'; rr(c, 470, fy - 160, 360, 110, 30); c.fill(); c.stroke(); rr(c, 450, fy - 80, 400, 80, 22); c.fill(); c.stroke();
        c.fillStyle = '#ffcf3f'; rr(c, 500, fy - 150, 70, 54, 14); c.fill(); c.stroke(); c.fillStyle = '#7fc8ff'; rr(c, 720, fy - 150, 70, 54, 14); c.fill(); c.stroke();
        // dog bed
        c.fillStyle = '#c3412b'; c.beginPath(); c.ellipse(260, fy + 70, 120, 34, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#f4e2b8'; c.beginPath(); c.ellipse(260, fy + 64, 96, 22, 0, 0, TAU); c.fill();
      }
      if (id === 'night') { c.fillStyle = 'rgba(10,10,40,.45)'; c.fillRect(0, 0, W, H); const mg = c.createRadialGradient(240, 220, 20, 240, 400, 500); mg.addColorStop(0, 'rgba(200,210,255,.25)'); mg.addColorStop(1, 'rgba(200,210,255,0)'); c.fillStyle = mg; c.fillRect(0, 0, W, H); }
      else if (id === 'home') { c.save(); c.globalCompositeOperation = 'soft-light'; const fg = c.createRadialGradient(W - 230, fy - 80, 20, W - 230, fy - 80, 520); fg.addColorStop(0, 'rgba(255,170,80,.9)'); fg.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = fg; c.fillRect(0, 0, W, H); c.restore(); }
    } else {
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      if (tod === 'evening' || id === 'sunset') { c.fillStyle = 'rgba(255,230,150,.9)'; c.beginPath(); c.arc(W * 0.7, fy - 90, 70, 0, TAU); c.fill(); const sg = c.createRadialGradient(W * 0.7, fy - 90, 60, W * 0.7, fy - 90, 420); sg.addColorStop(0, 'rgba(255,200,120,.6)'); sg.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, H); }
      else { c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(W * 0.82, 120, 48, 0, TAU); c.fill(); }
      for (const [x, y, s] of [[160, 120, 1], [560, 80, 0.8], [980, 170, 1.1]]) cloud(c, x, y, s);
      if (id === 'beach') {
        c.fillStyle = '#3aa0d8'; c.fillRect(0, H * 0.5, W, H * 0.16); c.fillStyle = '#58b8e8'; c.fillRect(0, H * 0.5, W, 8);
        c.fillStyle = '#f2d79a'; c.beginPath(); c.moveTo(0, H * 0.62); for (let x = 0; x <= W; x += 40) c.lineTo(x, H * 0.62 + Math.sin(x / 90) * 8); c.lineTo(W, H); c.lineTo(0, H); c.fill();
        c.fillStyle = '#e8c88a'; for (let i = 0; i < 50; i++) { c.beginPath(); c.arc((i * 131) % W, H * 0.7 + (i * 47) % (H * 0.3), 2, 0, TAU); c.fill(); }
        c.fillStyle = '#e5203a'; c.beginPath(); c.moveTo(W - 260, fy - 150); c.quadraticCurveTo(W - 170, fy - 210, W - 80, fy - 150); c.closePath(); c.fill(); c.strokeStyle = OUT; c.lineWidth = 4; c.stroke(); c.fillStyle = '#fff'; c.fillRect(W - 174, fy - 150, 6, 160);
      } else {
        const snow = id === 'snow';
        // far hills, trees, grass
        c.fillStyle = snow ? '#e8eef8' : '#8fd07a'; c.beginPath(); c.moveTo(0, fy - 120); for (let x = 0; x <= W; x += 80) c.lineTo(x, fy - 120 - Math.sin(x / 210) * 50 - 30); c.lineTo(W, fy); c.lineTo(0, fy); c.fill();
        if (id !== 'garden' && id !== 'sunset') for (const [x, s] of [[120, 1.1], [330, 0.8], [980, 1.2], [1170, 0.9]]) tree(c, x, fy - 30, s, snow);
        c.fillStyle = snow ? '#f6f9ff' : '#6cc05a'; c.fillRect(0, fy - 40, W, H - fy + 40);
        c.fillStyle = snow ? 'rgba(180,200,230,.5)' : 'rgba(255,255,255,.12)'; for (let i = 0; i < 70; i++) c.fillRect((i * 97) % W, fy - 20 + (i * 53) % (H - fy + 10), 3, 8);
        if (id === 'park' || id === 'snow') {
          c.fillStyle = snow ? '#dfe6f0' : '#e8d4a8'; c.beginPath(); c.moveTo(0, fy + 40); c.quadraticCurveTo(W / 2, fy - 10, W, fy + 50); c.lineTo(W, fy + 110); c.quadraticCurveTo(W / 2, fy + 50, 0, fy + 100); c.fill();
          c.fillStyle = snow ? '#b8d4f0' : '#5aaee0'; c.beginPath(); c.ellipse(W - 260, fy + 10, 150, 30, 0, 0, TAU); c.fill();
          c.fillStyle = '#7a4a2a'; c.strokeStyle = OUT; c.lineWidth = 4; rr(c, 520, fy - 70, 180, 14, 4); c.fill(); c.stroke(); rr(c, 520, fy - 100, 180, 12, 4); c.fill(); c.stroke(); c.fillRect(530, fy - 56, 10, 40); c.fillRect(680, fy - 56, 10, 40);
        }
        if (id === 'garden' || id === 'sunset') {
          c.fillStyle = '#c98b5e'; for (let x = 0; x < W; x += 46) { c.fillRect(x, fy - 160, 38, 130); c.beginPath(); c.moveTo(x, fy - 160); c.lineTo(x + 19, fy - 180); c.lineTo(x + 38, fy - 160); c.fill(); }
          c.fillStyle = '#a8704a'; c.fillRect(0, fy - 130, W, 12); c.fillRect(0, fy - 70, W, 12);
          // kennel
          c.strokeStyle = OUT; c.lineWidth = 4; c.fillStyle = '#d9604c'; c.beginPath(); c.moveTo(W - 330, fy - 60); c.lineTo(W - 240, fy - 140); c.lineTo(W - 150, fy - 60); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#e8b47a'; c.fillRect(W - 320, fy - 62, 160, 90); c.strokeRect(W - 320, fy - 62, 160, 90); c.fillStyle = '#3a2214'; c.beginPath(); c.moveTo(W - 270, fy + 28); c.lineTo(W - 270, fy - 10); c.arc(W - 240, fy - 10, 30, Math.PI, TAU); c.lineTo(W - 210, fy + 28); c.fill();
          c.fillStyle = '#fff'; c.font = '700 16px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText('OREO', W - 240, fy - 40);
          // flowers
          for (let i = 0; i < 16; i++) { const x = 40 + i * 75, y = fy - 30 + (i % 3) * 6; c.strokeStyle = '#3a8a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y + 30); c.lineTo(x, y); c.stroke(); c.fillStyle = ['#ff6b8f', '#ffd43b', '#b48cff', '#fff'][i % 4]; for (let p = 0; p < 5; p++) { c.beginPath(); c.arc(x + Math.cos(p * 1.26) * 6, y + Math.sin(p * 1.26) * 6, 5, 0, TAU); c.fill(); } c.fillStyle = '#f2a03b'; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill(); }
        }
      }
      if (tod === 'evening' || id === 'sunset') { c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(255,130,60,.55)'; c.fillRect(0, 0, W, H); c.restore(); }
      if (tod === 'night') { c.fillStyle = 'rgba(10,10,50,.45)'; c.fillRect(0, 0, W, H); }
    }
    const v = c.createRadialGradient(W / 2, H * 0.5, H * 0.45, W / 2, H * 0.5, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,20,10,.35)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    cache[key] = cv; return cv;
  }
  function cloud(c, x, y, s) { c.save(); c.globalAlpha = 0.92; c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 34 * s, 0, TAU); c.moveTo(x + 82 * s, y - 16 * s); c.arc(x + 40 * s, y - 16 * s, 42 * s, 0, TAU); c.moveTo(x + 116 * s, y); c.arc(x + 84 * s, y, 32 * s, 0, TAU); c.moveTo(x, y); c.rect(x, y - 4 * s, 84 * s, 34 * s); c.fill('nonzero'); c.restore(); }
  function tree(c, x, y, s, snow) {
    c.fillStyle = '#7a4a2a'; c.strokeStyle = OUT; c.lineWidth = 4; rr(c, x - 12 * s, y - 120 * s, 24 * s, 120 * s, 6); c.fill(); c.stroke();
    c.fillStyle = snow ? '#e8f0fa' : '#3f9a4a'; for (const [dx, dy, r] of [[0, -170, 70], [-50, -130, 52], [50, -130, 52], [0, -110, 56]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); c.fill(); c.stroke(); }
    c.fillStyle = snow ? '#fff' : '#58b062'; c.beginPath(); c.arc(x - 18 * s, y - 190 * s, 26 * s, 0, TAU); c.fill();
  }

  G.OREO_ART = { person, dog, place, rr, shade, cloud };
})(typeof window !== 'undefined' ? window : globalThis);

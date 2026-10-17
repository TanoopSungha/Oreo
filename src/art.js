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
  // o: { walk (phase or null), face, blink, arm: 'idle'|'wave'|'hold'|'cheer'|'cross'|'point'|'think'|'shrug'|'facepalm', holdCol, flip, t }
  function person(c, L, x, foot, sc, o) {
    o = o || {};
    const h = (L.h || 1), b = (L.build || 1);
    c.save(); c.translate(x, foot); c.scale(sc * (o.flip ? -1 : 1), sc);
    const t = o.t || 0, seed = L.seed || 0;
    const walking = o.walk != null;
    const step = walking ? Math.sin(o.walk) : 0;
    const breathe = Math.sin(t * 2.4 + seed) * 1.4;
    const sway = walking ? step * 1.8 : Math.sin(t * 1.5 + seed) * 1.2;
    const bob = (walking ? Math.abs(Math.sin(o.walk * 2)) * 4.5 : Math.max(0, breathe)) + (o.groove || 0) * 4;
    c.lineWidth = 3.2; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = OUT;
    const legH = 62 * h, torsoH = 82 * h, bw = 30 * b * (1 + breathe * 0.008);
    const hipY = -legH - bob, shY = hipY - torsoH, headY = shY - 34;
    // shadow
    c.fillStyle = 'rgba(30,10,20,.22)'; c.beginPath(); c.ellipse(sway * 0.4, 2, bw * 1.4, 8, 0, 0, TAU); c.fill();
    // long hair behind
    c.save(); c.translate(sway, 0); hairBack(c, L, headY, t); c.restore();
    // articulated 2-joint legs
    const legCol = L.legs || '#2b3a67';
    for (const sgn of [-1, 1]) {
      const ph = walking ? o.walk + (sgn < 0 ? 0 : Math.PI) : 0;
      const stride = walking ? Math.sin(ph) : 0;
      const lift = walking ? Math.max(0, -Math.cos(ph)) * 13 : 0;
      const hx = sgn * bw * 0.44 + sway * 0.4, hy = hipY;
      const kx = hx + stride * 9 + (walking ? 3 : 0), ky = hy + legH * 0.52 - lift * 0.45;
      const ax = hx + stride * 15 - lift * 0.25, ay = -6 - lift;
      c.strokeStyle = OUT; c.lineWidth = 22; c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(kx, ky, ax, ay); c.stroke();
      c.strokeStyle = legCol; c.lineWidth = 15.5; c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(kx, ky, ax, ay); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 4; c.beginPath(); c.moveTo(hx - 2, hy + 4); c.quadraticCurveTo(kx - 2, ky, ax - 2, ay - 4); c.stroke();
      c.save(); c.translate(ax, ay); c.rotate(walking ? stride * 0.22 - lift * 0.018 : 0);
      c.lineWidth = 3.2; c.strokeStyle = OUT; c.fillStyle = L.shoes || '#231a1a';
      rr(c, -11 + sgn * 2, -6, 26, 13, 6); c.fill(); c.stroke();
      c.fillStyle = '#e8e0d5'; c.fillRect(-9 + sgn * 2, 4, 22, 2.5);
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(2, -4); c.lineTo(7, -2); c.moveTo(3, -1); c.lineTo(8, 1); c.stroke();
      c.restore();
    }
    // articulated arms with elbows and hands
    const arm = o.arm || 'idle';
    const sleeve = topColour(L);
    const handCol = L.skin;
    function limb(sx, sy, ex, ey, bend) {
      const mx = (sx + ex) / 2 + (bend || 0), my = (sy + ey) / 2 + Math.abs(bend || 0) * 0.22;
      c.strokeStyle = OUT; c.lineWidth = 17.5; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
      c.strokeStyle = sleeve; c.lineWidth = 11.5; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
      const ang = Math.atan2(ey - my, ex - mx);
      c.save(); c.translate(ex, ey); c.rotate(ang);
      c.fillStyle = handCol; c.lineWidth = 3; c.strokeStyle = OUT;
      c.beginPath(); c.ellipse(0, 0, 8, 6.8, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.arc(-1, -5.5, 3.2, 0, TAU); c.fill(); c.stroke();
      c.restore();
    }
    const swing = walking ? step * 13 : Math.sin(t * 1.8 + seed) * 2.5;
    const ax = bw + 1, ay = shY + 12;
    const arms = {
      idle: [[-ax + sway, ay, -ax - 8 - swing * 0.5 + sway, hipY + 6 + swing * 0.7, -5], [ax + sway, ay, ax + 8 + swing * 0.5 + sway, hipY + 6 - swing * 0.7, 5]],
      wave: [[-ax + sway, ay, -ax - 8 + sway, hipY + 6, -5], [ax + sway, ay, ax + 28 + Math.sin(t * 11) * 10 + sway, ay - 42 + Math.cos(t * 11) * 4, 14]],
      cheer: [[-ax + sway, ay, -ax - 24 + sway, ay - 52 + Math.sin(t * 14) * 6, -12], [ax + sway, ay, ax + 24 + sway, ay - 52 - Math.sin(t * 14) * 6, 12]],
      hold: [[-ax + sway, ay, -10 + sway, ay + 30, -10], [ax + sway, ay, 10 + sway, ay + 30, 10]],
      cross: [[-ax + sway, ay, bw * 0.6 + sway, ay + 26, -8], [ax + sway, ay, -bw * 0.6 + sway, ay + 30, 8]],
      point: [[-ax + sway, ay, -ax - 8 + sway, hipY + 6, -5], [ax + sway, ay, ax + 42 + sway, ay + 2 + Math.sin(t * 6) * 2, 6]],
      think: [[-ax + sway, ay, -ax - 8 + sway, hipY + 6, -5], [ax + sway, ay, 12 + sway, headY + 28, 18]],
      dig: [[-ax + sway, ay, -16 + sway, hipY - 4 + Math.sin(t * 7) * 5, -8], [ax + sway, ay, 18 + sway, hipY - 8 + Math.cos(t * 7) * 5, 8]],
    }[arm] || [[-ax + sway, ay, -ax - 8 + sway, hipY + 6, -5], [ax + sway, ay, ax + 8 + sway, hipY + 6, 5]];
    // torso
    c.save(); c.translate(sway, 0); c.rotate(walking ? step * 0.025 : Math.sin(t * 1.5 + seed) * 0.01);
    torso(c, L, bw, shY, hipY, torsoH);
    if (L.bag) bag(c, L, bw, shY, hipY);
    c.restore();
    const frontArm = ['cross', 'hold', 'dig', 'think'].includes(arm);
    if (!frontArm) arms.forEach(a => limb(...a));
    // neck + head with subtle tilt
    c.save();
    const headTilt = (o.face === 'talk' ? Math.sin(t * 6) * 0.045 : Math.sin(t * 1.3 + seed) * 0.02) + (o.groove || 0) * Math.sin(t * 8) * 0.05;
    c.translate(sway, shY - 6); c.rotate(headTilt); c.translate(0, -(shY - 6));
    c.fillStyle = shade(L.skin, -0.08); c.strokeStyle = OUT; c.lineWidth = 3.2; rr(c, -9, shY - 12, 18, 16, 5); c.fill(); c.stroke();
    head(c, L, headY, o);
    c.restore();
    if (frontArm) arms.forEach(a => limb(...a));
    c.restore();
  }

  function bag(c, L, bw, shY, hipY) {
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
      default:
        c.fillStyle = shade(col, col === '#111' || col === '#222' ? 0.5 : 0.45); c.beginPath(); c.arc(0, mid - 4, 11, 0, TAU); c.fill();
        c.fillStyle = col; c.beginPath(); c.arc(0, mid - 4, 4, 0, TAU); c.fill();
    }
    if (L.acc === 'chain') { c.strokeStyle = '#ffd34d'; c.lineWidth = 3; c.beginPath(); c.arc(0, shY + 4, 16, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke(); }
  }

  function hairBack(c, L, hy, t) {
    const hc = L.hairCol, sw = Math.sin((t || 0) * 2.5 + (L.seed || 0)) * 2;
    c.fillStyle = hc; c.strokeStyle = OUT; c.lineWidth = 3.2;
    if (L.hair === 'long') { rr(c, -40 + sw * 0.5, hy - 22, 80, 96, 30); c.fill(); c.stroke(); }
    else if (L.hair === 'locs') { for (let i = -4; i <= 4; i++) { rr(c, i * 9 - 5 + sw * 0.4, hy - 6, 11, 80 - Math.abs(i) * 4, 5); c.fill(); c.stroke(); } }
    else if (L.hair === 'braids') { for (const s of [-1, 1]) { rr(c, s * 34 - 6 + sw * 0.5, hy - 6, 12, 64, 6); c.fill(); c.stroke(); } }
    else if (L.hair === 'afro') { c.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.moveTo(Math.cos(a) * 44, hy - 8 + Math.sin(a) * 40); c.arc(Math.cos(a) * 44, hy - 8 + Math.sin(a) * 40, 14, 0, TAU); } c.fill(); c.beginPath(); c.arc(0, hy - 8, 48, 0, TAU); c.fill(); c.stroke(); }
    else if (L.hair === 'curly') { c.beginPath(); for (let i = 0; i < 11; i++) { const a = Math.PI + i / 10 * Math.PI; c.moveTo(Math.cos(a) * 36, hy - 4 + Math.sin(a) * 32); c.arc(Math.cos(a) * 36, hy - 4 + Math.sin(a) * 32, 11, 0, TAU); } c.fill(); }
    else if (L.hair === 'bob') { rr(c, -40 + sw * 0.3, hy - 30, 80, 66, 26); c.fill(); c.stroke(); }
    else if (L.hair === 'hood') { c.fillStyle = shade(L.col, -0.1); c.beginPath(); c.arc(0, hy - 2, 44, 0, TAU); c.fill(); c.stroke(); }
  }

  function head(c, L, hy, o) {
    const R = 34;
    c.fillStyle = L.skin; c.strokeStyle = OUT; c.lineWidth = 3.2;
    c.fillStyle = 'rgba(60,20,30,.18)'; c.beginPath(); c.ellipse(0, hy + R + 2, 16, 6, 0, 0, TAU); c.fill(); c.fillStyle = L.skin;
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * (R - 1), hy + 4, 8, 9, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = shade(L.skin, -0.18); c.beginPath(); c.ellipse(s * (R - 1), hy + 5, 4, 5, 0, 0, TAU); c.fill(); c.fillStyle = L.skin; }
    const facePath = () => { c.beginPath(); c.moveTo(-R, hy - 4); c.bezierCurveTo(-R, hy - R * 1.32, R, hy - R * 1.32, R, hy - 4); c.bezierCurveTo(R, hy + R * 0.7, R * 0.42, hy + R * 1.08, 0, hy + R * 1.08); c.bezierCurveTo(-R * 0.42, hy + R * 1.08, -R, hy + R * 0.7, -R, hy - 4); c.closePath(); };
    facePath(); c.fill();
    const hg = c.createRadialGradient(-12, hy - 16, 4, 0, hy, R * 1.1); hg.addColorStop(0, 'rgba(255,255,255,.26)'); hg.addColorStop(0.55, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(60,20,30,.2)');
    c.fillStyle = hg; facePath(); c.fill(); c.stroke(); c.fillStyle = L.skin;
    if (L.acc === 'beard') { c.fillStyle = L.hairCol; c.beginPath(); c.arc(0, hy + 6, R - 1, 0.1 * Math.PI, 0.9 * Math.PI); c.quadraticCurveTo(0, hy + R + 22, R * Math.cos(0.1 * Math.PI), hy + 6 + R * Math.sin(0.1 * Math.PI)); c.fill(); c.stroke(); }
    if (L.acc === 'earrings') { c.fillStyle = '#ffd34d'; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * (R + 2), hy + 15, 4, 0, TAU); c.fill(); } }
    face(c, L, hy, o);
    hairFront(c, L, hy, R);
    if (!['bald', 'cap', 'beret', 'tam', 'hood', 'beanie', 'buckethat'].includes(L.hair)) { c.save(); c.strokeStyle = shade(L.hairCol, 0.5); c.globalAlpha = 0.55; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.arc(-6, hy - 6, R - 4, Math.PI * 1.18, Math.PI * 1.36); c.stroke(); c.beginPath(); c.arc(-2, hy - 4, R - 10, Math.PI * 1.22, Math.PI * 1.32); c.stroke(); c.restore(); }
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
    for (const s of [-1, 1]) {
      const ex = s * 12;
      if (f === 'joy') { c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.arc(ex, ey + 3, 6, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); continue; }
      if (f === 'love') { c.fillStyle = '#ff3f7f'; c.beginPath(); c.moveTo(ex, ey + 6); c.bezierCurveTo(ex - 11, ey - 2, ex - 6, ey - 10, ex, ey - 4); c.bezierCurveTo(ex + 6, ey - 10, ex + 11, ey - 2, ex, ey + 6); c.fill(); continue; }
      if (f === 'sus' || f === 'smug') { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey + 1, 7, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#20141c'; c.beginPath(); c.arc(ex + (f === 'sus' ? 2.5 : 0), ey + 1, 3, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 8, ey - 2); c.lineTo(ex + 8, ey - 2); c.stroke(); continue; }
      if (blink) { c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 5, ey); c.lineTo(ex + 5, ey); c.stroke(); continue; }
      const ry = f === 'wow' ? 10.5 : 9.5, rx = 8;
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, 0, TAU); c.clip();
      const lx = ex + (o.look || 0) * 2;
      c.fillStyle = L.eyes || '#6b4226'; c.beginPath(); c.arc(lx, ey + 1.5, f === 'wow' ? 5 : 6, 0, TAU); c.fill();
      c.fillStyle = shade(L.eyes || '#6b4226', -0.45); c.beginPath(); c.arc(lx, ey + 1.5, 6, Math.PI * 1.1, Math.PI * 1.9); c.fill();
      c.fillStyle = '#140c12'; c.beginPath(); c.arc(lx, ey + 1.5, f === 'wow' ? 2.2 : 3, 0, TAU); c.fill();
      c.fillStyle = 'rgba(60,20,30,.18)'; c.fillRect(ex - rx, ey - ry, rx * 2, 3);
      c.restore();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(lx + 2, ey - 1.5, 2, 0, TAU); c.fill(); c.beginPath(); c.arc(lx - 2, ey + 4, 1, 0, TAU); c.fill();
      c.strokeStyle = OUT; c.lineWidth = 2.8; c.beginPath(); c.ellipse(ex, ey, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      if (L.lashes) { c.lineWidth = 2.2; for (const k of [0, 1, 2]) { const a = Math.PI * (1.62 + k * 0.12); const ax = ex + Math.cos(a) * rx * s * (s > 0 ? 1 : -1), ay = ey + Math.sin(a) * ry; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + s * (3 + k), ay - 3 - k * 0.5); c.stroke(); } }
    }
    // brows
    c.strokeStyle = shade(L.hairCol || '#3b2414', -0.25); c.lineWidth = 4.4; c.lineCap = 'round';
    const tilt = f === 'cross' || f === 'angry' ? 6 : f === 'meh' ? -2 : f === 'wow' ? -4 : f === 'sad' ? -6 : 0;
    for (const s of [-1, 1]) { const tt = f === 'sus' && s > 0 ? -5 : tilt; const y0 = ey - 15 - (f === 'wow' ? 4 : 0) + (f === 'sad' ? 2 : 0); c.beginPath(); c.moveTo(s * 20, y0 + 2); c.quadraticCurveTo(s * 14, y0 - 3, s * 6, y0 + tt); c.stroke(); }
    if (f === 'angry') { c.fillStyle = 'rgba(230,40,40,.28)'; c.beginPath(); c.arc(0, hy, 33, 0, TAU); c.fill(); c.strokeStyle = '#c3001b'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(20, hy - 30); c.lineTo(28, hy - 22); c.moveTo(28, hy - 30); c.lineTo(20, hy - 22); c.stroke(); }
    // cheeks
    { const strong = f === 'joy' || f === 'happy' || f === 'love'; for (const s of [-1, 1]) { const bg = c.createRadialGradient(s * 21, hy + 11, 1, s * 21, hy + 11, 10); bg.addColorStop(0, `rgba(255,90,110,${strong ? 0.45 : 0.2})`); bg.addColorStop(1, 'rgba(255,90,110,0)'); c.fillStyle = bg; c.beginPath(); c.arc(s * 21, hy + 11, 10, 0, TAU); c.fill(); } }
    // nose
    c.fillStyle = shade(L.skin, -0.12); c.beginPath(); c.ellipse(0, hy + 8, 5, 4, 0, 0, TAU); c.fill(); c.fillStyle = shade(L.skin, -0.4); for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 2.6, hy + 10, 1.4, 1, 0, 0, TAU); c.fill(); } c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(-1.5, hy + 6, 1.4, 0, TAU); c.fill();
    // mouth
    c.strokeStyle = OUT; c.lineWidth = 3; c.fillStyle = '#7a1f2e';
    const my = hy + 18;
    if (L.lips && !['joy', 'wow', 'talk', 'angry'].includes(f)) { c.fillStyle = L.lips; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(0, my + 1, 6.5, 2.8, 0, 0, TAU); c.fill(); c.globalAlpha = 1; c.fillStyle = '#7a1f2e'; }
    if (f === 'joy') { c.beginPath(); c.arc(0, my - 3, 11, 0.05 * Math.PI, 0.95 * Math.PI); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#ff7b8b'; c.beginPath(); c.ellipse(0, my + 4, 6, 3, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.fillRect(-7, my - 3, 14, 3); }
    else if (f === 'happy') { c.beginPath(); c.arc(0, my - 6, 9, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
    else if (f === 'wow') { c.beginPath(); c.ellipse(0, my, 5.5, 7.5, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#ff7b8b'; c.beginPath(); c.ellipse(0, my + 4, 3.5, 2.2, 0, 0, TAU); c.fill(); }
    else if (f === 'cross') { c.beginPath(); c.arc(0, my + 6, 9, 1.2 * Math.PI, 1.8 * Math.PI); c.stroke(); }
    else if (f === 'meh') { c.beginPath(); c.moveTo(-7, my); c.lineTo(7, my - 2); c.stroke(); }
    else if (f === 'talk') {
      const openH = 2.5 + Math.abs(Math.sin((o.t || 0) * 18)) * 4.5;
      const openW = 6.5 + Math.cos((o.t || 0) * 14) * 1.5;
      c.save(); c.beginPath(); c.ellipse(0, my, openW, openH, 0, 0, TAU); c.fill(); c.clip();
      c.fillStyle = '#ff7b8b'; c.beginPath(); c.ellipse(0, my + openH * 0.55, openW * 0.75, openH * 0.6, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.fillRect(-openW, my - openH, openW * 2, 2.5);
      c.restore();
      c.beginPath(); c.ellipse(0, my, openW, openH, 0, 0, TAU); c.stroke();
    }
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

  // ---------- Oreo (and Pickle!), curly cockapoos ----------
  const EAR_DEFAULT = '#d39c63', CURL = 'rgba(150,95,45,.38)';
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
  function curls(c, cx, cy, rx, ry, n, col, seed) {
    c.save(); c.strokeStyle = col; c.lineWidth = 2; c.lineCap = 'round';
    for (let i = 0; i < n; i++) { const a = (i * 2.399 + (seed || 0)), r = Math.sqrt((i + 0.5) / n); const x = cx + Math.cos(a) * rx * r * 0.85, y = cy + Math.sin(a) * ry * r * 0.85; c.beginPath(); c.arc(x, y, 3.2, a, a + 3.6); c.stroke(); }
    c.restore();
  }

  // Side view, facing right, origin at the ground between the paws.
  // o: { pose: 'stand'|'walk'|'run'|'sit'|'lie'|'jump'|'beg'|'roll'|'sleep'|'bow', phase, wag, age 0..1, blink, tongue, flip, look, coat, earCol, collar }
  function dog(c, x, y, s, o) {
    o = o || {};
    const age = o.age == null ? 0.5 : o.age;
    const pup = Math.max(0, 1 - age * 3);
    const old = Math.max(0, (age - 0.72) / 0.28);
    const BLK = o.coat || '#e7c899', WHT = '#fdf7ea', EAR = o.earCol || EAR_DEFAULT, GREY = shade(BLK, 0.4 * old);
    const pose = o.pose || 'stand', ph = o.phase || 0, t = o.t || 0;
    c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s);
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 3.4;
    const headK = 1.18 + pup * 0.32;
    const bodyL = 74 - pup * 18, legH = 34 - pup * 10;
    const run = pose === 'run', walk = pose === 'walk' || run, bow = pose === 'bow';
    const breathe = Math.sin(t * 3.2) * 1.2;
    const bob = walk ? Math.abs(Math.sin(ph)) * (run ? 6.5 : 3.2) : pose === 'jump' ? -40 : Math.max(0, breathe * 0.6);
    // shadow
    c.fillStyle = 'rgba(40,20,10,.22)'; c.beginPath(); c.ellipse(0, 2, 58 * (pose === 'jump' ? 0.75 : 1), 9, 0, 0, TAU); c.fill();
    if (pose === 'sleep' || pose === 'lie') { lying(c, o, BLK, WHT, EAR, GREY, headK, bodyL, pose === 'sleep', t, old); c.restore(); return; }
    if (pose === 'roll') { c.rotate(Math.sin(t * 6) * 0.3); c.translate(0, -26); c.rotate(Math.PI); c.translate(0, -26); }
    const sit = pose === 'sit' || pose === 'beg';
    c.translate(0, -bob);
    // tail
    const wag = o.wag != null ? o.wag : Math.sin(t * (bow ? 18 : 12 - age * 5)) * (bow ? 0.85 : 0.6);
    c.save(); c.translate(-bodyL / 2 + 4, sit ? -26 : -legH - 26); c.rotate(-0.9 + wag * 0.6 + (sit ? 0.9 : bow ? -0.25 : 0));
    c.lineWidth = 3.4; c.strokeStyle = OUT; c.fillStyle = BLK; fluff(c, -12, -20, 11, 22, 10, 4, 0.3); c.fill(); c.stroke();
    c.fillStyle = WHT; fluff(c, -18, -36, 7, 7, 7, 3); c.fill(); c.stroke();
    c.restore(); c.lineWidth = 3.4; c.strokeStyle = OUT;
    // articulated 2-joint dog leg helper
    const leg = (lx, ly, ang, kneeAng, col, sock) => {
      c.save(); c.translate(lx, ly); c.rotate(ang);
      const uH = legH * 0.52, lH = legH * 0.52;
      c.fillStyle = col; rr(c, -8, 0, 16, uH + 4, 7); c.fill(); c.stroke();
      c.translate(0, uH); c.rotate(kneeAng || 0);
      c.fillStyle = col; rr(c, -7.5, -2, 15, lH + 3, 7); c.fill(); c.stroke();
      if (sock) {
        c.fillStyle = WHT; fluff(c, 1, lH - 2, 10, 6.5, 8, 2.2); c.fill(); c.stroke();
        c.strokeStyle = 'rgba(60,30,15,.35)'; c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(6, lH - 2); c.lineTo(6, lH + 3); c.moveTo(9, lH - 1); c.lineTo(9, lH + 3); c.stroke();
        c.strokeStyle = OUT; c.lineWidth = 3.4;
      }
      c.restore();
    };
    if (sit) {
      c.fillStyle = BLK; c.beginPath(); c.ellipse(-bodyL / 2 + 16, -18, 24, 18, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = WHT; rr(c, -bodyL / 2 + 22, -8, 24, 10, 5); c.fill(); c.stroke();
    } else {
      const sw1 = walk ? Math.sin(ph) * (run ? 0.65 : 0.38) : 0;
      const sw2 = walk ? Math.sin(ph + Math.PI) * (run ? 0.65 : 0.38) : 0;
      const k1 = walk ? Math.max(0, -Math.cos(ph)) * 0.45 : -0.08;
      const k2 = walk ? Math.max(0, -Math.cos(ph + Math.PI)) * 0.45 : -0.08;
      leg(-bodyL / 2 + 12, -legH - 4, sw1, k1, shade(BLK, -0.08), true);
      leg(-bodyL / 2 + 22, -legH - 4, sw2, k2, BLK, true);
    }
    // body
    c.save();
    if (sit) { c.translate(-6, -legH - 6); c.rotate(-0.85); c.translate(6, legH + 6); }
    else if (bow) { c.translate(-bodyL / 2 + 16, -legH - 12); c.rotate(0.28); c.translate(bodyL / 2 - 16, legH + 12); }
    else if (run) { c.rotate(Math.sin(ph) * 0.08); }
    c.fillStyle = BLK; fluff(c, 0, -legH - 18, bodyL / 2, 22 - pup * 2 + breathe * 0.4, 22, 4.5); c.fill(); c.stroke();
    curls(c, -6, -legH - 22, bodyL / 2 - 10, 14, 14, CURL, 1);
    // white chest and belly
    c.save(); c.beginPath(); c.ellipse(0, -legH - 18, bodyL / 2 - 2, 20 - pup * 2 + breathe * 0.4, 0, 0, TAU); c.clip();
    c.fillStyle = WHT; c.beginPath(); c.ellipse(bodyL / 2 - 8, -legH - 10, 22, 22, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(4, -legH - 2, bodyL / 2 - 10, 9, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(-6, -legH - 32, bodyL / 2 - 10, 6, 0, 0, TAU); c.fill();
    c.restore(); c.restore();
    // front legs
    if (pose === 'beg') { leg(bodyL / 2 - 14, -legH - 30, -1.5, 0.5, BLK, true); leg(bodyL / 2 - 8, -legH - 26, -1.25, 0.45, BLK, true); }
    else if (bow) { leg(bodyL / 2 - 14, -legH + 8, -1.15, 0.3, BLK, true); leg(bodyL / 2 - 4, -legH + 8, -1.05, 0.25, BLK, true); }
    else if (sit) { leg(bodyL / 2 - 26, -legH - 4, 0.02, 0, BLK, true); leg(bodyL / 2 - 16, -legH - 4, -0.02, 0, BLK, true); }
    else if (pose === 'jump') { leg(bodyL / 2 - 14, -legH - 10, -1.05, 0.35, BLK, true); leg(bodyL / 2 - 6, -legH - 10, -0.85, 0.35, BLK, true); }
    else {
      const sw1 = walk ? Math.sin(ph + Math.PI) * (run ? 0.72 : 0.4) : 0;
      const sw2 = walk ? Math.sin(ph) * (run ? 0.72 : 0.4) : 0;
      const k1 = walk ? Math.max(0, Math.cos(ph + Math.PI)) * 0.42 : 0.05;
      const k2 = walk ? Math.max(0, Math.cos(ph)) * 0.42 : 0.05;
      leg(bodyL / 2 - 16, -legH - 4, sw1, k1, shade(BLK, -0.08), true);
      leg(bodyL / 2 - 6, -legH - 4, sw2, k2, BLK, true);
    }
    // collar
    const hx = bodyL / 2 + 4 - (sit ? 18 : bow ? -4 : 0), hy = -legH - 44 - (sit ? 28 : bow ? -14 : 0) + (pose === 'beg' ? -8 : 0);
    c.fillStyle = o.collar || '#e5203a'; c.save(); c.translate(hx - 8, hy + 18); c.rotate(-0.5); rr(c, -6, -14, 12, 28, 5); c.fill(); c.stroke(); c.restore();
    c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(hx - 2, hy + 30 + Math.sin(t * 8) * (walk ? 1.5 : 0), 5, 0, TAU); c.fill(); c.stroke();
    dogHead(c, hx, hy, headK, o, BLK, WHT, EAR, GREY, t, old);
    c.restore();
  }

  function dogHead(c, hx, hy, k, o, BLK, WHT, EAR, GREY, t, old) {
    const curiousTilt = o.tilt != null ? o.tilt : Math.sin(t * 0.9) * 0.05 + (o.look ? o.look * 0.04 : 0);
    c.save(); c.translate(hx, hy); c.scale(k, k); c.rotate(curiousTilt);
    // back ear (long and curly)
    c.fillStyle = shade(EAR, -0.08); for (let i = 0; i < 4; i++) { fluff(c, -14 - i * 1.5, -8 + i * 9, 10 - i, 8, 8, 2.5); c.fill(); } c.lineWidth = 3.4; c.strokeStyle = OUT;
    // head: round and fluffy, with a curly top-knot
    c.fillStyle = BLK; fluff(c, 0, -10, 25, 23, 16, 4); c.fill(); c.stroke();
    fluff(c, 0, -32, 13, 8, 9, 3.5); c.fill(); c.stroke();
    curls(c, -2, -20, 18, 12, 9, CURL, 2);
    // white blaze down the face and a white muzzle
    c.save(); c.beginPath(); c.ellipse(0, -10, 23, 21, 0, 0, TAU); c.clip();
    c.fillStyle = WHT; c.beginPath(); c.moveTo(6, -34); c.quadraticCurveTo(14, -20, 16, -4); c.lineTo(4, -2); c.quadraticCurveTo(2, -20, 6, -34); c.fill();
    c.restore();
    c.fillStyle = old > 0 ? shade(WHT, -0.06) : WHT; fluff(c, 18, -1, 15, 12, 12, 3); c.fill(); c.stroke();
    // a fluffy white beard under the chin
    fluff(c, 14, 10, 10, 6, 8, 3); c.fill(); c.stroke();
    if (old > 0) { c.fillStyle = `rgba(255,255,255,${0.85 * old})`; c.beginPath(); c.ellipse(4, -16, 12, 8, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(16, -24, 7, 4, 0.4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(-10, -2, 8, 10, 0, 0, TAU); c.fill(); }
    // expressive eye with warm iris and dual specular highlights
    const ey = -14, ex = 8;
    if (o.blink || o.sleepy) { c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.arc(ex, ey + 1, 5, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke(); }
    else {
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, 7.2, 8.2, 0, 0, TAU); c.fill();
      c.fillStyle = '#6b3e1b'; c.beginPath(); c.arc(ex + 1.5 + (o.look || 0), ey + 1, 5.6, 0, TAU); c.fill();
      c.fillStyle = '#140c08'; c.beginPath(); c.arc(ex + 2 + (o.look || 0), ey + 1, 3.1, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + 0.5, ey - 2.2, 2.3, 0, TAU); c.fill();
      c.beginPath(); c.arc(ex + 3.2, ey + 2.8, 1.1, 0, TAU); c.fill();
      c.fillStyle = '#c08a58'; c.beginPath(); c.ellipse(ex - 2, ey - 11, 4, 2.5, -0.3, 0, TAU); c.fill();
    }
    // nose and mouth
    c.fillStyle = '#3a2214'; c.beginPath(); c.ellipse(31, -6, 6.2, 5.2, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(29.8, -8, 1.8, 0, TAU); c.fill();
    c.strokeStyle = OUT; c.lineWidth = 2.6; c.beginPath(); c.moveTo(30, 0); c.quadraticCurveTo(27, 6, 20, 4); c.stroke();
    if (o.tongue) {
      const pant = Math.sin(t * 11) * 1.8;
      c.fillStyle = '#ff7aa0'; c.beginPath(); c.ellipse(23, 9 + pant, 5.2, 8.5, 0.2, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(180,50,80,.45)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(22.5, 4 + pant); c.lineTo(23.5, 13 + pant); c.stroke();
    }
    if (o.ball) { c.fillStyle = '#c6f03a'; c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.arc(34, 6, 9, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(30, 6, 7, -0.8, 0.8); c.stroke(); }
    // front ear, bouncy and floppy
    c.strokeStyle = OUT; c.lineWidth = 3.4;
    const bounce = (o.pose === 'run' || o.pose === 'jump') ? Math.sin(t * 14) * 0.22 : Math.sin(t * 5) * 0.08;
    const flop = bounce + (o.ears || 0);
    c.save(); c.translate(-6, -22); c.rotate(0.25 + flop); c.fillStyle = EAR; c.strokeStyle = OUT; c.lineWidth = 3.4; for (let i = 0; i < 5; i++) { fluff(c, -4 + Math.sin(i * 1.3) * 2, i * 8, 11 - i * 0.6, 8, 8, 3); c.stroke(); } for (let i = 0; i < 5; i++) { fluff(c, -4 + Math.sin(i * 1.3) * 2, i * 8, 11 - i * 0.6, 8, 8, 3); c.fill(); } curls(c, -4, 16, 6, 14, 5, CURL, 3); c.restore();
    // shine on head
    c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(-4, -24, 10, 4, -0.3, 0, TAU); c.fill();
    c.restore();
  }

  function lying(c, o, BLK, WHT, EAR, GREY, headK, bodyL, asleep, t, old) {
    const br = asleep ? Math.sin(t * 1.6) * 1.5 : Math.sin(t * 2.5) * 0.8;
    c.lineWidth = 3.4; c.strokeStyle = OUT; c.fillStyle = BLK; fluff(c, -bodyL / 2 - 6, -10, 14, 10, 9, 3.5); c.fill(); c.stroke();
    c.fillStyle = BLK; fluff(c, 0, -18 - br, bodyL / 2 + 4, 20 + br, 22, 4.5); c.fill(); c.stroke();
    curls(c, -6, -22, bodyL / 2 - 8, 12, 14, CURL, 4);
    c.save(); c.beginPath(); c.ellipse(0, -18 - br, bodyL / 2 + 2, 18 + br, 0, 0, TAU); c.clip(); c.fillStyle = WHT; c.beginPath(); c.ellipse(bodyL / 2 - 6, -8, 20, 16, 0, 0, TAU); c.fill(); c.restore();
    c.fillStyle = BLK; rr(c, bodyL / 2 - 10, -12, 36, 12, 6); c.fill(); c.stroke(); c.fillStyle = WHT; rr(c, bodyL / 2 + 14, -12, 14, 12, 6); c.fill(); c.stroke();
    dogHead(c, bodyL / 2 + 8, -24, headK, Object.assign({}, o, { blink: asleep || o.blink, sleepy: asleep, tilt: asleep ? 0.25 : 0.1, ears: 0.3 }), BLK, WHT, EAR, GREY, t, old);
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

  function placeFx(c, W, H, id, tod, t) {
    const fy = H * 0.74;
    c.save();
    if (id === 'home') {
      // cozy crackling fireplace in the hearth
      const fx = W - 230, fy0 = fy - 14;
      const g = c.createRadialGradient(fx, fy0 - 30, 6, fx, fy0 - 30, 120 + Math.sin(t * 9) * 14);
      g.addColorStop(0, 'rgba(255,190,70,.42)'); g.addColorStop(1, 'rgba(255,120,30,0)');
      c.fillStyle = g; c.beginPath(); c.arc(fx, fy0 - 30, 130, 0, TAU); c.fill();
      c.fillStyle = '#4a2615'; rr(c, fx - 44, fy0 - 14, 88, 12, 5); c.fill();
      for (const [dx, w, h, ph, col] of [[-22, 16, 42, 0, '#ff6b2b'], [0, 22, 56, 1.4, '#ff9a2b'], [20, 15, 38, 2.7, '#ff6b2b'], [-8, 12, 34, 0.8, '#ffe066'], [10, 11, 30, 2.1, '#ffe066']]) {
        const sw = Math.sin(t * 11 + ph) * 5, sh = Math.cos(t * 14 + ph) * 5;
        c.fillStyle = col; c.beginPath();
        c.moveTo(fx + dx - w, fy0 - 8);
        c.quadraticCurveTo(fx + dx - w * 0.6 + sw, fy0 - h * 0.6, fx + dx + sw * 1.3, fy0 - h - sh);
        c.quadraticCurveTo(fx + dx + w * 0.6 + sw, fy0 - h * 0.6, fx + dx + w, fy0 - 8);
        c.closePath(); c.fill();
      }
    } else if (id === 'beach') {
      // lapping foam waves on the sand
      const wy = H * 0.62 + Math.sin(t * 1.8) * 6;
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 5; c.beginPath();
      for (let x = 0; x <= W; x += 32) {
        const y = wy + Math.sin(x / 85 + t * 1.4) * 7;
        x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    } else if ((id === 'garden' || id === 'park') && tod !== 'night') {
      // fluttering butterflies
      for (let b = 0; b < 3; b++) {
        const bx = (W * 0.15 + ((t * (38 + b * 12) + b * 370) % (W * 0.75)));
        const by = fy - 90 - b * 45 + Math.sin(t * 4.5 + b * 2) * 22;
        const wing = Math.abs(Math.sin(t * 18 + b));
        c.fillStyle = ['#ff8ac0', '#ffd43b', '#7ec8ff'][b];
        c.beginPath(); c.ellipse(bx - 4 * wing, by, 6 * wing, 4, -0.3, 0, TAU); c.ellipse(bx + 4 * wing, by, 6 * wing, 4, 0.3, 0, TAU); c.fill();
      }
    }
    c.restore();
  }

  G.OREO_ART = { person, dog, place, placeFx, rr, shade, cloud };
})(typeof window !== 'undefined' ? window : globalThis);

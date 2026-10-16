// Oreo: scenes, the story box, the little games and input.
(function () {
  'use strict';
  const D = window.OREO_DATA, E = window.OREO, A = window.OREO_ART, AU = window.OREO_AUDIO;
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), cv = $('#scene'), c = cv.getContext('2d');
  const hud = $('#hud'), play = $('#play'), screen = $('#screen'), toasts = $('#toasts');
  const W = 1280, H = 720, GROUND = 528;
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  if (document.fonts) { document.fonts.load('700 20px Fredoka'); document.fonts.load('20px "Luckiest Guy"'); }

  let S = null, meta = E.loadMeta(), mode = 'title', t = 0, last = performance.now();
  // What's on screen.
  const view = { place: 'sunset', tod: 'evening', family: [], dog: { x: 640, tx: 640, pose: 'sit', flip: false, tongue: true, ball: false, look: 0 }, extra: null };
  let mg = null, parts = [], typer = null;

  function fit() { const s = Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `scale(${s})`; }
  addEventListener('resize', fit); fit();
  function toast(html, cls) { const d = document.createElement('div'); d.className = 'toast ' + (cls || ''); d.innerHTML = html; toasts.appendChild(d); setTimeout(() => d.remove(), 3000); }
  const chapter = () => S ? E.chapterOf(Math.min(S.day, D.LAST_DAY)) : 1;
  const age = () => S ? E.ageOf(Math.min(S.day, D.LAST_DAY)) : 0.4;
  function look(who) { const f = D.FAMILY[who]; return Array.isArray(f) ? f[chapter()] : f; }
  function setFamily(list) { view.family = list.map((w, i) => ({ who: w, look: look(w), x: 780 + i * 150, face: 'happy', arm: 'idle' })).filter(p => p.look); }
  function music() { const ch = D.CHAPTERS[chapter()]; AU.play({ id: 'ch' + ch.id, genre: ch.music, seed: 300 + ch.id * 41 }); }
  function hearts(x, y, n) { for (let i = 0; i < (n || 6); i++) parts.push({ x: x + (Math.random() - 0.5) * 60, y, vx: (Math.random() - 0.5) * 50, vy: -80 - Math.random() * 60, life: 1.6, e: '❤️', s: 22 + Math.random() * 12 }); }

  // ---------- intro (same Snoopster video as the other games) ----------
  let introDone = null, introTimer = null;
  function endIntro() {
    clearTimeout(introTimer);
    document.removeEventListener('keydown', endIntro, true); document.removeEventListener('pointerdown', endIntro, true);
    const el = $('#intro .intro'); if (el) { el.classList.add('fadeout'); const v = el.querySelector('video'); if (v) v.pause(); setTimeout(() => { $('#intro').innerHTML = ''; }, 450); }
    if (introDone) { const f = introDone; introDone = null; f(); }
  }
  function playIntro(done) {
    introDone = done;
    $('#intro').innerHTML = '<div class="intro"><video src="assets/intro.mp4" autoplay playsinline></video><div class="skip">Press any key or tap to skip</div></div>';
    const v = $('#intro video');
    v.addEventListener('ended', endIntro); v.addEventListener('error', endIntro);
    const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(endIntro); });
    setTimeout(() => { document.addEventListener('keydown', endIntro, true); document.addEventListener('pointerdown', endIntro, true); }, 300);
    introTimer = setTimeout(endIntro, 15000);
  }

  // ---------- the story box ----------
  function story(who, text, buttons, opts) {
    opts = opts || {};
    clearInterval(typer);
    play.querySelectorAll('.story').forEach(n => n.remove());
    const box = document.createElement('div'); box.className = 'story';
    box.innerHTML = `<div class="face"></div><div class="who">${esc(who)}</div><div class="txt"></div><div class="opts">${(buttons || []).map((b, i) => `<button class="${b.cls || 'ghost'} act" data-opt="${i}" ${b.disabled ? 'disabled' : ''}>${b.icon ? `<span class="ic">${b.icon}</span>` : ''}${esc(b.label)}</button>`).join('')}</div>`;
    play.appendChild(box);
    // a little portrait of whoever is talking
    const f = document.createElement('canvas'); f.width = 152; f.height = 152; const fc = f.getContext('2d'); fc.scale(2, 2);
    fc.fillStyle = '#ffe7b0'; fc.fillRect(0, 0, 76, 76);
    if (who === 'Oreo' || !opts.look) A.dog(fc, 20, 98, 0.9, { pose: 'sit', age: age(), t: 0, tongue: true }); else A.person(fc, opts.look, 38, 130, 0.42, { face: 'happy', t: 0 });
    f.style.width = '76px'; f.style.height = '76px'; box.querySelector('.face').appendChild(f);
    const el = box.querySelector('.txt'); let i = 0;
    typer = setInterval(() => { i += 2; el.textContent = text.slice(0, i); if (i >= text.length) clearInterval(typer); }, 18);
    box.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => { AU.init(); clearInterval(typer); el.textContent = text; buttons[+b.dataset.opt].go(); });
    return box;
  }

  // ---------- HUD ----------
  function buildHud() {
    if (!S) { hud.innerHTML = ''; return; }
    const ch = D.CHAPTERS[chapter()];
    hud.innerHTML = `<div class="day"><b>Day ${Math.min(S.day, D.LAST_DAY)}</b><small>${esc(ch.name)}</small></div>
      <div class="needs">${[['🍖', 'Tummy', 'tummy', '#f2a03b'], ['⚡', 'Energy', 'energy', '#7ec8ff'], ['😊', 'Happy', 'happy', '#ff7aa0']].map(([i, n, k, col]) => `<div class="need">${i}<div class="bar"><i style="width:${S[k]}%;background:${col}"></i></div></div>`).join('')}</div>
      <div class="topright"><div class="bond">❤️ ${S.bond}</div><button class="small ghost" data-a="album">📷 ${S.memories.length}</button><button class="small ghost" data-a="mute">${AU.muted ? '🔇' : '🔊'}</button></div>`;
  }

  // ---------- screens ----------
  function showTitle() {
    mode = 'title'; play.innerHTML = ''; hud.innerHTML = ''; S = null;
    Object.assign(view, { place: 'sunset', tod: 'evening', family: [] }); view.dog = { x: 640, tx: 640, pose: 'sit', tongue: true };
    const saved = E.load();
    screen.innerHTML = `<div class="panel" style="justify-content:flex-start;padding-top:50px">
      <div class="logo"><div class="t1">OR<span>EO</span></div><div class="sub">The life of one very good dog.</div></div>
      <div style="flex:1"></div>
      <div class="row">${saved && saved.phase !== 'finale' ? `<button class="sage" data-a="continue">Carry on (day ${Math.min(saved.day, D.LAST_DAY)})</button>` : ''}
        <button class="rose" data-a="new">${saved ? 'Start a new life' : 'Bring Oreo home'}</button>
        <button class="ghost" data-a="album">Memory album</button></div>
      <div class="credit">Developed by <b>Snoopster Gaming</b> · <a href="#" data-a="intro">Replay intro</a></div></div>`;
  }

  function showChapter(ch, then) {
    mode = 'chapter'; play.innerHTML = '';
    music();
    screen.innerHTML = `<div class="panel dim chapter" data-a="chaptergo"><div class="small">Chapter ${ch.id + 1}</div><div class="big">${esc(ch.name)}</div><div class="small">${esc(ch.blurb)}</div><div class="small" style="font-size:15px;opacity:.85;margin-top:20px">Tap to carry on</div></div>`;
    chapterThen = then;
  }
  let chapterThen = null;

  function showAlbum() {
    const all = E.allMemories(), have = Object.assign({}, meta.memories || {});
    if (S) for (const m of S.memories) have[m.caption] = m;
    const prev = mode; mode = 'album';
    screen.innerHTML = `<div class="panel dim"><div class="card" style="max-width:1160px"><h2 style="font-family:var(--logo);font-weight:400;font-size:40px;text-align:center">Memory album</h2>
      <p style="text-align:center;margin:4px 0 12px">${Object.keys(have).length} of ${all.length} memories</p>
      <div class="album">${all.map((cap, i) => { const m = have[cap]; return m ? `<div class="polaroid" style="--r:${(i % 5 - 2) * 1.2}deg"><div class="img" style="background-image:url(${m.img || ''})">${m.img ? '' : '🐾'}</div><b>${esc(cap)}</b><small>Day ${m.day}</small></div>` : `<div class="polaroid lock" style="--r:${(i % 5 - 2) * 1.2}deg"><div class="img">?</div><b>Not yet...</b><small>&nbsp;</small></div>`; }).join('')}</div>
      <div class="row" style="margin-top:14px"><button data-a="closealbum">Close</button></div></div></div>`;
    albumBack = prev;
  }
  let albumBack = 'title';

  // ---------- a day in the life ----------
  function newLife() {
    S = E.newLife(); E.startDay(S); E.save(S);
    screen.innerHTML = ''; buildHud();
    showChapter(D.CHAPTERS[0], beginDay);
  }
  function resume() { S = E.load(); if (!S) return showTitle(); screen.innerHTML = ''; buildHud(); music(); if (S.phase === 'finale') return finale(); beginDay(); }

  function beginDay() {
    mode = 'day'; mg = null; play.innerHTML = ''; screen.innerHTML = ''; buildHud();
    if (S.phase === 'finale') return finale();
    if (S.phase === 'event') return showEvent();
    if (S.phase === 'evening') return evening();
    morning();
  }

  function showEvent() {
    const ev = D.EVENTS[S.day];
    view.place = ev.place; view.tod = ev.place === 'night' ? 'night' : 'day';
    setFamily(ev.who);
    view.dog = { x: 470, tx: 470, pose: ev.place === 'night' ? 'lie' : 'sit', tongue: false, look: 1 };
    story('Oreo', ev.text, ev.opts.map((o, i) => ({ label: o.label, cls: i ? 'ghost' : 'rose', go: () => chooseEvent(i) })));
  }
  function chooseEvent(i) {
    const r = E.eventChoice(S, i); if (!r) return;
    view.dog.pose = 'sit'; view.dog.tongue = true; view.family.forEach(p => { p.face = 'joy'; });
    AU.sfx('heart'); hearts(view.dog.x + 30, GROUND - 120, 8);
    setTimeout(() => snapshot(r.memory), 450);
    E.save(S); buildHud();
    story('Oreo', r.reply, [{ label: 'Carry on', cls: 'rose', go: morning }]);
  }

  function snapshot(mem) {
    if (!mem) return;
    try { const s = document.createElement('canvas'); s.width = 360; s.height = 220; s.getContext('2d').drawImage(cv, 100, 40, 1080, 660, 0, 0, 360, 220); mem.img = s.toDataURL('image/jpeg', 0.72); E.save(S); } catch (e) { /* snapshots are a nice-to-have */ }
    toast(`📷 New memory: <b>${esc(mem.caption)}</b>`, 'rose'); AU.sfx('rare');
    buildHud();
  }

  function morning() {
    mode = 'day'; S.phase = 'morning';
    view.place = chapter() === 3 ? 'garden' : 'home'; view.tod = 'morning';
    setFamily(chapter() >= 2 ? ['mia', 'leo'] : ['mia']);
    view.dog = { x: 480, tx: 480, pose: S.energy < 25 ? 'lie' : 'sit', tongue: true };
    const done = Object.keys(S.did).length;
    const text = done === 0 ? `${S.diary} What shall we do today?` : S.picksLeft > 0 ? 'Still a bit of the day left. What next?' : '';
    story('Oreo', text, S.offer.map(id => { const a = D.ACTIVITIES[id]; return { label: a.name, icon: a.icon, disabled: S.did[id], cls: 'ghost', go: () => startActivity(id) }; }));
  }

  // ---------- the little games ----------
  function startActivity(id) {
    mode = 'game'; play.innerHTML = '';
    const a = D.ACTIVITIES[id]; view.place = a.place; view.tod = 'day'; view.family = [];
    GAMES[id]();
  }
  function endActivity(id, score, line) {
    if (!mg) return; mg = null;
    play.querySelectorAll('.mg,.bigbtns').forEach(n => n.remove());
    const r = E.doActivity(S, id, score); E.save(S); buildHud();
    view.dog.pose = 'sit'; view.dog.tongue = true; view.dog.ball = false;
    AU.sfx(score >= 0.7 ? 'level' : 'pop'); hearts(view.dog.x + 30, GROUND - 120, Math.round(3 + score * 6));
    let text = line || 'What a lovely time.';
    if (r && r.trick) { text += ` Oreo learned a new trick: ${r.trick.name}!`; toast(`🐾 New trick: <b>${esc(r.trick.name)}</b>`, 'gold'); }
    if (r && r.treasure) text = `Dig, dig, dig... Oreo found ${r.treasure}! He looks extremely proud.`;
    if (r && r.memory) setTimeout(() => snapshot(r.memory), 300);
    story('Oreo', text, [{ label: S.phase === 'evening' ? 'Head home for dinner' : 'Carry on', cls: 'rose', go: () => S.phase === 'evening' ? evening() : morning() }]);
  }
  function hud2(title, hint, len) {
    const box = document.createElement('div'); box.className = 'mg';
    box.innerHTML = `<div class="title">${esc(title)}</div><div class="hint">${esc(hint)}</div>${len ? '<div class="timer"><i></i></div>' : ''}<div class="score"></div>`;
    play.appendChild(box); return box;
  }
  function bigButtons(list) { const b = document.createElement('div'); b.className = 'bigbtns'; b.innerHTML = list.map((x, i) => `<button class="${x.cls || 'rose'}" data-big="${i}">${x.label}</button>`).join(''); play.appendChild(b); b.querySelectorAll('[data-big]').forEach(el => el.onpointerdown = ev => { ev.preventDefault(); AU.init(); list[+el.dataset.big].go(); }); return b; }

  const GAMES = {
    walk() {
      const box = hud2('Walkies!', 'Sniff the good smells. Hop over the puddles.', 15);
      view.dog = { x: 380, tx: 380, pose: 'walk', tongue: true };
      const items = []; let next = 1, sniffs = 0, hops = 0, total = 0, jumpT = -9;
      mg = { id: 'walk', t: 0, len: 15, box, items,
        tick(dt) {
          if (this.t > next && this.t < this.len - 2) { const puddle = Math.random() < 0.4; items.push({ x: W + 40, kind: puddle ? 'puddle' : ['flower', 'lamp', 'bush'][Math.floor(Math.random() * 3)], done: false }); total++; next = this.t + 1.1 + Math.random() * 0.9; }
          for (const it of items) { it.x -= 230 * dt; if (it.kind === 'puddle' && !it.done && it.x < view.dog.x + 10 && it.x > view.dog.x - 40) { it.done = true; if (this.t - jumpT < 0.6) { hops++; AU.sfx('pop'); } else { it.splash = 1; AU.sfx('fail'); } } }
          view.dog.pose = this.t - jumpT < 0.6 ? 'jump' : 'walk'; view.dog.phase = (view.dog.phase || 0) + dt * 10;
          box.querySelector('.score').textContent = `👃 ${sniffs}  🐾 ${hops}`;
        },
        draw() {
          const off = (this.t * 230) % 120;
          for (let x = -off; x < W + 120; x += 120) { c.fillStyle = 'rgba(60,120,40,.45)'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x + k * 10, GROUND + 30); c.lineTo(x + k * 10 + 4, GROUND + 14); c.lineTo(x + k * 10 + 8, GROUND + 30); c.fill(); } c.fillStyle = 'rgba(160,140,110,.6)'; c.beginPath(); c.ellipse(x + 60, GROUND + 60, 10, 5, 0, 0, Math.PI * 2); c.fill(); }
          for (let x = -((this.t * 60) % 400); x < W + 400; x += 400) { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x + 200, 150, 60, 18, 0, 0, Math.PI * 2); c.fill(); }
          for (const it of items) drawWalkItem(it);
        },
        done() { endActivity('walk', total ? (sniffs + hops) / total : 0.5, sniffs + hops >= total * 0.8 ? 'Best. Walk. Ever. Oreo sniffed every lamppost in the postcode.' : 'A lovely walk, a few muddy paws, and one very happy dog.'); },
        sniff() { const it = items.find(i => i.kind !== 'puddle' && !i.done && Math.abs(i.x - (view.dog.x + 60)) < 70); if (it) { it.done = true; sniffs++; AU.sfx('heart'); hearts(it.x, GROUND - 80, 3); } else AU.sfx('click'); },
        hop() { jumpT = this.t; AU.sfx('click'); } };
      bigButtons([{ label: '👃 Sniff', go: () => mg && mg.sniff() }, { label: '🐾 Hop', cls: 'ghost', go: () => mg && mg.hop() }]);
    },
    fetch() {
      const box = hud2('Fetch!', 'Hold Throw, let go, then press Jump when the ball comes down near Oreo.', 0);
      const thrower = chapter() >= 3 ? 'leo' : 'mia';
      view.family = [{ look: look(thrower) || look('mia'), x: 180, face: 'joy', arm: 'idle' }];
      view.dog = { x: 300, tx: 300, pose: 'sit', tongue: true };
      let throws = 0, catches = 0, charging = false, power = 0, ball = null, jumpT = -9;
      mg = { id: 'fetch', t: 0, len: 999, box,
        tick(dt) {
          if (charging) power = Math.min(1, power + dt * 0.8);
          if (ball) {
            ball.t += dt; ball.x = ball.x0 + ball.vx * ball.t; ball.y = ball.y0 - ball.vy * ball.t + 500 * ball.t * ball.t;
            view.dog.tx = Math.min(W - 80, ball.land - 30); view.dog.pose = Math.abs(view.dog.x - view.dog.tx) > 6 ? 'run' : 'sit'; view.dog.phase = (view.dog.phase || 0) + dt * 16;
            const near = Math.abs(ball.x - (view.dog.x + 50)) < 70 && ball.y > GROUND - 190 && ball.y < GROUND - 60 && ball.t > 0.4;
            if (near && this.t - jumpT < 0.35 && !ball.caught) { ball.caught = true; catches++; AU.sfx('legend'); hearts(view.dog.x + 40, GROUND - 160, 8); }
            if (ball.caught) { ball.x = view.dog.x + 64; ball.y = GROUND - 90; view.dog.ball = true; }
            if (ball.y >= GROUND - 10 && !ball.caught) { ball.y = GROUND - 10; ball.vx = 0; ball.vy = 0; ball.x0 = ball.x; ball.y0 = ball.y; ball.t = 0; ball.landed = true; }
            if ((ball.caught || ball.landed) && Math.abs(view.dog.x - view.dog.tx) < 8) { ball.done = (ball.done || 0) + dt; if (ball.done > 0.9) { ball = null; view.dog.ball = false; view.dog.tx = 300; throws++; if (throws >= 3) setTimeout(() => this.done(), 600); } }
          } else if (Math.abs(view.dog.x - view.dog.tx) > 6) { view.dog.pose = 'run'; view.dog.flip = true; view.dog.phase = (view.dog.phase || 0) + dt * 16; } else { view.dog.flip = false; view.dog.pose = 'sit'; }
          box.querySelector('.score').textContent = `🎾 ${catches} / ${throws}${charging ? '   power ' + '▮'.repeat(Math.round(power * 10)) : ''}`;
        },
        draw() { if (ball) { c.fillStyle = 'rgba(40,20,10,.2)'; c.beginPath(); c.ellipse(ball.x, GROUND, 14, 4, 0, 0, Math.PI * 2); c.fill(); if (!ball.caught) { c.fillStyle = '#c6f03a'; c.strokeStyle = '#3a2418'; c.lineWidth = 3; c.beginPath(); c.arc(ball.x, ball.y, 11, 0, Math.PI * 2); c.fill(); c.stroke(); } } },
        down() { if (ball || throws >= 3) return; charging = true; power = 0.15; },
        up() { if (!charging) return; charging = false; const p = 0.35 + power * 0.65; ball = { x0: 210, y0: GROUND - 150, vx: 380 + p * 520, vy: 420 + p * 160, t: 0 }; const tl = (ball.vy + Math.sqrt(ball.vy * ball.vy + 4 * 500 * 140)) / (2 * 500); ball.land = Math.min(W - 60, ball.x0 + ball.vx * tl); AU.sfx('flip'); },
        jump() { jumpT = this.t; view.dog.pose = 'jump'; AU.sfx('click'); },
        done() { endActivity('fetch', catches / 3, catches === 3 ? 'Three out of three! Oreo caught every single one in mid-air. Legend.' : catches ? `Oreo caught ${catches} in mid-air and fetched the rest with enormous pride.` : 'Oreo fetched every ball. Eventually. Via a bush.'); } };
      const b = bigButtons([{ label: '🎾 Throw (hold)', go: () => mg && mg.down() }, { label: '⬆️ Jump!', cls: 'ghost', go: () => mg && mg.jump() }]);
      b.querySelector('[data-big="0"]').onpointerup = () => mg && mg.up(); b.querySelector('[data-big="0"]').onpointerleave = () => mg && mg.up();
    },
    trick() {
      const box = hud2('Trick training', 'Watch Mia\'s signals, then copy them in the same order.', 0);
      view.family = [{ look: look('mia'), x: 820, face: 'happy', arm: 'idle' }];
      view.dog = { x: 520, tx: 520, pose: 'sit', tongue: true };
      const known = D.TRICKS.slice(0, Math.max(3, Math.min(D.TRICKS.length, S.tricks.length + 1)));
      const pad = document.createElement('div'); pad.className = 'bigbtns trickpad';
      pad.innerHTML = known.map(tr => `<button class="ghost" data-tr="${tr.id}"><span>${tr.icon}</span>${esc(tr.name)}</button>`).join(''); play.appendChild(pad);
      let round = 0, seq = [], pos = 0, showing = true, score = 0;
      const poseFor = id => ({ sit: 'sit', paw: 'beg', spin: 'walk', roll: 'roll', beg: 'beg', bang: 'sleep' }[id] || 'sit');
      const show = () => {
        showing = true; seq.push(known[Math.floor(Math.random() * known.length)].id); pos = 0;
        box.querySelector('.hint').textContent = `Round ${round + 1} of 3: watch...`;
        seq.forEach((id, i) => setTimeout(() => { const b = pad.querySelector(`[data-tr="${id}"]`); b.classList.add('lit'); view.family[0].arm = 'wave'; AU.sfx('pop'); setTimeout(() => { b.classList.remove('lit'); view.family[0].arm = 'idle'; }, 450); }, 700 + i * 700));
        setTimeout(() => { showing = false; box.querySelector('.hint').textContent = 'Your turn!'; }, 700 + seq.length * 700);
      };
      seq = [known[Math.floor(Math.random() * known.length)].id];
      mg = { id: 'trick', t: 0, len: 999, box, tick() {}, done(ok) { endActivity('trick', ok ? 1 : score, ok ? 'Good boy! Mia gave Oreo a whole sausage. (Don\'t tell Mum.)' : 'Not quite, but Oreo got a treat for trying. He thinks that counts.'); } };
      seq.pop(); show();
      pad.onclick = ev => { const b = ev.target.closest('[data-tr]'); if (!b || showing || !mg) return; const id = b.dataset.tr;
        view.dog.pose = poseFor(id); setTimeout(() => { if (view.dog) view.dog.pose = 'sit'; }, 600);
        if (id === seq[pos]) { pos++; AU.sfx('heart'); if (pos === seq.length) { round++; score = round / 3; hearts(view.dog.x + 30, GROUND - 120, 4); if (round >= 3) setTimeout(() => mg && mg.done(true), 500); else setTimeout(show, 700); } }
        else { AU.sfx('fail'); setTimeout(() => mg && mg.done(false), 500); } };
    },
    cuddle() {
      const box = hud2('Sofa cuddles', 'Stroke Oreo (drag across him) to fill his heart.', 9);
      view.place = 'home'; view.family = [{ look: look('mia'), x: 760, face: 'happy', arm: 'idle' }];
      view.dog = { x: 560, tx: 560, pose: 'lie', tongue: false };
      let love = 0, lastX = null;
      mg = { id: 'cuddle', t: 0, len: 9, box,
        tick() { box.querySelector('.score').textContent = '❤️'.repeat(Math.round(love / 20)) || '🤍'; view.dog.wag = Math.sin(this.t * (6 + love / 8)) * (0.3 + love / 150); view.dog.sleepy = love > 70; },
        stroke(x, y) { if (Math.abs(x - (view.dog.x + 10)) < 110 && y > GROUND - 120 && y < GROUND + 10) { if (lastX != null && Math.abs(x - lastX) > 2) { love = Math.min(100, love + Math.abs(x - lastX) * 0.06); if (Math.random() < 0.08) hearts(x, y - 30, 1); } lastX = x; } },
        done() { endActivity('cuddle', love / 100, love > 90 ? 'Oreo melted into the sofa like a happy puddle. Total bliss.' : 'Lovely cuddles. Oreo did that little sigh dogs do when everything is right.'); } };
    },
    nap() {
      const box = hud2('Nap in the sun', 'Shh. Oreo is dreaming. Tap when you want to wake him.', 0);
      view.dog = { x: 560, tx: 560, pose: 'sleep' };
      const dreams = ['🦴', '🐿️', '🎾', '🧀', '🌊', '❄️'];
      mg = { id: 'nap', t: 0, len: 999, box, dream: dreams[Math.floor(Math.random() * dreams.length)],
        tick() {}, draw() { const k = Math.min(1, this.t / 1.5); c.globalAlpha = k; c.fillStyle = '#fff'; c.strokeStyle = '#3a2418'; c.lineWidth = 3; c.beginPath(); c.arc(view.dog.x + 120, GROUND - 170, 46, 0, Math.PI * 2); c.fill(); c.stroke(); c.beginPath(); c.arc(view.dog.x + 80, GROUND - 100, 9, 0, Math.PI * 2); c.fill(); c.stroke(); c.font = '44px sans-serif'; c.textAlign = 'center'; c.fillText(this.dream, view.dog.x + 120 + Math.sin(t * 2) * 6, GROUND - 155); c.globalAlpha = 1; },
        done() { endActivity('nap', 1, `Oreo dreamed about ${({ '🦴': 'a bone as big as a sofa', '🐿️': 'finally catching that squirrel', '🎾': 'a ball that never stopped bouncing', '🧀': 'the cheese drawer, wide open', '🌊': 'the seaside', '❄️': 'snow, crunchy and cold' })[this.dream]}. His paws twitched the whole time.`); } };
      bigButtons([{ label: '☀️ Wake up, sleepy', cls: 'ghost', go: () => mg && mg.t > 1.5 && mg.done() }]);
    },
    dig() {
      const box = hud2('Dig, dig, dig!', 'Pick a spot, then tap it to dig.', 0);
      view.dog = { x: 300, tx: 300, pose: 'sit', tongue: true };
      const spots = [520, 760, 1000].map(x => ({ x, depth: 0 }));
      let chosen = null;
      mg = { id: 'dig', t: 0, len: 999, box, spots,
        tick(dt) { if (chosen) { view.dog.tx = chosen.x - 90; view.dog.pose = Math.abs(view.dog.x - view.dog.tx) > 6 ? 'run' : 'stand'; view.dog.phase = (view.dog.phase || 0) + dt * 14; } },
        draw() { for (const s of spots) { c.fillStyle = '#8a5a34'; c.strokeStyle = '#3a2418'; c.lineWidth = 3; c.beginPath(); c.ellipse(s.x, GROUND - 4, 46, 14 + s.depth * 2, 0, Math.PI, 0); c.fill(); c.stroke(); if (s.depth) { c.fillStyle = '#4a2a14'; c.beginPath(); c.ellipse(s.x, GROUND + 4, 10 + s.depth * 6, 4 + s.depth * 1.5, 0, 0, Math.PI * 2); c.fill(); } } },
        tap(x) { const s = spots.find(p => Math.abs(p.x - x) < 70); if (!s) return; if (!chosen) chosen = s; if (s !== chosen || Math.abs(view.dog.x - view.dog.tx) > 8) return; s.depth++; AU.sfx('flip'); for (let i = 0; i < 6; i++) parts.push({ x: s.x, y: GROUND - 10, vx: (Math.random() - 0.5) * 300, vy: -200 - Math.random() * 150, life: 0.8, e: '🟤', s: 10, g: 600 }); if (s.depth >= 6) this.done(); },
        done() { endActivity('dig', 1); } };
    },
  };

  function drawWalkItem(it) {
    const y = GROUND;
    if (it.kind === 'puddle') { c.fillStyle = it.splash ? '#7fb8e8' : '#5a9ad8'; c.beginPath(); c.ellipse(it.x, y + 4, 52, 12, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(it.x - 12, y + 1, 16, 3, 0, 0, Math.PI * 2); c.fill(); return; }
    c.globalAlpha = it.done ? 0.5 : 1;
    if (it.kind === 'lamp') { c.fillStyle = '#3a3a48'; c.fillRect(it.x - 5, y - 170, 10, 170); c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(it.x, y - 176, 14, 0, Math.PI * 2); c.fill(); }
    else if (it.kind === 'bush') { c.fillStyle = '#3f9a4a'; c.beginPath(); c.arc(it.x - 20, y - 20, 26, 0, Math.PI * 2); c.arc(it.x + 16, y - 26, 30, 0, Math.PI * 2); c.fill(); }
    else { c.font = '40px sans-serif'; c.textAlign = 'center'; c.fillText('🌼', it.x, y - 4); }
    if (!it.done) { c.font = '22px sans-serif'; c.textAlign = 'center'; c.fillText('👃', it.x, y - (it.kind === 'lamp' ? 200 : 70)); }
    c.globalAlpha = 1;
  }

  // ---------- evening, bedtime ----------
  function evening() {
    mode = 'day'; S.phase = 'evening';
    view.place = 'home'; view.tod = 'evening'; setFamily(chapter() >= 2 ? ['mum', 'dad', 'leo'] : ['mum', 'dad']);
    view.dog = { x: 420, tx: 420, pose: 'beg', tongue: true }; view.extra = 'bowl';
    story('Oreo', 'The best sound in the world: the biscuit tin. It\'s dinner time!', [{ label: '🥣 Fill the bowl', cls: 'rose', go: () => {
      E.dinner(S); buildHud(); AU.sfx('cash'); view.dog.pose = 'stand'; view.bowlFull = 2.5;
      setTimeout(() => bedtime(), 1800);
      story('Oreo', 'Crunch crunch crunch crunch. Gone in eleven seconds. A new record.', []);
    } }]);
  }
  function bedtime() {
    view.extra = null; view.place = 'night'; view.tod = 'night'; view.family = []; view.dog = { x: 280, tx: 280, pose: 'sleep' };
    const lines = ['Night night, Oreo.', 'Sweet dreams, good boy.', 'Somebody tucked a blanket round Oreo. He pretended to be asleep already.', 'The house is quiet. Oreo keeps one ear open, just in case.'];
    story('Oreo', lines[Math.floor(Math.random() * lines.length)], [{ label: '🌙 Sleep', cls: 'ghost', go: () => {
      const r = E.sleep(S); E.save(S); buildHud();
      if (S.phase === 'finale') return finale();
      if (r.chapterUp) return showChapter(r.chapterUp, beginDay);
      beginDay();
    } }]);
  }

  // ---------- the end of a life ----------
  function finale() {
    mode = 'finale'; mg = null; play.innerHTML = ''; hud.innerHTML = '';
    view.place = 'sunset'; view.tod = 'evening'; view.extra = null;
    setFamily(['mia', 'leo', 'mum', 'dad']); view.family.forEach((p, i) => { p.x = 640 + i * 150; p.face = 'happy'; });
    view.dog = { x: 380, tx: 380, pose: 'lie', tongue: false, sleepy: false };
    AU.play({ id: 'finale', genre: 'folk', seed: 777 });
    let i = 0;
    const next = () => {
      if (i < D.FINALE.lines.length) { screen.innerHTML = `<div class="panel" data-a="finnext" style="justify-content:flex-start;padding-top:70px"><div class="finale-line">${esc(D.FINALE.lines[i])}</div><div class="credit" style="margin-top:12px">tap</div></div>`; i++; if (i === D.FINALE.lines.length) { view.dog.sleepy = true; view.dog.pose = 'sleep'; } return; }
      slideshow();
    };
    finNext = next; next();
  }
  let finNext = null;
  function slideshow() {
    const mems = S.memories.slice();
    let k = 0;
    screen.innerHTML = `<div class="panel dim"><div class="slides" id="slides"></div><div class="finale-line" id="cap" style="font-size:22px"></div></div>`;
    const step = () => {
      if (k >= mems.length) return epilogue();
      const m = mems[k++];
      $('#slides').innerHTML = `<div class="polaroid" style="--r:${(k % 3 - 1) * 3}deg"><div class="img" style="background-image:url(${m.img || ''})">${m.img ? '' : '🐾'}</div><b>${esc(m.caption)}</b><small>Day ${m.day}</small></div>`;
      $('#cap').textContent = m.text || '';
      setTimeout(step, 2600);
    };
    step();
  }
  function epilogue() {
    meta = E.finish(meta, S); E.saveMeta(meta);
    view.dog = { x: 520, tx: 520, pose: 'run', tongue: true, age: 0 }; view.family = []; view.place = 'garden'; view.tod = 'day';
    screen.innerHTML = `<div class="panel dim"><div class="card" style="max-width:760px;text-align:center"><h2 style="font-family:var(--logo);font-weight:400;font-size:44px">Thank you, Oreo</h2>
      <p style="font-size:19px;line-height:1.45">${esc(D.FINALE.epilogue)}</p>
      <p>${S.memories.length} memories · ${S.tricks.length} tricks learned · ❤️ ${S.bond} love</p>
      <div class="row"><button class="ghost" data-a="album">Memory album</button><button class="rose" data-a="new">Live it again</button><button class="ghost" data-a="title">Menu</button></div></div></div>`;
    E.wipe();
  }

  // ---------- drawing ----------
  function draw(dt) {
    c.clearRect(0, 0, W, H);
    c.drawImage(A.place(W, H, view.place, view.tod), 0, 0);
    // falling leaves / snow / fireflies for atmosphere
    ambient(dt);
    const d = view.dog;
    d.x += Math.sign(d.tx - d.x) * Math.min(Math.abs(d.tx - d.x), (d.pose === 'run' ? 360 : 140) * dt);
    if (mg && mg.draw && mg.id !== 'nap') mg.draw();
    if (view.extra === 'bowl') { const bx = d.x + 110; c.fillStyle = '#e5203a'; c.strokeStyle = '#3a2418'; c.lineWidth = 3; c.beginPath(); c.ellipse(bx, GROUND - 6, 40, 14, 0, 0, Math.PI * 2); c.fill(); c.stroke(); if (view.bowlFull > 0) { c.fillStyle = '#a8703a'; c.beginPath(); c.ellipse(bx, GROUND - 12, 30, 8, 0, 0, Math.PI * 2); c.fill(); view.bowlFull -= dt; } c.fillStyle = '#fff'; c.font = '700 12px Fredoka'; c.textAlign = 'center'; c.fillText('OREO', bx, GROUND); }
    const people = view.family.slice().sort((a, b) => a.x - b.x);
    for (const p of people) A.person(c, p.look, p.x, GROUND + 6, 1.02, { face: p.face, arm: p.arm, t, blink: ((t + p.x) % 4) < 0.12 });
    if (mode === 'title') { A.dog(c, 640, GROUND + 40, 2.2, { pose: 'sit', age: 0.35, t, tongue: true, blink: (t % 3.5) < 0.12, look: Math.sin(t * 0.7) }); }
    else A.dog(c, d.x, GROUND + 4, 1.45, { pose: d.pose, phase: d.phase || t * 8, age: d.age != null ? d.age : age(), t, tongue: d.tongue, flip: d.flip, ball: d.ball, wag: d.wag, blink: d.sleepy || (t % 3.7) < 0.12, sleepy: d.sleepy, look: d.look });
    if (mg && mg.id === 'nap') mg.draw();
    for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 20) * dt; p.life -= dt; c.globalAlpha = Math.max(0, Math.min(1, p.life)); c.font = p.s + 'px sans-serif'; c.textAlign = 'center'; c.fillText(p.e, p.x, p.y); }
    c.globalAlpha = 1; parts = parts.filter(p => p.life > 0);
  }
  const amb = [];
  function ambient(dt) {
    const kind = view.place === 'snow' ? 'snow' : view.tod === 'night' ? 'fly' : view.place === 'sunset' || view.tod === 'evening' ? 'mote' : (view.place === 'park' || view.place === 'garden') && chapter() === 3 ? 'leaf' : null;
    if (!kind) { amb.length = 0; return; }
    while (amb.length < 40) amb.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random(), k: kind });
    for (const a of amb) {
      if (a.k !== kind) { a.k = kind; }
      if (kind === 'snow') { a.y += (30 + a.s * 40) * dt; a.x += Math.sin(t + a.s * 9) * 12 * dt; c.fillStyle = '#fff'; c.beginPath(); c.arc(a.x, a.y, 2 + a.s * 3, 0, Math.PI * 2); c.fill(); }
      else if (kind === 'leaf') { a.y += (25 + a.s * 30) * dt; a.x += Math.sin(t * 2 + a.s * 9) * 30 * dt; c.fillStyle = ['#e8913a', '#d9604c', '#f2c14e'][Math.floor(a.s * 3)]; c.beginPath(); c.ellipse(a.x, a.y, 6, 3, t + a.s * 6, 0, Math.PI * 2); c.fill(); }
      else { a.y -= (6 + a.s * 10) * dt; a.x += Math.sin(t + a.s * 9) * 8 * dt; c.fillStyle = kind === 'fly' ? `rgba(255,240,150,${0.4 + 0.4 * Math.sin(t * 3 + a.s * 20)})` : `rgba(255,230,180,${0.25 + 0.2 * Math.sin(t * 2 + a.s * 20)})`; c.beginPath(); c.arc(a.x, a.y, kind === 'fly' ? 2.5 : 2 + a.s * 2, 0, Math.PI * 2); c.fill(); }
      if (a.y > H + 10) a.y = -10; if (a.y < -10) a.y = H + 10; if (a.x > W + 10) a.x = -10; if (a.x < -10) a.x = W + 10;
    }
  }

  // ---------- input ----------
  cv.addEventListener('pointermove', ev => { if (!mg || mg.id !== 'cuddle' || !(ev.buttons & 1) && ev.pointerType === 'mouse') return; const r = cv.getBoundingClientRect(), k = W / r.width; mg.stroke((ev.clientX - r.left) * k, (ev.clientY - r.top) * k); });
  cv.addEventListener('pointerdown', ev => { if (!mg) return; const r = cv.getBoundingClientRect(), k = W / r.width; const x = (ev.clientX - r.left) * k; if (mg.id === 'dig') mg.tap(x); });
  document.addEventListener('click', ev => {
    AU.init();
    const el = ev.target.closest('[data-a]'); if (!el) return;
    switch (el.dataset.a) {
      case 'new': newLife(); break;
      case 'continue': resume(); break;
      case 'album': showAlbum(); break;
      case 'closealbum': if (albumBack === 'title' || !S) showTitle(); else { mode = albumBack; screen.innerHTML = ''; if (albumBack === 'finale' || !S.phase || S.phase === 'finale') epilogue(); } break;
      case 'title': showTitle(); break;
      case 'intro': ev.preventDefault(); AU.stop(); playIntro(showTitle); break;
      case 'chaptergo': screen.innerHTML = ''; if (chapterThen) { const f = chapterThen; chapterThen = null; f(); } break;
      case 'finnext': AU.sfx('pop'); finNext && finNext(); break;
      case 'mute': AU.setMuted(!AU.muted); el.textContent = AU.muted ? '🔇' : '🔊'; break;
    }
  });
  document.addEventListener('keydown', ev => {
    if (!mg) return;
    if (mg.id === 'walk') { if (ev.key === 'ArrowUp' || ev.key === ' ') { ev.preventDefault(); mg.hop(); } if (ev.key === 'ArrowRight' || ev.key === 's') mg.sniff(); }
    if (mg.id === 'fetch' && ev.key === ' ') { ev.preventDefault(); mg.jump(); }
  });

  // ---------- loop ----------
  function frame(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; t += dt;
    if (mg) { mg.t += dt; mg.tick(dt); const bar = play.querySelector('.mg .timer i'); if (bar) bar.style.width = Math.max(0, 100 - mg.t / mg.len * 100) + '%'; if (mg && mg.t >= mg.len) mg.done(); }
    draw(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__oreo = { get S() { return S; }, set S(v) { S = v; }, GAMES, startActivity, beginDay, finale, get mode() { return mode; }, view };
  playIntro(showTitle);
})();

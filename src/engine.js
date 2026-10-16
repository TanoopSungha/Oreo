// Oreo: the rules of a dog's life. No DOM in here, so it can be tested in Node.
(function (G) {
  'use strict';
  const D = G.OREO_DATA;
  const SAVE = 'oreo-life-v1', META = 'oreo-meta-v1';
  let R = Math.random;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pickR = a => a[Math.floor(R() * a.length)];

  function newLife() {
    return { v: 1, day: 1, phase: 'dawn', tummy: 80, energy: 90, happy: 70, bond: 0, memories: [], tricks: [], picksLeft: 2, offer: [], seen: {}, best: { fetch: 0, walk: 0 }, treasures: [], diary: '', did: {} };
  }
  const chapterOf = day => { let c = 0; for (const ch of D.CHAPTERS) if (day >= ch.from) c = ch.id; return c; };
  const ageOf = day => Math.min(1, (day - 1) / (D.LAST_DAY - 1));

  // Begin a day: a big moment if there is one, otherwise a diary line and a choice of things to do.
  function startDay(S) {
    if (S.day > D.LAST_DAY) { S.phase = 'finale'; return S; }
    const ch = chapterOf(S.day);
    S.diary = pickR(D.DIARY[ch]);
    const pool = Object.keys(D.ACTIVITIES).filter(a => !(ch === 3 && a === 'fetch' && R() < 0.5));
    const offer = [];
    if (S.energy < 40) offer.push('nap');
    while (offer.length < 3) { const a = pickR(pool); if (!offer.includes(a)) offer.push(a); }
    S.offer = offer; S.picksLeft = 2; S.did = {};
    S.phase = D.EVENTS[S.day] && !S.seen[S.day] ? 'event' : 'morning';
    return S;
  }

  function addMemory(S, caption, place, extra) {
    if (S.memories.some(m => m.caption === caption)) return null;
    const m = Object.assign({ caption, day: S.day, place, chapter: chapterOf(S.day) }, extra || {});
    S.memories.push(m); return m;
  }

  function eventChoice(S, i) {
    const ev = D.EVENTS[S.day]; if (!ev || S.phase !== 'event') return null;
    const o = ev.opts[i]; if (!o) return null;
    S.seen[S.day] = true; S.bond += 10; S.happy = clamp(S.happy + 10, 0, 100);
    const mem = addMemory(S, o.memory, ev.place, { text: o.reply });
    S.phase = 'morning';
    return { reply: o.reply, memory: mem };
  }

  // Do one of the day's activities. score 0..1 from the little game.
  function doActivity(S, id, score) {
    const a = D.ACTIVITIES[id]; if (!a || S.picksLeft <= 0 || !S.offer.includes(id) || S.did[id]) return null;
    score = clamp(score == null ? 1 : score, 0, 1);
    const tired = S.energy < 15 && a.energy < 0;
    S.energy = clamp(S.energy + a.energy, 0, 100);
    S.tummy = clamp(S.tummy + a.tummy, 0, 100);
    S.happy = clamp(S.happy + Math.round(a.happy * (0.5 + score) * (tired ? 0.5 : 1)), 0, 100);
    S.bond += Math.round(a.bond * (0.6 + score));
    S.picksLeft--; S.did[id] = true;
    const res = { id, score };
    if (id === 'trick' && score >= 0.99 && S.tricks.length < D.TRICKS.length) { const tr = D.TRICKS[S.tricks.length]; S.tricks.push(tr.id); res.trick = tr; if (S.tricks.length === D.TRICKS.length) res.memory = addMemory(S, 'Every trick in the book', 'home'); }
    if (id === 'dig') { const tr = pickR(D.TREASURES); if (!S.treasures.includes(tr)) S.treasures.push(tr); res.treasure = tr; }
    if (id === 'fetch') { const c = Math.round(score * 3); S.best.fetch = Math.max(S.best.fetch, c); if (c === 3) res.memory = addMemory(S, 'Three catches in a row', 'park'); }
    if (id === 'walk' && score >= 0.9) res.memory = addMemory(S, 'The perfect walk', 'park');
    if (id === 'cuddle' && score >= 0.95 && chapterOf(S.day) === 3) res.memory = addMemory(S, 'Slow Sunday cuddles', 'home');
    if (S.picksLeft <= 0) S.phase = 'evening';
    return res;
  }

  // Dinner, then bed, then a new day.
  function dinner(S) { S.tummy = 100; S.happy = clamp(S.happy + 4, 0, 100); return S; }
  function sleep(S) {
    S.energy = clamp(S.energy + 55, 0, 100); S.tummy = clamp(S.tummy - 25, 0, 100);
    const before = chapterOf(S.day);
    S.day++;
    const res = { chapterUp: S.day <= D.LAST_DAY && chapterOf(S.day) !== before ? D.CHAPTERS[chapterOf(S.day)] : null };
    startDay(S);
    return res;
  }

  function finish(meta, S) {
    meta.lives = (meta.lives || 0) + 1;
    meta.memories = meta.memories || {};
    for (const m of S.memories) meta.memories[m.caption] = meta.memories[m.caption] || { caption: m.caption, day: m.day, img: m.img, text: m.text };
    meta.bestBond = Math.max(meta.bestBond || 0, S.bond);
    return meta;
  }

  // Every memory there is to find (events plus the special ones).
  function allMemories() {
    const out = [];
    for (const d of Object.keys(D.EVENTS)) for (const o of D.EVENTS[d].opts) out.push(o.memory);
    return out.concat(['Every trick in the book', 'Three catches in a row', 'The perfect walk', 'Slow Sunday cuddles']);
  }

  function save(S, store) { try { (store || G.localStorage).setItem(SAVE, JSON.stringify(S)); } catch (e) { /* storage may be full or unavailable */ } }
  function load(store) { try { const s = (store || G.localStorage).getItem(SAVE); const S = s && JSON.parse(s); return S && S.v === 1 ? S : null; } catch (e) { return null; } }
  function wipe(store) { try { (store || G.localStorage).removeItem(SAVE); } catch (e) { /* ignore */ } }
  function saveMeta(m, store) { try { (store || G.localStorage).setItem(META, JSON.stringify(m)); } catch (e) { /* ignore */ } }
  function loadMeta(store) { try { return JSON.parse((store || G.localStorage).getItem(META)) || {}; } catch (e) { return {}; } }

  G.OREO = { newLife, startDay, eventChoice, doActivity, dinner, sleep, finish, chapterOf, ageOf, allMemories, addMemory, save, load, wipe, saveMeta, loadMeta, setRandom: f => { R = f; } };
})(typeof window !== 'undefined' ? window : globalThis);

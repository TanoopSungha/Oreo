// Oreo: the story of one dog's life. Every person and dog here is made up.
(function (G) {
  'use strict';
  function rng(seed) {
    let s = (typeof seed === 'string' ? hash(seed) : seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  const LAST_DAY = 40;
  const CHAPTERS = [
    { id: 0, name: 'ch.0.name', from: 1, blurb: 'ch.0.blurb', music: 'folk' },
    { id: 1, name: 'ch.1.name', from: 10, blurb: 'ch.1.blurb', music: 'reggae' },
    { id: 2, name: 'ch.2.name', from: 20, blurb: 'ch.2.blurb', music: 'soul' },
    { id: 3, name: 'ch.3.name', from: 31, blurb: 'ch.3.blurb', music: 'jazz' },
  ];

  // The family, drawn with the same character art as the other Snoopster games.
  const FAMILY = {
    mia: [ // Mia grows up alongside Oreo
      { skin: '#e9b98f', hair: 'curly', hairCol: '#3b2414', top: 'tee', col: '#ff8ac0', legs: '#2f9bff', acc: 'none', build: 0.8, h: 0.66, eyes: '#5a3a22', lashes: true },
      { skin: '#e9b98f', hair: 'curly', hairCol: '#3b2414', top: 'hoodie', col: '#b14bff', legs: '#2b3a67', acc: 'none', build: 0.88, h: 0.86, eyes: '#5a3a22', lashes: true },
      { skin: '#e9b98f', hair: 'long', hairCol: '#3b2414', top: 'cardigan', col: '#39d0b8', legs: '#2b3a67', acc: 'earrings', build: 0.9, h: 0.97, eyes: '#5a3a22', lashes: true, lips: '#d86878' },
      { skin: '#e9b98f', hair: 'bun', hairCol: '#3b2414', top: 'shirt', col: '#f2a93b', legs: '#2b3a67', acc: 'glasses', build: 0.92, h: 0.98, eyes: '#5a3a22', lashes: true, lips: '#d86878' },
    ],
    mum: { skin: '#e9b98f', hair: 'bob', hairCol: '#6b3d1f', top: 'cardigan', col: '#7a9ad8', legs: '#2b3a67', acc: 'earrings', build: 0.95, h: 0.96, eyes: '#4a6b48', lashes: true, lips: '#c95c6e' },
    dad: { skin: '#b97a4e', hair: 'short', hairCol: '#1c1410', top: 'shirt', col: '#2f6f5e', legs: '#4a3b2a', acc: 'beard', build: 1.15, h: 1.04, eyes: '#3e2514' },
    ted: { skin: '#f0c9a8', hair: 'bald', hairCol: '#d9d9d9', top: 'cardigan', col: '#a7783f', legs: '#5b6470', acc: 'glasses', build: 1.05, h: 0.94, eyes: '#4a6a8a' },
    leo: [
      null, null,
      { skin: '#d9a06f', hair: 'spiky', hairCol: '#3b2414', top: 'tee', col: '#ffcf3f', legs: '#2f9bff', acc: 'none', build: 0.7, h: 0.5, eyes: '#4a6b48' },
      { skin: '#d9a06f', hair: 'short', hairCol: '#3b2414', top: 'hoodie', col: '#e5483b', legs: '#2b3a67', acc: 'none', build: 0.82, h: 0.72, eyes: '#4a6b48' },
    ],
  };

  // Oreo's diary: one of these opens each ordinary day. All the words live in i18n/<lang>.js; here are just their keys.
  const DIARY = [8, 6, 6, 6].map((n, c) => Array.from({ length: n }, (_, i) => `diary.${c}.${i}`));

  // Things to do. Each day you get to pick two.
  const ACTIVITIES = {
    walk: { name: 'act.walk', icon: '🦮', place: 'park', energy: -18, happy: 14, bond: 4, tummy: -10, game: 'walk' },
    fetch: { name: 'act.fetch', icon: '🎾', place: 'park', energy: -22, happy: 16, bond: 5, tummy: -12, game: 'fetch' },
    trick: { name: 'act.trick', icon: '🐾', place: 'home', energy: -10, happy: 8, bond: 7, tummy: -4, game: 'trick' },
    cuddle: { name: 'act.cuddle', icon: '🛋️', place: 'home', energy: 4, happy: 10, bond: 9, tummy: -2, game: 'cuddle' },
    nap: { name: 'act.nap', icon: '☀️', place: 'garden', energy: 30, happy: 4, bond: 1, tummy: -4, game: 'nap' },
    dig: { name: 'act.dig', icon: '🦴', place: 'garden', energy: -14, happy: 12, bond: 2, tummy: -8, game: 'dig' },
  };

  const TRICKS = [
    { id: 'sit', name: 'trick.sit', icon: '🪑' }, { id: 'paw', name: 'trick.paw', icon: '🐾' }, { id: 'spin', name: 'trick.spin', icon: '🌀' },
    { id: 'roll', name: 'trick.roll', icon: '🔄' }, { id: 'beg', name: 'trick.beg', icon: '🙏' }, { id: 'bang', name: 'trick.bang', icon: '💥' },
  ];

  // Things buried in the garden.
  const TREASURES = Array.from({ length: 8 }, (_, i) => `treasure.${i}`);

  // The big moments of a life. Each has a place, what happens, and how Oreo can respond.
  // Every choice is a kind one: they just make different memories.
  const EVENTS = {
    1: { place: 'home', who: ['mia', 'mum'] },
    2: { place: 'night', who: ['mia'] },
    4: { place: 'garden', who: ['dad'] },
    6: { place: 'vet', who: ['mum'] },
    9: { place: 'park', who: ['ted'] },
    12: { place: 'snow', who: ['mia', 'dad'] },
    14: { place: 'home', who: ['mia'] },
    17: { place: 'beach', who: ['mia', 'mum', 'dad'] },
    19: { place: 'home', who: ['mia', 'mum', 'dad'] },
    21: { place: 'home', who: ['mum', 'dad'] },
    24: { place: 'park', who: ['mia'] },
    26: { place: 'home', who: ['leo', 'mum'] },
    29: { place: 'home', who: ['mia', 'mum', 'dad'] },
    32: { place: 'home', who: ['mia', 'leo'] },
    34: { place: 'park', who: ['ted'] },
    37: { place: 'garden', who: ['mia', 'leo'] },
  };
  // Text keys: ev.<day>.text and ev.<day>.<option>.label / .reply / .memory (the memory key is also the memory's id).
  for (const d of Object.keys(EVENTS)) { EVENTS[d].text = `ev.${d}.text`; EVENTS[d].opts = [0, 1].map(i => ({ label: `ev.${d}.${i}.label`, reply: `ev.${d}.${i}.reply`, memory: `ev.${d}.${i}.memory` })); }

  // The last day.
  const FINALE = { place: 'sunset', lines: Array.from({ length: 6 }, (_, i) => `finale.${i}`), epilogue: 'finale.epilogue' };

  // Background grooves for the shared synth engine.
  const GENRES = { soul: { bpm: 84 }, folk: { bpm: 92 }, jazz: { bpm: 96 }, reggae: { bpm: 74 } };

  G.OREO_DATA = { rng, hash, pick, LAST_DAY, CHAPTERS, FAMILY, DIARY, ACTIVITIES, TRICKS, TREASURES, EVENTS, FINALE, GENRES };
})(typeof window !== 'undefined' ? window : globalThis);

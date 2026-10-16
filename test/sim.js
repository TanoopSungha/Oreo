// Headless test: lives a whole life several times and checks the story holds together.
require('../src/data.js'); require('../src/engine.js');
const assert = require('assert');
const D = globalThis.OREO_DATA, E = globalThis.OREO;
E.setRandom(D.rng(7));
for (const d of Object.keys(D.EVENTS)) { const ev = D.EVENTS[d]; assert(+d >= 1 && +d <= D.LAST_DAY); assert(ev.opts.length >= 2); for (const w of ev.who) assert(D.FAMILY[w], 'family ' + w); }
assert.strictEqual(new Set(E.allMemories()).size, E.allMemories().length, 'memory captions are unique');
for (let run = 0; run < 20; run++) {
  const S = E.newLife(); E.startDay(S);
  let guard = 0, chapters = 0;
  while (S.phase !== 'finale' && guard++ < 500) {
    if (S.phase === 'event') { const r = E.eventChoice(S, run % 2); assert(r && r.reply && r.memory); }
    while (S.phase === 'morning') { const a = S.offer.find(x => !S.did[x]); assert(a, 'an activity to do'); const r = E.doActivity(S, a, Math.random()); assert(r); }
    assert.strictEqual(S.phase, 'evening');
    E.dinner(S); const r = E.sleep(S); if (r.chapterUp) chapters++;
    for (const k of ['tummy', 'energy', 'happy']) assert(S[k] >= 0 && S[k] <= 100);
  }
  assert.strictEqual(S.phase, 'finale'); assert.strictEqual(S.day, D.LAST_DAY + 1); assert.strictEqual(chapters, 3);
  assert(S.memories.length >= Object.keys(D.EVENTS).length, 'one memory per big moment');
  if (run === 0) console.log(`a life: ${S.memories.length} memories, ${S.tricks.length} tricks, bond ${S.bond}, ${S.treasures.length} treasures`);
}
console.log('all tests passed');

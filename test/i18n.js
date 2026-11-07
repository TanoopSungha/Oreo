// Languages: every dictionary has exactly the English keys, no empty text, the same {placeholders},
// the picker offers exactly the six languages, and anything missing falls back to English.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const CODES = ['en', 'fr', 'de', 'es', 'hi', 'zh-Hans'];
for (const c of CODES) require(path.join(SRC, 'i18n', c + '.js'));
require(path.join(SRC, 'i18n.js'));
require(path.join(SRC, 'data.js')); require(path.join(SRC, 'engine.js'));
const I = globalThis.OREO_I18N, D = globalThis.OREO_DATA, E = globalThis.OREO;
const en = I.DICT.en;
const holes = s => (s.match(/\{\w+\}/g) || []).sort().join(',');

// the picker
assert.deepStrictEqual(I.LANGS.map(l => l.code), CODES, 'picker lists exactly the six languages, in order');
assert.deepStrictEqual(I.LANGS.map(l => l.label), ['English', 'Français', 'Deutsch', 'Español', 'हिन्दी', '简体中文']);
assert.deepStrictEqual(Object.keys(I.DICT).sort(), CODES.slice().sort(), 'one dictionary per language, no others');

// the dictionaries
for (const c of CODES) {
  const d = I.DICT[c];
  const missing = Object.keys(en).filter(k => !(k in d)), extra = Object.keys(d).filter(k => !(k in en));
  assert.deepStrictEqual(missing, [], c + ': missing keys');
  assert.deepStrictEqual(extra, [], c + ': unknown keys');
  for (const k of Object.keys(en)) {
    assert(typeof d[k] === 'string' && d[k].trim() !== '', `${c}: empty text for ${k}`);
    assert.strictEqual(holes(d[k]), holes(en[k]), `${c}: placeholders differ in ${k}`);
  }
}
// plural pairs come in twos
for (const k of Object.keys(en)) if (/\.(one|other)$/.test(k)) { const base = k.replace(/\.(one|other)$/, ''); assert(en[base + '.one'] && en[base + '.other'], 'plural pair ' + base); }

// every text key the game data and the code use exists in English
const dataKeys = [];
for (const ch of D.CHAPTERS) dataKeys.push(ch.name, ch.blurb);
for (const p of D.DIARY) dataKeys.push(...p);
for (const a of Object.values(D.ACTIVITIES)) dataKeys.push(a.name);
for (const tr of D.TRICKS) dataKeys.push(tr.name);
dataKeys.push(...D.TREASURES, ...D.FINALE.lines, D.FINALE.epilogue, ...E.allMemories());
for (const ev of Object.values(D.EVENTS)) { dataKeys.push(ev.text); for (const o of ev.opts) dataKeys.push(o.label, o.reply, o.memory); }
for (const k of dataKeys) assert(I.has(k), 'data key has English text: ' + k);
const ui = fs.readFileSync(path.join(SRC, 'ui.js'), 'utf8');
const used = new Set();
for (const m of ui.matchAll(/(?:\bT|span|setHint|tb)\(\s*'([\w.]+)'/g)) used.add(m[1]);
for (const m of ui.matchAll(/hud2\('([\w.]+)', '([\w.]+)'/g)) used.add(m[1]).add(m[2]);
for (const m of ui.matchAll(/key: '([\w.]+)'/g)) used.add(m[1]);
for (const m of ui.matchAll(/'(dream\.\w+)'/g)) used.add(m[1]);
for (const m of ui.matchAll(/'((?:walk|fetch|trickgame|cuddle)\.\w+)'/g)) used.add(m[1]);
assert(used.size > 50, 'found the keys the UI uses');
for (const k of used) if (!k.endsWith('.')) assert(I.has(k) || I.has(k + '.one'), 'UI key has English text: ' + k);
for (const w of ['zoomies', 'wagging', 'curious', 'cuddles']) assert(I.has('hud.wag.' + w));
// no English sentences left hard-coded in what the player reads
assert(!/'(Carry on|Memory album|Day \$|Walkies|Fetch!|Close|Sleep)/.test(ui), 'no hard-coded English labels in ui.js');

// lookups, plurals, formatting and the English fallback
I.setLang('fr');
assert.strictEqual(I.getLang(), 'fr');
assert.strictEqual(I.t('hud.day', { day: 3 }), 'Jour 3');
assert.strictEqual(I.t('end.memories', { count: 1 }), '1 souvenir');
assert.strictEqual(I.t('end.memories', { count: 12 }), '12 souvenirs');
I.DICT.fr['zz.onlyEnglish'] = ''; I.DICT.en['zz.onlyEnglish'] = 'Only in English, {name}';
assert.strictEqual(I.t('zz.onlyEnglish', { name: 'Oreo' }), 'Only in English, Oreo', 'falls back to English');
delete I.DICT.fr['zz.onlyEnglish']; delete I.DICT.en['zz.onlyEnglish'];
const warn = console.warn; console.warn = () => {};
assert.strictEqual(I.t('zz.nowhere'), '', 'never shows a raw key');
console.warn = warn;
I.setLang('de'); assert.strictEqual(I.t('hud.love', { value: 12345 }), 'Liebe: 12.345', 'numbers use the language\'s format');
assert.strictEqual(I.setLang('xx'), false); assert.strictEqual(I.getLang(), 'de');
assert.strictEqual(I.inLang('en', () => I.t('bed.sleep')), 'Sleep'); assert.strictEqual(I.getLang(), 'de');
I.setLang('en');

// first run follows the device's languages
const det = list => I.detect(list);
assert.strictEqual(det(['fr-CA']), 'fr'); assert.strictEqual(det(['de-AT', 'en']), 'de'); assert.strictEqual(det(['es-419']), 'es');
assert.strictEqual(det(['hi-IN']), 'hi'); assert.strictEqual(det(['zh-CN']), 'zh-Hans'); assert.strictEqual(det(['zh-SG']), 'zh-Hans');
assert.strictEqual(det(['zh-Hans-HK']), 'zh-Hans'); assert.strictEqual(det(['zh']), 'zh-Hans'); assert.strictEqual(det(['zh-TW', 'ja', 'it']), 'en');
assert.strictEqual(det(['pt-BR', 'es-MX']), 'es'); assert.strictEqual(det(['ja']), 'en'); assert.strictEqual(det([]), 'en');

// saves from before languages still load: English captions become keys
const store = { d: {}, getItem(k) { return this.d[k] || null; }, setItem(k, v) { this.d[k] = v; }, removeItem(k) { delete this.d[k]; } };
store.setItem('oreo-meta-v1', JSON.stringify({ lives: 1, memories: { 'First hello': { caption: 'First hello', day: 1, text: 'She giggled. Her hand smelled of toast. I decided to stay forever.' }, 'The perfect walk': { caption: 'The perfect walk', day: 5 } } }));
const meta = E.loadMeta(store);
assert.deepStrictEqual(Object.keys(meta.memories).sort(), ['ev.1.0.memory', 'mem.walk']);
assert.strictEqual(meta.memories['ev.1.0.memory'].text, 'ev.1.0.reply');
store.setItem('oreo-life-v1', JSON.stringify(Object.assign(E.newLife(), { diary: 'Mia smells like toast and happiness.', memories: [{ caption: 'First night', day: 2, text: 'Mia came downstairs in her pyjamas and slept on the floor next to my bed.' }], treasures: ['a toy dinosaur'] })));
const S = E.load(store);
assert.strictEqual(S.diary, 'diary.0.4'); assert.strictEqual(S.memories[0].caption, 'ev.2.0.memory'); assert.deepStrictEqual(S.treasures, ['treasure.5']);

console.log(`languages: ${CODES.length} × ${Object.keys(en).length} texts, all present`);

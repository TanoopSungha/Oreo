// Oreo: languages. One small module, the same shape in every Snoopster game.
// Dictionaries live in i18n/<code>.js and register themselves on OREO_I18N_DICT before this file loads.
(function (G) {
  'use strict';
  const LANGS = [
    { code: 'en', label: 'English', locale: 'en-GB' },
    { code: 'fr', label: 'Français', locale: 'fr-FR' },
    { code: 'de', label: 'Deutsch', locale: 'de-DE' },
    { code: 'es', label: 'Español', locale: 'es-ES' },
    { code: 'hi', label: 'हिन्दी', locale: 'hi-IN' },
    { code: 'zh-Hans', label: '简体中文', locale: 'zh-Hans' },
  ];
  const STORE_KEY = 'oreo-lang';
  const DICT = G.OREO_I18N_DICT = G.OREO_I18N_DICT || {};
  const valid = code => LANGS.some(l => l.code === code);
  const localeOf = code => (LANGS.find(l => l.code === code) || LANGS[0]).locale;
  let cur = null;

  // First run: follow the device's languages when one of ours is there, else English.
  function detect(list) {
    for (const raw of list || []) {
      const l = String(raw || '').toLowerCase();
      if (l.startsWith('zh')) { if (l === 'zh' || l.includes('hans') || l === 'zh-cn' || l === 'zh-sg') return 'zh-Hans'; continue; }
      for (const c of ['en', 'fr', 'de', 'es', 'hi']) if (l === c || l.startsWith(c + '-')) return c;
    }
    return 'en';
  }
  function getLang() {
    if (cur) return cur;
    let saved = null;
    try { saved = G.localStorage && G.localStorage.getItem(STORE_KEY); } catch (e) { /* storage unavailable */ }
    if (valid(saved)) cur = saved;
    else { const nav = G.navigator; cur = detect(nav ? (nav.languages && nav.languages.length ? nav.languages : [nav.language]) : []); }
    return cur;
  }
  function setLang(code) {
    if (!valid(code)) return false;
    const changed = code !== getLang();
    cur = code;
    try { G.localStorage && G.localStorage.setItem(STORE_KEY, code); } catch (e) { /* storage unavailable */ }
    if (G.document) applyDom(G.document);
    if (changed && typeof G.dispatchEvent === 'function' && typeof G.CustomEvent === 'function') G.dispatchEvent(new G.CustomEvent('langchange', { detail: { lang: code } }));
    return true;
  }

  const get = (lang, key) => { const d = DICT[lang]; const s = d && d[key]; return typeof s === 'string' && s !== '' ? s : null; };
  function plural(lang, n) { try { return new Intl.PluralRules(localeOf(lang)).select(n) === 'one' ? 'one' : 'other'; } catch (e) { return n === 1 ? 'one' : 'other'; } }
  function raw(key, vars, lang) {
    if (vars && typeof vars.count === 'number') {
      const s = get(lang, key + '.' + plural(lang, vars.count)) || get('en', key + '.' + plural('en', vars.count));
      if (s) return s;
    }
    return get(lang, key) || get('en', key);
  }
  function fmtNumber(n, opts) { try { return new Intl.NumberFormat(localeOf(getLang()), opts).format(n); } catch (e) { return String(n); } }
  function fmtDate(d, opts) { try { return new Intl.DateTimeFormat(localeOf(getLang()), opts).format(d); } catch (e) { return String(d); } }
  // t('key', { name: 'x', count: 3 }): the current language, then English, never the raw key.
  function t(key, vars) {
    const s = raw(key, vars, getLang());
    if (s == null) { if (G.console) G.console.warn('[i18n] missing text: ' + key); return ''; }
    return !vars ? s : s.replace(/\{(\w+)\}/g, (m, k) => { const v = vars[k]; return v == null ? '' : typeof v === 'number' ? fmtNumber(v) : String(v); });
  }
  const has = key => typeof key === 'string' && get('en', key) != null;
  // Run fn as if the language were `code` (used for the English mood words in Oreo's voice).
  function inLang(code, fn) { const prev = getLang(); cur = valid(code) ? code : prev; try { return fn(); } finally { cur = prev; } }
  // Old saves stored English text; find the key it came from.
  function keyForEnglish(text, filter) {
    const en = DICT.en || {};
    for (const k of Object.keys(en)) if (en[k] === text && (!filter || filter(k))) return k;
    return null;
  }

  function applyDom(root) {
    const doc = G.document; if (!doc) return;
    root = root || doc;
    const vars = el => { try { return el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : undefined; } catch (e) { return undefined; } };
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n, vars(el)); });
    for (const [attr, name] of [['i18nTitle', 'title'], ['i18nPlaceholder', 'placeholder'], ['i18nAriaLabel', 'aria-label']]) {
      const sel = '[data-' + attr.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) + ']';
      root.querySelectorAll(sel).forEach(el => el.setAttribute(name, t(el.dataset[attr], vars(el))));
    }
    doc.documentElement.lang = getLang() === 'en' ? 'en-GB' : getLang();
    doc.documentElement.dataset.lang = getLang();
  }

  G.OREO_I18N = { LANGS, STORE_KEY, DICT, t, has, getLang, setLang, applyDom, detect, inLang, fmtNumber, fmtDate, keyForEnglish, locale: () => localeOf(getLang()) };
})(typeof window !== 'undefined' ? window : globalThis);

// Bedientexte: de = Annas Oberfläche, pt = Leos Partneransicht, en = Bewertungsbogen im Call.
import { get } from './store.js';

const dicts = {};

export async function loadI18n() {
  await Promise.all(['de', 'pt', 'en'].map(async l => {
    const r = await fetch(`i18n/${l}.json`);
    dicts[l] = await r.json();
  }));
}

function lookup(lang, key) {
  return key.split('.').reduce((o, k) => (o == null ? o : o[k]), dicts[lang]);
}

export function fill(str, vars = {}) {
  if (typeof str !== 'string') return str;
  const s = get().settings;
  const all = { learner: s.learner, partner: s.partner, ...vars };
  return str.replace(/\{(\w+)\}/g, (m, k) => (all[k] != null ? all[k] : m));
}

export function tl(lang, key, vars) {
  const v = lookup(lang, key);
  if (v == null) { console.warn(`[i18n] fehlt ${lang}:${key}`); return key; }
  return Array.isArray(v) ? v.map(x => fill(x, vars)) : fill(v, vars);
}
export const t = (key, vars) => tl('de', key, vars);
export const tp = (key, vars) => tl('pt', key, vars);
export const te = (key, vars) => tl('en', key, vars);

// Artikel für Leos Namen auf Portugiesisch („para o Leo“)
export function ptArticle(name) {
  return /a$/i.test(name.trim()) ? 'a' : 'o';
}

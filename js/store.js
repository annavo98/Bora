// Lernstand: localStorage für Daten, IndexedDB für Fotos. Datum überschreibbar für Tests.
const KEY = 'ptapp.state.v1';
const DATE_KEY = 'ptapp.dateOverride';

export const DEFAULT_STATE = () => ({
  v: 1,
  settings: {
    learner: 'Anna',
    partner: 'Leo',
    dailyNew: 10,
    dailyReviews: 40,
    theme: 'auto',
    rubricLang: 'en',
    startDate: null
  },
  srs: {},          // id -> {ef, interval, reps, due, lapses, last, seen}
  srsLog: {},       // datum -> {reviews, new}
  extraVocab: [],   // Fehlerwörter aus Korrekturen und Gesprächen
  progress: {},     // lessonId -> {listening:{}, vocab:false, grammar:{}, exercises:{}, speaking:{}, reading:{}, writing:false, conversation:{}}
  submissions: [],  // Schreibabgaben (Foto liegt in IndexedDB)
  conversations: [],
  lastBackup: null,
  lastActive: null
});

let state = null;
const listeners = new Set();

export function load({ readOnly = false } = {}) {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? merge(DEFAULT_STATE(), JSON.parse(raw)) : DEFAULT_STATE();
  } catch (e) {
    console.warn('Lernstand nicht lesbar, starte neu', e);
    state = DEFAULT_STATE();
  }
  if (!state.settings.startDate && !readOnly) { state.settings.startDate = today(); save(); }
  return state;
}

function merge(base, data) {
  const out = { ...base, ...data };
  out.settings = { ...base.settings, ...(data.settings || {}) };
  return out;
}

export function get() { return state || load(); }

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Speichern fehlgeschlagen', e);
    alert('Speichern fehlgeschlagen. Bitte eine Sicherung exportieren.');
  }
  listeners.forEach(fn => fn(state));
}

export function update(fn) { fn(state); save(); }
export function onChange(fn) { listeners.add(fn); }

export function lessonProgress(id) {
  const p = state.progress;
  if (!p[id]) p[id] = { listening: {}, vocab: false, grammar: {}, exercises: {}, speaking: {}, reading: {}, writing: false, conversation: {} };
  return p[id];
}

export function reset() {
  const keep = { learner: state.settings.learner, partner: state.settings.partner };
  state = DEFAULT_STATE();
  Object.assign(state.settings, keep);
  state.settings.startDate = today();
  save();
  return idbClear();
}

/* ---------- Datum ---------- */
export function today() {
  const o = localStorage.getItem(DATE_KEY);
  if (o && /^\d{4}-\d{2}-\d{2}$/.test(o)) return o;
  return iso(new Date());
}
export function setDateOverride(d) {
  if (d) localStorage.setItem(DATE_KEY, d); else localStorage.removeItem(DATE_KEY);
}
export function dateOverride() { return localStorage.getItem(DATE_KEY); }
export function iso(d) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function addDays(isoDate, n) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return iso(new Date(y, m - 1, d + n));
}
export function daysBetween(a, b) {
  const p = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(b) - p(a)) / 86400000);
}

/* ---------- Fotos in IndexedDB ---------- */
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('ptapp', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const t = db.transaction('photos', mode);
    const s = t.objectStore('photos');
    const out = fn(s);
    t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
    t.onerror = () => rej(t.error);
  });
}
export const photoPut = (id, dataUrl) => tx('readwrite', s => s.put(dataUrl, id));
export const photoGet = id => tx('readonly', s => s.get(id));
export function idbClear() { return tx('readwrite', s => s.clear()).catch(() => {}); }
async function photoAll() {
  const out = {};
  for (const sub of state.submissions) {
    if (sub.hasPhoto) { const p = await photoGet(sub.id).catch(() => null); if (p) out[sub.id] = p; }
  }
  return out;
}

/* ---------- Sicherung ---------- */
export async function exportBackup() {
  const data = { app: 'ptapp', exported: new Date().toISOString(), state, photos: await photoAll() };
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}
export async function importBackup(text) {
  const data = JSON.parse(text);
  if (data.app !== 'ptapp' || !data.state || !data.state.settings) throw new Error('Keine Sicherung dieser App');
  state = merge(DEFAULT_STATE(), data.state);
  save();
  await idbClear();
  for (const [id, p] of Object.entries(data.photos || {})) await photoPut(id, p);
  return state;
}
export function markBackup() { state.lastBackup = today(); save(); }

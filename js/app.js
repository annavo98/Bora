// Einstieg: Daten laden, Thema, Service Worker, Router.
import * as store from './store.js';
import { loadI18n, t } from './i18n.js';
import { loadCourse } from './content.js';
import { loadAudioIndex, stop } from './audio.js';
import { icon } from './art.js';
import { bindSay } from './ui.js';
import { viewToday } from './views/today.js';
import { viewCourse, viewLesson, viewConversaList } from './views/course.js';
import { viewListening, viewVocabList, viewGrammar, viewExercises, viewExercise, viewSpeaking, viewReading } from './views/parts.js';
import { viewTrainer, viewSession, viewAllVocab } from './views/vocab.js';
import { viewWriting, viewSubmission } from './views/writing.js';
import { viewConversa } from './views/conversa.js';
import { viewProgress, viewSettings } from './views/progress.js';
import { viewTandem } from './views/tandem.js';

const routes = [
  [/^$|^today$/, () => viewToday()],
  [/^course$/, () => viewCourse()],
  [/^lesson\/(\w+)$/, m => viewLesson(m[1])],
  [/^lesson\/(\w+)\/listening$/, m => viewListening(m[1])],
  [/^lesson\/(\w+)\/vocab$/, m => viewVocabList(m[1])],
  [/^lesson\/(\w+)\/grammar$/, m => viewGrammar(m[1])],
  [/^lesson\/(\w+)\/exercises$/, m => viewExercises(m[1])],
  [/^lesson\/(\w+)\/exercises\/(\w+)$/, m => viewExercise(m[1], m[2])],
  [/^lesson\/(\w+)\/speaking$/, m => viewSpeaking(m[1])],
  [/^lesson\/(\w+)\/conversa$/, m => viewConversaList(m[1])],
  [/^lesson\/(\w+)\/reading$/, m => viewReading(m[1])],
  [/^lesson\/(\w+)\/writing$/, m => viewWriting(m[1])],
  [/^vocab$/, () => viewTrainer()],
  [/^vocab\/session$/, () => viewSession()],
  [/^vocab\/all$/, () => viewAllVocab()],
  [/^conversa\/(\w+)$/, m => viewConversa(m[1])],
  [/^submission\/([\w-]+)$/, m => viewSubmission(m[1])],
  [/^progress$/, () => viewProgress()],
  [/^settings$/, () => viewSettings()],
  [/^tandem\/(\w+)\/(\w+)$/, m => viewTandem(m[1], m[2])]
];

const TABS = [['today', 'today'], ['course', 'course'], ['vocab', 'vocab'], ['progress', 'progress']];

function tabbar(route) {
  const top = route.split('/')[0] || 'today';
  const cur = top === 'lesson' || top === 'conversa' ? 'course' : top === 'settings' || top === 'submission' ? 'progress' : top;
  document.getElementById('tabbar').innerHTML = `<nav aria-label="${t('nav.label')}">${TABS.map(([r, ic]) =>
    `<a href="#/${r}" ${cur === r ? 'aria-current="page"' : ''}>${icon(ic, 24)}<span>${t('nav.' + r)}</span></a>`).join('')}</nav>`;
}

async function route() {
  stop();
  const r = location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (r.startsWith('tandem/')) document.getElementById('tabbar').innerHTML = ''; else tabbar(r);
  for (const [re, fn] of routes) {
    const m = r.match(re);
    if (m) {
      try { await fn(m); } catch (e) { console.error(e); document.getElementById('view').innerHTML = `<div class="card"><h2>${t('error.title')}</h2><p>${String(e.message)}</p><a class="btn" href="#/today">${t('nav.today')}</a></div>`; }
      return;
    }
  }
  location.hash = '#/today';
}

export function applyTheme() {
  const pref = store.get().settings.theme;
  const dark = pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

async function init() {
  // Testhilfe: ?date=2026-11-20 setzt das App-Datum, ?date=off setzt es zurück
  const qd = new URLSearchParams(location.search).get('date');
  if (qd) store.setDateOverride(qd === 'off' ? null : qd);
  // Tandem-Link (Leos Ansicht): Lernstand nur lesen, nie schreiben
  const tandem = /^#\/?tandem\//.test(location.hash);
  store.load({ readOnly: tandem });
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  await Promise.all([loadI18n(), loadCourse(), loadAudioIndex()]);
  document.title = t('app.title');
  bindSay(document.getElementById('view'));
  if (!tandem) store.update(s => { s.lastActive = store.today(); });
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW', e));
  }
}

// Für Tests in der Konsole
window.ptapp = { store, route };
init();

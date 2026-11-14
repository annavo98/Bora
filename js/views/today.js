import { get, today, daysBetween } from '../store.js';
import { t, tl } from '../i18n.js';
import { beachHeader, icon } from '../art.js';
import { render, setArea, esc } from '../ui.js';
import { stats } from '../srs.js';
import { PARTS, partRatio, currentLesson, weekInfo, suggestion, writingUnlocked, partDone } from '../plan.js';

export const PART_ROUTE = (lessonId, part) =>
  part === 'vocab-trainer' ? '#/vocab' : part === 'conversation' ? `#/lesson/${lessonId}/conversa` : `#/lesson/${lessonId}/${part}`;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export function weekSegments(lesson) {
  const parts = [...PARTS, ...(lesson.conversations?.length ? ['conversation'] : [])];
  return `<div class="weekbar" role="img" aria-label="${esc(t('today.weekbarLabel'))}">${parts.map(p =>
    `<div class="seg" title="${esc(t('areas.' + p))}"><i class="c-${p}" style="width:${Math.round(partRatio(lesson, p) * 100)}%"></i></div>`).join('')}</div>
    <div class="legend">${parts.map(p => `<span class="c-${p}" style="background:none;color:inherit">${esc(t('areas.' + p))}${partDone(lesson, p) ? ' ✓' : ''}</span>`).join('')}</div>`;
}

export function viewToday() {
  setArea(null);
  const st = get();
  const s = stats();
  const l = currentLesson();
  const w = weekInfo();
  const sug = suggestion(s);
  const sugText = sug.part === 'vocab-trainer' ? t('today.sugVocab', { n: sug.count })
    : sug.part === 'done' ? t('today.sugDone') : t('today.sugPart', { part: t('areas.' + sug.part) });
  const sugHref = sug.part === 'done' ? '#/course' : PART_ROUTE(l.id, sug.part);

  const sinceBackup = st.lastBackup ? daysBetween(st.lastBackup, today()) : daysBetween(st.settings.startDate, today());
  const backupBanner = sinceBackup >= 7
    ? `<div class="banner warn">${icon('share', 26)}<div class="grow small">${esc(t('today.backupNag', { n: sinceBackup }))}</div><a class="btn small-btn" href="#/settings">${esc(t('today.backupBtn'))}</a></div>` : '';

  const behind = w.behind > 0 ? `<p class="small" style="margin-top:10px">${esc(t('today.behind', { n: w.behind }))}</p>` : '';
  const tile = (area, href, sub, locked) =>
    `<a class="tile c-${area}" href="${locked ? '#/lesson/' + l.id : href}" ${locked ? 'aria-disabled="true"' : ''}>
      ${icon(locked ? 'lock' : area, 30)}<span>${esc(t('areas.' + area))}<span class="sub" style="display:block">${esc(sub)}</span></span>
      ${!locked && area !== 'vocab' && partDone(l, area) ? `<span class="done-badge">${icon('check', 22)}</span>` : ''}</a>`;
  const vocabSub = s.todayLeft ? t('today.tileVocabDue', { n: s.todayLeft }) : t('today.tileVocabDone');

  render(`
  <div class="hero">${beachHeader()}
    <div class="greet"><h1>${esc(greeting())}, ${esc(st.settings.learner)}!</h1></div>
    <a class="iconbtn gear" href="#/settings" aria-label="${esc(t('settings.title'))}">${icon('gear')}</a>
  </div>
  ${backupBanner}
  <section class="card ocean">
    <div class="kicker">${esc(t('today.week', { n: w.week }))} · ${esc(t('today.lesson', { n: l.number }))}</div>
    <h2 style="margin:0">${esc(l.title)}</h2>
    <div class="small" style="opacity:.85">${esc(l.title_de)}</div>
    ${weekSegments(l)}
    ${behind}
    <a class="btn mango big block-btn" style="margin-top:16px" href="${sugHref}" id="bora">${esc(t('today.bora'))}</a>
    <p class="small" style="margin:10px 0 0;text-align:center">${esc(sugText)}</p>
  </section>
  <p class="small" style="margin:0 4px 10px"><b>${esc(t('today.minimum'))}</b> ${esc(s.backlog ? t('today.backlog', { n: s.backlogRest, d: s.backlogDays + 1 }) : (s.todayLeft ? t('today.minimumText', { n: s.todayLeft, min: Math.max(1, Math.round(s.todayLeft * 0.3)) }) : t('today.minimumDone')))}</p>
  <h3 style="margin:18px 4px 10px">${esc(t('today.free'))}</h3>
  <div class="tiles">
    ${tile('vocab', '#/vocab', vocabSub)}
    ${tile('listening', PART_ROUTE(l.id, 'listening'), t('today.tileListen'))}
    ${tile('grammar', PART_ROUTE(l.id, 'grammar'), t('today.tileGrammar'))}
    ${tile('speaking', PART_ROUTE(l.id, 'speaking'), t('today.tileSpeak'))}
    ${tile('reading', PART_ROUTE(l.id, 'reading'), t('today.tileRead'))}
    ${tile('writing', PART_ROUTE(l.id, 'writing'), writingUnlocked(l) ? t('today.tileWrite') : t('lesson.lockedWriting'), !writingUnlocked(l))}
  </div>
  ${l.conversations?.length ? `<a class="tile c-conversation" style="margin-top:12px;min-height:80px" href="#/lesson/${l.id}/conversa">${icon('conversation', 30)}<span>${esc(t('areas.conversation'))}<span class="sub" style="display:block">${esc(t('today.tileConversa'))}</span></span></a>` : ''}
  `);
}

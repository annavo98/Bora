import { get } from '../store.js';
import { t, fill } from '../i18n.js';
import { cover, icon } from '../art.js';
import { render, setArea, esc, topbar } from '../ui.js';
import { getCourse, getLesson } from '../content.js';
import { PARTS, partRatio, partDone, lessonRatio, currentLessonIndex, writingUnlocked } from '../plan.js';

export function viewCourse() {
  setArea(null);
  const c = getCourse();
  const cur = currentLessonIndex();
  render(`
  ${topbar(t('course.title'))}
  <p class="muted">${esc(t('course.intro'))}</p>
  ${c.lessons.map((m, i) => {
    const l = getLesson(m.id);
    if (!l) return `<div class="lesson-card locked"><div class="body"><div class="kicker">${esc(t('today.lesson', { n: m.number }))}</div><h3>${esc(m.title_de || '')}</h3><p class="small muted">${esc(t('course.soon'))}</p></div></div>`;
    const r = lessonRatio(l);
    return `<a class="lesson-card" href="#/lesson/${l.id}">${cover(l.cover)}
      <div class="body"><div class="row"><div class="kicker grow">${esc(t('today.lesson', { n: l.number }))} · ${esc(l.level)}</div>${i === cur ? `<span class="pill">${esc(t('course.current'))}</span>` : ''}${r >= 1 ? `<span class="pill">${icon('check', 16)} ${esc(t('course.done'))}</span>` : ''}</div>
      <h2 style="margin:2px 0 0">${esc(l.title)}</h2><div class="muted small">${esc(l.title_de)}</div>
      <div class="progress" aria-label="${Math.round(r * 100)} %"><i style="width:${Math.round(r * 100)}%"></i></div></div></a>`;
  }).join('')}
  <p class="small muted">${esc(t('course.peek'))}</p>`);
}

export function viewLesson(id) {
  const l = getLesson(id);
  if (!l) throw new Error(t('error.noLesson'));
  setArea(null);
  const parts = PARTS.map(p => {
    const locked = p === 'writing' && !writingUnlocked(l);
    const r = partRatio(l, p);
    const sub = locked ? t('lesson.lockedWriting') : t('lesson.sub.' + p);
    return `<a class="part c-${p} ${locked ? 'locked' : ''}" href="#/lesson/${id}/${p}">${icon(locked ? 'lock' : p, 30)}
      <div class="grow">${esc(t('areas.' + p))}<small>${esc(sub)}</small></div>
      ${partDone(l, p) ? icon('check', 26) : r > 0 ? `<span class="pill">${Math.round(r * 100)} %</span>` : ''}</a>`;
  }).join('');
  render(`
  ${topbar(t('today.lesson', { n: l.number }), '#/course')}
  <div class="cover">${cover(l.cover)}</div>
  <h1 style="margin-bottom:0">${esc(l.title)}</h1>
  <p class="muted" style="margin-top:2px">${esc(l.title_de)} · ${esc(l.level)}</p>
  <div class="card"><h3>${esc(t('lesson.goals'))}</h3><ul style="margin:0;padding-left:20px">${l.goals_de.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
  <div class="partlist">${parts}
    ${l.conversations?.length ? `<a class="part c-conversation" href="#/lesson/${id}/conversa">${icon('conversation', 30)}<div class="grow">${esc(t('areas.conversation'))}<small>${esc(t('lesson.sub.conversation'))}</small></div>${partDone(l, 'conversation') ? icon('check', 26) : `<span class="pill">${esc(t('lesson.bonus'))}</span>`}</a>` : ''}
  </div>`);
}

export function viewConversaList(id) {
  const l = getLesson(id);
  setArea('conversation');
  const done = get().progress[id]?.conversation || {};
  render(`
  ${topbar(t('areas.conversation'), '#/lesson/' + id)}
  <p>${esc(t('conversa.listIntro'))}</p>
  ${l.conversations.map(c => `<a class="card" style="display:block;text-decoration:none" href="#/conversa/${c.id}">
    <div class="row"><div class="kicker grow">${esc(t('conversa.minutes', { n: c.minutes || 10 }))}</div>${done[c.id] ? `<span class="pill">${icon('check', 16)} ${esc(t('course.done'))}</span>` : ''}</div>
    <h2 style="margin:4px 0 2px">${esc(c.title_pt)}</h2><div class="muted">${esc(c.title_de)}</div>
    <p class="small" style="margin:8px 0 0">${esc(fill(c.situation_de))}</p></a>`).join('')}`);
}

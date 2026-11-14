// Wochenpensum, Lektionsfortschritt, Freischaltungen und Vorschlag für „Weiterlernen“.
import { get, today, daysBetween } from './store.js';
import { getCourse, getLesson } from './content.js';

export const PARTS = ['listening', 'vocab', 'grammar', 'exercises', 'speaking', 'reading', 'writing'];
export const BONUS = 'conversation';

// Fortschritt eines Teils 0..1
export function partRatio(lesson, part) {
  const p = get().progress[lesson.id];
  if (!p) return 0;
  const frac = (done, total) => (total ? Math.min(1, done / total) : 1);
  switch (part) {
    case 'listening': return frac(Object.keys(p.listening).length, lesson.listening.dialogs.length);
    case 'vocab': return p.vocab ? 1 : 0;
    case 'grammar': return frac(Object.keys(p.grammar).length, lesson.grammar.length);
    case 'exercises': return frac(Object.keys(p.exercises).length, lesson.exercises.length);
    case 'speaking': return frac(['shadowing', 'roleplay', 'monologue'].filter(k => p.speaking[k]).length, 3);
    case 'reading': return frac(Object.keys(p.reading).length, lesson.reading.length);
    case 'writing': return p.writing ? 1 : 0;
    case 'conversation': return Object.keys(p.conversation).length ? 1 : 0;
  }
  return 0;
}
export const partDone = (lesson, part) => partRatio(lesson, part) >= 1;

export function lessonRatio(lesson) {
  return PARTS.reduce((a, p) => a + partRatio(lesson, p), 0) / PARTS.length;
}
export const lessonDone = lesson => PARTS.every(p => partDone(lesson, p));

// Aktuelle Lektion = erste nicht abgeschlossene, verfügbare Lektion
export function currentLessonIndex() {
  const ls = getCourse().lessons;
  for (let i = 0; i < ls.length; i++) {
    const l = getLesson(ls[i].id);
    if (!l) return Math.max(0, i - 1);
    if (!lessonDone(l)) return i;
  }
  return ls.length - 1;
}
export const currentLesson = () => getLesson(getCourse().lessons[currentLessonIndex()].id);

// Kalenderwoche seit Kursstart (eine Lektion pro Woche). Zeigt an, ob sich die nächste Lektion verschiebt.
export function weekInfo() {
  const st = get();
  const week = Math.floor(daysBetween(st.settings.startDate, today()) / 7);
  const idx = currentLessonIndex();
  const dayOfWeek = daysBetween(st.settings.startDate, today()) % 7;
  return { week: week + 1, planned: week, current: idx, behind: Math.max(0, week - idx), daysLeft: 7 - dayOfWeek };
}

// Freischaltungen: Übungen zu einer Grammatik erst nach dieser Grammatik, Schreiben erst nach aller Grammatik
export function exerciseUnlocked(lesson, ex) {
  return !ex.grammar || !!get().progress[lesson.id]?.grammar[ex.grammar];
}
export function writingUnlocked(lesson) { return partDone(lesson, 'grammar'); }

// Vorschlag für „Bora! Weiterlernen“
export function suggestion(vocabStats) {
  if (vocabStats.todayLeft > 0) return { part: 'vocab-trainer', count: vocabStats.todayLeft };
  const l = currentLesson();
  for (const part of PARTS) {
    if (part === 'writing' && !writingUnlocked(l)) continue;
    if (!partDone(l, part)) return { part, lesson: l.id };
  }
  if (!partDone(l, BONUS) && l.conversations?.length) return { part: BONUS, lesson: l.id };
  return { part: 'done', lesson: l.id };
}

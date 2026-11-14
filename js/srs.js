// Verteilte Wiederholung, vereinfachtes SM-2.
// Tagesgrenze: dailyReviews Wiederholungen + dailyNew neue Karten.
// Rückstand (überfällige Karten): höchstens das 1,5-Fache der normalen Wiederholungen pro Tag,
// solange Rückstand besteht, kommen keine neuen Karten dazu.
import { get, save, today, addDays, daysBetween } from './store.js';
import { allVocab, getCourse } from './content.js';
import { currentLessonIndex } from './plan.js';

export const GRADES = { again: 0, hard: 3, good: 4, easy: 5 };

export function cardPool() {
  const st = get();
  const idx = currentLessonIndex();
  const order = getCourse().lessons.map(l => l.id);
  const lessonCards = allVocab().filter(v => {
    const li = order.indexOf(v.lesson);
    return li <= idx || st.progress[v.lesson]?.vocab;
  });
  return [...lessonCards, ...st.extraVocab.map(v => ({ ...v, lesson: 'extra' }))];
}

export function stats() {
  const st = get(), t = today();
  const pool = cardPool();
  let due = 0, overdue = 0, fresh = 0, learned = 0, mature = 0;
  for (const c of pool) {
    const s = st.srs[c.id];
    if (!s || !s.seen) { fresh++; continue; }
    learned++;
    if (s.interval >= 21) mature++;
    if (s.due <= t) { due++; if (s.due < t) overdue++; }
  }
  const log = st.srsLog[t] || { reviews: 0, new: 0 };
  const base = st.settings.dailyReviews;
  const backlog = overdue > 0 && due + log.reviews > base;
  const reviewCap = backlog ? Math.round(base * 1.5) : base;
  const reviewsLeft = Math.max(0, Math.min(due, reviewCap - log.reviews));
  const newLeft = backlog ? 0 : Math.max(0, Math.min(fresh, st.settings.dailyNew - log.new));
  return {
    total: pool.length, due, overdue, fresh, learned, mature,
    reviewsLeft, newLeft, todayLeft: reviewsLeft + newLeft,
    backlog, reviewCap, done: log.reviews + log.new,
    backlogDays: backlog ? Math.ceil((due - reviewsLeft) / reviewCap) : 0,
    backlogRest: backlog ? Math.max(0, due - reviewsLeft) : 0
  };
}

// Stapel für heute: fällige (älteste zuerst) bis zur Grenze, dann neue in Kursreihenfolge
export function buildQueue() {
  const st = get(), t = today(), s = stats();
  const pool = cardPool();
  const dueCards = pool.filter(c => st.srs[c.id]?.seen && st.srs[c.id].due <= t)
    .sort((a, b) => st.srs[a.id].due.localeCompare(st.srs[b.id].due))
    .slice(0, s.reviewsLeft);
  const newCards = pool.filter(c => !st.srs[c.id]?.seen).slice(0, s.newLeft);
  // neue Karten zwischen die Wiederholungen mischen
  const q = [...dueCards];
  newCards.forEach((c, i) => q.splice(Math.min(q.length, (i + 1) * 3), 0, c));
  return q;
}

export function isNew(card) { return !get().srs[card.id]?.seen; }

// Bewertung anwenden. Gibt zurück, ob die Karte heute nochmal kommen soll.
export function grade(card, g) {
  const st = get(), t = today();
  const s = st.srs[card.id] || { ef: 2.5, interval: 0, reps: 0, lapses: 0 };
  const wasNew = !s.seen;
  if (g < 3) {
    s.reps = 0; s.interval = 0; s.lapses = (s.lapses || 0) + (wasNew ? 0 : 1);
  } else {
    s.reps += 1;
    if (s.reps === 1) s.interval = g === 5 ? 3 : 1;
    else if (s.reps === 2) s.interval = g === 5 ? 7 : (g === 3 ? 3 : 4);
    else s.interval = Math.max(1, Math.round(s.interval * s.ef * (g === 3 ? 0.8 : g === 5 ? 1.3 : 1)));
  }
  s.ef = Math.max(1.3, s.ef + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02)));
  s.due = addDays(t, s.interval);
  s.last = t;
  // Zählung pro Tag nur beim ersten Antworten der Karte heute
  const log = st.srsLog[t] || (st.srsLog[t] = { reviews: 0, new: 0 });
  if (!s.countedOn || s.countedOn !== t) {
    if (wasNew) log.new++; else log.reviews++;
    s.countedOn = t;
  }
  s.seen = true;
  st.srs[card.id] = s;
  save();
  return g < 3; // nochmal in dieser Runde
}

// Vorschau für Fortschritt: fällige Karten der nächsten 7 Tage
export function forecast(days = 7) {
  const st = get(), t = today();
  const out = [];
  for (let i = 0; i < days; i++) out.push({ day: addDays(t, i), n: 0 });
  for (const c of cardPool()) {
    const s = st.srs[c.id];
    if (!s?.seen) continue;
    const d = Math.max(0, daysBetween(t, s.due));
    if (d < days) out[d].n++;
  }
  return out;
}

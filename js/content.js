// Kursinhalte laden (course.json + ein JSON-Paket je Lektion).
let course = null;
const lessons = {};

export async function loadCourse() {
  course = await (await fetch('content/course.json')).json();
  await Promise.all(course.lessons.filter(l => l.file).map(l => loadLesson(l.id)));
  return course;
}

export async function loadLesson(id) {
  if (lessons[id]) return lessons[id];
  const meta = course.lessons.find(l => l.id === id);
  if (!meta || !meta.file) return null;
  try {
    lessons[id] = await (await fetch(meta.file)).json();
  } catch (e) {
    console.error('Lektion nicht ladbar', id, e);
    return null;
  }
  return lessons[id];
}

export const getCourse = () => course;
export const getLesson = id => lessons[id] || null;
export const availableLessons = () => course.lessons.filter(l => lessons[l.id]).map(l => lessons[l.id]);

export function allVocab() {
  const out = [];
  for (const l of availableLessons()) for (const v of l.vocab || []) out.push({ ...v, lesson: l.id });
  return out;
}
export function findExercise(lesson, id) { return (lesson.exercises || []).find(e => e.id === id); }
export function findConversation(id) {
  for (const l of availableLessons()) {
    const c = (l.conversations || []).find(c => c.id === id);
    if (c) return { card: c, lesson: l };
  }
  return null;
}

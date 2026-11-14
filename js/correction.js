// Korrekturauftrag für den kostenlosen KI-Chat bauen und die Antwort robust auslesen.
import { t, fill } from './i18n.js';

export function buildPrompt(task, sub, lesson) {
  const P = k => t('prompt.' + k);
  const lines = [
    P('role'),
    sub.hasPhoto ? P('photo') : P('typed'),
    '',
    `${P('lesson')}: ${lesson.title} (${lesson.level})`,
    `${P('task')}: ${fill(task.task_de)}`,
    task.task_pt ? `(${fill(task.task_pt)})` : '',
    task.focus_en?.length ? `${P('focus')}: ${task.focus_en.join('; ')}` : '',
    `${P('rubric')}`,
    ''
  ];
  if (sub.text?.trim()) lines.push(`${sub.hasPhoto ? P('myTextAlso') : P('myText')}:`, '"""', sub.text.trim(), '"""', '');
  lines.push(P('format'), '', '### ABSCHRIFT', P('fAbschrift'), '### KORREKTUR', P('fKorrektur'), '### FEHLER',
    P('fFehler'), '### NOTE', P('fNote'), '### LOB', P('fLob'), '### TIPP', P('fTipp'));
  return lines.filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n');
}

const HEADS = [
  ['transcript', /^(abschrift|transkription|transcri[cç][aã]o|transcript)/],
  ['corrected', /^(korrektur|korrigiert|korrigierter text|corre[cç][aã]o|corrected)/],
  ['errors', /^(fehler|fehlerliste|erros|errors|mistakes)/],
  ['grade', /^(note|bewertung|nota|grade)/],
  ['praise', /^(lob|elogio|praise)/],
  ['tip', /^(tipp|tip|dica)/]
];

export function parseCorrection(raw) {
  const out = { transcript: '', corrected: '', errors: [], grade: null, praise: '', tip: '' };
  const buf = {};
  let cur = null;
  for (const line of String(raw).replace(/\r/g, '').split('\n')) {
    const clean = line.replace(/^[\s#*>_]+/, '').trim();
    const ci = clean.indexOf(':');
    const head = (ci >= 0 ? clean.slice(0, ci) : clean).replace(/[*_]+$/, '').trim();
    const inline = ci >= 0 ? clean.slice(ci + 1).replace(/^[\s*_]+|[\s*_]+$/g, '') : '';
    const marked = /^\s*(#{1,6}|\*\*|__)/.test(line) || ci >= 0 || (head === head.toUpperCase() && head.length > 2);
    const hit = marked && head.length <= 25 && HEADS.find(([, re]) => re.test(head.toLowerCase()));
    if (hit) {
      cur = hit[0];
      buf[cur] = buf[cur] || [];
      if (inline) buf[cur].push(inline); // „NOTE: 2“ in einer Zeile
      continue;
    }
    if (cur) buf[cur].push(line);
  }
  const txt = k => (buf[k] || []).join('\n').trim();
  out.transcript = txt('transcript');
  out.corrected = txt('corrected');
  out.praise = txt('praise');
  out.tip = txt('tip');
  const g = txt('grade').match(/([1-6](?:[.,]\d+)?)/);
  out.grade = g ? g[1].replace('.', ',') : null;
  for (let l of buf.errors || []) {
    l = l.replace(/^\s*([-*•–]|\d+[.)])\s*/, '').trim();
    if (!l || /^\(.*\)$/.test(l)) continue;
    const m = l.split(/\s*(?:→|->|=>|⇒|➜)\s*/);
    if (m.length < 2) { out.errors.push({ wrong: '', right: '', explain: l }); continue; }
    const wrong = m[0].replace(/^["„“*_]+|["“”*_]+$/g, '').trim();
    const restParts = m.slice(1).join(' → ').split(/\s*(?:\||\s[–-]\s|\s\(|:\s)\s*/);
    const right = restParts[0].replace(/^["„“*_]+|["“”*_)]+$/g, '').trim();
    const explain = restParts.slice(1).join(' ').replace(/\)\s*$/, '').trim();
    out.errors.push({ wrong, right, explain });
  }
  out.ok = !!(out.corrected || out.errors.length || out.grade);
  return out;
}

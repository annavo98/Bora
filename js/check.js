// Antworten tolerant prüfen: Groß/Klein und Satzzeichen egal, fehlende Akzente = „fast richtig“.
export function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,!?¿¡;:"“”«»()\-–—…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function strip(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}
function lev(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

// Ergebnis: {status: 'right'|'accent'|'typo'|'wrong', expected}
export function checkAnswer(input, answers) {
  const list = Array.isArray(answers) ? answers : [answers];
  const a = norm(input);
  if (!a) return { status: 'wrong', expected: list[0] };
  for (const x of list) if (norm(x) === a) return { status: 'right', expected: x };
  for (const x of list) if (strip(norm(x)) === strip(a)) return { status: 'accent', expected: x };
  for (const x of list) {
    const e = strip(norm(x));
    if (e.length >= 6 && lev(e, strip(a)) <= (e.length > 20 ? 2 : 1)) return { status: 'typo', expected: x };
  }
  return { status: 'wrong', expected: list[0] };
}

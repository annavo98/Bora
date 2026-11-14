// Schreiben: Abgabe per Foto oder Tippen, Prüfung in drei Stufen.
import { get, update, lessonProgress, photoPut, photoGet, today } from '../store.js';
import { t, fill } from '../i18n.js';
import { icon } from '../art.js';
import { render, setArea, esc, topbar, toast, cheer, fmtDate, $, $$ } from '../ui.js';
import { getLesson } from '../content.js';
import { writingUnlocked } from '../plan.js';
import { buildPrompt, parseCorrection } from '../correction.js';

const words = s => (s.trim().match(/[\p{L}\p{N}'-]+/gu) || []).length;

async function compress(file, max = 1600) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const sc = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL('image/jpeg', 0.8);
}

export function viewWriting(id) {
  const l = getLesson(id);
  const w = l.writing;
  setArea('writing');
  const subs = get().submissions.filter(s => s.taskId === w.id);
  if (!writingUnlocked(l)) {
    render(`${topbar(t('areas.writing'), '#/lesson/' + id)}
      <div class="card"><h2>${icon('lock', 26)} ${esc(t('writing.lockedTitle'))}</h2><p>${esc(t('lesson.lockedWriting'))}</p>
      <a class="btn block-btn" href="#/lesson/${id}/grammar">${esc(t('writing.toGrammar'))}</a></div>`);
    return;
  }
  let photo = null;
  const v = render(`
  ${topbar(t('areas.writing'), '#/lesson/' + id)}
  <section class="card">
    <div class="kicker">${esc(t('writing.task'))}</div>
    <h2>${esc(w.title_de)}</h2>
    <p>${esc(fill(w.task_de))}</p>
    ${w.task_pt ? `<p lang="pt-BR" class="muted">${esc(fill(w.task_pt))}</p>` : ''}
    <p class="small"><b>${esc(t('writing.length', { min: w.min_words, max: w.max_words }))}</b></p>
  </section>
  ${subs.length ? `<section class="card"><h3>${esc(t('writing.previous'))}</h3>${subs.map(s => `<a class="part" style="background:var(--sand);color:var(--text);margin-bottom:8px" href="#/submission/${s.id}">${icon(s.hasPhoto ? 'camera' : 'keyboard', 24)}<div class="grow">${esc(fmtDate(s.date))}<small>${esc(s.correction?.grade ? t('writing.grade', { g: s.correction.grade }) : t('writing.noCorrection'))}</small></div></a>`).join('')}</section>` : ''}
  <section class="card">
    <h3>${esc(t('writing.new'))}</h3>
    <p class="small muted">${esc(t('writing.howTo'))}</p>
    <div class="btnrow">
      <label class="btn" style="position:relative">${icon('camera', 22)} ${esc(t('writing.photo'))}
        <input type="file" accept="image/*" capture="environment" id="file" class="sr"></label>
      <button class="btn soft" id="typeBtn">${icon('keyboard', 22)} ${esc(t('writing.type'))}</button>
    </div>
    <div id="photoBox"></div>
    <div id="textBox" hidden>
      <label for="txt" class="small" id="txtLabel">${esc(t('writing.textLabel'))}</label>
      <textarea class="field" id="txt" lang="pt-BR" autocapitalize="sentences" spellcheck="false" placeholder="${esc(t('writing.placeholder'))}"></textarea>
      <div class="small muted" id="wc"></div>
    </div>
    <button class="btn block-btn mango big" id="save" style="margin-top:14px" hidden>${esc(t('writing.save'))}</button>
  </section>`);

  const txt = $('#txt'), tb = $('#textBox');
  const showSave = () => { $('#save').hidden = false; };
  txt.addEventListener('input', () => { $('#wc').textContent = t('writing.words', { n: words(txt.value) }); });
  $('#typeBtn').onclick = () => { tb.hidden = false; $('#txtLabel').textContent = t('writing.textLabel'); showSave(); txt.focus(); };
  $('#file').onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      photo = await compress(f);
      $('#photoBox').innerHTML = `<img class="photo-prev" src="${photo}" alt="${esc(t('writing.photoAlt'))}">`;
      tb.hidden = false; $('#txtLabel').textContent = t('writing.livetext');
      showSave();
    } catch (err) { console.warn(err); toast(t('writing.photoFail')); }
  };
  $('#save').onclick = async () => {
    const text = txt.value.trim();
    if (!photo && !text) { toast(t('writing.emptySub')); return; }
    const sub = { id: 's' + Date.now().toString(36), lessonId: id, taskId: w.id, date: today(), mode: photo ? 'photo' : 'text', text, hasPhoto: !!photo, selfcheck: {} };
    if (photo) await photoPut(sub.id, photo);
    update(s => { s.submissions.push(sub); lessonProgress(id).writing = true; });
    toast(cheer());
    location.hash = '#/submission/' + sub.id;
  };
}

/* ---------- Eine Abgabe: Stufe 1 LanguageTool, Stufe 2 Selbstkorrektur, Stufe 3 KI-Chat ---------- */
export async function viewSubmission(sid) {
  const st = get();
  const sub = st.submissions.find(s => s.id === sid);
  if (!sub) throw new Error(t('error.noSubmission'));
  const l = getLesson(sub.lessonId);
  const w = l.writing;
  setArea('writing');
  const photo = sub.hasPhoto ? await photoGet(sub.id).catch(() => null) : null;
  const c = sub.correction?.parsed;

  const v = render(`
  ${topbar(t('writing.subTitle', { d: fmtDate(sub.date) }), `#/lesson/${sub.lessonId}/writing`)}
  <section class="card">
    <h3>${esc(w.title_de)}</h3>
    ${photo ? `<img class="photo-prev" src="${photo}" alt="${esc(t('writing.photoAlt'))}">` : ''}
    ${sub.text ? `<p lang="pt-BR" style="white-space:pre-line;background:var(--sand);border-radius:16px;padding:12px">${esc(sub.text)}</p>` : ''}
  </section>

  ${c ? correctionHtml(sub) : ''}

  <section class="card">
    <div class="kicker">${esc(t('writing.stage3'))}</div>
    <h3>${esc(t('writing.aiTitle'))}</h3>
    <p class="small">${esc(t('writing.aiIntro'))}</p>
    <button class="btn block-btn mango big" id="share">${icon('share', 22)} ${esc(t('writing.correctBtn'))}</button>
    <div class="btnrow" style="margin-top:10px">
      <button class="btn soft small-btn" id="copy">${esc(t('writing.copyPrompt'))}</button>
      ${photo ? `<a class="btn soft small-btn" download="abgabe-${sub.date}.jpg" href="${photo}">${esc(t('writing.savePhoto'))}</a>` : ''}
    </div>
    <div class="hr"></div>
    <label for="paste"><b>${esc(t('writing.pasteLabel'))}</b></label>
    <textarea class="field" id="paste" style="min-height:120px" placeholder="${esc(t('writing.pastePh'))}">${esc(sub.correction?.raw || '')}</textarea>
    <div class="btnrow" style="margin-top:10px">
      <button class="btn soft small-btn" id="fromClip">${esc(t('writing.fromClip'))}</button>
      <button class="btn small-btn" id="parse">${esc(t('writing.parse'))}</button>
    </div>
  </section>

  <section class="card">
    <div class="kicker">${esc(t('writing.stage1'))}</div>
    <h3>${esc(t('writing.ltTitle'))}</h3>
    <p class="small">${esc(sub.text ? t('writing.ltIntro') : t('writing.ltNeedText'))}</p>
    <button class="btn soft block-btn" id="lt" ${sub.text ? '' : 'disabled'}>${esc(t('writing.ltBtn'))}</button>
    <div id="ltOut">${sub.ltPending ? `<p class="small">${esc(t('writing.ltPending'))}</p>` : ''}</div>
  </section>

  <section class="card">
    <div class="kicker">${esc(t('writing.stage2'))}</div>
    <h3>${esc(t('writing.selfTitle'))}</h3>
    ${w.checklist_de.map((x, i) => `<label class="check-item"><input type="checkbox" data-sc="${i}" ${sub.selfcheck?.[i] ? 'checked' : ''}><span>${esc(x)}</span></label>`).join('')}
    <details style="margin-top:10px"><summary>${esc(t('writing.sample'))}</summary><p lang="pt-BR" style="white-space:pre-line">${esc(w.sample_pt)}</p></details>
  </section>`);

  const save = fn => update(s => { fn(s.submissions.find(x => x.id === sid)); });
  $$('[data-sc]').forEach(cb => cb.onchange = () => save(x => { x.selfcheck = x.selfcheck || {}; x.selfcheck[cb.dataset.sc] = cb.checked; }));

  const prompt = buildPrompt(w, sub, l);
  const copy = async () => {
    try { await navigator.clipboard.writeText(prompt); return true; }
    catch { const ta = document.createElement('textarea'); ta.value = prompt; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; }
  };
  $('#copy').onclick = async () => toast((await copy()) ? t('writing.copied') : t('writing.copyFail'), 4000);
  // Datei vorab bauen: iOS verlangt, dass share() direkt aus dem Tippen heraus aufgerufen wird
  let file = null;
  if (photo) fetch(photo).then(r => r.blob()).then(b => { file = new File([b], `abgabe-${sub.date}.jpg`, { type: 'image/jpeg' }); });
  $('#share').onclick = async () => {
    try {
      if (file && navigator.canShare?.({ files: [file], text: prompt })) {
        await navigator.share({ files: [file], text: prompt, title: t('writing.shareTitle') });
        toast(t('writing.sharedBoth'), 6000);
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: prompt, title: t('writing.shareTitle') });
        if (photo) toast(t('writing.attachPhoto'), 5000);
        return;
      }
      toast((await copy()) ? (photo ? t('writing.copiedAttach') : t('writing.copied')) : t('writing.copyFail'), 5000);
    } catch (e) {
      if (e.name !== 'AbortError') { await copy(); toast(t('writing.copiedFallback'), 5000); }
    }
  };
  $('#fromClip').onclick = async () => {
    try { $('#paste').value = await navigator.clipboard.readText(); } catch { toast(t('writing.clipFail'), 4000); }
  };
  $('#parse').onclick = () => {
    const raw = $('#paste').value;
    const parsed = parseCorrection(raw);
    if (!parsed.ok) { toast(t('writing.parseFail'), 5000); return; }
    update(s => {
      const x = s.submissions.find(y => y.id === sid);
      x.correction = { raw, parsed, date: today() };
      // Fehlerwörter in den Trainer
      for (const e of parsed.errors) {
        if (!e.right || e.right.length > 60) continue;
        const idv = 'x-' + e.right.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40);
        if (s.extraVocab.some(v => v.id === idv)) continue;
        s.extraVocab.push({ id: idv, pt: e.right, de: e.explain || t('writing.errCard', { w: e.wrong }), note_de: t('writing.errNote', { w: e.wrong }), source: sid });
      }
    });
    toast(t('writing.parsed', { n: parsed.errors.length }), 4000);
    viewSubmission(sid);
  };
  $('#lt').onclick = () => runLT(sub, save);
  if (sub.ltPending && navigator.onLine) runLT(sub, save);
}

function correctionHtml(sub) {
  const c = sub.correction.parsed;
  let tr = esc(c.transcript || sub.text || '');
  for (const e of c.errors) {
    if (!e.wrong) continue;
    const w = esc(e.wrong);
    if (tr.includes(w)) tr = tr.replace(w, `<span class="err">${w}</span> <span class="fix">${esc(e.right)}</span>`);
  }
  return `<section class="card">
    <div class="row"><h2 class="grow" style="margin:0">${esc(t('writing.result'))}</h2>${c.grade ? `<span class="grade-badge" aria-label="${esc(t('writing.grade', { g: c.grade }))}">${esc(c.grade)}</span>` : ''}</div>
    ${tr ? `<h3 style="margin-top:12px">${esc(t('writing.transcript'))}</h3><p lang="pt-BR" style="white-space:pre-line">${tr}</p>` : ''}
    ${c.errors.length ? `<h3>${esc(t('writing.errors'))}</h3>${c.errors.map(e => `<div class="ex">${icon('cross', 18)}<div>${e.wrong ? `<span class="err">${esc(e.wrong)}</span> → <span class="fix">${esc(e.right)}</span>` : ''}<span class="tr">${esc(e.explain)}</span></div></div>`).join('')}<p class="small muted">${esc(t('writing.errorsToTrainer'))}</p>` : ''}
    ${c.corrected ? `<h3>${esc(t('writing.corrected'))}</h3><p lang="pt-BR" style="white-space:pre-line;background:var(--ok-bg);color:var(--text);border-radius:16px;padding:12px">${esc(c.corrected)}</p>` : ''}
    ${c.praise ? `<p>${icon('check', 18)} <b>${esc(t('writing.praise'))}:</b> ${esc(c.praise)}</p>` : ''}
    ${c.tip ? `<p>${icon('tilde', 18)} <b>${esc(t('writing.tip'))}:</b> ${esc(c.tip)}</p>` : ''}
  </section>`;
}

async function runLT(sub, save) {
  const out = $('#ltOut');
  if (!navigator.onLine) {
    save(x => { x.ltPending = true; });
    out.innerHTML = `<p class="small">${esc(t('writing.ltPending'))}</p>`;
    return;
  }
  out.innerHTML = `<p class="small">${esc(t('writing.ltRunning'))}</p>`;
  try {
    const body = new URLSearchParams({ text: sub.text, language: 'pt-BR' });
    const r = await fetch('https://api.languagetool.org/v2/check', { method: 'POST', body });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    save(x => { x.ltPending = false; x.lt = data.matches.map(m => ({ msg: m.message, bad: sub.text.substr(m.offset, m.length), fix: m.replacements.slice(0, 3).map(r => r.value) })); });
    const ms = data.matches;
    out.innerHTML = ms.length ? ms.map(m => `<div class="ex">${icon('tilde', 18)}<div><span class="err">${esc(sub.text.substr(m.offset, m.length))}</span> ${m.replacements.length ? `→ <span class="fix">${esc(m.replacements.slice(0, 3).map(r => r.value).join(' / '))}</span>` : ''}<span class="tr">${esc(m.message)}</span></div></div>`).join('')
      : `<div class="fb right">${icon('check', 20)}<b>${esc(t('writing.ltNone'))}</b></div>`;
  } catch (e) {
    console.warn('LanguageTool', e);
    save(x => { x.ltPending = true; });
    out.innerHTML = `<p class="small">${esc(t('writing.ltFail'))}</p>`;
  }
}

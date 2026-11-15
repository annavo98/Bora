// Lektionsteile: Hören, Wendungen, Grammatik, Übungen, Sprechen, Lesen.
import { get, update, lessonProgress } from '../store.js';
import { t, fill } from '../i18n.js';
import { icon } from '../art.js';
import { render, setArea, esc, topbar, sayBtn, feedback, cheer, shuffle, toast, laterTag, $, $$ } from '../ui.js';
import { getLesson, findExercise } from '../content.js';
import { exerciseUnlocked } from '../plan.js';
import { checkAnswer } from '../check.js';
import { play, stop, playSequence, canRecord, startRecording } from '../audio.js';

function lessonOr404(id) {
  const l = getLesson(id);
  if (!l) throw new Error(t('error.noLesson'));
  return l;
}
const back = id => '#/lesson/' + id;
const doneBox = (text, href, label) =>
  `<div class="card cheer"><div class="big">${esc(cheer())}</div><p>${esc(text)}</p>${href ? `<a class="btn block-btn" href="${href}">${esc(label)}</a>` : ''}</div>`;

/* ---------- Auswahlfragen (Hören, Lesen) ---------- */
function questionsHtml(prefix, questions) {
  return questions.map((q, qi) => `<div class="q" data-q="${prefix}-${qi}" data-answer="${q.answer}">
    <b>${esc(q.q_de || q.q_pt)}</b>
    <div class="opts">${(q.options_de || q.options).map((o, oi) => `<button class="opt" data-oi="${oi}">${esc(o)}</button>`).join('')}</div>
    <div class="fbslot"></div></div>`).join('');
}
function bindQuestions(root, onAllAnswered) {
  const qs = $$('.q', root);
  qs.forEach(q => q.addEventListener('click', e => {
    const b = e.target.closest('.opt');
    if (!b || q.dataset.done) return;
    q.dataset.done = '1';
    const ans = +q.dataset.answer, oi = +b.dataset.oi;
    $$('.opt', q).forEach(o => { o.disabled = true; });
    const right = $$('.opt', q)[ans];
    right.classList.add('right'); right.insertAdjacentHTML('afterbegin', icon('check', 20));
    if (oi !== ans) { b.classList.add('wrong'); b.insertAdjacentHTML('afterbegin', icon('cross', 20)); }
    $('.fbslot', q).innerHTML = feedback(oi === ans ? 'right' : 'wrong', right.textContent.trim());
    if (qs.every(x => x.dataset.done)) onAllAnswered(qs.filter(x => +$$('.opt.wrong', x).length === 0).length, qs.length);
  }));
}

/* ---------- Hören ---------- */
export function viewListening(id) {
  const l = lessonOr404(id);
  setArea('listening');
  const p = get().progress[id]?.listening || {};
  render(`
  ${topbar(t('areas.listening'), back(id))}
  <p>${esc(t('listening.intro'))}</p>
  ${l.listening.dialogs.map((d, di) => `
  <section class="card dialog" data-di="${di}">
    <div class="row"><h2 class="grow" style="margin:0">${esc(d.title)}</h2>${p[d.id] ? icon('check', 26) : ''}</div>
    <p class="muted small">${esc(fill(d.situation_de))}</p>
    <div class="playbar">
      <button class="btn small-btn" data-act="play" data-speed="n">${icon('play', 18)} ${esc(t('listening.normal'))}</button>
      <button class="btn small-btn soft" data-act="play" data-speed="s">${icon('slow', 18)} ${esc(t('listening.slow'))}</button>
      <button class="btn small-btn soft" data-act="stop" aria-label="${esc(t('audio.stop'))}">${icon('stop', 18)}</button>
    </div>
    <div class="row wrap small" style="margin-bottom:8px">
      <label class="row"><input type="checkbox" data-act="hide"> ${esc(t('listening.hideText'))}</label>
      <label class="row"><input type="checkbox" data-act="hidetr" checked> ${esc(t('listening.hideTr'))}</label>
    </div>
    ${d.new_words?.length ? `<details class="newwords"><summary>${esc(t('listening.newWords', { n: d.new_words.length }))}</summary>
      <p class="small muted" style="margin:0 0 6px">${esc(t('listening.newWordsHint'))}${d.new_words.some(w => w.later) ? ' ' + esc(t('common.laterHint')) : ''}</p>
      ${d.new_words.map(w => `<div class="ex">${sayBtn(w.pt)}<div><b lang="pt-BR">${esc(w.pt)}</b> ${laterTag(w.later)}<span class="tr">${esc(w.de)}</span></div></div>`).join('')}</details>` : ''}
    <div class="lines hide-tr">${d.lines.map((ln, i) => `<div class="line" data-i="${i}">${sayBtn(ln.pt)}<div><span class="who">${esc(ln.speaker)}:</span> <span class="pt">${esc(ln.pt)}</span><span class="tr">${esc(ln.de)}</span></div></div>`).join('')}</div>
    <div class="hr"></div>
    <h3>${esc(t('listening.questions'))}</h3>
    <div class="qs">${questionsHtml(d.id, d.questions)}</div>
  </section>`).join('')}
  <div id="ldone"></div>`);

  $$('.dialog').forEach(sec => {
    const d = l.listening.dialogs[+sec.dataset.di];
    const lines = $('.lines', sec);
    let token = 0;
    sec.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'play') {
        const my = ++token;
        playSequence(d.lines.map(x => x.pt), b.dataset.speed,
          i => $$('.line', lines).forEach((el, k) => el.classList.toggle('active', k === i)),
          () => my !== token);
      } else if (b.dataset.act === 'stop') { token++; stop(); $$('.line', lines).forEach(el => el.classList.remove('active')); }
    });
    sec.addEventListener('change', e => {
      if (e.target.dataset.act === 'hide') lines.classList.toggle('hide-text', e.target.checked);
      if (e.target.dataset.act === 'hidetr') lines.classList.toggle('hide-tr', e.target.checked);
    });
    bindQuestions($('.qs', sec), (right, total) => {
      update(() => { lessonProgress(id).listening[d.id] = { right, total }; });
      if (Object.keys(lessonProgress(id).listening).length === l.listening.dialogs.length)
        $('#ldone').innerHTML = doneBox(t('listening.done'), back(id), t('common.toLesson'));
    });
  });
}

/* ---------- Wendungen und Vokabeln ---------- */
export function viewVocabList(id) {
  const l = lessonOr404(id);
  setArea('vocab');
  const added = get().progress[id]?.vocab;
  render(`
  ${topbar(t('vocabList.title'), back(id))}
  <p>${esc(t('vocabList.intro', { n: l.vocab.length }))}</p>
  ${l.vocab.some(v => v.wendung) ? `<p class="later-note">${esc(t('common.laterHint'))}</p>` : ''}
  <div class="card vlist">${l.vocab.map(v => `<div class="v">${sayBtn(v.pt)}<div class="grow"><b>${esc(v.pt)}</b> ${laterTag(v.wendung)}
    <span class="small muted">${esc(v.ipa || '')}${v.pron_de ? ` · ${esc(v.pron_de)}` : ''}</span><div>${esc(v.de)}</div>
    ${v.es ? `<div class="small muted">ES: ${esc(v.es)}</div>` : ''}
    ${v.false_friend_de ? `<div class="ff" style="margin-top:4px">${icon('cross', 16)} ${esc(v.false_friend_de)}</div>` : ''}</div></div>`).join('')}</div>
  <button class="btn block-btn big" id="addv">${esc(added ? t('vocabList.added') : t('vocabList.add'))}</button>
  <p class="small" style="margin-top:10px;text-align:center">${esc(t('vocabList.note'))}</p>`);
  $('#addv').onclick = () => {
    update(() => { lessonProgress(id).vocab = true; });
    toast(t('vocabList.toast'));
    location.hash = '#/vocab';
  };
}

/* ---------- Grammatik ---------- */
export function viewGrammar(id) {
  const l = lessonOr404(id);
  setArea('grammar');
  const p = get().progress[id]?.grammar || {};
  render(`
  ${topbar(t('areas.grammar'), back(id))}
  ${l.grammar.map(g => `
  <section class="card" data-g="${g.id}">
    <h2>${esc(g.title_de)}</h2>
    ${g.explain_de.map(x => `<p>${esc(x)}</p>`).join('')}
    ${g.table ? `<div style="overflow-x:auto"><table class="tbl"><thead><tr>${g.table.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${g.table.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    ${g.es_compare_de ? `<div class="tip-es"><h3>${esc(t('grammar.esTitle'))}</h3>${esc(g.es_compare_de.replace(/^Wie im Spanischen\?\s*/, ''))}</div>` : ''}
    ${g.memo_de ? `<div class="memo">${esc(g.memo_de)}</div>` : ''}
    <h3>${esc(t('grammar.examples'))}</h3>
    ${g.examples.map(x => `<div class="ex">${sayBtn(x.pt)}<div><b>${esc(x.pt)}</b><span class="tr">${esc(x.de)}</span></div></div>`).join('')}
    <button class="btn block-btn" style="margin-top:14px" data-ok="${g.id}">${p[g.id] ? icon('check', 20) + ' ' + esc(t('grammar.understood')) : esc(t('grammar.understand'))}</button>
  </section>`).join('')}`);
  $$('[data-ok]').forEach(b => b.onclick = () => {
    const gid = b.dataset.ok;
    update(() => { lessonProgress(id).grammar[gid] = true; });
    const ex = l.exercises.find(e => e.grammar === gid);
    toast(t('grammar.toast'));
    location.hash = ex ? `#/lesson/${id}/exercises/${ex.id}` : `#/lesson/${id}/exercises`;
  });
}

/* ---------- Übungen ---------- */
export function viewExercises(id) {
  const l = lessonOr404(id);
  setArea('exercises');
  const p = get().progress[id]?.exercises || {};
  render(`
  ${topbar(t('areas.exercises'), back(id))}
  <p>${esc(t('exercises.intro'))}</p>
  <div class="partlist">${l.exercises.map(ex => {
    const open = exerciseUnlocked(l, ex);
    const res = p[ex.id];
    return `<a class="part" style="background:var(--cream);color:var(--text)" href="${open ? `#/lesson/${id}/exercises/${ex.id}` : `#/lesson/${id}/grammar`}">
      ${icon(open ? (res ? 'check' : 'play') : 'lock', 28)}<div class="grow">${esc(ex.title_de)}<small>${esc(open ? t('exercises.type.' + ex.type) : t('exercises.locked'))}</small></div>
      ${res ? `<span class="pill">${res.score}/${res.total}</span>` : ''}</a>`;
  }).join('')}</div>`);
}

export function viewExercise(id, exId) {
  const l = lessonOr404(id);
  const ex = findExercise(l, exId);
  if (!ex) throw new Error(t('error.noLesson'));
  if (!exerciseUnlocked(l, ex)) { location.hash = `#/lesson/${id}/grammar`; toast(t('exercises.locked')); return; }
  setArea('exercises');
  const items = ex.items;
  let i = 0, score = 0;
  const next = l.exercises[l.exercises.indexOf(ex) + 1];

  const v = render(`${topbar(ex.title_de, `#/lesson/${id}/exercises`, `<span class="counter" id="cnt"></span>`)}
    <p>${esc(ex.prompt_de)}</p><div class="card" id="item"></div>`);
  const box = $('#item', v);

  function finish() {
    update(() => { lessonProgress(id).exercises[ex.id] = { score, total: items.length }; });
    box.outerHTML = doneBox(t('exercises.result', { s: score, n: items.length }),
      next && exerciseUnlocked(l, next) ? `#/lesson/${id}/exercises/${next.id}` : `#/lesson/${id}/exercises`,
      next && exerciseUnlocked(l, next) ? t('exercises.next') : t('exercises.overview'));
    $('#cnt').textContent = '';
  }

  function show() {
    if (i >= items.length) return finish();
    $('#cnt').textContent = `${i + 1}/${items.length}`;
    const it = items[i];
    let body = '';
    if (ex.type === 'gap') {
      body = `<div class="gap-sent">${esc(it.pt).replace(/_{2,}/, '<span aria-label="Lücke">____</span>')}</div>
        ${it.hint_de ? `<p class="muted small">${esc(t('exercises.hint'))}: ${esc(it.hint_de)}</p>` : ''}
        <input class="field" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" lang="pt-BR" placeholder="${esc(t('exercises.placeholder'))}">`;
    } else if (ex.type === 'choice') {
      body = `<div class="gap-sent">${esc(it.q_pt || it.q_de)}</div>${questionsHtml('c', [{ options: it.options, answer: it.answer }])}`;
    } else if (ex.type === 'transform') {
      body = `<div class="gap-sent">${esc(it.from_pt)}</div><textarea class="field" id="ans" style="min-height:90px" autocapitalize="off" spellcheck="false" lang="pt-BR" placeholder="${esc(t('exercises.placeholder'))}"></textarea>`;
    } else if (ex.type === 'order') {
      body = `${it.de ? `<p class="muted">${esc(it.de)}</p>` : ''}<div class="chips answer" id="built" aria-label="${esc(t('exercises.yourSentence'))}"></div><div class="chips" id="pool">${shuffle(it.words.map((w, k) => ({ w, k }))).map(x => `<button class="chip" data-k="${x.k}">${esc(x.w)}</button>`).join('')}</div>`;
    } else if (ex.type === 'dictation') {
      body = `<div class="row" style="margin-bottom:12px">${sayBtn(it.pt)} ${sayBtn(it.pt, 's')}<span class="muted small">${esc(t('exercises.dictationHint'))}</span></div>
        <input class="field" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" lang="pt-BR" placeholder="${esc(t('exercises.placeholder'))}">`;
    }
    box.innerHTML = `${body}<div id="fb"></div>
      ${ex.type === 'choice' ? '' : `<button class="btn block-btn" id="chk" style="margin-top:12px">${esc(t('exercises.check'))}</button>`}
      <button class="btn block-btn mango" id="nxt" style="margin-top:12px;display:none">${esc(t('exercises.continue'))}</button>`;

    const after = (ok, explain) => {
      if (ok) score++;
      if (explain && !$('#fb .explain')) $('#fb').insertAdjacentHTML('beforeend', `<p class="small explain" style="margin-top:8px">${esc(explain)}</p>`);
      const c = $('#chk'); if (c) c.style.display = 'none';
      $('#nxt').style.display = '';
      $('#nxt').focus();
    };
    $('#nxt').onclick = () => { i++; show(); };

    if (ex.type === 'choice') {
      bindQuestions(box, right => after(right === 1, it.explain_de));
      return;
    }
    if (ex.type === 'order') {
      const built = $('#built'), pool = $('#pool');
      [built, pool].forEach(el => el.addEventListener('click', e => {
        const c = e.target.closest('.chip');
        if (!c || box.dataset.done) return;
        (c.parentElement === pool ? built : pool).appendChild(c);
      }));
    }
    const ans = $('#ans');
    if (ans) { ans.focus(); ans.addEventListener('keydown', e => { if (e.key === 'Enter' && ex.type !== 'transform') { e.preventDefault(); $('#chk').click(); } }); }
    $('#chk').onclick = () => {
      if (box.dataset.done) return;
      const input = ex.type === 'order' ? $$('#built .chip').map(c => c.textContent).join(' ') : ans.value;
      if (!input.trim()) { toast(t('exercises.empty')); return; }
      box.dataset.done = '1';
      if (ans) ans.readOnly = true;
      const r = checkAnswer(input, it.answers);
      $('#fb').innerHTML = feedback(r.status, r.expected);
      after(r.status !== 'wrong', it.explain_de);
    };
    delete box.dataset.done;
  }
  show();
}

/* ---------- Sprechen ---------- */
function recorderHtml(key) {
  if (!canRecord()) return `<span class="small muted">${esc(t('speaking.noRec'))}</span>`;
  return `<button class="btn small-btn soft" data-rec="${key}">${icon('mic', 18)} <span>${esc(t('speaking.record'))}</span></button>`;
}
function bindRecorders(root) {
  let active = null;
  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-rec]');
    if (!b) return;
    const slot = root.querySelector(`[data-recout="${b.dataset.rec}"]`);
    if (active && active.btn === b) {
      const url = await active.rec.stop();
      active = null;
      b.querySelector('span').textContent = t('speaking.again');
      b.classList.add('soft');
      if (slot) slot.innerHTML = `<audio controls src="${url}"></audio>`;
      return;
    }
    if (active) return toast(t('speaking.busy'));
    try {
      stop();
      const rec = await startRecording();
      active = { btn: b, rec };
      b.querySelector('span').textContent = t('speaking.stop');
      b.classList.remove('soft');
    } catch (err) {
      console.warn(err);
      toast(t('speaking.denied'), 4000);
    }
  });
}

export function viewSpeaking(id) {
  const l = lessonOr404(id);
  setArea('speaking');
  const sp = l.speaking;
  const p = get().progress[id]?.speaking || {};
  const mark = key => `<button class="btn block-btn" style="margin-top:14px" data-mark="${key}">${p[key] ? icon('check', 20) + ' ' + esc(t('speaking.marked')) : esc(t('speaking.mark'))}</button>`;
  const v = render(`
  ${topbar(t('areas.speaking'), back(id))}
  <section class="card">
    <h2>${esc(t('speaking.shadowTitle'))}</h2><p class="small muted">${esc(t('speaking.shadowIntro'))}</p>
    ${sp.shadowing.map((s, k) => `<div class="ex" style="flex-wrap:wrap">
      <div class="row">${sayBtn(s.pt)}${sayBtn(s.pt, 's')}</div>
      <div class="grow" style="min-width:180px"><b>${esc(s.pt)}</b><span class="tr">${esc(s.de)}</span>${s.tip_de ? `<span class="small" style="display:block">${icon('tilde', 16)} ${esc(s.tip_de)}</span>` : ''}</div>
      <div class="rec-list" style="width:100%">${recorderHtml('sh' + k)}<div data-recout="sh${k}"></div></div></div>`).join('')}
    ${mark('shadowing')}
  </section>
  <section class="card" id="rp">
    <h2>${esc(t('speaking.roleTitle'))}: ${esc(sp.roleplay.title_de || '')}</h2>
    <p class="small">${esc(fill(sp.roleplay.situation_de))}</p>
    <div id="turns"></div>
    <button class="btn block-btn mango" id="rpnext">${esc(t('speaking.roleStart'))}</button>
    ${mark('roleplay')}
  </section>
  <section class="card">
    <h2>${esc(t('speaking.monoTitle'))}</h2>
    <p>${esc(fill(sp.monologue.task_de))}</p>
    <ul>${sp.monologue.prompts_pt.map(x => `<li lang="pt-BR">${esc(x)}</li>`).join('')}</ul>
    <div class="rec-list">${recorderHtml('mono')}<div data-recout="mono"></div></div>
    <details style="margin-top:10px"><summary>${esc(t('speaking.sample'))}</summary><div class="row">${sayBtn(sp.monologue.sample_pt)}<p lang="pt-BR" style="margin:0">${esc(sp.monologue.sample_pt)}</p></div></details>
    ${mark('monologue')}
  </section>`);
  bindRecorders(v);

  let ti = -1;
  const turns = sp.roleplay.turns;
  $('#rpnext').onclick = () => {
    ti++;
    if (ti >= turns.length) { $('#rpnext').style.display = 'none'; toast(cheer()); return; }
    const tu = turns[ti];
    $('#turns').insertAdjacentHTML('beforeend', `<div class="ex" style="flex-wrap:wrap">
      <div class="row">${sayBtn(tu.pt)}</div><div class="grow"><b>${esc(tu.other)}:</b> ${esc(tu.pt)}<span class="tr">${esc(tu.de)}</span>
      <div class="small" style="margin-top:6px">${icon('speaking', 16)} <b>${esc(t('speaking.you'))}:</b> ${esc(tu.you_hint_de)}</div>
      <details><summary class="small">${esc(t('speaking.sampleAnswer'))}</summary><div class="row">${sayBtn(tu.sample_pt)}<span lang="pt-BR">${esc(tu.sample_pt)}</span></div></details></div>
      <div class="rec-list" style="width:100%">${recorderHtml('rp' + ti)}<div data-recout="rp${ti}"></div></div></div>`);
    play(tu.pt);
    $('#rpnext').textContent = ti === turns.length - 1 ? t('speaking.roleEnd') : t('speaking.roleNext');
  };
  $$('[data-mark]').forEach(b => b.onclick = () => {
    update(() => { lessonProgress(id).speaking[b.dataset.mark] = true; });
    b.innerHTML = icon('check', 20) + ' ' + esc(t('speaking.marked'));
    toast(cheer());
  });
}

/* ---------- Lesen ---------- */
export function viewReading(id) {
  const l = lessonOr404(id);
  setArea('reading');
  const p = get().progress[id]?.reading || {};
  render(`
  ${topbar(t('areas.reading'), back(id))}
  ${l.reading.map((r, ri) => `<section class="card reading" data-ri="${ri}">
    <div class="row"><h2 class="grow" style="margin:0">${esc(r.title_de)}</h2>${p[r.id] ? icon('check', 26) : ''}</div>
    ${r.intro_de ? `<p class="small muted">${esc(fill(r.intro_de))}</p>` : ''}
    ${r.kind === 'whatsapp' ? `<div class="wa" lang="pt-BR">${r.messages.map(m => `<div class="msg ${m.me ? 'me' : ''}">${m.me ? '' : `<span class="from">${esc(m.from)}</span>`}${esc(m.pt)}</div>`).join('')}</div>`
      : `<div lang="pt-BR" style="white-space:pre-line;background:var(--sand);border-radius:18px;padding:14px">${esc(r.text_pt)}</div>`}
    ${r.glossary?.length ? `<details style="margin-top:10px"><summary>${esc(t('reading.glossary'))}</summary><div class="gloss">${r.glossary.map(g => `<span><b>${esc(g.pt)}</b> ${esc(g.de)}</span>`).join('')}</div></details>` : ''}
    <div class="hr"></div><div class="qs">${questionsHtml(r.id, r.questions)}</div>
  </section>`).join('')}<div id="rdone"></div>`);
  $$('.reading').forEach(sec => {
    const r = l.reading[+sec.dataset.ri];
    bindQuestions($('.qs', sec), (right, total) => {
      update(() => { lessonProgress(id).reading[r.id] = { right, total }; });
      if (Object.keys(lessonProgress(id).reading).length === l.reading.length)
        $('#rdone').innerHTML = doneBox(t('reading.done'), back(id), t('common.toLesson'));
    });
  });
}

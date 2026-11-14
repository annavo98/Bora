// Vokabeltrainer: Übersicht, Lernrunde, alle Wörter.
import { get } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../art.js';
import { render, setArea, esc, topbar, sayBtn, cheer, fmtDate, $, $$ } from '../ui.js';
import { stats, buildQueue, grade, GRADES, cardPool, isNew } from '../srs.js';
import { play } from '../audio.js';

export function viewTrainer() {
  setArea('vocab');
  const s = stats();
  render(`
  ${topbar(t('vocab.title'))}
  <div class="card">
    <div class="statgrid">
      <div class="stat"><b>${s.reviewsLeft}</b><span>${esc(t('vocab.due'))}</span></div>
      <div class="stat"><b>${s.newLeft}</b><span>${esc(t('vocab.new'))}</span></div>
      <div class="stat"><b>${s.learned}</b><span>${esc(t('vocab.learned'))}</span></div>
    </div>
    ${s.backlog ? `<div class="banner warn" style="margin:12px 0 0">${icon('tilde', 24)}<div class="small">${esc(t('vocab.backlog', { n: s.backlogRest, cap: s.reviewCap }))}</div></div>` : ''}
    <button class="btn block-btn big mango" style="margin-top:14px" id="start" ${s.todayLeft ? '' : 'disabled'}>${esc(s.todayLeft ? t('vocab.start', { n: s.todayLeft }) : t('vocab.nothing'))}</button>
    ${s.todayLeft ? '' : `<p class="small muted" style="text-align:center;margin:10px 0 0">${esc(s.total ? t('vocab.comeBack') : t('vocab.empty'))}</p>`}
    ${s.done ? `<p class="small" style="text-align:center;margin:10px 0 0">${esc(t('vocab.doneToday', { n: s.done }))}</p>` : ''}
  </div>
  <a class="btn block-btn ghost" href="#/vocab/all">${esc(t('vocab.all', { n: s.total }))}</a>`);
  const b = $('#start'); if (b) b.onclick = () => { location.hash = '#/vocab/session'; };
}

export function viewSession() {
  setArea('vocab', { tabs: false });
  const queue = buildQueue();
  const again = {};
  let shown = 0;
  const v = render(`${topbar(t('vocab.session'), '#/vocab', '<span class="counter" id="cnt"></span>')}<div id="card"></div>`);
  const box = $('#card', v);

  function next() {
    const card = queue.shift();
    if (!card) {
      box.innerHTML = `<div class="card cheer"><div class="big">${esc(cheer())}</div><p>${esc(t('vocab.sessionDone', { n: shown }))}</p><a class="btn block-btn" href="#/today">${esc(t('vocab.toToday'))}</a></div>`;
      $('#cnt').textContent = '';
      return;
    }
    shown++;
    $('#cnt').textContent = t('vocab.left', { n: queue.length + 1 });
    const st = get().srs[card.id];
    const fresh = isNew(card);
    const reverse = !fresh && st && st.reps >= 2 && (hash(card.id) + st.reps) % 2 === 0;
    const front = reverse
      ? `<div class="kicker">${esc(t('vocab.sayInPt'))}</div><div class="front">${esc(card.de)}</div>`
      : `<div class="kicker">${fresh ? esc(t('vocab.newCard')) : esc(t('vocab.whatMeans'))}</div><div class="row"><div class="front grow" lang="pt-BR">${esc(card.pt)}</div>${sayBtn(card.pt)}</div>
         ${card.ipa ? `<div class="ipa">${esc(card.ipa)}${card.pron_de ? ` · ${esc(card.pron_de)}` : ''}</div>` : ''}`;
    box.innerHTML = `<div class="flash">${front}
      <div class="back" id="back" hidden>
        ${reverse ? `<div class="row"><div class="front grow" lang="pt-BR">${esc(card.pt)}</div>${sayBtn(card.pt)}</div>${card.ipa ? `<div class="ipa">${esc(card.ipa)}</div>` : ''}` : `<div class="de">${esc(card.de)}</div>`}
        ${card.es ? `<div class="es-hint" style="margin-top:8px"><b>${esc(t('vocab.es'))}:</b> ${esc(card.es)}${card.hint_es_de ? ` · ${esc(card.hint_es_de)}` : ''}</div>` : ''}
        ${card.false_friend_de ? `<div class="ff" style="margin-top:8px">${icon('cross', 16)} <b>${esc(t('vocab.falseFriend'))}:</b> ${esc(card.false_friend_de)}</div>` : ''}
        ${card.note_de ? `<div class="small" style="margin-top:8px">${esc(card.note_de)}</div>` : ''}
        ${card.ex_pt ? `<div class="ex" style="margin-top:8px">${sayBtn(card.ex_pt)}<div><b lang="pt-BR">${esc(card.ex_pt)}</b><span class="tr">${esc(card.ex_de || '')}</span></div></div>` : ''}
      </div>
    </div>
    <button class="btn block-btn big" id="reveal" style="margin-top:14px">${esc(t('vocab.reveal'))}</button>
    <div class="grades" id="grades" hidden>
      <button class="btn g-again" data-g="again">${esc(t('vocab.again'))}<small>${esc(t('vocab.againSub'))}</small></button>
      <button class="btn g-hard" data-g="hard">${esc(t('vocab.hard'))}<small>${esc(t('vocab.hardSub'))}</small></button>
      <button class="btn g-good" data-g="good">${esc(t('vocab.good'))}<small>${esc(t('vocab.goodSub'))}</small></button>
      <button class="btn g-easy" data-g="easy">${esc(t('vocab.easy'))}<small>${esc(t('vocab.easySub'))}</small></button>
    </div>`;
    $('#reveal').onclick = () => {
      $('#back').hidden = false; $('#reveal').hidden = true; $('#grades').hidden = false;
      if (reverse) play(card.pt);
    };
    $$('#grades [data-g]').forEach(b => b.onclick = () => {
      const repeat = grade(card, GRADES[b.dataset.g]);
      if (repeat && (again[card.id] = (again[card.id] || 0) + 1) <= 3) queue.splice(Math.min(queue.length, 3), 0, card);
      next();
    });
  }
  next();
}

const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function viewAllVocab() {
  setArea('vocab');
  const st = get();
  const pool = cardPool();
  render(`
  ${topbar(t('vocab.allTitle'), '#/vocab')}
  <div class="card vlist">${pool.length ? pool.map(c => {
    const s = st.srs[c.id];
    const status = !s?.seen ? t('vocab.stNew') : s.interval >= 21 ? t('vocab.stMature') : t('vocab.stDue', { d: fmtDate(s.due) });
    return `<div class="v">${sayBtn(c.pt)}<div class="grow"><b lang="pt-BR">${esc(c.pt)}</b><span>${esc(c.de)}</span>
      <div class="small muted">${esc(status)}</div></div></div>`;
  }).join('') : `<p>${esc(t('vocab.empty'))}</p>`}</div>`);
}

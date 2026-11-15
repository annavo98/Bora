// Gesprächskarte „Conversa“: Ablauf „Zusammen“ (Standard) und „Im Call“.
// Sprachregel: Wer auf den Bildschirm schaut, bestimmt die Sprache.
import { get, update, lessonProgress, today } from '../store.js';
import { t, tp, tl, fill, ptArticle } from '../i18n.js';
import { icon } from '../art.js';
import { render, setArea, esc, topbar, toast, cheer, $, $$ } from '../ui.js';
import { findConversation } from '../content.js';
import { shareTandem, guidanceDots } from './tandem.js';

let timer = null;
function stopTimer() { if (timer) clearInterval(timer.iv); timer = null; }
window.addEventListener('hashchange', stopTimer);

function timerHtml(lang) {
  const L = k => tl(lang, 'timer.' + k);
  return `<div class="card" style="text-align:center"><div class="timer" id="clock">00:00</div>
    <div class="btnrow" style="justify-content:center"><button class="btn small-btn" id="tgo">${esc(L('start'))}</button>
    <button class="btn small-btn soft" id="treset">${esc(L('reset'))}</button></div></div>`;
}
function bindTimer(lang) {
  const L = k => tl(lang, 'timer.' + k);
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  if (!timer) timer = { sec: 0, running: false, iv: null };
  const draw = () => { const c = $('#clock'); if (c) c.textContent = fmt(timer.sec); const b = $('#tgo'); if (b) b.textContent = timer.running ? L('pause') : (timer.sec ? L('resume') : L('start')); };
  $('#tgo').onclick = () => {
    timer.running = !timer.running;
    clearInterval(timer.iv);
    if (timer.running) timer.iv = setInterval(() => { timer.sec++; draw(); }, 1000);
    draw();
  };
  $('#treset').onclick = () => { timer.sec = 0; timer.running = false; clearInterval(timer.iv); draw(); };
  draw();
}

export function viewConversa(cardId) {
  const found = findConversation(cardId);
  if (!found) throw new Error(t('error.noLesson'));
  const { card: c, lesson: l } = found;
  const s = get().settings;
  const art = ptArticle(s.partner), artL = ptArticle(s.learner);
  const run = { mode: 'together', rating: null, rubricLang: s.rubricLang || 'en' };
  stopTimer();

  const go = step => { steps[step](); window.scrollTo(0, 0); };
  const cheatsheet = () => `<details class="card" open id="cheat"><summary>${esc(t('conversa.cheatsheet'))}</summary>
    ${c.cheatsheet.map(x => `<div class="ex"><div><b lang="pt-BR">${esc(fill(x.pt))}</b><span class="tr">${esc(fill(x.de))}</span></div></div>`).join('')}</details>`;

  const steps = {
    // 1. Annas Startseite (Deutsch)
    start() {
      setArea('conversation');
      render(`${topbar(t('areas.conversation'), `#/lesson/${l.id}/conversa`)}
      <section class="card">
        <div class="kicker">${esc(t('conversa.minutes', { n: c.minutes || 10 }))}</div>
        <h2 lang="pt-BR" style="margin-bottom:2px">${esc(c.title_pt)}</h2><p class="muted">${esc(c.title_de)}</p>
        <p><b>${esc(t('conversa.situation'))}:</b> ${esc(fill(c.situation_de))}</p>
        <p><b>${esc(t('conversa.yourRole'))}:</b> ${esc(fill(c.role_learner_de))}</p>
        <p><b>${esc(t('conversa.goal'))}:</b> ${esc(fill(c.goal_de))}</p>
        ${c.target_words?.length ? `<p class="small"><b>${esc(t('conversa.targetWords'))}:</b> <span lang="pt-BR">${esc(c.target_words.join(', '))}</span></p>` : ''}
      </section>
      ${c.questions?.[0]?.sample_pt ? `<button class="btn block-btn big mango" id="tandem">${icon('share', 22)} ${esc(t('conversa.tandemStart'))}</button>
      <p class="small muted" style="margin:6px 0 12px">${esc(t('conversa.tandemStartHint'))}</p>` : ''}
      <button class="btn block-btn ${c.questions?.[0]?.sample_pt ? 'soft' : 'big mango'}" id="go">${esc(t('conversa.startTogether'))}</button>
      <button class="btn block-btn ghost" style="margin:12px 0 14px" id="call">${icon('share', 22)} ${esc(t('conversa.notThere'))}</button>
      ${cheatsheet()}`);
      if ($('#tandem')) $('#tandem').onclick = () => { run.mode = 'tandem'; go('tandemSend'); };
      $('#go').onclick = () => { run.mode = 'together'; go('handover'); };
      $('#call').onclick = () => { run.mode = 'call'; go('send'); };
    },
    // 2. Übergabe an Leo (Portugiesisch)
    handover() {
      setArea('partner', { tabs: false, leaves: false });
      render(`<div class="handover">${icon('conversation', 64)}
        <div class="big-name" lang="pt-BR">${esc(tp('handover.to', { art, Art: art.toUpperCase() }))}</div>
        <p lang="pt-BR">${esc(tp('handover.toSub'))}</p>
        <button class="btn block-btn big mango" id="ok" lang="pt-BR">${esc(tp('handover.ready'))}</button>
        <button class="btn block-btn ghost" style="margin-top:12px" id="back" lang="pt-BR">${esc(tp('handover.back'))}</button></div>`);
      $('#ok').onclick = () => go('partner');
      $('#back').onclick = () => go('start');
    },
    // 3. Partneransicht (Portugiesisch) mit Timer
    partner() {
      setArea('partner', { tabs: false, leaves: false });
      render(`<div lang="pt-BR">
        <div class="kicker" style="margin-top:8px">${esc(tp('partner.kicker'))}</div>
        <h1>${esc(c.title_pt)}</h1>
        <section class="card">
          <p><b>${esc(tp('partner.situation'))}:</b> ${esc(fill(c.situation_pt))}</p>
          <p><b>${esc(tp('partner.yourRole'))}:</b> ${esc(fill(c.role_partner_pt))}</p>
          <p style="margin:0"><b>${esc(tp('partner.goal'))}:</b> ${esc(fill(c.goal_pt))}</p>
        </section>
        <section class="card" style="background:var(--mango);color:var(--mango-ink)">
          <h3>${esc(tp('partner.tipsTitle'))}</h3><ul style="margin:0;padding-left:20px">${c.partner_tips_pt.map(x => `<li>${esc(fill(x))}</li>`).join('')}</ul>
        </section>
        ${timerHtml('pt')}
        <section class="card"><h3>${esc(tp('partner.questions'))}</h3><p class="small muted">${esc(tp('partner.questionsHint'))}</p>
          ${c.questions.map((q, i) => `<div class="pq" data-pq="${i}"><span class="qnum">${i + 1}</span><div class="grow"><b>${esc(fill(q.pt))}</b>
          ${q.followups_pt?.length ? `<div class="fu">${esc(tp('partner.followups'))}: ${esc(q.followups_pt.map(fill).join(' · '))}</div>` : ''}</div></div>`).join('')}
        </section>
        <button class="btn block-btn big mango" id="end">${esc(tp('partner.finish'))}</button></div>`);
      bindTimer('pt');
      $$('.pq').forEach(p => p.onclick = () => p.classList.toggle('done'));
      $('#end').onclick = () => go('ratePartner');
    },
    // 4. Leo bewertet am Handy (Portugiesisch)
    ratePartner() { rateScreen('partner'); },
    // 5. Übergabe zurück (Leo liest: Portugiesisch, klein zweisprachig)
    handback() {
      setArea('partner', { tabs: false, leaves: false });
      render(`<div class="handover">${icon('check', 64)}
        <div class="big-name" lang="pt-BR">${esc(tp('handback.title', { art: artL }))}</div>
        <p class="mirror-note">${esc(t('conversa.handbackDe'))}</p>
        <button class="btn block-btn big mango" id="ok">${esc(tp('handback.btn'))} · ${esc(t('conversa.handbackBtnDe'))}</button></div>`);
      $('#ok').onclick = () => go('check');
    },
    // Tandem 1: Link an Leo schicken (Annas Bildschirm, Deutsch)
    tandemSend() {
      setArea('conversation');
      const g = c.guidance || 1;
      render(`${topbar(t('conversa.tandemTitle2'), null)}
        <section class="card">
          <div class="glevel">${guidanceDots(g)} <span>${esc(t('conversa.guidanceLabel', { n: g, name: t('conversa.guidance.' + g) }))}</span></div>
          <p>${esc(t('conversa.guidanceText.' + g))}</p>
          <ol class="tandem-how">${t('conversa.tandemSteps').map(x => `<li>${esc(x)}</li>`).join('')}</ol>
          <button class="btn block-btn big mango" style="margin-top:12px" id="send">${icon('share', 22)} ${esc(t('conversa.tandemSendBtn'))}</button>
        </section>
        <button class="btn block-btn big" id="next">${esc(t('conversa.tandemGo'))}</button>
        <button class="btn block-btn ghost" style="margin-top:12px" id="back">${esc(t('conversa.backToStart'))}</button>`);
      $('#send').onclick = () => shareTandem(l.id, c);
      $('#next').onclick = () => { run.q = 0; go('tandemSheet'); };
      $('#back').onclick = () => go('start');
    },
    // Tandem 2: Annas Seite, Frage für Frage mit Bausteinen (Deutsch, Bausteine Portugiesisch)
    tandemSheet() {
      setArea('conversation', { tabs: false });
      const g = c.guidance || 1;
      const qs = c.questions;
      const i = run.q || 0;
      const q = qs[i];
      render(`${topbar(t('conversa.tandemQ', { n: i + 1, total: qs.length }), null, `<div class="glevel">${guidanceDots(g)}</div>`)}
        <div class="qprogress">${qs.map((_, k) => `<span class="${k === i ? 'cur' : k < i ? 'done ok' : ''}"></span>`).join('')}</div>
        <section class="card tq">
          <div class="kicker">${esc(t('conversa.tandemAsks', { name: s.partner }))}</div>
          <div class="tq-main" lang="pt-BR">${esc(fill(q.pt))}</div>
          ${g <= 1 && q.de ? `<p class="muted" style="margin:6px 0 0">${esc(fill(q.de))}</p>` : ''}
        </section>
        ${g <= 3 && q.starters_pt?.length ? `<details class="card" ${g <= 2 ? 'open' : ''}><summary><b>${esc(t('conversa.tandemStarters'))}</b></summary>
          <div class="starters" lang="pt-BR">${q.starters_pt.map(x => `<div class="starter">${esc(fill(x)).replace(/___/g, '<span class="gap">___</span>')}</div>`).join('')}</div>
          ${q.starters_pt.some(x => x.includes('___')) ? `<p class="small muted" style="margin:8px 0 0">${esc(t('conversa.tandemStartersHint'))}</p>` : ''}</details>` : ''}
        ${g <= 1 && q.sample_pt ? `<details class="card"><summary>${esc(t('conversa.tandemSample'))}</summary><p lang="pt-BR" style="margin:8px 0 0">${esc(fill(q.sample_pt))}</p></details>` : ''}
        <p class="small muted" style="margin-bottom:88px">${esc(t('conversa.tandemSync', { name: s.partner }))}</p>
        <div class="tandem-bar">
          <button class="btn soft" id="tprev" aria-label="${esc(t('common.back'))}">${icon('back', 20)}</button>
          <button class="btn grow mango" id="tnext">${esc(i >= qs.length - 1 ? t('conversa.callEnd') : t('conversa.tandemNext'))}</button>
        </div>`);
      $('#tprev').onclick = () => { if (i > 0) { run.q = i - 1; go('tandemSheet'); } else go('tandemSend'); };
      $('#tnext').onclick = () => { if (i < qs.length - 1) { run.q = i + 1; go('tandemSheet'); } else go('rateLearner'); };
    },
    // Call 2: Nachricht an Leo senden (Annas Bildschirm, Deutsch)
    send() {
      setArea('conversation');
      const msg = whatsappText(c);
      render(`${topbar(t('conversa.callTitle'), null)}
        <section class="card"><p>${esc(t('conversa.sendIntro'))}</p>
        <button class="btn block-btn big mango" id="send">${icon('share', 22)} ${esc(t('conversa.sendBtn'))}</button>
        <button class="btn block-btn soft" style="margin-top:10px" id="copy">${esc(t('conversa.copyMsg'))}</button>
        <details style="margin-top:12px"><summary>${esc(t('conversa.preview'))}</summary><pre lang="pt-BR" style="white-space:pre-wrap;font:inherit;font-size:15px">${esc(msg)}</pre></details></section>
        <button class="btn block-btn big" id="next">${esc(t('conversa.callStart'))}</button>
        <button class="btn block-btn ghost" style="margin-top:12px" id="back">${esc(t('conversa.backToStart'))}</button>`);
      const copy = async () => { try { await navigator.clipboard.writeText(msg); toast(t('conversa.copied')); } catch { toast(t('writing.copyFail')); } };
      $('#copy').onclick = copy;
      $('#send').onclick = async () => {
        if (navigator.share) {
          try { await navigator.share({ text: msg }); return; } catch (e) { if (e.name === 'AbortError') return; }
        }
        await copy();
        window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      };
      $('#next').onclick = () => go('callsheet');
      $('#back').onclick = () => go('start');
    },
    // Call 3: Annas Spickzettel mit Timer (Deutsch)
    callsheet() {
      setArea('conversation', { tabs: false });
      render(`${topbar(t('conversa.callTitle'), null)}
        ${timerHtml('de')}
        <p class="small">${esc(t('conversa.callHint'))}</p>
        ${cheatsheet()}
        <button class="btn block-btn big mango" id="end">${esc(t('conversa.callEnd'))}</button>`);
      bindTimer('de');
      $('#end').onclick = () => go('rateLearner');
    },
    // Call 4: Bewertungsbogen Englisch (PT umschaltbar), Bedienung Deutsch
    rateLearner() { rateScreen('learner'); },
    // 6. Annas Checkliste (Deutsch)
    check() {
      setArea('conversation', { tabs: true });
      const r = run.rating || {};
      const und = r.understood ? t('conversa.und.' + r.understood) : '–';
      render(`${topbar(t('conversa.checkTitle'), null)}
        <section class="card"><h3>${esc(t('conversa.feedbackFrom', { name: s.partner }))}</h3>
          <p><b>${esc(t('conversa.understood'))}:</b> ${esc(und)}</p>
          ${r.errors?.length ? `<p style="margin-bottom:4px"><b>${esc(t('conversa.errors'))}:</b></p><ul lang="pt-BR">${r.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul><p class="small muted">${esc(t('conversa.errorsToTrainer'))}</p>` : ''}
          ${r.praise ? `<p><b>${esc(t('conversa.praise'))}:</b> ${esc(r.praise)}</p>` : ''}
        </section>
        <section class="card"><h3>${esc(t('conversa.selfCheck'))}</h3>
          ${['grammar', 'words', 'portuguese'].map(k => `<label class="check-item"><input type="checkbox" data-ck="${k}"><span>${esc(t('conversa.ck.' + k))}${k === 'grammar' && c.target_grammar_de?.length ? ` <span class="muted small">(${esc(c.target_grammar_de.join(', '))})</span>` : ''}${k === 'words' && c.target_words?.length ? ` <span class="muted small" lang="pt-BR">(${esc(c.target_words.join(', '))})</span>` : ''}</span></label>`).join('')}
        </section>
        <button class="btn block-btn big mango" id="done">${esc(t('conversa.feito'))}</button>`);
      $('#done').onclick = () => {
        const checklist = Object.fromEntries($$('[data-ck]').map(x => [x.dataset.ck, x.checked]));
        update(st => {
          st.conversations.push({ id: 'c' + Date.now().toString(36), cardId: c.id, lessonId: l.id, date: today(), mode: run.mode, rating: run.rating, checklist, seconds: timer?.sec || 0 });
          lessonProgress(l.id).conversation[c.id] = true;
          for (const e of run.rating?.errors || []) {
            const idv = 'c-' + e.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40);
            if (!st.extraVocab.some(v => v.id === idv)) st.extraVocab.push({ id: idv, pt: e, de: t('conversa.errCard', { name: st.settings.partner }), source: c.id });
          }
        });
        stopTimer();
        toast(cheer());
        location.hash = `#/lesson/${l.id}/conversa`;
      };
    }
  };

  function rateScreen(who) {
    // who = 'partner': Leo bewertet selbst, alles Portugiesisch. who = 'learner': Anna trägt ein, Fragen EN/PT, Knöpfe Deutsch.
    const lang = who === 'partner' ? 'pt' : run.rubricLang;
    const R = k => tl(lang, 'rubric.' + k);
    const ui = k => (who === 'partner' ? tp('rate.' + k) : t('conversa.rate.' + k));
    setArea(who === 'partner' ? 'partner' : 'conversation', { tabs: false, leaves: false });
    render(`<div ${who === 'partner' ? 'lang="pt-BR"' : ''}>
      <div class="topbar"><div class="title">${esc(ui('title'))}</div>
      ${who === 'learner' ? `<div class="seg-switch" role="group" aria-label="${esc(t('conversa.rubricLang'))}"><button data-lang="pt" aria-pressed="${lang === 'pt'}">PT</button><button data-lang="en" aria-pressed="${lang === 'en'}">EN</button></div>` : ''}</div>
      ${who === 'learner' ? `<p class="small">${esc(t('conversa.rate.intro', { name: s.partner }))}</p>` : ''}
      <section class="card" lang="${lang === 'pt' ? 'pt-BR' : 'en'}">
        <h3>1. ${esc(R('understood'))}</h3>
        <div class="opts" id="und">${['yes', 'partly', 'no'].map(k => `<button class="opt" data-u="${k}">${esc(R('und_' + k))}</button>`).join('')}</div>
        <h3 style="margin-top:18px">2. ${esc(R('errors'))}</h3>
        <p class="small muted">${esc(R('errorsHint'))}</p>
        ${[0, 1, 2].map(i => `<input class="field" style="margin-bottom:8px" data-err="${i}" lang="pt-BR" autocapitalize="off" placeholder="${esc(R('errorPh'))} ${i + 1}">`).join('')}
        <h3 style="margin-top:12px">3. ${esc(R('praise'))}</h3>
        <input class="field" id="praise" placeholder="${esc(R('praisePh'))}">
      </section>
      <button class="btn block-btn big mango" id="save">${esc(ui('save'))}</button></div>`);
    let und = null;
    $$('#und .opt').forEach(b => b.onclick = () => {
      und = b.dataset.u;
      $$('#und .opt').forEach(x => { x.classList.toggle('right', x === b); x.querySelector('.ic')?.remove(); });
      b.insertAdjacentHTML('afterbegin', icon('check', 20));
    });
    $$('[data-lang]').forEach(b => b.onclick = () => {
      run.rubricLang = b.dataset.lang;
      update(st => { st.settings.rubricLang = b.dataset.lang; });
      rateScreen(who);
    });
    $('#save').onclick = () => {
      if (!und) { toast(ui('needUnderstood')); return; }
      run.rating = { understood: und, errors: $$('[data-err]').map(x => x.value.trim()).filter(Boolean), praise: $('#praise').value.trim(), by: who, lang };
      go(who === 'partner' ? 'handback' : 'check');
    };
  }

  steps.start();
}

// WhatsApp-Nachricht an Leo: Portugiesisch, *fett*, am Ende Bewertungsfragen auf Englisch
export function whatsappText(c) {
  const s = get().settings;
  const L = k => tp('wa.' + k, { learner: s.learner, partner: s.partner });
  const out = [
    `*${L('title')}: ${c.title_pt}*`, '',
    `*${L('situation')}:* ${fill(c.situation_pt)}`,
    `*${L('role')}:* ${fill(c.role_partner_pt)}`,
    `*${L('goal')}:* ${fill(c.goal_pt)}`, '',
    `*${L('questions')}:*`,
    ...c.questions.map((q, i) => `${i + 1}. ${fill(q.pt)}${q.followups_pt?.length ? `\n   _${L('followups')}: ${q.followups_pt.map(fill).join(' / ')}_` : ''}`), '',
    `*${L('tips')}:*`, ...c.partner_tips_pt.map(x => `• ${fill(x)}`), '',
    `*${L('rubricIntro')}*`,
    `1. ${tl('en', 'rubric.understood')} (${['yes', 'partly', 'no'].map(k => tl('en', 'rubric.und_' + k)).join(' / ')})`,
    `2. ${tl('en', 'rubric.errors')}`,
    `3. ${tl('en', 'rubric.praise')}`, '',
    L('thanks')
  ];
  return out.join('\n');
}

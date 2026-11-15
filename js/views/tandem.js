// Tandem: Leo öffnet einen geteilten Link und sieht den Dialog aus seiner Sicht (Portugiesisch).
// Nur lokale Rückmeldung, nichts wird gespeichert, keine Verbindung zwischen den Handys.
import { get } from '../store.js';
import { t, tp, fill } from '../i18n.js';
import { icon } from '../art.js';
import { render, setArea, esc, topbar, sayBtn, toast, $, $$ } from '../ui.js';
import { getLesson } from '../content.js';

const isLearner = speaker => speaker === 'Anna' || speaker === get().settings.learner;

export function tandemUrl(lessonId, dialogId) {
  return `${location.origin}${location.pathname}#/tandem/${lessonId}/${dialogId}`;
}

// Knopf in der Hören-Ansicht (Annas Seite, Deutsch). Die Nachricht selbst liest Leo, also Portugiesisch.
export async function shareTandem(lessonId, dialog) {
  const url = tandemUrl(lessonId, dialog.id);
  const text = tp('tandem.shareText', { title: dialog.title });
  if (navigator.share) {
    try { await navigator.share({ text, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); toast(t('listening.tandemCopied'), 4000); }
  catch { window.prompt(t('listening.tandemCopyFail'), url); }
}

export function viewTandem(lessonId, dialogId) {
  setArea('listening', { tabs: false });
  const l = getLesson(lessonId);
  const d = l?.listening?.dialogs.find(x => x.id === dialogId);
  if (!d) {
    render(`${topbar(tp('tandem.title'), '')}<div class="card" lang="pt-BR"><p>${esc(tp('tandem.notFound'))}</p></div>`);
    return;
  }
  const roles = [...new Set(d.lines.filter(x => !isLearner(x.speaker)).map(x => x.speaker))];
  const learner = d.lines.find(x => isLearner(x.speaker))?.speaker || 'Anna';
  const ratings = {};   // nur im Speicher, wird nie gesichert
  let cur = 0;

  render(`
  ${topbar(tp('tandem.title'), '')}
  <div lang="pt-BR">
  <section class="card">
    <div class="kicker">${esc(tp('tandem.kicker', { n: l.number }))}</div>
    <h2 style="margin:4px 0 6px">${esc(d.title)}</h2>
    ${d.situation_pt ? `<p style="margin:0 0 8px">${esc(fill(d.situation_pt))}</p>` : ''}
    <p style="margin:0"><b>${esc(tp('tandem.yourRole'))}:</b> ${esc(roles.join(', '))}</p>
    <p style="margin:4px 0 0"><b>${esc(tp('tandem.herRole', { name: learner }))}</b></p>
  </section>
  <details class="card tandem-info" open><summary>${esc(tp('tandem.howTitle'))}</summary>
    <ul class="tandem-how">${tp('tandem.how', { name: learner }).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  </details>
  ${l.tandem_can_pt ? `<details class="card tandem-info tandem-can"><summary>${esc(tp('tandem.canTitle', { name: learner }))}</summary>
    <p style="margin:8px 0 0">${esc(fill(l.tandem_can_pt))}</p>
  </details>` : ''}
  <div class="tlines">${d.lines.map((ln, i) => isLearner(ln.speaker) ? `
    <div class="tline her" data-i="${i}">
      <div class="who">${esc(tp('tandem.sheSays', { name: ln.speaker }))}</div>
      <div class="pt">${esc(ln.pt)}</div>
      <div class="rate" role="group" aria-label="${esc(tp('tandem.rateLabel'))}">
        <button class="opt" data-r="ok">${icon('check', 18)} ${esc(tp('tandem.ok'))}</button>
        <button class="opt" data-r="almost">≈ ${esc(tp('tandem.almost'))}</button>
        <button class="opt" data-r="again">${icon('cross', 18)} ${esc(tp('tandem.again'))}</button>
      </div>
    </div>` : `
    <div class="tline mine" data-i="${i}">
      <div class="who">${esc(tp('tandem.youSay', { name: ln.speaker }))}</div>
      <div class="row">${sayBtn(ln.pt, 'n', tp('tandem.listen'))}<div class="pt grow">${esc(ln.pt)}</div></div>
    </div>`).join('')}</div>
  <div id="tsum"></div>
  <div class="tandem-bar">
    <button class="btn soft" id="tprev" aria-label="${esc(tp('tandem.prev'))}">${icon('back', 20)}</button>
    <button class="btn grow mango" id="tnext">${esc(tp('tandem.next'))}</button>
  </div>
  </div>`);

  const lines = $$('.tline');
  const show = (scroll = true) => {
    lines.forEach((el, k) => { el.classList.toggle('active', k === cur); el.classList.toggle('past', k < cur); });
    $('#tnext').textContent = cur >= lines.length - 1 ? tp('tandem.finish') : tp('tandem.next');
    if (scroll) lines[cur]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const summary = () => {
    const v = Object.values(ratings);
    const n = r => v.filter(x => x === r).length;
    $('#tsum').innerHTML = `<section class="card tandem-sum"><h3 style="margin-top:0">${esc(tp('tandem.sumTitle'))}</h3>
      <p style="margin:0">${icon('check', 18)} ${n('ok')} ${esc(tp('tandem.ok'))} · ≈ ${n('almost')} ${esc(tp('tandem.almost'))} · ${icon('cross', 18)} ${n('again')} ${esc(tp('tandem.again'))}</p>
      <p class="small muted">${esc(tp('tandem.sumHint', { name: learner }))}</p>
      <button class="btn block-btn soft" id="trestart">${esc(tp('tandem.restart'))}</button></section>`;
    $('#trestart').onclick = () => { for (const k in ratings) delete ratings[k]; $$('.rate .opt').forEach(b => b.classList.remove('right', 'near', 'wrong')); $('#tsum').innerHTML = ''; cur = 0; show(); };
    $('#tsum').scrollIntoView({ behavior: 'smooth' });
  };
  const next = () => { if (cur < lines.length - 1) { cur++; show(); } else summary(); };

  $('.tlines').addEventListener('click', e => {
    const b = e.target.closest('[data-r]');
    const line = e.target.closest('.tline');
    if (!line) return;
    const i = +line.dataset.i;
    if (b) {
      ratings[i] = b.dataset.r;
      $$('.opt', line).forEach(o => o.classList.remove('right', 'near', 'wrong'));
      b.classList.add({ ok: 'right', almost: 'near', again: 'wrong' }[b.dataset.r]);
      if (i === cur && b.dataset.r !== 'again') next();
      return;
    }
    if (!e.target.closest('.say')) { cur = i; show(false); }
  });
  $('#tnext').onclick = next;
  $('#tprev').onclick = () => { if (cur > 0) { cur--; show(); } };
  show(false);
}

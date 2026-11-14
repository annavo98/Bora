// Fortschritt und Einstellungen.
import * as store from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../art.js';
import { render, setArea, esc, topbar, toast, fmtDate, $ } from '../ui.js';
import { availableLessons } from '../content.js';
import { stats, forecast } from '../srs.js';
import { lessonRatio, currentLesson } from '../plan.js';
import { weekSegments } from './today.js';

export function viewProgress() {
  setArea(null);
  const st = store.get();
  const s = stats();
  const fc = forecast(7);
  const max = Math.max(1, ...fc.map(x => x.n));
  const wd = d => new Date(d + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short' });
  const l = currentLesson();
  render(`
  ${topbar(t('progress.title'), null, `<a class="iconbtn" href="#/settings" aria-label="${esc(t('settings.title'))}">${icon('gear')}</a>`)}
  <section class="card ocean"><div class="kicker">${esc(t('progress.thisWeek'))}</div><h3 style="margin:0">${esc(l.title)}</h3>${weekSegments(l)}</section>
  <div class="statgrid" style="margin-bottom:14px">
    <div class="stat"><b>${s.learned}</b><span>${esc(t('progress.words'))}</span></div>
    <div class="stat"><b>${s.mature}</b><span>${esc(t('progress.mature'))}</span></div>
    <div class="stat"><b>${st.submissions.length + st.conversations.length}</b><span>${esc(t('progress.tasks'))}</span></div>
  </div>
  <section class="card"><h3>${esc(t('progress.forecast'))}</h3>
    <div class="bars">${fc.map(x => `<div><span>${x.n}</span><i style="height:${Math.round(x.n / max * 60)}px"></i><span>${esc(wd(x.day))}</span></div>`).join('')}</div></section>
  <section class="card"><h3>${esc(t('progress.lessons'))}</h3>
    ${availableLessons().map(x => `<a href="#/lesson/${x.id}" style="display:block;text-decoration:none;margin-bottom:10px"><b>${x.number}. ${esc(x.title)}</b><div class="progress"><i style="width:${Math.round(lessonRatio(x) * 100)}%"></i></div></a>`).join('')}</section>
  <section class="card"><h3>${esc(t('progress.submissions'))}</h3>
    ${st.submissions.length ? st.submissions.slice().reverse().map(x => `<a class="part" style="background:var(--sand);color:var(--text);margin-bottom:8px" href="#/submission/${x.id}">${icon('writing', 24)}<div class="grow">${esc(fmtDate(x.date))}<small>${esc(x.correction?.parsed?.grade ? t('writing.grade', { g: x.correction.parsed.grade }) : t('writing.noCorrection'))}</small></div></a>`).join('') : `<p class="muted small">${esc(t('progress.none'))}</p>`}</section>
  <section class="card"><h3>${esc(t('progress.conversations'))}</h3>
    ${st.conversations.length ? st.conversations.slice().reverse().map(x => `<div class="ex">${icon('conversation', 22)}<div>${esc(fmtDate(x.date))} · ${esc(t('conversa.mode.' + x.mode))}<span class="tr">${esc(x.rating?.understood ? t('conversa.understood') + ': ' + t('conversa.und.' + x.rating.understood) : '')}</span></div></div>`).join('') : `<p class="muted small">${esc(t('progress.none'))}</p>`}</section>`);
}

export function viewSettings() {
  setArea(null);
  const st = store.get();
  const s = st.settings;
  const v = render(`
  ${topbar(t('settings.title'), '#/progress')}
  <section class="card">
    <h3>${esc(t('settings.names'))}</h3>
    <label class="small" for="learner">${esc(t('settings.learner'))}</label>
    <input class="field" id="learner" value="${esc(s.learner)}" autocomplete="off">
    <label class="small" for="partner" style="display:block;margin-top:10px">${esc(t('settings.partner'))}</label>
    <input class="field" id="partner" value="${esc(s.partner)}" autocomplete="off">
  </section>
  <section class="card">
    <h3>${esc(t('settings.trainer'))}</h3>
    <label class="small" for="dn">${esc(t('settings.dailyNew'))}</label>
    <input class="field" id="dn" type="number" inputmode="numeric" min="0" max="50" value="${s.dailyNew}">
    <label class="small" for="dr" style="display:block;margin-top:10px">${esc(t('settings.dailyReviews'))}</label>
    <input class="field" id="dr" type="number" inputmode="numeric" min="10" max="200" value="${s.dailyReviews}">
    <p class="small muted" style="margin-top:8px">${esc(t('settings.backlogInfo'))}</p>
  </section>
  <section class="card">
    <h3>${esc(t('settings.theme'))}</h3>
    <div class="seg-switch" role="group">${['auto', 'light', 'dark'].map(k => `<button data-theme-set="${k}" aria-pressed="${s.theme === k}">${esc(t('settings.theme_' + k))}</button>`).join('')}</div>
  </section>
  <section class="card">
    <h3>${esc(t('settings.backup'))}</h3>
    <p class="small">${esc(t('settings.backupInfo'))}</p>
    <p class="small"><b>${esc(st.lastBackup ? t('settings.lastBackup', { d: fmtDate(st.lastBackup) }) : t('settings.noBackup'))}</b></p>
    <button class="btn block-btn" id="export">${icon('share', 22)} ${esc(t('settings.export'))}</button>
    <label class="btn block-btn soft" style="margin-top:10px">${esc(t('settings.import'))}<input type="file" accept="application/json,.json" id="import" class="sr"></label>
  </section>
  <section class="card">
    <h3>${esc(t('settings.reset'))}</h3>
    <p class="small">${esc(t('settings.resetInfo'))}</p>
    <button class="btn block-btn ghost" id="reset" style="color:var(--bad)">${esc(t('settings.resetBtn'))}</button>
  </section>
  <details class="card"><summary>${esc(t('settings.dev'))}</summary>
    <p class="small">${esc(t('settings.devInfo'))}</p>
    <label class="small" for="dov">${esc(t('settings.dateOverride'))}</label>
    <input class="field" id="dov" type="date" value="${esc(store.dateOverride() || '')}">
    <div class="btnrow" style="margin-top:10px"><button class="btn small-btn" id="dovSet">${esc(t('settings.dateSet'))}</button><button class="btn small-btn soft" id="dovOff">${esc(t('settings.dateOff'))}</button></div>
    <p class="small muted" style="margin-top:8px">${esc(t('settings.today', { d: store.today() }))} · v${esc(document.documentElement.dataset.version || '')}</p>
  </details>`);

  const saveSettings = () => store.update(x => {
    x.settings.learner = $('#learner').value.trim() || 'Anna';
    x.settings.partner = $('#partner').value.trim() || 'Leo';
    x.settings.dailyNew = Math.max(0, Math.min(50, +$('#dn').value || 0));
    x.settings.dailyReviews = Math.max(10, Math.min(200, +$('#dr').value || 40));
  });
  ['learner', 'partner', 'dn', 'dr'].forEach(id => $('#' + id).addEventListener('change', () => { saveSettings(); toast(t('settings.saved')); }));
  v.querySelectorAll('[data-theme-set]').forEach(b => b.onclick = async () => {
    store.update(x => { x.settings.theme = b.dataset.themeSet; });
    (await import('../app.js')).applyTheme();
    viewSettings();
  });

  $('#export').onclick = async () => {
    const blob = await store.exportBackup();
    const name = `bora-sicherung-${store.today()}.json`;
    const file = new File([blob], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
      store.markBackup();
      toast(t('settings.exported'));
      viewSettings();
    } catch (e) { if (e.name !== 'AbortError') toast(t('settings.exportFail')); }
  };
  $('#import').onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm(t('settings.importConfirm'))) return;
    try {
      await store.importBackup(await f.text());
      toast(t('settings.imported'));
      location.hash = '#/today';
    } catch (err) { console.warn(err); toast(t('settings.importFail'), 4000); }
  };
  $('#reset').onclick = async () => {
    if (!confirm(t('settings.resetConfirm1'))) return;
    if (!confirm(t('settings.resetConfirm2'))) return;
    await store.reset();
    toast(t('settings.resetDone'));
    location.hash = '#/today';
  };
  $('#dovSet').onclick = () => { store.setDateOverride($('#dov').value || null); toast(t('settings.today', { d: store.today() })); viewSettings(); };
  $('#dovOff').onclick = () => { store.setDateOverride(null); viewSettings(); };
}

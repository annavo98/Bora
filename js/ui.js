// Kleine Hilfen für die Darstellung.
import { icon, leavesBg } from './art.js';
import { t } from './i18n.js';
import { play, stop } from './audio.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function setArea(area, { leaves = true, tabs = true } = {}) {
  if (area) document.body.dataset.area = area; else delete document.body.dataset.area;
  document.body.classList.toggle('no-tabs-bar', !tabs);
  document.getElementById('app').classList.toggle('no-tabs', !tabs);
  const old = document.querySelector('.leaves-bg');
  if (old) old.remove();
  if (area && leaves) document.body.insertAdjacentHTML('afterbegin', leavesBg());
  const tc = getComputedStyle(document.body).getPropertyValue('--page').trim();
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', tc || '#10325A');
}

export function render(html) {
  stop();
  const v = document.getElementById('view');
  v.innerHTML = html;
  window.scrollTo(0, 0);
  return v;
}

export function topbar(title, back, extra = '') {
  return `<div class="topbar">
    ${back ? `<a class="iconbtn" href="${back}" aria-label="${esc(t('common.back'))}">${icon('back')}</a>` : ''}
    <div class="title">${esc(title)}</div>${extra}</div>`;
}

// Audio-Knöpfe: <button class="say" data-say="text" data-speed="s">
export function sayBtn(text, speed = 'n', label) {
  const lab = label || (speed === 's' ? t('audio.slow') : t('audio.play'));
  return `<button class="say ${speed === 's' ? 'slow' : ''}" data-say="${esc(text)}" data-speed="${speed}" aria-label="${esc(lab)}" title="${esc(lab)}">${icon(speed === 's' ? 'slow' : 'play', 20)}</button>`;
}
export function bindSay(root) {
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-say]');
    if (!b) return;
    e.preventDefault();
    play(b.dataset.say, b.dataset.speed || 'n');
  });
}

let toastTimer;
export function toast(msg, ms = 2600) {
  document.querySelector('.toast')?.remove();
  const d = document.createElement('div');
  d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = msg;
  document.body.appendChild(d);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => d.remove(), ms);
}

// Feedback nie nur über Farbe: Symbol + Text
export function feedback(status, expected, extra = '') {
  const map = {
    right: ['right', 'check', t('check.right')],
    accent: ['near', 'tilde', t('check.accent')],
    typo: ['near', 'tilde', t('check.typo')],
    wrong: ['wrong', 'cross', t('check.wrong')]
  };
  const [cls, ic, label] = map[status];
  const sol = status === 'right' ? '' : ` ${esc(t('check.solution'))}: <b>${esc(expected)}</b>`;
  return `<div class="fb ${cls}" role="status">${icon(ic, 22)}<div><b>${esc(label)}</b>${sol}${extra ? `<div>${extra}</div>` : ''}</div></div>`;
}

// Etikett für Vorgriffe: als fertigen Block lernen, Grammatik kommt später (LEHRPLAN.md).
export const laterTag = lid => lid ? `<span class="later-tag" title="${esc(t('common.laterHint'))}">${esc(t('common.later', { n: parseInt(String(lid).slice(1), 10) }))}</span>` : '';

export const CHEERS = ['Arrasou!', 'Mandou bem!', 'Boa!', 'Show!', 'Isso aí!', 'Perfeito!'];
export const cheer = () => CHEERS[Math.floor(Math.random() * CHEERS.length)];

export function shuffle(a, seed) {
  const arr = [...a];
  let s = seed || Math.floor(Math.random() * 1e9);
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

export function confirmDialog(msg) { return window.confirm(msg); }

export const fmtDate = iso => { const [y, m, d] = String(iso).split('-'); return d ? `${d}.${m}.${y}` : iso; };

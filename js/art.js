// Flache SVG-Motive (keine Verläufe, keine Schatten). Farben über CSS-Variablen, damit der Dunkelmodus greift.
const C = {
  ocean: 'var(--ocean)', sand: 'var(--sand-art)', sun: 'var(--mango)', sea: 'var(--teal)',
  leaf: 'var(--leaf)', leaf2: 'var(--leaf-dark)', pink: 'var(--pink)', lila: 'var(--lila)', sky: 'var(--sky-art)',
  cream: 'var(--cream-art)', lime: 'var(--lime)'
};

const monstera = (x, y, s, rot, fill, hole) => `
<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
  <path d="M0 0 C-30 -8 -46 -40 -34 -70 C-24 -94 8 -100 26 -84 C46 -66 44 -30 22 -12 C14 -5 7 -1 0 0 Z" fill="${fill}"/>
  <path d="M0 0 C2 -30 0 -60 -4 -88" stroke="${hole}" stroke-width="3" fill="none"/>
  <path d="M-2 -22 L-30 -30 M-2 -42 L-36 -54 M-3 -62 L-30 -78 M1 -26 L30 -30 M1 -46 L36 -54 M0 -66 L26 -78" stroke="${hole}" stroke-width="5" stroke-linecap="round"/>
</g>`;

const palm = (x, y, s, fill) => `
<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
  <path d="M-3 0 C-1 -30 2 -55 0 -80 L5 -80 C7 -55 4 -30 3 0 Z"/>
  <path d="M2 -80 C-20 -95 -45 -90 -55 -75 C-35 -85 -15 -82 2 -78Z"/>
  <path d="M2 -80 C25 -96 48 -88 58 -72 C38 -84 20 -82 2 -78Z"/>
  <path d="M2 -80 C-8 -102 -30 -110 -42 -104 C-24 -100 -10 -92 2 -80Z"/>
  <path d="M2 -80 C12 -104 34 -110 46 -102 C28 -100 14 -92 2 -80Z"/>
  <path d="M2 -80 C0 -100 4 -112 10 -116 C8 -102 6 -92 4 -80Z"/>
</g>`;

const hibiscus = (x, y, s) => `
<g transform="translate(${x} ${y}) scale(${s})">
  ${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-13" rx="10" ry="14" fill="${C.pink}" transform="rotate(${r})"/>`).join('')}
  <circle r="5" fill="${C.sun}"/>
  <path d="M0 0 L14 -16" stroke="${C.sun}" stroke-width="2.5" stroke-linecap="round"/>
</g>`;

// Copacabana-Wellenmuster
const calcadaoDefs = id => `
<pattern id="${id}" width="40" height="20" patternUnits="userSpaceOnUse">
  <rect width="40" height="20" fill="${C.cream}"/>
  <path d="M0 10 C10 0 10 0 20 10 C30 20 30 20 40 10" stroke="${C.ocean}" stroke-width="5" fill="none"/>
</pattern>`;

const skyline = (y, fill) => `
<g fill="${fill}">
  <rect x="10" y="${y - 40}" width="22" height="40"/><rect x="34" y="${y - 62}" width="18" height="62"/>
  <rect x="54" y="${y - 48}" width="26" height="48"/><rect x="82" y="${y - 78}" width="16" height="78"/>
  <path d="M100 ${y} V${y - 92} L108 ${y - 104} L116 ${y - 92} V${y}Z"/>
  <rect x="118" y="${y - 54}" width="24" height="54"/><rect x="144" y="${y - 70}" width="20" height="70"/>
  <rect x="166" y="${y - 36}" width="28" height="36"/><rect x="196" y="${y - 86}" width="18" height="86"/>
  <rect x="216" y="${y - 58}" width="22" height="58"/><rect x="240" y="${y - 44}" width="30" height="44"/>
  <rect x="272" y="${y - 72}" width="16" height="72"/><rect x="290" y="${y - 50}" width="24" height="50"/>
  <rect x="316" y="${y - 64}" width="20" height="64"/><rect x="338" y="${y - 38}" width="22" height="38"/>
</g>`;

export function beachHeader() {
  return `<svg class="art" viewBox="0 0 360 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>${calcadaoDefs('calc1')}</defs>
  <rect width="360" height="170" fill="${C.sky}"/>
  <circle cx="270" cy="58" r="34" fill="${C.sun}"/>
  <path d="M0 98 C40 88 80 108 120 98 C160 88 200 108 240 98 C280 88 320 108 360 98 V136 H0Z" fill="${C.sea}"/>
  <path d="M0 112 C30 106 60 118 90 112 C120 106 150 118 180 112" stroke="${C.cream}" stroke-width="3" fill="none" opacity=".7"/>
  <path d="M200 120 C230 114 260 126 290 120 C320 114 340 122 360 118" stroke="${C.cream}" stroke-width="3" fill="none" opacity=".7"/>
  <rect y="132" width="360" height="38" fill="url(#calc1)"/>
  ${palm(40, 150, 1.05, C.leaf2)}
  ${monstera(338, 176, 1.1, -20, C.leaf, C.sky)}
  ${monstera(300, 186, .8, 25, C.leaf2, C.sky)}
  ${hibiscus(318, 106, 1)}
</svg>`;
}

const covers = {
  arrival: () => `
  <rect width="360" height="150" fill="${C.sky}"/>
  <circle cx="290" cy="46" r="24" fill="${C.sun}"/>
  <g transform="translate(70 40) rotate(-12)" fill="${C.ocean}">
    <path d="M0 8 L70 2 C80 1 84 8 76 11 L0 16Z"/><path d="M30 6 L50 -18 L60 -18 L48 6Z"/><path d="M34 14 L52 34 L62 34 L50 13Z"/><path d="M2 8 L-8 -6 L0 -6 L12 8Z"/>
  </g>
  <path d="M40 54 C90 40 140 40 200 30" stroke="${C.cream}" stroke-width="3" stroke-dasharray="6 7" fill="none"/>
  ${skyline(150, C.ocean)}
  ${hibiscus(330, 120, .9)}`,
  family: () => `
  <rect width="360" height="150" fill="${C.sky}"/>
  <circle cx="60" cy="44" r="22" fill="${C.sun}"/>
  <rect y="122" width="360" height="28" fill="${C.leaf}"/>
  <g transform="translate(130 46)">
    <path d="M-12 36 L50 -6 L112 36Z" fill="${C.pink}"/>
    <rect x="0" y="34" width="100" height="62" fill="${C.cream}"/>
    <rect x="40" y="58" width="22" height="38" rx="4" fill="${C.ocean}"/>
    <rect x="10" y="48" width="20" height="18" rx="3" fill="${C.sun}"/><rect x="72" y="48" width="20" height="18" rx="3" fill="${C.sun}"/>
  </g>
  ${palm(300, 128, .9, C.leaf2)}
  ${monstera(30, 160, .9, 15, C.leaf2, C.sky)}`,
  default: () => `
  <rect width="360" height="150" fill="${C.sky}"/>
  <circle cx="180" cy="70" r="30" fill="${C.sun}"/>
  <path d="M0 110 C60 96 120 124 180 110 C240 96 300 124 360 110 V150 H0Z" fill="${C.sea}"/>
  ${palm(60, 140, 1, C.leaf2)}${palm(310, 140, .9, C.leaf2)}`
};

export function cover(key) {
  return `<svg class="art" viewBox="0 0 360 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${(covers[key] || covers.default)()}</svg>`;
}

// Dezente Blätter im Hintergrund der Übungsseiten (Ton in Ton über currentColor)
export function leavesBg() {
  return `<svg class="leaves-bg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
  ${monstera(330, 150, 1.4, -30, 'currentColor', 'var(--page)')}
  ${monstera(20, 420, 1.2, 40, 'currentColor', 'var(--page)')}
  ${monstera(350, 620, 1.1, -10, 'currentColor', 'var(--page)')}
</svg>`;
}

// Kleine Symbole der Lernbereiche
const ICONS = {
  vocab: '<rect x="5" y="7" width="22" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M10 13h12M10 18h8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  listening: '<path d="M6 19v-3a10 10 0 0 1 20 0v3" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="4" y="18" width="6" height="9" rx="2.5" fill="currentColor"/><rect x="22" y="18" width="6" height="9" rx="2.5" fill="currentColor"/>',
  grammar: '<path d="M6 6h9v6a3 3 0 1 1 0 6v8H6z M15 6h11v20H15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>',
  exercises: '<path d="M6 17l6 6L26 9" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
  speaking: '<rect x="11" y="4" width="10" height="16" rx="5" fill="currentColor"/><path d="M6 15a10 10 0 0 0 20 0M16 25v4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  reading: '<path d="M16 9c-4-3-8-3-12-2v18c4-1 8-1 12 2 4-3 8-3 12-2V7c-4-1-8-1-12 2zM16 9v18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>',
  writing: '<path d="M7 25l2-7L21 6l5 5-12 12z M18 9l5 5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>',
  conversation: '<path d="M4 7h16v11H11l-5 4v-4H4z" fill="currentColor"/><path d="M23 12h5v10h-2v3l-4-3h-8v-2" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>',
  play: '<path d="M10 6l16 10-16 10z" fill="currentColor"/>',
  slow: '<path d="M6 22c0-6 5-11 11-11s9 4 9 8-3 5-6 5H6z" fill="currentColor"/><circle cx="25" cy="10" r="3" fill="currentColor"/>',
  stop: '<rect x="8" y="8" width="16" height="16" rx="3" fill="currentColor"/>',
  mic: '<rect x="11" y="4" width="10" height="16" rx="5" fill="currentColor"/><path d="M6 15a10 10 0 0 0 20 0M16 25v4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  gear: '<path d="M5 9h22M5 16h22M5 23h22" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="11" cy="9" r="3.6" fill="var(--cream)" stroke="currentColor" stroke-width="2.6"/><circle cx="21" cy="16" r="3.6" fill="var(--cream)" stroke="currentColor" stroke-width="2.6"/><circle cx="13" cy="23" r="3.6" fill="var(--cream)" stroke="currentColor" stroke-width="2.6"/>',
  back: '<path d="M20 6L10 16l10 10" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
  today: '<circle cx="16" cy="16" r="6" fill="currentColor"/><path d="M16 2v4M16 26v4M2 16h4M26 16h4M6 6l3 3M23 23l3 3M6 26l3-3M23 9l3-3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  course: '<path d="M4 8l12-5 12 5-12 5z" fill="currentColor"/><path d="M8 11v8c3 3 13 3 16 0v-8" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  progress: '<path d="M5 27V17M12 27V11M19 27V14M26 27V5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  lock: '<rect x="7" y="14" width="18" height="13" rx="3" fill="currentColor"/><path d="M11 14v-4a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="2.8"/>',
  check: '<path d="M6 17l6 6L26 9" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  cross: '<path d="M8 8l16 16M24 8L8 24" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  tilde: '<path d="M5 18c4-6 8-6 11-2s7 4 11-2" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>',
  camera: '<rect x="3" y="9" width="26" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="16" cy="18" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M11 9l2-4h6l2 4" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  keyboard: '<rect x="3" y="8" width="26" height="17" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M8 13h2M14 13h2M20 13h2M9 19h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  share: '<path d="M16 4v16M10 10l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 15v11h18V15" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/>'
};
export function icon(name, size = 24) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

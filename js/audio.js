// Audio: vorab erzeugte MP3 (audio/index.json, Text -> Datei), sonst Sprachausgabe des Geräts.
let index = {};
let current = null;

export async function loadAudioIndex() {
  try { index = await (await fetch('audio/index.json')).json(); } catch { index = {}; }
}
const key = s => String(s).trim().replace(/\s+/g, ' ');
export const hasFile = text => !!index[key(text)];

export function stop() {
  if (current) { current.pause(); current = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// speed: 'n' normal, 's' langsam. Gibt ein Promise zurück, das am Ende auflöst.
export function play(text, speed = 'n') {
  stop();
  const e = index[key(text)];
  if (e) {
    const file = e[speed] || e.n;
    const a = new Audio(`audio/${file}`);
    if (!e[speed] && speed === 's') a.playbackRate = 0.75;
    current = a;
    return new Promise(res => {
      a.onended = () => res(true);
      a.onerror = () => speak(text, speed).then(res);
      a.play().catch(() => speak(text, speed).then(res));
    });
  }
  return speak(text, speed);
}

let ptVoice = null;
function pickVoice() {
  if (ptVoice || !('speechSynthesis' in window)) return ptVoice;
  const vs = speechSynthesis.getVoices();
  ptVoice = vs.find(v => v.lang === 'pt-BR') || vs.find(v => v.lang?.startsWith('pt')) || null;
  return ptVoice;
}
export function speak(text, speed = 'n') {
  if (!('speechSynthesis' in window)) return Promise.resolve(false);
  return new Promise(res => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    const v = pickVoice(); if (v) u.voice = v;
    u.rate = speed === 's' ? 0.7 : 0.95;
    u.onend = () => res(true);
    u.onerror = () => res(false);
    speechSynthesis.speak(u);
  });
}

// Mehrere Zeilen nacheinander (Dialog). onLine(i) markiert die aktuelle Zeile.
export async function playSequence(texts, speed, onLine, isCancelled) {
  for (let i = 0; i < texts.length; i++) {
    if (isCancelled()) return;
    onLine(i);
    await play(texts[i], speed);
    if (isCancelled()) return;
    await new Promise(r => setTimeout(r, speed === 's' ? 600 : 300));
  }
  onLine(-1);
}

/* ---------- Aufnahme (iOS liefert mp4/aac, Chrome webm) ---------- */
export const canRecord = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/aac'];
  const mimeType = types.find(t => MediaRecorder.isTypeSupported?.(t));
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  rec.start();
  return {
    stop: () => new Promise(res => {
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        res(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/mp4' })));
      };
      rec.stop();
    })
  };
}

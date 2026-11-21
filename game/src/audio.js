// All sound is generated in code with WebAudio: no audio files, no network.
// A found difference rings a small two-note chime, a misclick taps dull wood,
// a hint whispers one soft note, and a win plays a short clockwork arpeggio.
let ctx = null;

function audioContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, startAt, duration, type, gainValue) {
  const ac = audioContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

export function playChime() {
  const ac = audioContext();
  if (!ac) return;
  const now = ac.currentTime;
  tone(880, now, 0.5, 'sine', 0.16);
  tone(1318.5, now + 0.12, 0.7, 'sine', 0.14);
}

export function playThud() {
  const ac = audioContext();
  if (!ac) return;
  const now = ac.currentTime;
  tone(140, now, 0.14, 'triangle', 0.12);
}

export function playHintNote() {
  const ac = audioContext();
  if (!ac) return;
  tone(659.3, ac.currentTime, 0.5, 'sine', 0.1);
}

export function playWinArpeggio() {
  const ac = audioContext();
  if (!ac) return;
  const now = ac.currentTime;
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
    tone(f, now + i * 0.13, 0.6, 'sine', 0.14);
  });
}

export function playTick() {
  const ac = audioContext();
  if (!ac) return;
  tone(1046.5, ac.currentTime, 0.12, 'sine', 0.06);
}

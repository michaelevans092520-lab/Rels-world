// Tiny synthesized sound effects (no audio files needed).
let ac = null;
export function unlockAudio() {
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {}
}
function tone(type, f0, f1, dur, vol, delay = 0) {
  if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain(), n = ac.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f0, n); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), n + dur * 0.7);
    g.gain.setValueAtTime(vol, n); g.gain.exponentialRampToValueAtTime(0.001, n + dur);
    o.connect(g).connect(ac.destination); o.start(n); o.stop(n + dur + 0.02);
  } catch (e) {}
}
export const SFX = {
  swish: () => tone('sawtooth', 520, 140, 0.15, 0.03),
  hit: () => { tone('sawtooth', 520, 140, 0.12, 0.03); tone('square', 220, 80, 0.14, 0.06, 0.03); },
  miss: () => tone('sawtooth', 480, 200, 0.12, 0.025),
  hurt: () => tone('square', 180, 60, 0.2, 0.07),
  kill: () => { tone('triangle', 660, 1320, 0.14, 0.08); },
  boss: () => { tone('triangle', 330, 660, 0.3, 0.09); tone('triangle', 495, 990, 0.4, 0.08, 0.15); tone('triangle', 660, 1320, 0.5, 0.08, 0.3); },
  coin: () => tone('triangle', 880, 1760, 0.12, 0.07),
  pickup: () => tone('sine', 520, 780, 0.12, 0.07),
  heal: () => { tone('sine', 440, 880, 0.25, 0.06); tone('sine', 660, 1320, 0.3, 0.05, 0.1); },
  level: () => { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.22, 0.07, i * 0.1)); },
  quest: () => { [392, 523, 659, 784].forEach((f, i) => tone('triangle', f, f * 1.01, 0.25, 0.07, i * 0.09)); },
  meow: () => { tone('sine', 700, 1250, 0.16, 0.08); tone('sine', 1150, 620, 0.26, 0.07, 0.15); },
  talk: () => tone('sine', 600, 650, 0.06, 0.04),
};
export function play(name) { if (SFX[name]) SFX[name](); }

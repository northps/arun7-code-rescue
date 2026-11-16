// เสียงสั้น ๆ สร้างด้วย WebAudio (ไม่มีไฟล์เสียง)
import { loadProgress } from '../game/progress';

let ctx: AudioContext | null = null;

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.06, delay = 0): void {
  if (!loadProgress().sound) return;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch {
    // ไม่มีเสียงก็เล่นได้
  }
}

export const sfx = {
  tap: () => tone(520, 0.05, 'triangle', 0.04),
  step: () => tone(880, 0.03, 'sine', 0.02),
  ok: () => {
    tone(660, 0.1, 'triangle');
    tone(990, 0.16, 'triangle', 0.06, 0.09);
  },
  bad: () => {
    tone(196, 0.2, 'sawtooth', 0.05);
    tone(147, 0.28, 'sawtooth', 0.05, 0.14);
  },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.07, i * 0.11));
  },
};

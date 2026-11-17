// เสียงสั้น ๆ สร้างด้วย WebAudio (ไม่มีไฟล์เสียง)
import { loadProgress } from '../game/progress';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!loadProgress().sound) return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null; // ไม่มีเสียงก็เล่นได้
  }
}

/** เสียงโทนเดียว · slideTo = ความถี่ปลายทาง (ไล่เสียงขึ้นหรือลง) */
function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.06, delay = 0, slideTo?: number): void {
  const ac = audio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch {
    // ข้าม
  }
}

let noiseBuf: AudioBuffer | null = null;

/** เสียงซ่า (ชน ระเบิด ลม เครื่องยนต์) · cutoff = ความถี่ของตัวกรองเสียงทุ้ม */
function noise(dur: number, vol = 0.06, delay = 0, cutoff = 1200): void {
  const ac = audio();
  if (!ac) return;
  try {
    if (!noiseBuf || noiseBuf.sampleRate !== ac.sampleRate) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = ac.currentTime + delay;
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(ac.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  } catch {
    // ข้าม
  }
}

const chime = (a: number, b: number) => {
  tone(a, 0.1, 'triangle', 0.05);
  tone(b, 0.16, 'triangle', 0.05, 0.08);
};
const buzz = () => tone(150, 0.22, 'sawtooth', 0.045);
const clunk = () => {
  tone(140, 0.09, 'square', 0.04);
  noise(0.07, 0.04, 0, 700);
};
const thud = () => {
  noise(0.28, 0.1, 0, 500);
  tone(90, 0.25, 'sine', 0.09, 0, 45);
};

type Ev = { type: string; [key: string]: unknown };

/**
 * เสียงของเหตุการณ์ในฉาก: ชื่อเหตุการณ์ → [ฟังก์ชันเล่นเสียง, เว้นอย่างน้อยกี่ ms ก่อนเล่นซ้ำ]
 * null = ตั้งใจให้เงียบ (เกิดถี่เกินไป หรือมีเสียงของเหตุการณ์อื่นแทนแล้ว)
 */
export const EVENT_SOUNDS: Record<string, [(ev: Ev) => void, number] | null> = {
  move: [() => tone(180, 0.07, 'triangle', 0.035, 0, 240), 60],
  turn: [() => tone(300, 0.08, 'triangle', 0.03, 0, 380), 60],
  bump: [thud, 200],
  crash: [thud, 200],
  pad: [() => chime(784, 1175), 300],
  door: [(ev) => (ev.state === 'open' ? tone(220, 0.35, 'sawtooth', 0.03, 0, 660) : ev.state === 'locked' ? clunk() : tone(520, 0.3, 'sawtooth', 0.03, 0, 200)), 150],
  lamp: [(ev) => (ev.on ? tone(1320, 0.08, 'sine', 0.04) : ev.dim ? tone(400, 0.12, 'sine', 0.03) : tone(700, 0.05, 'sine', 0.025)), 60],
  panel: [(ev) => (ev.ok === true ? chime(660, 990) : ev.ok === false ? buzz() : tone(740, 0.06, 'square', 0.025)), 100],
  serial: null,
  alarm: [() => {
    tone(880, 0.14, 'square', 0.04);
    tone(660, 0.18, 'square', 0.04, 0.14);
  }, 400],
  drive: null,
  motor: [(ev) => (ev.l === 0 && ev.r === 0 ? tone(260, 0.1, 'triangle', 0.03, 0, 140) : tone(120, 0.14, 'sawtooth', 0.025, 0, 190)), 260],
  sense: [() => tone(1500, 0.07, 'sine', 0.025, 0, 1900), 320],
  remote: [() => {
    tone(1200, 0.035, 'square', 0.02);
    tone(1600, 0.035, 'square', 0.02, 0.045);
  }, 280],
  pump: null,
  see: null,
  overheat: [() => {
    tone(700, 0.6, 'sawtooth', 0.05, 0, 80);
    noise(0.5, 0.06, 0.05, 900);
  }, 500],
  fall: [() => tone(900, 0.75, 'sine', 0.07, 0, 70), 500],
  flag: [() => tone(1047, 0.14, 'triangle', 0.05), 120],
  arrInit: [() => tone(600, 0.05, 'triangle', 0.03), 100],
  arr: [(ev) => (ev.ok === false ? buzz() : tone(ev.write ? 760 : 940, 0.04, 'triangle', 0.03)), 70],
  vault: [(ev) => (ev.res === 0 ? chime(660, 1320) : tone((ev.res as number) > 0 ? 420 : 620, 0.12, 'square', 0.03)), 150],
  input: [() => tone(980, 0.06, 'triangle', 0.035), 100],
  rush: [() => {
    tone(110, 0.9, 'sawtooth', 0.07, 0, 55);
    noise(0.8, 0.07, 0, 600);
  }, 800],
  aim: [() => tone(500, 0.09, 'square', 0.02, 0, 650), 100],
  fire: [(ev) => {
    tone(1700, 0.16, 'sawtooth', 0.045, 0, 240);
    if (ev.kill) noise(0.22, 0.08, 0.1, 1800);
    else if (ev.hostage) buzz();
    else if (ev.miss) tone(160, 0.14, 'sine', 0.05, 0.1);
    else tone(1100, 0.1, 'sine', 0.04, 0.1);
  }, 120],
  clamp: [(ev) => (ev.step === 'jam' ? buzz() : ev.step === 'release' ? clunk() : tone(880, 0.06, 'square', 0.03)), 100],
  engine: [(ev) => (ev.on ? noise(0.7, 0.08, 0, 500) : tone(240, 0.25, 'sawtooth', 0.03, 0, 90)), 200],
  chute: [(ev) => {
    noise(0.5, 0.07, 0, 2600);
    if (ev.ok === false) buzz();
  }, 300],
  legs: [clunk, 200],
  descent: [() => tone(520, 0.6, 'sine', 0.04, 0, 180), 400],
  cell: [(ev) => (ev.ok === false || ev.again ? buzz() : tone(880, 0.06, 'sine', 0.04, 0, 1320)), 60],
};

const lastAt: Record<string, number> = {};

export const sfx = {
  tap: () => tone(520, 0.05, 'triangle', 0.04),
  step: () => tone(880, 0.03, 'sine', 0.02),
  /** เสียงตัวหนังสือขึ้นในฉากเล่าเรื่อง */
  type: () => tone(1250, 0.018, 'square', 0.008),
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
  /** เพลงสั้นตอนจบเกม */
  finale: () => {
    [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i === 7 ? 0.9 : 0.24, 'triangle', 0.07, i * 0.16));
    [262, 330, 392].forEach((f) => tone(f, 1.6, 'sine', 0.035, 1.12));
  },
  /** เสียงของเหตุการณ์ในฉาก (เรียกทุกครั้งที่ฉากได้รับเหตุการณ์) */
  event: (ev: Ev) => {
    const s = EVENT_SOUNDS[ev.type];
    if (!s) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - (lastAt[ev.type] ?? -1e9) < s[1]) return;
    lastAt[ev.type] = now;
    s[0](ev);
  },
};

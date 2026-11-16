// ความคืบหน้าและดาว เก็บใน localStorage ของเครื่องที่เล่น
import { Level } from './types';

const KEY = 'arun7-progress-v1';

export interface Progress {
  /** ดาวของแต่ละโจทย์ (id โจทย์ → 1–3) */
  stars: Record<string, number>;
  /** ด่านที่อ่านบัตรบทเรียนแล้ว */
  seen: Record<string, boolean>;
  sound: boolean;
  fast: boolean;
  /** โหมดพิมพ์เอง: ทุกโจทย์ให้พิมพ์โค้ดแทนการแตะเลือก */
  typeMode: boolean;
}

function blank(): Progress {
  return { stars: {}, seen: {}, sound: true, fast: false, typeMode: false };
}

let cache: Progress | null = null;

export function loadProgress(): Progress {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...blank(), ...JSON.parse(raw) } : blank();
  } catch {
    cache = blank();
  }
  return cache!;
}

export function saveProgress(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadProgress()));
  } catch {
    // เก็บไม่ได้ (โหมดส่วนตัว) เล่นต่อได้แต่ไม่จำ
  }
}

export function resetProgress(): void {
  cache = blank();
  saveProgress();
}

export function setStars(puzzleId: string, stars: number): void {
  const p = loadProgress();
  if ((p.stars[puzzleId] ?? 0) < stars) p.stars[puzzleId] = stars;
  saveProgress();
}

/** ดาวของด่าน = ค่าต่ำสุดของโจทย์ในด่าน (0 = ยังไม่ผ่านครบ) */
export function levelStars(level: Level): number {
  const p = loadProgress();
  let min = 3;
  for (const pz of level.puzzles) min = Math.min(min, p.stars[pz.id] ?? 0);
  return min;
}

export function puzzlesDone(level: Level): number {
  const p = loadProgress();
  return level.puzzles.filter((pz) => (p.stars[pz.id] ?? 0) > 0).length;
}

export function isUnlocked(levels: Level[], index: number): boolean {
  if (index === 0) return true;
  return levelStars(levels[index - 1]) > 0;
}

/** คำนวณดาวจากจำนวนครั้งที่รันพลาดและการใช้คำใบ้ */
export function starsFor(failedRuns: number, hintsUsed: number): number {
  if (failedRuns === 0 && hintsUsed === 0) return 3;
  if (failedRuns <= 2 && hintsUsed <= 1) return 2;
  return 1;
}

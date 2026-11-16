// ชนิดข้อมูลของด่าน — ด่านทั้งหมดเป็น "ข้อมูล" ตามรูปแบบในไฟล์นี้
import { HostValue, VType } from '../interp';

export type Dir = 'N' | 'E' | 'S' | 'W';

/** คำสั่งของเกมที่ "ส่งค่าให้อุปกรณ์" เช่น enterCode(1234) ผลแสดงบนแผงควบคุมในฉาก */
export interface ActionSpec {
  /** จำนวนค่าที่ต้องส่ง */
  args: number;
  /** ชื่อที่แสดงบนแผง */
  label: string;
  /** ส่งค่าถูกแล้วประตูเปิด */
  opensDoor?: boolean;
}

export type PinDevice = 'lamp' | 'lock';

export type ApiName =
  | 'forward' | 'backward' | 'turnLeft' | 'turnRight'
  | 'openDoor' | 'closeDoor' | 'lockDoor';

export interface WorldSpec {
  /**
   * แผนที่ห้อง แถวบนสุดคือทิศเหนือ
   * '#' ผนัง  '.' พื้น  ' ' ว่าง  'B' บิต  'D' ประตู  'P' แผ่นเหยียบเปิดประตู
   * 'T' แผงควบคุม  'L' โคมไฟ  'A' ที่ยืนของเคลธ  'X' ลัง  'G' ยานกู้ชีพ  'W' หน้าต่าง
   */
  map: string[];
  dir?: Dir;
  /** คำสั่งเคลื่อนที่/ประตูที่ด่านนี้เปิดให้ใช้ */
  api?: ApiName[];
  /** อุปกรณ์ที่ต่อกับขาของบอร์ด */
  pins?: Record<number, PinDevice>;
  actions?: Record<string, ActionSpec>;
  /** คำสั่งอ่านค่า เช่น scanAliens() → 2 */
  sensors?: Record<string, number>;
  /** ค่าที่ readNumber() จะได้ ตามลำดับ */
  inputs?: number[];
  /** จำนวนเคลธที่รออยู่หลังประตู (ไม่ใส่ = ค่า scanAliens) */
  aliens?: number;
  /** จำนวนรอบของ loop() */
  loops?: number;
  /** ห้องมืดจนกว่าจะเปิดโคมไฟ */
  dark?: boolean;
}

export interface Goal {
  door?: 'open' | 'closed' | 'locked';
  /** บิตต้องไปยืนที่ไหน */
  at?: 'pad' | [number, number];
  /** ข้อความที่ต้องออกทาง Serial */
  serial?: string;
  /** สถานะขา: 1 = ติด, 0 = ดับ */
  pins?: Record<number, 0 | 1>;
  /** ค่าล่าสุดที่ต้องส่งให้คำสั่ง เช่น { enterCode: [1750] } */
  set?: Record<string, HostValue[]>;
  called?: string[];
  notCalled?: string[];
  /** เวลารอรวมอย่างน้อย (ms) */
  minDelay?: number;
}

/** กรณีทดสอบ: ค่าเซนเซอร์/ค่าที่รับเข้ามาต่างกัน เป้าหมายต่างกัน */
export interface Case {
  label: string;
  sensors?: Record<string, number>;
  inputs?: number[];
  aliens?: number;
  goal?: Goal;
}

interface PuzzleBase {
  id: string;
  title: string;
  /** สถานการณ์และสิ่งที่ต้องทำ (1–3 ประโยค) */
  mission: string;
  hints: string[];
  /** แก้ค่าโลกของด่านเฉพาะข้อนี้ */
  world?: Partial<WorldSpec>;
  goal: Goal;
  cases?: Case[];
  /** สิ่งที่ต้องมีในโค้ด (กันการใส่คำตอบตายตัวในข้อพิมพ์เอง) */
  require?: { re: string; msg: string }[];
  /** ข้อความเมื่อผ่าน */
  win?: string;
}

/** เติมช่องว่าง: ในโค้ดใช้ {{0}} {{1}} … แทนช่อง */
export interface BlankPuzzle extends PuzzleBase {
  kind: 'blank';
  code: string;
  bank: string[];
  answer: string[];
}

/** เรียงบรรทัด: lines เขียนตามลำดับที่ถูก เกมสลับให้เอง */
export interface OrderPuzzle extends PuzzleBase {
  kind: 'order';
  head: string;
  lines: string[];
  tail: string;
  /** ลำดับเริ่มต้น (index ของ lines) ไม่ใส่ = เกมสลับให้ */
  start?: number[];
}

/** หาที่ผิด: fixes บอกว่าบรรทัดไหน (เริ่มที่ 1) มีตัวเลือกอะไรบ้าง ตัวเลือกแรกคือของเดิมในโค้ด */
export interface FixPuzzle extends PuzzleBase {
  kind: 'fix';
  code: string;
  fixes: Record<number, { options: string[]; answer: number }>;
}

/** พิมพ์เอง */
export interface TypePuzzle extends PuzzleBase {
  kind: 'type';
  starter: string;
  solution: string;
}

export type Puzzle = BlankPuzzle | OrderPuzzle | FixPuzzle | TypePuzzle;

export type LessonBlock = { p: string } | { code: string } | { tip: string } | { list: string[] };

export interface Level {
  id: string;
  act: number;
  title: string;
  /** เรื่องที่สอน (สั้น ๆ) */
  concept: string;
  /** บทเรียนที่ตรงกัน เช่น "P02 · คู่มือหัวข้อ 3" */
  ref: string;
  story: string;
  outro?: string;
  lesson: { title: string; blocks: LessonBlock[] };
  world: WorldSpec;
  puzzles: Puzzle[];
}

export interface ActInfo {
  n: number;
  title: string;
  blurb: string;
  teaches: string;
  /** ชื่อด่านที่ยังไม่สร้าง (แสดงเป็นด่านล็อก) */
  planned: string[];
}

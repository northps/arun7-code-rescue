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
  | 'openDoor' | 'closeDoor' | 'lockDoor'
  | 'fire' | 'fireAt' | 'aimLeft' | 'aimRight' | 'standby' | 'powerCell'
  | 'unlockClamp' | 'releaseClamp' | 'engineOn' | 'engineOff' | 'openChute' | 'extendLegs' | 'beginDescent';

export interface WorldSpec {
  /**
   * แผนที่ห้อง แถวบนสุดคือทิศเหนือ
   * '#' ผนัง  '.' พื้น  ' ' ว่าง  'B' บิต  'D' ประตู  'P' แผ่นเหยียบเปิดประตู
   * 'T' แผงควบคุม  'L' โคมไฟ  'A' ที่ยืนของเคลธ  'X' ลัง  'G' ยานกู้ชีพ  'W' หน้าต่าง  'U' ป้อมปืน
   * 'S' ชั้นวางอาร์เรย์ (ใช้คู่กับ shelf)  'F' ธงจุดตรวจ (ใช้กับ drive)
   */
  map: string[];
  dir?: Dir;
  /** คำสั่งเคลื่อนที่/ประตูที่ด่านนี้เปิดให้ใช้ */
  api?: ApiName[];
  /** อุปกรณ์ที่ต่อกับขาของบอร์ด */
  pins?: Record<number, PinDevice>;
  actions?: Record<string, ActionSpec>;
  /** คำสั่งอ่านค่า เช่น scanAliens() → 2 (ใส่ตัวอักษร 1 ตัวได้ เช่น 'F' จะคืนเป็น char) */
  sensors?: Record<string, number | string>;
  /**
   * เซนเซอร์ที่อ่านได้ทีละค่าตามลำดับ เช่น { readVent: [72, 85, 64] }: เรียกครั้งแรกได้ 72 ครั้งถัดไปได้ 85 …
   * เรียกเกินจำนวนค่าที่มี = อ่านเกิน (ตัดสินว่าไม่ผ่าน)
   */
  feeds?: Record<string, number[]>;
  /** ชั้นวางในฉากที่แสดงช่องของอาร์เรย์ชื่อ name: ไฮไลต์ช่องที่โค้ดอ่าน/เขียน และเตือนเมื่ออ่านเกินช่อง */
  shelf?: { name: string; size: number; values?: number[] };
  /** คลังรหัส: tryCode(n) คืน 0 = ถูก, 1 = มากไป, -1 = น้อยไป · ลองได้ไม่เกิน tries ครั้ง */
  vault?: { secret: number; tries: number };
  /**
   * โหมดขับด้วยมอเตอร์ (องก์ 5): เปิดคำสั่ง setMotor(ซ้าย, ขวา) ค่า -255 ถึง 255 และ readDistance() (ซม.)
   * รถเคลื่อนที่ระหว่าง delay: ความเร็ว 150 ทั้งสองล้อ = 1 ช่องต่อ 500 ms · setMotor(150, -150) = หมุนขวา 90° ใน 300 ms
   * cm = ความกว้างของ 1 ช่องเป็นเซนติเมตร (ปกติ 80) · noise = ค่าที่บวกเข้ากับ readDistance() แต่ละครั้ง ตามลำดับ
   */
  drive?: { cm?: number; noise?: number[] };
  /** หน้าตาของฉาก: ไม่ใส่ = ในยาน, 'planet' = ซากสถานีบนดาวเวฬา */
  theme?: 'planet';
  /** ค่าที่ readNumber() จะได้ ตามลำดับ */
  inputs?: number[];
  /** จำนวนเคลธที่รออยู่หลังประตู (ไม่ใส่ = ค่า scanAliens) */
  aliens?: number;
  /** จำนวนเคลธที่เป็นเป้ายิง ยืนที่ 'A' เรียงจากซ้าย (ตำแหน่ง 1, 2, 3 …) */
  targets?: number;
  /** โล่ของหัวหน้าเคลธ: ต้องยิงกี่นัดจึงแตก (readShield() อ่านค่าที่เหลือ) */
  shield?: number;
  /** ตำแหน่ง (เริ่มที่ 1) ของลูกเรือที่ถูกจับ ห้ามยิงโดน */
  hostage?: number;
  /** ตารางแผงพลังงานสำหรับ powerCell(แถว, ช่อง): origin = ช่องบนซ้ายในแผนที่ */
  grid?: { rows: number; cols: number; origin: [number, number] };
  /**
   * ยานกู้ชีพ (แสดงเป็นภาพจำลองลอยที่ 'G'): clamps = จำนวนแขนยึดที่ต้องปลด (unlockClamp แล้ว releaseClamp)
   * chute = ช่วงความสูง [ต่ำสุด, สูงสุด] ของ readAltitude() ที่กางร่มได้โดยไม่ขาด
   */
  pod?: { clamps?: number; chute?: [number, number] };
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
  /** เคลธเป้ายิงต้องเหลือกี่ตัว (ปกติ 0) และห้ามยิงเกิน */
  targetsLeft?: number;
  /** ต้องเปิดแผงพลังงานครบทุกช่อง ช่องละครั้ง */
  gridFull?: boolean;
  /** แขนยึดยานต้องเหลือกี่ตัว (ปกติ 0) */
  clampsLeft?: number;
  /** การจุดเครื่องยนต์แต่ละครั้ง นานกี่วินาที ตามลำดับ (engineOn → delay → engineOff) */
  burns?: number[];
  /** โหมดขับ: จบโปรแกรมแล้วมอเตอร์ต้องหยุด */
  stopped?: boolean;
  /** โหมดขับ: ต้องผ่านธง 'F' ครบทุกจุด */
  flags?: boolean;
  /** โหมดขับ: ตอนจบ ระยะจากหน้ารถถึงสิ่งกีดขวางต้องอยู่ในช่วง [ต่ำสุด, สูงสุด] ซม. */
  frontCm?: [number, number];
  /** คลังรหัสต้องเปิดได้ (tryCode ถูกภายในจำนวนครั้งที่กำหนด) */
  vaultOpen?: boolean;
  /** คำสั่งต้องถูกเรียกกี่ครั้งพอดี */
  calledTimes?: Record<string, number>;
}

/** กรณีทดสอบ: ค่าเซนเซอร์/ค่าที่รับเข้ามาต่างกัน เป้าหมายต่างกัน */
export interface Case {
  label: string;
  /** แผนที่ของกรณีนี้ (ไม่ใส่ = แผนที่ของด่าน) */
  map?: string[];
  dir?: Dir;
  sensors?: Record<string, number | string>;
  inputs?: number[];
  feeds?: Record<string, number[]>;
  vault?: { secret: number; tries: number };
  aliens?: number;
  targets?: number;
  shield?: number;
  hostage?: number;
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

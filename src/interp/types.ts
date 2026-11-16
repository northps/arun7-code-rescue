// ชนิดข้อมูลกลางของตัวแปลภาษา

export type VType = 'int' | 'long' | 'ulong' | 'byte' | 'float' | 'bool' | 'char' | 'String' | 'void';

export interface Val {
  t: VType;
  v: number | string | boolean;
}

/** ข้อความแจ้งปัญหา: en = แบบคอมไพเลอร์จริง, th = คำอธิบายสำหรับผู้เรียน */
export interface Diag {
  kind: string;
  line: number;
  en?: string;
  th: string;
}

export class CompileError extends Error {
  constructor(public diag: Diag) {
    super(diag.en ?? diag.th);
  }
}

export type HostValue = number | string | boolean;

export interface HostFn {
  min: number;
  max: number;
  ret?: VType;
}

export interface WorldEvent {
  type: string;
  [key: string]: unknown;
}

export interface HostCtx {
  line: number;
  emit(ev: WorldEvent): void;
  warn(kind: string, th: string): void;
}

/** สิ่งที่โลกเกมต้องมีให้ตัวแปลภาษาเรียก */
export interface Host {
  fns: Record<string, HostFn>;
  call(name: string, args: HostValue[], ctx: HostCtx): HostValue | void;
  /** มีค่าเมื่อโลกเกมสั่งให้หยุดรัน (เช่น บิตพัง) */
  halted?: string | null;
  /** เรียกทุกครั้งที่โปรแกรมสั่ง delay(ms): ให้โลกเกมเดินเวลา (เช่น รถวิ่งต่อ) */
  onDelay?(ms: number, ctx: HostCtx): void;
  /** ค่าที่ผู้เล่น "พิมพ์" เข้ามาทาง Serial (ใช้กับ readNumber) */
  inputs?: number[];
}

export interface VarView {
  name: string;
  type: string;
  text: string;
  global: boolean;
}

export interface Step {
  line: number;
  events: WorldEvent[];
  out: string;
  wait: number;
  vars: VarView[];
}

export interface RunResult {
  compileError?: Diag;
  runtimeError?: Diag;
  warnings: Diag[];
  trace: Step[];
  serial: string;
  loopsRun: number;
  calls: string[];
}

export interface RunOptions {
  /** จำนวนรอบของ loop() หลัง setup() */
  loops?: number;
  maxSteps?: number;
}

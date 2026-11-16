// ประกอบโค้ดจากสถานะของโจทย์ → รันทุกกรณี → ตัดสินว่าผ่านเป้าหมายไหม
import { Diag, RunResult, runProgram } from '../interp';
import { Case, Goal, Level, Puzzle, WorldSpec } from './types';
import { parseMap, sameValue, showValue, WorldSim } from './world';

export type PuzzleState =
  | { kind: 'blank'; slots: (string | null)[] }
  | { kind: 'order'; order: number[] }
  | { kind: 'fix'; picks: Record<number, number> }
  | { kind: 'type'; text: string };

/** สลับแบบคงที่ (ไม่สุ่ม) ให้ทุกครั้งที่เปิดข้อเดิมได้ลำดับเดิม */
function scramble(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return a;
  const r = [...a.slice(Math.ceil(n / 2)), ...a.slice(0, Math.ceil(n / 2))].reverse();
  return r.every((v, i) => v === i) ? r.reverse() : r;
}

export function slotCount(code: string): number {
  return (code.match(/\{\{\d+\}\}/g) ?? []).length;
}

export function initialState(p: Puzzle): PuzzleState {
  switch (p.kind) {
    case 'blank':
      return { kind: 'blank', slots: Array(slotCount(p.code)).fill(null) };
    case 'order':
      return { kind: 'order', order: initialOrder(p) };
    case 'fix':
      return { kind: 'fix', picks: {} };
    case 'type':
      return { kind: 'type', text: p.starter };
  }
}

export function solutionState(p: Puzzle): PuzzleState {
  switch (p.kind) {
    case 'blank':
      return { kind: 'blank', slots: [...p.answer] };
    case 'order':
      return { kind: 'order', order: p.lines.map((_, i) => i) };
    case 'fix': {
      const picks: Record<number, number> = {};
      for (const [ln, f] of Object.entries(p.fixes)) picks[Number(ln)] = f.answer;
      return { kind: 'fix', picks };
    }
    case 'type':
      return { kind: 'type', text: p.solution };
  }
}

/** โค้ดตั้งต้นของโหมดพิมพ์เอง: โจทย์ทุกชนิดกลายเป็นข้อความให้แก้ */
export function typedStarter(p: Puzzle): string {
  switch (p.kind) {
    case 'blank':
      return p.code.replace(/\{\{\d+\}\}/g, '___');
    case 'order':
      return [p.head, ...initialOrder(p).map((i) => p.lines[i]), p.tail].join('\n');
    case 'fix':
      return p.code;
    case 'type':
      return p.starter;
  }
}

function initialOrder(p: Extract<Puzzle, { kind: 'order' }>): number[] {
  return p.start ? [...p.start] : scramble(p.lines.length);
}

export function buildCode(p: Puzzle, s: PuzzleState): string {
  if (s.kind === 'type') return s.text;
  if (p.kind === 'blank' && s.kind === 'blank') {
    return p.code.replace(/\{\{(\d+)\}\}/g, (_, i) => s.slots[Number(i)] ?? '');
  }
  if (p.kind === 'order' && s.kind === 'order') {
    return [p.head, ...s.order.map((i) => p.lines[i]), p.tail].join('\n');
  }
  if (p.kind === 'fix' && s.kind === 'fix') {
    return p.code
      .split('\n')
      .map((line, i) => {
        const f = p.fixes[i + 1];
        if (!f) return line;
        const indent = /^\s*/.exec(line)![0];
        return indent + f.options[s.picks[i + 1] ?? 0];
      })
      .join('\n');
  }
  return '';
}

export function isComplete(p: Puzzle, s: PuzzleState): boolean {
  return !(p.kind === 'blank' && s.kind === 'blank' && s.slots.some((x) => x === null));
}

export interface CaseRun {
  index: number;
  label: string;
  spec: WorldSpec;
  goal: Goal;
  result: RunResult;
  reasons: string[];
  pass: boolean;
  /** เกิดเหตุร้ายในฉาก (ถูกบุก / ชน) — เลือกแสดงกรณีนี้ก่อน */
  drama?: boolean;
}

export interface Verdict {
  status: 'compile' | 'fail' | 'pass';
  compileError?: Diag;
  /** กรณีที่นำมาแสดงภาพ (กรณีแรกที่พลาด หรือกรณีแรก) */
  shown: CaseRun;
  cases: CaseRun[];
  warnings: Diag[];
  code: string;
}

export function specFor(level: Level, p: Puzzle, c?: Case): WorldSpec {
  const base: WorldSpec = { ...level.world, ...(p.world ?? {}) };
  if (!c) return base;
  return {
    ...base,
    sensors: { ...(base.sensors ?? {}), ...(c.sensors ?? {}) },
    inputs: c.inputs ?? base.inputs,
    aliens: c.aliens ?? (c.sensors?.scanAliens !== undefined ? c.sensors.scanAliens : base.aliens),
  };
}

function stripComments(code: string): string {
  return code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function judge(goal: Goal, sim: WorldSim, res: RunResult): string[] {
  const out: string[] = [];
  if (res.runtimeError) out.push(res.runtimeError.th);
  if (sim.bumped) out.push('บิตเดินชนสิ่งกีดขวาง โปรแกรมจึงหยุด ลองนับช่องและทิศที่หันอีกครั้ง');
  if (sim.caught) out.push('ประตูเปิดทั้งที่มีเคลธรออยู่ข้างหลัง! พวกมันบุกเข้ามาแล้ว');
  if (goal.at) {
    const ok = goal.at === 'pad' ? sim.onPad() : sim.bot.x === goal.at[0] && sim.bot.y === goal.at[1];
    if (!ok && !sim.bumped) out.push(goal.at === 'pad' ? 'บิตยังไปไม่ถึงแผ่นเหยียบสีเขียว' : 'บิตยังไปไม่ถึงจุดหมาย');
  }
  if (goal.door && sim.door !== goal.door && !sim.caught && !sim.bumped) {
    const want = { open: 'ต้องเปิด', closed: 'ต้องปิดอยู่ (ไม่ต้องล็อก)', locked: 'ต้องถูกล็อก' }[goal.door];
    const got = { open: 'เปิดอยู่', closed: 'ยังปิดอยู่', locked: 'ถูกล็อก' }[sim.door];
    out.push(`ประตู${want} แต่ตอนนี้${got}`);
  }
  if (goal.serial !== undefined) {
    const a = res.serial.replace(/\s+$/g, '');
    const b = goal.serial.replace(/\s+$/g, '');
    if (a !== b) {
      out.push(
        a === ''
          ? 'ยังไม่มีข้อความออกไปทาง Serial เลย'
          : `ข้อความที่ส่งออกไปไม่ตรง\nต้องได้:\n${b}\nแต่ได้:\n${a}`,
      );
    }
  }
  for (const [pin, want] of Object.entries(goal.pins ?? {})) {
    const got = sim.pinVal[Number(pin)] ?? 0;
    if (got !== want) out.push(want ? `อุปกรณ์ที่ขา ${pin} ยังไม่ทำงาน (ต้องสั่งให้เป็น HIGH)` : `อุปกรณ์ที่ขา ${pin} ต้องดับอยู่ในกรณีนี้ แต่ถูกเปิด`);
  }
  for (const [name, want] of Object.entries(goal.set ?? {})) {
    const got = sim.lastArgs[name];
    if (!got) out.push(`ยังไม่ได้เรียก ${name}()`);
    else if (!(got.length === want.length && want.every((w, i) => sameValue(got[i], w)))) {
      out.push(`ค่าที่ส่งให้ ${name}() ต้องเป็น ${want.map(showValue).join(', ')} แต่ได้ ${got.map(showValue).join(', ')}`);
    }
  }
  for (const name of goal.called ?? []) if (!res.calls.includes(name)) out.push(`ต้องเรียก ${name}()`);
  for (const name of goal.notCalled ?? []) if (res.calls.includes(name)) out.push(`กรณีนี้ต้องไม่เรียก ${name}()`);
  if (goal.minDelay) {
    const total = res.trace.reduce((s, t) => s + t.wait, 0);
    if (total < goal.minDelay) out.push(`ต้องรออย่างน้อย ${goal.minDelay} มิลลิวินาที ด้วย delay(${goal.minDelay});`);
  }
  return out;
}

export function runPuzzle(level: Level, p: Puzzle, code: string): Verdict {
  const cases: Case[] = p.cases?.length ? p.cases : [{ label: '' }];
  const runs: CaseRun[] = [];
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    const spec = specFor(level, p, c);
    const goal: Goal = { ...p.goal, ...(c.goal ?? {}) };
    const sim = new WorldSim(spec, goal);
    const result = runProgram(code, sim, { loops: spec.loops ?? 1 });
    if (result.compileError) {
      const run: CaseRun = { index: i, label: c.label, spec, goal, result, reasons: [], pass: false };
      return { status: 'compile', compileError: result.compileError, shown: run, cases: [run], warnings: [], code };
    }
    const reasons = judge(goal, sim, result);
    runs.push({ index: i, label: c.label, spec, goal, result, reasons, pass: reasons.length === 0, drama: sim.caught || sim.bumped });
  }
  const firstFail = runs.find((r) => !r.pass && r.drama) ?? runs.find((r) => !r.pass);
  const shown = firstFail ?? runs[0];
  // สิ่งที่ต้องมีในโค้ด
  if (!firstFail && p.require) {
    const clean = stripComments(code);
    const miss = p.require.filter((r) => !new RegExp(r.re).test(clean)).map((r) => r.msg);
    if (miss.length) {
      const run: CaseRun = { ...shown, reasons: miss, pass: false };
      return { status: 'fail', shown: run, cases: runs, warnings: shown.result.warnings, code };
    }
  }
  return { status: firstFail ? 'fail' : 'pass', shown, cases: runs, warnings: shown.result.warnings, code };
}

/** ตรวจข้อมูลด่านตอนพัฒนา: คืนรายการปัญหา (ว่าง = ดี) */
export function validateLevel(level: Level): string[] {
  const out: string[] = [];
  for (const p of level.puzzles) {
    const spec = specFor(level, p);
    const m = parseMap(spec.map);
    if (m.find('B').length !== 1) out.push(`${p.id}: แผนที่ต้องมี B หนึ่งตัว`);
    if (p.kind === 'blank' && slotCount(p.code) !== p.answer.length) out.push(`${p.id}: จำนวนช่องไม่ตรงกับ answer`);
    if (p.kind === 'blank') for (const a of p.answer) if (!p.bank.includes(a)) out.push(`${p.id}: "${a}" ไม่อยู่ใน bank`);
    if (p.kind === 'fix') {
      const lines = p.code.split('\n');
      for (const [ln, f] of Object.entries(p.fixes)) {
        const line = lines[Number(ln) - 1];
        if (line === undefined || line.trim() !== f.options[0].trim()) out.push(`${p.id}: บรรทัด ${ln} ไม่ตรงกับตัวเลือกแรก`);
      }
    }
  }
  return out;
}

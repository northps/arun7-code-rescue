// รันคำตอบของทุกโจทย์ผ่านตัวตัดสินตัวเดียวกับในเกม: คำตอบต้องผ่าน โค้ดตั้งต้นต้องไม่ผ่าน
import { describe, expect, test } from 'vitest';
import { buildCode, initialState, isComplete, runPuzzle, solutionState, validateLevel } from '../src/game/judge';
import { ACTS, LEVELS } from '../src/game/levels';

describe('ข้อมูลด่าน', () => {
  test('id ไม่ซ้ำ และทุกด่านมีโจทย์ 2–3 ข้อ', () => {
    const ids = LEVELS.flatMap((l) => l.puzzles.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of LEVELS) {
      expect(l.puzzles.length).toBeGreaterThanOrEqual(2);
      expect(l.puzzles.length).toBeLessThanOrEqual(3);
      expect(l.lesson.blocks.length).toBeGreaterThan(0);
    }
  });
  test('มีครบ 7 องก์ และองก์ 1 มีอย่างน้อย 8 ด่าน', () => {
    expect(ACTS.length).toBe(7);
    expect(LEVELS.filter((l) => l.act === 1).length).toBeGreaterThanOrEqual(8);
  });
  test.each(LEVELS.map((l) => [l.id, l] as const))('ด่าน %s ข้อมูลถูกรูปแบบ', (_id, level) => {
    expect(validateLevel(level)).toEqual([]);
  });
});

for (const level of LEVELS) {
  describe(`ด่าน ${level.id} ${level.title}`, () => {
    for (const p of level.puzzles) {
      test(`${p.id} คำตอบผ่าน`, () => {
        const code = buildCode(p, solutionState(p));
        const v = runPuzzle(level, p, code);
        const why = v.compileError ? `${v.compileError.en} @${v.compileError.line}` : v.shown.reasons.join(' | ');
        expect(`${v.status} ${why}`.trim()).toBe('pass');
      });
      test(`${p.id} โค้ดตั้งต้นยังไม่ผ่าน`, () => {
        const s = initialState(p);
        if (!isComplete(p, s)) return; // ข้อเติมช่องว่าง: ยังรันไม่ได้จนกว่าจะเติมครบ
        const v = runPuzzle(level, p, buildCode(p, s));
        expect(v.status).not.toBe('pass');
      });
      test(`${p.id} มีคำใบ้และภารกิจ`, () => {
        expect(p.hints.length).toBeGreaterThan(0);
        expect(p.mission.length).toBeGreaterThan(10);
      });
    }
  });
}

describe('ผลของโค้ดที่ผิดแบบที่พบบ่อย', () => {
  const find = (id: string) => {
    for (const l of LEVELS) for (const p of l.puzzles) if (p.id === id) return { l, p };
    throw new Error(id);
  };
  test('1-1-b ขาด ; ได้ error แบบคอมไพเลอร์', () => {
    const { l, p } = find('1-1-b');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('compile');
    expect(v.compileError?.kind).toBe('missingSemi');
    expect(v.compileError?.line).toBe(3);
  });
  test('1-1-a ลำดับผิด บิตชนผนัง', () => {
    const { l, p } = find('1-1-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'order', order: [2, 0, 1, 3, 4] }));
    expect(v.status).toBe('fail');
    expect(v.shown.result.trace.some((s) => s.events.some((e) => e.type === 'bump'))).toBe(true);
  });
  test('1-2-b ใช้ println ทุกช่อง ข้อความแตกเป็น 3 บรรทัด', () => {
    const { l, p } = find('1-2-b');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['println', 'println', 'println'] }));
    expect(v.status).toBe('fail');
  });
  test('1-4-a ใช้ int กับ 1.5 ค่าถูกตัดเหลือ 1 และมีข้อสังเกต', () => {
    const { l, p } = find('1-4-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['int', 'bool', 'char'] }));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('truncate');
  });
  test('1-4-b int 40000 ล้น', () => {
    const { l, p } = find('1-4-b');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 3: 1 } }));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('overflow');
  });
  test('1-5-a ลืม OUTPUT ไฟไม่ติด', () => {
    const { l, p } = find('1-5-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['const', '13', 'INPUT', 'LAMP_PIN'] }));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('noPinMode');
  });
  test('1-6-a คำตอบตายตัวไม่ผ่านกรณีที่สอง', () => {
    const { l, p } = find('1-6-a');
    const v = runPuzzle(l, p, 'void setup() {\n  setPower(75);\n}\nvoid loop() {\n}');
    expect(v.status).toBe('fail');
    expect(v.shown.index).toBe(1);
  });
  test('1-8-a ใช้ != เปิดประตูตอนมีเคลธ ถูกบุก', () => {
    const { l, p } = find('1-8-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['!='] }));
    expect(v.status).toBe('fail');
    expect(v.cases.some((c) => c.result.trace.some((s) => s.events.some((e) => e.type === 'rush')))).toBe(true);
  });
  test('1-8-a ใช้ = ตัวเดียว ได้ข้อสังเกต assignInCond', () => {
    const { l, p } = find('1-8-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['='] }));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('assignInCond');
  });
  test('1-9-b สลับลำดับเงื่อนไขแล้วพลาด', () => {
    const { l, p } = find('1-9-b');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['d < 40', 'd < 20'] }));
    expect(v.status).toBe('fail');
  });
  test('1-3-c ใส่คำตอบตรง ๆ โดยไม่ใช้ตัวแปร ไม่ผ่าน', () => {
    const { l, p } = find('1-3-c');
    const v = runPuzzle(l, p, 'void setup() {\n  enterCode(1750);\n}\nvoid loop() {\n}');
    expect(v.status).toBe('fail');
  });
});

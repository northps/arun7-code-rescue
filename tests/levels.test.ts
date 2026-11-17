// รันคำตอบของทุกโจทย์ผ่านตัวตัดสินตัวเดียวกับในเกม: คำตอบต้องผ่าน โค้ดตั้งต้นต้องไม่ผ่าน
import { describe, expect, test } from 'vitest';
import { buildCode, initialState, isComplete, runPuzzle, solutionState, validateLevel } from '../src/game/judge';
import { ACTS, LEVELS } from '../src/game/levels';
import { EVENT_SOUNDS, sfx } from '../src/ui/sound';
import { splitBeats } from '../src/ui/cutscene';

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

describe('องก์ 3: ผลของโค้ดที่ผิด', () => {
  const find = (id: string) => {
    for (const l of LEVELS) for (const p of l.puzzles) if (p.id === id) return { l, p };
    throw new Error(id);
  };
  const events = (v: ReturnType<typeof runPuzzle>, type: string) =>
    v.cases.flatMap((c) => c.result.trace.flatMap((s) => s.events.filter((e) => e.type === type)));
  test('3-1-a releaseClamp without unlock jams', () => {
    const { l, p } = find('3-1-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['void', '()', 'releaseClamp'] }));
    expect(v.status).toBe('fail');
    expect(events(v, 'clamp').some((e) => e.step === 'jam')).toBe(true);
  });
  test('3-1-b wrong case is a compile error with a suggestion, then missing () leaves a clamp', () => {
    const { l, p } = find('3-1-b');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('compile');
    expect(v.compileError?.kind).toBe('notDeclared');
    expect(v.compileError?.line).toBe(7);
    expect(v.compileError?.en).toContain('freeClamp');
    const v2 = runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 7: 1 } }));
    expect(v2.status).toBe('fail');
    expect(v2.warnings.map((w) => w.kind)).toContain('callNoParens');
    expect(v2.shown.reasons.join(' ')).toContain('1');
  });
  test('3-2-b too few, then too many arguments', () => {
    const { l, p } = find('3-2-b');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('compile');
    expect(v.compileError?.kind).toBe('tooFew');
    expect(v.compileError?.line).toBe(8);
    const v2 = runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 8: 1 } }));
    expect(v2.status).toBe('compile');
    expect(v2.compileError?.kind).toBe('tooMany');
  });
  test('3-2-c engine left on is reported', () => {
    const { l, p } = find('3-2-c');
    const v = runPuzzle(l, p, 'void burn(int sec) {\n  engineOn();\n  delay(sec * 1000);\n}\nvoid setup() {\n  burn(2);\n  burn(1);\n  burn(3);\n}\nvoid loop() {\n}');
    expect(v.status).toBe('fail');
    expect(v.shown.reasons.join(' ')).toContain('engineOff');
  });
  test('3-3-b printing instead of return warns missingReturn', () => {
    const { l, p } = find('3-3-b');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('missingReturn');
    const v2 = runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 3: 1 } }));
    expect(v2.status).toBe('fail');
  });
  test('3-3-c answering without a function is refused', () => {
    const { l, p } = find('3-3-c');
    const v = runPuzzle(l, p, 'void setup() {\n  int left = readHeatLeft();\n  int right = readHeatRight();\n  if (left > right) { setShield(left); } else { setShield(right); }\n}\nvoid loop() {\n}');
    expect(v.status).toBe('fail');
  });
  test('3-4-a using || tears the chute at 5000 m', () => {
    const { l, p } = find('3-4-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['bool', '||'] }));
    expect(v.status).toBe('fail');
    expect(events(v, 'chute').some((e) => e.ok === false)).toBe(true);
    expect(v.shown.label).toContain('5000');
  });
  test('3-4-b braking when already slow fails', () => {
    const { l, p } = find('3-4-b');
    const v = runPuzzle(l, p, 'bool isSlow(int v) {\n  return v < 20;\n}\nvoid setup() {\n  int v = readSpeed();\n  if (!isSlow(v)) {\n    engineOn();\n    delay(2000);\n    engineOff();\n  }\n}\nvoid loop() {\n}');
    expect(v.status).toBe('fail');
    expect(v.shown.label).toContain('20');
  });
  test('3-5-a local counter prints 1 every round; shadowing still fails; const is a compile error', () => {
    const { l, p } = find('3-5-a');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('fail');
    expect(v.shown.result.serial.trim().split(/\s+/)).toEqual(['1', '1', '1', '1']);
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 1: 1 } })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 1: 2, 7: 1 } })).status).toBe('compile');
  });
  test('3-5-b variable from setup is not visible in loop', () => {
    const { l, p } = find('3-5-b');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('compile');
    expect(v.compileError?.kind).toBe('notDeclared');
    expect(v.compileError?.line).toBe(8);
  });
  test('3-5-c landing on every round from 3 onward fails', () => {
    const { l, p } = find('3-5-c');
    const v = runPuzzle(l, p, 'int n = 0;\nvoid land() {\n  beginDescent();\n  extendLegs();\n}\nvoid setup() {\n  Serial.begin(9600);\n}\nvoid loop() {\n  n++;\n  Serial.println(n);\n  if (n >= 3) {\n    land();\n  }\n}');
    expect(v.status).toBe('fail');
  });
});

describe('องก์ 4: ผลของโค้ดที่ผิด', () => {
  const find = (id: string) => {
    for (const l of LEVELS) for (const p of l.puzzles) if (p.id === id) return { l, p };
    throw new Error(id);
  };
  const events = (v: ReturnType<typeof runPuzzle>, type: string) =>
    v.cases.flatMap((c) => c.result.trace.flatMap((s) => s.events.filter((e) => e.type === type)));
  const wrap = (body: string, top = '') => `${top}\nvoid setup() {\n${body}\n}\nvoid loop() {\n}`;

  test('4-1-a last slot as [5] reads past the end', () => {
    const { l, p } = find('4-1-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['5', '1', '5'] }));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('arrayRange');
    expect(events(v, 'arr').some((e) => e.ok === false && e.idx === 5)).toBe(true);
  });
  test('4-1-b counting from 1: starter fails, every single fix alone still fails', () => {
    const { l, p } = find('4-1-b');
    expect(runPuzzle(l, p, buildCode(p, initialState(p))).status).toBe('fail');
    for (const ln of [5, 6, 7, 8]) {
      const picks: Record<number, number> = { 5: 1, 6: 1, 7: 1, 8: 1 };
      picks[ln] = 0;
      expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks })).status).toBe('fail');
    }
  });
  test('4-1-c printing the answers without an array is refused', () => {
    const { l, p } = find('4-1-c');
    const v = runPuzzle(l, p, wrap('  Serial.begin(9600);\n  Serial.println(45);\n  sendWeight(30);'));
    expect(v.status).toBe('fail');
  });
  test('4-2-a i <= 5 reads slot 5, starting at 1 skips slot 0', () => {
    const { l, p } = find('4-2-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['0', '<=', 'i'] }));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('arrayRange');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['1', '<', 'i'] })).status).toBe('fail');
  });
  test('4-2-b each fix alone is not enough', () => {
    const { l, p } = find('4-2-b');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 6: 1 } })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 7: 1 } })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 6: 2, 7: 1 } })).status).toBe('fail');
  });
  test('4-2-c reading the sensor 7 times is reported', () => {
    const { l, p } = find('4-2-c');
    const v = runPuzzle(l, p, wrap('  Serial.begin(9600);\n  int total = 0;\n  for (int i = 0; i <= 6; i++) {\n    panel[i] = readPanel();\n    total += panel[i];\n  }\n  for (int i = 5; i >= 0; i--) {\n    Serial.println(panel[i]);\n  }\n  setPower(total);', 'int panel[6];'));
    expect(v.status).toBe('fail');
    expect(v.shown.reasons.join(' ')).toContain('readPanel');
  });
  test('4-3-a using < finds the coldest', () => {
    const { l, p } = find('4-3-a');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['0', '<', 't[i]'] })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['0', '>', 'i'] })).status).toBe('fail');
  });
  test('4-3-b best = 0 fails only on the all-negative night', () => {
    const { l, p } = find('4-3-b');
    const v = runPuzzle(l, p, wrap('  for (int i = 0; i < 5; i++) {\n    t[i] = readVent();\n  }\n  int best = 0;\n  int bestIndex = 0;\n  for (int i = 0; i < 5; i++) {\n    if (t[i] > best) {\n      best = t[i];\n      bestIndex = i;\n    }\n  }\n  markVent(bestIndex);', 'int t[5];'));
    expect(v.status).toBe('fail');
    expect(v.cases.filter((c) => !c.pass).map((c) => c.index)).toEqual([1]);
  });
  test('4-3-c integer division loses the decimals', () => {
    const { l, p } = find('4-3-c');
    const v = runPuzzle(l, p, wrap('  int total = 0;\n  for (int i = 0; i < 5; i++) {\n    t[i] = readVent();\n    total += t[i];\n  }\n  float avg = total / 5;\n  setCoolant(avg);', 'int t[5];'));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('intDivFloat');
  });
  test('4-4-a int(id) instead of String(id) fails; size() is not a String method', () => {
    const { l, p } = find('4-4-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['length', 'charAt', 'int'] }));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('strPlusNum');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['size', 'charAt', 'String'] })).status).not.toBe('pass');
  });
  test('4-4-b starter warns about charAt range and string + number', () => {
    const { l, p } = find('4-4-b');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toEqual(expect.arrayContaining(['strRange', 'strPlusNum']));
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 6: 2, 7: 1 } })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 6: 1, 7: 2 } })).status).toBe('fail');
  });
  test('4-4-c a fixed answer fails on the other signals', () => {
    const { l, p } = find('4-4-c');
    const v = runPuzzle(l, p, wrap('  String sig = readSignal();\n  int n = sig.length();\n  warn("HUNTERS:3");'));
    expect(v.status).toBe('fail');
    expect(v.shown.index).toBe(1);
  });
  test('4-5-a counting down locks the vault', () => {
    const { l, p } = find('4-5-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['!=', 'guess--'] }));
    expect(v.status).toBe('fail');
    expect(v.shown.reasons.join(' ')).toContain('10');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['==', 'guess++'] })).status).toBe('fail');
  });
  test('4-5-b swapping hi and lo locks the vault; linear search runs out of tries', () => {
    const { l, p } = find('4-5-b');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['2', 'lo', 'hi'] })).status).toBe('fail');
    const v = runPuzzle(l, p, wrap('  int g = 1;\n  while (tryCode(g) != 0) {\n    g++;\n  }'));
    expect(v.status).toBe('fail');
    expect(events(v, 'vault').length).toBeGreaterThan(0);
  });
  test('4-5-c binary search never needs more than 10 tries for 1..1000', () => {
    const { l, p } = find('4-5-c');
    const v = runPuzzle(l, p, p.kind === 'type' ? p.solution : '');
    expect(v.status).toBe('pass');
    for (const c of v.cases) expect(c.result.trace.flatMap((s) => s.events).filter((e) => e.type === 'vault').length).toBeLessThanOrEqual(10);
  });
  test('4-6-a any two of the three fixes still fail', () => {
    const { l, p } = find('4-6-a');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toEqual(expect.arrayContaining(['arrayRange', 'assignInCond']));
    for (const ln of [9, 10, 15]) {
      const picks: Record<number, number> = { 9: 1, 10: 1, 15: 1 };
      picks[ln] = 0;
      expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks })).status).toBe('fail');
    }
  });
  test('4-6-b int total overflows only on the high set', () => {
    const { l, p } = find('4-6-b');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 7: 1 } }));
    expect(v.status).toBe('fail');
    expect(v.cases.map((c) => c.pass)).toEqual([false, true]);
    expect(v.cases[0].result.warnings.map((w) => w.kind)).toContain('overflow');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 3: 1 } })).status).toBe('fail');
  });
  test('4-6-c starter is a compile error on line 9, then the logic bugs fail', () => {
    const { l, p } = find('4-6-c');
    if (p.kind !== 'type') throw new Error('kind');
    const v = runPuzzle(l, p, p.starter);
    expect(v.status).toBe('compile');
    expect(v.compileError?.kind).toBe('missingSemi');
    expect(v.compileError?.line).toBe(9);
    const semi = p.starter.replace('int worstIndex = 0\n', 'int worstIndex = 0;\n');
    const v2 = runPuzzle(l, p, semi);
    expect(v2.status).toBe('fail');
    expect(v2.warnings.map((w) => w.kind)).toContain('arrayRange');
    expect(runPuzzle(l, p, semi.replace('i <= 5', 'i < 5')).status).toBe('fail');
  });
});

describe('องก์ 5: ผลของโค้ดที่ผิด', () => {
  const find = (id: string) => {
    for (const l of LEVELS) for (const p of l.puzzles) if (p.id === id) return { l, p };
    throw new Error(id);
  };
  const events = (v: ReturnType<typeof runPuzzle>, type: string) =>
    v.cases.flatMap((c) => c.result.trace.flatMap((s) => s.events.filter((e) => e.type === type)));
  const sol = (id: string) => {
    const { l, p } = find(id);
    return { l, p, code: buildCode(p, solutionState(p)) };
  };

  test('5-1-a full speed overshoots and crashes; one wheel only misses the pad; no stop is reported', () => {
    const { l, p } = find('5-1-a');
    const fast = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['255', '255', '0'] }));
    expect(fast.status).toBe('fail');
    expect(events(fast, 'crash').length).toBe(1);
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['150', '0', '0'] })).status).toBe('fail');
    const on = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['150', '150', '150'] }));
    expect(on.status).toBe('fail');
    expect(on.shown.reasons.join(' ')).toContain('setMotor(0, 0)');
  });
  test('5-1-b starter spins in place; missing () is warned', () => {
    const { l, p } = find('5-1-b');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('callNoParens');
    for (const ln of [2, 6, 12]) {
      const picks: Record<number, number> = { 2: 1, 6: 1, 12: 1 };
      picks[ln] = 0;
      expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks })).status).not.toBe('pass');
    }
  });
  test('5-1-c raw setMotor without own functions is refused', () => {
    const { l, p } = find('5-1-c');
    const v = runPuzzle(l, p, 'void setup() {\n  setMotor(150, 150);\n  delay(1500);\n  setMotor(-150, -150);\n  delay(1000);\n  setMotor(0, 0);\n}\nvoid loop() {\n}');
    expect(v.status).toBe('fail');
    expect(v.shown.reasons.join(' ')).toContain('forward');
  });
  test('5-2-a turning for 1000 ms or the wrong way fails', () => {
    const { l, p } = find('5-2-a');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['-150', '1000'] })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['150', 'TURN_MS'] })).status).toBe('fail');
  });
  test('5-2-b each fix alone still fails', () => {
    const { l, p } = find('5-2-b');
    expect(runPuzzle(l, p, buildCode(p, initialState(p))).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 1: 1 } })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 12: 1 } })).status).toBe('fail');
  });
  test('5-3-a every wrong order fails', () => {
    const { l, p } = find('5-3-a');
    for (const order of [[2, 1, 0], [1, 0, 2], [0, 2, 1], [2, 0, 1], [1, 2, 0]]) {
      expect(runPuzzle(l, p, buildCode(p, { kind: 'order', order })).status).toBe('fail');
    }
  });
  test('5-3-b square loop on the rectangle misses flags; unrolled code without a loop is refused', () => {
    const { l, p, code } = sol('5-3-b');
    const sq = runPuzzle(l, p, code.replace('delay(2000);', 'delay(1000);'));
    expect(sq.status).toBe('fail');
    const flat = code.replace(/for \(int i = 0; i < 2; i\+\+\) \{([\s\S]*?)\n  \}/, (_m, body) => body + body);
    expect(flat).not.toMatch(/for/);
    const v = runPuzzle(l, p, flat);
    expect(v.status).toBe('fail');
    expect(v.cases[0].pass).toBe(true);
  });
  test('5-4-a println for the number breaks the line', () => {
    const { l, p } = find('5-4-a');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['readDistance', 'println', 'println'] })).status).toBe('fail');
  });
  test('5-4-b each fix alone gives a wrong average', () => {
    const { l, p } = find('5-4-b');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 5: 1 } })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 8: 1 } })).status).toBe('fail');
  });
  test('5-4-c a single noisy reading is not the average', () => {
    const { l, p } = find('5-4-c');
    const v = runPuzzle(l, p, 'int readAverage() {\n  return readDistance();\n}\nvoid setup() {\n  Serial.begin(9600);\n  int d = readAverage();\n  Serial.println(d);\n  if (d < 100) {\n    Serial.println("NEAR");\n  } else {\n    Serial.println("FAR");\n  }\n}\nvoid loop() {\n}');
    expect(v.status).toBe('fail');
  });
  test('5-5-a wrong comparison never moves; swapped actions never move either', () => {
    const { l, p } = find('5-5-a');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['>', 'stopCar', 'forward'] }));
    expect(v.status).toBe('fail');
    expect(v.shown.reasons.join(' ')).toContain('ไกลเกินไป');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['<', 'forward', 'stopCar'] })).status).toBe('fail');
  });
  test('5-5-b long delay crashes; tiny DANGER_CM stops too late', () => {
    const { l, p } = find('5-5-b');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('fail');
    expect(events(v, 'crash').length).toBeGreaterThan(0);
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 1: 1 } })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 21: 1 } })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 1: 1, 21: 2 } })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 1: 2, 21: 1 } })).status).toBe('fail');
  });
  test('5-5-c a timed run without the sensor fails on the other corridors', () => {
    const { l, p, code } = sol('5-5-c');
    const timed = code.replace(/void setup\(\) \{\n\}/, 'void setup() {\n  forward();\n  delay(1450);\n  stopCar();\n}').replace(/void loop\(\) \{[\s\S]*$/, 'void loop() {\n}');
    expect(runPuzzle(l, p, timed).status).toBe('fail');
  });
  test('5-6 both caves are solved, and each needs both a left and a right choice', () => {
    const { l, p, code } = sol('5-6-b');
    const v = runPuzzle(l, p, code);
    expect(v.status).toBe('pass');
    for (const c of v.cases) expect(c.result.loopsRun).toBeLessThan(60);
  });
  test('5-6-a wrong comparison or wrong turn fails', () => {
    const { l, p } = find('5-6-a');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['<', 'turnLeft', 'turnLeft'] })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['>', 'turnLeft', 'turnRight'] })).status).toBe('fail');
    // หมุนขวา 2 ครั้งก็หันไปทางซ้ายได้เหมือนกัน (180 องศา) จึงนับว่าถูก
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['>', 'turnRight', 'turnRight'] })).status).toBe('pass');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['>', 'forward', 'forward'] })).status).toBe('fail');
  });
  test('5-6-b always turning right fails in one of the caves', () => {
    const { l, p, code } = sol('5-6-b');
    const v = runPuzzle(l, p, code.replace(/    if \(left > right\) \{\n      turnLeft\(\);\n      turnLeft\(\);\n    \}\n/, ''));
    expect(v.status).toBe('fail');
  });
});

describe('องก์ 6: ผลของโค้ดที่ผิด', () => {
  const find = (id: string) => {
    for (const l of LEVELS) for (const p of l.puzzles) if (p.id === id) return { l, p };
    throw new Error(id);
  };
  const events = (v: ReturnType<typeof runPuzzle>, type: string) =>
    v.cases.flatMap((c) => c.result.trace.flatMap((s) => s.events.filter((e) => e.type === type)));
  const sol = (id: string) => {
    const { l, p } = find(id);
    return { l, p, code: buildCode(p, solutionState(p)) };
  };
  /** แก้ครบทุกบรรทัดยกเว้นบรรทัดเดียว ต้องยังไม่ผ่าน */
  const eachBugMatters = (id: string) => {
    const { l, p } = find(id);
    if (p.kind !== 'fix') throw new Error(id);
    for (const skip of Object.keys(p.fixes)) {
      const picks: Record<number, number> = {};
      for (const [ln, f] of Object.entries(p.fixes)) picks[Number(ln)] = ln === skip ? 0 : f.answer;
      expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks })).status, `${id} line ${skip}`).not.toBe('pass');
    }
  };

  test('6-1-a wrong mode is refused', () => {
    const { l, p } = find('6-1-a');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['enum', 'State', 'TURN'] })).status).toBe('fail');
  });
  test('6-1-b starter does not compile; every bug matters', () => {
    const { l, p } = find('6-1-b');
    expect(runPuzzle(l, p, buildCode(p, initialState(p))).status).toBe('compile');
    eachBugMatters('6-1-b');
  });
  test('6-2-b every bug matters (reversed assignment, missing break, wrong next state)', () => {
    eachBugMatters('6-2-b');
  });
  test('6-2-c a SCAN that never leaves its state fails', () => {
    const { l, p, code } = sol('6-2-c');
    const v = runPuzzle(l, p, code.replace('goTo(TURN);', ''));
    expect(v.status).toBe('fail');
  });
  test('6-3-a comparing against the wrong constant fails', () => {
    const { l, p } = find('6-3-a');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['millis', 'millis', 'stateStart', 'DANGER_CM'] })).status).toBe('fail');
  });
  test('6-3-b starter stalls the coolant pump; every bug matters; millis() without the subtraction fails', () => {
    const { l, p } = find('6-3-b');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('fail');
    expect(events(v, 'overheat').length).toBe(1);
    expect(v.shown.reasons.join(' ')).toContain('pumpCoolant');
    eachBugMatters('6-3-b');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'fix', picks: { 18: 1, 37: 2 } })).status).toBe('fail');
  });
  test('6-3-c a blocking delay stalls the pump', () => {
    const { l, p, code } = sol('6-3-c');
    const bad = code.replace('if (millis() - stateStart >= BACKUP_MS) {\n        goTo(TURN);\n      }', 'delay(BACKUP_MS);\n      goTo(TURN);');
    expect(bad).not.toBe(code);
    const v = runPuzzle(l, p, bad);
    expect(v.status).toBe('fail');
    expect(events(v, 'overheat').length).toBeGreaterThan(0);
  });
  test('6-4-a lowercase command or a default that keeps driving fails', () => {
    const { l, p } = find('6-4-a');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['available', 'read', "'f'", 'stopCar'] })).status).toBe('fail');
    const on = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['available', 'read', "'F'", 'forward'] }));
    expect(on.status).toBe('fail');
    expect(events(on, 'crash').length).toBeGreaterThan(0);
  });
  test('6-4-b starter warns that Serial was never begun; every bug matters', () => {
    const { l, p } = find('6-4-b');
    const v = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(v.status).toBe('fail');
    expect(v.warnings.map((w) => w.kind)).toContain('noSerialBeginRead');
    eachBugMatters('6-4-b');
  });
  test('6-4-c a timed script without Serial.read is refused', () => {
    const { l, p, code } = sol('6-4-c');
    const head = code.slice(0, code.indexOf('char current'));
    const v = runPuzzle(l, p, head + 'void setup() {\n  forward();\n  delay(1000);\n  spinRight();\n  delay(300);\n  forward();\n  delay(1000);\n  spinLeft();\n  delay(300);\n  forward();\n  delay(500);\n  stopCar();\n}\nvoid loop() {\n}');
    expect(v.status).toBe('fail');
  });
  test('6-5-a || never moves; no bumper crashes into the rock', () => {
    const { l, p } = find('6-5-a');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['||', '<', "'S'"] })).status).toBe('fail');
    const v = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['&&', '>', "'S'"] }));
    expect(v.status).toBe('fail');
  });
  test('6-5-b starter drives off the cliff; each layer is needed', () => {
    const { l, p, code } = sol('6-5-b');
    const start = runPuzzle(l, p, buildCode(p, initialState(p)));
    expect(start.status).toBe('fail');
    expect(events(start, 'fall').length).toBe(1);
    expect(start.cases[0].reasons.join(' ')).toContain('เหว');
    const noBumper = code.replace("if (current == 'F' && readDistance() < SAFE_CM) {\n    current = 'S';\n  }", '');
    expect(noBumper).not.toBe(code);
    const nb = runPuzzle(l, p, noBumper);
    expect(nb.status).toBe('fail');
    expect(events(nb, 'crash').length).toBe(1);
    const noStamp = code.replace('lastCmd = millis();', '');
    expect(runPuzzle(l, p, noStamp).status).toBe('fail');
  });
  test('enum variables show their name; enum constants stay out of the variable bar', () => {
    const { l, p, code } = sol('6-1-a');
    const tr = runPuzzle(l, p, code).shown.result.trace;
    const vars = tr[tr.length - 1].vars;
    expect(vars.find((x) => x.name === 'state')).toMatchObject({ type: 'State', text: 'SCAN' });
    expect(vars.find((x) => x.name === 'CRUISE')).toBeUndefined();
  });
  test('millis() in drive mode only advances with delay', () => {
    const { l, p } = find('6-3-a');
    const v = runPuzzle(l, p, 'void setup() {\n  Serial.begin(9600);\n  int a = 1;\n  a = a + 1;\n  Serial.println(millis());\n  delay(120);\n  Serial.println(millis());\n}\nvoid loop() {\n}');
    expect(v.shown.result.serial).toBe('0\n120\n');
  });
});

describe('องก์ 7: ผลของโค้ดที่ผิด และคำตอบแบบอื่น', () => {
  const find = (id: string) => {
    for (const l of LEVELS) for (const p of l.puzzles) if (p.id === id) return { l, p };
    throw new Error(id);
  };
  const events = (v: ReturnType<typeof runPuzzle>, type: string) =>
    v.cases.flatMap((c) => c.result.trace.flatMap((s) => s.events.filter((e) => e.type === type)));
  const sol = (id: string) => {
    const { l, p } = find(id);
    return { l, p, code: buildCode(p, solutionState(p)) };
  };
  const swap = (code: string, a: string, b: string) => {
    expect(code).toContain(a);
    return code.replace(a, b);
  };

  test('7-1-a wrong comparison or if instead of while stops too far', () => {
    const { l, p } = find('7-1-a');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['while', '<', 'stopCar'] })).status).toBe('fail');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['if', '>', 'stopCar'] })).status).toBe('fail');
  });
  test('7-1-b fast only misses the mark; slow only is too slow', () => {
    const { l, p, code } = sol('7-1-b');
    const head = code.slice(0, code.indexOf('void dock()'));
    const tail = '\nvoid setup() {\n  dock();\n}\nvoid loop() {\n}';
    const fast = runPuzzle(l, p, head + 'void dock() {\n  while (readDistance() > STOP_CM) {\n    cruise();\n    delay(50);\n  }\n  stopCar();\n}' + tail);
    expect(fast.status).toBe('fail');
    const slow = runPuzzle(l, p, head + 'void dock() {\n  while (readDistance() > STOP_CM) {\n    creep();\n    delay(50);\n  }\n  stopCar();\n}' + tail);
    expect(slow.status).toBe('fail');
    expect(slow.shown.reasons.join(' ')).toContain('ช้าเกินไป');
  });
  test('7-2-a short loop or reversed test gives the wrong sequence', () => {
    const { l, p } = find('7-2-a');
    const short = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['4', 'i', '<', 'i'] }));
    expect(short.status).toBe('fail');
    expect(short.shown.reasons.join(' ')).toContain('ลำดับของ startSystem()');
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['5', 'i', '>', 'i'] })).status).toBe('fail');
  });
  test('7-2-b ignoring the priority order fails', () => {
    const { l, p, code } = sol('7-2-b');
    expect(runPuzzle(l, p, swap(code, 'int id = order[i];', 'int id = i;')).status).toBe('fail');
  });
  test('7-3-a driving into a Kleth crashes; never leaving FIGHT fails', () => {
    const { l, p } = find('7-3-a');
    const ram = runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['seeKleth', 'CRUISE', 'fire', 'CRUISE'] }));
    expect(ram.status).toBe('fail');
    expect(events(ram, 'crash').length).toBeGreaterThan(0);
    expect(runPuzzle(l, p, buildCode(p, { kind: 'blank', slots: ['seeKleth', 'FIGHT', 'fire', 'FIGHT'] })).status).toBe('fail');
  });
  test('7-3-b firing every loop wastes shots; checking distance before the Kleth fails', () => {
    const { l, p, code } = sol('7-3-b');
    const spray = runPuzzle(l, p, swap(code, '      forward();\n', '      forward();\n      fire();\n'));
    expect(spray.status).toBe('fail');
    expect(spray.shown.reasons.join(' ')).toContain('ยิงพลาด');
    const order = code
      .replace('} else if (seeKleth()) {\n        goTo(FIGHT);\n      } else if (readDistance() < DANGER_CM) {\n        goTo(TURN);', '} else if (readDistance() < DANGER_CM) {\n        goTo(TURN);\n      } else if (seeKleth()) {\n        goTo(FIGHT);');
    expect(order).not.toBe(code);
    expect(runPuzzle(l, p, order).status).toBe('fail'); // เคลธที่ยืนติดมุมถูกมองเป็นผนัง บิตจึงเลี้ยวหนี
  });
  test('7-4-a summing every rune gives the wrong code', () => {
    const { l, p, code } = sol('7-4-a');
    const v = runPuzzle(l, p, swap(code, 'if (r > 0) {', 'if (r != 0) {'));
    expect(v.status).toBe('fail');
    expect(v.shown.reasons.join(' ')).toContain('closePortal()');
  });
  test('7-4-b other designs pass too: plain if / else with a blocking turn, and a separate SEND state', () => {
    const { l, p, code } = sol('7-4-b');
    const head = code.slice(0, code.indexOf('enum State'));
    const fn = code.slice(code.indexOf('int portalCode()'), code.indexOf('void setup()'));
    const plain = head + fn + 'void turnRight() {\n  setMotor(150, -150);\n  delay(TURN_MS);\n  stopCar();\n}\nvoid setup() {\n}\nvoid loop() {\n  if (atPad()) {\n    stopCar();\n    closePortal(portalCode());\n  } else if (seeKleth()) {\n    stopCar();\n    fire();\n  } else if (readDistance() < DANGER_CM) {\n    stopCar();\n    turnRight();\n  } else {\n    forward();\n  }\n  delay(50);\n}';
    const a = runPuzzle(l, p, plain);
    expect(`${a.status} ${a.shown.reasons.join('|')}`).toBe('pass ');
    const two = code
      .replace('enum State { CRUISE, FIGHT, TURN, PARK };', 'enum State { CRUISE, FIGHT, TURN, PARK, SEND };')
      .replace('      stopCar();\n      closePortal(portalCode());\n      break;', '      stopCar();\n      goTo(SEND);\n      break;\n    case SEND:\n      closePortal(portalCode());\n      break;');
    expect(two).not.toBe(code);
    const b = runPuzzle(l, p, two);
    expect(`${b.status} ${b.shown.reasons.join('|')}`).toBe('pass ');
  });
  test('7-4-b reaching the console without the code, or with a Kleth left, fails', () => {
    const { l, p, code } = sol('7-4-b');
    expect(runPuzzle(l, p, swap(code, 'closePortal(portalCode());', 'closePortal(49);')).status).toBe('fail');
    expect(runPuzzle(l, p, swap(code, '        fire();', '        delay(1);')).status).toBe('fail');
  });
});

describe('เสียงของเหตุการณ์ในฉาก', () => {
  test('ทุกเหตุการณ์ที่เกิดจากคำตอบและโค้ดตั้งต้นของทุกโจทย์ มีเสียงกำหนดไว้ (หรือตั้งใจให้เงียบ)', () => {
    const seen = new Set<string>();
    for (const l of LEVELS) for (const p of l.puzzles) {
      for (const st of [solutionState(p), initialState(p)]) {
        if (!isComplete(p, st)) continue;
        const v = runPuzzle(l, p, buildCode(p, st));
        for (const c of v.cases) for (const s of c.result.trace) for (const e of s.events) seen.add(e.type);
      }
    }
    expect(seen.size).toBeGreaterThan(20);
    expect([...seen].filter((t) => !(t in EVENT_SOUNDS))).toEqual([]);
  });
  test('เล่นเสียงในที่ที่ไม่มี WebAudio แล้วไม่พัง', () => {
    for (const type of Object.keys(EVENT_SOUNDS)) expect(() => sfx.event({ type })).not.toThrow();
    expect(() => sfx.finale()).not.toThrow();
  });
});

describe('ฉากเล่าเรื่อง: ตัดเนื้อเรื่องเป็นจังหวะ', () => {
  const squash = (s: string) => s.replace(/["\s—:：]/g, '');
  test('ไม่มีตัวอักษรของเนื้อเรื่องหายไปหรือเพิ่มมา ในทุกด่าน', () => {
    for (const l of LEVELS) for (const text of [l.story, l.outro ?? '']) {
      const beats = splitBeats(text);
      const joined = beats.map((b) => (b.kind === 'card' ? '' : b.text)).join('');
      expect(squash(joined), l.id).toBe(squash(text));
      for (const b of beats) if (b.kind !== 'card') expect(b.text.length, l.id).toBeGreaterThan(0);
    }
  });
  test('คำพูดของมาลีและเสียงประกาศถูกแยกออกมาพร้อมชื่อผู้พูด', () => {
    const find = (id: string) => LEVELS.find((l) => l.id === id)!;
    const first = splitBeats(find('1-1').story);
    expect(first.find((b) => b.kind === 'say')).toMatchObject({ who: 'ระบบยาน' });
    const end6 = splitBeats(find('6-5').outro!);
    const say = end6.filter((b) => b.kind === 'say');
    expect(say[say.length - 1]).toMatchObject({ who: 'มาลี' });
    expect(end6[end6.length - 1]).toEqual({ kind: 'end', text: 'จบองก์ 6' });
    const last = splitBeats(find('7-4').outro!);
    expect(last[last.length - 1]).toEqual({ kind: 'end', text: 'จบ' });
    expect(last.some((b) => b.kind === 'narr' && b.text.includes('Serial.println("กลับบ้านกัน");'))).toBe(true);
  });
  test('ไม่มีจังหวะบรรยายที่ยาวเกิน 200 ตัวอักษร และทุกด่านมีอย่างน้อย 2 จังหวะ', () => {
    for (const l of LEVELS) {
      const beats = splitBeats(l.story);
      expect(beats.length, l.id).toBeGreaterThanOrEqual(2);
      for (const b of beats) if (b.kind === 'narr') expect(b.text.length, l.id).toBeLessThanOrEqual(200);
    }
  });
});

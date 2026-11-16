// ทดสอบตัวแปลภาษา: ใช้ตัวอย่างจากคู่มือไวยากรณ์ (handbook.md) และแบบฝึก (drills.md) เป็นข้อสอบ
import { describe, expect, test } from 'vitest';
import { Host, HostValue, nullHost, runProgram } from '../src/interp';

/** รันโค้ดที่วางใน setup() แล้วคืนข้อความที่พิมพ์ออก Serial */
function out(body: string, pre = '', inputs: number[] = []): string {
  const src = `${pre}\nvoid setup() {\n  Serial.begin(9600);\n${body}\n}\nvoid loop() {\n}\n`;
  const r = runProgram(src, nullHost(inputs));
  if (r.compileError) throw new Error(`compile: ${r.compileError.en} @${r.compileError.line}`);
  if (r.runtimeError) throw new Error(`runtime: ${r.runtimeError.kind}`);
  return r.serial;
}
const sketch = (src: string, host: Host = nullHost(), loops = 1) => runProgram(src, host, { loops });
const errOf = (src: string) => sketch(src).compileError;

describe('โครงสร้างและ Serial (หัวข้อ 1–2)', () => {
  test('print กับ println', () => {
    expect(out('Serial.print("Score: ");\nSerial.println(95);\nSerial.println();')).toBe('Score: 95\n\n');
  });
  test('setup ครั้งเดียว loop ทำซ้ำ', () => {
    const r = sketch('void setup() { Serial.begin(9600); Serial.println("A"); }\nvoid loop() { Serial.println("B"); }', nullHost(), 3);
    expect(r.serial).toBe('A\nB\nB\nB\n');
    expect(r.loopsRun).toBe(3);
  });
  test('คอมเมนต์ถูกข้าม', () => {
    expect(out('// ไทยได้\n/* หลาย\nบรรทัด */ Serial.println(1); // ท้ายบรรทัด')).toBe('1\n');
  });
  test('ลืม Serial.begin ไม่มีอะไรออก และมีข้อสังเกต', () => {
    const r = sketch('void setup() { Serial.println("x"); }\nvoid loop() {}');
    expect(r.serial).toBe('');
    expect(r.warnings.map((w) => w.kind)).toContain('noSerialBegin');
  });
  test('trace บอกบรรทัดที่ทำตามลำดับ', () => {
    const r = sketch('void setup() {\n  Serial.begin(9600);\n  Serial.println(1);\n  Serial.println(2);\n}\nvoid loop() {\n}');
    expect(r.trace.map((s) => s.line)).toEqual([2, 3, 4]);
    expect(r.trace[1].out).toBe('1\n');
  });
});

describe('ตัวแปรและชนิดข้อมูล (หัวข้อ 3–4)', () => {
  test('ประกาศ เปลี่ยนค่า ใช้ค่าเดิม', () => {
    expect(out('int score = 10;\nscore = 25;\nscore = score + 5;\nSerial.println(score);')).toBe('30\n');
  });
  test('int ตัดทศนิยมทิ้ง ไม่ปัด', () => {
    expect(out('int x = 7.9;\nSerial.println(x);')).toBe('7\n');
    expect(out('int c = 9.99;\nSerial.println(c);')).toBe('9\n');
  });
  test('int ล้นที่ 32767 เหมือน UNO', () => {
    const r = sketch('void setup() { Serial.begin(9600); int big = 32767; big = big + 1; Serial.println(big); }\nvoid loop() {}');
    expect(r.serial).toBe('-32768\n');
    expect(r.warnings.map((w) => w.kind)).toContain('overflow');
  });
  test('long เก็บค่าใหญ่ได้', () => {
    expect(out('long big = 32767;\nbig = big + 1;\nSerial.println(big);')).toBe('32768\n');
    expect(out('long steps = 100000;\nSerial.println(steps * 2);')).toBe('200000\n');
  });
  test('float bool char String', () => {
    expect(out('float t = 36.5;\nbool ok = true;\nchar g = \'A\';\nString n = "Ploy";\nSerial.println(t);\nSerial.println(ok);\nSerial.println(g);\nSerial.println(n);')).toBe(
      '36.50\n1\nA\nPloy\n',
    );
  });
  test('byte 0–255', () => {
    expect(out('byte pwm = 200;\npwm = pwm + 100;\nSerial.println(pwm);')).toBe('44\n');
  });
  test('const และ #define', () => {
    expect(out('Serial.println(DANGER_CM + LED_PIN);', 'const int DANGER_CM = 25;\n#define LED_PIN 13')).toBe('38\n');
  });
  test('ค่าตัวแปรใน trace', () => {
    const r = sketch('void setup() {\n  int a = 5;\n  a = a * 2;\n}\nvoid loop() {}');
    expect(r.trace[0].vars).toEqual([{ name: 'a', type: 'int', text: '5', global: false }]);
    expect(r.trace[1].vars[0].text).toBe('10');
  });
});

describe('ตัวดำเนินการ (หัวข้อ 5, แบบฝึกชุด B)', () => {
  const cases: [string, string][] = [
    ['int x = 7 / 2; Serial.println(x);', '3'],
    ['Serial.println(17 % 5);', '2'],
    ['float y = 7 / 2; Serial.println(y);', '3.00'],
    ['float z = 7.0 / 2; Serial.println(z);', '3.50'],
    ['int a = 5; a += 3; a *= 2; Serial.println(a);', '16'],
    ['int b = 10; b++; b++; b--; Serial.println(b);', '11'],
    ['Serial.println(2 + 3 * 4);', '14'],
    ['Serial.println((2 + 3) * 4);', '20'],
    ['Serial.println(10 / 4 * 4);', '8'],
    ['Serial.println(7 % 2);', '1'],
    ['int x = 20; x /= 2; x -= 3; Serial.println(x);', '7'],
    ['int t = 5; int c = 2; Serial.println((float)t / c);', '2.50'],
    ['Serial.println(3725 / 3600); Serial.println(3725 % 3600 / 60); Serial.println(3725 % 60);', '1\n2\n5'],
    ['Serial.println(5 == 5); Serial.println(5 != 5); Serial.println(17 >= 15);', '1\n0\n1'],
    ['int age = 15; Serial.println(age >= 13 && age <= 19); Serial.println(age == 6 || age == 7); Serial.println(!false);', '1\n0\n1'],
    ['Serial.println(-7 / 2); Serial.println(-3 + 5);', '-3\n2'],
  ];
  test.each(cases)('%s', (code, want) => {
    expect(out(code).trim()).toBe(want);
  });
  test('หารจำนวนเต็มแล้วเก็บลง float มีข้อสังเกต', () => {
    const r = sketch('void setup() { int total = 5; int count = 2; float avg = total / count; }\nvoid loop() {}');
    expect(r.warnings.map((w) => w.kind)).toContain('intDivFloat');
  });
  test('หารด้วยศูนย์มีข้อสังเกต ไม่พัง', () => {
    const r = sketch('void setup() { int a = 5; int b = 0; int c = a / b; }\nvoid loop() {}');
    expect(r.runtimeError).toBeUndefined();
    expect(r.warnings.map((w) => w.kind)).toContain('divZero');
  });
  test('&& || หยุดเมื่อรู้คำตอบแล้ว', () => {
    expect(out('int n = 0;\nif (n != 0 && 10 / n > 1) { Serial.println("a"); } else { Serial.println("b"); }')).toBe('b\n');
  });
});

describe('รับค่า (หัวข้อ 6)', () => {
  const readNumber = `long readNumber() {
  while (Serial.available() == 0) { }
  long n = Serial.parseInt();
  while (Serial.available() > 0) Serial.read();
  return n;
}`;
  test('readNumber ของเกม', () => {
    expect(out('long a = readNumber();\nlong b = readNumber();\nSerial.println(a + b);', '', [12, 30])).toBe('42\n');
  });
  test('readNumber ที่เขียนเองตามคู่มือ', () => {
    expect(out('long a = readNumber();\nlong b = readNumber();\nSerial.println(a * b);', readNumber, [6, 7])).toBe('42\n');
  });
  test('ไม่มีค่าเข้ามาแล้ว', () => {
    const r = sketch('void setup() { long a = readNumber(); long b = readNumber(); }\nvoid loop() {}', nullHost([1]));
    expect(r.runtimeError?.kind).toBe('noInput');
  });
});

describe('เงื่อนไข (หัวข้อ 7–8, แบบฝึกชุด C)', () => {
  const grade = (d: number) =>
    out(`int d = ${d};\nif (d < 20) {\n  Serial.println("STOP");\n} else if (d < 40) {\n  Serial.println("SLOW");\n} else {\n  Serial.println("GO");\n}`).trim();
  test('if / else if / else', () => {
    expect(grade(15)).toBe('STOP');
    expect(grade(35)).toBe('SLOW');
    expect(grade(20)).toBe('SLOW');
    expect(grade(100)).toBe('GO');
  });
  test('if สองอันแยกกันทำได้ทั้งคู่', () => {
    expect(out('int d = 10;\nif (d < 20) { Serial.println("STOP"); }\nif (d < 40) { Serial.println("SLOW"); } else { Serial.println("GO"); }')).toBe('STOP\nSLOW\n');
  });
  test('if (x = 5) จริงเสมอ และมีข้อสังเกต', () => {
    const r = sketch('void setup() { Serial.begin(9600); int x = 1; if (x = 5) { Serial.println("yes"); } Serial.println(x); }\nvoid loop() {}');
    expect(r.serial).toBe('yes\n5\n');
    expect(r.warnings.map((w) => w.kind)).toContain('assignInCond');
  });
  test('if (x = 0) เท็จเสมอ', () => {
    expect(out('int x = 3;\nif (x = 0) { Serial.println("yes"); }\nSerial.println(x);')).toBe('0\n');
  });
  test('if (...); ทำของในปีกกาทุกครั้ง', () => {
    const r = sketch('void setup() { Serial.begin(9600); int x = 1; if (x > 5); { Serial.println("always"); } }\nvoid loop() {}');
    expect(r.serial).toBe('always\n');
    expect(r.warnings.map((w) => w.kind)).toContain('emptyBody');
  });
  test('ไม่มี { } ทำตามเงื่อนไขแค่บรรทัดแรก', () => {
    expect(out('int x = 1;\nif (x > 5)\n  Serial.println("a");\n  Serial.println("b");')).toBe('b\n');
  });
  test('switch กับ char', () => {
    expect(out(`char cmd = 'L';\nswitch (cmd) {\n  case 'F': Serial.println("Forward"); break;\n  case 'L': Serial.println("Left"); break;\n  default: Serial.println("Stop"); break;\n}`)).toBe('Left\n');
  });
  test('switch ลืม break ไหลไป case ถัดไป (แบบฝึก C5)', () => {
    expect(out(`int n = 2;\nswitch (n) {\n  case 1: Serial.println("one");\n  case 2: Serial.println("two");\n  case 3: Serial.println("three"); break;\n  default: Serial.println("other");\n}`)).toBe('two\nthree\n');
  });
  test('switch default', () => {
    expect(out('int n = 9;\nswitch (n) { case 1: Serial.println("one"); break; default: Serial.println("other"); break; }')).toBe('other\n');
  });
});

describe('ลูป (หัวข้อ 9, แบบฝึกชุด D)', () => {
  const cases: [string, string][] = [
    ['for (int i = 0; i < 4; i++) Serial.print(i);', '0123'],
    ['for (int i = 5; i > 0; i -= 2) Serial.print(i);', '531'],
    ['for (int i = 1; i <= 10; i++) { if (i % 3 == 0) Serial.print(i); }', '369'],
    ['int s = 0; for (int i = 1; i <= 4; i++) s += i; Serial.print(s);', '10'],
    ['int k = 1; while (k < 50) k *= 3; Serial.print(k);', '81'],
    ['for (int i = 1; i <= 6; i++) { if (i == 4) break; Serial.print(i); }', '123'],
    ['for (int i = 1; i <= 10; i++) { if (i == 3) continue; if (i == 6) break; Serial.print(i); }', '1245'],
    ['int money = 100; while (money >= 30) { money = money - 30; Serial.print(money); Serial.print(" "); }', '70 40 10 '],
    ['int n = 0; do { n++; } while (n < 3); Serial.print(n);', '3'],
    ['int n = 9; do { n++; } while (n < 3); Serial.print(n);', '10'],
    ['for (int i = 0; i <= 10; i += 2) Serial.print(i);', '0246810'],
  ];
  test.each(cases)('%s', (code, want) => {
    expect(out(code)).toBe(want);
  });
  test('ลูปซ้อนลูป', () => {
    expect(out('for (int row = 1; row <= 3; row++) {\n  for (int col = 1; col <= row; col++) {\n    Serial.print("*");\n  }\n  Serial.println();\n}')).toBe('*\n**\n***\n');
  });
  test('ลูปไม่รู้จบถูกจับและอธิบาย', () => {
    const r = sketch('void setup() {\n  int i = 0;\n  while (i < 5) {\n    Serial.println(i);\n  }\n}\nvoid loop() {}');
    expect(r.runtimeError?.kind).toBe('infinite');
    expect(r.runtimeError?.th).toContain('ไม่รู้จบ');
  });
  test('while (true) { } ว่างก็ถูกจับ', () => {
    expect(sketch('void setup() { while (true) { } }\nvoid loop() {}').runtimeError?.kind).toBe('infinite');
  });
  test('for (...); มีข้อสังเกต', () => {
    const r = sketch('void setup() { for (int i = 0; i < 3; i++); { } }\nvoid loop() {}');
    expect(r.warnings.map((w) => w.kind)).toContain('emptyBody');
  });
});

describe('ฟังก์ชันและขอบเขต (หัวข้อ 10–11, แบบฝึกชุด E)', () => {
  test('return และเรียกซ้อน', () => {
    const pre = 'int triple(int x) {\n  return x * 3;\n}';
    expect(out('Serial.println(triple(4));\nSerial.println(triple(triple(2)));', pre)).toBe('12\n18\n');
  });
  test('return ออกจากฟังก์ชันทันที', () => {
    const pre = 'int biggest(int a, int b) {\n  if (a > b) {\n    return a;\n  }\n  return b;\n}';
    expect(out('Serial.println(biggest(3, 9));\nSerial.println(biggest(8, 2));', pre)).toBe('9\n8\n');
  });
  test('ฟังก์ชัน bool และ void', () => {
    const pre = 'bool isEven(int n) { return n % 2 == 0; }\nvoid hello() { Serial.println("hi"); }';
    expect(out('if (isEven(4)) { hello(); }\nif (isEven(5)) { hello(); }', pre)).toBe('hi\n');
  });
  test('เรียกฟังก์ชันที่ประกาศทีหลังได้ (เหมือน Arduino IDE)', () => {
    const r = sketch('void setup() { Serial.begin(9600); Serial.println(twice(4)); }\nvoid loop() {}\nint twice(int n) { return n * 2; }');
    expect(r.serial).toBe('8\n');
  });
  test('global สะสม local เริ่มใหม่ทุกรอบ', () => {
    const r = sketch(
      'int counter = 0;\nvoid setup() { Serial.begin(9600); }\nvoid loop() {\n  int temp = 5;\n  counter++;\n  temp++;\n  Serial.print(counter);\n  Serial.print(temp);\n}',
      nullHost(),
      3,
    );
    expect(r.serial).toBe('162636');
  });
  test('ลืม () มีข้อสังเกต', () => {
    const r = sketch('void beep() { }\nvoid setup() { beep; }\nvoid loop() {}');
    expect(r.warnings.map((w) => w.kind)).toContain('callNoParens');
  });
  test('ฟังก์ชัน int ลืม return มีข้อสังเกต', () => {
    const r = sketch('int f() { }\nvoid setup() { int x = f(); }\nvoid loop() {}');
    expect(r.warnings.map((w) => w.kind)).toContain('missingReturn');
  });
  test('เรียกตัวเอง (factorial)', () => {
    expect(out('Serial.println(fact(5));', 'long fact(int n) { if (n <= 1) { return 1; } return n * fact(n - 1); }')).toBe('120\n');
  });
});

describe('อาร์เรย์และข้อความ (หัวข้อ 12–13)', () => {
  test('index เริ่มที่ 0 และแก้ค่าได้', () => {
    expect(out('int scores[5] = {72, 85, 64, 90, 58};\nSerial.println(scores[0]);\nSerial.println(scores[4]);\nscores[2] = 70;\nSerial.println(scores[2]);')).toBe('72\n58\n70\n');
  });
  test('ผลรวมและค่าเฉลี่ย', () => {
    expect(out('int scores[5] = {72, 85, 64, 90, 58};\nlong total = 0;\nfor (int i = 0; i < 5; i++) {\n  total += scores[i];\n}\nSerial.println((float)total / 5);')).toBe('73.80\n');
  });
  test('อ่านเกินช่องมีข้อสังเกต', () => {
    const r = sketch('void setup() { int a[5] = {3, 8, 1, 9, 4}; int x = a[5]; }\nvoid loop() {}');
    expect(r.warnings.map((w) => w.kind)).toContain('arrayRange');
  });
  test('ส่งอาร์เรย์เข้าฟังก์ชัน', () => {
    expect(out('int a[3] = {4, 5, 6};\nSerial.println(sum(a, 3));', 'int sum(int v[], int n) { int s = 0; for (int i = 0; i < n; i++) { s += v[i]; } return s; }')).toBe('15\n');
  });
  test('String', () => {
    expect(out('String name = "Ploy";\nString msg = "Hi " + name;\nSerial.println(msg);\nSerial.println(name.length());\nString s = "Score: " + String(95);\nSerial.println(s);\nSerial.println(name.charAt(0));\nSerial.println(name == "Ploy");')).toBe(
      'Hi Ploy\n4\nScore: 95\nP\n1\n',
    );
  });
  test('toUpperCase และ toInt', () => {
    expect(out('String a = "go";\na.toUpperCase();\nSerial.println(a);\nString n = "42";\nSerial.println(n.toInt() + 1);')).toBe('GO\n43\n');
  });
});

describe('คำสั่ง Arduino (หัวข้อ 14)', () => {
  test('คณิตศาสตร์', () => {
    expect(out('Serial.println(abs(-5));\nSerial.println(max(3, 9));\nSerial.println(min(3, 9));\nSerial.println(constrain(300, 0, 255));\nSerial.println(map(50, 0, 100, 0, 255));\nSerial.println(sqrt(16));')).toBe(
      '5\n9\n3\n255\n127\n4.00\n',
    );
  });
  test('random อยู่ในช่วง', () => {
    const v = Number(out('Serial.println(random(1, 7));'));
    expect(v).toBeGreaterThanOrEqual(1);
    expect(v).toBeLessThan(7);
  });
  test('delay เดินเวลา millis', () => {
    expect(Number(out('unsigned long t = millis();\ndelay(1000);\nSerial.println(millis() - t >= 1000);'))).toBe(1);
  });
  test('enum + switch + state machine', () => {
    const r = sketch(
      'enum State { CRUISE, BACKUP };\nState state = CRUISE;\nvoid setup() { Serial.begin(9600); }\nvoid loop() {\n  switch (state) {\n    case CRUISE: Serial.print("C"); state = BACKUP; break;\n    case BACKUP: Serial.print("B"); state = CRUISE; break;\n  }\n}',
      nullHost(),
      4,
    );
    expect(r.serial).toBe('CBCB');
  });
});

describe('คำสั่งของโลกเกม', () => {
  test('เรียก host ส่งค่าและรับค่ากลับ', () => {
    const log: string[] = [];
    const host: Host = {
      fns: { forward: { min: 0, max: 0 }, readDistance: { min: 0, max: 0, ret: 'int' }, setAirlock: { min: 3, max: 3 } },
      call(name: string, args: HostValue[], ctx) {
        log.push(name + '(' + args.map((a) => JSON.stringify(a)).join(',') + ')');
        ctx.emit({ type: name });
        if (name === 'readDistance') return 18;
      },
      halted: null,
    };
    const r = sketch("void setup() {\n  int d = readDistance();\n  if (d < 20) { forward(); }\n  setAirlock(1.5, true, 'B');\n}\nvoid loop() {}", host);
    expect(log).toEqual(['readDistance()', 'forward()', 'setAirlock(1.5,true,"B")']);
    expect(r.calls).toEqual(['readDistance', 'forward', 'setAirlock']);
    expect(r.trace[0].events).toEqual([{ type: 'readDistance' }]);
  });
  test('host สั่งหยุด', () => {
    const host: Host = {
      fns: { forward: { min: 0, max: 0 } },
      call() {
        host.halted = 'crash';
      },
      halted: null,
    };
    const r = sketch('void setup() { forward(); forward(); forward(); }\nvoid loop() {}', host);
    expect(r.calls.length).toBe(1);
  });
});

describe('error แบบคอมไพเลอร์ (หัวข้อ 15, แบบฝึกชุด A และ F)', () => {
  const wrap = (body: string) => `void setup() {\n${body}\n}\nvoid loop() {\n}`;
  test('ขาด ; ชี้บรรทัดที่ลืม', () => {
    const e = errOf(wrap('  delay(1000)\n  delay(5);'));
    expect(e?.kind).toBe('missingSemi');
    expect(e?.line).toBe(2);
    expect(e?.en).toBe("expected ';' before 'delay'");
  });
  test('ตัวพิมพ์เล็ก-ใหญ่ผิด มีคำแนะนำ', () => {
    const e = errOf(wrap('  digitalwrite(13, HIGH);'));
    expect(e?.kind).toBe('notDeclared');
    expect(e?.en).toContain("did you mean 'digitalWrite'");
  });
  test('ข้อความไม่ปิด', () => {
    expect(errOf(wrap('  Serial.println("Hello);'))?.kind).toBe('unterminatedString');
  });
  test('ชื่อขึ้นต้นด้วยตัวเลข', () => {
    expect(errOf(wrap('  int 2speed = 100;'))?.th).toContain('ขึ้นต้นด้วยตัวเลข');
  });
  test('ชื่อมีเว้นวรรค / เป็นคำสงวน', () => {
    expect(errOf(wrap('  int left speed = 5;'))?.th).toContain('เว้นวรรค');
    expect(errOf(wrap('  int for = 5;'))?.th).toContain('คำสงวน');
  });
  test('char ใช้ " "', () => {
    expect(errOf(wrap('  char grade = "A";'))?.kind).toBe('convStrTo');
  });
  test('#define มี ; โผล่ตรงบรรทัดที่ใช้', () => {
    const e = errOf('#define LED_PIN 13;\nvoid setup() {\n  pinMode(LED_PIN, OUTPUT);\n}\nvoid loop() {}');
    expect(e?.kind).toBe('defineSemi');
    expect(e?.line).toBe(3);
  });
  test('ประกาศซ้ำ', () => {
    const e = errOf(wrap('  int score = 10;\n  int score = 20;'));
    expect(e?.kind).toBe('redeclared');
    expect(e?.line).toBe(3);
  });
  test('ลืมปิดปีกกา', () => {
    expect(errOf('void setup() {\n  pinMode(13, OUTPUT);\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n}')?.th).toContain('}');
    expect(errOf('void setup() {\n}\nvoid loop() {\n  delay(1);\n')?.kind).toBe('missingBrace');
  });
  test('ตัวแปรใน setup ใช้ใน loop ไม่ได้', () => {
    const e = errOf('void setup() {\n  int speed = 5;\n}\nvoid loop() {\n  speed = 6;\n}');
    expect(e?.kind).toBe('notDeclared');
    expect(e?.line).toBe(5);
  });
  test('ตัวแปรใน { } ใช้ข้างนอกไม่ได้', () => {
    expect(errOf(wrap('  if (true) {\n    int a = 1;\n  }\n  a = 2;'))?.kind).toBe('notDeclared');
  });
  test('ภาษาไทยนอกข้อความ', () => {
    const e = errOf(wrap('  int ความเร็ว = 5;'));
    expect(e?.kind).toBe('stray');
    expect(e?.en).toBe("stray '\\340' in program");
  });
  test('เครื่องหมายคำพูดโค้ง', () => {
    expect(errOf(wrap('  Serial.println(“Hi”);'))?.th).toContain('โค้ง');
  });
  test('delay() ไม่ใส่ค่า', () => {
    expect(errOf(wrap('  delay();'))?.kind).toBe('tooFew');
  });
  test('5 = x', () => {
    expect(errOf(wrap('  int x = 1;\n  if (5 = x) { }'))?.kind).toBe('lvalue');
  });
  test('argument ไม่ครบ / เกิน', () => {
    const pre = 'int biggest(int a, int b) { return a; }\n';
    expect(errOf(pre + wrap('  biggest(3);'))?.kind).toBe('tooFew');
    expect(errOf(pre + wrap('  biggest(3, 4, 5);'))?.kind).toBe('tooMany');
  });
  test('else ลอย', () => {
    expect(errOf(wrap('  int x = 1;\n  if (x > 5); {\n  } else {\n  }'))?.kind).toBe('elseNoIf');
  });
  test('แก้ค่า const', () => {
    expect(errOf('const int MAX = 100;\n' + wrap('  MAX = 5;'))?.kind).toBe('readOnly');
  });
  test('ไม่มี setup / loop', () => {
    expect(errOf('void setup() {\n}')?.kind).toBe('noSetup');
    expect(errOf('void loop() {\n}')?.en).toBe("undefined reference to 'setup'");
  });
  test('คำสั่งอยู่นอกฟังก์ชัน', () => {
    expect(errOf('delay(5);\nvoid setup() {}\nvoid loop() {}')?.kind).toBe('strayStatement');
  });
  test('Serial สะกดผิด', () => {
    expect(errOf(wrap('  Serial.printn("x");'))?.kind).toBe('noMember');
    expect(errOf(wrap('  serial.println("x");'))?.en).toContain("did you mean 'Serial'");
  });
  test('เอาค่าจากฟังก์ชัน void', () => {
    expect(errOf('void beep() { }\n' + wrap('  int x = beep();'))?.kind).toBe('voidValue');
  });
  test('case ใช้ช่วงค่าไม่ได้ / switch กับ String', () => {
    expect(errOf(wrap('  int x = 1;\n  switch (x) { case x > 5: break; }'))?.kind).toBe('caseNeedsConst');
    expect(errOf(wrap('  String s = "a";\n  switch (s) { default: break; }'))?.kind).toBe('badSwitch');
  });
  test('ทุก error มีคำอธิบายภาษาไทย', () => {
    const e = errOf(wrap('  delay(1000)'));
    expect(e?.th).toMatch(/[ก-๙]/);
  });
});

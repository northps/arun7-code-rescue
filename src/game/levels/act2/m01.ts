import { Level } from '../../types';

// 2-1 switch / case (P04 · คู่มือหัวข้อ 8)
export const m01: Level = {
  id: '2-1',
  act: 2,
  title: 'แผงควบคุมป้อมปืน',
  concept: 'switch / case / default',
  ref: 'P04 · คู่มือหัวข้อ 8',
  story: `โรงเก็บยานเต็มไปด้วยเคลธ
ยานกู้ชีพอยู่ห่างไปแค่สามสิบก้าว สามสิบก้าวที่ไม่มีใครเดินถึง
มาลี: กลางห้องมีป้อมปืนป้องกันยาน มันรับคำสั่งเป็นตัวอักษรตัวเดียว
มาลี: F ยิง L หันซ้าย R หันขวา
มาลี: ฉันส่งคำสั่ง เธอเขียนโปรแกรมแปลคำสั่ง ตกลงนะ`,
  outro: `ป้อมปืนหมุนตามคำสั่งอย่างแม่นยำ
เคลธตัวหน้าสุดล้มลง
ที่เหลือชะงัก เป็นครั้งแรกที่พวกมันถอยหนึ่งก้าว`,
  lesson: {
    title: 'เลือกทางตามค่าตายตัว: switch',
    blocks: [
      { p: 'เมื่อต้องเทียบตัวแปร **ตัวเดียว** กับ **ค่าตายตัว** หลายค่า `switch` อ่านง่ายกว่า `if … else if` ยาว ๆ' },
      { code: "char cmd = 'L';\nswitch (cmd) {\n  case 'F':\n    fire();\n    break;        // จบ case นี้ ออกจาก switch\n  case 'L':\n    aimLeft();\n    break;\n  default:        // ไม่ตรงกับ case ไหนเลย\n    standby();\n    break;\n}" },
      {
        list: [
          'หลัง `case` ต้องเป็น **ค่าตายตัว** เช่น `1` หรือ `\'F\'` แล้วตามด้วย `:`',
          'ใช้ได้กับ `int` `long` `char` · ใช้กับ `String` และ `float` ไม่ได้',
          '`case` ใช้ช่วงค่าอย่าง `x > 5` ไม่ได้ (ให้ใช้ `if` แทน)',
        ],
      },
      { tip: 'คำสั่งของป้อมปืน: `fire();` ยิง · `aimLeft();` `aimRight();` หัน · `standby();` พักรอ' },
    ],
  },
  world: {
    map: ['#########', '#...A...#', '#.......#', '#...U...#', '#.T...B.#', '#########'],
    dir: 'N',
    api: ['fire', 'aimLeft', 'aimRight', 'standby'],
    sensors: { readCommand: 'F', readMode: 1 },
    targets: 1,
  },
  puzzles: [
    {
      id: '2-1-a',
      kind: 'blank',
      title: 'แปลคำสั่งของมาลี',
      mission: 'readCommand() คืนตัวอักษรที่มาลีส่งมา เติมโครง switch ให้ครบ: F ยิง · L หันซ้าย · R หันขวา · อย่างอื่นให้พักรอ',
      hints: ['โครงคือ switch (ตัวแปร) { case ค่า: ... break; default: ... }', 'ช่องตามลำดับ: switch, case, break, default'],
      code: "void setup() {\n  char cmd = readCommand();\n  {{0}} (cmd) {\n    {{1}} 'F':\n      fire();\n      {{2}};\n    case 'L':\n      aimLeft();\n      break;\n    case 'R':\n      aimRight();\n      break;\n    {{3}}:\n      standby();\n      break;\n  }\n}\n\nvoid loop() {\n}",
      bank: ['switch', 'case', 'break', 'default', 'if', 'else', 'continue'],
      answer: ['switch', 'case', 'break', 'default'],
      goal: {},
      cases: [
        { label: "คำสั่ง 'F'", sensors: { readCommand: 'F' }, goal: { targetsLeft: 0, notCalled: ['aimLeft', 'aimRight', 'standby'] } },
        { label: "คำสั่ง 'L'", sensors: { readCommand: 'L' }, goal: { called: ['aimLeft'], notCalled: ['fire', 'aimRight', 'standby'] } },
        { label: "คำสั่ง 'R'", sensors: { readCommand: 'R' }, goal: { called: ['aimRight'], notCalled: ['fire', 'aimLeft', 'standby'] } },
        { label: "คำสั่ง 'X' (ไม่รู้จัก)", sensors: { readCommand: 'X' }, goal: { called: ['standby'], notCalled: ['fire', 'aimLeft', 'aimRight'] } },
      ],
    },
    {
      id: '2-1-b',
      kind: 'fix',
      title: 'case ที่เขียนผิด',
      mission: 'โค้ดสำรองของป้อมปืนคอมไพล์ไม่ผ่าน มี case ที่เขียนผิด 2 บรรทัด',
      hints: [
        "ตัวอักษร 1 ตัวต้องอยู่ใน ' ' เขียน L เฉย ๆ เครื่องจะคิดว่าเป็นชื่อตัวแปร",
        "หลัง case ใส่เงื่อนไขอย่าง cmd == 'R' ไม่ได้ ต้องเป็นค่าตายตัว: case 'R':",
      ],
      code: "void setup() {\n  char cmd = readCommand();\n  switch (cmd) {\n    case 'F': fire(); break;\n    case L: aimLeft(); break;\n    case cmd == 'R': aimRight(); break;\n    default: standby(); break;\n  }\n}\n\nvoid loop() {\n}",
      fixes: {
        5: { options: ['case L: aimLeft(); break;', "case 'L': aimLeft(); break;", 'case "L": aimLeft(); break;'], answer: 1 },
        6: { options: ["case cmd == 'R': aimRight(); break;", "case 'R': aimRight(); break;", "case > 'R': aimRight(); break;"], answer: 1 },
      },
      goal: {},
      cases: [
        { label: "คำสั่ง 'L'", sensors: { readCommand: 'L' }, goal: { called: ['aimLeft'], notCalled: ['fire', 'aimRight'] } },
        { label: "คำสั่ง 'R'", sensors: { readCommand: 'R' }, goal: { called: ['aimRight'], notCalled: ['fire', 'aimLeft'] } },
        { label: "คำสั่ง 'F'", sensors: { readCommand: 'F' }, goal: { targetsLeft: 0 } },
      ],
    },
    {
      id: '2-1-c',
      kind: 'type',
      title: 'โหมดเป็นตัวเลข',
      mission: 'ป้อมปืนอีกตัวรับคำสั่งเป็นตัวเลขจาก readMode(): 1 ยิง · 2 หันซ้าย · 3 หันขวา · เลขอื่นให้พักรอ เขียน switch เองทั้งหมด',
      hints: ['case 1: fire(); break; (ตัวเลขไม่ต้องมี \' \')', 'อย่าลืม default: standby(); break; และปิด } ของ switch'],
      starter: 'void setup() {\n  int mode = readMode();\n  // switch (mode) { case 1: ... case 2: ... case 3: ... default: ... }\n\n}\n\nvoid loop() {\n}',
      solution: 'void setup() {\n  int mode = readMode();\n  switch (mode) {\n    case 1:\n      fire();\n      break;\n    case 2:\n      aimLeft();\n      break;\n    case 3:\n      aimRight();\n      break;\n    default:\n      standby();\n      break;\n  }\n}\n\nvoid loop() {\n}',
      require: [{ re: '\\bswitch\\s*\\(', msg: 'ข้อนี้ให้ฝึกใช้ switch' }],
      goal: {},
      cases: [
        { label: 'โหมด 1', sensors: { readMode: 1 }, goal: { targetsLeft: 0, notCalled: ['aimLeft', 'aimRight', 'standby'] } },
        { label: 'โหมด 2', sensors: { readMode: 2 }, goal: { called: ['aimLeft'], notCalled: ['fire', 'aimRight', 'standby'] } },
        { label: 'โหมด 3', sensors: { readMode: 3 }, goal: { called: ['aimRight'], notCalled: ['fire', 'aimLeft', 'standby'] } },
        { label: 'โหมด 9', sensors: { readMode: 9 }, goal: { called: ['standby'], notCalled: ['fire', 'aimLeft', 'aimRight'] } },
      ],
    },
  ],
};

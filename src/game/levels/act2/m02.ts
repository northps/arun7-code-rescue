import { Level } from '../../types';

// 2-2 ลืม break (P04 · คู่มือหัวข้อ 8)
export const m02: Level = {
  id: '2-2',
  act: 2,
  title: 'ลืม break',
  concept: 'break ใน switch และการ "ไหล" ไป case ถัดไป',
  ref: 'P04 · คู่มือหัวข้อ 8',
  story: `ป้อมปืนตัวที่สองมีบางอย่างผิดปกติ
สั่งหันซ้าย มันหันซ้าย... แล้วหันขวา แล้วยิงเองโดยไม่มีใครสั่ง
กระสุนมีจำกัด
และหลังกองลังในห้องนี้ ยังมีลูกเรือหลบอยู่
มาลี: หยุดมันก่อน! ต้องแก้ให้ได้ก่อนจะมีใครเจ็บ`,
  outro: `ป้อมปืนเชื่องลงทันที
สั่งหนึ่งอย่าง ทำหนึ่งอย่าง ไม่มากไม่น้อยกว่านั้น`,
  lesson: {
    title: 'break: ประตูออกจาก switch',
    blocks: [
      { p: 'เครื่องกระโดดไปที่ `case` ที่ตรง แล้วทำ **ไล่ลงไปเรื่อย ๆ** จนกว่าจะเจอ `break` ถ้าลืม `break` โปรแกรมจะ "ไหล" ไปทำ case ถัดไปด้วย' },
      { code: 'int n = 2;\nswitch (n) {\n  case 1: Serial.println("one");\n  case 2: Serial.println("two");\n  case 3: Serial.println("three"); break;\n  default: Serial.println("other");\n}\n// พิมพ์ two แล้ว three (ไหลจาก case 2 ไป case 3)' },
      { p: 'บางครั้งการไหลก็ตั้งใจ ใช้รวมหลายค่าให้ทำอย่างเดียวกัน:' },
      { code: "case 'F':\ncase 'f':        // F ตัวใหญ่หรือตัวเล็กก็ยิง\n  fire();\n  break;" },
      { tip: 'วิธีจำ: เขียน case เมื่อไหร่ ให้พิมพ์ break; ปิดท้ายไว้ก่อนเลย แล้วค่อยเติมคำสั่งตรงกลาง' },
    ],
  },
  world: {
    map: ['#########', '#...A...#', '#.......#', '#...U...#', '#.T...B.#', '#########'],
    dir: 'N',
    api: ['fire', 'aimLeft', 'aimRight', 'standby'],
    sensors: { readCommand: 'L' },
    targets: 1,
  },
  puzzles: [
    {
      id: '2-2-a',
      kind: 'fix',
      title: 'ป้อมปืนที่ทำเกินคำสั่ง',
      mission: "กดรันดูก่อน: สั่ง 'L' แต่ป้อมปืนทำอะไรบ้าง โค้ดนี้ไม่มี error แต่มี 2 บรรทัดที่ต้องแก้",
      hints: ["case 'L' ไม่มี break โปรแกรมจึงไหลลงไปทำ aimRight() และ fire() ต่อ", "เติม break; ท้าย case 'L' และ case 'R'"],
      code: "void setup() {\n  char cmd = readCommand();\n  switch (cmd) {\n    case 'L': aimLeft();\n    case 'R': aimRight();\n    case 'F': fire(); break;\n    default: standby(); break;\n  }\n}\n\nvoid loop() {\n}",
      fixes: {
        4: { options: ["case 'L': aimLeft();", "case 'L': aimLeft(); break;", "case 'L': break; aimLeft();"], answer: 1 },
        5: { options: ["case 'R': aimRight();", "case 'R': aimRight(); break;", "case 'R': break; aimRight();"], answer: 1 },
      },
      goal: {},
      cases: [
        { label: "คำสั่ง 'L'", sensors: { readCommand: 'L' }, goal: { called: ['aimLeft'], notCalled: ['aimRight', 'fire'] } },
        { label: "คำสั่ง 'R'", sensors: { readCommand: 'R' }, goal: { called: ['aimRight'], notCalled: ['aimLeft', 'fire'] } },
        { label: "คำสั่ง 'F'", sensors: { readCommand: 'F' }, goal: { targetsLeft: 0 } },
      ],
    },
    {
      id: '2-2-b',
      kind: 'blank',
      title: 'ไหลแบบตั้งใจ',
      mission: "มาลีพิมพ์เร็วจนบางทีเป็นตัวเล็ก ให้ทั้ง 'F' และ 'f' สั่งยิงได้ (ใช้การไหลให้เป็นประโยชน์) ตัวอักษรอื่นให้พักรอ ห้ามยิง",
      hints: ["วาง case 'f': ต่อจาก case 'F': ทันทีโดยไม่มี break คั่น ทั้งสองจะไปทำ fire() เหมือนกัน", 'หลัง fire() ต้องมี break; ไม่อย่างนั้นจะไหลไป standby()'],
      code: "void setup() {\n  char cmd = readCommand();\n  switch (cmd) {\n    case 'F':\n    case {{0}}:\n      fire();\n      {{1}};\n    default:\n      standby();\n      {{2}};\n  }\n}\n\nvoid loop() {\n}",
      bank: ["'f'", '"f"', 'f', 'break', 'continue'],
      answer: ["'f'", 'break', 'break'],
      goal: {},
      cases: [
        { label: "คำสั่ง 'F'", sensors: { readCommand: 'F' }, goal: { targetsLeft: 0, notCalled: ['standby'] } },
        { label: "คำสั่ง 'f'", sensors: { readCommand: 'f' }, goal: { targetsLeft: 0, notCalled: ['standby'] } },
        { label: "คำสั่ง 'x'", sensors: { readCommand: 'x' }, goal: { called: ['standby'], notCalled: ['fire'] } },
      ],
    },
  ],
};

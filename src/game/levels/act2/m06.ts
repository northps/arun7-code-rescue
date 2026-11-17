import { Level } from '../../types';

// 2-6 do…while, continue, break (P05 · คู่มือหัวข้อ 9)
export const m06: Level = {
  id: '2-6',
  act: 2,
  title: 'ลูกเรือในแนวยิง',
  concept: 'do…while, continue และ break',
  ref: 'P05 · คู่มือหัวข้อ 9',
  story: `เคลธที่เหลือเปลี่ยนแผน
พวกมันลากลูกเรือที่จับได้ออกมา ให้ยืนปนอยู่ในแถว
ป้อมปืนยิงตามตำแหน่งได้ด้วย fireAt(ตำแหน่ง)
แต่ถ้าโปรแกรมไล่ยิงทุกตำแหน่งโดยไม่คิด คนของเราจะโดนด้วย
มาลี: ช้า ๆ นะ ดูให้ดีว่าตำแหน่งไหนคือใคร`,
  outro: `ลูกเรือวิ่งหลบเข้ามาหลังป้อมปืน หายใจหอบ
ลูกเรือ: ขอบใจ... นึกว่าไม่รอดแล้ว`,
  lesson: {
    title: 'ควบคุมลูปให้ละเอียดขึ้น',
    blocks: [
      { p: '`do … while` ทำ **ก่อน 1 รอบ** แล้วค่อยเช็ก เหมาะกับ "ถามซ้ำจนกว่าจะได้ค่าที่ถูก"' },
      { code: 'long n;\ndo {\n  n = readNumber();\n} while (n < 1 || n > 10);   // ผิดช่วงก็รับใหม่' },
      { p: '`continue` ข้ามรอบนี้ไปรอบถัดไป · `break` ออกจากลูปทันที' },
      { code: 'for (int i = 1; i <= 10; i++) {\n  if (i == 3) continue;    // ข้ามเลข 3\n  if (i == 6) break;       // ถึง 6 เลิกเลย\n  Serial.println(i);       // 1 2 4 5\n}' },
      { tip: '`do … while` ต้องมี `;` ปิดท้ายหลังวงเล็บของ while' },
    ],
  },
  world: {
    map: ['#########', '#.AAAAA.#', '#.......#', '#...U...#', '#.T...B.#', '#########'],
    dir: 'N',
    api: ['fireAt'],
    sensors: { hostageAt: 3 },
    actions: { setChannel: { args: 1, label: 'ช่องสัญญาณ' } },
    targets: 4,
    hostage: 3,
  },
  puzzles: [
    {
      id: '2-6-a',
      kind: 'blank',
      title: 'รับซ้ำจนกว่าจะถูก',
      mission: 'ก่อนยิงต้องตั้งช่องสัญญาณ 1–5 มาลีมือสั่น อาจพิมพ์เลขนอกช่วงมาก่อน ให้รับค่าซ้ำจนกว่าจะได้เลข 1 ถึง 5 แล้วจึงตั้งช่อง',
      hints: ['ต้องรับค่าก่อนอย่างน้อย 1 ครั้งเสมอ แล้วค่อยเช็ก จึงใช้ do … while', 'do { n = readNumber(); } while (n < 1 || n > 5);'],
      world: { targets: 0, hostage: undefined, inputs: [9, 0, 3] },
      code: 'void setup() {\n  long n;\n  {{0}} {\n    n = readNumber();\n  } {{1}} (n < 1 || n > 5);\n  setChannel(n);\n}\n\nvoid loop() {\n}',
      bank: ['do', 'while', 'for', 'if'],
      answer: ['do', 'while'],
      goal: {},
      cases: [
        { label: 'มาลีพิมพ์ 9, 0, 3', inputs: [9, 0, 3], goal: { set: { setChannel: [3] } } },
        { label: 'มาลีพิมพ์ 2', inputs: [2], goal: { set: { setChannel: [2] } } },
        { label: 'มาลีพิมพ์ 7, 4', inputs: [7, 4], goal: { set: { setChannel: [4] } } },
      ],
    },
    {
      id: '2-6-b',
      kind: 'blank',
      title: 'ข้ามตำแหน่งนั้นไป',
      mission: 'เคลธ 4 ตัวกับลูกเรือ 1 คนยืนเรียงตำแหน่ง 1–5 hostageAt() บอกตำแหน่งของลูกเรือ ยิงทุกตำแหน่ง "ยกเว้น" ตำแหน่งนั้น',
      hints: ['ต้องข้ามแค่รอบเดียว แล้วทำรอบถัดไปต่อ', 'continue ข้ามรอบนี้ · break จะเลิกทั้งลูป เคลธที่เหลือจะรอด'],
      code: 'void setup() {\n  int h = hostageAt();\n  for (int i = 1; i <= 5; i++) {\n    if (i == h) {{0}};\n    fireAt(i);\n  }\n}\n\nvoid loop() {\n}',
      bank: ['continue', 'break', 'return'],
      answer: ['continue'],
      goal: { targetsLeft: 0 },
      cases: [
        { label: 'ลูกเรืออยู่ตำแหน่ง 3', sensors: { hostageAt: 3 }, hostage: 3, targets: 4 },
        { label: 'ลูกเรืออยู่ตำแหน่ง 1', sensors: { hostageAt: 1 }, hostage: 1, targets: 4 },
        { label: 'ลูกเรืออยู่ตำแหน่ง 5', sensors: { hostageAt: 5 }, hostage: 5, targets: 4 },
      ],
    },
    {
      id: '2-6-c',
      kind: 'type',
      title: 'หยุดเมื่อถึงคนของเรา',
      mission: 'แถวใหม่: เคลธยืนเรียงจากตำแหน่ง 1 ตามด้วยลูกเรือ 1 คน หลังลูกเรือไม่มีใครแล้ว ยิงไล่จากตำแหน่ง 1 และ "เลิกยิงทันที" เมื่อถึงตำแหน่งของลูกเรือ (ยิงตำแหน่งว่างคือเสียกระสุน)',
      hints: ['คราวนี้ต้องเลิกทั้งลูป ไม่ใช่ข้ามรอบเดียว', 'ในลูป: if (i == h) break; แล้วจึง fireAt(i);'],
      starter: 'void setup() {\n  int h = hostageAt();\n  // ยิงตำแหน่ง 1, 2, 3 ... และเลิกทันทีเมื่อ i เท่ากับ h\n\n}\n\nvoid loop() {\n}',
      solution: 'void setup() {\n  int h = hostageAt();\n  for (int i = 1; i <= 5; i++) {\n    if (i == h) break;\n    fireAt(i);\n  }\n}\n\nvoid loop() {\n}',
      require: [{ re: '\\b(for|while)\\s*\\(', msg: 'ข้อนี้ต้องใช้ลูป' }],
      goal: { targetsLeft: 0 },
      cases: [
        { label: 'ลูกเรืออยู่ตำแหน่ง 4', sensors: { hostageAt: 4 }, hostage: 4, targets: 3 },
        { label: 'ลูกเรืออยู่ตำแหน่ง 2', sensors: { hostageAt: 2 }, hostage: 2, targets: 1 },
        { label: 'ลูกเรืออยู่ตำแหน่ง 5', sensors: { hostageAt: 5 }, hostage: 5, targets: 4 },
      ],
    },
  ],
};

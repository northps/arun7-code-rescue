import { Level } from '../../types';

// 1-9 if / else if / else และตัวเชื่อม (P04 · คู่มือหัวข้อ 5, 7) — ด่านท้ายองก์ 1
export const l09: Level = {
  id: '1-9',
  act: 1,
  title: 'ประตูโรงเก็บยาน',
  concept: 'if / else if / else, && และ ||',
  ref: 'P04 · คู่มือหัวข้อ 5, 7',
  story: `ประตูบานสุดท้าย
หลังบานนี้คือโรงเก็บยาน และยานกู้ชีพ
มาลี: ประตูนี้หนักมาก ต้องมีไฟพอ มันถึงจะเปิด
มาลี: และห้ามเปิดเด็ดขาดถ้าพวกมันอยู่ข้างหลัง
มาลี: ทางไหนไม่ใช่ ให้ล็อกไว้ก่อน อย่าลังเล`,
  outro: `ประตูบานยักษ์เลื่อนเปิดช้า ๆ
ยานกู้ชีพจอดอยู่กลางโรงเก็บ ไฟเขียวพร้อมออกตัว
แต่รอบยาน... มีเงานับสิบยืนล้อมอยู่ ดวงตาสีม่วงหันมาทางประตูพร้อมกัน
บิต: บี๊บ...
มาลี: ถ้าหนีไม่ได้ ก็ต้องสู้
มาลี: ป้อมปืนของยานยังใช้ได้ ถ้าเธอเขียนโปรแกรมสั่งมันได้
— จบองก์ 1`,
  lesson: {
    title: 'ทางเลือกหลายทาง',
    blocks: [
      { code: 'if (d < 20) {\n  // ทำเมื่อข้อแรกจริง\n} else if (d < 40) {\n  // ข้อแรกเท็จ แต่ข้อนี้จริง\n} else {\n  // ไม่มีข้อไหนจริงเลย\n}' },
      { p: 'เครื่องเช็ก **จากบนลงล่าง** เจอข้อแรกที่จริงก็ทำ แล้ว **ข้ามที่เหลือทั้งหมด** ลำดับจึงสำคัญ' },
      {
        list: [
          '`&&` และ: จริงเมื่อ **จริงทั้งคู่** เช่น `age >= 13 && age <= 19`',
          '`||` หรือ: จริงเมื่อ **จริงอย่างน้อยหนึ่ง** เช่น `day == 6 || day == 7`',
          '`!` ไม่: กลับค่า เช่น `!done`',
          'เขียน `0 < x < 10` แบบคณิตศาสตร์ไม่ได้ ต้องเขียน `x > 0 && x < 10`',
        ],
      },
      { tip: '`if` สองอันแยกกัน เช็กทุกอัน อาจทำได้ทั้งคู่ · `if … else if` ทำได้แค่อันเดียว' },
    ],
  },
  world: {
    map: ['  .G.  ', ' .AAA. ', '###D###', '#L...T#', '#.....#', '#..B..#', '#######'],
    dir: 'N',
    api: ['openDoor', 'closeDoor', 'lockDoor'],
    sensors: { scanAliens: 0, readDistance: 90, readPower: 80 },
    pins: { 13: 'lamp' },
  },
  puzzles: [
    {
      id: '1-9-a',
      kind: 'blank',
      title: 'ไม่อย่างนั้น...',
      mission: 'ทางว่างให้เปิดประตู "ไม่อย่างนั้น" ให้ล็อกประตู เติมให้ครบ',
      hints: ['คำที่แปลว่า "ไม่อย่างนั้น" คือ else', 'ในปีกกาแรก openDoor ในปีกกาหลัง else คือ lockDoor'],
      code: 'void setup() {\n  int aliens = scanAliens();\n  if (aliens == 0) {\n    {{0}}();\n  } {{1}} {\n    {{2}}();\n  }\n}\n\nvoid loop() {\n}',
      bank: ['openDoor', 'lockDoor', 'else', 'if', 'then'],
      answer: ['openDoor', 'else', 'lockDoor'],
      goal: {},
      cases: [
        { label: 'ทางว่าง', sensors: { scanAliens: 0 }, goal: { door: 'open' } },
        { label: 'มีเคลธ 2 ตัว', sensors: { scanAliens: 2 }, goal: { door: 'locked' } },
      ],
    },
    {
      id: '1-9-b',
      kind: 'blank',
      title: 'ลำดับของเงื่อนไข',
      mission: 'readDistance() บอกว่าเคลธตัวที่ใกล้ที่สุดอยู่ห่างกี่เมตร: ใกล้กว่า 20 → ล็อกประตู · ใกล้กว่า 40 → เปิดไฟเตือน (ยังไม่เปิดประตู) · ไกลกว่านั้น → เปิดประตู วางเงื่อนไขให้ถูกลำดับ',
      hints: [
        'เครื่องเช็กจากบนลงล่าง ถ้าเอา d < 40 ขึ้นก่อน ค่า 10 ก็จะเข้าข้อนั้นไปเลย ไม่มีทางถึง d < 20',
        'ช่องแรก d < 20 ช่องที่สอง d < 40',
      ],
      world: { aliens: 0 },
      code: 'void setup() {\n  pinMode(13, OUTPUT);\n  int d = readDistance();\n  if ({{0}}) {\n    lockDoor();\n  } else if ({{1}}) {\n    digitalWrite(13, HIGH);\n  } else {\n    openDoor();\n  }\n}\n\nvoid loop() {\n}',
      bank: ['d < 40', 'd < 20', 'd > 40', 'd == 20'],
      answer: ['d < 20', 'd < 40'],
      goal: {},
      cases: [
        { label: 'ห่าง 10 เมตร', sensors: { readDistance: 10 }, aliens: 0, goal: { door: 'locked', pins: { 13: 0 } } },
        { label: 'ห่าง 30 เมตร', sensors: { readDistance: 30 }, aliens: 0, goal: { door: 'closed', pins: { 13: 1 } } },
        { label: 'ห่าง 90 เมตร', sensors: { readDistance: 90 }, aliens: 0, goal: { door: 'open', pins: { 13: 0 } } },
      ],
    },
    {
      id: '1-9-c',
      kind: 'type',
      title: 'เปิดโรงเก็บยาน',
      mission: 'เปิดประตูได้ก็ต่อเมื่อ "ไม่มีเคลธหลังประตู และ ไฟมีอย่างน้อย 50" ไม่อย่างนั้นให้ล็อกประตู เขียน if / else เอง โดยใช้ && เชื่อมสองเงื่อนไข',
      hints: [
        'เงื่อนไข: aliens == 0 && power >= 50 ("อย่างน้อย 50" รวม 50 ด้วย จึงใช้ >=)',
        'if (aliens == 0 && power >= 50) { openDoor(); } else { lockDoor(); }',
      ],
      starter: 'void setup() {\n  int aliens = scanAliens();\n  int power = readPower();\n  // ถ้าไม่มีเคลธ "และ" ไฟอย่างน้อย 50 → openDoor();\n  // ไม่อย่างนั้น → lockDoor();\n\n}\n\nvoid loop() {\n}',
      solution: 'void setup() {\n  int aliens = scanAliens();\n  int power = readPower();\n  if (aliens == 0 && power >= 50) {\n    openDoor();\n  } else {\n    lockDoor();\n  }\n}\n\nvoid loop() {\n}',
      require: [{ re: '\\bif\\s*\\(', msg: 'ข้อนี้ต้องใช้ if ให้โปรแกรมตัดสินใจเอง' }],
      goal: {},
      win: 'ประตูโรงเก็บยานเปิดแล้ว!',
      cases: [
        { label: 'ทางว่าง ไฟ 80', sensors: { scanAliens: 0, readPower: 80 }, goal: { door: 'open' } },
        { label: 'มีเคลธ 2 ตัว ไฟ 80', sensors: { scanAliens: 2, readPower: 80 }, goal: { door: 'locked' } },
        { label: 'ทางว่าง ไฟ 30', sensors: { scanAliens: 0, readPower: 30 }, goal: { door: 'locked' } },
        { label: 'ทางว่าง ไฟ 50 พอดี', sensors: { scanAliens: 0, readPower: 50 }, goal: { door: 'open' } },
      ],
    },
  ],
};

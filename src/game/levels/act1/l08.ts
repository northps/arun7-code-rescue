import { Level } from '../../types';

// 1-8 เปรียบเทียบ และ if (P04 · คู่มือหัวข้อ 5, 7)
export const l08: Level = {
  id: '1-8',
  act: 1,
  title: 'หลังประตูมีอะไร',
  concept: 'เปรียบเทียบ และ if',
  ref: 'P04 · คู่มือหัวข้อ 5, 7',
  story:
    'ชั้นล่าง ทุกประตูมีเครื่องสแกนความร้อน scanAliens() บอกได้ว่าหลังประตูมีเคลธกี่ตัว คุณไม่รู้ล่วงหน้าว่ารอบไหนจะมีหรือไม่มี โปรแกรมต้อง "ตัดสินใจ" เอง เปิดผิดจังหวะครั้งเดียวคือจบ',
  outro: 'ประตูเปิดในจังหวะที่ทางว่างพอดี คุณกับบิตวิ่งผ่านไปก่อนที่เงาตะคุ่มจะวนกลับมา',
  lesson: {
    title: 'ให้โปรแกรมตัดสินใจ: if',
    blocks: [
      { code: 'if (เงื่อนไข) {\n  // ทำเมื่อเงื่อนไขเป็นจริง\n}' },
      { p: 'เงื่อนไขสร้างจากตัวเปรียบเทียบ ผลที่ได้คือ จริง หรือ เท็จ' },
      {
        list: [
          '`==` เท่ากับ (เครื่องหมายเท่ากับ **สองตัว**) · `!=` ไม่เท่ากับ',
          '`<` `>` น้อยกว่า มากกว่า · `<=` `>=` ไม่เกิน ไม่ต่ำกว่า',
        ],
      },
      { p: '**บั๊กอันดับ 1 ของคนเริ่มเขียน:**' },
      { code: 'if (x = 5)    // ผิด! เอา 5 ใส่ x แล้วถือว่าจริงเสมอ\nif (x == 5)   // ถูก: เทียบว่า x เท่ากับ 5 ไหม\n\nif (x > 5);   // ผิด! ; ทำให้ if จบตรงนั้น\n{ ... }       // ของในปีกกาทำทุกครั้ง' },
      { tip: 'เครื่องไม่ฟ้อง error ทั้งสองแบบ ต้องรันแล้วสังเกตเอง เกมนี้จะบอกเป็น "ข้อสังเกต" หลังรันพลาด' },
    ],
  },
  world: {
    map: [' .AAA. ', '###D###', '#L...T#', '#.....#', '#..B..#', '#######'],
    dir: 'N',
    api: ['openDoor', 'closeDoor', 'lockDoor'],
    sensors: { scanAliens: 0 },
    pins: { 13: 'lamp' },
  },
  puzzles: [
    {
      id: '1-8-a',
      kind: 'blank',
      title: 'เปิดเมื่อทางว่างเท่านั้น',
      mission: 'เปิดประตูเฉพาะตอนที่หลังประตู "ไม่มีเคลธเลย" (จำนวนเท่ากับ 0) เลือกเครื่องหมายให้ถูก เกมจะทดสอบทั้งตอนทางว่างและตอนมีเคลธ',
      hints: ['"เท่ากับ" ในเงื่อนไขใช้เครื่องหมายเท่ากับสองตัว', 'if (aliens == 0) {'],
      code: 'void setup() {\n  int aliens = scanAliens();\n  if (aliens {{0}} 0) {\n    openDoor();\n  }\n}\n\nvoid loop() {\n}',
      bank: ['==', '=', '!=', '>', '<'],
      answer: ['=='],
      goal: {},
      cases: [
        { label: 'ทางว่าง', sensors: { scanAliens: 0 }, goal: { door: 'open' } },
        { label: 'มีเคลธ 2 ตัว', sensors: { scanAliens: 2 }, goal: { door: 'closed' } },
      ],
    },
    {
      id: '1-8-b',
      kind: 'fix',
      title: 'สองบั๊กที่เครื่องไม่ฟ้อง',
      mission: 'ทางว่างให้เปิดประตู ถ้ามีเคลธให้ล็อกประตู โค้ดนี้ไม่มี error สักตัว แต่ทำงานผิด รันแล้วอ่าน "ข้อสังเกต"',
      hints: [
        'if (aliens = 0) ใช้ = ตัวเดียว เป็นการเอา 0 ใส่ aliens ไม่ใช่การเทียบ ต้องเป็น ==',
        'if (aliens > 0); มี ; ต่อท้ายวงเล็บ ทำให้ lockDoor() ทำทุกครั้ง ต้องลบ ; ออก',
      ],
      code: 'void setup() {\n  int aliens = scanAliens();\n  if (aliens = 0) {\n    openDoor();\n  }\n  if (aliens > 0); {\n    lockDoor();\n  }\n}\n\nvoid loop() {\n}',
      fixes: {
        3: { options: ['if (aliens = 0) {', 'if (aliens == 0) {', 'if (0 = aliens) {'], answer: 1 },
        6: { options: ['if (aliens > 0); {', 'if (aliens > 0) {', 'if (aliens >= 0) {'], answer: 1 },
      },
      goal: {},
      cases: [
        { label: 'ทางว่าง', sensors: { scanAliens: 0 }, goal: { door: 'open' } },
        { label: 'มีเคลธ 3 ตัว', sensors: { scanAliens: 3 }, goal: { door: 'locked' } },
      ],
    },
    {
      id: '1-8-c',
      kind: 'type',
      title: 'ไฟเตือน',
      mission: 'เขียน if สองอัน: ถ้ามีเคลธ (มากกว่า 0) ให้เปิดไฟเตือนที่ขา 13 · ถ้าไม่มีเลย (เท่ากับ 0) ให้เปิดประตู',
      hints: [
        'if (aliens > 0) { digitalWrite(13, HIGH); }',
        'if (aliens == 0) { openDoor(); }',
      ],
      starter: 'void setup() {\n  pinMode(13, OUTPUT);\n  int aliens = scanAliens();\n  // ถ้ามีเคลธ → digitalWrite(13, HIGH);\n\n  // ถ้าไม่มีเลย → openDoor();\n\n}\n\nvoid loop() {\n}',
      solution: 'void setup() {\n  pinMode(13, OUTPUT);\n  int aliens = scanAliens();\n  if (aliens > 0) {\n    digitalWrite(13, HIGH);\n  }\n  if (aliens == 0) {\n    openDoor();\n  }\n}\n\nvoid loop() {\n}',
      require: [{ re: '\\bif\\s*\\(', msg: 'ข้อนี้ต้องใช้ if ให้โปรแกรมตัดสินใจเอง' }],
      goal: {},
      cases: [
        { label: 'ทางว่าง', sensors: { scanAliens: 0 }, goal: { door: 'open', pins: { 13: 0 } } },
        { label: 'มีเคลธ 2 ตัว', sensors: { scanAliens: 2 }, goal: { door: 'closed', pins: { 13: 1 } } },
        { label: 'มีเคลธ 1 ตัว', sensors: { scanAliens: 1 }, goal: { door: 'closed', pins: { 13: 1 } } },
      ],
    },
  ],
};

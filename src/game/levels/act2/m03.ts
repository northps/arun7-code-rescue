import { Level } from '../../types';

// 2-3 for: รู้จำนวนรอบ (P05 · คู่มือหัวข้อ 9)
export const m03: Level = {
  id: '2-3',
  act: 2,
  title: 'ยิงห้านัด',
  concept: 'ลูป for เมื่อรู้จำนวนรอบ',
  ref: 'P05 · คู่มือหัวข้อ 9',
  story:
    'เคลธห้าตัวตั้งแถวหน้ายานกู้ชีพ ป้อมปืนเหลือกระสุนพอดีตัวละนัด จะเขียน fire(); ห้าบรรทัดก็ได้ แต่ถ้ามีห้าสิบตัวล่ะ มาลีหัวเราะเบา ๆ: "ให้เครื่องนับเองสิ มันนับเก่งกว่าเรา"',
  outro: 'ห้านัด ห้าตัว ไม่ขาดไม่เกิน แถวหน้าโล่งแล้ว',
  lesson: {
    title: 'ทำซ้ำตามจำนวนรอบ: for',
    blocks: [
      { code: 'for (เริ่มต้น; ทำต่อเมื่อ; ทำท้ายทุกรอบ) {\n  // ทำซ้ำ\n}' },
      { code: 'for (int i = 0; i < 5; i++) {\n  fire();          // ทำ 5 รอบ: i = 0 1 2 3 4\n}' },
      {
        list: [
          '`int i = 0` ทำครั้งเดียวตอนเริ่ม · `i < 5` เช็กก่อนทุกรอบ · `i++` ทำท้ายทุกรอบ',
          '`i < 5` ได้ 5 รอบ (0–4) · `i <= 5` ได้ **6** รอบ (0–5) บั๊กนับเกินหนึ่งพบบ่อยมาก',
          'เริ่มที่ 1 ก็ได้: `for (int i = 1; i <= 5; i++)` ได้ 5 รอบ (1–5)',
          '`for (...);` มี `;` ท้ายวงเล็บ = ลูปว่างเปล่า',
        ],
      },
      { tip: 'ดูแถบตัวแปรตอนรัน จะเห็นค่า i เพิ่มขึ้นทีละรอบ' },
    ],
  },
  world: {
    map: ['#########', '#.AAAAA.#', '#.......#', '#...U...#', '#.T...B.#', '#########'],
    dir: 'N',
    api: ['fire'],
    sensors: { countKleth: 5 },
    targets: 5,
  },
  puzzles: [
    {
      id: '2-3-a',
      kind: 'blank',
      title: 'ห้ารอบพอดี',
      mission: 'เติมส่วนหัวของ for ให้ป้อมปืนยิง 5 นัดพอดี (เคลธ 5 ตัว)',
      hints: ['เริ่มนับที่ 0 และทำต่อเมื่อ i น้อยกว่า 5', 'for (int i = 0; i < 5; i++)'],
      code: 'void setup() {\n  for (int i = {{0}}; i {{1}} 5; {{2}}) {\n    fire();\n  }\n}\n\nvoid loop() {\n}',
      bank: ['0', '1', '<', '<=', 'i++', 'i--'],
      answer: ['0', '<', 'i++'],
      goal: { targetsLeft: 0 },
    },
    {
      id: '2-3-b',
      kind: 'fix',
      title: 'นัดที่หก',
      mission: 'โค้ดนี้ยิงเกินไป 1 นัด กระสุนนัดนั้นพุ่งไปโดนผนังยานกู้ชีพ แก้ส่วนหัวของ for',
      hints: ['ไล่ค่า i ดู: 0 1 2 3 4 5 นับได้กี่ค่า', 'เปลี่ยน i <= 5 เป็น i < 5'],
      code: 'void setup() {\n  for (int i = 0; i <= 5; i++) {\n    fire();\n  }\n}\n\nvoid loop() {\n}',
      fixes: {
        2: { options: ['for (int i = 0; i <= 5; i++) {', 'for (int i = 0; i < 5; i++) {', 'for (int i = 0; i < 5; i--) {'], answer: 1 },
      },
      goal: { targetsLeft: 0 },
    },
    {
      id: '2-3-c',
      kind: 'type',
      title: 'กี่ตัวก็ได้',
      mission: 'คลื่นถัดไปไม่รู้ว่ามากี่ตัว countKleth() จะนับให้ เขียน for ให้ยิงเท่ากับจำนวนที่นับได้พอดี',
      hints: ['ใช้ตัวแปร n แทนเลข 5 ในเงื่อนไข: i < n', 'for (int i = 0; i < n; i++) { fire(); }'],
      starter: 'void setup() {\n  int n = countKleth();\n  // ยิง n นัด ด้วย for\n\n}\n\nvoid loop() {\n}',
      solution: 'void setup() {\n  int n = countKleth();\n  for (int i = 0; i < n; i++) {\n    fire();\n  }\n}\n\nvoid loop() {\n}',
      require: [{ re: '\\b(for|while)\\s*\\(', msg: 'ข้อนี้ต้องใช้ลูป ให้เครื่องนับเอง' }],
      goal: { targetsLeft: 0 },
      cases: [
        { label: 'มา 3 ตัว', sensors: { countKleth: 3 }, targets: 3 },
        { label: 'มา 5 ตัว', sensors: { countKleth: 5 }, targets: 5 },
        { label: 'มา 1 ตัว', sensors: { countKleth: 1 }, targets: 1 },
      ],
    },
  ],
};

import { Level } from '../../types';

// 2-5 while (P05 · คู่มือหัวข้อ 9)
export const m05: Level = {
  id: '2-5',
  act: 2,
  title: 'จนกว่าโล่จะแตก',
  concept: 'ลูป while และลูปไม่รู้จบ',
  ref: 'P05 · คู่มือหัวข้อ 9',
  story: `ฝูงเคลธแหวกทางออก
หัวหน้าของพวกมันก้าวออกมา รอบตัวมีโล่พลังงานสีม่วงหมุนวน
ไม่มีใครรู้ว่าต้องยิงกี่นัดโล่ถึงจะแตก
แต่เซนเซอร์ readShield() บอกได้ว่าโล่เหลือเท่าไร
เมื่อไม่รู้จำนวนรอบ for ก็ช่วยอะไรไม่ได้`,
  outro: `โล่สีม่วงร้าว แล้วแตกเป็นประกาย
หัวหน้าเคลธทรุดลง
ฝูงที่เหลือเริ่มถอย`,
  lesson: {
    title: 'ทำไปเรื่อย ๆ จนกว่า…: while',
    blocks: [
      { code: 'while (เงื่อนไข) {\n  // ทำซ้ำตราบที่เงื่อนไขยังจริง\n}' },
      { code: 'int money = 100;\nwhile (money >= 30) {\n  money = money - 30;\n  Serial.println(money);   // 70 40 10\n}' },
      {
        list: [
          'รู้จำนวนรอบ → `for` · ไม่รู้ แต่รู้ว่าจะหยุดเมื่อไหร่ → `while`',
          'เครื่องเช็กเงื่อนไข **ก่อน** ทุกรอบ ถ้าเท็จตั้งแต่แรกจะไม่ทำเลยสักรอบ',
          '**ในลูปต้องมีอะไรที่ทำให้เงื่อนไขเปลี่ยน** ไม่อย่างนั้นคือลูปไม่รู้จบ',
        ],
      },
      { tip: 'ในเกมนี้ลูปไม่รู้จบจะถูกหยุดให้และอธิบายสาเหตุ บน Arduino จริงต้องแก้โค้ดแล้วอัปโหลดใหม่' },
    ],
  },
  world: {
    map: ['#########', '#...A...#', '#.......#', '#...U...#', '#.T...B.#', '#########'],
    dir: 'N',
    api: ['fire'],
    targets: 1,
    shield: 3,
  },
  puzzles: [
    {
      id: '2-5-a',
      kind: 'blank',
      title: 'ยิงตราบที่ยังมีโล่',
      mission: 'ยิงซ้ำตราบที่โล่ยังเหลือมากกว่า 0 เกมจะทดสอบกับโล่หลายขนาด',
      hints: ['อ่านค่าโล่ใหม่ทุกรอบด้วย readShield() ในเงื่อนไข', 'while (readShield() > 0) { fire(); }'],
      code: 'void setup() {\n  while ({{0}}() {{1}} 0) {\n    fire();\n  }\n}\n\nvoid loop() {\n}',
      bank: ['readShield', 'fire', '>', '<', '=='],
      answer: ['readShield', '>'],
      goal: { targetsLeft: 0 },
      cases: [
        { label: 'โล่ 3 ชั้น', shield: 3 },
        { label: 'โล่ 5 ชั้น', shield: 5 },
      ],
    },
    {
      id: '2-5-b',
      kind: 'fix',
      title: 'ยิงไม่หยุด',
      mission: 'กดรันดู: โล่แตกแล้วแต่ป้อมปืนยังยิงต่อไม่หยุดจนกระสุนหมดคลัง ในลูปขาดอะไรไปหนึ่งบรรทัด',
      hints: ['ตัวแปร s ถูกอ่านค่าครั้งเดียวก่อนเข้าลูป ในลูปไม่มีอะไรเปลี่ยนค่า s เลย เงื่อนไข s > 0 จึงจริงตลอด', 'เติม s = readShield(); หลัง fire(); เพื่ออ่านค่าใหม่ทุกรอบ'],
      code: 'void setup() {\n  int s = readShield();\n  while (s > 0) {\n    fire();\n\n  }\n}\n\nvoid loop() {\n}',
      fixes: {
        5: { options: ['', 's = readShield();', 's++;'], answer: 1 },
      },
      goal: { targetsLeft: 0 },
      cases: [
        { label: 'โล่ 3 ชั้น', shield: 3 },
        { label: 'โล่ 4 ชั้น', shield: 4 },
      ],
    },
    {
      id: '2-5-c',
      kind: 'type',
      title: 'นับจำนวนนัด',
      mission: 'มาลีอยากรู้ว่าโล่แบบนี้ต้องยิงกี่นัด ยิงจนโล่แตกเหมือนเดิม แต่นับจำนวนนัดไว้ในตัวแปร shots แล้วพิมพ์ออก Serial',
      hints: ['ในลูป นอกจาก fire(); ให้เพิ่ม shots++; ด้วย', 'while (readShield() > 0) { fire(); shots++; }'],
      starter: 'void setup() {\n  Serial.begin(9600);\n  int shots = 0;\n  // ยิงจนโล่แตก และนับจำนวนนัดใน shots\n\n  Serial.println(shots);\n}\n\nvoid loop() {\n}',
      solution: 'void setup() {\n  Serial.begin(9600);\n  int shots = 0;\n  while (readShield() > 0) {\n    fire();\n    shots++;\n  }\n  Serial.println(shots);\n}\n\nvoid loop() {\n}',
      require: [{ re: '\\b(while|for)\\s*\\(', msg: 'ข้อนี้ต้องใช้ลูป' }],
      goal: { targetsLeft: 0 },
      cases: [
        { label: 'โล่ 4 ชั้น', shield: 4, goal: { serial: '4' } },
        { label: 'โล่ 6 ชั้น', shield: 6, goal: { serial: '6' } },
      ],
    },
  ],
};

import { Level } from '../../types';

// 1-4 ชนิดข้อมูล (P02 · คู่มือหัวข้อ 3)
export const l04: Level = {
  id: '1-4',
  act: 1,
  title: 'ห้องปรับความดัน',
  concept: 'ชนิดข้อมูล: float bool char String long',
  ref: 'P02 · คู่มือหัวข้อ 3',
  story: `ทางเดินหลักมีเงาสูงผอมเดินไปมา เคลธเฝ้าอยู่
ทางเดียวที่เหลือคืออ้อมผ่านห้องปรับความดัน
แผงควบคุมของมันจู้จี้: ความดันต้องเป็นทศนิยม สถานะต้องเป็นจริงหรือเท็จ โซนต้องเป็นตัวอักษร
ใส่ผิดชนิด ค่าจะเพี้ยนทันที และห้องนี้ไม่ให้โอกาสแก้ตัว`,
  outro: `เข็มความดันสองฝั่งหยุดตรงกันพอดี
ฟู่...
ประตูชั้นในคลายล็อก`,
  lesson: {
    title: 'กล่องแต่ละใบมีชนิด',
    blocks: [
      { p: 'เลือกชนิดให้ตรงกับของที่จะเก็บ กล่องผิดชนิด ค่าจะเพี้ยนโดยไม่มีคำเตือน' },
      { code: 'int age = 17;            // จำนวนเต็ม −32,768 ถึง 32,767\nlong ms = 60000;         // จำนวนเต็มค่าใหญ่\nfloat temp = 36.5;       // ทศนิยม\nbool ready = true;       // จริง / เท็จ\nchar grade = \'A\';        // ตัวอักษร 1 ตัว ใช้ \' \'\nString name = "Ploy";    // ข้อความ ใช้ " "' },
      {
        list: [
          '`int x = 7.9;` ได้ **7** (ตัดทศนิยมทิ้ง ไม่ปัด)',
          '`int` เก็บได้ถึง 32,767 เกินแล้ว **ล้น** กลายเป็นเลขติดลบ → ใช้ `long`',
          '`char` ใช้ `\' \'` ส่วน `String` ใช้ `" "` สลับกันไม่ได้',
        ],
      },
      { tip: 'วิธีเลือก: มีทศนิยม → float · จริง/เท็จ → bool · ตัวเลขเกิน 32,767 ได้ → long · นอกนั้น int' },
    ],
  },
  world: {
    map: ['  ...  ', '###D###', '#.T...#', '#....X#', '#..B.X#', '#######'],
    dir: 'N',
    actions: {
      setAirlock: { args: 3, label: 'ห้องปรับความดัน', opensDoor: true },
      setCycle: { args: 2, label: 'รอบปรับความดัน', opensDoor: true },
    },
  },
  puzzles: [
    {
      id: '1-4-a',
      kind: 'blank',
      title: 'เลือกกล่องให้ถูกชนิด',
      mission: 'แผงต้องการ: ความดัน 1.5 · ปิดผนึกแล้ว (true) · โซน B เลือกชนิดของตัวแปรแต่ละตัวให้ถูก',
      hints: ['1.5 มีทศนิยม · true เป็นจริง/เท็จ · \'B\' เป็นตัวอักษร 1 ตัว', 'float pressure · bool sealed · char zone'],
      code: 'void setup() {\n  {{0}} pressure = 1.5;\n  {{1}} sealed = true;\n  {{2}} zone = \'B\';\n  setAirlock(pressure, sealed, zone);\n}\n\nvoid loop() {\n}',
      bank: ['int', 'float', 'bool', 'char', 'String'],
      answer: ['float', 'bool', 'char'],
      goal: { door: 'open', set: { setAirlock: [1.5, true, 'B'] } },
    },
    {
      id: '1-4-b',
      kind: 'fix',
      title: 'ตัวเลขที่ใหญ่เกินกล่อง',
      mission: 'รอบปรับความดันต้องนาน 40000 มิลลิวินาที ที่โซน C โค้ดนี้ผิด 2 จุด จุดหนึ่งเครื่องไม่ฟ้อง error ด้วยซ้ำ ต้องรันแล้วสังเกตค่าเอง',
      hints: [
        'error แรก: char เก็บตัวอักษร 1 ตัว ต้องใช้ \' \' ไม่ใช่ " "',
        'int เก็บได้แค่ 32,767 ค่า 40000 จึงล้นเป็นเลขติดลบ ต้องเปลี่ยนเป็น long',
      ],
      code: 'void setup() {\n  int timer = 40000;\n  char zone = "C";\n  setCycle(timer, zone);\n}\n\nvoid loop() {\n}',
      fixes: {
        2: { options: ['int timer = 40000;', 'long timer = 40000;', 'byte timer = 40000;'], answer: 1 },
        3: { options: ['char zone = "C";', 'char zone = \'C\';', 'char zone = C;'], answer: 1 },
      },
      goal: { door: 'open', set: { setCycle: [40000, 'C'] } },
    },
    {
      id: '1-4-c',
      kind: 'type',
      title: 'ประตูชั้นใน',
      mission: 'ประตูชั้นในต้องการ: ความดัน 0.8 · ยังไม่ปิดผนึก (false) · โซน C ประกาศตัวแปร pressure กับ sealed เอง แล้วเรียก setAirlock',
      hints: [
        'float pressure = 0.8; และ bool sealed = false;',
        "บรรทัดสุดท้าย: setAirlock(pressure, sealed, 'C');",
      ],
      starter: "void setup() {\n  // 1) ตัวแปร pressure เก็บ 0.8\n\n  // 2) ตัวแปร sealed เก็บ false\n\n  // 3) setAirlock(pressure, sealed, 'C');\n\n}\n\nvoid loop() {\n}",
      solution: "void setup() {\n  float pressure = 0.8;\n  bool sealed = false;\n  setAirlock(pressure, sealed, 'C');\n}\n\nvoid loop() {\n}",
      require: [
        { re: '\\bfloat\\s+pressure\\b', msg: 'ต้องประกาศ pressure เป็นชนิดที่เก็บทศนิยมได้ (float pressure = 0.8;)' },
        { re: '\\b(bool|boolean)\\s+sealed\\b', msg: 'ต้องประกาศ sealed เป็นชนิดจริง/เท็จ (bool sealed = false;)' },
      ],
      goal: { door: 'open', set: { setAirlock: [0.8, false, 'C'] } },
    },
  ],
};

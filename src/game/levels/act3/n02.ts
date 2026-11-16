import { Level } from '../../types';

// 3-2 parameter (P06 · คู่มือหัวข้อ 10)
export const n02: Level = {
  id: '3-2',
  act: 3,
  title: 'จุดเครื่องยนต์กี่วินาที',
  concept: 'ฟังก์ชันที่รับค่า (parameter)',
  ref: 'P06 · คู่มือหัวข้อ 10',
  story:
    'ยานกู้ชีพลอยห่างจากอรุณ-7 ช้าเกินไป เคลธเริ่มหันปืนมาทางนี้ ต้องจุดเครื่องยนต์เป็นช่วง ๆ เพื่อเร่งหนี แต่ละช่วงนานไม่เท่ากัน การจุดหนึ่งครั้งคือ engineOn(); รอ แล้ว engineOff(); ต่างกันแค่ "รอนานเท่าไหร่"',
  outro: 'ไฟท้ายยานวาบเป็นจังหวะ อรุณ-7 เล็กลงเรื่อย ๆ ในหน้าต่าง ลำแสงของเคลธเฉียดไปนิดเดียว',
  lesson: {
    title: 'ส่งค่าเข้าไปในฟังก์ชัน',
    blocks: [
      { p: 'ฟังก์ชันที่ทำงานเหมือนเดิมแต่ **ต่างกันที่ตัวเลข** ให้รับตัวเลขนั้นเข้ามาทางวงเล็บ ตัวแปรในวงเล็บเรียกว่า **parameter**' },
      { code: 'void beep(int times) {          // times รับค่าที่ส่งมา\n  for (int i = 0; i < times; i++) {\n    Serial.println("beep");\n  }\n}\n\nvoid setup() {\n  Serial.begin(9600);\n  beep(2);                      // times = 2\n  beep(5);                      // times = 5\n}' },
      {
        list: [
          'parameter ต้องบอก **ชนิด** ด้วย เหมือนประกาศตัวแปร: `int times`',
          'รับหลายค่าได้ คั่นด้วย `,` : `void move(int speed, int ms)`',
          'ตอนเรียกต้องส่งค่าให้ **ครบจำนวนและถูกลำดับ** ส่งขาดได้ error `too few arguments` ส่งเกินได้ `too many arguments`',
          'parameter ใช้ได้ **เฉพาะในฟังก์ชันนั้น** ข้างนอกมองไม่เห็น',
        ],
      },
      { tip: '`delay()` รับค่าเป็นมิลลิวินาที 1 วินาที = 1000 จึงเขียน `delay(sec * 1000);`' },
    ],
  },
  world: {
    map: ['#######', '#W.G.W#', '#.....#', '#.T.B.#', '#######'],
    dir: 'N',
    api: ['engineOn', 'engineOff'],
    pod: {},
  },
  puzzles: [
    {
      id: '3-2-a',
      kind: 'blank',
      title: 'รับค่าทางวงเล็บ',
      mission: 'ฟังก์ชัน burn จุดเครื่องยนต์ตามจำนวนวินาทีที่ส่งมา เติมชื่อ parameter แล้วสั่งจุด 2 วินาที ตามด้วย 4 วินาที',
      hints: ['ในฟังก์ชันใช้ชื่อ sec ตอนคำนวณ delay ดังนั้น parameter ต้องชื่อ sec', 'void burn(int sec) แล้วเรียก burn(2); และ burn(4);'],
      code: 'void burn(int {{0}}) {\n  engineOn();\n  delay(sec * 1000);\n  engineOff();\n}\n\nvoid setup() {\n  burn({{1}});\n  burn({{2}});\n}\n\nvoid loop() {\n}',
      bank: ['sec', '2', '4', 'burn', '4000'],
      answer: ['sec', '2', '4'],
      goal: { burns: [2, 4] },
    },
    {
      id: '3-2-b',
      kind: 'fix',
      title: 'ส่งค่าไม่ครบ',
      mission: 'ต้องจุด 3 วินาที แล้วจุดอีก 1 วินาที แต่การเรียก burn ทั้งสองบรรทัดส่งค่าผิดจำนวน อ่าน error แล้วแก้',
      hints: ['burn ถูกสร้างให้รับค่า 1 ตัว (int sec) จึงต้องส่ง 1 ตัวพอดี ไม่ขาดไม่เกิน', 'บรรทัดแรก burn(3); บรรทัดที่สอง burn(1);'],
      code: 'void burn(int sec) {\n  engineOn();\n  delay(sec * 1000);\n  engineOff();\n}\n\nvoid setup() {\n  burn();\n  burn(1, 3);\n}\n\nvoid loop() {\n}',
      fixes: {
        8: { options: ['burn();', 'burn(3);', 'burn(sec);'], answer: 1 },
        9: { options: ['burn(1, 3);', 'burn(1);', 'burn(3);'], answer: 1 },
      },
      goal: { burns: [3, 1] },
    },
    {
      id: '3-2-c',
      kind: 'type',
      title: 'เร่งหนีสามจังหวะ',
      mission: 'เขียนฟังก์ชัน burn ที่รับจำนวนวินาทีเอง แล้วจุดเครื่องยนต์ 3 ครั้ง: 2 วินาที, 1 วินาที และ 3 วินาที ตามลำดับ',
      hints: [
        'void burn(int sec) { engineOn(); delay(sec * 1000); engineOff(); }',
        'ใน setup: burn(2); burn(1); burn(3);',
      ],
      starter: '// เขียนฟังก์ชัน burn ที่รับจำนวนวินาที\n// ข้างใน: engineOn(); รอตามจำนวนวินาที แล้ว engineOff();\n\n\nvoid setup() {\n  // จุด 2 วินาที, 1 วินาที, 3 วินาที\n\n}\n\nvoid loop() {\n}',
      solution: 'void burn(int sec) {\n  engineOn();\n  delay(sec * 1000);\n  engineOff();\n}\n\nvoid setup() {\n  burn(2);\n  burn(1);\n  burn(3);\n}\n\nvoid loop() {\n}',
      require: [{ re: '\\bvoid\\s+(?!setup\\b|loop\\b)\\w+\\s*\\(\\s*(int|long|float|byte|unsigned)\\b[^)]*\\)\\s*\\{', msg: 'ข้อนี้ต้องสร้างฟังก์ชันที่รับค่าทางวงเล็บ เช่น void burn(int sec)' }],
      goal: { burns: [2, 1, 3] },
      win: 'พ้นระยะยิงของเคลธแล้ว!',
    },
  ],
};

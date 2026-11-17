import { Level } from '../../types';

// 3-5 ตัวแปร local / global (P06 · คู่มือหัวข้อ 10) — ด่านท้ายองก์ 3
export const n05: Level = {
  id: '3-5',
  act: 3,
  title: 'นับรอบสแกน',
  concept: 'ตัวแปร local และ global',
  ref: 'P06 · คู่มือหัวข้อ 10',
  story: `ยานลอยใต้ร่มอยู่เหนือป่าทึบ
เรดาร์ต้องกวาดสแกนพื้นให้ครบ 3 รอบ จึงจะหาลานโล่งเจอ
โปรแกรมนับรอบอยู่ใน loop() ซึ่งทำงานรอบละ 1 การสแกน
แต่ตัวนับไม่เคยไปถึง 3 สักที
มาลี: ทำไมมันนับ 1 อยู่นั่นแหละ! เราลอยเลยจุดลงไปเรื่อย ๆ แล้วนะ`,
  outro: `ขาตั้งแตะพื้นนุ่ม ๆ ฝุ่นสีฟ้าฟุ้งขึ้นรอบยาน
ประตูเปิดออก อากาศของดาวเวฬาหอมเหมือนฝนตกใหม่
ไกลออกไป มีซากสถานีเก่าโผล่พ้นยอดไม้
มาลี: ตรงนั้นอาจมีวิทยุ มีอะไหล่ มีทางกลับขึ้นไป
บิต: บี๊บ > ไปต่อ
— จบองก์ 3`,
  lesson: {
    title: 'ตัวแปรมองเห็นได้แค่ไหน',
    blocks: [
      { p: 'ตัวแปรมีชีวิตอยู่ใน **ปีกกา `{ }` ที่มันถูกประกาศ** เท่านั้น ออกนอกปีกกาแล้วหายไป และฟังก์ชันอื่นมองไม่เห็น เรียกว่าตัวแปร **local**' },
      { code: 'int total = 0;            // global: ประกาศนอกทุกฟังก์ชัน\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int now = 5;            // local: เกิดใหม่ทุกรอบของ loop\n  total = total + now;    // total จำค่าข้ามรอบได้\n  Serial.println(total);  // 5 10 15 …\n}' },
      {
        list: [
          '**local** ประกาศในฟังก์ชัน: ทุกครั้งที่ฟังก์ชันเริ่มใหม่ ตัวแปรเกิดใหม่ ค่าเดิมหาย',
          '**global** ประกาศบนสุดนอกทุกฟังก์ชัน: ทุกฟังก์ชันใช้ได้ และ **จำค่าไว้ตลอด**',
          'ใช้ตัวแปรที่อยู่ในปีกกาอื่น ได้ error `was not declared in this scope`',
          'ถ้ามี local ชื่อซ้ำกับ global ในฟังก์ชันนั้นจะเห็นตัว local (ตัว global ถูกบัง) ระวังประกาศซ้ำโดยไม่ตั้งใจ',
        ],
      },
      { tip: 'ใช้ local เป็นหลัก ใช้ global เฉพาะค่าที่ต้อง "จำข้ามรอบ" หรือใช้ร่วมกันหลายฟังก์ชัน ดูแถบตัวแปรตอนรัน: ตัว global มีเครื่องหมายบอก' },
    ],
  },
  world: {
    map: ['#######', '#W.G.W#', '#.....#', '#.T.B.#', '#######'],
    dir: 'N',
    api: ['beginDescent'],
    pod: {},
    loops: 4,
  },
  puzzles: [
    {
      id: '3-5-a',
      kind: 'fix',
      title: 'ตัวนับที่ลืมทุกรอบ',
      mission: 'loop() ทำงาน 4 รอบ ต้องพิมพ์ 1 2 3 4 และเริ่มลงจอดเมื่อครบรอบที่ 3 กดรันดูแถบตัวแปร: scan กลับเป็น 1 ทุกรอบ ย้ายการประกาศไปไว้ที่ที่มันจำค่าได้',
      hints: [
        'int scan = 0; อยู่ใน loop() จึงถูกสร้างใหม่เป็น 0 ทุกรอบ',
        'บรรทัด 1: เลือก int scan = 0; (ประกาศแบบ global) และบรรทัดใน loop เลือกแบบว่าง ถ้าเหลือไว้ทั้งสองที่ ตัวใน loop จะบังตัว global',
      ],
      code: '\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int scan = 0;\n  scan++;\n  Serial.println(scan);\n  if (scan == 3) {\n    beginDescent();\n  }\n}',
      fixes: {
        1: { options: ['', 'int scan = 0;', 'const int scan = 0;'], answer: 1 },
        7: { options: ['int scan = 0;', '', 'scan = 0;'], answer: 1 },
      },
      goal: { serial: '1\n2\n3\n4', calledTimes: { beginDescent: 1 } },
    },
    {
      id: '3-5-b',
      kind: 'fix',
      title: 'มองไม่เห็นกัน',
      mission: 'เชื้อเพลิงเริ่มที่ 90 ลดรอบละ 20 ต้องพิมพ์ 70 50 30 แต่โปรแกรมไม่ผ่านคอมไพเลอร์ อ่าน error แล้วย้ายตัวแปรไปที่ที่ loop() มองเห็น',
      hints: [
        'fuel ถูกประกาศในปีกกาของ setup() พอออกจาก setup ก็หายไป loop() จึงไม่รู้จัก',
        'บรรทัด 1 เลือก int fuel = 90; และบรรทัดใน setup เลือกแบบว่าง',
      ],
      world: { api: [], loops: 3 },
      code: '\nvoid setup() {\n  Serial.begin(9600);\n  int fuel = 90;\n}\n\nvoid loop() {\n  fuel = fuel - 20;\n  Serial.println(fuel);\n}',
      fixes: {
        1: { options: ['', 'int fuel = 90;', 'int fuel;'], answer: 1 },
        4: { options: ['int fuel = 90;', '', 'fuel = 0;'], answer: 1 },
      },
      goal: { serial: '70\n50\n30' },
    },
    {
      id: '3-5-c',
      kind: 'type',
      title: 'ลงจอดบนดาวเวฬา',
      mission: 'ด่านท้ายองก์: loop() ทำงาน 5 รอบ (รอบละ 1 การสแกน) นับรอบด้วยตัวแปร global แล้วพิมพ์เลขรอบทุกรอบ (1 ถึง 5) และเมื่อครบรอบที่ 3 "เท่านั้น" ให้เรียกฟังก์ชัน land() ที่คุณเขียนเอง ซึ่งสั่ง beginDescent(); แล้ว extendLegs(); (กางขาตั้ง)',
      hints: [
        'บนสุด: int scan = 0; และ void land() { beginDescent(); extendLegs(); }',
        'ใน loop: scan++; Serial.println(scan); if (scan == 3) { land(); }',
      ],
      world: { api: ['beginDescent', 'extendLegs'], loops: 5 },
      starter: '// ประกาศตัวนับรอบแบบ global ตรงนี้\n\n// เขียนฟังก์ชัน void land()\n// ข้างใน: beginDescent(); แล้ว extendLegs();\n\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  // เพิ่มตัวนับ พิมพ์เลขรอบ\n  // ครบรอบที่ 3 ให้เรียก land();\n\n}',
      solution: 'int scan = 0;\n\nvoid land() {\n  beginDescent();\n  extendLegs();\n}\n\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  scan++;\n  Serial.println(scan);\n  if (scan == 3) {\n    land();\n  }\n}',
      require: [{ re: '\\bvoid\\s+(?!setup\\b|loop\\b)\\w+\\s*\\(\\s*\\)\\s*\\{', msg: 'ข้อนี้ต้องสร้างฟังก์ชัน land() ของตัวเอง' }],
      goal: { serial: '1\n2\n3\n4\n5', calledTimes: { beginDescent: 1, extendLegs: 1 } },
      win: 'ถึงพื้นดาวเวฬาแล้ว!',
    },
  ],
};

import { Level } from '../../types';

// 1-5 ค่าคงที่และขาของบอร์ด (P02 · คู่มือหัวข้อ 4 และ 14)
export const l05: Level = {
  id: '1-5',
  act: 1,
  title: 'ทางเดินมืด',
  concept: 'const, pinMode, digitalWrite, delay',
  ref: 'P02 · คู่มือหัวข้อ 4, 14',
  story: `พ้นห้องปรับความดันคือทางเดินซ่อมบำรุง
มืดสนิท เคลธตัดไฟทั้งโซน
คุณคลำเจอช่องเสียบบอร์ดบนผนัง สายของโคมไฟฉุกเฉินกับตัวล็อกประตูยังต่ออยู่
โคมไฟอยู่ที่ขา 13 ตัวล็อกอยู่ที่ขา 7
มีบางอย่างขยับอยู่ในความมืดข้างหน้า`,
  outro: `ไฟฉุกเฉินสีขาวอมฟ้าไล่ความมืดออกไป
ไม่มีอะไรอยู่ตรงนั้นแล้ว
มีแต่รอยกรงเล็บสามเส้น ลากยาวบนผนังไปตลอดทาง`,
  lesson: {
    title: 'ค่าคงที่ และการสั่งขาของบอร์ด',
    blocks: [
      { p: 'ค่าที่ไม่ควรเปลี่ยนระหว่างโปรแกรมทำงาน เช่น เลขขา ให้ใส่ `const` และตั้งชื่อ **ตัวพิมพ์ใหญ่ทั้งหมด**' },
      { code: 'const int LAMP_PIN = 13;      // เผลอเปลี่ยนค่าจะ error ทันที\n\nvoid setup() {\n  pinMode(LAMP_PIN, OUTPUT);     // ตั้งขาเป็น "ส่งไฟออก"\n  digitalWrite(LAMP_PIN, HIGH);  // HIGH = จ่ายไฟ, LOW = หยุดจ่าย\n  delay(1000);                   // รอ 1000 ms = 1 วินาที\n}' },
      {
        list: [
          'ต้อง `pinMode(ขา, OUTPUT)` ก่อน ไม่อย่างนั้นไฟออกมาอ่อนจนอุปกรณ์ไม่ทำงาน',
          'แบบเก่า `#define LED_PIN 13` **ไม่มี** `;` และ **ไม่มี** `=`',
          'แก้ค่า const → error `assignment of read-only variable`',
        ],
      },
      { tip: 'ทำไมต้องตั้งชื่อ: ถ้าวันหนึ่งย้ายสายไปขาอื่น แก้ที่บรรทัดเดียว ทั้งโปรแกรมเปลี่ยนตาม' },
    ],
  },
  world: {
    map: ['  ...  ', '###D###', '#L...L#', '#.....#', '#..B..#', '#######'],
    dir: 'N',
    dark: true,
    pins: { 13: 'lamp', 7: 'lock' },
  },
  puzzles: [
    {
      id: '1-5-a',
      kind: 'blank',
      title: 'เปิดไฟฉุกเฉิน',
      mission: 'โคมไฟต่ออยู่ที่ขา 13 ตั้งชื่อค่าคงที่ให้เลขขา ตั้งขาเป็นส่งออก แล้วจ่ายไฟ',
      hints: ['ค่าคงที่ขึ้นต้นด้วย const และโคมไฟอยู่ที่ขา 13', 'pinMode(LAMP_PIN, OUTPUT); แล้ว digitalWrite(LAMP_PIN, HIGH);'],
      code: '{{0}} int LAMP_PIN = {{1}};\n\nvoid setup() {\n  pinMode(LAMP_PIN, {{2}});\n  digitalWrite({{3}}, HIGH);\n}\n\nvoid loop() {\n}',
      bank: ['const', '13', '7', 'OUTPUT', 'INPUT', 'LAMP_PIN', 'LOW'],
      answer: ['const', '13', 'OUTPUT', 'LAMP_PIN'],
      goal: { pins: { 13: 1 } },
    },
    {
      id: '1-5-b',
      kind: 'fix',
      title: 'ค่าคงที่ที่มีคนพยายามแก้',
      mission: 'ต้องเปิดทั้งโคมไฟ (ขา 13) และตัวล็อกประตู (ขา 7) โค้ดนี้ผิด 2 จุด สังเกตว่า error ตัวแรกชี้ไปบรรทัดไหน',
      hints: [
        '#define ไม่ต้องมี ; ต่อท้าย error จึงไปโผล่ตรงบรรทัดที่ใช้ LOCK_PIN ไม่ใช่บรรทัดที่ผิดจริง',
        'LAMP_PIN เป็น const เปลี่ยนค่าไม่ได้ บรรทัดนั้นควรเป็นคำสั่งเปิดไฟ: digitalWrite(LAMP_PIN, HIGH);',
      ],
      code: 'const int LAMP_PIN = 13;\n#define LOCK_PIN 7;\n\nvoid setup() {\n  pinMode(LAMP_PIN, OUTPUT);\n  pinMode(LOCK_PIN, OUTPUT);\n  LAMP_PIN = 12;\n  digitalWrite(LOCK_PIN, HIGH);\n}\n\nvoid loop() {\n}',
      fixes: {
        2: { options: ['#define LOCK_PIN 7;', '#define LOCK_PIN 7', '#define LOCK_PIN = 7'], answer: 1 },
        7: { options: ['LAMP_PIN = 12;', 'digitalWrite(LAMP_PIN, HIGH);', 'const LAMP_PIN = HIGH;'], answer: 1 },
      },
      goal: { pins: { 13: 1, 7: 1 }, door: 'open' },
    },
    {
      id: '1-5-c',
      kind: 'type',
      title: 'เปิดไฟก่อน แล้วค่อยเปิดประตู',
      mission: 'ทางเดินช่วงถัดไป: เปิดโคมไฟ (ขา 13) รอ 1 วินาทีให้ตาปรับแสง แล้วจึงปลดล็อกประตู (ขา 7) เขียนเองทั้งหมด',
      hints: [
        'ประกาศ const int LAMP_PIN = 13; และ const int LOCK_PIN = 7; ไว้นอก setup()',
        'ใน setup(): pinMode สองบรรทัด → digitalWrite(LAMP_PIN, HIGH); → delay(1000); → digitalWrite(LOCK_PIN, HIGH);',
      ],
      starter: '// โคมไฟ = ขา 13   ตัวล็อกประตู = ขา 7\n// 1) ประกาศค่าคงที่ LAMP_PIN และ LOCK_PIN\n\n\nvoid setup() {\n  // 2) ตั้งทั้งสองขาเป็น OUTPUT\n\n  // 3) เปิดไฟ → รอ 1000 ms → ปลดล็อก\n\n}\n\nvoid loop() {\n}',
      solution: 'const int LAMP_PIN = 13;\nconst int LOCK_PIN = 7;\n\nvoid setup() {\n  pinMode(LAMP_PIN, OUTPUT);\n  pinMode(LOCK_PIN, OUTPUT);\n  digitalWrite(LAMP_PIN, HIGH);\n  delay(1000);\n  digitalWrite(LOCK_PIN, HIGH);\n}\n\nvoid loop() {\n}',
      require: [{ re: '(const\\s+\\w+\\s+LAMP_PIN|#define\\s+LAMP_PIN)', msg: 'ข้อนี้ต้องประกาศค่าคงที่ชื่อ LAMP_PIN (const int LAMP_PIN = 13;)' }],
      goal: { pins: { 13: 1, 7: 1 }, door: 'open', minDelay: 1000 },
    },
  ],
};

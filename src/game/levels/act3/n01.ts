import { Level } from '../../types';

// 3-1 ฟังก์ชัน void ไม่รับค่า (P06 · คู่มือหัวข้อ 10)
export const n01: Level = {
  id: '3-1',
  act: 3,
  title: 'ขั้นตอนปล่อยยาน',
  concept: 'สร้างฟังก์ชันของตัวเอง',
  ref: 'P06 · คู่มือหัวข้อ 10',
  story:
    'บิตกับมาลีเข้ามาในยานกู้ชีพแล้ว กลางห้องโดยสารมีภาพจำลองของยานลอยอยู่ แขนยึดสีส้ม 3 ตัวยังจับยานไว้กับอรุณ-7 แต่ละตัวต้องปลดสองขั้น: unlockClamp(); แล้ว releaseClamp(); มาลีบ่น "ต้องพิมพ์สองบรรทัดนี้ซ้ำสามรอบเลยเหรอ"',
  outro: 'แขนยึดตัวสุดท้ายหลุดออก ยานกู้ชีพลอยเป็นอิสระ มาลียิ้ม "ตั้งชื่อให้ชุดคำสั่งแล้วเรียกใช้ซ้ำ ง่ายกว่ากันเยอะ"',
  lesson: {
    title: 'ฟังก์ชัน: ตั้งชื่อให้ชุดคำสั่ง',
    blocks: [
      { p: 'ชุดคำสั่งที่ต้องใช้หลายครั้ง ให้ **ตั้งชื่อ** แล้วเรียกชื่อนั้นแทน นี่คือ **ฟังก์ชัน** ที่จริง `setup()` กับ `loop()` ก็เป็นฟังก์ชัน' },
      { code: 'void blinkTwice() {        // สร้าง (เขียนครั้งเดียว นอก setup)\n  digitalWrite(13, HIGH);\n  digitalWrite(13, LOW);\n}\n\nvoid setup() {\n  blinkTwice();            // เรียกใช้\n  blinkTwice();            // เรียกอีกกี่ครั้งก็ได้\n}' },
      {
        list: [
          '`void` แปลว่าฟังก์ชันนี้ **ไม่คืนค่า** ทำงานเสร็จแล้วจบ',
          'สร้างไว้ **นอก** `setup()` และ `loop()` ห้ามสร้างฟังก์ชันซ้อนในฟังก์ชัน',
          'ตอนเรียกต้องมี `()` เสมอ: `blinkTwice();` ถ้าเขียน `blinkTwice;` เครื่องไม่ฟ้อง แต่ไม่ทำอะไรเลย',
          'ชื่อต้องตรงทุกตัวอักษร `BlinkTwice` กับ `blinkTwice` เป็นคนละชื่อ',
        ],
      },
      { tip: 'ดูบรรทัดที่ไฮไลต์ตอนรัน: พอเรียกฟังก์ชัน เครื่องจะกระโดดเข้าไปทำข้างใน เสร็จแล้วกลับมาบรรทัดถัดจากที่เรียก' },
    ],
  },
  world: {
    map: ['#######', '#W.G.W#', '#.....#', '#.T.B.#', '#######'],
    dir: 'N',
    api: ['unlockClamp', 'releaseClamp'],
    pod: { clamps: 3 },
  },
  puzzles: [
    {
      id: '3-1-a',
      kind: 'blank',
      title: 'ตั้งชื่อชุดคำสั่ง',
      mission: 'สร้างฟังก์ชัน freeClamp ที่ปลดแขนยึด 1 ตัว (ปลดล็อก แล้วปล่อย) แล้วเรียกให้ครบ 3 ตัว',
      hints: ['ฟังก์ชันที่ไม่คืนค่าขึ้นต้นด้วย void และหลังชื่อต้องมี ()', 'void freeClamp() { … } และบรรทัดสุดท้ายเรียก freeClamp();'],
      code: '{{0}} freeClamp{{1}} {\n  unlockClamp();\n  releaseClamp();\n}\n\nvoid setup() {\n  freeClamp();\n  freeClamp();\n  {{2}}();\n}\n\nvoid loop() {\n}',
      bank: ['void', '()', 'freeClamp', 'releaseClamp', 'int', ';'],
      answer: ['void', '()', 'freeClamp'],
      goal: { clampsLeft: 0 },
    },
    {
      id: '3-1-b',
      kind: 'fix',
      title: 'เรียกแล้วไม่ทำ',
      mission: 'โปรแกรมนี้มีที่ผิด 2 บรรทัดตอนเรียกฟังก์ชัน กดรันดูก่อน แก้ทีละที่ แล้วปลดแขนยึดให้ครบ 3 ตัว',
      hints: [
        'ที่แรกเครื่องฟ้อง: ชื่อฟังก์ชันต้องสะกดตรงกับตอนสร้างทุกตัว รวมตัวพิมพ์เล็ก-ใหญ่',
        'ที่สองเครื่องไม่ฟ้อง แต่แขนยึดเหลือ 1 ตัว: บรรทัด freeClamp; ไม่มี () จึงไม่ได้เรียก',
      ],
      code: 'void freeClamp() {\n  unlockClamp();\n  releaseClamp();\n}\n\nvoid setup() {\n  FreeClamp();\n  freeClamp();\n  freeClamp;\n}\n\nvoid loop() {\n}',
      fixes: {
        7: { options: ['FreeClamp();', 'freeClamp();', 'freeclamp();'], answer: 1 },
        9: { options: ['freeClamp;', 'freeClamp();', 'void freeClamp();'], answer: 1 },
      },
      goal: { clampsLeft: 0 },
    },
    {
      id: '3-1-c',
      kind: 'type',
      title: 'ยานลำที่สอง',
      mission: 'ยานกู้ชีพสำรองมีแขนยึด 4 ตัว เขียนฟังก์ชันปลดแขนยึดเอง (ตั้งชื่อเองได้) แล้วเรียกใช้ให้ครบ 4 ตัว',
      hints: [
        'สร้างฟังก์ชันไว้เหนือ setup: void freeClamp() { unlockClamp(); releaseClamp(); }',
        'ใน setup เรียก freeClamp(); 4 ครั้ง หรือใช้ for วน 4 รอบก็ได้',
      ],
      world: { pod: { clamps: 4 } },
      starter: '// สร้างฟังก์ชันปลดแขนยึด 1 ตัว ไว้ตรงนี้\n// ข้างใน: unlockClamp(); แล้ว releaseClamp();\n\n\nvoid setup() {\n  // เรียกฟังก์ชันของคุณให้ครบ 4 ตัว\n\n}\n\nvoid loop() {\n}',
      solution: 'void freeClamp() {\n  unlockClamp();\n  releaseClamp();\n}\n\nvoid setup() {\n  for (int i = 0; i < 4; i++) {\n    freeClamp();\n  }\n}\n\nvoid loop() {\n}',
      require: [{ re: '\\bvoid\\s+(?!setup\\b|loop\\b)\\w+\\s*\\(\\s*\\)\\s*\\{', msg: 'ข้อนี้ต้องสร้างฟังก์ชันของตัวเอง (นอกเหนือจาก setup และ loop)' }],
      goal: { clampsLeft: 0 },
      win: 'ยานกู้ชีพหลุดจากอรุณ-7 แล้ว!',
    },
  ],
};

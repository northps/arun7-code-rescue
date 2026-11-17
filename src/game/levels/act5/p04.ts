import { Level } from '../../types';

const NEAR = ['#######', '#.....#', '#..X..#', '#.....#', '#..B..#', '#######'];
const FAR = ['#######', '#..X..#', '#.....#', '#.....#', '#..B..#', '#######'];
const OPEN = ['#######', '#.....#', '#.....#', '#.....#', '#..B..#', '#######'];

// 5-4 เซนเซอร์วัดระยะ (R05)
export const p04: Level = {
  id: '5-4',
  act: 5,
  title: 'ตาของบิต',
  concept: 'readDistance() และการเฉลี่ยค่าที่กระตุก',
  ref: 'R05 · เซนเซอร์วัดระยะ',
  story: `วิ่งตามเวลาอย่างเดียวไม่พอ ถ้ามีหินกลิ้งมาขวาง บิตจะชนทุกครั้ง
ในกล่องอะไหล่มีเซนเซอร์อัลตราโซนิกเหลืออยู่ตัวเดียว
มาลีติดมันไว้ที่หน้าของบิต
มาลี: มันส่งเสียงออกไป แล้วจับเวลาที่เสียงสะท้อนกลับมา ไกลแค่ไหนมันบอกเป็นเซนติเมตร
มาลี: แต่ค่ามันชอบกระตุกนะ อย่าเชื่อตัวเลขตัวเดียว`,
  outro: `ตัวเลขระยะนิ่งขึ้นหลังเฉลี่ย
บิตเห็นหินก่อนจะถึงตัว เป็นครั้งแรก
มาลีโบกมือเล่นหน้าเซนเซอร์
มาลี: ทีนี้เธอก็มีตาแล้ว`,
  lesson: {
    title: 'อ่านระยะด้วย readDistance()',
    blocks: [
      { p: '`readDistance()` คืนระยะจากหน้ารถถึงสิ่งกีดขวางที่อยู่ **ตรงหน้า** เป็นเซนติเมตร (จำนวนเต็ม) ใช้เหมือนฟังก์ชันที่คืนค่าทั่วไป' },
      { code: 'int d = readDistance();\nSerial.print(d);\nSerial.println(" cm");      // เช่น 176 cm' },
      {
        list: [
          'เซนเซอร์เห็นเฉพาะด้านหน้า ไม่เห็นด้านข้างหรือด้านหลัง',
          'ค่าจากเซนเซอร์จริง **กระตุก** ได้ครั้งละหลายเซนติเมตร ทั้งที่ของไม่ได้ขยับ',
          'วิธีแก้: อ่านหลายครั้งแล้วหา **ค่าเฉลี่ย** (รวมทุกค่า แล้วหารด้วยจำนวนครั้ง)',
          'เว้น `delay(50);` ระหว่างการอ่านแต่ละครั้ง ให้เสียงสะท้อนของครั้งก่อนหายไปก่อน',
        ],
      },
      { code: 'int readAverage() {\n  int total = 0;\n  for (int i = 0; i < 5; i++) {\n    total += readDistance();\n    delay(50);\n  }\n  return total / 5;\n}' },
      { tip: 'ในฉาก ลำแสงสีฟ้าจากหน้าบิตคือทิศที่เซนเซอร์วัด และตัวเลขที่ลอยขึ้นคือค่าที่อ่านได้' },
    ],
  },
  world: {
    map: FAR,
    dir: 'N',
    theme: 'planet',
    drive: {},
  },
  puzzles: [
    {
      id: '5-4-a',
      kind: 'blank',
      title: 'อ่านค่าครั้งแรก',
      mission: 'เติมคำสั่งให้อ่านระยะถึงก้อนหินตรงหน้า แล้วพิมพ์ออก Serial ในบรรทัดเดียวกันตามด้วย cm (เช่น 176 cm) เกมจะย้ายก้อนหินไปหลายตำแหน่ง',
      hints: ['คำสั่งอ่านระยะคือ readDistance()', 'พิมพ์ตัวเลขด้วย print (ไม่ขึ้นบรรทัด) แล้วพิมพ์ " cm" ด้วย println'],
      code: `void setup() {
  Serial.begin(9600);
  int d = {{0}}();
  Serial.{{1}}(d);
  Serial.{{2}}(" cm");
}

void loop() {
}`,
      bank: ['readDistance', 'print', 'println', 'setMotor', 'readNumber'],
      answer: ['readDistance', 'print', 'println'],
      goal: {},
      cases: [
        { label: 'หินอยู่ไกล', map: FAR, goal: { serial: '176 cm' } },
        { label: 'หินอยู่ใกล้', map: NEAR, goal: { serial: '96 cm' } },
        { label: 'ไม่มีหิน', map: OPEN, goal: { serial: '256 cm' } },
      ],
    },
    {
      id: '5-4-b',
      kind: 'fix',
      title: 'ค่ากระตุก',
      mission: 'เซนเซอร์อ่านได้ 182, 172, 174 ทั้งที่หินอยู่นิ่ง (ระยะจริง 176) โปรแกรมนี้ควรอ่าน 3 ครั้งแล้วพิมพ์ค่าเฉลี่ย แต่ได้เลขผิด มีที่ผิด 2 บรรทัด',
      hints: ['total = readDistance(); ทับค่าเดิมทุกรอบ ต้องบวกสะสมด้วย +=', 'อ่าน 3 ครั้ง ต้องหารด้วย 3'],
      world: { drive: { noise: [6, -4, -2] } },
      code: `void setup() {
  Serial.begin(9600);
  int total = 0;
  for (int i = 0; i < 3; i++) {
    total = readDistance();
    delay(50);
  }
  int avg = total / 2;
  Serial.println(avg);
}

void loop() {
}`,
      fixes: {
        5: { options: ['total = readDistance();', 'total += readDistance();', 'total -= readDistance();'], answer: 1 },
        8: { options: ['int avg = total / 2;', 'int avg = total / 3;', 'int avg = total * 3;'], answer: 1 },
      },
      goal: {},
      cases: [
        { label: 'หินอยู่ไกล', map: FAR, goal: { serial: '176' } },
        { label: 'หินอยู่ใกล้', map: NEAR, goal: { serial: '96' } },
      ],
    },
    {
      id: '5-4-c',
      kind: 'type',
      title: 'ใกล้หรือไกล',
      mission: 'เขียนฟังก์ชัน int readAverage() ที่อ่านระยะ 5 ครั้งแล้วคืนค่าเฉลี่ย จากนั้นใน setup พิมพ์ค่าเฉลี่ย 1 บรรทัด แล้วพิมพ์ NEAR ถ้าค่าเฉลี่ยต่ำกว่า 100 ไม่อย่างนั้นพิมพ์ FAR (ค่าที่อ่านแต่ละครั้งกระตุกไม่เท่ากัน อ่านครั้งเดียวจะได้เลขผิด)',
      hints: [
        'int readAverage() { int total = 0; for (int i = 0; i < 5; i++) { total += readDistance(); delay(50); } return total / 5; }',
        'ใน setup: int d = readAverage(); Serial.println(d); if (d < 100) { Serial.println("NEAR"); } else { Serial.println("FAR"); }',
      ],
      world: { drive: { noise: [5, -3, 2, -6, 2] } },
      starter: `// เขียน int readAverage(): อ่าน 5 ครั้ง คืนค่าเฉลี่ย


void setup() {
  Serial.begin(9600);
  // พิมพ์ค่าเฉลี่ย แล้วพิมพ์ NEAR (ต่ำกว่า 100) หรือ FAR

}

void loop() {
}`,
      solution: `int readAverage() {
  int total = 0;
  for (int i = 0; i < 5; i++) {
    total += readDistance();
    delay(50);
  }
  return total / 5;
}

void setup() {
  Serial.begin(9600);
  int d = readAverage();
  Serial.println(d);
  if (d < 100) {
    Serial.println("NEAR");
  } else {
    Serial.println("FAR");
  }
}

void loop() {
}`,
      require: [
        { re: '\\bint\\s+readAverage\\s*\\(\\s*\\)\\s*\\{', msg: 'ข้อนี้ต้องเขียนฟังก์ชัน int readAverage() เอง' },
        { re: '\\breturn\\b', msg: 'readAverage ต้องส่งค่าเฉลี่ยกลับด้วย return' },
      ],
      goal: { calledTimes: { readDistance: 5 } },
      cases: [
        { label: 'หินอยู่ไกล', map: FAR, goal: { serial: '176\nFAR' } },
        { label: 'หินอยู่ใกล้', map: NEAR, goal: { serial: '96\nNEAR' } },
      ],
    },
  ],
};

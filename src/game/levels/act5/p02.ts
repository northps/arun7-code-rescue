import { Level } from '../../types';

// 5-2 เลี้ยวด้วยเวลา (R03)
export const p02: Level = {
  id: '5-2',
  act: 5,
  title: 'เลี้ยวให้ได้มุม',
  concept: 'turnLeft / turnRight และค่าคงที่ TURN_MS',
  ref: 'R03 · มอเตอร์และฟังก์ชัน',
  story:
    'ทางออกจากสถานีไม่ได้เป็นเส้นตรง ต้องเลี้ยวผ่านซากกำแพง บิตไม่มีพวงมาลัย มีแค่ล้อสองข้าง มาลีวาดรูปบนพื้นดิน "ล้อหนึ่งเดินหน้า อีกล้อถอยหลัง เธอจะหมุนอยู่กับที่ หมุนนานแค่ไหนได้มุมเท่านั้น"',
  outro: 'บิตเลี้ยวฉากเป๊ะสองครั้งแล้วจอดบนจุดนัดพบ มาลีจดตัวเลขลงสมุด "300 มิลลิวินาทีต่อ 90 องศา จำค่านี้ไว้ เราจะใช้มันอีกเยอะ"',
  lesson: {
    title: 'เลี้ยวด้วยล้อสองข้าง',
    blocks: [
      { p: 'ให้ล้อสองข้างหมุน **สวนทางกัน** รถจะหมุนอยู่กับที่ ล้อข้างที่เดินหน้าจะดันรถให้หันไปทางตรงข้าม' },
      { code: 'setMotor(150, -150);   // ล้อซ้ายเดินหน้า ล้อขวาถอย: หมุนไปทางขวา\nsetMotor(-150, 150);   // ล้อซ้ายถอย ล้อขวาเดินหน้า: หมุนไปทางซ้าย' },
      { p: 'มุมที่ได้ขึ้นกับ **เวลา** ที่ปล่อยให้หมุน ในเกมนี้ความเร็ว 150 หมุนได้ **90 องศาใน 300 ms** เก็บเลขนี้เป็นค่าคงที่ จะได้แก้ที่เดียว' },
      { code: 'const int TURN_MS = 300;   // เวลาที่ใช้หมุน 90 องศา\n\nvoid turnRight() {\n  setMotor(150, -150);\n  delay(TURN_MS);\n  stopCar();               // หมุนครบแล้วหยุด\n}\n\nvoid turnLeft() {\n  setMotor(-150, 150);\n  delay(TURN_MS);\n  stopCar();\n}' },
      {
        list: [
          'หมุนนานเกิน = เลยมุม · หมุนสั้นไป = ไม่ถึงมุม แล้วรถจะวิ่งเฉียงไปชน',
          '`delay(TURN_MS * 2)` คือกลับหลังหัน 180 องศา',
          'บนรถจริงค่า TURN_MS ต้องลองเอง เพราะขึ้นกับพื้น แบตเตอรี่ และน้ำหนักรถ',
        ],
      },
      { tip: 'เรียก turnRight(); แล้วรถหยุดอยู่ ต้องสั่ง forward(); อีกครั้งจึงจะวิ่งต่อ' },
    ],
  },
  world: {
    map: ['#######', '#....P#', '#.....#', '#.B...#', '#######'],
    dir: 'N',
    theme: 'planet',
    drive: {},
  },
  puzzles: [
    {
      id: '5-2-a',
      kind: 'blank',
      title: 'เลี้ยวขวา 90 องศา',
      mission: 'บิตต้องวิ่งขึ้นไป 2 ช่อง เลี้ยวขวา แล้ววิ่งอีก 3 ช่องไปหยุดบนวงสีเขียว เติมฟังก์ชัน turnRight ให้หมุนขวา 90 องศาพอดี',
      hints: ['หมุนขวา: ล้อซ้ายเดินหน้า ล้อขวาถอยหลัง คือ setMotor(150, -150)', 'หมุน 90 องศาใช้เวลา TURN_MS (300 ms)'],
      code: `const int TURN_MS = 300;

void forward() {
  setMotor(150, 150);
}

void stopCar() {
  setMotor(0, 0);
}

void turnRight() {
  setMotor(150, {{0}});
  delay({{1}});
  stopCar();
}

void setup() {
  forward();
  delay(1000);
  turnRight();
  forward();
  delay(1500);
  stopCar();
}

void loop() {
}`,
      bank: ['-150', '150', '0', 'TURN_MS', '1000'],
      answer: ['-150', 'TURN_MS'],
      goal: { at: 'pad', stopped: true },
    },
    {
      id: '5-2-b',
      kind: 'fix',
      title: 'หมุนเลยมุม',
      mission: 'เส้นทางนี้ต้องเลี้ยวซ้าย แต่กดรันแล้วบิตหมุนผิดทางและหมุนเลยไปถึงครึ่งรอบ มีที่ผิด 2 บรรทัด',
      hints: ['90 องศาใช้ 300 ms ค่า 600 จึงหมุนไป 180 องศา', 'หมุนซ้าย: ล้อซ้ายถอย ล้อขวาเดินหน้า คือ setMotor(-150, 150);'],
      world: { map: ['#######', '#P....#', '#.....#', '#...B.#', '#######'] },
      code: `const int TURN_MS = 600;

void forward() {
  setMotor(150, 150);
}

void stopCar() {
  setMotor(0, 0);
}

void turnLeft() {
  setMotor(150, -150);
  delay(TURN_MS);
  stopCar();
}

void setup() {
  forward();
  delay(1000);
  turnLeft();
  forward();
  delay(1500);
  stopCar();
}

void loop() {
}`,
      fixes: {
        1: { options: ['const int TURN_MS = 600;', 'const int TURN_MS = 300;', 'const int TURN_MS = 150;'], answer: 1 },
        12: { options: ['setMotor(150, -150);', 'setMotor(-150, 150);', 'setMotor(-150, -150);'], answer: 1 },
      },
      goal: { at: 'pad', stopped: true },
    },
    {
      id: '5-2-c',
      kind: 'type',
      title: 'ทางซิกแซ็ก',
      mission: 'เขียน turnLeft() และ turnRight() เอง แล้วพาบิตไปตามทาง: ขึ้น 2 ช่องถึงธงแรก เลี้ยวขวาไป 2 ช่องถึงธงที่สอง เลี้ยวซ้ายขึ้นไปอีก 2 ช่อง แล้วหยุดบนวงสีเขียว',
      hints: [
        'void turnRight() { setMotor(150, -150); delay(TURN_MS); stopCar(); } และ turnLeft ใช้ setMotor(-150, 150);',
        'ใน setup: forward(); delay(1000); turnRight(); forward(); delay(1000); turnLeft(); forward(); delay(1000); stopCar();',
      ],
      world: { map: ['#######', '#...P.#', '#.....#', '#.F.F.#', '#.....#', '#.B...#', '#######'] },
      starter: `const int TURN_MS = 300;

void forward() {
  setMotor(150, 150);
}

void stopCar() {
  setMotor(0, 0);
}

// เขียน void turnLeft() และ void turnRight()


void setup() {
  // ขึ้น 2 ช่อง เลี้ยวขวา ไป 2 ช่อง เลี้ยวซ้าย ขึ้น 2 ช่อง แล้วหยุด

}

void loop() {
}`,
      solution: `const int TURN_MS = 300;

void forward() {
  setMotor(150, 150);
}

void stopCar() {
  setMotor(0, 0);
}

void turnLeft() {
  setMotor(-150, 150);
  delay(TURN_MS);
  stopCar();
}

void turnRight() {
  setMotor(150, -150);
  delay(TURN_MS);
  stopCar();
}

void setup() {
  forward();
  delay(1000);
  turnRight();
  forward();
  delay(1000);
  turnLeft();
  forward();
  delay(1000);
  stopCar();
}

void loop() {
}`,
      require: [
        { re: '\\bvoid\\s+turnLeft\\s*\\(\\s*\\)\\s*\\{', msg: 'ข้อนี้ต้องเขียนฟังก์ชัน void turnLeft() เอง' },
        { re: '\\bvoid\\s+turnRight\\s*\\(\\s*\\)\\s*\\{', msg: 'ข้อนี้ต้องเขียนฟังก์ชัน void turnRight() เอง' },
      ],
      goal: { at: 'pad', stopped: true, flags: true },
    },
  ],
};

import { Level } from '../../types';

const HELPERS = `void forward() {
  setMotor(150, 150);
}

void backward() {
  setMotor(-150, -150);
}

void spinLeft() {
  setMotor(-150, 150);
}

void spinRight() {
  setMotor(150, -150);
}

void stopCar() {
  setMotor(0, 0);
}
`;

const SWITCH = `  switch (current) {
    case 'F': forward(); break;
    case 'B': backward(); break;
    case 'L': spinLeft(); break;
    case 'R': spinRight(); break;
    default: stopCar(); break;
  }`;

// 6-4 รับคำสั่งทาง Serial: Serial.available() / Serial.read() / switch กับ char (R10)
export const q04: Level = {
  id: '6-4',
  act: 6,
  title: 'รีโมตจากพื้นดิน',
  concept: 'Serial.available(), Serial.read() และ switch กับ char',
  ref: 'R10 · รับคำสั่งทาง Serial',
  story: `ลานปล่อยเต็มไปด้วยซากที่แผนที่เก่าไม่มี โปรแกรมนำร่องไปต่อเองไม่ได้
มาลีปีนขึ้นหอควบคุมที่เหลืออยู่ครึ่งเดียว จากตรงนั้นเธอเห็นทั้งลาน
วิทยุมือถือดังแกรก
มาลี: ฉันจะส่งตัวอักษรไปทีละตัว F เดินหน้า B ถอย L หมุนซ้าย R หมุนขวา S หยุด
มาลี: เธอแค่ฟังแล้วทำตาม ทำตามตัวล่าสุดไปเรื่อย ๆ จนกว่าฉันจะส่งตัวใหม่`,
  outro: `กระสวยเคลื่อนไปตามเสียงของมาลี ทีละคำสั่ง จนเข้าไปจอดกลางลานปล่อย
มาลีตะโกนลงมาจากหอ
มาลี: เธอเป็นมือ ฉันเป็นตา แบบนี้ใช้ได้!`,
  lesson: {
    title: 'ฟังคำสั่งจาก Serial',
    blocks: [
      { p: 'ที่ผ่านมาเราใช้ Serial **ส่ง** ข้อความออกไป แต่ Serial รับเข้ามาได้ด้วย ตัวอักษรที่ส่งมาจะรออยู่ในคิวของบอร์ด จนกว่าโปรแกรมจะอ่าน' },
      { code: 'char current = \'S\';          // คำสั่งล่าสุด เริ่มที่หยุด\n\nvoid setup() {\n  Serial.begin(9600);        // ต้องเปิด Serial ก่อน ไม่อย่างนั้นไม่ได้รับอะไรเลย\n}\n\nvoid loop() {\n  if (Serial.available() > 0) {   // มีตัวอักษรรออยู่ไหม\n    current = Serial.read();      // อ่านออกมา 1 ตัว\n  }\n  switch (current) {\n    case \'F\': forward(); break;\n    case \'S\': stopCar(); break;\n  }\n  delay(50);\n}' },
      {
        list: [
          '`Serial.available()` คืนจำนวนตัวอักษรที่รออยู่ · `Serial.read()` อ่านออกมา 1 ตัวแล้วลบออกจากคิว',
          'ต้องเช็ก `available()` ก่อนเสมอ ถ้าอ่านตอนไม่มีอะไร จะได้ -1',
          'ตัวอักษร 1 ตัวใช้ **ฟันหนูเดี่ยว** `\'F\'` (ชนิด `char`) ส่วน `"F"` เป็น String ใช้กับ `switch` ไม่ได้',
          '`\'F\'` กับ `\'f\'` เป็นคนละตัวกัน',
          'เก็บคำสั่งล่าสุดไว้ใน `current` แล้วทำตามทุกรอบ รถจึงทำสิ่งเดิมต่อไปจนกว่าจะมีคำสั่งใหม่',
          '`default:` คือกรณีที่ไม่ตรงกับ case ไหนเลย ใช้เป็นทางปลอดภัย: ไม่รู้จักคำสั่ง = หยุด',
        ],
      },
      { tip: 'โปรแกรมนี้ไม่มี delay ยาวเลย จึงได้ยินคำสั่งใหม่ภายใน 50 ms เสมอ ถ้ายังใช้ delay(300) ตอนเลี้ยวแบบองก์ 5 คำสั่ง S ที่ส่งมาระหว่างนั้นจะถูกทำช้าไป 0.3 วินาที' },
    ],
  },
  world: {
    map: ['###', '#P#', '#.#', '#.#', '#B#', '###'],
    dir: 'N',
    theme: 'planet',
    vehicle: 'shuttle',
    drive: {},
    remote: [{ t: 0, c: 'F' }, { t: 1500, c: 'S' }],
    loops: 80,
  },
  puzzles: [
    {
      id: '6-4-a',
      kind: 'blank',
      title: 'ฟังแล้วทำตาม',
      mission: 'มาลีจะส่ง F ให้เดินหน้า แล้วส่ง S เมื่อกระสวยอยู่บนลานปล่อย เติมคำสั่งที่เช็กว่ามีตัวอักษรรออยู่ คำสั่งที่อ่านตัวอักษร และตัวอักษรของ case เดินหน้า',
      hints: ['เช็กด้วย Serial.available() แล้วอ่านด้วย Serial.read()', "ตัวอักษรตัวเดียวใช้ฟันหนูเดี่ยว: case 'F': และกรณีอื่นให้ stopCar"],
      code: HELPERS + `
char current = 'S';

void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.{{0}}() > 0) {
    current = Serial.{{1}}();
  }
  switch (current) {
    case {{2}}: forward(); break;
    default: {{3}}(); break;
  }
  delay(50);
}`,
      bank: ['available', 'read', 'print', "'F'", '"F"', "'f'", 'stopCar', 'forward'],
      answer: ['available', 'read', "'F'", 'stopCar'],
      goal: { at: 'pad', stopped: true },
      cases: [
        { label: 'ทางสั้น' },
        { label: 'ทางยาว', map: ['###', '#P#', '#.#', '#.#', '#.#', '#.#', '#B#', '###'], remote: [{ t: 0, c: 'F' }, { t: 2500, c: 'S' }] },
      ],
    },
    {
      id: '6-4-b',
      kind: 'fix',
      title: 'กระสวยหูหนวก',
      mission: 'โปรแกรมรีโมตนี้มีครบทุกคำสั่ง แต่กระสวยไม่ขยับเลย และถึงขยับแล้วก็ยังเลี้ยวผิดข้าง มาลีส่งตัวพิมพ์ใหญ่เสมอ มีที่ผิด 3 บรรทัด',
      hints: [
        'Serial.begin(9600); ถูกปิดเป็นคอมเมนต์ บอร์ดจึงไม่ได้รับอะไรเลย · case ของเดินหน้าต้องเป็นตัวพิมพ์ใหญ่ \'F\'',
        "case 'L' ไม่มี break; จึงไหลลงไปทำ spinRight() ของ case 'R' ด้วย",
      ],
      world: { map: ['#####', '#P..#', '###.#', '###B#', '#####'] },
      code: HELPERS + `
char current = 'S';

void setup() {
  // Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    current = Serial.read();
  }
  switch (current) {
    case 'f': forward(); break;
    case 'B': backward(); break;
    case 'L': spinLeft();
    case 'R': spinRight(); break;
    default: stopCar(); break;
  }
  delay(50);
}`,
      fixes: {
        24: { options: ['// Serial.begin(9600);', 'Serial.begin(9600);', 'Serial.read(9600);'], answer: 1 },
        32: { options: ["case 'f': forward(); break;", "case 'F': forward(); break;", 'case "F": forward(); break;'], answer: 1 },
        34: { options: ["case 'L': spinLeft();", "case 'L': spinLeft(); break;", "case 'l': spinLeft();"], answer: 1 },
      },
      goal: { at: 'pad', stopped: true },
      cases: [
        { label: 'เลี้ยวซ้าย', remote: [{ t: 0, c: 'F' }, { t: 1000, c: 'L' }, { t: 1300, c: 'F' }, { t: 2300, c: 'S' }] },
        {
          label: 'เลี้ยวขวา',
          map: ['#####', '#..P#', '#.###', '#B###', '#####'],
          remote: [{ t: 0, c: 'F' }, { t: 1000, c: 'R' }, { t: 1300, c: 'F' }, { t: 2300, c: 'S' }],
        },
      ],
    },
    {
      id: '6-4-c',
      kind: 'type',
      title: 'เขียนรีโมตเอง',
      mission: "เขียนโปรแกรมรีโมตเองทั้งหมด: เปิด Serial ใน setup แล้วใน loop ให้อ่านตัวอักษรที่ส่งมาเก็บใน current และทำตาม 'F' เดินหน้า 'B' ถอยหลัง 'L' หมุนซ้าย 'R' หมุนขวา ตัวอื่นให้หยุด มาลีจะพากระสวยไป 2 เส้นทาง",
      hints: [
        'setup: Serial.begin(9600); · loop: if (Serial.available() > 0) { current = Serial.read(); }',
        "switch (current) { case 'F': forward(); break; case 'B': backward(); break; case 'L': spinLeft(); break; case 'R': spinRight(); break; default: stopCar(); break; } แล้ว delay(50);",
      ],
      world: { map: ['#####', '###P#', '#...#', '#.###', '#B###', '#####'] },
      starter: HELPERS + `
char current = 'S';

void setup() {
  // เปิด Serial ที่ 9600

}

void loop() {
  // 1) ถ้ามีตัวอักษรรออยู่ ให้อ่านมาเก็บใน current

  // 2) ทำตาม current ด้วย switch

  delay(50);
}`,
      solution: HELPERS + `
char current = 'S';

void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    current = Serial.read();
  }
${SWITCH}
  delay(50);
}`,
      require: [{ re: 'Serial\\s*\\.\\s*read\\s*\\(', msg: 'ต้องอ่านคำสั่งของมาลีด้วย Serial.read() เส้นทางของแต่ละชุดไม่เหมือนกัน' }],
      goal: { at: 'pad', stopped: true, flags: true },
      win: 'รับคำสั่งได้ครบทุกตัว!',
      cases: [
        {
          label: 'ซิกแซ็ก',
          remote: [{ t: 0, c: 'F' }, { t: 1000, c: 'R' }, { t: 1300, c: 'F' }, { t: 2300, c: 'L' }, { t: 2600, c: 'F' }, { t: 3100, c: 'S' }],
        },
        {
          label: 'ไปแตะธงแล้วถอย',
          map: ['###', '#F#', '#.#', '#P#', '#B#', '###'],
          remote: [{ t: 0, c: 'F' }, { t: 1500, c: 'B' }, { t: 2500, c: 'S' }],
        },
      ],
    },
  ],
};

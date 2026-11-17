import { Level } from '../../types';

const CAVE_A = ['#######', '#P..X.#', '#XX.X.#', '#...X.#', '#.XXX.#', '#B....#', '#######'];
const CAVE_B = ['#######', '#.X..P#', '#.X.XX#', '#.X...#', '#.XXX.#', '#....B#', '#######'];

const HELPERS = `const int DANGER_CM = 25;
const int TURN_MS = 300;

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
`;

// 5-6 หลบสิ่งกีดขวาง: ดูซ้าย-ขวาแล้วเลือกทางโล่ง (R07) — ด่านท้ายองก์ 5
export const p06: Level = {
  id: '5-6',
  act: 5,
  title: 'เขาวงกตถ้ำ',
  concept: 'หลบสิ่งกีดขวาง: ดูซ้าย ดูขวา เลือกทางที่โล่งกว่า',
  ref: 'R07 · หลบสิ่งกีดขวาง',
  story: `ปลายหุบเขาคือปากถ้ำ
ข้างในเป็นเขาวงกตของก้อนหิน ข้างหลังมีแสงสีม่วงกำลังไล่มา
ไม่มีแผนที่ ไม่มีเวลาวางแผน
มาลี: เข้าไปเลย! ฉันตามหลังเธอ
บิตมีแค่ล้อสองข้าง กับตาหนึ่งดวงที่มองได้แต่ข้างหน้า
เจอทางตันเมื่อไร ต้องหันไปดูเองว่าซ้ายหรือขวาโล่งกว่า`,
  outro: `บิตทะลุออกอีกฝั่งของถ้ำ ไม่ชนหินสักก้อน
เสียงนักล่าหลงทางก้องอยู่ข้างใน
หน้าปากถ้ำ มีเงาดำใหญ่จอดอยู่ใต้เถาวัลย์
กระสวยขนส่งรุ่นเก่าของสถานี
มาลีแตะตัวถังที่เย็นเฉียบ
มาลี: ถ้ามันยังบินได้... เราจะได้กลับขึ้นไปหาอรุณ-7
— จบองก์ 5`,
  lesson: {
    title: 'เจอทางตัน ดูซ้าย ดูขวา',
    blocks: [
      { p: 'ด่านที่แล้วบิตหยุดได้ แต่หยุดแล้วไปต่อไม่เป็น คราวนี้เมื่อเจอสิ่งกีดขวาง บิตจะ **หันไปวัดระยะทางซ้าย หันไปวัดทางขวา แล้วเลือกทางที่ไกลกว่า** (เซนเซอร์ติดตายอยู่ด้านหน้า จึงต้องหันทั้งตัว)' },
      { code: 'void loop() {\n  if (readDistance() < DANGER_CM) {\n    stopCar();\n    turnLeft();                  // หันซ้าย\n    int left = readDistance();   // จำระยะทางซ้าย\n    turnRight();\n    turnRight();                 // หันขวา (ผ่านหน้าตรงไปอีก 90 องศา)\n    int right = readDistance();  // จำระยะทางขวา\n    if (left > right) {\n      turnLeft();\n      turnLeft();                // ซ้ายโล่งกว่า: หันกลับไปทางซ้าย\n    }\n  } else {\n    forward();\n  }\n  delay(100);\n}' },
      {
        list: [
          'หลังวัดทางขวาเสร็จ บิต **หันหน้าไปทางขวาอยู่แล้ว** ถ้าขวาโล่งกว่าก็ไม่ต้องทำอะไรเพิ่ม',
          'ถ้าซ้ายโล่งกว่า ต้องเลี้ยวซ้าย **2 ครั้ง** (จากขวา กลับมาหน้าตรง แล้วไปซ้าย)',
          'ต้องเก็บระยะทั้งสองข้างไว้ในตัวแปรก่อน แล้วค่อยเทียบกัน',
          'รอบถัดไปของ `loop()` จะอ่านระยะข้างหน้าใหม่ แล้ววิ่งต่อเอง',
        ],
      },
      { tip: 'โปรแกรมนี้ไม่รู้จักแผนที่เลย แต่พาบิตออกจากถ้ำได้ทั้งสองแบบ เพราะมันตัดสินใจจากสิ่งที่วัดได้ตรงหน้าทุกครั้ง' },
    ],
  },
  world: {
    map: CAVE_A,
    dir: 'N',
    theme: 'planet',
    drive: {},
    loops: 70,
  },
  puzzles: [
    {
      id: '5-6-a',
      kind: 'blank',
      title: 'ซ้ายหรือขวา',
      mission: 'บิตวัดระยะซ้ายและขวาได้แล้ว และตอนนี้หันหน้าไปทางขวาอยู่ เติมเงื่อนไขและคำสั่งให้หันกลับไปทางซ้ายเมื่อซ้ายโล่งกว่า บิตต้องไปถึงวงสีเขียวในถ้ำทั้งสองแบบ',
      hints: ['ซ้ายโล่งกว่าคือ left > right', 'จากที่หันขวาอยู่ ต้อง turnLeft() สองครั้งจึงจะหันไปทางซ้าย'],
      code: HELPERS + `
void setup() {
}

void loop() {
  if (readDistance() < DANGER_CM) {
    stopCar();
    turnLeft();
    int left = readDistance();
    turnRight();
    turnRight();
    int right = readDistance();
    if (left {{0}} right) {
      {{1}}();
      {{2}}();
    }
  } else {
    forward();
  }
  delay(100);
}`,
      bank: ['>', '<', 'turnLeft', 'turnRight', 'forward'],
      answer: ['>', 'turnLeft', 'turnLeft'],
      goal: { at: 'pad', stopped: true },
      cases: [
        { label: 'ถ้ำแบบ ก', map: CAVE_A },
        { label: 'ถ้ำแบบ ข', map: CAVE_B },
      ],
    },
    {
      id: '5-6-b',
      kind: 'type',
      title: 'หนีออกจากถ้ำ',
      mission: 'ด่านท้ายองก์: เขียนส่วนตัดสินใจเองทั้งหมด เมื่อระยะข้างหน้าน้อยกว่า DANGER_CM ให้หยุด หันไปวัดทางซ้าย หันไปวัดทางขวา แล้วหันไปทางที่โล่งกว่า ถ้าข้างหน้ายังโล่งให้วิ่งต่อ บิตต้องไปถึงวงสีเขียวในถ้ำทั้งสองแบบโดยไม่ชน',
      hints: [
        'ในปีกกาของ if: stopCar(); turnLeft(); int left = readDistance(); turnRight(); turnRight(); int right = readDistance();',
        'ต่อด้วย if (left > right) { turnLeft(); turnLeft(); } · ในส่วน else ใส่ forward();',
      ],
      starter: HELPERS + `
void setup() {
}

void loop() {
  if (readDistance() < DANGER_CM) {
    // หยุด หันซ้ายแล้ววัด หันขวาแล้ววัด
    // แล้วหันไปทางที่ระยะมากกว่า

  } else {
    // ข้างหน้าโล่ง

  }
  delay(100);
}`,
      solution: HELPERS + `
void setup() {
}

void loop() {
  if (readDistance() < DANGER_CM) {
    stopCar();
    turnLeft();
    int left = readDistance();
    turnRight();
    turnRight();
    int right = readDistance();
    if (left > right) {
      turnLeft();
      turnLeft();
    }
  } else {
    forward();
  }
  delay(100);
}`,
      goal: { at: 'pad', stopped: true },
      win: 'ออกจากถ้ำได้แล้ว!',
      cases: [
        { label: 'ถ้ำแบบ ก', map: CAVE_A },
        { label: 'ถ้ำแบบ ข', map: CAVE_B },
      ],
    },
  ],
};

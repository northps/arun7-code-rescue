import { Level } from '../../types';

const FOREST_A = ['#####', '#P..#', '#XX.#', '#...#', '#.XX#', '#..B#', '#####'];
const FOREST_B = ['#####', '#..P#', '#.XX#', '#...#', '#XX.#', '#B..#', '#####'];

const HELPERS = `const int DANGER_CM = 25;
const int TURN_MS = 300;

enum State { CRUISE, SCAN, TURN };
State state = CRUISE;
int leftDist = 0;
int rightDist = 0;

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

const GOTO = `
void goTo(State s) {
  state = s;
}
`;

// 6-2 switch (state) + goTo(): โปรแกรมหลบสิ่งกีดขวางแบบสถานะ (R08)
export const q02: Level = {
  id: '6-2',
  act: 6,
  title: 'สมองแบบสถานะ',
  concept: 'state machine: switch (state) และ goTo()',
  ref: 'R08 · state machine',
  story: `กระสวยต้องวิ่งด้วยล้อผ่านป่าหิน ไปให้ถึงลานปล่อย
บิตเอาโปรแกรมหลบสิ่งกีดขวางจากในถ้ำมาใส่ มันใช้ได้
แต่มาลีส่ายหน้า
มาลี: if ซ้อน if ยาวเป็นหน้า ถ้าฉันอยากเพิ่มโหมดถอยหลัง ฉันต้องแก้ตรงไหน
มาลี: เขียนใหม่ให้เป็นสถานะ สถานะละก้อน ก้อนไหนทำอะไร เห็นชัด ๆ`,
  outro: `กระสวยเลี้ยวผ่านป่าหินทั้งสองเส้นทางด้วยโปรแกรมเดียว
มาลี: ดูสิ อ่านจากบนลงล่างก็รู้เลยว่ามันคิดอะไรอยู่
มาลี: วิ่ง มอง เลี้ยว แล้ววนกลับไปวิ่ง`,
  lesson: {
    title: 'สถานะละก้อน',
    blocks: [
      { p: '**state machine** คือการเขียนโปรแกรมเป็นสถานะ: ตอนใดตอนหนึ่งโปรแกรมอยู่ได้ **สถานะเดียว** แต่ละรอบของ `loop()` ทำงานของสถานะนั้น แล้วตัดสินใจว่าจะอยู่ต่อหรือย้ายไปสถานะอื่น' },
      { code: 'void goTo(State s) {     // ย้ายสถานะ\n  state = s;\n}\n\nvoid loop() {\n  switch (state) {\n    case CRUISE:                      // วิ่งไปดูไป\n      forward();\n      if (readDistance() < DANGER_CM) {\n        goTo(SCAN);\n      }\n      break;\n    case SCAN:                        // หยุด มองซ้าย มองขวา\n      stopCar();\n      turnLeft();\n      leftDist = readDistance();\n      turnRight();\n      turnRight();\n      rightDist = readDistance();\n      goTo(TURN);\n      break;\n    case TURN:                        // หันไปทางที่โล่งกว่า\n      if (leftDist > rightDist) {\n        turnLeft();\n        turnLeft();\n      }\n      goTo(CRUISE);\n      break;\n  }\n  delay(50);\n}' },
      {
        list: [
          '`switch (state)` กระโดดไปที่ `case` ที่ตรงกับค่าของ state',
          'ทุก `case` ต้องจบด้วย **`break;`** ถ้าลืม โปรแกรมจะไหลไปทำ case ถัดไปด้วย',
          'เปลี่ยนสถานะผ่าน `goTo()` ที่เดียว วันหลังอยากพิมพ์ชื่อสถานะหรือจดเวลา ก็แก้ที่เดียว',
          'ค่าที่ต้องจำข้ามสถานะ (เช่น `leftDist`) ต้องเป็นตัวแปร global เพราะแต่ละสถานะทำงานคนละรอบของ `loop()`',
        ],
      },
      { tip: 'พฤติกรรมเหมือนโปรแกรมในถ้ำขององก์ 5 ทุกอย่าง ต่างกันที่รูปร่างของโค้ด: อยากเพิ่มโหมดใหม่ก็เพิ่ม case ใหม่ ไม่ต้องรื้อของเดิม' },
    ],
  },
  world: {
    map: FOREST_A,
    dir: 'N',
    theme: 'planet',
    vehicle: 'shuttle',
    drive: {},
    loops: 150,
  },
  puzzles: [
    {
      id: '6-2-a',
      kind: 'blank',
      title: 'ต่อโครงของ switch',
      mission: 'โค้ดของแต่ละสถานะเขียนไว้แล้ว เติมคำที่หายไปให้ครบ: คำสั่งที่เลือก case, สถานะที่ต้องย้ายไป และคำที่ปิดท้าย case กระสวยต้องไปถึงลานปล่อย (วงสีเขียว) ในป่าทั้งสองแบบ',
      hints: ['บรรทัดแรกของ loop คือ switch (state) และแต่ละก้อนขึ้นต้นด้วย case', 'CRUISE เจอสิ่งกีดขวางแล้วไป SCAN · จบ case ด้วย break · TURN เสร็จแล้วกลับไป CRUISE'],
      code: HELPERS + GOTO + `
void setup() {
}

void loop() {
  {{0}} (state) {
    case CRUISE:
      forward();
      if (readDistance() < DANGER_CM) {
        goTo({{1}});
      }
      break;
    {{2}} SCAN:
      stopCar();
      turnLeft();
      leftDist = readDistance();
      turnRight();
      turnRight();
      rightDist = readDistance();
      goTo(TURN);
      {{3}};
    case TURN:
      if (leftDist > rightDist) {
        turnLeft();
        turnLeft();
      }
      goTo({{4}});
      break;
  }
  delay(50);
}`,
      bank: ['switch', 'case', 'break', 'CRUISE', 'SCAN', 'TURN', 'if'],
      answer: ['switch', 'SCAN', 'case', 'break', 'CRUISE'],
      goal: { at: 'pad', stopped: true },
      cases: [
        { label: 'ป่าหิน ก', map: FOREST_A },
        { label: 'ป่าหิน ข', map: FOREST_B },
      ],
    },
    {
      id: '6-2-b',
      kind: 'fix',
      title: 'กระสวยหมุนอยู่กับที่',
      mission: 'มีคนแก้โปรแกรมแล้วกระสวยไม่ยอมวิ่ง ได้แต่หยุดแล้วหมุนซ้ายขวาอยู่ที่เดิม ไล่ดูว่าสถานะเปลี่ยนอย่างไรในแต่ละรอบ มีที่ผิด 3 บรรทัด',
      hints: [
        'ใน goTo เขียนสลับข้าง: s = state; ไม่ได้เปลี่ยน state เลย ต้องเป็น state = s;',
        'break; ของ case CRUISE ถูกปิดเป็นคอมเมนต์ โปรแกรมจึงไหลลงไปทำ SCAN ทุกรอบ · และ TURN เสร็จแล้วต้องกลับไป CRUISE ไม่ใช่ TURN',
      ],
      code: HELPERS + `
void goTo(State s) {
  s = state;
}

void setup() {
}

void loop() {
  switch (state) {
    case CRUISE:
      forward();
      if (readDistance() < DANGER_CM) {
        goTo(SCAN);
      }
      // break;
    case SCAN:
      stopCar();
      turnLeft();
      leftDist = readDistance();
      turnRight();
      turnRight();
      rightDist = readDistance();
      goTo(TURN);
      break;
    case TURN:
      if (leftDist > rightDist) {
        turnLeft();
        turnLeft();
      }
      goTo(TURN);
      break;
  }
  delay(50);
}`,
      fixes: {
        30: { options: ['s = state;', 'state = s;', 'state == s;'], answer: 1 },
        43: { options: ['// break;', 'break;', 'continue;'], answer: 1 },
        58: { options: ['goTo(TURN);', 'goTo(CRUISE);', 'goTo(SCAN);'], answer: 1 },
      },
      goal: { at: 'pad', stopped: true },
      cases: [
        { label: 'ป่าหิน ก', map: FOREST_A },
        { label: 'ป่าหิน ข', map: FOREST_B },
      ],
    },
    {
      id: '6-2-c',
      kind: 'type',
      title: 'เขียนสถานะเอง',
      mission: 'สถานะ CRUISE เขียนไว้ให้แล้ว เขียน case SCAN (หยุด หันซ้ายแล้ววัดเก็บใน leftDist หันขวาแล้ววัดเก็บใน rightDist แล้วไป TURN) และ case TURN (หันไปทางที่โล่งกว่า แล้วกลับไป CRUISE) กระสวยต้องถึงลานปล่อยในป่าทั้งสองแบบ',
      hints: [
        'case SCAN: stopCar(); turnLeft(); leftDist = readDistance(); turnRight(); turnRight(); rightDist = readDistance(); goTo(TURN); break;',
        'case TURN: ตอนนี้หันขวาอยู่แล้ว ถ้า leftDist > rightDist ให้ turnLeft(); สองครั้ง แล้ว goTo(CRUISE); break;',
      ],
      starter: HELPERS + GOTO + `
void setup() {
}

void loop() {
  switch (state) {
    case CRUISE:
      forward();
      if (readDistance() < DANGER_CM) {
        goTo(SCAN);
      }
      break;
    case SCAN:
      // หยุด หันซ้ายแล้ววัด หันขวาแล้ววัด แล้วไปสถานะ TURN

      break;
    case TURN:
      // หันไปทางที่โล่งกว่า แล้วกลับไปสถานะ CRUISE

      break;
  }
  delay(50);
}`,
      solution: HELPERS + GOTO + `
void setup() {
}

void loop() {
  switch (state) {
    case CRUISE:
      forward();
      if (readDistance() < DANGER_CM) {
        goTo(SCAN);
      }
      break;
    case SCAN:
      stopCar();
      turnLeft();
      leftDist = readDistance();
      turnRight();
      turnRight();
      rightDist = readDistance();
      goTo(TURN);
      break;
    case TURN:
      if (leftDist > rightDist) {
        turnLeft();
        turnLeft();
      }
      goTo(CRUISE);
      break;
  }
  delay(50);
}`,
      require: [{ re: 'goTo\\s*\\(\\s*TURN\\s*\\)', msg: 'case SCAN ต้องย้ายไปสถานะ TURN ด้วย goTo(TURN);' }],
      goal: { at: 'pad', stopped: true },
      win: 'สมองแบบสถานะทำงานแล้ว!',
      cases: [
        { label: 'ป่าหิน ก', map: FOREST_A },
        { label: 'ป่าหิน ข', map: FOREST_B },
      ],
    },
  ],
};

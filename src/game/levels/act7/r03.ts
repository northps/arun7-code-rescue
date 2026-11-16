import { Level } from '../../types';

const HALL_A = ['#######', '#..A.P#', '#.#####', '#.#####', '#B#####', '#######'];
const HALL_B = ['#######', '#.A..P#', '#.#####', '#A#####', '#.#####', '#B#####', '#######'];

const HEAD = `const int DANGER_CM = 20;
const int TURN_MS = 300;

enum State { CRUISE, FIGHT, TURN, PARK };
State state = CRUISE;
unsigned long stateStart = 0;

void forward() {
  setMotor(150, 150);
}

void stopCar() {
  setMotor(0, 0);
}

void goTo(State s) {
  state = s;
  stateStart = millis();
}

void setup() {
}
`;

const SOLUTION = HEAD + `
void loop() {
  switch (state) {
    case CRUISE:
      forward();
      if (atPad()) {
        goTo(PARK);
      } else if (seeKleth()) {
        goTo(FIGHT);
      } else if (readDistance() < DANGER_CM) {
        goTo(TURN);
      }
      break;
    case FIGHT:
      stopCar();
      if (seeKleth()) {
        fire();
      } else {
        goTo(CRUISE);
      }
      break;
    case TURN:
      setMotor(150, -150);
      if (millis() - stateStart >= TURN_MS) {
        goTo(CRUISE);
      }
      break;
    case PARK:
      stopCar();
      break;
  }
  delay(50);
}`;

// 7-3 state machine เต็มรูป: ขับ + สู้
export const r03: Level = {
  id: '7-3',
  act: 7,
  title: 'ฝ่าทางเดินสุดท้าย',
  concept: 'state machine เต็มรูป: วิ่ง สู้ เลี้ยว จอด',
  ref: 'R08 · state machine',
  story:
    'ทางเดินจากห้องเครื่องไปห้องประตูมิติยาวและแคบ และมีเคลธยืนเฝ้าอยู่ มาลีติดปืนพลังงานอันเล็กไว้บนหัวของบิต "ฉันต้องอยู่คุมเตาปฏิกรณ์ตรงนี้ เธอไปคนเดียว เจอผนังก็เลี้ยว เจอเคลธก็หยุดแล้วยิง อย่ายิงมั่ว แบตมีจำกัด แล้วอย่าวิ่งชนมัน"',
  outro: 'เคลธตัวสุดท้ายในทางเดินสลายเป็นควันสีม่วง บิตจอดหน้าประตูบานใหญ่ที่มีแสงสีม่วงลอดออกมาตามขอบ เสียงมาลีดังจากวิทยุ "เธอถึงแล้ว ข้างในนั้นคือประตูมิติ ปิดมันได้ พวกมันก็มาอีกไม่ได้"',
  lesson: {
    title: 'ทวน: เพิ่มสถานะใหม่โดยไม่รื้อของเดิม',
    blocks: [
      { p: 'โปรแกรมขององก์ 6 มีสถานะ CRUISE, TURN, PARK ด่านนี้เพิ่ม **FIGHT** เข้าไปอีกหนึ่งก้อน นี่คือเหตุผลที่เราเขียนเป็น state machine: ของเดิมไม่ต้องแก้ แค่เพิ่มทางเข้าและทางออกของสถานะใหม่' },
      { code: 'case CRUISE:\n  forward();\n  if (atPad()) {\n    goTo(PARK);\n  } else if (seeKleth()) {              // เช็กเคลธก่อนเช็กระยะ\n    goTo(FIGHT);\n  } else if (readDistance() < DANGER_CM) {\n    goTo(TURN);\n  }\n  break;\ncase FIGHT:\n  stopCar();\n  if (seeKleth()) {\n    fire();                             // ยังเห็นอยู่ ยิง\n  } else {\n    goTo(CRUISE);                       // ไม่เห็นแล้ว ไปต่อ\n  }\n  break;' },
      {
        list: [
          '`seeKleth()` คืน true เมื่อสิ่งที่อยู่ตรงหน้าบิตคือเคลธ · `fire()` ยิงไปข้างหน้า ถ้าไม่มีเคลธอยู่ตรงหน้าคือยิงทิ้ง',
          '**ลำดับของ else if สำคัญ**: เคลธก็เป็นสิ่งกีดขวาง ถ้าเช็กระยะก่อน บิตจะเลี้ยวหนีเคลธแทนที่จะสู้',
          'FIGHT ยิงเฉพาะตอนที่ยังเห็นเคลธ จึงไม่เสียกระสุนเปล่า',
          'TURN ยังจับเวลาด้วย `millis() - stateStart` เหมือนองก์ 6',
        ],
      },
      { tip: 'วาดรูปก่อนเขียน: วงกลม 4 วงคือสถานะ ลูกศรคือ goTo() แต่ละลูกศรมีเงื่อนไขกำกับ ถ้าวาดรูปได้ โค้ดก็แค่ลอกตามรูป' },
    ],
  },
  world: {
    map: HALL_A,
    dir: 'N',
    drive: {},
    api: ['fire'],
    targets: 1,
    loops: 130,
  },
  puzzles: [
    {
      id: '7-3-a',
      kind: 'blank',
      title: 'เพิ่มสถานะ FIGHT',
      mission: 'เติมส่วนของสถานะใหม่: ใน CRUISE ถ้าเห็นเคลธให้ไป FIGHT ใน FIGHT ให้หยุด ยิงตราบที่ยังเห็น และกลับไป CRUISE เมื่อไม่เห็นแล้ว บิตต้องกำจัดเคลธครบ ไม่ยิงทิ้ง และไปจอดบนวงสีเขียว ในทางเดินทั้งสองแบบ',
      hints: ['คำสั่งที่บอกว่ามีเคลธอยู่ตรงหน้าคือ seeKleth() และสถานะที่ต้องไปคือ FIGHT', 'ใน FIGHT: ยังเห็นให้ fire() ไม่เห็นแล้วให้ goTo(CRUISE)'],
      code: HEAD + `
void loop() {
  switch (state) {
    case CRUISE:
      forward();
      if (atPad()) {
        goTo(PARK);
      } else if ({{0}}()) {
        goTo({{1}});
      } else if (readDistance() < DANGER_CM) {
        goTo(TURN);
      }
      break;
    case FIGHT:
      stopCar();
      if (seeKleth()) {
        {{2}}();
      } else {
        goTo({{3}});
      }
      break;
    case TURN:
      setMotor(150, -150);
      if (millis() - stateStart >= TURN_MS) {
        goTo(CRUISE);
      }
      break;
    case PARK:
      stopCar();
      break;
  }
  delay(50);
}`,
      bank: ['seeKleth', 'atPad', 'fire', 'forward', 'FIGHT', 'CRUISE', 'TURN', 'PARK'],
      answer: ['seeKleth', 'FIGHT', 'fire', 'CRUISE'],
      goal: { at: 'pad', stopped: true, targetsLeft: 0 },
      cases: [
        { label: 'เคลธ 1 ตัว', map: HALL_A, targets: 1 },
        { label: 'เคลธ 2 ตัว', map: HALL_B, targets: 2 },
      ],
    },
    {
      id: '7-3-b',
      kind: 'type',
      title: 'เขียนสมองทั้งก้อน',
      mission: 'เขียน switch ของทั้ง 4 สถานะเอง: CRUISE (วิ่ง ถึงวงเขียวไป PARK เห็นเคลธไป FIGHT ใกล้ผนังไป TURN) FIGHT (หยุด ยิงตราบที่ยังเห็น ไม่เห็นแล้วกลับ CRUISE) TURN (หมุนขวาจนครบ TURN_MS แล้วกลับ CRUISE) PARK (หยุด) ต้องกำจัดเคลธครบโดยไม่ยิงทิ้ง และจอดบนวงสีเขียว',
      hints: [
        'case CRUISE: forward(); if (atPad()) { goTo(PARK); } else if (seeKleth()) { goTo(FIGHT); } else if (readDistance() < DANGER_CM) { goTo(TURN); } break;',
        'case FIGHT: stopCar(); if (seeKleth()) { fire(); } else { goTo(CRUISE); } break; · case TURN: setMotor(150, -150); if (millis() - stateStart >= TURN_MS) { goTo(CRUISE); } break; · case PARK: stopCar(); break;',
      ],
      starter: HEAD + `
void loop() {
  switch (state) {
    case CRUISE:

      break;
    case FIGHT:

      break;
    case TURN:

      break;
    case PARK:

      break;
  }
  delay(50);
}`,
      solution: SOLUTION,
      goal: { at: 'pad', stopped: true, targetsLeft: 0 },
      win: 'ทางเดินโล่งแล้ว!',
      cases: [
        { label: 'เคลธ 1 ตัว', map: HALL_A, targets: 1 },
        { label: 'เคลธ 2 ตัว', map: HALL_B, targets: 2 },
      ],
    },
  ],
};

import { Level } from '../../types';

const BEND = ['######', '#...P#', '#.####', '#.####', '#B####', '######'];
const TWO_BENDS = ['#######', '#....##', '#.##.##', '#.##P##', '#B#####', '#######'];
const POCKET_A = ['######', '#F####', '#...P#', '#.####', '#B####', '######'];
const POCKET_B = ['#######', '#F#####', '#....P#', '#.#####', '#.#####', '#B#####', '#######'];

const HEAD = `const int DANGER_CM = 20;
const int TURN_MS = 300;

enum State { CRUISE, TURN, PARK };
State state = CRUISE;
unsigned long stateStart = 0;

void forward() {
  setMotor(150, 150);
}

void stopCar() {
  setMotor(0, 0);
}
`;

const HEAD_C = `const int DANGER_CM = 20;
const int BACKUP_MS = 500;
const int TURN_MS = 300;

enum State { CRUISE, BACKUP, TURN, PARK };
State state = CRUISE;
unsigned long stateStart = 0;

void forward() {
  setMotor(150, 150);
}

void backward() {
  setMotor(-150, -150);
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

// 6-3 millis(): จับเวลาโดยไม่หยุดรอ (R08)
export const q03: Level = {
  id: '6-3',
  act: 6,
  title: 'ไม่หยุดรอ',
  concept: 'millis() และ millis() - stateStart แทน delay ยาว',
  ref: 'R08 · state machine',
  story: `เครื่องยนต์เก่าของกระสวยร้อนเร็วมาก
ปั๊มหล่อเย็นต้องถูกสั่งให้เต้นตลอด ห่างกันเกิน 200 มิลลิวินาทีเมื่อไร เครื่องดับ
บิตลองโปรแกรมเดิม เครื่องดับตั้งแต่โค้งแรก
มาลีไล่นิ้วไปตามโค้ด แล้วหยุดที่ delay(300) ในฟังก์ชันเลี้ยว
มาลี: ตรงนี้ ระหว่างที่เธอนั่งรอให้เลี้ยวเสร็จ เธอไม่ได้ทำอะไรเลย ปั๊มก็ไม่ได้เต้น
มาลี: ต้องเลี้ยวไปด้วย ดูนาฬิกาไปด้วย`,
  outro: `กระสวยเลี้ยว ถอย และวิ่ง ปั๊มหล่อเย็นเต้นไม่ขาดจังหวะสักครั้ง
มาลี: โปรแกรมที่ไม่เคยหยุดรอ ทำได้หลายอย่างพร้อมกัน
มาลี: จำไว้ เราจะต้องใช้ตอนรับคำสั่งจากวิทยุ`,
  lesson: {
    title: 'ดูนาฬิกาแทนการนั่งรอ',
    blocks: [
      { p: '`delay(300)` คือการ **หยุดทุกอย่าง** 300 ms: ไม่อ่านเซนเซอร์ ไม่สั่งปั๊ม ไม่รับคำสั่ง ทางแก้คือถามนาฬิกาแทน **`millis()`** คืนจำนวนมิลลิวินาทีตั้งแต่บอร์ดเริ่มทำงาน' },
      { code: 'unsigned long stateStart = 0;   // เวลาที่เข้าสถานะปัจจุบัน\n\nvoid goTo(State s) {\n  state = s;\n  stateStart = millis();        // จดเวลาตอนเข้าสถานะ\n}\n\n// ใน loop():\ncase TURN:\n  setMotor(150, -150);          // สั่งให้หมุน แล้วไปต่อทันที\n  if (millis() - stateStart >= TURN_MS) {\n    goTo(CRUISE);               // หมุนมาครบเวลาแล้ว\n  }\n  break;' },
      {
        list: [
          '`millis() - stateStart` คือ "อยู่ในสถานะนี้มานานเท่าไรแล้ว"',
          'แต่ละรอบของ `loop()` สั้นมาก (มี `delay(50)` สั้น ๆ ท้ายรอบ) จึงยังสั่งปั๊มได้ทุกรอบ',
          'ตัวแปรเก็บเวลาใช้ชนิด **`unsigned long`** เพราะ `int` เก็บได้ถึง 32,767 เท่านั้น (ประมาณ 32 วินาที)',
          'ต้อง **ลบ** ทุกครั้ง: `millis() >= TURN_MS` เป็นจริงตลอดหลัง 0.3 วินาทีแรก ไม่ได้จับเวลาอะไรเลย',
        ],
      },
      { tip: 'ในด่านนี้มีคำสั่งใหม่ 2 ตัว: pumpCoolant() สั่งปั๊มหล่อเย็น (ต้องเรียกทุกรอบ) และ atPad() ที่คืน true เมื่อกระสวยอยู่บนลานปล่อย' },
    ],
  },
  world: {
    map: BEND,
    dir: 'N',
    theme: 'planet',
    vehicle: 'shuttle',
    drive: {},
    watchdog: { name: 'pumpCoolant', maxGap: 200, label: 'ปั๊มหล่อเย็น' },
    loops: 110,
  },
  puzzles: [
    {
      id: '6-3-a',
      kind: 'blank',
      title: 'เลี้ยวไปดูนาฬิกาไป',
      mission: 'กระสวยต้องวิ่งไปจนเจอผนัง เลี้ยวขวา 300 ms แล้ววิ่งต่อไปจอดบนลานปล่อย โดยปั๊มหล่อเย็นต้องไม่ขาดจังหวะ เติมส่วนที่จดเวลาและส่วนที่เช็กว่าหมุนมาครบเวลาหรือยัง',
      hints: ['goTo ต้องจดเวลาปัจจุบัน: stateStart = millis();', 'เวลาที่ผ่านไปคือ millis() - stateStart เทียบกับ TURN_MS'],
      code: HEAD + `
void goTo(State s) {
  state = s;
  stateStart = {{0}}();
}

void setup() {
}

void loop() {
  pumpCoolant();
  switch (state) {
    case CRUISE:
      forward();
      if (atPad()) {
        goTo(PARK);
      } else if (readDistance() < DANGER_CM) {
        goTo(TURN);
      }
      break;
    case TURN:
      setMotor(150, -150);
      if ({{1}}() - {{2}} >= {{3}}) {
        goTo(CRUISE);
      }
      break;
    case PARK:
      stopCar();
      break;
  }
  delay(50);
}`,
      bank: ['millis', 'stateStart', 'TURN_MS', 'delay', 'state', 'DANGER_CM'],
      answer: ['millis', 'millis', 'stateStart', 'TURN_MS'],
      goal: { at: 'pad', stopped: true },
    },
    {
      id: '6-3-b',
      kind: 'fix',
      title: 'เครื่องดับที่โค้งแรก',
      mission: 'โปรแกรมนี้ทำให้ปั๊มหล่อเย็นขาดจังหวะตอนเลี้ยว และถึงแก้ตรงนั้นแล้วกระสวยก็ยังเลี้ยวไม่ถึง 90 องศา มีที่ผิด 2 บรรทัด',
      hints: [
        'delay(TURN_MS) หยุดโปรแกรม 300 ms ปั๊มจึงไม่ได้เต้น ต้องเปลี่ยนเป็น if (millis() - stateStart >= TURN_MS) { goTo(CRUISE); }',
        'goTo ตั้ง stateStart = 0; ทุกครั้ง จึงไม่ได้จดเวลาที่เข้าสถานะ ต้องเป็น stateStart = millis();',
      ],
      world: { map: TWO_BENDS },
      code: HEAD + `
void goTo(State s) {
  state = s;
  stateStart = 0;
}

void setup() {
}

void loop() {
  pumpCoolant();
  switch (state) {
    case CRUISE:
      forward();
      if (atPad()) {
        goTo(PARK);
      } else if (readDistance() < DANGER_CM) {
        goTo(TURN);
      }
      break;
    case TURN:
      setMotor(150, -150);
      delay(TURN_MS); goTo(CRUISE);
      break;
    case PARK:
      stopCar();
      break;
  }
  delay(50);
}`,
      fixes: {
        18: { options: ['stateStart = 0;', 'stateStart = millis();', 'stateStart = TURN_MS;'], answer: 1 },
        37: {
          options: ['delay(TURN_MS); goTo(CRUISE);', 'if (millis() - stateStart >= TURN_MS) { goTo(CRUISE); }', 'if (millis() >= TURN_MS) { goTo(CRUISE); }'],
          answer: 1,
        },
      },
      goal: { at: 'pad', stopped: true },
    },
    {
      id: '6-3-c',
      kind: 'type',
      title: 'เติมเชื้อเพลิงแล้วถอยออก',
      mission: 'หัวจ่ายเชื้อเพลิง (ธง) อยู่ปลายซอกตัน กระสวยต้องวิ่งเข้าไปจนสุด ถอยหลัง 500 ms เลี้ยวขวา 300 ms แล้ววิ่งไปจอดบนลานปล่อย เขียน case BACKUP และ case TURN เอง โดยจับเวลาด้วย millis() ห้ามใช้ delay ยาวเพราะปั๊มจะขาดจังหวะ',
      hints: [
        'case BACKUP: backward(); if (millis() - stateStart >= BACKUP_MS) { goTo(TURN); } break;',
        'case TURN: setMotor(150, -150); if (millis() - stateStart >= TURN_MS) { goTo(CRUISE); } break;',
      ],
      world: { map: POCKET_A },
      starter: HEAD_C + `
void loop() {
  pumpCoolant();
  switch (state) {
    case CRUISE:
      forward();
      if (atPad()) {
        goTo(PARK);
      } else if (readDistance() < DANGER_CM) {
        goTo(BACKUP);
      }
      break;
    case BACKUP:
      // ถอยหลัง เมื่ออยู่ในสถานะนี้ครบ BACKUP_MS แล้วไป TURN

      break;
    case TURN:
      // หมุนขวา เมื่อครบ TURN_MS แล้วกลับไป CRUISE

      break;
    case PARK:
      stopCar();
      break;
  }
  delay(50);
}`,
      solution: HEAD_C + `
void loop() {
  pumpCoolant();
  switch (state) {
    case CRUISE:
      forward();
      if (atPad()) {
        goTo(PARK);
      } else if (readDistance() < DANGER_CM) {
        goTo(BACKUP);
      }
      break;
    case BACKUP:
      backward();
      if (millis() - stateStart >= BACKUP_MS) {
        goTo(TURN);
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
      require: [{ re: 'millis\\s*\\(\\s*\\)\\s*-\\s*stateStart', msg: 'ข้อนี้ต้องจับเวลาด้วย millis() - stateStart' }],
      goal: { at: 'pad', stopped: true, flags: true },
      win: 'ปั๊มไม่ขาดจังหวะเลย!',
      cases: [
        { label: 'ซอกสั้น', map: POCKET_A },
        { label: 'ซอกยาว', map: POCKET_B },
      ],
    },
  ],
};

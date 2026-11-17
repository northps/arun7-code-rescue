import { Level } from '../../types';

const GATE_A = ['########', '#..A...#', '#.####.#', '#.####P#', '#B####T#', '########'];
const GATE_B = ['########', '#.A..###', '#A##.###', '#.##P###', '#B##T###', '########'];

const HEAD = `const int DANGER_CM = 20;
const int TURN_MS = 300;

void forward() {
  setMotor(150, 150);
}

void stopCar() {
  setMotor(0, 0);
}
`;

const CODE_FN = `
int portalCode() {
  int sum = 0;
  for (int i = 0; i < 4; i++) {
    int r = readRune();
    if (r > 0) {
      sum += r;
    }
  }
  return sum;
}
`;

// 7-4 โปรแกรมสุดท้าย: ออกแบบเอง
export const r04: Level = {
  id: '7-4',
  act: 7,
  title: 'ปิดประตูมิติ',
  concept: 'โปรแกรมสุดท้าย: วางแผน เขียน ทดสอบ แก้บั๊ก',
  ref: 'R11–R12 · โปรเจกต์สุดท้าย',
  story: `ห้องประตูมิติสว่างด้วยแสงสีม่วง
วงแหวนของเคลธหมุนช้า ๆ อยู่กลางห้อง มีเคลธเฝ้าทางเข้า และมีแท่นควบคุมอยู่ปลายทาง
บนแท่นมีอักขระ 4 ตัว ที่เปลี่ยนค่าทุกครั้งที่ประตูเปิด
วิทยุ: ...บิต... ซ่า... ได้ยินฉันไหม...
มาลี: ฉันช่วยอะไรไม่ได้แล้วนะ ไม่มีโค้ดให้เติม ไม่มีบรรทัดให้แก้
มาลี: เธอรู้ทุกอย่างที่ต้องใช้แล้ว เขียนเองทั้งหมดเลย`,
  outro: `บิตส่งรหัสเข้าแท่น
วงแหวนหมุนช้าลง ช้าลง แล้วหยุด
แสงสีม่วงหดเป็นจุดเดียว ก่อนดับไป
ทั้งยานเงียบสนิทอยู่อึดใจหนึ่ง
แล้วไฟสีขาวของอรุณ-7 ก็ติดขึ้นทุกดวง
มาลีวิ่งเข้ามา คุกเข่าลงกอดบิตไว้
มาลี: เธอเริ่มจากเปิดประตูห้องตัวเองไม่เป็นด้วยซ้ำ จำได้ไหม
บิตกะพริบไฟที่ตาสองครั้ง บนจอเล็ก ๆ ที่หน้าอกมีข้อความขึ้นมาบรรทัดเดียว
บิต: Serial.println("กลับบ้านกัน");
— จบ`,
  lesson: {
    title: 'วางแผนก่อนเขียน',
    blocks: [
      { p: 'ด่านสุดท้ายไม่มีทางเดียวที่ถูก โปรแกรมไหนก็ได้ที่ทำภารกิจสำเร็จในทุกชุดทดสอบถือว่าผ่าน สิ่งที่ต้องทำคือสิ่งที่โปรแกรมเมอร์ทำจริง: **วางแผน เขียนทีละส่วน ทดสอบ แล้วแก้**' },
      {
        list: [
          '**1) แตกงานเป็นชิ้น**: ไปให้ถึงแท่น · จัดการเคลธระหว่างทาง · คำนวณรหัส · ส่งรหัส',
          '**2) เลือกเครื่องมือ**: การขับที่ต้องตัดสินใจระหว่างทาง → state machine · การอ่านอักขระ 4 ตัว → for · การคัดค่าที่ใช้ได้ → if',
          '**3) เขียนทีละชิ้นแล้วรัน**: ให้บิตวิ่งถึงผนังแรกให้ได้ก่อน แล้วค่อยเพิ่มการเลี้ยว แล้วค่อยเพิ่มการสู้',
          '**4) อ่านสิ่งที่เกิดขึ้น**: ชนตรงไหน ตัวแปรเป็นค่าอะไรตอนนั้น ใช้ Serial.println ช่วยดูได้',
        ],
      },
      { p: 'คำสั่งที่มีให้ใช้ในห้องนี้:' },
      { code: 'setMotor(ซ้าย, ขวา);   // ความเร็ว 150 = 1 ช่องต่อ 500 ms · setMotor(150, -150) 300 ms = หมุนขวา 90 องศา\nreadDistance();        // ระยะข้างหน้า (ซม.)\natPad();               // true เมื่ออยู่บนวงสีเขียวหน้าแท่น\nseeKleth();            // true เมื่อสิ่งที่อยู่ตรงหน้าคือเคลธ\nfire();                // ยิงไปข้างหน้า\nreadRune();            // อ่านอักขระครั้งละตัว (มี 4 ตัว)\nclosePortal(code);     // ส่งรหัสปิดประตูมิติ (ทำได้ครั้งเดียว)' },
      { tip: 'รหัสปิดประตู = ผลรวมของอักขระที่มีค่ามากกว่า 0 (ตัวที่ติดลบคือตัวหลอก) และทางไปแท่นเลี้ยวขวาทุกครั้งที่เจอผนัง' },
    ],
  },
  world: {
    map: ['#####', '#.T.#', '#...#', '#.B.#', '#####'],
    dir: 'N',
    feeds: { readRune: [12, -5, 30, 7] },
    actions: { closePortal: { args: 1, label: 'รหัสปิดประตูมิติ', ends: true } },
  },
  puzzles: [
    {
      id: '7-4-a',
      kind: 'type',
      title: 'ถอดรหัสอักขระ',
      mission: 'ซ้อมส่วนคำนวณรหัสก่อน: เขียนฟังก์ชัน int portalCode() ที่อ่านอักขระ 4 ตัวด้วย readRune() แล้วคืนผลรวมของตัวที่มีค่ามากกว่า 0 จากนั้นส่งผลให้ closePortal อักขระจะเปลี่ยนไปในแต่ละชุดทดสอบ',
      hints: [
        'ในฟังก์ชัน: int sum = 0; for (int i = 0; i < 4; i++) { int r = readRune(); if (r > 0) { sum += r; } } return sum;',
        'ใน setup: closePortal(portalCode());',
      ],
      starter: `int portalCode() {
  // อ่านอักขระ 4 ตัว รวมเฉพาะตัวที่มากกว่า 0 แล้ว return ผลรวม

}

void setup() {
  // ส่งรหัสด้วย closePortal

}

void loop() {
}`,
      solution: CODE_FN.trimStart() + `
void setup() {
  closePortal(portalCode());
}

void loop() {
}`,
      require: [{ re: 'readRune\\s*\\(', msg: 'ต้องอ่านอักขระด้วย readRune() ค่าของแต่ละชุดไม่เหมือนกัน' }],
      goal: {},
      cases: [
        { label: 'อักขระชุดที่ 1', feeds: { readRune: [12, -5, 30, 7] }, goal: { set: { closePortal: [49] } } },
        { label: 'อักขระชุดที่ 2', feeds: { readRune: [-8, 20, -3, 15] }, goal: { set: { closePortal: [35] } } },
      ],
    },
    {
      id: '7-4-b',
      kind: 'type',
      title: 'ปิดประตูมิติ',
      mission: 'ด่านสุดท้ายของเกม ออกแบบโปรแกรมเองทั้งหมด: พาบิตไปจอดบนวงสีเขียวหน้าแท่นควบคุม กำจัดเคลธทุกตัวระหว่างทางโดยไม่ยิงทิ้งและไม่ชน แล้วส่งรหัส (ผลรวมของอักขระที่มากกว่า 0) ด้วย closePortal โปรแกรมเดียวต้องผ่านห้องทั้งสองแบบ เปิดบทเรียน (รูปหนังสือ) เพื่อดูคำสั่งที่มีให้ใช้',
      hints: [
        'ใช้โครงของด่าน 7-3 ได้เลย: enum State { CRUISE, FIGHT, TURN, PARK }; กับ goTo() และ switch (state) ใน loop() ที่ลงท้ายด้วย delay(50);',
        'ใน case PARK: stopCar(); แล้ว closePortal(portalCode()); โดยเอาฟังก์ชัน portalCode() จากข้อที่แล้วมาใช้',
      ],
      world: {
        map: GATE_A,
        drive: { stay: true },
        api: ['fire'],
        targets: 1,
        loops: 170,
      },
      starter: HEAD + `
// แผน: 1) ไปให้ถึงวงสีเขียว (เจอผนังเลี้ยวขวา)  2) เจอเคลธ หยุดแล้วยิง
//      3) คำนวณรหัสจากอักขระ 4 ตัว            4) หยุดบนวง แล้ว closePortal(รหัส)

void setup() {

}

void loop() {

  delay(50);
}`,
      solution: HEAD + `
enum State { CRUISE, FIGHT, TURN, PARK };
State state = CRUISE;
unsigned long stateStart = 0;

void goTo(State s) {
  state = s;
  stateStart = millis();
}
` + CODE_FN + `
void setup() {
}

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
      closePortal(portalCode());
      break;
  }
  delay(50);
}`,
      goal: { at: 'pad', stopped: true, targetsLeft: 0 },
      win: 'ประตูมิติปิดแล้ว! อรุณ-7 ปลอดภัย',
      cases: [
        { label: 'ห้องแบบ ก', map: GATE_A, targets: 1, feeds: { readRune: [12, -5, 30, 7] }, goal: { set: { closePortal: [49] } } },
        { label: 'ห้องแบบ ข', map: GATE_B, targets: 2, feeds: { readRune: [-8, 20, -3, 15] }, goal: { set: { closePortal: [35] } } },
      ],
    },
  ],
};

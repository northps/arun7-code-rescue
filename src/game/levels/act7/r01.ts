import { Level } from '../../types';

const lane = (n: number): string[] => ['###', ...Array.from({ length: n - 1 }, () => '#.#'), '#B#', '###'];

const HELPERS = `const int STOP_CM = 8;
const int SLOW_CM = 40;

void cruise() {
  setMotor(200, 200);
}

void creep() {
  setMotor(50, 50);
}

void stopCar() {
  setMotor(0, 0);
}
`;

// 7-1 ฟังก์ชัน + while + เซนเซอร์: เทียบท่า
export const r01: Level = {
  id: '7-1',
  act: 7,
  title: 'เทียบท่าอรุณ-7',
  concept: 'รวมฟังก์ชัน ลูป while และเซนเซอร์',
  ref: 'P05 · P06 · R05–R06',
  story:
    'กระสวยลอยเข้าหาท้องยานอรุณ-7 ประตูโรงเก็บเปิดค้างอยู่ ข้างในมืด ระบบนำร่องเทียบท่าของยานถูกเคลธปิดไปแล้ว มาลีจับคันบังคับไว้แน่น "ฉันพาเข้าประตูได้ แต่ช่วงสุดท้ายต้องเป็นเธอ ผนังท่าอยู่ตรงหน้า ชนแรงไปกระสวยพัง หยุดไกลไปแขนยึดเอื้อมไม่ถึง ต้องหยุดห่างไม่เกินฝ่ามือเดียว"',
  outro: 'แขนยึดของท่าจับกระสวยดัง "กึก" ไฟในโรงเก็บติดขึ้นทีละดวง มาลีปลดเข็มขัด "กลับมาแล้วนะ อรุณ-7 ทีนี้ไปเอายานของเราคืน"',
  lesson: {
    title: 'ทวน: ลูปที่จบด้วยเซนเซอร์',
    blocks: [
      { p: 'องก์สุดท้ายไม่มีคำสั่งใหม่ มีแต่การเอาของที่เรียนมาแล้วมา **ประกอบกัน** ด่านนี้ใช้ `while` (องก์ 2) กับ `readDistance()` (องก์ 5) และฟังก์ชัน (องก์ 3)' },
      { code: 'while (readDistance() > STOP_CM) {   // ยังไกลอยู่ ทำซ้ำ\n  creep();                           // เคลื่อนช้า ๆ\n  delay(50);\n}\nstopCar();                           // หลุดจากลูป = ถึงระยะแล้ว' },
      {
        list: [
          '`while` เช็กเงื่อนไข **ก่อน** ทุกรอบ พอระยะไม่มากกว่า STOP_CM แล้วก็หลุดออกมาทำบรรทัดถัดไป',
          'ในเกมนี้ `cruise()` คือความเร็ว 200 (ราว 11 ซม. ต่อรอบ) และ `creep()` คือความเร็ว 50 (ราว 3 ซม. ต่อรอบ)',
          'วิ่งเร็วอย่างเดียว: รอบหนึ่งไปไกลเกิน หยุดไม่ตรงจุด · วิ่งช้าอย่างเดียว: ตรงจุด แต่นานเกินไป',
          'ทางออกคือ **สองช่วง**: เร็วตอนไกล ช้าตอนใกล้ เขียนเป็นลูปสองลูปต่อกันได้',
        ],
      },
      { tip: 'ห่อขั้นตอนทั้งหมดไว้ในฟังก์ชันชื่อ dock() แล้ว setup() จะเหลือบรรทัดเดียวที่อ่านแล้วรู้เลยว่าทำอะไร' },
    ],
  },
  world: {
    map: lane(3),
    dir: 'N',
    vehicle: 'shuttle',
    drive: {},
  },
  puzzles: [
    {
      id: '7-1-a',
      kind: 'blank',
      title: 'คืบเข้าหาท่า',
      mission: 'ให้กระสวยคืบช้า ๆ เข้าหาผนังท่า และหยุดเมื่อระยะไม่เกิน STOP_CM (8 ซม.) ต้องหยุดห่างผนัง 3 ถึง 9 ซม. โดยไม่ชน เกมจะลองจากระยะเริ่มต้น 2 แบบ',
      hints: ['ทำซ้ำตราบที่ยังไกล: while (readDistance() > STOP_CM)', 'หลุดจากลูปแล้วต้องสั่ง stopCar();'],
      code: HELPERS + `
void setup() {
  {{0}} (readDistance() {{1}} STOP_CM) {
    creep();
    delay(50);
  }
  {{2}}();
}

void loop() {
}`,
      bank: ['while', 'if', '>', '<', 'stopCar', 'creep', 'cruise'],
      answer: ['while', '>', 'stopCar'],
      goal: { stopped: true, frontCm: [3, 9] },
      cases: [
        { label: 'เริ่มใกล้', map: lane(2) },
        { label: 'เริ่มไกล', map: lane(3) },
      ],
    },
    {
      id: '7-1-b',
      kind: 'type',
      title: 'เทียบท่าให้ทันเวลา',
      mission: 'ยานนักล่าไล่ตามมา กระสวยต้องเทียบท่าให้เสร็จภายใน 3 วินาที และยังต้องหยุดห่างผนัง 3 ถึง 9 ซม. เขียนฟังก์ชัน dock() ให้วิ่งเร็วด้วย cruise() จนระยะไม่เกิน SLOW_CM แล้วคืบด้วย creep() จนระยะไม่เกิน STOP_CM แล้วหยุด เกมจะลองจากระยะเริ่มต้น 3 แบบ',
      hints: [
        'ลูปแรก: while (readDistance() > SLOW_CM) { cruise(); delay(50); }',
        'ลูปที่สอง: while (readDistance() > STOP_CM) { creep(); delay(50); } แล้ว stopCar();',
      ],
      starter: HELPERS + `
void dock() {
  // ช่วงที่ 1: วิ่งเร็วจนระยะไม่เกิน SLOW_CM

  // ช่วงที่ 2: คืบช้า ๆ จนระยะไม่เกิน STOP_CM

  // หยุด

}

void setup() {
  dock();
}

void loop() {
}`,
      solution: HELPERS + `
void dock() {
  while (readDistance() > SLOW_CM) {
    cruise();
    delay(50);
  }
  while (readDistance() > STOP_CM) {
    creep();
    delay(50);
  }
  stopCar();
}

void setup() {
  dock();
}

void loop() {
}`,
      require: [{ re: 'readDistance\\s*\\(', msg: 'ต้องใช้ readDistance() ระยะเริ่มต้นของแต่ละชุดไม่เท่ากัน ตั้งเวลาล่วงหน้าไม่ได้' }],
      goal: { stopped: true, frontCm: [3, 9], maxMs: 3000 },
      win: 'เทียบท่าสำเร็จ!',
      cases: [
        { label: 'ระยะ 176 ซม.', map: lane(3) },
        { label: 'ระยะ 256 ซม.', map: lane(4) },
        { label: 'ระยะ 336 ซม.', map: lane(5) },
      ],
    },
  ],
};

import { Level } from '../../types';

const LONG = ['#####', '#...#', '#...#', '#...#', '#.B.#', '#####'];
const ROCK = ['#####', '#...#', '#.X.#', '#...#', '#.B.#', '#####'];
const SHORT = ['#####', '#.X.#', '#...#', '#...#', '#.B.#', '#####'];

const HELPERS = `const int DANGER_CM = 25;

void forward() {
  setMotor(150, 150);
}

void stopCar() {
  setMotor(0, 0);
}
`;

// 5-5 if / else กับเซนเซอร์ใน loop() (R06)
export const p05: Level = {
  id: '5-5',
  act: 5,
  title: 'หยุดก่อนชนผา',
  concept: 'อ่าน → คิด → ทำ ใน loop()',
  ref: 'R06 · if / else กับเซนเซอร์',
  story: `ทางหนีลงไปในหุบเขาแคบ สองข้างเป็นผาหิน
มีหินถล่มขวางทางเป็นระยะ ไม่มีใครรู้ว่าก้อนต่อไปอยู่ตรงไหน
ตั้งเวลาวิ่งล่วงหน้าไม่ได้อีกแล้ว
บิตต้องวิ่งไป ดูไป แล้วหยุดเองให้ทันก่อนชน`,
  outro: `บิตหยุดห่างจากผาหินแค่คืบเดียว
ทุกครั้ง ไม่ว่าหินจะอยู่ตรงไหน
มาลี: เธอไม่ได้จำทางแล้ว เธอมองทางเอง
มาลี: นี่แหละ ที่พวกนักล่าเดาไม่ได้`,
  lesson: {
    title: 'อ่าน → คิด → ทำ วนไปเรื่อย ๆ',
    blocks: [
      { p: 'จนถึงตอนนี้โค้ดอยู่ใน `setup()` ซึ่งทำครั้งเดียว แต่รถที่ต้องระวังของข้างหน้าต้อง **เช็กซ้ำตลอดเวลา** จึงย้ายมาเขียนใน `loop()` ที่วนไม่มีวันจบ' },
      { code: 'const int DANGER_CM = 25;\n\nvoid loop() {\n  int d = readDistance();     // 1) อ่าน\n  if (d < DANGER_CM) {        // 2) คิด\n    stopCar();                // 3) ทำ\n  } else {\n    forward();\n  }\n  delay(50);                  // อ่านประมาณ 20 ครั้งต่อวินาที\n}' },
      {
        list: [
          'ทุกรอบของ `loop()` คือการตัดสินใจใหม่ 1 ครั้ง จากค่าที่เพิ่งอ่าน',
          'ระยะอันตรายเก็บเป็นค่าคงที่ `DANGER_CM` จะได้ปรับที่เดียว',
          'ระหว่าง `delay` รถ **ตาบอด**: ยังวิ่งอยู่แต่ไม่ได้อ่านเซนเซอร์ ถ้า `delay` ยาว รถจะวิ่งเลยจุดที่ควรหยุดไปชน',
          '`DANGER_CM` น้อยเกินไป รถหยุดไม่ทัน · มากเกินไป รถหยุดไกลเกิน',
        ],
      },
      { tip: 'รูปแบบ "อ่าน → คิด → ทำ" นี้คือแบบเดียวกับเกมทายเลขในองก์ 4 ต่างกันแค่อ่านจากเซนเซอร์แทนคำตอบของคลัง' },
    ],
  },
  world: {
    map: LONG,
    dir: 'N',
    theme: 'planet',
    drive: {},
    loops: 45,
  },
  puzzles: [
    {
      id: '5-5-a',
      kind: 'blank',
      title: 'วิ่งไปดูไป',
      mission: 'เติมเงื่อนไขให้บิตวิ่งตรงไปเรื่อย ๆ และหยุดเมื่อระยะข้างหน้าน้อยกว่า DANGER_CM (25 ซม.) ต้องหยุดใกล้สิ่งกีดขวางไม่เกิน 25 ซม. โดยไม่ชน เกมจะย้ายหินไปหลายตำแหน่ง',
      hints: ['อันตรายคือ "ระยะน้อยกว่า": d < DANGER_CM', 'ใกล้แล้วให้ stopCar() ยังไกลให้ forward()'],
      code: HELPERS + `
void setup() {
}

void loop() {
  int d = readDistance();
  if (d {{0}} DANGER_CM) {
    {{1}}();
  } else {
    {{2}}();
  }
  delay(50);
}`,
      bank: ['<', '>', 'stopCar', 'forward', 'readDistance'],
      answer: ['<', 'stopCar', 'forward'],
      goal: { stopped: true, frontCm: [8, 25] },
      cases: [
        { label: 'ทางยาว', map: LONG },
        { label: 'หินกลางทาง', map: ROCK },
        { label: 'หินอยู่ไกลสุด', map: SHORT },
      ],
    },
    {
      id: '5-5-b',
      kind: 'fix',
      title: 'รถตาบอด',
      mission: 'โค้ดนี้หน้าตาถูก แต่กดรันแล้วบิตพุ่งชนผา ดูว่าบิตอ่านเซนเซอร์บ่อยแค่ไหน และหยุดที่ระยะเท่าไร มีที่ผิด 2 บรรทัด',
      hints: [
        'delay(1000) ทำให้บิตวิ่งไป 2 ช่องโดยไม่ได้อ่านเซนเซอร์เลย ต้องเป็น delay(50);',
        'DANGER_CM = 5 น้อยเกินไป กว่าจะรู้ตัวก็ชิดผาแล้ว ต้องเป็น 25',
      ],
      code: `const int DANGER_CM = 5;

void forward() {
  setMotor(150, 150);
}

void stopCar() {
  setMotor(0, 0);
}

void setup() {
}

void loop() {
  int d = readDistance();
  if (d < DANGER_CM) {
    stopCar();
  } else {
    forward();
  }
  delay(1000);
}`,
      fixes: {
        1: { options: ['const int DANGER_CM = 5;', 'const int DANGER_CM = 25;', 'const int DANGER_CM = 400;'], answer: 1 },
        21: { options: ['delay(1000);', 'delay(50);', 'delay(800);'], answer: 1 },
      },
      goal: { stopped: true, frontCm: [8, 25] },
      cases: [
        { label: 'ทางยาว', map: LONG },
        { label: 'หินกลางทาง', map: ROCK },
      ],
    },
    {
      id: '5-5-c',
      kind: 'type',
      title: 'เขียน loop เอง',
      mission: 'เขียน loop() เองทั้งหมด: อ่านระยะ ถ้าน้อยกว่า DANGER_CM ให้หยุด ไม่อย่างนั้นวิ่งต่อ แล้วเว้น delay(50) ทุกรอบ บิตต้องหยุดใกล้สิ่งกีดขวางไม่เกิน 25 ซม. โดยไม่ชน ในทุกเส้นทาง',
      hints: [
        'int d = readDistance(); if (d < DANGER_CM) { stopCar(); } else { forward(); }',
        'อย่าลืม delay(50); ท้าย loop ถ้าไม่มี delay เวลาจะไม่เดินและบิตจะไม่ขยับ',
      ],
      starter: HELPERS + `
void setup() {
}

void loop() {
  // 1) อ่านระยะ  2) ถ้าใกล้กว่า DANGER_CM ให้หยุด ไม่อย่างนั้นวิ่งต่อ  3) delay(50);

}`,
      solution: HELPERS + `
void setup() {
}

void loop() {
  int d = readDistance();
  if (d < DANGER_CM) {
    stopCar();
  } else {
    forward();
  }
  delay(50);
}`,
      require: [{ re: 'readDistance\\s*\\(', msg: 'ต้องอ่านเซนเซอร์ด้วย readDistance() เส้นทางแต่ละชุดยาวไม่เท่ากัน ตั้งเวลาวิ่งล่วงหน้าไม่ได้' }],
      goal: { stopped: true, frontCm: [8, 25] },
      win: 'หยุดทันทุกครั้ง!',
      cases: [
        { label: 'ทางยาว', map: LONG },
        { label: 'หินกลางทาง', map: ROCK },
        { label: 'หินอยู่ไกลสุด', map: SHORT },
      ],
    },
  ],
};

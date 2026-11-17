import { Level } from '../../types';

const ROCK = ['######', '#X####', '#..P.#', '#.####', '#B####', '######'];
const CLEAR = ['######', '#.####', '#..P.#', '#.####', '#B####', '######'];
const CLIFF = ['###', '#V#', '#P#', '#.#', '#.#', '#B#', '###'];

/** ส่งตัวอักษรเดิมซ้ำทุก 200 ms ตั้งแต่ from ถึง to (แอปรีโมตทำแบบนี้ตอนกดปุ่มค้าง) */
function hold(c: string, from: number, to: number): { t: number; c: string }[] {
  const out: { t: number; c: string }[] = [];
  for (let t = from; t <= to; t += 200) out.push({ t, c });
  return out;
}

const HELPERS = `const int SAFE_CM = 25;

void forward() {
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
  }
  delay(50);
}`;

// 6-5 รวมคำสั่งของคนกับเซนเซอร์: กันชน และหยุดเองเมื่อสัญญาณขาด (R10) — ด่านท้ายองก์ 6
export const q05: Level = {
  id: '6-5',
  act: 6,
  title: 'ระบบกันชน',
  concept: 'รวมคำสั่งของคนกับเซนเซอร์: && และหยุดเองเมื่อสัญญาณขาด',
  ref: 'R10 · รับคำสั่งทาง Serial',
  story: `จากบนหอ มาลีมองไม่เห็นหินก้อนเตี้ย ๆ ที่อยู่หลังซากปีกยาน
วิทยุ: ...เดินหน้า... ซ่า... บิต ได้ยิน... ซ่า...
ยานนักล่าของเคลธบินวนกลับมา สัญญาณเริ่มขาดเป็นช่วง ๆ
ถ้ากระสวยทำตามคำสั่งอย่างเดียว มันจะพังก่อนถึงลานปล่อย
บิตต้องเชื่อคนบังคับ แต่ก็ต้องเชื่อตาของตัวเองด้วย`,
  outro: `สัญญาณวิทยุขาดหายไปกลางคำสั่ง
กระสวยหยุดนิ่งเอง บนลานปล่อย ห่างจากขอบเหวแค่ช่วงตัว
มาลีวิ่งลงจากหอ กระโดดขึ้นกระสวย ดึงคันจุดเครื่อง
เปลวไฟสีฟ้าพุ่งออกท้ายลำ
บนฟ้าเหนือป่า ยานอรุณ-7 ยังลอยอยู่ที่เดิม ข้างลำมีแสงสีม่วงของประตูมิติเคลธเปิดค้างอยู่
มาลี: กลับบ้านกัน บิต
มาลี: แล้วไปปิดประตูนั่นซะ
— จบองก์ 6`,
  lesson: {
    title: 'เชื่อคน แต่เช็กด้วยเซนเซอร์',
    blocks: [
      { p: 'รีโมตที่ทำตามคำสั่งอย่างเดียวอันตราย: คนบังคับมองพลาดได้ และสัญญาณขาดได้ โปรแกรมที่ดีมี **ชั้นป้องกัน** อยู่ระหว่าง "อ่านคำสั่ง" กับ "ทำตาม"' },
      { code: 'const int SAFE_CM = 25;\nchar current = \'S\';\nunsigned long lastCmd = 0;        // เวลาที่ได้คำสั่งล่าสุด\n\nvoid loop() {\n  // 1) อ่านคำสั่ง\n  if (Serial.available() > 0) {\n    current = Serial.read();\n    lastCmd = millis();\n  }\n  // 2) กันชน: สั่งเดินหน้า แต่มีของขวางอยู่ใกล้\n  if (current == \'F\' && readDistance() < SAFE_CM) {\n    current = \'S\';\n  }\n  // 3) สัญญาณขาด: เงียบเกิน 500 ms ให้หยุด\n  if (millis() - lastCmd > 500) {\n    current = \'S\';\n  }\n  // 4) ทำตาม current ด้วย switch เหมือนเดิม\n}' },
      {
        list: [
          '`&&` แปลว่า "และ": ต้องจริง **ทั้งสองข้าง** กันชนจึงทำงานเฉพาะตอนสั่งเดินหน้า ยังถอยหลังและหมุนออกจากหินได้',
          'ถ้าใช้ `||` (หรือ) แทน กระสวยจะหยุดทุกครั้งที่สั่ง F ไม่ว่าทางจะโล่งแค่ไหน',
          'แอปรีโมตส่งตัวอักษรเดิม **ซ้ำทุก 200 ms** ตอนกดปุ่มค้าง ถ้าเงียบไปเกิน 500 ms แปลว่าปล่อยปุ่มแล้ว หรือสัญญาณขาด',
          'เซนเซอร์วัดระยะ **มองไม่เห็นเหว** มีแต่การหยุดเองเมื่อสัญญาณขาดที่ช่วยได้',
        ],
      },
      { tip: 'ลำดับสำคัญ: ชั้นป้องกันต้องอยู่ "หลังอ่านคำสั่ง" และ "ก่อน switch" ไม่อย่างนั้นคำสั่งอันตรายจะถูกทำไปแล้วหนึ่งรอบ' },
    ],
  },
  world: {
    map: ROCK,
    dir: 'N',
    theme: 'planet',
    vehicle: 'shuttle',
    drive: {},
    loops: 80,
  },
  puzzles: [
    {
      id: '6-5-a',
      kind: 'blank',
      title: 'กันชน',
      mission: 'มาลีมองไม่เห็นหิน เธอสั่ง F นานเกินไป เติมเงื่อนไขของกันชน: ถ้าคำสั่งคือเดินหน้า และระยะข้างหน้าน้อยกว่า SAFE_CM ให้เปลี่ยนคำสั่งเป็นหยุด กระสวยต้องไม่ชน และยังไปถึงลานปล่อยในทั้งสองเส้นทาง',
      hints: ['"และ" เขียนว่า && และ "ใกล้กว่า" คือ <', "คำสั่งหยุดคือตัวอักษร 'S'"],
      code: HELPERS + `
char current = 'S';

void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    current = Serial.read();
  }
  if (current == 'F' {{0}} readDistance() {{1}} SAFE_CM) {
    current = {{2}};
  }
` + SWITCH,
      bank: ['&&', '||', '<', '>', "'S'", "'F'", "'B'"],
      answer: ['&&', '<', "'S'"],
      goal: { at: 'pad', stopped: true },
      cases: [
        {
          label: 'มีหินขวาง',
          map: ROCK,
          remote: [{ t: 0, c: 'F' }, { t: 1500, c: 'R' }, { t: 1800, c: 'F' }, { t: 2800, c: 'S' }],
        },
        {
          label: 'ทางโล่ง',
          map: CLEAR,
          remote: [{ t: 0, c: 'F' }, { t: 1000, c: 'R' }, { t: 1300, c: 'F' }, { t: 2300, c: 'S' }],
        },
      ],
    },
    {
      id: '6-5-b',
      kind: 'type',
      title: 'สัญญาณขาด',
      mission: 'ด่านท้ายองก์: แอปของมาลีส่งคำสั่งซ้ำทุก 200 ms ตอนกดค้าง และไม่ส่งอะไรเลยเมื่อปล่อยปุ่มหรือสัญญาณขาด เพิ่มชั้นป้องกัน 2 ชั้นก่อน switch: (1) กันชน: สั่ง F แต่ระยะน้อยกว่า SAFE_CM ให้หยุด (2) ถ้าไม่ได้รับคำสั่งเกิน 500 ms ให้หยุด อย่าลืมจดเวลาใน lastCmd ทุกครั้งที่ได้คำสั่ง',
      hints: [
        'ในปีกกาที่อ่านคำสั่ง เพิ่ม lastCmd = millis(); · กันชน: if (current == \'F\' && readDistance() < SAFE_CM) { current = \'S\'; }',
        "สัญญาณขาด: if (millis() - lastCmd > 500) { current = 'S'; }",
      ],
      world: { map: CLIFF },
      starter: HELPERS + `
char current = 'S';
unsigned long lastCmd = 0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    current = Serial.read();
    // จดเวลาที่ได้คำสั่งนี้ไว้ใน lastCmd

  }
  // กันชน: สั่ง F แต่ระยะน้อยกว่า SAFE_CM ให้หยุด

  // สัญญาณขาด: เงียบเกิน 500 ms ให้หยุด

` + SWITCH,
      solution: HELPERS + `
char current = 'S';
unsigned long lastCmd = 0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    current = Serial.read();
    lastCmd = millis();
  }
  if (current == 'F' && readDistance() < SAFE_CM) {
    current = 'S';
  }
  if (millis() - lastCmd > 500) {
    current = 'S';
  }
` + SWITCH,
      goal: { at: 'pad', stopped: true },
      win: 'กระสวยพร้อมปล่อยตัว!',
      cases: [
        { label: 'สัญญาณขาดหน้าเหว', map: CLIFF, remote: hold('F', 0, 1000) },
        {
          label: 'มีหินขวาง',
          map: ROCK,
          remote: [...hold('F', 0, 1400), ...hold('R', 1600, 1800), ...hold('F', 1900, 2700), { t: 2900, c: 'S' }],
        },
        {
          label: 'ทางโล่ง',
          map: CLEAR,
          remote: [...hold('F', 0, 800), ...hold('R', 1000, 1200), ...hold('F', 1300, 2100), { t: 2300, c: 'S' }],
        },
      ],
    },
  ],
};

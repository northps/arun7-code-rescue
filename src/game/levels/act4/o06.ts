import { Level } from '../../types';

// 4-6 วิธีหาบั๊ก (P08) — ด่านท้ายองก์ 4
export const o06: Level = {
  id: '4-6',
  act: 4,
  title: 'บั๊กในเครื่องกำเนิดไฟ',
  concept: 'วิธีหาบั๊ก: อ่าน error ทายผล พิมพ์ค่าดู',
  ref: 'P08 · วิธีหาบั๊ก 5 ขั้น',
  story: `เครื่องกำเนิดไฟได้แบตเตอรี่จากคลังครบแล้ว
แต่โปรแกรมควบคุมเก่าทำงานเพี้ยน บางครั้งไม่ยอมติด บางครั้งรายงานเลขประหลาด
คนเขียนโปรแกรมจากไปนานแล้ว เหลือแต่โค้ด กับบั๊กที่ซ่อนอยู่ในนั้น
มาลีเงยหน้ามองฟ้า
มาลี: บิต... ดูนั่น
จุดแสงสามจุดกำลังเคลื่อนลงมา`,
  outro: `เครื่องกำเนิดไฟคำราม แล้วเดินเรียบ ไฟทั้งสถานีสว่างพร้อมกัน
วิทยุ: …อรุณ-7 เรียกยานกู้ชีพ ยังมีลูกเรือรอดอยู่ในห้องเครื่อง ตอบด้วย…
มาลีคว้าไมค์
เงาของยานนักล่าลำแรกทาบลงบนลานพอดี
มาลี: บิต เราต้องไปแล้ว และคราวนี้เธอต้องวิ่งเองได้
— จบองก์ 4`,
  lesson: {
    title: 'หาบั๊ก 5 ขั้น',
    blocks: [
      { p: 'โค้ดที่รันได้แต่ผลผิดคือ **บั๊ก** คอมไพเลอร์ไม่ช่วยบอก ต้องหาเอง ใช้ 5 ขั้นนี้ได้กับทุกโปรแกรม' },
      {
        list: [
          '**1. อ่าน error บรรทัดแรก** ดูเลขบรรทัด แก้ทีละตัวจากบนลงล่าง',
          '**2. ทายก่อนว่าควรได้อะไร** แล้วเทียบกับที่ได้จริง ต่างกันตรงไหน',
          '**3. พิมพ์ค่าตัวแปรออกมาดู** ด้วย `Serial.println(x);` ก่อนและหลังจุดที่สงสัย (ในเกมนี้ดูแถบตัวแปรและชั้นวางได้ด้วย)',
          '**4. แบ่งครึ่ง** ปิดโค้ดครึ่งหนึ่งด้วย `//` ดูว่าปัญหาหายไหม แล้วแบ่งต่อ',
          '**5. อธิบายโค้ดทีละบรรทัด** ให้คนอื่น (หรือบิต) ฟัง หลายครั้งเจอบั๊กก่อนอธิบายจบ',
        ],
      },
      { p: 'บั๊กที่เจอบ่อยที่สุดในองก์นี้และองก์ก่อน ๆ:' },
      { code: 'if (x = 0)            // ใช้ = แทน ==  (ได้ข้อสังเกตหลังรัน)\nfor (i = 0; i <= 5;)  // อ่านเกินช่องสุดท้ายของอาร์เรย์ 5 ช่อง\nif (v <= 60)          // ขอบเขตผิด: "ต่ำกว่า 60" คือ < 60\nint total = 36000;    // int เก็บได้ถึง 32,767 เกินแล้วค่าเพี้ยน ใช้ long\nfloat a = total / 4;  // จำนวนเต็มหารกัน ทศนิยมหาย ใช้ (float)total / 4' },
      { tip: 'บั๊กบางตัวโผล่เฉพาะกับข้อมูลบางชุด เกมจึงทดสอบหลายชุด ถ้าชุดหนึ่งผ่านแต่อีกชุดไม่ผ่าน ให้ถามว่าสองชุดนี้ต่างกันตรงไหน' },
    ],
  },
  world: {
    map: ['#######', '#..S..#', '#.....#', '#.T.B.#', '#######'],
    dir: 'N',
    theme: 'planet',
    shelf: { name: 'cell', size: 4 },
    feeds: { readCell: [80, 75, 90, 60] },
    actions: { startGenerator: { args: 0, label: 'เครื่องกำเนิดไฟ' } },
  },
  puzzles: [
    {
      id: '4-6-a',
      kind: 'fix',
      title: 'บั๊ก 3 จุด',
      mission: 'โปรแกรมอ่านประจุของแบต 4 ก้อน นับก้อนที่ "อ่อน" (ต่ำกว่า 60) พิมพ์จำนวน และติดเครื่องเฉพาะเมื่อไม่มีก้อนอ่อนเลย มีบั๊ก 3 จุด กดรันก่อน อ่านข้อสังเกต ดูชั้นวาง แล้วค่อยแก้',
      hints: [
        'ชั้นวางกะพริบแดงที่ช่อง [4]: อาร์เรย์ 4 ช่องมี index 0 ถึง 3 ลูปต้องเป็น i < 4',
        '"ต่ำกว่า 60" คือ < 60 (60 พอดีไม่นับว่าอ่อน) และเทียบค่าต้องใช้ == ไม่ใช่ =',
      ],
      code: `int cell[4];

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 4; i++) {
    cell[i] = readCell();
  }
  int weak = 0;
  for (int i = 0; i <= 4; i++) {
    if (cell[i] <= 60) {
      weak++;
    }
  }
  Serial.println(weak);
  if (weak = 0) {
    startGenerator();
  }
}

void loop() {
}`,
      fixes: {
        9: { options: ['for (int i = 0; i <= 4; i++) {', 'for (int i = 0; i < 4; i++) {', 'for (int i = 1; i <= 4; i++) {'], answer: 1 },
        10: { options: ['if (cell[i] <= 60) {', 'if (cell[i] < 60) {', 'if (cell[i] > 60) {'], answer: 1 },
        15: { options: ['if (weak = 0) {', 'if (weak == 0) {', 'if (weak != 0) {'], answer: 1 },
      },
      goal: {},
      cases: [
        { label: 'แบตดีทุกก้อน', feeds: { readCell: [80, 75, 90, 60] }, goal: { serial: '0', called: ['startGenerator'] } },
        { label: 'มีก้อนอ่อน 2 ก้อน', feeds: { readCell: [80, 40, 90, 55] }, goal: { serial: '2', notCalled: ['startGenerator'] } },
      ],
    },
    {
      id: '4-6-b',
      kind: 'fix',
      title: 'บั๊กที่โผล่บางครั้ง',
      mission: 'โปรแกรมอ่านรอบหมุนของกังหัน 4 ตัวจาก readRpm() แล้วตั้งคันเร่งตามค่าเฉลี่ย (ต้องมีทศนิยม) ชุดที่รอบต่ำเกือบถูก แต่ชุดที่รอบสูงได้เลขติดลบ อ่านข้อสังเกตหลังรัน มีที่ผิด 2 บรรทัด',
      hints: [
        'ผลรวม 9000 + 9500 + 8800 + 9105 = 36405 เกิน 32,767 ที่ int เก็บได้ ต้องใช้ long total',
        'total / 4 เป็นจำนวนเต็มหารจำนวนเต็ม ทศนิยมหาย ต้องเขียน (float)total / 4',
      ],
      world: {
        shelf: undefined,
        map: ['#######', '#.X...#', '#.....#', '#.T.B.#', '#######'],
        feeds: { readRpm: [9000, 9500, 8800, 9105] },
        actions: { setThrottle: { args: 1, label: 'คันเร่ง' } },
      },
      code: `void setup() {
  Serial.begin(9600);
  int total = 0;
  for (int i = 0; i < 4; i++) {
    total += readRpm();
  }
  float avg = total / 4;
  Serial.println(avg);
  setThrottle(avg);
}

void loop() {
}`,
      fixes: {
        3: { options: ['int total = 0;', 'long total = 0;', 'byte total = 0;'], answer: 1 },
        7: { options: ['float avg = total / 4;', 'float avg = (float)total / 4;', 'int avg = total / 4;'], answer: 1 },
      },
      goal: {},
      cases: [
        { label: 'รอบสูง', feeds: { readRpm: [9000, 9500, 8800, 9105] }, goal: { set: { setThrottle: [9101.25] }, serial: '9101.25' } },
        { label: 'รอบต่ำ', feeds: { readRpm: [8000, 8200, 8100, 8001] }, goal: { set: { setThrottle: [8075.25] }, serial: '8075.25' } },
      ],
    },
    {
      id: '4-6-c',
      kind: 'type',
      title: 'เปิดไฟทั้งสถานี',
      mission: 'ด่านท้ายองก์: โปรแกรมต้องอ่านแรงดันของแบต 5 ก้อน หาก้อนที่อ่อนที่สุด พิมพ์ Weakest: ตามด้วยค่าของมัน สั่ง replaceBattery( ) ด้วย index ของก้อนนั้น แล้วติดเครื่อง โค้ดเก่ามีบั๊ก 3 จุด (จุดแรกคอมไพเลอร์บอกให้) แก้ในช่องพิมพ์ให้ผ่านทุกชุดทดสอบ',
      hints: [
        'อ่าน error ก่อน: บรรทัด int worstIndex = 0 ขาด ; · จากนั้นดูชั้นวาง: ลูป i <= 5 อ่านช่อง [5] ที่ไม่มี ต้องเป็น i < 5',
        'worstIndex ต้องเก็บ "ตำแหน่ง" คือ i ไม่ใช่ค่า v[i]: worstIndex = i;',
      ],
      world: {
        shelf: { name: 'v', size: 5 },
        feeds: { readVolt: [87, 92, 45, 78, 90] },
        actions: { replaceBattery: { args: 1, label: 'เปลี่ยนแบตช่อง' }, startGenerator: { args: 0, label: 'เครื่องกำเนิดไฟ' } },
      },
      starter: `int v[5];

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 5; i++) {
    v[i] = readVolt();
  }
  int worst = v[0];
  int worstIndex = 0
  for (int i = 1; i <= 5; i++) {
    if (v[i] < worst) {
      worst = v[i];
      worstIndex = v[i];
    }
  }
  Serial.println("Weakest: " + String(worst));
  replaceBattery(worstIndex);
  startGenerator();
}

void loop() {
}`,
      solution: `int v[5];

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 5; i++) {
    v[i] = readVolt();
  }
  int worst = v[0];
  int worstIndex = 0;
  for (int i = 1; i < 5; i++) {
    if (v[i] < worst) {
      worst = v[i];
      worstIndex = i;
    }
  }
  Serial.println("Weakest: " + String(worst));
  replaceBattery(worstIndex);
  startGenerator();
}

void loop() {
}`,
      goal: { called: ['startGenerator'] },
      win: 'ไฟทั้งสถานีติดแล้ว!',
      cases: [
        { label: 'อ่อนสุดอยู่กลางแถว', feeds: { readVolt: [87, 92, 45, 78, 90] }, goal: { set: { replaceBattery: [2] }, serial: 'Weakest: 45' } },
        { label: 'อ่อนสุดอยู่ช่องแรก', feeds: { readVolt: [30, 92, 45, 78, 90] }, goal: { set: { replaceBattery: [0] }, serial: 'Weakest: 30' } },
        { label: 'อ่อนสุดอยู่ช่องสุดท้าย', feeds: { readVolt: [88, 91, 95, 79, 12] }, goal: { set: { replaceBattery: [4] }, serial: 'Weakest: 12' } },
      ],
    },
  ],
};

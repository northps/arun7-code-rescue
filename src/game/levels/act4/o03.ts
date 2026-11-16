import { Level } from '../../types';

// 4-3 ค่ามากสุด ตำแหน่งของค่ามากสุด ค่าเฉลี่ย (P07 · คู่มือหัวข้อ 12)
export const o03: Level = {
  id: '4-3',
  act: 4,
  title: 'จุดที่ร้อนที่สุด',
  concept: 'หาค่ามากสุด ตำแหน่ง และค่าเฉลี่ย',
  ref: 'P07 · คู่มือหัวข้อ 12',
  story:
    'ใต้สถานีมีปล่องความร้อนจากใต้ดิน 5 ปล่อง ถ้าต่อเครื่องกำเนิดไฟเข้ากับปล่องที่ร้อนที่สุด จะได้ไฟมากพอให้วิทยุส่งถึงวงโคจร เครื่องสแกนวัดอุณหภูมิมาให้ครบแล้ว เหลือแค่หาว่าปล่องไหน',
  outro: 'ท่อถูกต่อเข้ากับปล่องที่ร้อนที่สุด ไอน้ำพุ่งผ่านกังหันเก่าจนมันเริ่มหมุนช้า ๆ มาลีมองเข็มวัด "ยังไม่พอ แต่ใกล้แล้ว"',
  lesson: {
    title: 'มากสุด ตำแหน่ง และค่าเฉลี่ย',
    blocks: [
      { p: 'หาค่ามากสุด: ตั้ง "แชมป์" เป็น **ค่าช่องแรก** แล้วไล่เทียบกับช่องที่เหลือ เจอตัวที่มากกว่าก็เปลี่ยนแชมป์' },
      { code: 'int t[5] = {310, 455, 290, 520, 480};\n\nint best = t[0];        // เริ่มจากช่องแรก\nint bestIndex = 0;      // จำด้วยว่าอยู่ช่องไหน\nlong total = 0;\n\nfor (int i = 0; i < 5; i++) {\n  total += t[i];\n  if (t[i] > best) {\n    best = t[i];\n    bestIndex = i;\n  }\n}\n\nfloat avg = (float)total / 5;   // ค่าเฉลี่ยมีทศนิยม' },
      {
        list: [
          'ตั้ง `best = t[0]` ไม่ใช่ `best = 0` เพราะถ้าทุกค่าติดลบ จะไม่มีตัวไหนมากกว่า 0 เลย',
          'อยากรู้ **ตำแหน่ง** ต้องเก็บ `i` ไว้อีกตัวแปร (`bestIndex = i;`) ไม่ใช่เก็บค่า',
          'หาค่าน้อยสุดก็แบบเดียวกัน เปลี่ยน `>` เป็น `<`',
          '`total / 5` ถ้าทั้งคู่เป็นจำนวนเต็ม ทศนิยมถูกตัดทิ้ง ต้องเขียน `(float)total / 5`',
        ],
      },
      { tip: 'ทดสอบโค้ดหาค่ามากสุดด้วยข้อมูล 3 แบบเสมอ: ตัวมากสุดอยู่ช่องแรก อยู่ช่องสุดท้าย และทุกค่าติดลบ' },
    ],
  },
  world: {
    map: ['#######', '#..S..#', '#.....#', '#.T.B.#', '#######'],
    dir: 'N',
    theme: 'planet',
    shelf: { name: 't', size: 5, values: [310, 455, 290, 520, 480] },
    actions: { setTarget: { args: 1, label: 'อุณหภูมิสูงสุด' } },
  },
  puzzles: [
    {
      id: '4-3-a',
      kind: 'blank',
      title: 'ร้อนที่สุดกี่องศา',
      mission: 'เติมโค้ดให้หาอุณหภูมิที่สูงที่สุดใน 5 ปล่อง แล้วส่งให้ setTarget (ต้องได้ 520)',
      hints: ['เริ่มจากช่องแรก: best = t[0]', 'ถ้า t[i] มากกว่า (>) best ให้ best = t[i]'],
      code: `int t[5] = {310, 455, 290, 520, 480};

void setup() {
  int best = t[{{0}}];
  for (int i = 1; i < 5; i++) {
    if (t[i] {{1}} best) {
      best = {{2}};
    }
  }
  setTarget(best);
}

void loop() {
}`,
      bank: ['0', '5', '>', '<', 't[i]', 'i', 'best'],
      answer: ['0', '>', 't[i]'],
      goal: { set: { setTarget: [520] } },
    },
    {
      id: '4-3-b',
      kind: 'type',
      title: 'ปล่องไหน',
      mission: 'รู้อุณหภูมิอย่างเดียวไม่พอ ต้องรู้ว่าเป็น "ปล่องช่องไหน" อ่านอุณหภูมิ 5 ปล่องจาก readVent() เก็บลงอาร์เรย์ t แล้วส่ง index ของปล่องที่ร้อนที่สุดให้ markVent( ) เกมจะทดสอบหลายชุด รวมถึงคืนที่หนาวจนทุกปล่องติดลบ',
      hints: [
        'int best = t[0]; int bestIndex = 0; แล้วในลูป: if (t[i] > best) { best = t[i]; bestIndex = i; }',
        'ห้ามตั้ง best = 0 เพราะชุดที่ทุกค่าติดลบจะไม่มีตัวไหนมากกว่า 0 · ส่งคำตอบด้วย markVent(bestIndex);',
      ],
      world: {
        shelf: { name: 't', size: 5 },
        feeds: { readVent: [310, 455, 290, 520, 480] },
        actions: { markVent: { args: 1, label: 'ปล่องที่เลือก' } },
      },
      starter: `int t[5];

void setup() {
  for (int i = 0; i < 5; i++) {
    t[i] = readVent();
  }
  // หา index ของช่องที่ค่ามากที่สุด

  // ส่ง index ให้ markVent( );

}

void loop() {
}`,
      solution: `int t[5];

void setup() {
  for (int i = 0; i < 5; i++) {
    t[i] = readVent();
  }
  int best = t[0];
  int bestIndex = 0;
  for (int i = 1; i < 5; i++) {
    if (t[i] > best) {
      best = t[i];
      bestIndex = i;
    }
  }
  markVent(bestIndex);
}

void loop() {
}`,
      goal: {},
      cases: [
        { label: 'กลางวัน', feeds: { readVent: [310, 455, 290, 520, 480] }, goal: { set: { markVent: [3] } } },
        { label: 'คืนหนาว (ติดลบ)', feeds: { readVent: [-40, -12, -35, -60, -20] }, goal: { set: { markVent: [1] } } },
        { label: 'ร้อนสุดช่องแรก', feeds: { readVent: [600, 200, 100, 50, 30] }, goal: { set: { markVent: [0] } } },
        { label: 'ร้อนสุดช่องท้าย', feeds: { readVent: [100, 200, 300, 400, 500] }, goal: { set: { markVent: [4] } } },
      ],
    },
    {
      id: '4-3-c',
      kind: 'type',
      title: 'ค่าเฉลี่ยของน้ำหล่อเย็น',
      mission: 'ปั๊มน้ำหล่อเย็นต้องตั้งตาม "ค่าเฉลี่ย" ของทั้ง 5 ปล่อง และต้องละเอียดถึงทศนิยม อ่านค่าจาก readVent() 5 ครั้ง หาผลรวม แล้วส่งค่าเฉลี่ยให้ setCoolant( )',
      hints: [
        'รวมค่าด้วย total += t[i]; แล้ว float avg = (float)total / 5;',
        'ถ้าเขียน total / 5 เฉย ๆ ทศนิยมจะถูกตัดทิ้ง (73.8 กลายเป็น 73) ต้องมี (float) นำหน้า',
      ],
      world: {
        shelf: { name: 't', size: 5 },
        feeds: { readVent: [72, 85, 64, 90, 58] },
        actions: { setCoolant: { args: 1, label: 'ค่าเฉลี่ย' } },
      },
      starter: `int t[5];

void setup() {
  int total = 0;
  for (int i = 0; i < 5; i++) {
    t[i] = readVent();
    // บวกค่าเข้า total

  }
  // คำนวณค่าเฉลี่ยแบบมีทศนิยม แล้วส่งให้ setCoolant( );

}

void loop() {
}`,
      solution: `int t[5];

void setup() {
  int total = 0;
  for (int i = 0; i < 5; i++) {
    t[i] = readVent();
    total += t[i];
  }
  float avg = (float)total / 5;
  setCoolant(avg);
}

void loop() {
}`,
      goal: {},
      win: 'กังหันเริ่มหมุนแล้ว!',
      cases: [
        { label: 'ชุดที่ 1', feeds: { readVent: [72, 85, 64, 90, 58] }, goal: { set: { setCoolant: [73.8] } } },
        { label: 'ชุดที่ 2', feeds: { readVent: [10, 11, 10, 11, 10] }, goal: { set: { setCoolant: [10.4] } } },
      ],
    },
  ],
};

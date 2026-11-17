import { Level } from '../../types';

// 3-4 ฟังก์ชัน bool (P06 · คู่มือหัวข้อ 10)
export const n04: Level = {
  id: '3-4',
  act: 3,
  title: 'ปลอดภัยไหม',
  concept: 'ฟังก์ชันที่ตอบ ใช่ / ไม่ใช่ (bool)',
  ref: 'P06 · คู่มือหัวข้อ 10',
  story: `ยานดิ่งลงผ่านก้อนเมฆ
ถึงเวลากางร่ม และร่มมีผืนเดียว
กางตอนสูงเกิน 3000 เมตร ลมจะฉีกร่มขาด
กางตอนต่ำกว่า 500 เมตร ก็ไม่ทันชะลอ
มาลี: อย่าเดา ให้โปรแกรมถามตัวเองก่อนว่า ปลอดภัยไหม`,
  outro: `ร่มสีส้มกางเต็มผืน ยานกระตุก แล้วค่อย ๆ ลอยลง
ป่าของดาวเวฬาอยู่ใต้เท้านี่เอง
แต่ข้างล่างมีแต่ยอดไม้ ยังไม่เห็นที่ลงเลย`,
  lesson: {
    title: 'ฟังก์ชันที่ตอบ จริง / เท็จ',
    blocks: [
      { p: 'ฟังก์ชันชนิด `bool` คืนค่าได้แค่ `true` หรือ `false` เหมาะกับการตั้ง **คำถาม** แล้วเอาไปใช้ใน `if` ได้เลย' },
      { code: 'bool isTeen(int age) {\n  return age >= 13 && age <= 19;   // เงื่อนไขให้ค่า true / false อยู่แล้ว\n}\n\nvoid setup() {\n  Serial.begin(9600);\n  if (isTeen(17)) {\n    Serial.println("teen");\n  }\n}' },
      {
        list: [
          'ตั้งชื่อเป็นคำถาม เช่น `isSafe`, `isEmpty`, `hasKey` อ่านแล้วรู้เลยว่าตอบใช่หรือไม่ใช่',
          'ไม่ต้องเขียน `if (isSafe(h) == true)` เขียน `if (isSafe(h))` ก็พอ',
          'อยากได้ตรงข้าม ใช้ `!` : `if (!isSafe(h))` อ่านว่า "ถ้าไม่ปลอดภัย"',
        ],
      },
      { tip: 'เงื่อนไขยาว ๆ ที่ใช้หลายที่ ย้ายเข้าฟังก์ชัน bool แล้วตั้งชื่อดี ๆ โค้ดจะอ่านเหมือนประโยค' },
    ],
  },
  world: {
    map: ['#######', '#W.G.W#', '#.....#', '#.T.B.#', '#######'],
    dir: 'N',
    api: ['openChute'],
    sensors: { readAltitude: 2000 },
    pod: { chute: [500, 3000] },
  },
  puzzles: [
    {
      id: '3-4-a',
      kind: 'blank',
      title: 'ถามก่อนกาง',
      mission: 'ฟังก์ชัน isSafe ตอบว่าความสูง h กางร่มได้ไหม: ต้องสูงกว่า 500 "และ" ต่ำกว่า 3000 เติมชนิดของฟังก์ชันและตัวเชื่อมให้ถูก เกมจะทดสอบ 3 ความสูง',
      hints: ['ฟังก์ชันที่ตอบจริง/เท็จมีชนิด bool', 'ต้องจริงทั้งสองข้อพร้อมกัน จึงใช้ && ถ้าใช้ || ความสูง 5000 ก็จะผ่าน (เพราะมากกว่า 500) แล้วร่มขาด'],
      code: '{{0}} isSafe(int h) {\n  return h > 500 {{1}} h < 3000;\n}\n\nvoid setup() {\n  if (isSafe(readAltitude())) {\n    openChute();\n  }\n}\n\nvoid loop() {\n}',
      bank: ['bool', '&&', '||', 'void', 'if'],
      answer: ['bool', '&&'],
      goal: {},
      cases: [
        { label: 'สูง 2000 เมตร', sensors: { readAltitude: 2000 }, goal: { called: ['openChute'] } },
        { label: 'สูง 5000 เมตร', sensors: { readAltitude: 5000 }, goal: { notCalled: ['openChute'] } },
        { label: 'สูง 300 เมตร', sensors: { readAltitude: 300 }, goal: { notCalled: ['openChute'] } },
      ],
    },
    {
      id: '3-4-b',
      kind: 'type',
      title: 'เร็วไปไหม',
      mission: 'ร่มกางแล้ว แต่บางทียานยังตกเร็วเกินไป เขียนฟังก์ชัน bool isSlow(int v) ที่ตอบ true เมื่อความเร็ว v ไม่เกิน 20 ถ้า "ยังไม่ช้าพอ" ให้จุดเครื่องยนต์เบรก 2 วินาที (engineOn, รอ, engineOff) ถ้าช้าพอแล้วไม่ต้องจุด เพราะเปลืองเชื้อเพลิง',
      hints: [
        'bool isSlow(int v) { return v <= 20; } ("ไม่เกิน 20" รวม 20 ด้วย)',
        'if (!isSlow(v)) { engineOn(); delay(2000); engineOff(); }',
      ],
      world: { api: ['engineOn', 'engineOff'], sensors: { readSpeed: 60 }, pod: {} },
      starter: '// เขียนฟังก์ชัน bool isSlow(int v): true เมื่อ v ไม่เกิน 20\n\n\nvoid setup() {\n  int v = readSpeed();\n  // ถ้ายังไม่ช้าพอ: จุดเครื่องยนต์เบรก 2 วินาที\n\n}\n\nvoid loop() {\n}',
      solution: 'bool isSlow(int v) {\n  return v <= 20;\n}\n\nvoid setup() {\n  int v = readSpeed();\n  if (!isSlow(v)) {\n    engineOn();\n    delay(2000);\n    engineOff();\n  }\n}\n\nvoid loop() {\n}',
      require: [{ re: '\\bbool\\s+(?!setup\\b|loop\\b)\\w+\\s*\\(', msg: 'ข้อนี้ต้องสร้างฟังก์ชันชนิด bool เช่น bool isSlow(int v)' }],
      goal: {},
      win: 'ความเร็วพอดีแล้ว!',
      cases: [
        { label: 'ความเร็ว 60', sensors: { readSpeed: 60 }, goal: { burns: [2] } },
        { label: 'ความเร็ว 15', sensors: { readSpeed: 15 }, goal: { burns: [] } },
        { label: 'ความเร็ว 20 พอดี', sensors: { readSpeed: 20 }, goal: { burns: [] } },
      ],
    },
  ],
};

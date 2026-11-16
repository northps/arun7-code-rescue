import { Level } from '../../types';

// 3-3 return (P06 · คู่มือหัวข้อ 10)
export const n03: Level = {
  id: '3-3',
  act: 3,
  title: 'คำนวณมุมลงจอด',
  concept: 'ฟังก์ชันที่คืนค่า (return)',
  ref: 'P06 · คู่มือหัวข้อ 10',
  story:
    'ดาวเวฬาสีเขียวอมฟ้าโตขึ้นเต็มหน้าต่าง แต่ลำแสงเมื่อครู่ทำคอมพิวเตอร์นำร่องดับไป มุมที่ยานต้องเอียงตอนเข้าชั้นบรรยากาศต้องคำนวณเอง มาลีเปิดคู่มือ: "มุม = ความเร็ว หาร 100 แล้วบวก 5" บิตต้องคิดเลขแล้ว "ส่งคำตอบกลับมา" ให้ใช้ต่อ',
  outro: 'ยานเอียงเข้ามุมพอดี เปลวไฟสีส้มลามไปรอบตัวยาน แต่ข้างในยังเย็น มาลีถอนหายใจ "ผ่านชั้นบรรยากาศแล้ว"',
  lesson: {
    title: 'ฟังก์ชันที่ส่งคำตอบกลับ',
    blocks: [
      { p: 'ฟังก์ชันส่งค่ากลับไปให้คนเรียกได้ด้วย `return` และต้องบอก **ชนิดของค่าที่คืน** ไว้หน้าชื่อ แทนคำว่า `void`' },
      { code: 'int area(int w, int h) {       // คืนค่าชนิด int\n  return w * h;\n}\n\nvoid setup() {\n  Serial.begin(9600);\n  int a = area(3, 4);          // a = 12\n  Serial.println(area(5, 5));  // 25\n}' },
      {
        list: [
          'เจอ `return` แล้ว **ออกจากฟังก์ชันทันที** บรรทัดที่อยู่หลังจากนั้นไม่ถูกทำ',
          'ค่าที่คืนมาต้อง **เอาไปใช้**: เก็บใส่ตัวแปร ส่งต่อให้คำสั่งอื่น หรือใช้ในเงื่อนไข ถ้าเรียกเฉย ๆ ค่าจะหายไป',
          '`Serial.println(x);` คือ **แสดงให้คนดู** · `return x;` คือ **ส่งให้โปรแกรมใช้ต่อ** ไม่เหมือนกัน',
          'ฟังก์ชันที่ไม่ใช่ `void` แต่ลืม `return` จะได้ค่ามั่ว (เครื่องไม่ฟ้อง)',
        ],
      },
      { tip: 'ทุกเส้นทางในฟังก์ชันต้องจบที่ `return` เช่น ถ้ามี `if` ที่ return ข้างใน ก็ต้องมี return สำหรับกรณีที่ไม่เข้า `if` ด้วย' },
    ],
  },
  world: {
    map: ['#######', '#W.G.W#', '#.....#', '#.T.B.#', '#######'],
    dir: 'N',
    sensors: { readSpeed: 2000 },
    actions: { setAngle: { args: 1, label: 'มุมลงจอด' } },
    pod: {},
  },
  puzzles: [
    {
      id: '3-3-a',
      kind: 'blank',
      title: 'ส่งคำตอบกลับ',
      mission: 'ฟังก์ชัน landingAngle คำนวณมุมจากความเร็ว (ความเร็ว ÷ 100 + 5) เติมให้ฟังก์ชันส่งคำตอบกลับ แล้วเรียกใช้ให้ถูก เกมจะทดสอบกับความเร็วหลายค่า',
      hints: ['คำตอบอยู่ในตัวแปร angle ต้องส่งกลับด้วย return angle;', 'ใน setup เรียก landingAngle(readSpeed()) แล้วเก็บผลไว้ใน a'],
      code: 'int landingAngle(int speed) {\n  int angle = speed / 100 + 5;\n  {{0}} {{1}};\n}\n\nvoid setup() {\n  int a = {{2}}(readSpeed());\n  setAngle(a);\n}\n\nvoid loop() {\n}',
      bank: ['return', 'angle', 'landingAngle', 'speed', 'void', 'readSpeed'],
      answer: ['return', 'angle', 'landingAngle'],
      goal: {},
      cases: [
        { label: 'ความเร็ว 2000', sensors: { readSpeed: 2000 }, goal: { set: { setAngle: [25] } } },
        { label: 'ความเร็ว 3500', sensors: { readSpeed: 3500 }, goal: { set: { setAngle: [40] } } },
        { label: 'ความเร็ว 800', sensors: { readSpeed: 800 }, goal: { set: { setAngle: [13] } } },
      ],
    },
    {
      id: '3-3-b',
      kind: 'fix',
      title: 'คำตอบหายไปไหน',
      mission: 'กดรันดู: Serial พิมพ์มุมถูกแล้ว แต่ค่าที่ไปถึงแผงมุมลงจอดกลับผิด มีที่ผิด 2 บรรทัด: ในฟังก์ชัน และตอนเรียกใช้',
      hints: [
        'ในฟังก์ชัน: พิมพ์ออก Serial ไม่ได้ส่งค่ากลับ ต้องใช้ return angle;',
        'ใน setup: ค่าที่คืนมาไม่ได้ถูกเก็บ a จึงยังเป็น 0 ต้องเขียน a = landingAngle(readSpeed());',
      ],
      code: 'int landingAngle(int speed) {\n  int angle = speed / 100 + 5;\n  Serial.println(angle);\n}\n\nvoid setup() {\n  Serial.begin(9600);\n  int a = 0;\n  landingAngle(readSpeed());\n  setAngle(a);\n}\n\nvoid loop() {\n}',
      fixes: {
        3: { options: ['Serial.println(angle);', 'return angle;', 'return speed;'], answer: 1 },
        9: { options: ['landingAngle(readSpeed());', 'a = landingAngle(readSpeed());', 'a = readSpeed();'], answer: 1 },
      },
      goal: {},
      cases: [
        { label: 'ความเร็ว 2000', sensors: { readSpeed: 2000 }, goal: { set: { setAngle: [25] } } },
        { label: 'ความเร็ว 1200', sensors: { readSpeed: 1200 }, goal: { set: { setAngle: [17] } } },
      ],
    },
    {
      id: '3-3-c',
      kind: 'type',
      title: 'ฝั่งไหนร้อนกว่า',
      mission: 'ตัวยานร้อนสองฝั่งไม่เท่ากัน โล่กันความร้อนต้องตั้งตามฝั่งที่ร้อนกว่า เขียนฟังก์ชัน biggest ที่รับเลข 2 ตัวแล้วคืนตัวที่มากกว่า แล้วส่งผลให้ setShield',
      hints: [
        'int biggest(int a, int b) { if (a > b) { return a; } return b; }',
        'ใน setup: setShield(biggest(left, right));',
      ],
      world: {
        sensors: { readHeatLeft: 700, readHeatRight: 900 },
        actions: { setShield: { args: 1, label: 'โล่กันความร้อน' } },
      },
      starter: '// เขียนฟังก์ชัน int biggest(int a, int b)\n// คืนค่าตัวที่มากกว่า\n\n\nvoid setup() {\n  int left = readHeatLeft();\n  int right = readHeatRight();\n  // ส่งค่าที่มากกว่าให้ setShield( );\n\n}\n\nvoid loop() {\n}',
      solution: 'int biggest(int a, int b) {\n  if (a > b) {\n    return a;\n  }\n  return b;\n}\n\nvoid setup() {\n  int left = readHeatLeft();\n  int right = readHeatRight();\n  setShield(biggest(left, right));\n}\n\nvoid loop() {\n}',
      require: [
        { re: '\\b(int|long|float)\\s+(?!setup\\b|loop\\b)\\w+\\s*\\([^)]*,[^)]*\\)\\s*\\{', msg: 'ข้อนี้ต้องสร้างฟังก์ชันที่รับค่า 2 ตัวและคืนค่า เช่น int biggest(int a, int b)' },
        { re: '\\breturn\\b', msg: 'ฟังก์ชันต้องส่งคำตอบกลับด้วย return' },
      ],
      goal: {},
      win: 'โล่กันความร้อนรับไว้ได้!',
      cases: [
        { label: 'ซ้าย 700 ขวา 900', sensors: { readHeatLeft: 700, readHeatRight: 900 }, goal: { set: { setShield: [900] } } },
        { label: 'ซ้าย 1200 ขวา 400', sensors: { readHeatLeft: 1200, readHeatRight: 400 }, goal: { set: { setShield: [1200] } } },
        { label: 'เท่ากัน 650', sensors: { readHeatLeft: 650, readHeatRight: 650 }, goal: { set: { setShield: [650] } } },
      ],
    },
  ],
};

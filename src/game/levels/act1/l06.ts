import { Level } from '../../types';

// 1-6 การคำนวณ (P03 · คู่มือหัวข้อ 5)
export const l06: Level = {
  id: '1-6',
  act: 1,
  title: 'แบ่งพลังงาน',
  concept: 'คำนวณ: + - * / % และกับดักหารจำนวนเต็ม',
  ref: 'P03 · คู่มือหัวข้อ 5',
  story: `ลิฟต์ขนของคือทางเดียวที่ลงไปถึงชั้นโรงเก็บยาน
ไฟหลักถูกตัด เหลือเซลล์พลังงานสำรองไม่กี่ก้อน
ตั้งกำลังมากไป ฟิวส์ขาด น้อยไป ลิฟต์ไม่ขยับ
ไม่มีที่ให้เดา ต้องให้โปรแกรมคำนวณให้พอดี`,
  outro: `มอเตอร์ลิฟต์ครางขึ้นช้า ๆ แล้วนิ่ง
ตัวเลขบนแผงตรงเป๊ะ
บิต: บี๊บ! > พอดี
หุ่นตัวเล็กหมุนตัวหนึ่งรอบ ท่าทางภูมิใจกว่าที่หุ่นซ่อมบำรุงควรจะเป็น`,
  lesson: {
    title: 'ให้เครื่องคิดเลข',
    blocks: [
      { code: '4 * 3      // 12\n7 / 2      // 3    จำนวนเต็มหารกัน "เศษทิ้ง"\n7.0 / 2    // 3.50 มีทศนิยมตัวหนึ่ง ได้ทศนิยม\n7 % 2      // 1    เศษจากการหาร' },
      {
        list: [
          'ลำดับเหมือนคณิตศาสตร์: `*` `/` `%` ก่อน `+` `-` ไม่แน่ใจให้ **ใส่วงเล็บ**',
          '`10 / 4 * 4` ได้ **8** ไม่ใช่ 10 (เพราะ `10 / 4` ได้ 2 ก่อน)',
          '`float avg = total / count;` ถ้าทั้งคู่เป็น `int` ทศนิยมหายไปก่อนจะถึงกล่อง แก้เป็น `(float)total / count`',
          '`%` ใช้บ่อย: เลขคู่คี่ (`n % 2`), แปลงวินาทีเป็น นาที:วินาที',
        ],
      },
      { tip: '3725 วินาที = `3725 / 60` นาที เหลือเศษ `3725 % 60` วินาที' },
    ],
  },
  world: {
    map: ['  ...  ', '###D###', '#.T..X#', '#....X#', '#..B..#', '#######'],
    dir: 'N',
    sensors: { countCells: 3, readTimer: 125 },
    actions: {
      setPower: { args: 1, label: 'กำลังลิฟต์', opensDoor: true },
      setFlow: { args: 1, label: 'อัตราไหล' },
      setReserve: { args: 1, label: 'พลังงานสำรอง', opensDoor: true },
      setClock: { args: 2, label: 'นาที : วินาที', opensDoor: true },
    },
  },
  puzzles: [
    {
      id: '1-6-a',
      kind: 'blank',
      title: 'เซลล์ละ 25 หน่วย',
      mission: 'countCells() นับเซลล์พลังงานที่เหลือ แต่ละก้อนให้ 25 หน่วย ตั้งกำลังลิฟต์ = จำนวนเซลล์ คูณ 25 (เกมจะทดสอบกับจำนวนเซลล์หลายค่า)',
      hints: ['เครื่องหมายคูณคือ *', 'int power = cells * 25; แล้ว setPower(power);'],
      code: 'void setup() {\n  int cells = countCells();\n  int power = cells {{0}} 25;\n  setPower({{1}});\n}\n\nvoid loop() {\n}',
      bank: ['+', '-', '*', '/', '%', 'power', 'cells'],
      answer: ['*', 'power'],
      goal: { door: 'open' },
      cases: [
        { label: 'เหลือ 3 ก้อน', sensors: { countCells: 3 }, goal: { set: { setPower: [75] } } },
        { label: 'เหลือ 4 ก้อน', sensors: { countCells: 4 }, goal: { set: { setPower: [100] } } },
      ],
    },
    {
      id: '1-6-b',
      kind: 'fix',
      title: 'ทศนิยมที่หายไป',
      mission: 'พลังงาน 5 หน่วย แบ่งเข้า 2 ท่อ ต้องได้ท่อละ 2.5 และพลังงานสำรองต้องเป็น (5 + 1) × 2 = 12 โค้ดนี้ไม่มี error เลย แต่ค่าผิดทั้งสองจุด',
      hints: [
        'total กับ pipes เป็น int ทั้งคู่ 5 / 2 จึงได้ 2 ต้องแปลงเป็นทศนิยมก่อนหาร: (float)total / pipes',
        'total + 1 * 2 เครื่องคูณก่อน ได้ 5 + 2 = 7 ต้องใส่วงเล็บ: (total + 1) * 2',
      ],
      code: 'void setup() {\n  int total = 5;\n  int pipes = 2;\n  float flow = total / pipes;\n  setFlow(flow);\n  setReserve(total + 1 * 2);\n}\n\nvoid loop() {\n}',
      fixes: {
        4: { options: ['float flow = total / pipes;', 'float flow = (float)total / pipes;', 'int flow = total / pipes;'], answer: 1 },
        6: { options: ['setReserve(total + 1 * 2);', 'setReserve((total + 1) * 2);', 'setReserve(total + (1 * 2));'], answer: 1 },
      },
      goal: { door: 'open', set: { setFlow: [2.5], setReserve: [12] } },
    },
    {
      id: '1-6-c',
      kind: 'type',
      title: 'นาที กับ วินาที',
      mission: 'readTimer() บอกเวลาที่ลิฟต์ต้องใช้เป็น "วินาที" แต่นาฬิกาของลิฟต์รับเป็น นาที กับ วินาที: setClock(นาที, วินาที) เช่น 125 วินาที = 2 นาที 5 วินาที',
      hints: ['นาที = t / 60 (เศษทิ้งพอดี) วินาทีที่เหลือ = t % 60', 'setClock(t / 60, t % 60);'],
      starter: 'void setup() {\n  int t = readTimer();\n  // คำนวณนาทีและวินาทีจาก t แล้วเรียก setClock(นาที, วินาที);\n\n}\n\nvoid loop() {\n}',
      solution: 'void setup() {\n  int t = readTimer();\n  int m = t / 60;\n  int s = t % 60;\n  setClock(m, s);\n}\n\nvoid loop() {\n}',
      goal: { door: 'open' },
      cases: [
        { label: '125 วินาที', sensors: { readTimer: 125 }, goal: { set: { setClock: [2, 5] } } },
        { label: '200 วินาที', sensors: { readTimer: 200 }, goal: { set: { setClock: [3, 20] } } },
        { label: '59 วินาที', sensors: { readTimer: 59 }, goal: { set: { setClock: [0, 59] } } },
      ],
    },
  ],
};

import { Level } from '../../types';

const HEAD = `const int LIMIT = 80;
int temp[5];
`;

// 7-2 อาร์เรย์ + for + if: เปิดระบบห้องเครื่อง
export const r02: Level = {
  id: '7-2',
  act: 7,
  title: 'ยึดห้องเครื่อง',
  concept: 'รวมอาร์เรย์ ลูป for และ if',
  ref: 'P04 · P05 · P07',
  story:
    'ห้องเครื่องเงียบและร้อนอบ เคลธปิดระบบทั้ง 5 ตัวของยานแล้วปล่อยให้เตาปฏิกรณ์เดินเปล่า บางระบบร้อนจนเปิดไม่ได้ ถ้าฝืนเปิดมันจะไหม้ มาลีเช็ดเหงื่อ "วัดอุณหภูมิทีละตัว เก็บไว้ก่อน แล้วค่อยตัดสินใจว่าจะเปิดตัวไหน อย่าเปิดตัวที่ถึง 80 องศา"',
  outro: 'ระบบที่เย็นพอกลับมาทำงานทีละตัว พื้นห้องเครื่องเริ่มสั่นเบา ๆ อย่างที่เคยเป็น มาลีมองแผงควบคุม "ไฟฟ้ากลับมาแล้ว ประตูทุกบานบนยานเป็นของเราอีกครั้ง เหลือบานเดียวที่ไม่ใช่ของเรา"',
  lesson: {
    title: 'ทวน: เก็บก่อน แล้วค่อยตัดสินใจ',
    blocks: [
      { p: 'ด่านนี้ประกอบ **อาร์เรย์** (องก์ 4) **for** (องก์ 2) และ **if** (องก์ 1): ลูปแรกอ่านค่าเก็บลงอาร์เรย์ ลูปที่สองเดินดูทีละช่องแล้วตัดสินใจ' },
      { code: 'int temp[5];\n\nfor (int i = 0; i < 5; i++) {\n  temp[i] = readTemp();          // อ่านครั้งละค่า เก็บลงช่องที่ i\n}\n\nfor (int i = 0; i < 5; i++) {\n  if (temp[i] < LIMIT) {         // เย็นพอ\n    startSystem(i);              // เปิดระบบหมายเลข i\n  }\n}' },
      {
        list: [
          'อาร์เรย์ 5 ช่องมี index 0 ถึง 4 เงื่อนไขของลูปจึงเป็น `i < 5`',
          '`i` ทำสองหน้าที่: เป็นตำแหน่งในอาร์เรย์ และเป็นหมายเลขระบบที่ส่งให้ `startSystem`',
          'index ซ้อนกันได้: `temp[order[i]]` คือ "อุณหภูมิของระบบที่อยู่ลำดับที่ i ในรายการ order"',
          'นับจำนวนด้วยตัวแปรที่เริ่มจาก 0 แล้ว `count++` ทุกครั้งที่เงื่อนไขเป็นจริง',
        ],
      },
      { tip: 'readTemp() ให้ค่าได้ 5 ครั้งเท่านั้น จึงต้องเก็บลงอาร์เรย์ไว้ จะเรียกซ้ำตอนตัดสินใจไม่ได้' },
    ],
  },
  world: {
    map: ['#######', '#..S..#', '#.....#', '#.T.B.#', '#######'],
    dir: 'N',
    shelf: { name: 'temp', size: 5 },
    feeds: { readTemp: [72, 85, 64, 91, 40] },
    actions: { startSystem: { args: 1, label: 'เปิดระบบ' } },
  },
  puzzles: [
    {
      id: '7-2-a',
      kind: 'blank',
      title: 'เปิดเฉพาะตัวที่เย็นพอ',
      mission: 'ลูปแรกอ่านอุณหภูมิของระบบทั้ง 5 ตัวเก็บลง temp แล้ว เติมลูปที่สองให้เปิดระบบหมายเลข i ด้วย startSystem เฉพาะตัวที่อุณหภูมิน้อยกว่า LIMIT ไล่จากหมายเลข 0 ถึง 4',
      hints: ['ลูปต้องเดินครบ 5 ช่อง: i < 5 และดูค่าที่ temp[i]', 'เย็นพอคือ temp[i] < LIMIT และหมายเลขระบบคือ i'],
      code: HEAD + `
void setup() {
  for (int i = 0; i < 5; i++) {
    temp[i] = readTemp();
  }
  for (int i = 0; i < {{0}}; i++) {
    if (temp[{{1}}] {{2}} LIMIT) {
      startSystem({{3}});
    }
  }
}

void loop() {
}`,
      bank: ['5', '4', 'i', '0', '<', '>', 'LIMIT'],
      answer: ['5', 'i', '<', 'i'],
      goal: {},
      cases: [
        { label: 'ชุดที่ 1', feeds: { readTemp: [72, 85, 64, 91, 40] }, goal: { sequence: { startSystem: [[0], [2], [4]] } } },
        { label: 'ชุดที่ 2', feeds: { readTemp: [95, 30, 81, 79, 60] }, goal: { sequence: { startSystem: [[1], [3], [4]] } } },
      ],
    },
    {
      id: '7-2-b',
      kind: 'type',
      title: 'เปิดตามลำดับความสำคัญ',
      mission: 'ระบบต้องเปิดตามลำดับความสำคัญในอาร์เรย์ order (ตัวแรกสำคัญที่สุด) ข้ามตัวที่อุณหภูมิถึง LIMIT แล้ว เขียนลูปที่เดินตาม order เปิดระบบที่เย็นพอ นับจำนวนที่เปิดได้ แล้วพิมพ์จำนวนนั้นออก Serial',
      hints: [
        'for (int i = 0; i < 5; i++) { int id = order[i]; if (temp[id] < LIMIT) { startSystem(id); count++; } }',
        'หลังลูป: Serial.println(count);',
      ],
      starter: HEAD + `int order[5] = {3, 0, 4, 1, 2};

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 5; i++) {
    temp[i] = readTemp();
  }
  int count = 0;
  // เดินตาม order: เปิดระบบที่ temp น้อยกว่า LIMIT แล้วนับ

  // พิมพ์ count

}

void loop() {
}`,
      solution: HEAD + `int order[5] = {3, 0, 4, 1, 2};

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 5; i++) {
    temp[i] = readTemp();
  }
  int count = 0;
  for (int i = 0; i < 5; i++) {
    int id = order[i];
    if (temp[id] < LIMIT) {
      startSystem(id);
      count++;
    }
  }
  Serial.println(count);
}

void loop() {
}`,
      goal: {},
      win: 'ห้องเครื่องกลับมาเป็นของเรา!',
      cases: [
        { label: 'ชุดที่ 1', feeds: { readTemp: [72, 85, 64, 91, 40] }, goal: { sequence: { startSystem: [[0], [4], [2]] }, serial: '3' } },
        { label: 'ชุดที่ 2', feeds: { readTemp: [95, 30, 81, 79, 90] }, goal: { sequence: { startSystem: [[3], [1]] }, serial: '2' } },
      ],
    },
  ],
};

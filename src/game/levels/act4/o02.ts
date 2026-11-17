import { Level } from '../../types';

// 4-2 for กับอาร์เรย์ (P07 · คู่มือหัวข้อ 12)
export const o02: Level = {
  id: '4-2',
  act: 4,
  title: 'อ่านทุกช่อง',
  concept: 'ใช้ for ไล่อ่านอาร์เรย์',
  ref: 'P07 · คู่มือหัวข้อ 12',
  story: `บนลานข้างสถานีมีแผงโซลาร์เก่าเรียงเป็นแถวยาว
บางแผงร้าว บางแผงยังดี
มาลี: รวมกันแล้วได้ไฟเท่าไรนะ อ่านทีละแผงแล้วบวกกันไปเรื่อย ๆ สิ
บิตมองแถวแผงที่ยาวสุดลูกตา
บิต: บี๊บ > for`,
  outro: `ตัวเลขพลังงานรวมขึ้นบนแผง
ไม่มาก แต่ไฟของสถานีกะพริบ แล้วติด
มาลี: พอสำหรับเครื่องสแกนแล้ว`,
  lesson: {
    title: 'ลูป for กับอาร์เรย์',
    blocks: [
      { p: 'อาร์เรย์กับ `for` เป็นคู่กัน: ให้ตัวนับ `i` วิ่งตั้งแต่ **0 ถึงก่อนขนาดของอาร์เรย์** แล้วใช้ `i` เป็น index' },
      { code: 'int panel[5] = {12, 7, 20, 15, 9};\nint total = 0;\n\nfor (int i = 0; i < 5; i++) {\n  total += panel[i];   // รอบแรก panel[0] รอบสุดท้าย panel[4]\n}' },
      {
        list: [
          'เริ่มที่ `i = 0` และเงื่อนไขคือ `i < 5` **ไม่ใช่** `i <= 5` (แบบหลังจะอ่าน `panel[5]` ที่ไม่มีอยู่)',
          '`total += x` คือบวกเพิ่มเข้าไป · `total = x` คือทับค่าเดิมทิ้ง',
          'ตัวแปรผลรวมต้องเริ่มที่ 0 ก่อนเข้าลูป',
          'ไล่ถอยหลังก็ได้: `for (int i = 4; i >= 0; i--)`',
          'เก็บค่าลงอาร์เรย์ในลูปก็ได้: `panel[i] = readPanel();`',
        ],
      },
      { tip: 'ถ้าผลรวมออกมาเป็นเลขติดลบแปลก ๆ ให้สงสัยก่อนเลยว่าลูปอ่านเกินช่องสุดท้าย' },
    ],
  },
  world: {
    map: ['#######', '#..S..#', '#.....#', '#.T.B.#', '#######'],
    dir: 'N',
    theme: 'planet',
    shelf: { name: 'panel', size: 5, values: [12, 7, 20, 15, 9] },
    actions: { setPower: { args: 1, label: 'พลังงานรวม' } },
  },
  puzzles: [
    {
      id: '4-2-a',
      kind: 'blank',
      title: 'รวมพลังงาน 5 แผง',
      mission: 'เติมลูปให้อ่านแผงครบทั้ง 5 ช่อง ช่องละครั้ง แล้วส่งผลรวมให้ setPower (ต้องได้ 63)',
      hints: ['index ช่องแรกคือ 0 ลูปจึงเริ่มที่ i = 0', 'เงื่อนไขคือ i < 5 และในลูปอ่าน panel[i]'],
      code: `int panel[5] = {12, 7, 20, 15, 9};

void setup() {
  int total = 0;
  for (int i = {{0}}; i {{1}} 5; i++) {
    total += panel[{{2}}];
  }
  setPower(total);
}

void loop() {
}`,
      bank: ['0', '1', '<', '<=', 'i', '5', 'total'],
      answer: ['0', '<', 'i'],
      goal: { set: { setPower: [63] } },
    },
    {
      id: '4-2-b',
      kind: 'fix',
      title: 'ผลรวมติดลบ',
      mission: 'โค้ดนี้ควรได้ 63 แต่กดรันแล้วได้เลขติดลบประหลาด ดูชั้นวางว่าลูปอ่านช่องไหนบ้าง มีที่ผิด 2 บรรทัด',
      hints: [
        'ลูปเริ่มที่ 1 จึงข้ามช่อง [0] และ i <= 5 ทำให้อ่านช่อง [5] ที่ไม่มีอยู่ ต้องเป็น i = 0; i < 5',
        'total = panel[i]; ทับค่าเดิมทุกรอบ ต้องใช้ total += panel[i];',
      ],
      code: `int panel[5] = {12, 7, 20, 15, 9};

void setup() {
  Serial.begin(9600);
  int total = 0;
  for (int i = 1; i <= 5; i++) {
    total = panel[i];
  }
  Serial.println(total);
  setPower(total);
}

void loop() {
}`,
      fixes: {
        6: { options: ['for (int i = 1; i <= 5; i++) {', 'for (int i = 0; i < 5; i++) {', 'for (int i = 0; i <= 5; i++) {'], answer: 1 },
        7: { options: ['total = panel[i];', 'total += panel[i];', 'total += i;'], answer: 1 },
      },
      goal: { set: { setPower: [63] }, serial: '63' },
    },
    {
      id: '4-2-c',
      kind: 'type',
      title: 'แถวแผง 6 ช่อง',
      mission: 'แถวที่สองมี 6 แผง ค่าต้องอ่านจากเซนเซอร์ readPanel() ทีละแผง (เรียก 1 ครั้งได้ค่าของแผงถัดไป) เก็บทั้ง 6 ค่าลงอาร์เรย์ชื่อ panel แล้วพิมพ์ค่ากลับหลัง จากแผงสุดท้ายมาแผงแรก บรรทัดละค่า และส่งผลรวมให้ setPower เกมจะทดสอบกับค่าหลายชุด',
      hints: [
        'int panel[6]; แล้ว for (int i = 0; i < 6; i++) { panel[i] = readPanel(); total += panel[i]; }',
        'พิมพ์กลับหลัง: for (int i = 5; i >= 0; i--) { Serial.println(panel[i]); }',
      ],
      world: { shelf: { name: 'panel', size: 6 }, feeds: { readPanel: [14, 9, 22, 5, 17, 11] } },
      starter: `int panel[6];

void setup() {
  Serial.begin(9600);
  int total = 0;
  // ลูปที่ 1: อ่าน readPanel() เก็บลง panel[i] และบวกเข้า total

  // ลูปที่ 2: พิมพ์ค่ากลับหลัง จาก panel[5] ถึง panel[0]

  setPower(total);
}

void loop() {
}`,
      solution: `int panel[6];

void setup() {
  Serial.begin(9600);
  int total = 0;
  for (int i = 0; i < 6; i++) {
    panel[i] = readPanel();
    total += panel[i];
  }
  for (int i = 5; i >= 0; i--) {
    Serial.println(panel[i]);
  }
  setPower(total);
}

void loop() {
}`,
      require: [
        { re: '\\bfor\\b', msg: 'ข้อนี้ต้องใช้ลูป for ไล่ทีละช่อง' },
        { re: '\\w+\\s*\\[\\s*\\w+\\s*\\]\\s*=[^=]', msg: 'ต้องเก็บค่าจากเซนเซอร์ลงช่องของอาร์เรย์ เช่น panel[i] = readPanel();' },
      ],
      goal: {},
      cases: [
        { label: 'ชุดที่ 1', feeds: { readPanel: [14, 9, 22, 5, 17, 11] }, goal: { set: { setPower: [78] }, serial: '11\n17\n5\n22\n9\n14' } },
        { label: 'ชุดที่ 2', feeds: { readPanel: [3, 3, 8, 1, 0, 6] }, goal: { set: { setPower: [21] }, serial: '6\n0\n1\n8\n3\n3' } },
      ],
    },
  ],
};

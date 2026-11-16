import { Level } from '../../types';

// 4-4 String และ char (คู่มือหัวข้อ 13)
export const o04: Level = {
  id: '4-4',
  act: 4,
  title: 'ถอดสัญญาณเคลธ',
  concept: 'String: length() charAt() และการต่อข้อความ',
  ref: 'P07 · คู่มือหัวข้อ 13',
  story:
    'พอสถานีมีไฟ เครื่องรับวิทยุเก่าก็ดังซ่าขึ้นมาเอง แต่เสียงที่ได้ยินไม่ใช่ของลูกเรืออรุณ-7 เป็นสัญญาณของชาวเคลธ ส่งมาเป็นตัวอักษรเรียงกัน มาลีหน้าซีด "ถ้าเราอ่านออก เราจะรู้ว่าพวกมันกำลังทำอะไร"',
  outro: 'ข้อความเตือนถูกส่งไปที่ค่ายพัก มาลีพับแผนที่ "พวกมันส่งยานนักล่าลงมาแล้ว เรามีเวลาไม่มาก ต้องหาเสบียงแล้วเปิดเครื่องกำเนิดไฟให้ได้ก่อนพวกมันมาถึง"',
  lesson: {
    title: 'String: ข้อความเป็นตัวอักษรที่เรียงกัน',
    blocks: [
      { p: '`String` เก็บข้อความ และมองได้เหมือนอาร์เรย์ของตัวอักษร: ตัวแรกอยู่ที่ตำแหน่ง **0** เหมือนกัน' },
      { code: 'String msg = "KELTH";\n\nmsg.length()        // 5   จำนวนตัวอักษร\nmsg.charAt(0)       // \'K\' ตัวแรก\nmsg.charAt(4)       // \'H\' ตัวสุดท้าย (length() - 1)\n\nString a = "ID-" + String(7);   // "ID-7"\nif (msg == "KELTH") { }         // เทียบข้อความด้วย ==\nif (msg.charAt(0) == \'K\') { }   // เทียบตัวอักษรใช้ \' \'' },
      {
        list: [
          '`length()` และ `charAt()` ต้องมีวงเล็บเสมอ เพราะเป็นคำสั่ง',
          'ตัวอักษรตัวเดียว (`char`) ใช้ `\' \'` · ข้อความ (`String`) ใช้ `" "`',
          'จะต่อข้อความกับตัวเลข ต้องแปลงตัวเลขก่อนด้วย `String(n)` เขียน `"ID-" + 7` ตรง ๆ ได้ผลมั่ว',
          'ไล่ดูทีละตัว: `for (int i = 0; i < msg.length(); i++) { ... msg.charAt(i) ... }`',
        ],
      },
      { tip: 'ตัวสุดท้ายของข้อความยาว 5 ตัวอยู่ที่ตำแหน่ง 4 กับดักเดียวกับอาร์เรย์' },
    ],
  },
  world: {
    map: ['#######', '#.X...#', '#.....#', '#.T.B.#', '#######'],
    dir: 'N',
    theme: 'planet',
  },
  puzzles: [
    {
      id: '4-4-a',
      kind: 'blank',
      title: 'อ่านสัญญาณ',
      mission: 'เติมคำสั่งให้พิมพ์ 3 บรรทัด: ความยาวของข้อความ (5) ตัวอักษรตัวแรก (K) และป้ายรหัส ID-7',
      hints: ['ความยาวใช้ length() · ตัวอักษรตำแหน่ง 0 ใช้ charAt(0)', 'ต่อข้อความกับตัวเลขต้องแปลงด้วย String(id)'],
      code: `String msg = "KELTH";
int id = 7;

void setup() {
  Serial.begin(9600);
  Serial.println(msg.{{0}}());
  Serial.println(msg.{{1}}(0));
  String tag = "ID-" + {{2}}(id);
  Serial.println(tag);
}

void loop() {
}`,
      bank: ['length', 'charAt', 'String', 'toInt', 'int', 'size'],
      answer: ['length', 'charAt', 'String'],
      goal: { serial: '5\nK\nID-7' },
    },
    {
      id: '4-4-b',
      kind: 'fix',
      title: 'รายงานที่อ่านไม่ออก',
      mission: 'โปรแกรมต้องพิมพ์ตัวอักษรตัวสุดท้ายของข้อความ (T) แล้วพิมพ์รายงาน SHIPS:3 แต่ที่ออกมาเป็นบรรทัดว่างทั้งคู่ อ่านข้อสังเกตหลังรัน แล้วแก้ 2 บรรทัด',
      hints: [
        '"HUNT" ยาว 4 ตัว ตำแหน่งมี 0 ถึง 3 ตัวสุดท้ายคือ charAt(3)',
        '"SHIPS:" + ships ต่อข้อความกับตัวเลขตรง ๆ ไม่ได้ ต้องเป็น "SHIPS:" + String(ships)',
      ],
      code: `String msg = "HUNT";
int ships = 3;

void setup() {
  Serial.begin(9600);
  Serial.println(msg.charAt(4));
  String report = "SHIPS:" + ships;
  if (msg == "HUNT") {
    Serial.println(report);
  }
}

void loop() {
}`,
      fixes: {
        6: { options: ['Serial.println(msg.charAt(4));', 'Serial.println(msg.charAt(3));', 'Serial.println(msg.charAt(msg.length()));'], answer: 1 },
        7: { options: ['String report = "SHIPS:" + ships;', 'String report = "SHIPS:" + String(ships);', 'String report = "SHIPS:" + "ships";'], answer: 1 },
      },
      goal: { serial: 'T\nSHIPS:3' },
    },
    {
      id: '4-4-c',
      kind: 'type',
      title: 'นับยานนักล่า',
      mission: 'สัญญาณจาก readSignal() เป็นข้อความ เช่น "K-K--K" ตัว K หนึ่งตัวคือยานนักล่าหนึ่งลำ นับว่ามี K กี่ตัว แล้วส่งข้อความ HUNTERS: ต่อด้วยจำนวน (เช่น HUNTERS:3) ให้ warn( ) เกมจะทดสอบกับสัญญาณหลายแบบ',
      hints: [
        'String sig = readSignal(); แล้ว for (int i = 0; i < sig.length(); i++) { if (sig.charAt(i) == \'K\') { count++; } }',
        'ส่งข้อความ: warn("HUNTERS:" + String(count));',
      ],
      world: {
        sensors: { readSignal: 'K-K--K' },
        actions: { warn: { args: 1, label: 'แจ้งเตือนค่าย' } },
      },
      starter: `void setup() {
  String sig = readSignal();
  int count = 0;
  // ไล่ดูทีละตัวอักษร ถ้าเป็น 'K' ให้ count เพิ่ม 1

  // ส่ง "HUNTERS:" ต่อด้วยจำนวน ให้ warn( );

}

void loop() {
}`,
      solution: `void setup() {
  String sig = readSignal();
  int count = 0;
  for (int i = 0; i < sig.length(); i++) {
    if (sig.charAt(i) == 'K') {
      count++;
    }
  }
  warn("HUNTERS:" + String(count));
}

void loop() {
}`,
      require: [{ re: '\\.\\s*length\\s*\\(', msg: 'ต้องใช้ length() เพื่อให้ลูปทำงานกับสัญญาณยาวเท่าไรก็ได้' }],
      goal: {},
      win: 'ค่ายพักได้รับคำเตือนแล้ว!',
      cases: [
        { label: 'สัญญาณ K-K--K', sensors: { readSignal: 'K-K--K' }, goal: { set: { warn: ['HUNTERS:3'] } } },
        { label: 'สัญญาณ --K-', sensors: { readSignal: '--K-' }, goal: { set: { warn: ['HUNTERS:1'] } } },
        { label: 'สัญญาณ KKKKK', sensors: { readSignal: 'KKKKK' }, goal: { set: { warn: ['HUNTERS:5'] } } },
        { label: 'สัญญาณ ----', sensors: { readSignal: '----' }, goal: { set: { warn: ['HUNTERS:0'] } } },
      ],
    },
  ],
};

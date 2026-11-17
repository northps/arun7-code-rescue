import { Level } from '../../types';

// 1-7 รับค่า และเขียนย่อ (P03 · คู่มือหัวข้อ 5–6)
export const l07: Level = {
  id: '1-7',
  act: 1,
  title: 'เสียงจากวิทยุ',
  concept: 'readNumber(), ++, +=, -=, *=',
  ref: 'P03 · คู่มือหัวข้อ 5–6',
  story: `ลิฟต์เพิ่งเริ่มขยับ วิทยุบนผนังก็ดังซ่า
วิทยุ: ...มีใครอยู่ไหม... มีใครได้ยินไหม...
วิทยุ: นี่หัวหน้าช่างมาลี ฉันซ่อนอยู่ในห้องควบคุม
มาลี: ฉันเห็นข้อความที่เธอส่งออกไป ฟังนะ ฉันจะบอกตัวเลขให้ทีละตัว
มาลี: พิมพ์ตามไม่ได้ มันเปลี่ยนทุกรอบ ให้โปรแกรมของเธอรับค่าเอาเอง`,
  outro: `ลิฟต์เลื่อนลง
มาลี: ดีมาก ชั้นล่างสุดคือโรงเก็บยาน ยานกู้ชีพจอดอยู่ที่นั่น
มาลี: แต่ระวัง ประตูบางบานมีพวกมันรออยู่ข้างหลัง`,
  lesson: {
    title: 'โปรแกรมที่รับค่าจากข้างนอก',
    blocks: [
      { p: 'จนถึงตอนนี้ค่าทุกค่าเราพิมพ์ไว้ในโค้ด แต่โปรแกรมจริงต้อง **รับค่า** ที่ไม่รู้ล่วงหน้า `readNumber()` รอจนมีตัวเลขเข้ามา แล้วคืนค่านั้นให้' },
      { code: 'long a = readNumber();   // รอรับตัวเลข 1 ตัว ใส่กล่อง a\na = a + 10;' },
      { p: 'การเปลี่ยนค่าในกล่องเดิมเขียนย่อได้:' },
      { code: 'x++;       // x = x + 1\nx--;       // x = x - 1\nx += 5;    // x = x + 5\nx -= 5;    // x = x - 5\nx *= 2;    // x = x * 2' },
      { tip: 'เกมจะรันโค้ดของคุณกับตัวเลขหลายชุด ใส่คำตอบตายตัวจึงไม่ผ่าน ต้องให้โปรแกรมคำนวณจากค่าที่รับมา' },
    ],
  },
  world: {
    map: ['  ...  ', '###D###', '#....T#', '#.....#', '#..B..#', '#######'],
    dir: 'N',
    inputs: [3],
    actions: {
      goToFloor: { args: 1, label: 'ลิฟต์ไปชั้น', opensDoor: true },
      enterCode: { args: 1, label: 'แป้นรหัส', opensDoor: true },
    },
  },
  puzzles: [
    {
      id: '1-7-a',
      kind: 'blank',
      title: 'ชั้นถัดขึ้นไป',
      mission: 'มาลีจะบอกเลขชั้นที่เธออยู่ ลิฟต์ต้องไปจอด "สูงกว่านั้น 1 ชั้น" (ชั้นของเธอมีเคลธเฝ้า) รับค่า เพิ่ม 1 แล้วสั่งลิฟต์',
      hints: ['รับค่าด้วย readNumber() (ตัว N ใหญ่) และเพิ่มทีละ 1 ด้วย ++', 'long level = readNumber(); level++; goToFloor(level);'],
      code: 'void setup() {\n  long level = {{0}}();\n  level{{1}};\n  goToFloor({{2}});\n}\n\nvoid loop() {\n}',
      bank: ['readNumber', 'readnumber', '++', '--', 'level', 'floor'],
      answer: ['readNumber', '++', 'level'],
      goal: { door: 'open' },
      cases: [
        { label: 'มาลีบอก 3', inputs: [3], goal: { set: { goToFloor: [4] } } },
        { label: 'มาลีบอก 7', inputs: [7], goal: { set: { goToFloor: [8] } } },
      ],
    },
    {
      id: '1-7-b',
      kind: 'order',
      title: 'รหัสจากเลขสองตัว',
      mission: 'มาลีบอกเลข 2 ตัว รหัสประตู = ตัวแรก + ตัวที่สอง แล้วบวกเพิ่มอีก 10 เรียงบรรทัดให้ถูก (ใช้ตัวแปรก่อนประกาศไม่ได้)',
      hints: ['ต้องรับ a และ b ให้ครบก่อน จึงจะรวมเป็น code ได้', 'ลำดับ: รับ a → รับ b → code = a + b → code += 10 → enterCode(code)'],
      head: 'void setup() {',
      lines: ['  long a = readNumber();', '  long b = readNumber();', '  long code = a + b;', '  code += 10;', '  enterCode(code);'],
      tail: '}\n\nvoid loop() {\n}',
      start: [3, 2, 4, 1, 0],
      goal: { door: 'open' },
      cases: [
        { label: 'มาลีบอก 12 และ 30', inputs: [12, 30], goal: { set: { enterCode: [52] } } },
        { label: 'มาลีบอก 5 และ 8', inputs: [5, 8], goal: { set: { enterCode: [23] } } },
      ],
    },
    {
      id: '1-7-c',
      kind: 'type',
      title: 'คูณสอง ลบสาม',
      mission: 'ประตูสุดท้ายของชั้นนี้: รับเลข 1 ตัว "คูณ 2 แล้วลบ 3" ได้รหัส ให้ใช้การเขียนย่อ *= และ -=',
      hints: ['n *= 2; แปลว่า n = n * 2; และ n -= 3; แปลว่า n = n - 3;', 'long n = readNumber(); n *= 2; n -= 3; enterCode(n);'],
      starter: 'void setup() {\n  long n = readNumber();\n  // คูณ 2 ด้วย *=  แล้วลบ 3 ด้วย -=  แล้ว enterCode(n);\n\n}\n\nvoid loop() {\n}',
      solution: 'void setup() {\n  long n = readNumber();\n  n *= 2;\n  n -= 3;\n  enterCode(n);\n}\n\nvoid loop() {\n}',
      require: [
        { re: '\\*=', msg: 'ข้อนี้ให้ฝึกใช้ *= (เช่น n *= 2;)' },
        { re: '-=', msg: 'ข้อนี้ให้ฝึกใช้ -= (เช่น n -= 3;)' },
      ],
      goal: { door: 'open' },
      cases: [
        { label: 'มาลีบอก 10', inputs: [10], goal: { set: { enterCode: [17] } } },
        { label: 'มาลีบอก 25', inputs: [25], goal: { set: { enterCode: [47] } } },
      ],
    },
  ],
};

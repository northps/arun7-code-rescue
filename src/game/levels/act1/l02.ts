import { Level } from '../../types';

// 1-2 พิมพ์ออกจอ: Serial (P01 · คู่มือหัวข้อ 2)
export const l02: Level = {
  id: '1-2',
  act: 1,
  title: 'ส่งสัญญาณขอความช่วยเหลือ',
  concept: 'Serial.begin, print, println',
  ref: 'P01 · คู่มือหัวข้อ 2',
  story:
    'ห้องสื่อสารอยู่ถัดไปสองประตู เครื่องส่งยังมีไฟ แต่จอสั่งงานดับ เหลือแค่ช่องเสียบบอร์ด ถ้าโปรแกรมของคุณ "พิมพ์" ข้อความออกทาง Serial ได้ เครื่องส่งจะยิงข้อความนั้นออกไปนอกยาน',
  outro: 'ข้อความถูกส่งออกไปแล้ว ไม่รู้ว่าใครจะได้ยิน แต่อย่างน้อยก็มีคนรู้ว่าบนยานอรุณ-7 เกิดอะไรขึ้น',
  lesson: {
    title: 'ให้โปรแกรมพูดออกมา: Serial',
    blocks: [
      { p: '`Serial` คือช่องที่โปรแกรมใช้ส่งข้อความออกมาให้เราอ่าน ใช้บ่อยที่สุดตอนหาบั๊ก' },
      { code: 'Serial.begin(9600);        // เปิดช่อง ทำครั้งเดียวใน setup()\nSerial.print("Score: ");   // พิมพ์ต่อบรรทัดเดิม\nSerial.println(95);        // พิมพ์แล้วขึ้นบรรทัดใหม่' },
      { p: 'ผลที่ได้: `Score: 95`' },
      {
        list: [
          '`print` พิมพ์ต่อกันในบรรทัดเดียว · `println` พิมพ์แล้ว **ขึ้นบรรทัดใหม่**',
          'ข้อความต้องอยู่ใน `" "` ครบทั้งเปิดและปิด',
          'ลืม `Serial.begin` จะไม่เห็นอะไรออกมาเลย',
        ],
      },
    ],
  },
  world: {
    map: ['#######', '#..T..#', '#.....#', '#..B..#', '#######'],
    dir: 'N',
  },
  puzzles: [
    {
      id: '1-2-a',
      kind: 'blank',
      title: 'ข้อความแรก',
      mission: 'ส่งคำว่า SOS ออกไป เติมคำสั่งให้ครบ: ต้องเปิดช่องสื่อสารก่อน แล้วจึงพิมพ์',
      hints: ['คำสั่งเปิดช่องสื่อสารคือ Serial.begin(9600);', 'คำสั่งพิมพ์คือ Serial.println("...");'],
      code: 'void setup() {\n  Serial.{{0}}(9600);\n  Serial.{{1}}("SOS");\n}\n\nvoid loop() {\n}',
      bank: ['println', 'begin', 'open', 'say'],
      answer: ['begin', 'println'],
      goal: { serial: 'SOS' },
    },
    {
      id: '1-2-b',
      kind: 'blank',
      title: 'สองบรรทัดพอดี',
      mission: 'เครื่องส่งรับข้อความได้ 2 บรรทัดเท่านั้น ต้องออกมาเป็น\nSHIP: ARUN-7\nKLETH ON BOARD',
      hints: ['"SHIP: " กับ "ARUN-7" ต้องอยู่บรรทัดเดียวกัน คำสั่งแรกจึงต้องไม่ขึ้นบรรทัดใหม่', 'ใช้ print ที่ช่องแรก และ println ที่สองช่องหลัง'],
      code: 'void setup() {\n  Serial.begin(9600);\n  Serial.{{0}}("SHIP: ");\n  Serial.{{1}}("ARUN-7");\n  Serial.{{2}}("KLETH ON BOARD");\n}\n\nvoid loop() {\n}',
      bank: ['print', 'println'],
      answer: ['print', 'println', 'println'],
      goal: { serial: 'SHIP: ARUN-7\nKLETH ON BOARD' },
    },
    {
      id: '1-2-c',
      kind: 'fix',
      title: 'ข้อความที่ส่งไม่ออก',
      mission: 'ลูกเรือคนหนึ่งเขียนโค้ดนี้ไว้แต่ส่งไม่ออก มีที่ผิด 3 จุด ต้องออกมาเป็น\nMAYDAY\nDECK 3\nSEND HELP',
      hints: [
        'error แรก: ข้อความ "DECK 3 ไม่มี " ปิด',
        'ที่เหลือ: คำสั่งสุดท้ายขาด ; และ Serial.Begin ต้องเป็น b ตัวเล็ก',
      ],
      code: 'void setup() {\n  Serial.Begin(9600);\n  Serial.println("MAYDAY");\n  Serial.println("DECK 3);\n  Serial.print("SEND HELP")\n}\n\nvoid loop() {\n}',
      fixes: {
        2: { options: ['Serial.Begin(9600);', 'Serial.begin(9600);', 'Serial.begin();'], answer: 1 },
        4: { options: ['Serial.println("DECK 3);', 'Serial.println("DECK 3");', 'Serial.println(DECK 3);'], answer: 1 },
        5: { options: ['Serial.print("SEND HELP")', 'Serial.print("SEND HELP");', 'Serial.print("SEND HELP"):'], answer: 1 },
      },
      goal: { serial: 'MAYDAY\nDECK 3\nSEND HELP' },
    },
  ],
};

import { Level } from '../../types';

// 4-5 เกมทายเลข (P08)
export const o05: Level = {
  id: '4-5',
  act: 4,
  title: 'ทายรหัสคลัง',
  concept: 'เกมทายเลข: while + if และการแบ่งครึ่ง',
  ref: 'P08 · มินิโปรเจกต์เกมทายเลข',
  story:
    'คลังเสบียงของสถานีปิดด้วยประตูรหัส ไม่มีใครรู้รหัสแล้ว แต่ระบบเก่ายังใจดี: ลองรหัสผิดมันจะบอกว่า "มากไป" หรือ "น้อยไป" ปัญหาคือลองผิดได้จำกัดครั้ง เกินแล้วคลังล็อกตัวเองถาวร มาลีกระซิบ "ต้องทายให้ฉลาด ไม่ใช่ทายให้เยอะ"',
  outro: 'ประตูคลังเลื่อนเปิด ข้างในมีเสบียงแห้ง แบตเตอรี่ และกล่องอะไหล่เต็มชั้น มาลีหัวเราะเป็นครั้งแรกตั้งแต่ลงดาว "ทายครึ่งเดียวทุกครั้ง พันเลขก็ใช้แค่สิบครั้ง เก่งมากบิต"',
  lesson: {
    title: 'ทายเลขให้ฉลาด',
    blocks: [
      { p: 'ด่านนี้คือเกมทายเลขของบท P08 แต่สลับบทบาท: **โปรแกรมของเราเป็นฝ่ายทาย** คำสั่ง `tryCode(n)` ลองรหัส `n` แล้วคืนค่ากลับมาบอกผล' },
      {
        list: [
          '`tryCode(n)` คืน **0** = ถูก ประตูเปิด',
          'คืน **1** = `n` มากไป รหัสจริงน้อยกว่านี้',
          'คืน **-1** = `n` น้อยไป รหัสจริงมากกว่านี้',
        ],
      },
      { p: 'ทายไล่ทีละเลข (1, 2, 3 …) ได้ผลแน่ แต่ช้ามาก รหัส 1 ถึง 100 อาจต้องลองถึง 100 ครั้ง วิธีที่ฉลาดคือ **ทายตรงกลางเสมอ** แล้วตัดครึ่งที่ไม่ใช่ทิ้ง' },
      { code: 'int lo = 1;\nint hi = 100;\n\nwhile (lo <= hi) {\n  int mid = (lo + hi) / 2;     // ทายตรงกลางของช่วงที่เหลือ\n  int r = tryCode(mid);\n  if (r == 0) {\n    break;                     // ถูกแล้ว ออกจากลูป\n  } else if (r == 1) {\n    hi = mid - 1;              // มากไป: ตัดครึ่งบนทิ้ง\n  } else {\n    lo = mid + 1;              // น้อยไป: ตัดครึ่งล่างทิ้ง\n  }\n}' },
      { tip: 'แต่ละครั้งช่วงที่เหลือหายไปครึ่งหนึ่ง: 100 → 50 → 25 → 12 → 6 → 3 → 1 จึงใช้ไม่เกิน 7 ครั้ง และ 1 ถึง 1000 ใช้ไม่เกิน 10 ครั้ง วิธีนี้เรียกว่า binary search' },
    ],
  },
  world: {
    map: ['###D###', '#.....#', '#.X...#', '#.T.B.#', '#######'],
    dir: 'N',
    theme: 'planet',
    vault: { secret: 6, tries: 10 },
  },
  puzzles: [
    {
      id: '4-5-a',
      kind: 'blank',
      title: 'ไล่ทีละเลข',
      mission: 'ตู้เล็กหน้าคลัง รหัสอยู่ระหว่าง 1 ถึง 10 ลองได้ 10 ครั้ง เติมลูปให้ไล่ลองตั้งแต่ 1 ขึ้นไปจนกว่า tryCode จะคืน 0 (เกมจะทดสอบกับรหัสมากกว่าหนึ่งค่า)',
      hints: ['วนต่อ "ตราบใดที่ผลยังไม่ใช่ 0": tryCode(guess) != 0', 'ในลูปให้เลื่อนไปเลขถัดไป: guess++'],
      code: `void setup() {
  int guess = 1;
  while (tryCode(guess) {{0}} 0) {
    {{1}};
  }
}

void loop() {
}`,
      bank: ['!=', '==', 'guess++', 'guess--', 'guess = 1'],
      answer: ['!=', 'guess++'],
      goal: { vaultOpen: true, door: 'open' },
      cases: [
        { label: 'รหัส 6', vault: { secret: 6, tries: 10 } },
        { label: 'รหัส 9', vault: { secret: 9, tries: 10 } },
      ],
    },
    {
      id: '4-5-b',
      kind: 'blank',
      title: 'ทายตรงกลาง',
      mission: 'ประตูคลังชั้นใน รหัสอยู่ระหว่าง 1 ถึง 100 แต่ลองได้แค่ 7 ครั้ง ไล่ทีละเลขไม่ทันแน่ เติมโค้ดให้ทายตรงกลางแล้วตัดครึ่งที่ไม่ใช่ทิ้ง',
      hints: ['ตรงกลางของช่วงคือ (lo + hi) / 2', 'มากไป (r == 1) รหัสอยู่ต่ำกว่า จึงลดขอบบน: hi = mid - 1 · น้อยไป เพิ่มขอบล่าง: lo = mid + 1'],
      world: { vault: { secret: 37, tries: 7 } },
      code: `void setup() {
  int lo = 1;
  int hi = 100;
  while (lo <= hi) {
    int mid = (lo + hi) / {{0}};
    int r = tryCode(mid);
    if (r == 0) {
      break;
    } else if (r == 1) {
      {{1}} = mid - 1;
    } else {
      {{2}} = mid + 1;
    }
  }
}

void loop() {
}`,
      bank: ['2', '1', 'hi', 'lo', 'mid', '100'],
      answer: ['2', 'hi', 'lo'],
      goal: { vaultOpen: true, door: 'open' },
      cases: [
        { label: 'รหัส 37', vault: { secret: 37, tries: 7 } },
        { label: 'รหัส 100', vault: { secret: 100, tries: 7 } },
        { label: 'รหัส 1', vault: { secret: 1, tries: 7 } },
        { label: 'รหัส 64', vault: { secret: 64, tries: 7 } },
      ],
    },
    {
      id: '4-5-c',
      kind: 'type',
      title: 'คลังใหญ่ 1 ถึง 1000',
      mission: 'คลังใหญ่ รหัสอยู่ระหว่าง 1 ถึง 1000 ลองได้ 10 ครั้ง เขียนโปรแกรมทายแบบแบ่งครึ่งเองทั้งหมด และเมื่อเปิดได้แล้วให้พิมพ์รหัสที่ถูกออก Serial เพื่อจดไว้',
      hints: [
        'ใช้โครงเดียวกับข้อที่แล้ว เปลี่ยน hi เป็น 1000: while (lo <= hi) { int mid = (lo + hi) / 2; int r = tryCode(mid); … }',
        'ตอน r == 0 ให้ Serial.println(mid); ก่อน break;',
      ],
      world: { vault: { secret: 777, tries: 10 } },
      starter: `void setup() {
  Serial.begin(9600);
  int lo = 1;
  int hi = 1000;
  // วนทายตรงกลางจนกว่า tryCode( ) จะคืน 0
  // เปิดได้แล้วพิมพ์รหัสที่ถูกออก Serial

}

void loop() {
}`,
      solution: `void setup() {
  Serial.begin(9600);
  int lo = 1;
  int hi = 1000;
  while (lo <= hi) {
    int mid = (lo + hi) / 2;
    int r = tryCode(mid);
    if (r == 0) {
      Serial.println(mid);
      break;
    } else if (r == 1) {
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
}

void loop() {
}`,
      goal: { vaultOpen: true, door: 'open' },
      win: 'คลังเสบียงเปิดแล้ว!',
      cases: [
        { label: 'รหัส 777', vault: { secret: 777, tries: 10 }, goal: { serial: '777' } },
        { label: 'รหัส 1', vault: { secret: 1, tries: 10 }, goal: { serial: '1' } },
        { label: 'รหัส 1000', vault: { secret: 1000, tries: 10 }, goal: { serial: '1000' } },
        { label: 'รหัส 313', vault: { secret: 313, tries: 10 }, goal: { serial: '313' } },
      ],
    },
  ],
};

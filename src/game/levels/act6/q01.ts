import { Level } from '../../types';

// 6-1 enum: ตั้งชื่อให้สถานะ (R08)
export const q01: Level = {
  id: '6-1',
  act: 6,
  title: 'ตั้งชื่อสถานะ',
  concept: 'enum: ตั้งชื่อให้ตัวเลือกที่มีไม่กี่แบบ',
  ref: 'R08 · state machine',
  story: `กระสวยรุ่นเก่าบินไม่ได้ จนกว่าจะไปถึงลานปล่อยอีกฟากของป่า
และสมองนำร่องของมันว่างเปล่า
มาลีเปิดฝาแผงควบคุม เสียบสายของบิตเข้าไป
มาลี: กระสวยทำงานเป็นโหมด วิ่ง ถอย มองหาทาง เลี้ยว เธอต้องบอกมันว่าตอนนี้อยู่โหมดไหน
มาลี: แต่อย่าใช้เลข 0 1 2 3 เฉย ๆ นะ อีกสามวันเธอจะจำไม่ได้ว่าเลขไหนคืออะไร`,
  outro: `แผงควบคุมของกระสวยขึ้นชื่อโหมดถูกต้องทุกครั้ง
มาลี: โค้ดที่อ่านแล้วรู้เรื่อง คือโค้ดที่แก้ได้ตอนตีสาม`,
  lesson: {
    title: 'enum: ชื่อแทนตัวเลข',
    blocks: [
      { p: 'กระสวยมี 4 โหมด จะเก็บเป็นเลข 0 1 2 3 ใน `int` ก็ได้ แต่ `if (state == 2)` อ่านแล้วไม่รู้ว่า 2 คืออะไร **`enum`** ให้เราตั้งชื่อแทนเลขพวกนี้' },
      { code: 'enum State { CRUISE, BACKUP, SCAN, TURN };\n//           0       1       2     3\n\nState state = CRUISE;      // ตัวแปรชนิด State เก็บได้เฉพาะชื่อในรายการ\n\nstate = SCAN;              // เปลี่ยนโหมด\nif (state == SCAN) {       // เทียบด้วย ==\n  Serial.println(state);   // พิมพ์ออกมาเป็นเลข: 2\n}' },
      {
        list: [
          'ชื่อในปีกกาคั่นด้วย **จุลภาค** และหลังปีกกาปิดต้องมี `;`',
          'คอมไพเลอร์ให้เลขเองโดยเริ่มที่ 0: `CRUISE` = 0, `BACKUP` = 1, `SCAN` = 2, `TURN` = 3',
          '`State` กลายเป็นชนิดข้อมูลใหม่ ใช้ประกาศตัวแปรได้เหมือน `int`',
          'ชื่อเขียนตัวพิมพ์ใหญ่ทั้งหมดตามธรรมเนียมของค่าคงที่ และตัวเล็ก-ใหญ่ถือว่าต่างกัน: `backup` ไม่ใช่ `BACKUP`',
        ],
      },
      { tip: 'ในเกมนี้ setMode(state) ส่งโหมดไปแสดงบนแผงของกระสวย ถ้าส่งเลขตรง ๆ เช่น setMode(1) โปรแกรมจะถูกแค่ตอนที่โหมดเป็น 1 พอดี' },
    ],
  },
  world: {
    map: ['#####', '#.T.#', '#...#', '#.B.#', '#####'],
    dir: 'N',
    theme: 'planet',
    actions: { setMode: { args: 1, label: 'โหมดกระสวย' } },
  },
  puzzles: [
    {
      id: '6-1-a',
      kind: 'blank',
      title: 'สี่โหมดของกระสวย',
      mission: 'ประกาศ enum ของโหมดทั้ง 4 แล้วสร้างตัวแปร state เริ่มที่ CRUISE พิมพ์ค่าออกมาดู จากนั้นเปลี่ยนเป็นโหมด SCAN พิมพ์อีกครั้ง แล้วส่งให้แผงควบคุมด้วย setMode',
      hints: ['คำที่ใช้ประกาศคือ enum ตามด้วยชื่อชนิด: enum State { ... };', 'ตัวแปรต้องมีชนิดเป็น State และโหมดที่ต้องเปลี่ยนไปคือ SCAN (เลข 2)'],
      code: `{{0}} State { CRUISE, BACKUP, SCAN, TURN };

{{1}} state = CRUISE;

void setup() {
  Serial.begin(9600);
  Serial.println(state);
  state = {{2}};
  Serial.println(state);
  setMode(state);
}

void loop() {
}`,
      bank: ['enum', 'State', 'SCAN', 'TURN', 'const', 'void'],
      answer: ['enum', 'State', 'SCAN'],
      goal: { serial: '0\n2', set: { setMode: [2] } },
    },
    {
      id: '6-1-b',
      kind: 'fix',
      title: 'เลือกโหมดจากระยะ',
      mission: 'โปรแกรมนี้ต้องดูระยะข้างหน้า: ถ้าน้อยกว่า 25 ซม. ให้เข้าโหมด BACKUP ไม่อย่างนั้นอยู่โหมด CRUISE แล้วส่งโหมดให้แผงควบคุม แต่มันคอมไพล์ไม่ผ่าน และมีที่ผิดรวม 3 บรรทัด',
      hints: [
        'ชื่อใน enum คั่นด้วยจุลภาค ไม่ใช่ ; และชื่อโหมดต้องสะกดตัวพิมพ์ใหญ่ให้ตรง: BACKUP',
        'setMode(1) ถูกเฉพาะตอนที่โหมดเป็น BACKUP ต้องส่งตัวแปร: setMode(state);',
      ],
      world: { sensors: { readDistance: 80 } },
      code: `enum State { CRUISE; BACKUP; SCAN; TURN };

State state = CRUISE;
const int DANGER_CM = 25;

void setup() {
  int d = readDistance();
  if (d < DANGER_CM) {
    state = backup;
  }
  setMode(1);
}

void loop() {
}`,
      fixes: {
        1: { options: ['enum State { CRUISE; BACKUP; SCAN; TURN };', 'enum State { CRUISE, BACKUP, SCAN, TURN };', 'enum State ( CRUISE, BACKUP, SCAN, TURN );'], answer: 1 },
        9: { options: ['state = backup;', 'state = BACKUP;', 'state == BACKUP;'], answer: 1 },
        11: { options: ['setMode(1);', 'setMode(state);', 'setMode(State);'], answer: 1 },
      },
      goal: {},
      cases: [
        { label: 'ทางโล่ง 80 ซม.', sensors: { readDistance: 80 }, goal: { set: { setMode: [0] } } },
        { label: 'หินอยู่ใกล้ 12 ซม.', sensors: { readDistance: 12 }, goal: { set: { setMode: [1] } } },
      ],
    },
  ],
};

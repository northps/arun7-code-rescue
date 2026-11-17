import { Level } from '../../types';

// 5-1 มอเตอร์และฟังก์ชันเดิน (R03)
export const p01: Level = {
  id: '5-1',
  act: 5,
  title: 'ใส่ล้อให้บิต',
  concept: 'setMotor(ซ้าย, ขวา) และฟังก์ชัน forward / stopCar',
  ref: 'R03 · มอเตอร์และฟังก์ชัน',
  story: `ยานนักล่าลงจอดห่างไปไม่ถึงกิโลเมตร ต้องย้ายค่ายเดี๋ยวนี้
แต่ชุดนำทางของบิต ตัวที่ทำให้คำสั่ง forward() เดินทีละช่องพอดี ไหม้ไปตั้งแต่ตอนลงจอด
มาลีรื้ออะไหล่จากคลัง ต่อมอเตอร์เข้ากับล้อซ้ายขวาโดยตรง มือเธอสั่นนิดหน่อย
มาลี: จากนี้ไม่มีใครเดินให้แล้วนะบิต
มาลี: เธอต้องสั่งล้อเอง ล้อละข้าง`,
  outro: `บิตวิ่งไปถึงจุดหมาย แล้วหยุดสนิท
มาลี: ล้อซ้าย ล้อขวา แล้วก็เวลา
มาลี: แค่สามอย่างนี้ พาเธอไปได้ทุกที่`,
  lesson: {
    title: 'สั่งล้อเองด้วย setMotor',
    blocks: [
      { p: '`setMotor(ซ้าย, ขวา)` ตั้งความเร็วของล้อสองข้าง ค่า **-255 ถึง 255**: บวกคือหมุนไปข้างหน้า ลบคือถอยหลัง 0 คือหยุด' },
      { code: 'setMotor(150, 150);     // สองล้อเท่ากัน: วิ่งตรงไปข้างหน้า\nsetMotor(-150, -150);   // ถอยหลัง\nsetMotor(0, 0);         // หยุด\n\nsetMotor(150, 150);\ndelay(1000);            // ปล่อยให้วิ่ง 1 วินาที\nsetMotor(0, 0);' },
      {
        list: [
          '`setMotor` แค่ **ตั้งความเร็ว** แล้วทำบรรทัดถัดไปทันที รถจะวิ่งต่อไปเรื่อย ๆ จนกว่าจะสั่งค่าใหม่',
          'ระยะทางมาจาก **ความเร็ว × เวลา**: ในเกมนี้ความเร็ว 150 วิ่งได้ **1 ช่องทุก 500 ms** (`delay(1000)` = 2 ช่อง)',
          'ถ้าสองล้อความเร็วไม่เท่ากัน รถจะวิ่งโค้ง',
          'ลืมสั่งหยุด = รถวิ่งไปชนของ',
        ],
      },
      { p: 'เขียน `setMotor(150, 150)` ซ้ำ ๆ อ่านยาก จึงห่อเป็นฟังก์ชันที่ชื่อบอกความหมาย เหมือนในบทเรียน R03:' },
      { code: 'const int SPEED = 150;\n\nvoid forward()  { setMotor(SPEED, SPEED); }\nvoid backward() { setMotor(-SPEED, -SPEED); }\nvoid stopCar()  { setMotor(0, 0); }' },
      { tip: 'บนรถจริง setMotor เป็นฟังก์ชันที่เราเขียนเองจาก digitalWrite (ทิศ) กับ analogWrite (ความเร็ว 0–255) ในเกมนี้มีให้ใช้เลย' },
    ],
  },
  world: {
    map: ['#######', '#..P..#', '#.....#', '#..B..#', '#######'],
    dir: 'N',
    theme: 'planet',
    drive: {},
  },
  puzzles: [
    {
      id: '5-1-a',
      kind: 'blank',
      title: 'วิ่งตรง 2 ช่อง',
      mission: 'จุดนัดพบ (วงสีเขียว) อยู่ข้างหน้า 2 ช่อง เติมความเร็วของล้อให้บิตวิ่งตรงไป 1 วินาที แล้วหยุดสนิทบนวง',
      hints: ['วิ่งตรงต้องให้สองล้อเท่ากัน: setMotor(150, 150)', 'หยุดคือ setMotor(0, 0)'],
      code: `void setup() {
  setMotor({{0}}, {{1}});
  delay(1000);
  setMotor({{2}}, 0);
}

void loop() {
}`,
      bank: ['150', '-150', '0', '255'],
      answer: ['150', '150', '0'],
      goal: { at: 'pad', stopped: true },
    },
    {
      id: '5-1-b',
      kind: 'fix',
      title: 'ฟังก์ชันที่ชื่อไม่ตรงกับที่ทำ',
      mission: 'มีคนเขียน forward() กับ stopCar() ไว้ให้ แต่กดรันแล้วบิตหมุนอยู่กับที่ และไม่ยอมหยุด มีที่ผิด 3 บรรทัด',
      hints: [
        'forward ต้องให้สองล้อเดินหน้าเท่ากัน: setMotor(150, 150); · stopCar ต้องเป็น setMotor(0, 0);',
        'บรรทัดสุดท้ายเขียน stopCar; ไม่มีวงเล็บ ฟังก์ชันจึงไม่ถูกเรียก ต้องเป็น stopCar();',
      ],
      code: `void forward() {
  setMotor(150, -150);
}

void stopCar() {
  setMotor(150, 150);
}

void setup() {
  forward();
  delay(1000);
  stopCar;
}

void loop() {
}`,
      fixes: {
        2: { options: ['setMotor(150, -150);', 'setMotor(150, 150);', 'setMotor(-150, -150);'], answer: 1 },
        6: { options: ['setMotor(150, 150);', 'setMotor(0, 0);', 'setMotor(0, 150);'], answer: 1 },
        12: { options: ['stopCar;', 'stopCar();', 'stopcar();'], answer: 1 },
      },
      goal: { at: 'pad', stopped: true },
    },
    {
      id: '5-1-c',
      kind: 'type',
      title: 'ไปเก็บธงแล้วถอยกลับ',
      mission: 'เขียนฟังก์ชัน forward() backward() และ stopCar() เอง แล้วสั่งบิตวิ่งไปข้างหน้า 3 ช่องถึงธง ถอยหลังกลับมา 2 ช่อง แล้วหยุดบนวงสีเขียว (ความเร็ว 150 = 1 ช่องต่อ 500 ms)',
      hints: [
        'void forward() { setMotor(150, 150); } · void backward() { setMotor(-150, -150); } · void stopCar() { setMotor(0, 0); }',
        'ใน setup: forward(); delay(1500); backward(); delay(1000); stopCar();',
      ],
      world: { map: ['#######', '#..F..#', '#.....#', '#..P..#', '#..B..#', '#######'] },
      starter: `const int SPEED = 150;

// เขียน void forward()  void backward()  void stopCar()


void setup() {
  // ไปข้างหน้า 3 ช่อง ถอยหลัง 2 ช่อง แล้วหยุด

}

void loop() {
}`,
      solution: `const int SPEED = 150;

void forward() {
  setMotor(SPEED, SPEED);
}

void backward() {
  setMotor(-SPEED, -SPEED);
}

void stopCar() {
  setMotor(0, 0);
}

void setup() {
  forward();
  delay(1500);
  backward();
  delay(1000);
  stopCar();
}

void loop() {
}`,
      require: [
        { re: '\\bvoid\\s+forward\\s*\\(\\s*\\)\\s*\\{', msg: 'ข้อนี้ต้องเขียนฟังก์ชัน void forward() เอง' },
        { re: '\\bvoid\\s+backward\\s*\\(\\s*\\)\\s*\\{', msg: 'ข้อนี้ต้องเขียนฟังก์ชัน void backward() เอง' },
        { re: '\\bvoid\\s+stopCar\\s*\\(\\s*\\)\\s*\\{', msg: 'ข้อนี้ต้องเขียนฟังก์ชัน void stopCar() เอง' },
      ],
      goal: { at: 'pad', stopped: true, flags: true },
    },
  ],
};

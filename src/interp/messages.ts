// ข้อความ error แบบคอมไพเลอร์ (อังกฤษ) + คำอธิบายภาษาไทย
// อ้างอิงคู่มือไวยากรณ์ หัวข้อ 15 "อ่าน error ภาษาอังกฤษให้เข้าใจ"
import { CompileError, Diag } from './types';

type P = Record<string, string | number | undefined>;

const TABLE: Record<string, (p: P) => { en?: string; th: string }> = {
  missingSemi: (p) => ({
    en: p.before ? `expected ';' before '${p.before}'` : `expected ';' at end of input`,
    th: `ขาดเครื่องหมาย ; ท้ายคำสั่งในบรรทัดนี้ ทุกคำสั่งต้องจบด้วย ; (ใน Arduino IDE จริง error มักชี้ไปที่บรรทัดถัดไป ให้ดูบรรทัดก่อนหน้าด้วยเสมอ)`,
  }),
  missingBrace: () => ({
    en: `expected '}' at end of input`,
    th: `ปีกกา { } ไม่ครบคู่ มี { ที่ยังไม่ได้ปิดด้วย } ลองนับดูว่าทุก { มี } ของมัน`,
  }),
  extraBrace: () => ({
    en: `expected declaration before '}' token`,
    th: `มี } เกินมาหนึ่งตัว ไม่มี { ที่คู่กับมัน`,
  }),
  expected: (p) => ({
    en: `expected '${p.want}' before '${p.before}'`,
    th: `ตรงนี้ต้องมี ${p.want} แต่เจอ ${p.before} แทน ตรวจวงเล็บและเครื่องหมายในบรรทัดนี้`,
  }),
  primary: (p) => ({
    en: `expected primary-expression before '${p.before}' token`,
    th: `ตรงนี้ขาดค่าหรือชื่อตัวแปร (เจอ ${p.before} ทั้งที่ควรมีค่าอยู่ก่อน) เช่น ลืมใส่ตัวเลขในวงเล็บ หรือพิมพ์เครื่องหมายเกิน`,
  }),
  strayStatement: (p) => ({
    en: `expected constructor, destructor, or type conversion before '${p.before}' token`,
    th: `คำสั่งนี้อยู่นอกฟังก์ชัน คำสั่งต้องเขียนไว้ใน { } ของ setup() หรือ loop() นอกฟังก์ชันประกาศได้แค่ตัวแปรและฟังก์ชัน`,
  }),
  unterminatedString: () => ({
    en: `missing terminating " character`,
    th: `ข้อความไม่ได้ปิดด้วย " ข้อความต้องอยู่ระหว่าง " คู่หนึ่ง เช่น "Hello"`,
  }),
  unterminatedChar: () => ({
    en: `missing terminating ' character`,
    th: `ตัวอักษรไม่ได้ปิดด้วย ' ตัวอักษร 1 ตัวต้องอยู่ระหว่าง ' คู่หนึ่ง เช่น 'A'`,
  }),
  multiChar: () => ({
    en: `character constant too long for its type`,
    th: `' ' ใส่ได้แค่ตัวอักษร 1 ตัว ถ้าเป็นข้อความหลายตัวให้ใช้ " " แทน`,
  }),
  stray: (p) => ({
    en: `stray '\\${p.oct}' in program`,
    th: p.quote
      ? `มีเครื่องหมายคำพูดแบบโค้ง (${p.ch}) ซึ่งเครื่องไม่รู้จัก ให้พิมพ์ " หรือ ' แบบตรงจากคีย์บอร์ด`
      : `มีตัวอักษรแปลกปลอม (${p.ch}) อยู่นอกข้อความ ภาษาไทยใส่ได้แค่ในคอมเมนต์ // และในข้อความ " " เท่านั้น`,
  }),
  notDeclared: (p) => ({
    en: `'${p.name}' was not declared in this scope` + (p.suggest ? `; did you mean '${p.suggest}'?` : ''),
    th:
      `เครื่องไม่รู้จักชื่อ ${p.name}` +
      (p.suggest
        ? ` คุณหมายถึง ${p.suggest} ใช่ไหม (ตัวพิมพ์เล็ก-ใหญ่ถือว่าเป็นคนละชื่อ)`
        : ` อาจพิมพ์ผิด ยังไม่ได้ประกาศ หรือประกาศไว้ใน { } อื่นจึงมองไม่เห็นจากตรงนี้`),
  }),
  redeclared: (p) => ({
    en: `redeclaration of '${p.type} ${p.name}'`,
    th: `ประกาศตัวแปร ${p.name} ซ้ำ กล่องนี้มีอยู่แล้ว ถ้าจะเปลี่ยนค่าไม่ต้องเขียนชนิดซ้ำ ให้เขียนแค่ ${p.name} = ค่าใหม่;`,
  }),
  readOnly: (p) => ({
    en: `assignment of read-only variable '${p.name}'`,
    th: `${p.name} เป็นค่าคงที่ (const) เปลี่ยนค่าไม่ได้ ถ้าต้องการค่าอื่นให้แก้ที่บรรทัดประกาศ หรือใช้ตัวแปรธรรมดา`,
  }),
  lvalue: () => ({
    en: `lvalue required as left operand of assignment`,
    th: `ทางซ้ายของ = ต้องเป็นตัวแปร (กล่องที่ใส่ค่าได้) ถ้าตั้งใจเปรียบเทียบให้ใช้ == สองตัว`,
  }),
  tooFew: (p) => ({
    en: `too few arguments to function '${p.name}'`,
    th: `ส่งค่าให้ ${p.name}() ไม่ครบ ต้องการ ${p.want} ค่า แต่ส่งมา ${p.got} ค่า`,
  }),
  tooMany: (p) => ({
    en: `too many arguments to function '${p.name}'`,
    th: `ส่งค่าให้ ${p.name}() เกิน ต้องการ ${p.want} ค่า แต่ส่งมา ${p.got} ค่า`,
  }),
  notFunction: (p) => ({
    en: `'${p.name}' cannot be used as a function`,
    th: `${p.name} เป็นตัวแปร ไม่ใช่ฟังก์ชัน จึงเรียกด้วย ( ) ไม่ได้`,
  }),
  noMember: (p) => ({
    en: `'class HardwareSerial' has no member named '${p.name}'`,
    th: `Serial ไม่มีคำสั่งชื่อ ${p.name} คำสั่งที่ใช้บ่อยคือ Serial.begin, Serial.print, Serial.println (ระวังตัวพิมพ์เล็ก-ใหญ่)`,
  }),
  convStrTo: (p) => ({
    en: `invalid conversion from 'const char*' to '${p.type}'`,
    th:
      p.type === 'char'
        ? `char เก็บตัวอักษร 1 ตัว ต้องใช้ ' ' เช่น 'A' ส่วน " " เป็นข้อความ ต้องเก็บใน String`
        : `ข้อความใน " " ใส่ลงตัวแปรชนิด ${p.type} ไม่ได้ ถ้าจะเก็บข้อความให้ใช้ชนิด String`,
  }),
  elseNoIf: () => ({
    en: `'else' without a previous 'if'`,
    th: `มี else ลอยอยู่โดยไม่มี if นำหน้า มักเกิดจากใส่ ; หลัง if (...) หรือปิดปีกกาผิดที่`,
  }),
  breakOutside: () => ({
    en: `break statement not within loop or switch`,
    th: `break ใช้ได้เฉพาะในลูปหรือใน switch เท่านั้น`,
  }),
  continueOutside: () => ({
    en: `continue statement not within a loop`,
    th: `continue ใช้ได้เฉพาะในลูปเท่านั้น`,
  }),
  noSetup: (p) => ({
    en: `undefined reference to '${p.name}'`,
    th: `ไม่พบฟังก์ชัน ${p.name}() ทุกโปรแกรม Arduino ต้องมีทั้ง void setup() { } และ void loop() { }`,
  }),
  voidValue: (p) => ({
    en: `void value not ignored as it ought to be`,
    th: `${p.name}() ไม่คืนค่า (void) จึงเอาไปใส่ตัวแปรหรือคำนวณไม่ได้`,
  }),
  badSwitch: () => ({
    en: `switch quantity not an integer`,
    th: `switch ใช้ได้กับจำนวนเต็มและ char เท่านั้น ใช้กับ String หรือ float ไม่ได้ (ให้ใช้ if แทน)`,
  }),
  caseNeedsConst: () => ({
    en: `case label does not reduce to an integer constant`,
    th: `หลัง case ต้องเป็นค่าตายตัว เช่น 1 หรือ 'F' ใช้ช่วงค่าอย่าง x > 5 ไม่ได้ (ให้ใช้ if แทน)`,
  }),
  defineSemi: (p) => ({
    en: `expected ')' before ';' token`,
    th: `บรรทัดนี้ใช้ ${p.name} ซึ่งประกาศด้วย #define แล้วมี ; ต่อท้าย #define ไม่ต้องมี ; และไม่ต้องมี = (error จึงโผล่ตรงบรรทัดที่ใช้ ไม่ใช่บรรทัดที่ผิด)`,
  }),
  modFloat: () => ({
    en: `invalid operands of types 'float' and 'int' to binary 'operator%'`,
    th: `% (เศษจากการหาร) ใช้ได้กับจำนวนเต็มเท่านั้น`,
  }),
  generic: (p) => ({ en: String(p.en ?? 'syntax error'), th: String(p.th ?? 'ไวยากรณ์ผิด ตรวจบรรทัดนี้อีกครั้ง') }),
};

export function diag(kind: string, line: number, p: P = {}): Diag {
  const f = TABLE[kind] ?? TABLE.generic;
  const m = f(p);
  return { kind, line, en: m.en, th: m.th };
}

export function fail(kind: string, line: number, p: P = {}): never {
  throw new CompileError(diag(kind, line, p));
}

// ---------- ข้อสังเกต (คอมไพเลอร์จริงไม่เตือน แต่เป็นบั๊กที่พบบ่อย) ----------
export const WARN: Record<string, (p: P) => string> = {
  assignInCond: (p) =>
    `ในเงื่อนไขใช้ = ตัวเดียว ซึ่งแปลว่า "เอาค่าใส่ ${p.name ?? 'ตัวแปร'}" ไม่ใช่การเปรียบเทียบ ผลคือเงื่อนไขเป็น${p.truth}เสมอ ถ้าจะเทียบว่าเท่ากันต้องใช้ == สองตัว`,
  emptyBody: (p) =>
    `มี ; ต่อท้าย ${p.what} (...) ทำให้ ${p.what} จบตรงนั้นทันที คำสั่งใน { } ถัดไปจึง${p.what === 'if' ? 'ทำทุกครั้งไม่ว่าเงื่อนไขจะจริงหรือไม่' : 'ไม่ได้อยู่ในลูป'} ให้ลบ ; ตัวนั้นออก`,
  overflow: (p) =>
    `ค่าเกินช่วงของ ${p.type} (${p.type === 'int' ? '−32,768 ถึง 32,767' : p.type === 'byte' ? '0 ถึง 255' : 'ประมาณ ±2,100 ล้าน'}) จึง "ล้น" กลายเป็น ${p.got} ถ้าต้องเก็บค่าใหญ่ให้ใช้ long`,
  truncate: (p) =>
    `ใส่ทศนิยม ${p.from} ลงตัวแปรชนิด ${p.type} เศษทศนิยมถูกตัดทิ้ง (ไม่ปัด) เหลือ ${p.got} ถ้าต้องเก็บทศนิยมให้ใช้ float`,
  intDivFloat: () =>
    `จำนวนเต็มหารจำนวนเต็ม เศษถูกทิ้งไปก่อนจะเก็บลง float ถ้าต้องการทศนิยมให้แปลงตัวหนึ่งเป็นทศนิยมก่อน เช่น (float)a / b หรือเขียน 7.0 / 2`,
  divZero: () => `หารด้วยศูนย์ บน Arduino จริงจะได้ค่ามั่วโดยไม่มีคำเตือน ต้องเช็กด้วย if ก่อนหารเสมอ`,
  arrayRange: (p) =>
    `อ่าน/เขียนอาร์เรย์ ${p.name}[${p.idx}] แต่มีแค่ช่อง 0 ถึง ${p.max} (index เริ่มที่ 0) Arduino จริงไม่เตือน แต่จะได้ค่าขยะ`,
  noSerialBegin: () => `สั่งพิมพ์โดยยังไม่ได้เรียก Serial.begin(9600); ใน setup() จึงไม่มีอะไรออกมาเลย`,
  callNoParens: (p) => `เขียนชื่อฟังก์ชัน ${p.name} โดยไม่มี ( ) ฟังก์ชันจึงไม่ถูกเรียก ต้องเขียน ${p.name}();`,
  strPlusNum: () => `เอาข้อความใน " " มาบวกกับตัวเลขตรง ๆ ได้ผลแปลก ต้องแปลงตัวเลขเป็นข้อความก่อน เช่น "Score: " + String(95)`,
  missingReturn: (p) => `ฟังก์ชัน ${p.name}() ต้องคืนค่า แต่จบโดยไม่มี return จึงได้ค่ามั่ว`,
  uninit: (p) => `ตัวแปร ${p.name} ยังไม่เคยใส่ค่า แต่ถูกนำไปใช้ บน Arduino จริงจะได้ค่ามั่ว`,
  unreachable: () => `บรรทัดที่อยู่หลัง return จะไม่ถูกทำ`,
};

export function warnText(kind: string, p: P = {}): string {
  return (WARN[kind] ?? (() => kind))(p);
}

export const RUNTIME: Record<string, (p: P) => string> = {
  infinite: () =>
    `โปรแกรมทำงานไม่รู้จบ (ลูปไม่มีวันหยุด) ตรวจว่าในลูปมีคำสั่งที่เปลี่ยนค่าในเงื่อนไขหรือไม่ เช่น ลืม i++ หรือเงื่อนไขเป็นจริงตลอด`,
  stackOverflow: () => `ฟังก์ชันเรียกตัวเองซ้อนลึกเกินไปจนหน่วยความจำเต็ม`,
  noInput: () => `โปรแกรมรอรับค่าจากคีย์บอร์ด แต่ไม่มีค่าเข้ามาแล้ว (เรียก readNumber() มากกว่าจำนวนค่าที่ส่งมา)`,
  badMethod: (p) => `ไม่รู้จักคำสั่ง .${p.name}() ของค่าชนิด ${p.type}`,
  notArray: (p) => `${p.name} ไม่ใช่อาร์เรย์หรือข้อความ จึงใช้ [ ] ไม่ได้`,
  typeMix: (p) => `ใช้เครื่องหมาย ${p.op} กับข้อความไม่ได้`,
};

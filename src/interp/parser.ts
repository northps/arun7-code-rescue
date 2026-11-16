// แยกโครงสร้างโปรแกรม (recursive descent) สำหรับ Arduino-C ชุดย่อย
import { lex, Tok } from './lexer';
import { fail } from './messages';
import { VType } from './types';

export type Expr =
  | { k: 'num'; v: number; f: boolean; line: number }
  | { k: 'str'; v: string; line: number }
  | { k: 'chr'; v: string; line: number }
  | { k: 'bool'; v: boolean; line: number }
  | { k: 'id'; name: string; line: number }
  | { k: 'bin'; op: string; l: Expr; r: Expr; line: number }
  | { k: 'un'; op: string; e: Expr; line: number }
  | { k: 'assign'; op: string; target: Expr; value: Expr; line: number }
  | { k: 'incdec'; op: string; prefix: boolean; target: Expr; line: number }
  | { k: 'call'; name: string; args: Expr[]; line: number }
  | { k: 'mcall'; obj: Expr; method: string; args: Expr[]; line: number }
  | { k: 'index'; obj: Expr; idx: Expr; line: number }
  | { k: 'cast'; type: VType; e: Expr; line: number }
  | { k: 'cond'; c: Expr; a: Expr; b: Expr; line: number };

export interface DeclItem {
  name: string;
  init?: Expr;
  isArray?: boolean;
  size?: Expr;
  list?: Expr[];
  line: number;
}

export type Stmt =
  | { k: 'decl'; type: VType; isConst: boolean; items: DeclItem[]; line: number }
  | { k: 'expr'; e: Expr; line: number }
  | { k: 'block'; body: Stmt[]; line: number }
  | { k: 'if'; cond: Expr; then: Stmt; else?: Stmt; emptyThen: boolean; line: number }
  | { k: 'while'; cond: Expr; body: Stmt; emptyBody: boolean; line: number }
  | { k: 'dowhile'; cond: Expr; body: Stmt; line: number; condLine: number }
  | { k: 'for'; init?: Stmt; cond?: Expr; step?: Expr; body: Stmt; emptyBody: boolean; line: number }
  | { k: 'switch'; disc: Expr; cases: { value?: Expr; body: Stmt[]; line: number }[]; line: number }
  | { k: 'break'; line: number }
  | { k: 'continue'; line: number }
  | { k: 'return'; e?: Expr; line: number }
  | { k: 'empty'; line: number };

export interface Func {
  k: 'func';
  ret: VType;
  name: string;
  params: { type: VType; name: string; isArray?: boolean }[];
  body: Stmt[];
  line: number;
  endLine: number;
}

export interface Program {
  globals: Stmt[];
  funcs: Func[];
  lastLine: number;
}

const BASE_TYPES: Record<string, VType> = {
  int: 'int',
  short: 'int',
  long: 'long',
  float: 'float',
  double: 'float',
  bool: 'bool',
  boolean: 'bool',
  char: 'char',
  byte: 'byte',
  String: 'String',
  void: 'void',
  word: 'long',
  uint8_t: 'byte',
  size_t: 'long',
};

export const KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return',
  'const', 'unsigned', 'static', 'enum', 'true', 'false', ...Object.keys(BASE_TYPES),
]);

class Parser {
  i = 0;
  enumTypes = new Set<string>();
  constructor(public toks: Tok[]) {}

  get tok(): Tok {
    return this.toks[this.i];
  }
  peek(o = 1): Tok {
    return this.toks[Math.min(this.i + o, this.toks.length - 1)];
  }
  prev(): Tok {
    return this.toks[Math.max(0, this.i - 1)];
  }
  is(v: string): boolean {
    const t = this.tok;
    return (t.t === 'op' || t.t === 'id') && t.v === v;
  }
  eat(v: string): boolean {
    if (this.is(v)) {
      this.i++;
      return true;
    }
    return false;
  }
  show(t: Tok): string {
    if (t.t === 'eof') return '';
    if (t.t === 'str') return `"${t.v}"`;
    if (t.t === 'chr') return `'${t.v}'`;
    return t.v;
  }
  expect(v: string): Tok {
    if (this.is(v)) return this.toks[this.i++];
    const t = this.tok;
    if (v === ';') {
      // #define X 13; ทำให้ ; โผล่กลางบรรทัดที่ใช้
      fail('missingSemi', this.prev().line, { before: this.show(t) || undefined });
    }
    if (t.t === 'eof') {
      if (v === '}') fail('missingBrace', t.line);
      fail('generic', this.prev().line, {
        en: `expected '${v}' at end of input`,
        th: `โค้ดจบก่อนที่จะเจอ ${v} ตรวจว่าปิดวงเล็บและปีกกาครบหรือยัง`,
      });
    }
    if (t.macro && t.v === ';') fail('defineSemi', t.line, { name: t.macro });
    fail('expected', this.prev().line === t.line ? t.line : this.prev().line, { want: v, before: this.show(t) });
  }

  // ---------- ชนิดข้อมูล ----------
  isTypeStart(o = 0): boolean {
    const t = this.peek(o);
    if (t.t !== 'id') return false;
    return t.v in BASE_TYPES || t.v === 'const' || t.v === 'unsigned' || t.v === 'static' || this.enumTypes.has(t.v);
  }
  parseType(): { type: VType; isConst: boolean } {
    let isConst = false;
    let unsigned = false;
    for (;;) {
      if (this.eat('const')) isConst = true;
      else if (this.eat('static')) continue;
      else if (this.eat('unsigned')) unsigned = true;
      else break;
    }
    const t = this.tok;
    let type: VType;
    if (t.t === 'id' && t.v in BASE_TYPES) {
      type = BASE_TYPES[t.v];
      this.i++;
      if (type === 'long' && this.is('long')) this.i++;
      if (this.is('int') && (type === 'long' || type === 'int')) this.i++;
    } else if (t.t === 'id' && this.enumTypes.has(t.v)) {
      type = 'int';
      this.i++;
    } else if (unsigned) {
      type = 'int';
    } else {
      fail('primary', t.line, { before: this.show(t) });
    }
    if (unsigned) type = type === 'char' ? 'byte' : 'ulong';
    if (this.eat('const')) isConst = true;
    return { type, isConst };
  }

  // ---------- ระดับบนสุด ----------
  parseProgram(): Program {
    const globals: Stmt[] = [];
    const funcs: Func[] = [];
    while (this.tok.t !== 'eof') {
      const t = this.tok;
      if (this.is('}')) fail('extraBrace', t.line);
      if (this.is(';')) {
        this.i++;
        continue;
      }
      if (this.is('enum')) {
        globals.push(this.parseEnum());
        continue;
      }
      if (this.is('else')) fail('elseNoIf', t.line);
      if (!this.isTypeStart()) {
        // คำสั่งลอยนอกฟังก์ชัน
        let j = this.i;
        while (this.toks[j].t !== 'eof' && this.toks[j].line === t.line && !['(', ';', '=', '{'].includes(this.toks[j].v)) j++;
        fail('strayStatement', t.line, { before: this.show(this.toks[j]) || this.show(t) });
      }
      const { type, isConst } = this.parseType();
      const nameTok = this.tok;
      if (nameTok.t !== 'id' || KEYWORDS.has(nameTok.v)) this.badName(nameTok);
      if (this.peek().v === '(' && this.peek().t === 'op') {
        this.i++;
        funcs.push(this.parseFunc(type, nameTok));
      } else {
        globals.push(this.parseDeclRest(type, isConst, nameTok.line));
      }
    }
    return { globals, funcs, lastLine: this.tok.line };
  }

  badName(t: Tok): never {
    if (t.t === 'id' && KEYWORDS.has(t.v)) {
      fail('generic', t.line, {
        en: `expected unqualified-id before '${t.v}'`,
        th: `${t.v} เป็นคำสงวนของภาษา ใช้ตั้งชื่อตัวแปรไม่ได้`,
      });
    }
    fail('generic', t.line, {
      en: `expected unqualified-id before '${this.show(t) || 'end of input'}'`,
      th: `หลังชนิดข้อมูลต้องตามด้วยชื่อตัวแปร (ตัวอักษรอังกฤษ ตัวเลข หรือ _ ห้ามเว้นวรรค ห้ามขึ้นต้นด้วยตัวเลข)`,
    });
  }

  parseEnum(): Stmt {
    const line = this.tok.line;
    this.expect('enum');
    if (this.tok.t === 'id' && !this.is('{')) {
      this.enumTypes.add(this.tok.v);
      this.i++;
    }
    this.expect('{');
    const items: DeclItem[] = [];
    let next = 0;
    while (!this.is('}')) {
      const n = this.tok;
      if (n.t !== 'id') this.badName(n);
      this.i++;
      let init: Expr = { k: 'num', v: next, f: false, line: n.line };
      if (this.eat('=')) {
        init = this.parseTernary();
        if (init.k === 'num') next = init.v;
      }
      next++;
      items.push({ name: n.v, init, line: n.line });
      if (!this.eat(',')) break;
    }
    this.expect('}');
    this.expect(';');
    return { k: 'decl', type: 'int', isConst: true, items, line };
  }

  parseFunc(ret: VType, nameTok: Tok): Func {
    this.expect('(');
    const params: { type: VType; name: string; isArray?: boolean }[] = [];
    if (!this.is(')')) {
      if (this.is('void') && this.peek().v === ')') this.i++;
      else
        for (;;) {
          const { type } = this.parseType();
          const p = this.tok;
          if (p.t !== 'id' || KEYWORDS.has(p.v)) this.badName(p);
          this.i++;
          let isArray = false;
          if (this.eat('[')) {
            if (!this.is(']')) this.parseExpr();
            this.expect(']');
            isArray = true;
          }
          params.push({ type, name: p.v, isArray });
          if (!this.eat(',')) break;
        }
    }
    this.expect(')');
    if (this.is(';')) {
      // ต้นแบบฟังก์ชัน (prototype) ข้ามไป
      this.i++;
      return { k: 'func', ret, name: '\u0000proto', params, body: [], line: nameTok.line, endLine: nameTok.line };
    }
    this.expect('{');
    const body = this.parseBlockBody();
    const endLine = this.prev().line;
    return { k: 'func', ret, name: nameTok.v, params, body, line: nameTok.line, endLine };
  }

  parseBlockBody(): Stmt[] {
    const body: Stmt[] = [];
    while (!this.is('}')) {
      if (this.tok.t === 'eof') fail('missingBrace', this.tok.line);
      // เริ่มฟังก์ชันใหม่ทั้งที่ยังไม่ปิดปีกกา
      if (
        this.isTypeStart() &&
        this.peek().t === 'id' &&
        this.peek(2).v === '(' &&
        (this.peek(3).v === ')' || this.isTypeStartAt(3)) &&
        this.looksLikeFuncDef()
      ) {
        fail('generic', this.prev().line, {
          en: `a function-definition is not allowed here before '{' token`,
          th: `ฟังก์ชันก่อนหน้านี้ยังไม่ได้ปิดด้วย } จึงเริ่มฟังก์ชันใหม่ไม่ได้ เติม } ปิดฟังก์ชันก่อนหน้าให้ครบ`,
        });
      }
      body.push(this.parseStmt());
    }
    this.expect('}');
    return body;
  }
  isTypeStartAt(o: number): boolean {
    return this.isTypeStart(o);
  }
  looksLikeFuncDef(): boolean {
    // type name ( ... ) {
    let j = this.i + 2;
    let depth = 0;
    for (; j < this.toks.length; j++) {
      const v = this.toks[j].v;
      if (this.toks[j].t === 'eof') return false;
      if (v === '(') depth++;
      else if (v === ')') {
        depth--;
        if (depth === 0) break;
      } else if (v === ';' || v === '{') return false;
    }
    return this.toks[j + 1]?.v === '{';
  }

  parseDeclRest(type: VType, isConst: boolean, line: number): Stmt {
    const items: DeclItem[] = [];
    for (;;) {
      const n = this.tok;
      if (n.t !== 'id' || KEYWORDS.has(n.v)) this.badName(n);
      this.i++;
      const item: DeclItem = { name: n.v, line: n.line };
      if (this.eat('[')) {
        item.isArray = true;
        if (!this.is(']')) item.size = this.parseExpr();
        this.expect(']');
        if (this.eat('=')) {
          if (this.tok.t === 'str') {
            item.init = this.parseExpr();
          } else {
            this.expect('{');
            item.list = [];
            while (!this.is('}')) {
              item.list.push(this.parseTernary());
              if (!this.eat(',')) break;
            }
            this.expect('}');
          }
        }
      } else if (this.eat('=')) {
        item.init = this.parseTernary();
      }
      items.push(item);
      if (!this.eat(',')) break;
    }
    // int left speed = 5;  (ชื่อมีเว้นวรรค)
    if (this.tok.t === 'id' && !KEYWORDS.has(this.tok.v) && this.tok.line === this.prev().line) {
      fail('generic', this.tok.line, {
        en: `expected initializer before '${this.tok.v}'`,
        th: `ชื่อตัวแปรห้ามมีเว้นวรรค ถ้าเป็นหลายคำให้เขียนติดกันแบบ camelCase เช่น leftSpeed หรือใช้ _ เช่น left_speed`,
      });
    }
    this.expect(';');
    return { k: 'decl', type, isConst, items, line };
  }

  // ---------- คำสั่ง ----------
  parseStmt(): Stmt {
    const t = this.tok;
    const line = t.line;
    if (t.t === 'op' && t.v === '{') {
      this.i++;
      return { k: 'block', body: this.parseBlockBody(), line };
    }
    if (t.t === 'op' && t.v === ';') {
      this.i++;
      return { k: 'empty', line };
    }
    if (t.t === 'id') {
      switch (t.v) {
        case 'if': {
          this.i++;
          this.expect('(');
          if (this.is(')')) fail('primary', line, { before: ')' });
          const cond = this.parseExpr();
          this.expect(')');
          const emptyThen = this.is(';');
          const then = this.parseStmt();
          let els: Stmt | undefined;
          if (this.is('else')) {
            this.i++;
            els = this.parseStmt();
          }
          return { k: 'if', cond, then, else: els, emptyThen, line };
        }
        case 'else':
          fail('elseNoIf', line);
        // eslint-disable-next-line no-fallthrough
        case 'while': {
          this.i++;
          this.expect('(');
          if (this.is(')')) fail('primary', line, { before: ')' });
          const cond = this.parseExpr();
          this.expect(')');
          const emptyBody = this.is(';');
          const body = this.parseStmt();
          return { k: 'while', cond, body, emptyBody, line };
        }
        case 'do': {
          this.i++;
          const body = this.parseStmt();
          const condLine = this.tok.line;
          this.expect('while');
          this.expect('(');
          const cond = this.parseExpr();
          this.expect(')');
          this.expect(';');
          return { k: 'dowhile', cond, body, line, condLine };
        }
        case 'for': {
          this.i++;
          this.expect('(');
          let init: Stmt | undefined;
          if (this.is(';')) this.i++;
          else if (this.isTypeStart()) {
            const { type, isConst } = this.parseType();
            init = this.parseDeclRest(type, isConst, line);
          } else {
            init = { k: 'expr', e: this.parseExpr(), line };
            this.expect(';');
          }
          let cond: Expr | undefined;
          if (!this.is(';')) cond = this.parseExpr();
          this.expect(';');
          let step: Expr | undefined;
          if (!this.is(')')) step = this.parseExpr();
          this.expect(')');
          const emptyBody = this.is(';');
          const body = this.parseStmt();
          return { k: 'for', init, cond, step, body, emptyBody, line };
        }
        case 'switch': {
          this.i++;
          this.expect('(');
          const disc = this.parseExpr();
          this.expect(')');
          this.expect('{');
          const cases: { value?: Expr; body: Stmt[]; line: number }[] = [];
          while (!this.is('}')) {
            if (this.tok.t === 'eof') fail('missingBrace', this.tok.line);
            const cl = this.tok.line;
            if (this.eat('case')) {
              const value = this.parseTernary();
              this.expect(':');
              cases.push({ value, body: [], line: cl });
            } else if (this.eat('default')) {
              this.expect(':');
              cases.push({ body: [], line: cl });
            } else {
              if (!cases.length) {
                fail('generic', cl, {
                  en: `expected 'case' or 'default' before '${this.show(this.tok)}'`,
                  th: `ใน switch ต้องขึ้นต้นด้วย case ค่า: หรือ default: ก่อนจะเขียนคำสั่ง`,
                });
              }
              cases[cases.length - 1].body.push(this.parseStmt());
            }
          }
          this.expect('}');
          return { k: 'switch', disc, cases, line };
        }
        case 'break':
          this.i++;
          this.expect(';');
          return { k: 'break', line };
        case 'continue':
          this.i++;
          this.expect(';');
          return { k: 'continue', line };
        case 'return': {
          this.i++;
          let e: Expr | undefined;
          if (!this.is(';')) e = this.parseExpr();
          this.expect(';');
          return { k: 'return', e, line };
        }
        case 'enum':
          return this.parseEnum();
      }
      if (this.isTypeStart()) {
        const { type, isConst } = this.parseType();
        return this.parseDeclRest(type, isConst, line);
      }
    }
    const e = this.parseExpr();
    this.expect(';');
    return { k: 'expr', e, line };
  }

  // ---------- นิพจน์ ----------
  parseExpr(): Expr {
    return this.parseAssign();
  }
  parseAssign(): Expr {
    const left = this.parseTernary();
    const t = this.tok;
    if (t.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%='].includes(t.v)) {
      this.i++;
      const value = this.parseAssign();
      return { k: 'assign', op: t.v, target: left, value, line: t.line };
    }
    return left;
  }
  parseTernary(): Expr {
    const c = this.parseBin(0);
    if (this.is('?')) {
      const line = this.tok.line;
      this.i++;
      const a = this.parseAssign();
      this.expect(':');
      const b = this.parseAssign();
      return { k: 'cond', c, a, b, line };
    }
    return c;
  }
  static LEVELS: string[][] = [['||'], ['&&'], ['==', '!='], ['<', '>', '<=', '>='], ['+', '-'], ['*', '/', '%']];
  parseBin(level: number): Expr {
    if (level >= Parser.LEVELS.length) return this.parseUnary();
    let left = this.parseBin(level + 1);
    for (;;) {
      const t = this.tok;
      if (t.t === 'op' && Parser.LEVELS[level].includes(t.v)) {
        this.i++;
        const right = this.parseBin(level + 1);
        left = { k: 'bin', op: t.v, l: left, r: right, line: t.line };
      } else break;
    }
    return left;
  }
  parseUnary(): Expr {
    const t = this.tok;
    if (t.t === 'op') {
      if (t.v === '!' || t.v === '-' || t.v === '+') {
        this.i++;
        return { k: 'un', op: t.v, e: this.parseUnary(), line: t.line };
      }
      if (t.v === '++' || t.v === '--') {
        this.i++;
        return { k: 'incdec', op: t.v, prefix: true, target: this.parseUnary(), line: t.line };
      }
      // (float)x
      if (t.v === '(' && this.isTypeStart(1)) {
        let j = 1;
        while (this.isTypeStart(j)) j++;
        if (this.peek(j).v === ')') {
          this.i++;
          const { type } = this.parseType();
          this.expect(')');
          return { k: 'cast', type, e: this.parseUnary(), line: t.line };
        }
      }
    }
    return this.parsePostfix();
  }
  parseArgs(): Expr[] {
    const args: Expr[] = [];
    if (!this.is(')')) {
      for (;;) {
        args.push(this.parseAssign());
        if (!this.eat(',')) break;
      }
    }
    this.expect(')');
    return args;
  }
  parsePostfix(): Expr {
    let e = this.parsePrimary();
    for (;;) {
      const t = this.tok;
      if (t.t !== 'op') break;
      if (t.v === '(' && e.k === 'id') {
        this.i++;
        e = { k: 'call', name: e.name, args: this.parseArgs(), line: e.line };
      } else if (t.v === '[') {
        this.i++;
        const idx = this.parseExpr();
        this.expect(']');
        e = { k: 'index', obj: e, idx, line: t.line };
      } else if (t.v === '.') {
        this.i++;
        const m = this.tok;
        if (m.t !== 'id') fail('primary', m.line, { before: this.show(m) });
        this.i++;
        if (!this.is('(')) {
          fail('generic', m.line, {
            en: `invalid use of member function (did you forget the '()' ?)`,
            th: `หลัง .${m.v} ต้องมีวงเล็บ ( ) เพื่อเรียกใช้คำสั่ง เช่น Serial.println("Hi");`,
          });
        }
        this.i++;
        e = { k: 'mcall', obj: e, method: m.v, args: this.parseArgs(), line: m.line };
      } else if (t.v === '++' || t.v === '--') {
        this.i++;
        e = { k: 'incdec', op: t.v, prefix: false, target: e, line: t.line };
      } else break;
    }
    return e;
  }
  parsePrimary(): Expr {
    const t = this.tok;
    const line = t.line;
    if (t.t === 'num') {
      this.i++;
      return { k: 'num', v: t.num!, f: !!t.isFloat, line };
    }
    if (t.t === 'str') {
      this.i++;
      let v = t.v;
      while (this.tok.t === 'str') v += this.toks[this.i++].v; // "a" "b" ต่อกัน
      return { k: 'str', v, line };
    }
    if (t.t === 'chr') {
      this.i++;
      return { k: 'chr', v: t.v, line };
    }
    if (t.t === 'id') {
      if (t.v === 'true' || t.v === 'false') {
        this.i++;
        return { k: 'bool', v: t.v === 'true', line };
      }
      // String(95), int(x), float(x)
      if (t.v in BASE_TYPES && this.peek().v === '(') {
        this.i += 2;
        const args = this.parseArgs();
        if (t.v === 'String') return { k: 'call', name: 'String', args, line };
        return { k: 'cast', type: BASE_TYPES[t.v], e: args[0] ?? { k: 'num', v: 0, f: false, line }, line };
      }
      if (KEYWORDS.has(t.v)) {
        if (t.v === 'else') fail('elseNoIf', line);
        fail('primary', line, { before: t.v });
      }
      this.i++;
      return { k: 'id', name: t.v, line };
    }
    if (t.t === 'op' && t.v === '(') {
      this.i++;
      if (this.is(')')) fail('primary', line, { before: ')' });
      const e = this.parseExpr();
      this.expect(')');
      return e;
    }
    if (t.t === 'eof') fail('missingBrace', line);
    if (t.macro && t.v === ';') fail('defineSemi', line, { name: t.macro });
    fail('primary', line, { before: this.show(t) });
  }
}

export function parse(src: string): Program {
  const p = new Parser(lex(src));
  const prog = p.parseProgram();
  prog.funcs = prog.funcs.filter((f) => f.name !== '\u0000proto');
  return prog;
}

// รันโปรแกรมทีละคำสั่ง และเก็บรอยการทำงาน (trace) ให้หน้าจอเล่นซ้ำ
import { Expr, Func, Program, Stmt } from './parser';
import { BUILTIN_CONSTS } from './checker';
import { RUNTIME, warnText } from './messages';
import { Diag, Host, HostCtx, HostValue, RunOptions, RunResult, Step, Val, VarView, VType, WorldEvent } from './types';

interface Var {
  type: VType;
  v: number | string | boolean;
  arr?: (number | string | boolean)[];
  isConst: boolean;
  init: boolean;
}

class BreakSig {}
class ContinueSig {}
class ReturnSig {
  constructor(public val: Val | null) {}
}
class HaltSig {}
class RuntimeErr {
  constructor(public diag: Diag) {}
}

const INT_TYPES: VType[] = ['int', 'long', 'ulong', 'byte', 'bool', 'char'];
const isInt = (t: VType) => INT_TYPES.includes(t);

function wrap16(n: number): number {
  return ((((n + 32768) % 65536) + 65536) % 65536) - 32768;
}
function wrap32(n: number): number {
  return n | 0;
}

export function fmtFloat(n: number, digits = 2): string {
  if (Number.isNaN(n)) return 'nan';
  if (!Number.isFinite(n)) return n > 0 ? 'inf' : '-inf';
  return n.toFixed(digits);
}

export function valText(v: Val): string {
  switch (v.t) {
    case 'float':
      return fmtFloat(v.v as number);
    case 'bool':
      return v.v ? '1' : '0';
    case 'char':
      return String.fromCharCode(v.v as number);
    default:
      return String(v.v);
  }
}

function showRaw(type: VType, raw: number | string | boolean): string {
  switch (type) {
    case 'float':
      return fmtFloat(raw as number);
    case 'bool':
      return raw ? 'true' : 'false';
    case 'char':
      return `'${String.fromCharCode(raw as number)}'`;
    case 'String':
      return `"${raw}"`;
    default:
      return String(raw);
  }
}

const TYPE_LABEL: Record<string, string> = { ulong: 'unsigned long' };

export class Runtime {
  globals = new Map<string, Var>();
  frames: Map<string, Var>[][] = [];
  funcs = new Map<string, Func>();
  trace: Step[] = [];
  cur: Step | null = null;
  serial = '';
  serialBegun = false;
  warnings: Diag[] = [];
  warnKeys = new Set<string>();
  calls: string[] = [];
  steps = 0;
  ticks = 0;
  clock = 0;
  line = 0;
  depth = 0;
  maxSteps: number;
  inputBuf: { n: number } | null = null;
  idlePolls = 0;
  lossyDiv = false;
  seed = 12345;
  ctx: HostCtx;

  constructor(public prog: Program, public host: Host, opts: RunOptions) {
    this.maxSteps = opts.maxSteps ?? 4000;
    for (const f of prog.funcs) this.funcs.set(f.name, f);
    this.ctx = {
      line: 0,
      emit: (ev: WorldEvent) => this.emit(ev),
      warn: (kind: string, th: string) => this.warnRaw(kind, th),
    };
  }

  // ---------- trace ----------
  step(line: number): void {
    if (this.cur) this.cur.vars = this.snapshot();
    this.line = line;
    this.ctx.line = line;
    this.steps++;
    this.tick();
    this.cur = { line, events: [], out: '', wait: 0, vars: [] };
    this.trace.push(this.cur);
  }
  tick(): void {
    this.ticks++;
    this.clock += 1;
    if (this.steps > this.maxSteps || this.ticks > this.maxSteps * 5) {
      throw new RuntimeErr({ kind: 'infinite', line: this.line, th: RUNTIME.infinite({}) });
    }
  }
  emit(ev: WorldEvent): void {
    if (!this.cur) this.step(this.line || 1);
    this.cur!.events.push(ev);
  }
  warn(kind: string, p: Record<string, string | number | undefined> = {}): void {
    this.warnRaw(kind, warnText(kind, p));
  }
  warnRaw(kind: string, th: string): void {
    const key = kind + ':' + this.line;
    if (this.warnKeys.has(key)) return;
    this.warnKeys.add(key);
    this.warnings.push({ kind, line: this.line, th });
  }
  rerr(kind: string, p: Record<string, string | number | undefined> = {}): never {
    throw new RuntimeErr({ kind, line: this.line, th: (RUNTIME[kind] ?? (() => kind))(p) });
  }
  snapshot(): VarView[] {
    const out: VarView[] = [];
    const add = (name: string, v: Var, global: boolean) => {
      const type = (v.isConst ? 'const ' : '') + (TYPE_LABEL[v.type] ?? v.type);
      const text = v.arr
        ? '{' + v.arr.map((x) => showRaw(v.type, x)).join(', ') + '}'
        : v.init
          ? showRaw(v.type, v.v)
          : '?';
      out.push({ name, type, text, global });
    };
    for (const [n, v] of this.globals) add(n, v, true);
    const frame = this.frames[this.frames.length - 1];
    if (frame) for (const sc of frame) for (const [n, v] of sc) add(n, v, false);
    return out;
  }

  // ---------- ตัวแปร ----------
  lookup(name: string): Var | undefined {
    const frame = this.frames[this.frames.length - 1];
    if (frame) {
      for (let i = frame.length - 1; i >= 0; i--) {
        const v = frame[i].get(name);
        if (v) return v;
      }
    }
    return this.globals.get(name);
  }
  scope(): Map<string, Var> {
    const frame = this.frames[this.frames.length - 1];
    return frame ? frame[frame.length - 1] : this.globals;
  }
  pushScope(): void {
    this.frames[this.frames.length - 1]?.push(new Map());
  }
  popScope(): void {
    this.frames[this.frames.length - 1]?.pop();
  }

  // ---------- ค่า ----------
  num(v: Val, op = '?'): number {
    if (v.t === 'String') this.rerr('typeMix', { op });
    if (v.t === 'bool') return v.v ? 1 : 0;
    return v.v as number;
  }
  truthy(v: Val): boolean {
    if (v.t === 'String') return (v.v as string).length > 0;
    if (v.t === 'bool') return !!v.v;
    return (v.v as number) !== 0;
  }
  /** แปลงค่าให้เข้ากับชนิดของกล่อง พร้อมเตือนเมื่อค่าล้นหรือทศนิยมหาย */
  coerce(v: Val, type: VType, quiet = false): Val {
    if (type === 'String') {
      return { t: 'String', v: valText(v) };
    }
    if (v.t === 'String') {
      // String → ตัวเลข: ไม่ควรเกิด (ตัวตรวจกันไว้) ให้เป็น 0
      return this.coerce({ t: 'int', v: 0 }, type, true);
    }
    const n = this.num(v);
    switch (type) {
      case 'float':
        return { t: 'float', v: n };
      case 'bool':
        return { t: 'bool', v: n !== 0 };
      case 'char':
        return { t: 'char', v: Math.trunc(n) & 255 };
      case 'byte': {
        const t = Math.trunc(n);
        const w = ((t % 256) + 256) % 256;
        if (!quiet && w !== t) this.warn('overflow', { type: 'byte', got: w });
        return { t: 'byte', v: w };
      }
      case 'int':
      case 'long':
      case 'ulong': {
        let t = Number.isFinite(n) ? Math.trunc(n) : 0;
        if (!quiet && v.t === 'float' && t !== n) this.warn('truncate', { type, from: fmtFloat(n), got: t });
        const w = type === 'int' ? wrap16(t) : type === 'long' ? wrap32(t) : t >>> 0;
        if (!quiet && w !== t && type !== 'ulong') this.warn('overflow', { type, got: w });
        t = w;
        return { t: type, v: t };
      }
      default:
        return { t: 'int', v: 0 };
    }
  }
  fromHost(raw: HostValue | void, ret?: VType): Val {
    if (raw === undefined || ret === 'void') return { t: 'void', v: 0 };
    if (typeof raw === 'string') return ret === 'char' && raw.length === 1 ? { t: 'char', v: raw.charCodeAt(0) } : { t: 'String', v: raw };
    if (typeof raw === 'boolean') return { t: 'bool', v: raw };
    if (ret) return this.coerce({ t: Number.isInteger(raw) ? 'long' : 'float', v: raw }, ret, true);
    if (Number.isInteger(raw)) return { t: Math.abs(raw) > 32767 ? 'long' : 'int', v: raw };
    return { t: 'float', v: raw };
  }
  toHost(v: Val): HostValue {
    if (v.t === 'char') return String.fromCharCode(v.v as number);
    return v.v;
  }

  // ---------- นิพจน์ ----------
  binary(op: string, a: Val, b: Val, node?: Expr): Val {
    if (op === '==' || op === '!=') {
      let eq: boolean;
      if (a.t === 'String' || b.t === 'String') eq = valText(a) === valText(b);
      else eq = this.num(a) === this.num(b);
      return { t: 'bool', v: op === '==' ? eq : !eq };
    }
    if (a.t === 'String' || b.t === 'String') {
      if (op === '+') {
        if (node && node.k === 'bin' && node.l.k === 'str' && b.t !== 'String' && b.t !== 'char') {
          this.warn('strPlusNum');
          return { t: 'String', v: (a.v as string).slice(Math.max(0, this.num(b))) };
        }
        return { t: 'String', v: valText(a) + valText(b) };
      }
      if (['<', '>', '<=', '>='].includes(op)) {
        const x = valText(a), y = valText(b);
        const r = op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
        return { t: 'bool', v: r };
      }
      this.rerr('typeMix', { op });
    }
    const x = this.num(a, op), y = this.num(b, op);
    switch (op) {
      case '<': return { t: 'bool', v: x < y };
      case '>': return { t: 'bool', v: x > y };
      case '<=': return { t: 'bool', v: x <= y };
      case '>=': return { t: 'bool', v: x >= y };
    }
    const isF = a.t === 'float' || b.t === 'float';
    let rt: VType = isF ? 'float' : a.t === 'ulong' || b.t === 'ulong' ? 'ulong' : a.t === 'long' || b.t === 'long' ? 'long' : 'int';
    let r: number;
    switch (op) {
      case '+': r = x + y; break;
      case '-': r = x - y; break;
      case '*': r = x * y; break;
      case '/':
        if (isF) r = x / y;
        else if (y === 0) {
          this.warn('divZero');
          r = -1;
        } else {
          r = Math.trunc(x / y);
          if (x % y !== 0) this.lossyDiv = true;
        }
        break;
      case '%':
        if (isF) this.rerr('typeMix', { op: '%' });
        if (y === 0) {
          this.warn('divZero');
          r = -1;
        } else r = x % y;
        break;
      default:
        r = 0;
    }
    if (rt === 'float') return { t: 'float', v: r };
    return this.coerce({ t: 'long', v: r }, rt, false);
  }

  target(e: Expr): { get(): Val; set(v: Val): void; type: VType; name: string } {
    if (e.k === 'id') {
      const v = this.lookup(e.name);
      if (!v) this.rerr('notArray', { name: e.name });
      return {
        type: v!.type,
        name: e.name,
        get: () => {
          if (!v!.init) {
            this.warn('uninit', { name: e.name });
            v!.init = true;
          }
          return { t: v!.type, v: v!.v };
        },
        set: (val: Val) => {
          v!.v = this.coerce(val, v!.type).v;
          v!.init = true;
        },
      };
    }
    if (e.k === 'index' && e.obj.k === 'id') {
      const v = this.lookup(e.obj.name);
      const name = e.obj.name;
      const idx = Math.trunc(this.num(this.ev(e.idx)));
      if (v && v.arr) {
        const arr = v.arr;
        const okIdx = idx >= 0 && idx < arr.length;
        if (!okIdx) this.warn('arrayRange', { name, idx, max: arr.length - 1 });
        return {
          type: v.type,
          name,
          get: () => {
            const got = okIdx ? arr[idx] : v.type === 'String' ? '' : -21846;
            this.emit({ type: 'arr', name, idx, ok: okIdx, size: arr.length, value: got });
            return { t: v.type, v: got };
          },
          set: (val: Val) => {
            if (okIdx) arr[idx] = this.coerce(val, v.type).v;
            this.emit({ type: 'arr', name, idx, ok: okIdx, size: arr.length, write: true, value: okIdx ? arr[idx] : undefined });
          },
        };
      }
      if (v && v.type === 'String') {
        return {
          type: 'char',
          name,
          get: () => ({ t: 'char', v: (v.v as string).charCodeAt(idx) || 0 }),
          set: (val: Val) => {
            const s = v.v as string;
            if (idx >= 0 && idx < s.length) v.v = s.slice(0, idx) + valText(this.coerce(val, 'char')) + s.slice(idx + 1);
          },
        };
      }
      this.rerr('notArray', { name });
    }
    this.rerr('notArray', { name: '?' });
  }

  ev(e: Expr): Val {
    switch (e.k) {
      case 'num':
        if (e.f) return { t: 'float', v: e.v };
        return { t: Math.abs(e.v) > 32767 ? 'long' : 'int', v: e.v };
      case 'str':
        return { t: 'String', v: e.v };
      case 'chr':
        return { t: 'char', v: e.v.charCodeAt(0) };
      case 'bool':
        return { t: 'bool', v: e.v };
      case 'id': {
        const v = this.lookup(e.name);
        if (v) {
          if (v.arr) return { t: v.type, v: 0, ...( { arr: v.arr } as object) } as Val;
          return this.target(e).get();
        }
        if (e.name in BUILTIN_CONSTS) return { t: 'int', v: BUILTIN_CONSTS[e.name] };
        return { t: 'int', v: 1 }; // ชื่อฟังก์ชันลอย ๆ
      }
      case 'un': {
        const v = this.ev(e.e);
        if (e.op === '!') return { t: 'bool', v: !this.truthy(v) };
        const n = this.num(v, e.op);
        const t: VType = v.t === 'float' ? 'float' : v.t === 'long' || v.t === 'ulong' ? 'long' : 'int';
        return { t, v: e.op === '-' ? -n : n };
      }
      case 'bin': {
        if (e.op === '&&') {
          if (!this.truthy(this.ev(e.l))) return { t: 'bool', v: false };
          return { t: 'bool', v: this.truthy(this.ev(e.r)) };
        }
        if (e.op === '||') {
          if (this.truthy(this.ev(e.l))) return { t: 'bool', v: true };
          return { t: 'bool', v: this.truthy(this.ev(e.r)) };
        }
        const a = this.ev(e.l);
        const b = this.ev(e.r);
        return this.binary(e.op, a, b, e);
      }
      case 'cond':
        return this.truthy(this.ev(e.c)) ? this.ev(e.a) : this.ev(e.b);
      case 'cast':
        return this.coerce(this.ev(e.e), e.type, true);
      case 'assign': {
        const t = this.target(e.target);
        let val: Val;
        if (e.op === '=') {
          val = this.evalFor(e.value, t.type);
        } else {
          val = this.binary(e.op[0], t.get(), this.ev(e.value));
        }
        t.set(val);
        return t.get();
      }
      case 'incdec': {
        const t = this.target(e.target);
        const old = t.get();
        t.set(this.binary(e.op[0], old, { t: 'int', v: 1 }));
        return e.prefix ? t.get() : old;
      }
      case 'index':
        return this.target(e).get();
      case 'call':
        return this.call(e.name, e.args, e.line);
      case 'mcall':
        return this.mcall(e);
    }
  }

  /** คำนวณค่าที่จะใส่กล่องชนิด type (เตือนเมื่อหารจำนวนเต็มแล้วเก็บลง float) */
  evalFor(e: Expr, type: VType): Val {
    this.lossyDiv = false;
    const v = this.ev(e);
    if (type === 'float' && v.t !== 'float' && this.lossyDiv && e.k === 'bin') this.warn('intDivFloat');
    return v;
  }

  print(text: string): void {
    if (!this.serialBegun) {
      this.warn('noSerialBegin');
      return;
    }
    if (!this.cur) this.step(this.line || 1);
    this.cur!.out += text;
    this.serial += text;
  }

  mcall(e: Extract<Expr, { k: 'mcall' }>): Val {
    if (e.obj.k === 'id' && e.obj.name === 'Serial' && !this.lookup('Serial')) {
      const args = e.args.map((a) => this.ev(a));
      switch (e.method) {
        case 'begin':
          this.serialBegun = true;
          return { t: 'void', v: 0 };
        case 'print':
        case 'println': {
          let text = '';
          if (args.length) {
            const a = args[0];
            text = a.t === 'float' && args[1] ? fmtFloat(a.v as number, this.num(args[1])) : valText(a);
          }
          this.print(text + (e.method === 'println' ? '\n' : ''));
          return { t: 'void', v: 0 };
        }
        case 'write':
          this.print(String.fromCharCode(this.num(args[0])));
          return { t: 'void', v: 0 };
        case 'available': {
          if (this.inputBuf) return { t: 'int', v: 1 };
          const inputs = this.host.inputs ?? [];
          if (inputs.length) {
            this.inputBuf = { n: inputs.shift()! };
            this.emit({ type: 'input', value: this.inputBuf.n });
            return { t: 'int', v: 0 };
          }
          if (++this.idlePolls > 30) this.rerr('noInput');
          return { t: 'int', v: 0 };
        }
        case 'parseInt': {
          if (!this.inputBuf) {
            const inputs = this.host.inputs ?? [];
            if (!inputs.length) this.rerr('noInput');
            this.inputBuf = { n: inputs.shift()! };
            this.emit({ type: 'input', value: this.inputBuf.n });
          }
          return { t: 'long', v: this.inputBuf!.n };
        }
        case 'read':
          if (this.inputBuf) {
            this.inputBuf = null;
            return { t: 'int', v: 10 };
          }
          return { t: 'int', v: -1 };
        default:
          return { t: 'void', v: 0 };
      }
    }
    // คำสั่งของ String
    const obj = this.ev(e.obj);
    const args = e.args.map((a) => this.ev(a));
    if (obj.t === 'String') {
      const s = obj.v as string;
      switch (e.method) {
        case 'length': return { t: 'int', v: s.length };
        case 'charAt': {
          const at = Math.trunc(this.num(args[0]));
          if (at < 0 || at >= s.length) this.warn('strRange', { idx: at, max: s.length - 1, len: s.length });
          return { t: 'char', v: s.charCodeAt(at) || 0 };
        }
        case 'toInt': return { t: 'long', v: parseInt(s, 10) || 0 };
        case 'toFloat': return { t: 'float', v: parseFloat(s) || 0 };
        case 'indexOf': return { t: 'int', v: s.indexOf(valText(args[0])) };
        case 'substring': return { t: 'String', v: s.substring(this.num(args[0]), args[1] ? this.num(args[1]) : undefined) };
        case 'equals': return { t: 'bool', v: s === valText(args[0]) };
        case 'startsWith': return { t: 'bool', v: s.startsWith(valText(args[0])) };
        case 'toUpperCase':
        case 'toLowerCase':
        case 'trim': {
          const r = e.method === 'toUpperCase' ? s.toUpperCase() : e.method === 'toLowerCase' ? s.toLowerCase() : s.trim();
          if (e.obj.k === 'id') {
            const v = this.lookup(e.obj.name);
            if (v) v.v = r;
          }
          return { t: 'void', v: 0 };
        }
      }
    }
    this.rerr('badMethod', { name: e.method, type: obj.t });
  }

  call(name: string, argExprs: Expr[], line: number): Val {
    const fn = this.funcs.get(name);
    if (fn) {
      const args = argExprs.map((a, i) => {
        const v = this.ev(a);
        const p = fn.params[i];
        return p && !p.isArray ? this.coerce(v, p.type) : v;
      });
      if (++this.depth > 150) this.rerr('stackOverflow');
      const scope = new Map<string, Var>();
      fn.params.forEach((p, i) => {
        const a = args[i] as Val & { arr?: (number | string | boolean)[] };
        scope.set(p.name, { type: p.type, v: a.v, arr: p.isArray ? a.arr : undefined, isConst: false, init: true });
      });
      this.frames.push([scope]);
      const startLen = this.trace.length;
      let ret: Val | null = null;
      try {
        this.block(fn.body);
        if (fn.ret !== 'void') {
          this.line = fn.endLine;
          this.warn('missingReturn', { name });
        }
      } catch (sig) {
        if (sig instanceof ReturnSig) ret = sig.val;
        else throw sig;
      } finally {
        if (this.cur && this.trace.length > startLen) this.cur.vars = this.snapshot();
        this.frames.pop();
        this.depth--;
      }
      this.line = line;
      if (fn.ret === 'void') return { t: 'void', v: 0 };
      return this.coerce(ret ?? { t: 'int', v: 0 }, fn.ret);
    }
    const args = argExprs.map((a) => this.ev(a));
    // คำสั่งของโลกเกม
    if (name in this.host.fns) {
      this.calls.push(name);
      this.ctx.line = this.line;
      const raw = this.host.call(name, args.map((a) => this.toHost(a)), this.ctx);
      if (this.host.halted) throw new HaltSig();
      return this.fromHost(raw, this.host.fns[name].ret);
    }
    return this.builtin(name, args);
  }

  rand(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed;
  }

  builtin(name: string, args: Val[]): Val {
    const n = (i: number) => this.num(args[i]);
    const anyF = args.some((a) => a.t === 'float');
    const numT = (v: number): Val =>
      anyF ? { t: 'float', v } : { t: args.some((a) => a.t === 'long' || a.t === 'ulong') || Math.abs(v) > 32767 ? 'long' : 'int', v };
    switch (name) {
      case 'delay':
        this.clock += Math.max(0, n(0));
        if (this.cur) this.cur.wait += Math.max(0, n(0));
        if (this.host.onDelay) {
          this.ctx.line = this.line;
          this.host.onDelay(Math.max(0, n(0)), this.ctx);
          if (this.host.halted) throw new HaltSig();
        }
        return { t: 'void', v: 0 };
      case 'delayMicroseconds':
        return { t: 'void', v: 0 };
      case 'millis':
        return { t: 'ulong', v: this.clock };
      case 'micros':
        return { t: 'ulong', v: this.clock * 1000 };
      case 'abs':
        return numT(Math.abs(n(0)));
      case 'sq':
        return numT(n(0) * n(0));
      case 'min':
        return numT(Math.min(n(0), n(1)));
      case 'max':
        return numT(Math.max(n(0), n(1)));
      case 'constrain':
        return numT(Math.min(Math.max(n(0), n(1)), n(2)));
      case 'map': {
        const d = n(2) - n(1);
        if (d === 0) {
          this.warn('divZero');
          return { t: 'long', v: -1 };
        }
        return { t: 'long', v: Math.trunc(((n(0) - n(1)) * (n(4) - n(3))) / d + n(3)) };
      }
      case 'random': {
        const lo = args.length > 1 ? n(0) : 0;
        const hi = args.length > 1 ? n(1) : n(0);
        if (hi <= lo) return { t: 'long', v: lo };
        return { t: 'long', v: lo + (this.rand() % (hi - lo)) };
      }
      case 'randomSeed':
        this.seed = n(0) || 1;
        return { t: 'void', v: 0 };
      case 'pow':
        return { t: 'float', v: Math.pow(n(0), n(1)) };
      case 'sqrt':
        return { t: 'float', v: Math.sqrt(n(0)) };
      case 'String': {
        const a = args[0];
        if (a.t === 'float' && args[1]) return { t: 'String', v: fmtFloat(a.v as number, n(1)) };
        return { t: 'String', v: valText(a) };
      }
      case 'readNumber': {
        const inputs = this.host.inputs ?? [];
        if (!inputs.length) this.rerr('noInput');
        const v = inputs.shift()!;
        this.emit({ type: 'input', value: v });
        return { t: 'long', v };
      }
      case 'digitalRead':
      case 'analogRead':
        return { t: 'int', v: 0 };
      default:
        return { t: 'void', v: 0 };
    }
  }

  // ---------- คำสั่ง ----------
  block(body: Stmt[]): void {
    let returned = false;
    for (const s of body) {
      if (returned) break;
      this.exec(s);
      if (s.k === 'return') returned = true;
    }
  }
  scoped(s: Stmt): void {
    this.pushScope();
    try {
      if (s.k === 'block') this.block(s.body);
      else this.exec(s);
    } finally {
      this.popScope();
    }
  }
  declare(s: Extract<Stmt, { k: 'decl' }>): void {
    for (const it of s.items) {
      const v: Var = { type: s.type, v: s.type === 'String' ? '' : s.type === 'bool' ? false : 0, isConst: s.isConst, init: false };
      if (it.isArray) {
        if (it.init && it.init.k === 'str') {
          v.type = 'String';
          v.v = it.init.v;
          v.init = true;
        } else {
          const list = (it.list ?? []).map((x) => this.coerce(this.ev(x), s.type).v);
          const size = it.size ? Math.trunc(this.num(this.ev(it.size))) : list.length;
          const zero = s.type === 'String' ? '' : s.type === 'bool' ? false : 0;
          v.arr = Array.from({ length: Math.max(0, size) }, (_, i) => (i < list.length ? list[i] : zero));
          v.init = true;
          this.line = it.line;
          this.emit({ type: 'arrInit', name: it.name, values: [...v.arr], filled: list.length > 0 });
        }
      } else if (it.init) {
        this.line = it.line;
        v.v = this.coerce(this.evalFor(it.init, s.type), s.type).v;
        v.init = true;
      } else if (this.frames.length === 0 || s.type === 'String') {
        v.init = true; // global เริ่มที่ 0 เสมอ
      }
      this.scope().set(it.name, v);
    }
  }
  exec(s: Stmt): void {
    switch (s.k) {
      case 'empty':
        return;
      case 'decl':
        this.step(s.line);
        this.declare(s);
        return;
      case 'expr':
        this.step(s.line);
        this.ev(s.e);
        return;
      case 'block':
        this.scoped(s);
        return;
      case 'if':
        this.step(s.line);
        if (this.truthy(this.ev(s.cond))) this.scoped(s.then);
        else if (s.else) this.scoped(s.else);
        return;
      case 'while':
        for (;;) {
          this.step(s.line);
          if (!this.truthy(this.ev(s.cond))) break;
          try {
            this.scoped(s.body);
          } catch (sig) {
            if (sig instanceof BreakSig) break;
            if (!(sig instanceof ContinueSig)) throw sig;
          }
        }
        return;
      case 'dowhile':
        for (;;) {
          try {
            this.scoped(s.body);
          } catch (sig) {
            if (sig instanceof BreakSig) break;
            if (!(sig instanceof ContinueSig)) throw sig;
          }
          this.step(s.condLine);
          if (!this.truthy(this.ev(s.cond))) break;
        }
        return;
      case 'for': {
        this.pushScope();
        try {
          this.step(s.line);
          if (s.init) {
            if (s.init.k === 'decl') this.declare(s.init);
            else if (s.init.k === 'expr') this.ev(s.init.e);
          }
          let first = true;
          for (;;) {
            if (!first) this.step(s.line);
            first = false;
            if (s.cond && !this.truthy(this.ev(s.cond))) break;
            try {
              this.scoped(s.body);
            } catch (sig) {
              if (sig instanceof BreakSig) break;
              if (!(sig instanceof ContinueSig)) throw sig;
            }
            if (s.step) this.ev(s.step);
            this.tick();
          }
        } finally {
          this.popScope();
        }
        return;
      }
      case 'switch': {
        this.step(s.line);
        const d = this.ev(s.disc);
        let start = s.cases.findIndex((c) => c.value && this.truthy(this.binary('==', d, this.ev(c.value))));
        if (start < 0) start = s.cases.findIndex((c) => !c.value);
        if (start < 0) return;
        this.pushScope();
        try {
          for (let i = start; i < s.cases.length; i++) this.block(s.cases[i].body);
        } catch (sig) {
          if (!(sig instanceof BreakSig)) throw sig;
        } finally {
          this.popScope();
        }
        return;
      }
      case 'break':
        this.step(s.line);
        throw new BreakSig();
      case 'continue':
        this.step(s.line);
        throw new ContinueSig();
      case 'return':
        this.step(s.line);
        throw new ReturnSig(s.e ? this.ev(s.e) : null);
    }
  }

  run(loops: number): RunResult {
    let loopsRun = 0;
    let runtimeError: Diag | undefined;
    try {
      for (const g of this.prog.globals) this.exec(g);
      this.call('setup', [], this.funcs.get('setup')!.line);
      for (let i = 0; i < loops; i++) {
        if (this.host.halted) break;
        loopsRun++;
        this.call('loop', [], this.funcs.get('loop')!.line);
      }
    } catch (sig) {
      if (sig instanceof RuntimeErr) runtimeError = sig.diag;
      else if (!(sig instanceof HaltSig)) throw sig;
    }
    if (this.cur && !this.cur.vars.length) this.cur.vars = this.snapshot();
    return {
      runtimeError,
      warnings: this.warnings,
      trace: this.trace,
      serial: this.serial,
      loopsRun,
      calls: this.calls,
    };
  }
}

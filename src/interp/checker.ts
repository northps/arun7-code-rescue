// ตรวจโปรแกรมแบบคอมไพเลอร์ ก่อนรัน: ชื่อที่ไม่ได้ประกาศ ประกาศซ้ำ แก้ const จำนวน argument
import { Expr, Func, Program, Stmt } from './parser';
import { diag, fail, warnText } from './messages';
import { Diag, HostFn, VType } from './types';

export const BUILTIN_FNS: Record<string, HostFn> = {
  delay: { min: 1, max: 1 },
  delayMicroseconds: { min: 1, max: 1 },
  millis: { min: 0, max: 0, ret: 'ulong' },
  micros: { min: 0, max: 0, ret: 'ulong' },
  abs: { min: 1, max: 1, ret: 'int' },
  min: { min: 2, max: 2, ret: 'int' },
  max: { min: 2, max: 2, ret: 'int' },
  constrain: { min: 3, max: 3, ret: 'int' },
  map: { min: 5, max: 5, ret: 'long' },
  random: { min: 1, max: 2, ret: 'long' },
  randomSeed: { min: 1, max: 1 },
  pow: { min: 2, max: 2, ret: 'float' },
  sqrt: { min: 1, max: 1, ret: 'float' },
  sq: { min: 1, max: 1, ret: 'int' },
  String: { min: 1, max: 2, ret: 'String' },
  readNumber: { min: 0, max: 0, ret: 'long' },
  pinMode: { min: 2, max: 2 },
  digitalWrite: { min: 2, max: 2 },
  digitalRead: { min: 1, max: 1, ret: 'int' },
  analogWrite: { min: 2, max: 2 },
  analogRead: { min: 1, max: 1, ret: 'int' },
};

export const BUILTIN_CONSTS: Record<string, number> = {
  HIGH: 1, LOW: 0, OUTPUT: 1, INPUT: 0, INPUT_PULLUP: 2, LED_BUILTIN: 13,
  A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19,
};

export const SERIAL_METHODS: Record<string, [number, number]> = {
  begin: [1, 1], print: [1, 2], println: [0, 2], available: [0, 0], read: [0, 0], parseInt: [0, 0], write: [1, 1], flush: [0, 0],
};

interface Sym {
  kind: 'var' | 'func';
  type: VType;
  isConst: boolean;
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[n];
}

export function check(prog: Program, hostFns: Record<string, HostFn>): Diag[] {
  const warnings: Diag[] = [];
  const funcs = new Map<string, Func>();
  for (const f of prog.funcs) {
    if (funcs.has(f.name)) {
      fail('generic', f.line, {
        en: `redefinition of '${f.ret} ${f.name}()'`,
        th: `มีฟังก์ชันชื่อ ${f.name}() ซ้ำกันสองตัว ชื่อฟังก์ชันต้องไม่ซ้ำ`,
      });
    }
    funcs.set(f.name, f);
  }
  for (const need of ['setup', 'loop']) {
    if (!funcs.has(need)) throw failDiag('noSetup', prog.lastLine, { name: need });
  }

  const scopes: Map<string, Sym>[] = [new Map()];
  let loopDepth = 0;
  let switchDepth = 0;

  const allNames = (): string[] => {
    const s = new Set<string>();
    for (const sc of scopes) for (const k of sc.keys()) s.add(k);
    for (const k of funcs.keys()) s.add(k);
    for (const k of Object.keys(hostFns)) s.add(k);
    for (const k of Object.keys(BUILTIN_FNS)) s.add(k);
    for (const k of Object.keys(BUILTIN_CONSTS)) s.add(k);
    s.add('Serial');
    return [...s];
  };
  const suggest = (name: string): string | undefined => {
    const names = allNames();
    const ci = names.find((n) => n.toLowerCase() === name.toLowerCase());
    if (ci) return ci;
    let best: string | undefined;
    let bd = 3;
    for (const n of names) {
      if (Math.abs(n.length - name.length) > 2 || n.length < 3) continue;
      const d = lev(n.toLowerCase(), name.toLowerCase());
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  };
  const lookup = (name: string): Sym | undefined => {
    for (let i = scopes.length - 1; i >= 0; i--) {
      const s = scopes[i].get(name);
      if (s) return s;
    }
    return undefined;
  };
  const fnSig = (name: string): { min: number; max: number; ret?: VType } | undefined => {
    const u = funcs.get(name);
    if (u) return { min: u.params.length, max: u.params.length, ret: u.ret };
    return hostFns[name] ?? BUILTIN_FNS[name];
  };
  const isVoidCall = (e: Expr): string | undefined => {
    if (e.k !== 'call') return undefined;
    const sig = fnSig(e.name);
    if (sig && (!sig.ret || sig.ret === 'void')) return e.name;
    return undefined;
  };

  const expr = (e: Expr): void => {
    switch (e.k) {
      case 'num': case 'str': case 'chr': case 'bool':
        return;
      case 'id': {
        if (lookup(e.name) || e.name in BUILTIN_CONSTS) return;
        if (fnSig(e.name)) return; // ชื่อฟังก์ชันลอย ๆ (ลืมวงเล็บ) เตือนตอนเป็นคำสั่ง
        if (e.name === 'Serial') return;
        fail('notDeclared', e.line, { name: e.name, suggest: suggest(e.name) });
        return;
      }
      case 'bin':
        expr(e.l);
        expr(e.r);
        return;
      case 'un':
        expr(e.e);
        return;
      case 'cast':
        expr(e.e);
        return;
      case 'cond':
        expr(e.c);
        expr(e.a);
        expr(e.b);
        return;
      case 'assign': {
        if (e.target.k !== 'id' && e.target.k !== 'index') fail('lvalue', e.line);
        expr(e.target);
        const root = e.target.k === 'index' ? e.target.obj : e.target;
        if (root.k === 'id') {
          const s = lookup(root.name);
          if (s?.isConst || root.name in BUILTIN_CONSTS) fail('readOnly', e.line, { name: root.name });
          if (!s && fnSig(root.name)) fail('lvalue', e.line);
        }
        expr(e.value);
        const vname = isVoidCall(e.value);
        if (vname) fail('voidValue', e.line, { name: vname });
        return;
      }
      case 'incdec': {
        if (e.target.k !== 'id' && e.target.k !== 'index') fail('lvalue', e.line);
        expr(e.target);
        if (e.target.k === 'id') {
          const s = lookup(e.target.name);
          if (s?.isConst) fail('readOnly', e.line, { name: e.target.name });
        }
        return;
      }
      case 'index':
        expr(e.obj);
        expr(e.idx);
        return;
      case 'call': {
        const local = lookup(e.name);
        if (local) fail('notFunction', e.line, { name: e.name });
        const sig = fnSig(e.name);
        if (!sig) fail('notDeclared', e.line, { name: e.name, suggest: suggest(e.name) });
        else {
          if (e.args.length < sig.min) fail('tooFew', e.line, { name: e.name, want: sig.min, got: e.args.length });
          if (e.args.length > sig.max) fail('tooMany', e.line, { name: e.name, want: sig.max, got: e.args.length });
        }
        e.args.forEach(expr);
        return;
      }
      case 'mcall': {
        if (e.obj.k === 'id' && e.obj.name === 'Serial' && !lookup('Serial')) {
          const m = SERIAL_METHODS[e.method];
          if (!m) fail('noMember', e.line, { name: e.method });
          else {
            if (e.args.length < m[0]) fail('tooFew', e.line, { name: 'Serial.' + e.method, want: m[0], got: e.args.length });
            if (e.args.length > m[1]) fail('tooMany', e.line, { name: 'Serial.' + e.method, want: m[1], got: e.args.length });
          }
        } else if (e.obj.k === 'id' && e.obj.name.toLowerCase() === 'serial' && !lookup(e.obj.name)) {
          fail('notDeclared', e.line, { name: e.obj.name, suggest: 'Serial' });
        } else {
          expr(e.obj);
        }
        e.args.forEach(expr);
        return;
      }
    }
  };

  const declare = (name: string, sym: Sym, line: number): void => {
    const cur = scopes[scopes.length - 1];
    if (cur.has(name)) fail('redeclared', line, { name, type: cur.get(name)!.type });
    cur.set(name, sym);
  };

  const condLint = (c: Expr): void => {
    if (c.k === 'assign' && c.op === '=') {
      let truth = 'จริงหรือเท็จตามค่าที่ใส่';
      if (c.value.k === 'num') truth = c.value.v !== 0 ? 'จริง' : 'เท็จ';
      if (c.value.k === 'bool') truth = c.value.v ? 'จริง' : 'เท็จ';
      warnings.push({
        kind: 'assignInCond',
        line: c.line,
        th: warnText('assignInCond', { name: c.target.k === 'id' ? c.target.name : undefined, truth }),
      });
    }
  };

  const stmt = (s: Stmt): void => {
    switch (s.k) {
      case 'empty':
        return;
      case 'decl': {
        for (const it of s.items) {
          const cur = scopes[scopes.length - 1];
          if (cur.has(it.name)) fail('redeclared', it.line, { name: it.name, type: s.type });
          if (it.size) expr(it.size);
          if (it.init) {
            expr(it.init);
            if (it.init.k === 'str' && s.type !== 'String' && !(it.isArray && s.type === 'char')) {
              fail('convStrTo', it.line, { type: s.type });
            }
            const vname = isVoidCall(it.init);
            if (vname) fail('voidValue', it.line, { name: vname });
          }
          it.list?.forEach(expr);
          declare(it.name, { kind: 'var', type: s.type, isConst: s.isConst }, it.line);
        }
        return;
      }
      case 'expr': {
        expr(s.e);
        if (s.e.k === 'id' && !lookup(s.e.name) && fnSig(s.e.name)) {
          warnings.push({ kind: 'callNoParens', line: s.line, th: warnText('callNoParens', { name: s.e.name }) });
        }
        return;
      }
      case 'block':
        scopes.push(new Map());
        s.body.forEach(stmt);
        scopes.pop();
        return;
      case 'if':
        expr(s.cond);
        condLint(s.cond);
        if (s.emptyThen) warnings.push({ kind: 'emptyBody', line: s.line, th: warnText('emptyBody', { what: 'if' }) });
        scopes.push(new Map());
        stmt(s.then);
        scopes.pop();
        if (s.else) {
          scopes.push(new Map());
          stmt(s.else);
          scopes.pop();
        }
        return;
      case 'while':
        expr(s.cond);
        condLint(s.cond);
        if (s.emptyBody && s.cond.k !== 'bin')
          warnings.push({ kind: 'emptyBody', line: s.line, th: warnText('emptyBody', { what: 'while' }) });
        loopDepth++;
        scopes.push(new Map());
        stmt(s.body);
        scopes.pop();
        loopDepth--;
        return;
      case 'dowhile':
        loopDepth++;
        scopes.push(new Map());
        stmt(s.body);
        scopes.pop();
        loopDepth--;
        expr(s.cond);
        return;
      case 'for':
        scopes.push(new Map());
        if (s.init) stmt(s.init);
        if (s.cond) expr(s.cond);
        if (s.step) expr(s.step);
        if (s.emptyBody) warnings.push({ kind: 'emptyBody', line: s.line, th: warnText('emptyBody', { what: 'for' }) });
        loopDepth++;
        scopes.push(new Map());
        stmt(s.body);
        scopes.pop();
        loopDepth--;
        scopes.pop();
        return;
      case 'switch': {
        expr(s.disc);
        if (s.disc.k === 'str') fail('badSwitch', s.line);
        if (s.disc.k === 'id') {
          const sym = lookup(s.disc.name);
          if (sym && (sym.type === 'String' || sym.type === 'float')) fail('badSwitch', s.line);
        }
        switchDepth++;
        scopes.push(new Map());
        for (const c of s.cases) {
          if (c.value) {
            expr(c.value);
            const v = c.value;
            const ok =
              v.k === 'num' || v.k === 'chr' || v.k === 'bool' ||
              (v.k === 'un' && v.e.k === 'num') ||
              (v.k === 'id' && (lookup(v.name)?.isConst || v.name in BUILTIN_CONSTS));
            if (!ok) fail('caseNeedsConst', c.line);
          }
          c.body.forEach(stmt);
        }
        scopes.pop();
        switchDepth--;
        return;
      }
      case 'break':
        if (!loopDepth && !switchDepth) fail('breakOutside', s.line);
        return;
      case 'continue':
        if (!loopDepth) fail('continueOutside', s.line);
        return;
      case 'return':
        if (s.e) expr(s.e);
        return;
    }
  };

  // ตัวแปร global ก่อน แล้วค่อยตรวจตัวฟังก์ชัน (Arduino IDE สร้าง prototype ให้ ฟังก์ชันจึงเรียกก่อนประกาศได้)
  for (const g of prog.globals) stmt(g);
  for (const f of prog.funcs) {
    if (scopes[0].has(f.name)) fail('redeclared', f.line, { name: f.name, type: f.ret });
  }
  for (const f of prog.funcs) {
    scopes.push(new Map());
    for (const p of f.params) declare(p.name, { kind: 'var', type: p.type, isConst: false }, f.line);
    // ตัวฟังก์ชันใช้ scope เดียวกับ parameter (เหมือน C++)
    f.body.forEach(stmt);
    scopes.pop();
  }
  return warnings;
}

function failDiag(kind: string, line: number, p: Record<string, string | number>): Error {
  try {
    fail(kind, line, p);
  } catch (e) {
    return e as Error;
  }
  return new Error(diag(kind, line, p).th);
}

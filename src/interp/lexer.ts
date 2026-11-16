// ตัดโค้ดเป็นคำ (token)
import { fail } from './messages';

export type TokType = 'num' | 'str' | 'chr' | 'id' | 'op' | 'eof';

export interface Tok {
  t: TokType;
  v: string;
  line: number;
  num?: number;
  isFloat?: boolean;
  /** ชื่อ #define ที่ token นี้ถูกแทนมา */
  macro?: string;
}

const OPS3: string[] = [];
const OPS2 = ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%='];
const OPS1 = '+-*/%=<>!(){}[];,.:?&|';

const ESC: Record<string, string> = { n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', "'": "'", '"': '"' };

function firstByteOctal(ch: string): string {
  const b = new TextEncoder().encode(ch)[0] ?? 0;
  return b.toString(8);
}

function lexRaw(src: string, startLine: number, macros: Map<string, Tok[]>): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  let line = startLine;
  const n = src.length;
  let atLineStart = true;

  while (i < n) {
    const c = src[i];
    if (c === '\n') {
      line++;
      i++;
      atLineStart = true;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r' || c === ' ') {
      i++;
      continue;
    }
    // คอมเมนต์
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') line++;
        i++;
      }
      i += 2;
      continue;
    }
    // คำสั่งก่อนคอมไพล์
    if (c === '#' && atLineStart) {
      let j = i;
      while (j < n && src[j] !== '\n') j++;
      const text = src.slice(i, j);
      const m = /^#\s*define\s+([A-Za-z_]\w*)\s*(.*)$/.exec(text);
      if (m) {
        const body = m[2].replace(/\/\/.*$/, '');
        macros.set(m[1], lexRaw(body, line, macros));
      }
      i = j;
      continue;
    }
    atLineStart = false;

    // ตัวเลข
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i;
      let isFloat = false;
      if (c === '0' && /[xX]/.test(src[i + 1] ?? '')) {
        j += 2;
        while (j < n && /[0-9a-fA-F]/.test(src[j])) j++;
        toks.push({ t: 'num', v: src.slice(i, j), line, num: parseInt(src.slice(i, j), 16), isFloat: false });
        i = j;
        continue;
      }
      while (j < n && /[0-9]/.test(src[j])) j++;
      if (src[j] === '.' && /[0-9]/.test(src[j + 1] ?? '')) {
        isFloat = true;
        j++;
        while (j < n && /[0-9]/.test(src[j])) j++;
      } else if (src[j] === '.') {
        isFloat = true;
        j++;
      }
      const text = src.slice(i, j);
      // ตัวต่อท้าย L, UL, f
      while (j < n && /[uUlLfF]/.test(src[j])) {
        if (/[fF]/.test(src[j])) isFloat = true;
        j++;
      }
      // ชื่อขึ้นต้นด้วยตัวเลข เช่น 2speed
      if (j < n && /[A-Za-z_]/.test(src[j])) {
        let k = j;
        while (k < n && /\w/.test(src[k])) k++;
        fail('generic', line, {
          en: `invalid suffix "${src.slice(j, k)}" on integer constant`,
          th: `ชื่อ ${src.slice(i, k)} ขึ้นต้นด้วยตัวเลขไม่ได้ ชื่อตัวแปรต้องขึ้นต้นด้วยตัวอักษรอังกฤษหรือ _`,
        });
      }
      toks.push({ t: 'num', v: text, line, num: parseFloat(text), isFloat });
      i = j;
      continue;
    }
    // ชื่อ / คำสงวน
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < n && /\w/.test(src[j])) j++;
      toks.push({ t: 'id', v: src.slice(i, j), line });
      i = j;
      continue;
    }
    // ข้อความ
    if (c === '"') {
      let j = i + 1;
      let s = '';
      for (;;) {
        if (j >= n || src[j] === '\n') fail('unterminatedString', line);
        if (src[j] === '"') break;
        if (src[j] === '\\') {
          const e = src[j + 1];
          s += ESC[e] ?? e;
          j += 2;
          continue;
        }
        s += src[j++];
      }
      toks.push({ t: 'str', v: s, line });
      i = j + 1;
      continue;
    }
    // ตัวอักษร
    if (c === "'") {
      let j = i + 1;
      let s = '';
      for (;;) {
        if (j >= n || src[j] === '\n') fail('unterminatedChar', line);
        if (src[j] === "'") break;
        if (src[j] === '\\') {
          const e = src[j + 1];
          s += ESC[e] ?? e;
          j += 2;
          continue;
        }
        s += src[j++];
      }
      if (s.length !== 1) fail('multiChar', line);
      toks.push({ t: 'chr', v: s, line });
      i = j + 1;
      continue;
    }
    // เครื่องหมาย
    const two = src.slice(i, i + 2);
    if (OPS3.includes(src.slice(i, i + 3))) {
      toks.push({ t: 'op', v: src.slice(i, i + 3), line });
      i += 3;
      continue;
    }
    if (OPS2.includes(two)) {
      toks.push({ t: 'op', v: two, line });
      i += 2;
      continue;
    }
    if (OPS1.includes(c)) {
      toks.push({ t: 'op', v: c, line });
      i++;
      continue;
    }
    // ตัวอักษรแปลกปลอม
    const ch = String.fromCodePoint(src.codePointAt(i) ?? 0);
    const quote = '“”‘’'.includes(ch) ? 'y' : undefined;
    fail('stray', line, { oct: firstByteOctal(ch), ch, quote });
  }
  return toks;
}

export function lex(src: string): Tok[] {
  const macros = new Map<string, Tok[]>();
  const raw = lexRaw(src.replace(/\r\n/g, '\n'), 1, macros);
  const out: Tok[] = [];
  for (const t of raw) {
    if (t.t === 'id' && macros.has(t.v)) {
      for (const m of macros.get(t.v)!) out.push({ ...m, line: t.line, macro: t.v });
    } else {
      out.push(t);
    }
  }
  const lastLine = out.length ? out[out.length - 1].line : 1;
  out.push({ t: 'eof', v: '<eof>', line: lastLine });
  return out;
}

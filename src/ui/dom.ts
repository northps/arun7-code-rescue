// ตัวช่วยสร้าง DOM และไฮไลต์โค้ด

type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | ((e: Event) => void) | undefined> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c);
  }
  return el;
}

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const TYPES = new Set(['void', 'int', 'long', 'float', 'double', 'bool', 'boolean', 'char', 'byte', 'String', 'const', 'unsigned', 'enum']);
const KEYS = new Set(['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return']);
const CONSTS = new Set(['true', 'false', 'HIGH', 'LOW', 'OUTPUT', 'INPUT', 'INPUT_PULLUP']);

const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"?)|('(?:[^'\\]|\\.)*'?)|(#\s*\w+)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|(.)/gm;

/** ไฮไลต์โค้ด 1 บรรทัดเป็น HTML */
export function hl(line: string): string {
  let out = '';
  TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(line))) {
    const [all, com, str, chr, pre, num, id] = m;
    if (all === '') break;
    if (com) out += `<span class="c-com">${esc(com)}</span>`;
    else if (str || chr) out += `<span class="c-str">${esc(all)}</span>`;
    else if (pre) out += `<span class="c-key">${esc(pre)}</span>`;
    else if (num) out += `<span class="c-num">${num}</span>`;
    else if (id) {
      const rest = line.slice(TOKEN.lastIndex);
      if (TYPES.has(id)) out += `<span class="c-type">${id}</span>`;
      else if (KEYS.has(id)) out += `<span class="c-key">${id}</span>`;
      else if (CONSTS.has(id) || /^[A-Z][A-Z0-9_]+$/.test(id)) out += `<span class="c-const">${id}</span>`;
      else if (/^\s*\(/.test(rest) || id === 'Serial') out += `<span class="c-fn">${id}</span>`;
      else out += esc(id);
    } else out += esc(all);
  }
  return out;
}

/** ข้อความบทเรียน: **หนา** และ `โค้ด` */
export function rich(text: string): string {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

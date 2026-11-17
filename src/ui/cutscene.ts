// ฉากเล่าเรื่อง: ตัดเนื้อเรื่องเป็นจังหวะ (บรรยาย / คำพูด) แล้วแสดงทีละจังหวะ พิมพ์ทีละตัว มีชื่อผู้พูด
import { h } from './dom';
import { sfx } from './sound';

export type Beat =
  | { kind: 'card'; kicker: string; title: string; sub?: string }
  | { kind: 'narr'; text: string }
  | { kind: 'say'; who: string; text: string }
  | { kind: 'end'; text: string };

const SPEAKERS: Record<string, { face: string; cls: string }> = {
  มาลี: { face: '👩‍🔧', cls: 'mali' },
  บิต: { face: '🤖', cls: 'bit' },
  ระบบยาน: { face: '📢', cls: 'ship' },
  เสียงจากวิทยุ: { face: '📻', cls: 'radio' },
  วิทยุ: { face: '📻', cls: 'radio' },
  ลูกเรือ: { face: '🧑‍🚀', cls: 'crew' },
  เคลธ: { face: '👾', cls: 'radio' },
};

/** บรรยายยาวเกินไปให้ตัดเป็นสองช่วงที่ช่องว่างใกล้กลางที่สุด (ภาษาไทยเว้นวรรคระหว่างประโยค) */
function splitLong(text: string, max = 150): string[] {
  const t = text.trim();
  if (t.length <= max) return t ? [t] : [];
  const mid = Math.floor(t.length / 2);
  let best = -1;
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    // ไม่ตัดกลางวงเล็บหรือกลางเครื่องหมายคำพูด
    if (t[i] === '(') depth++;
    else if (t[i] === ')') depth = Math.max(0, depth - 1);
    else if (t[i] === '"') depth = depth ? 0 : 1;
    if (t[i] !== ' ' || depth) continue;
    if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
  }
  if (best < 20 || best > t.length - 20) return [t];
  return [...splitLong(t.slice(0, best), max), ...splitLong(t.slice(best + 1), max)];
}

const SCRIPT_LINE = /^(มาลี|บิต|ระบบยาน|วิทยุ|ลูกเรือ|เคลธ)\s*:\s*(.+)$/;

/**
 * บทแบบบรรทัดต่อบรรทัด (รูปแบบที่ด่านใช้): หนึ่งบรรทัด = หนึ่งจังหวะ
 * "มาลี: ..." = คำพูดของตัวละคร (มาลี บิต ระบบยาน วิทยุ ลูกเรือ เคลธ) · "— จบองก์ 1" = ป้ายจบ · นอกนั้นเป็นบรรยาย
 */
function scriptBeats(text: string): Beat[] {
  const out: Beat[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const end = /^—\s*(จบ.*)$/.exec(line);
    const say = SCRIPT_LINE.exec(line);
    if (end) out.push({ kind: 'end', text: end[1].trim() });
    else if (say) out.push({ kind: 'say', who: say[1], text: say[2].trim() });
    else for (const part of splitLong(line, 170)) out.push({ kind: 'narr', text: part });
  }
  return out;
}

/**
 * (รูปแบบเก่า: ข้อความย่อหน้าเดียว) ตัดเนื้อเรื่องเป็นจังหวะ: ข้อความในเครื่องหมายคำพูดที่ยาวพอเป็น "คำพูด" ของตัวละคร ที่เหลือเป็นบรรยาย
 * ผู้พูดดูจากคำบรรยายที่อยู่ก่อนหน้า (มาลี / เสียงประกาศ / บิต) ถ้าไม่มีชื่อ ใช้ผู้พูดคนล่าสุด
 */
export function splitBeats(story: string): Beat[] {
  if (story.includes('\n')) return scriptBeats(story);
  const out: Beat[] = [];
  let text = story.trim();
  let end: string | null = null;
  const tail = /\s*—\s*(จบ[^"]*)$/.exec(text);
  if (tail) {
    end = tail[1].trim();
    text = text.slice(0, tail.index);
  }
  const hasMali = text.includes('มาลี');
  let lastWho = '';
  let buf = '';
  const flush = () => {
    for (const part of splitLong(buf)) out.push({ kind: 'narr', text: part });
    buf = '';
  };
  const re = /"([^"]+)"/g;
  let at = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    buf += text.slice(at, m.index);
    at = m.index + m[0].length;
    const q = m[1].trim();
    const speech = q.length >= 14 && (q.includes(" ") || q.includes("...")) && !/[;(){}]/.test(q);
    if (!speech) {
      buf += `"${q}"`;
      continue;
    }
    const ctx = buf.slice(-70);
    let who = '';
    if (/มาลี/.test(ctx) || /^[.… ]*นี่[^ ]*มาลี/.test(q)) who = 'มาลี';
    else if (/ประกาศ|ลำโพง/.test(ctx)) who = 'ระบบยาน';
    else if (/วิทยุ/.test(ctx)) who = 'เสียงจากวิทยุ';
    else if (/บิต[^ ]{0,24}(จอ|ข้อความ|ตอบ)/.test(ctx)) who = 'บิต';
    else who = lastWho || (hasMali ? 'มาลี' : /วิทยุ|เสียง/.test(ctx) ? 'เสียงจากวิทยุ' : '');
    if (!who) {
      buf += `"${q}"`;
      continue;
    }
    lastWho = who;
    buf = buf.replace(/[:：]\s*$/, '');
    flush();
    out.push({ kind: 'say', who, text: q });
  }
  buf += text.slice(at);
  flush();
  if (end) out.push({ kind: 'end', text: end });
  return out;
}

export interface CutsceneHandle {
  done: Promise<void>;
  skip(): void;
}

/** แสดงฉากเล่าเรื่องทับหน้าจอ แตะเพื่อไปต่อ (แตะตอนกำลังพิมพ์ = ขึ้นครบทันที) */
export function playCutscene(root: HTMLElement, beats: Beat[]): CutsceneHandle {
  let finish: () => void = () => undefined;
  const done = new Promise<void>((r) => (finish = r));
  if (!beats.length) {
    finish();
    return { done, skip: () => undefined };
  }
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const face = h('div', { class: 'cs-face' });
  const name = h('div', { class: 'cs-name' });
  const body = h('p', { class: 'cs-text' });
  const more = h('div', { class: 'cs-more' }, '▼');
  const box = h('div', { class: 'cs-box' }, face, h('div', { class: 'cs-col' }, name, body), more);
  const card = h('div', { class: 'cs-card' });
  const count = h('span', { class: 'cs-count' });
  const el = h(
    'div',
    { class: 'cutscene' },
    h('div', { class: 'cs-bar top' }),
    h('button', { class: 'cs-skip', onclick: (e) => {
      e.stopPropagation();
      close();
    } }, 'ข้าม ▸▸'),
    card,
    box,
    h('div', { class: 'cs-bar bottom' }, count),
  );
  let i = -1;
  let timer = 0;
  let full = '';
  let shown = 0;
  let closed = false;

  const stopTyping = () => {
    if (timer) window.clearInterval(timer);
    timer = 0;
  };
  function close(): void {
    if (closed) return;
    closed = true;
    stopTyping();
    el.classList.add('out');
    window.setTimeout(() => el.remove(), reduce ? 0 : 260);
    finish();
  }
  const type = (text: string) => {
    full = text;
    shown = reduce ? text.length : 0;
    body.textContent = text.slice(0, shown);
    more.hidden = shown < full.length;
    stopTyping();
    if (shown >= full.length) return;
    timer = window.setInterval(() => {
      shown = Math.min(full.length, shown + 1);
      body.textContent = full.slice(0, shown);
      if (shown % 3 === 0) sfx.type();
      if (shown >= full.length) {
        stopTyping();
        more.hidden = false;
      }
    }, 24);
  };
  const show = () => {
    const b = beats[i];
    count.textContent = `${i + 1} / ${beats.length}`;
    el.dataset.kind = b.kind;
    if (b.kind === 'card' || b.kind === 'end') {
      stopTyping();
      full = '';
      box.hidden = true;
      card.hidden = false;
      card.className = 'cs-card ' + b.kind;
      card.replaceChildren(
        ...(b.kind === 'card'
          ? [h('span', {}, b.kicker), h('b', {}, b.title), b.sub ? h('small', {}, b.sub) : null, h('em', {}, 'แตะเพื่อไปต่อ')]
          : [h('b', {}, b.text)]
        ).filter((x): x is HTMLElement => !!x),
      );
      // เล่นแอนิเมชันใหม่ทุกครั้ง
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = '';
      return;
    }
    card.hidden = true;
    box.hidden = false;
    const sp = b.kind === 'say' ? SPEAKERS[b.who] ?? { face: '💬', cls: 'radio' } : null;
    box.className = 'cs-box ' + (sp ? 'say ' + sp.cls : 'narr');
    face.textContent = sp ? sp.face : '';
    face.hidden = !sp;
    name.textContent = b.kind === 'say' ? b.who : '';
    name.hidden = !sp;
    type(b.text);
  };
  const next = () => {
    if (closed) return;
    if (timer) {
      // กำลังพิมพ์: ขึ้นครบทันที
      stopTyping();
      shown = full.length;
      body.textContent = full;
      more.hidden = false;
      return;
    }
    i++;
    if (i >= beats.length) {
      close();
      return;
    }
    if (i > 0) sfx.tap();
    show();
  };
  el.addEventListener('click', next);
  el.tabIndex = 0;
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'Escape') close();
  });
  root.append(el);
  el.focus();
  next();
  return { done, skip: close };
}

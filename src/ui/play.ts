// หน้าเล่นด่าน: ฉาก 3D + ตัวแก้โค้ด 4 แบบ + เล่นรอยการทำงานทีละบรรทัด
import { Diag, VarView } from '../interp';
import { buildCode, initialState, isComplete, PuzzleState, runPuzzle, specFor, typedStarter, Verdict } from '../game/judge';
import { levelStars, loadProgress, saveProgress, setStars, starsFor } from '../game/progress';
import { Level, LessonBlock, Puzzle } from '../game/types';
import { WorldView } from '../view/worldView';
import { esc, h, hl, rich, sleep } from './dom';
import { sfx } from './sound';

const KIND_LABEL: Record<Puzzle['kind'], string> = {
  blank: 'เติมช่องว่าง',
  order: 'เรียงบรรทัด',
  fix: 'หาที่ผิด',
  type: 'พิมพ์โค้ดเอง',
};

const TYPED_NOTE: Record<Puzzle['kind'], string> = {
  blank: 'โหมดพิมพ์เอง: พิมพ์โค้ดแทน ___ ทุกจุด',
  order: 'โหมดพิมพ์เอง: ย้ายหรือพิมพ์บรรทัดใหม่ให้ลำดับถูก',
  fix: 'โหมดพิมพ์เอง: รันดู error แล้วแก้โค้ดเองโดยตรง',
  type: '',
};

const KEYS = [';', '(', ')', '{', '}', '=', '==', '"', "'", '<', '>', '+', '-', '*', '/', '%', '!', '&&', '||', ',', '_', '.'];

/** โค้ดที่พิมพ์ค้างไว้ของแต่ละข้อ (จำตลอดการเปิดเกมครั้งนี้) */
const drafts = new Map<string, PuzzleState>();

export interface PlayNav {
  toMap(): void;
  next(level: Level): void;
  hasNext(level: Level): boolean;
}

export class PlayScreen {
  el: HTMLElement;
  stage: HTMLElement;
  codeEl!: HTMLElement;
  bankEl!: HTMLElement;
  feedEl!: HTMLElement;
  missionEl!: HTMLElement;
  headEl!: HTMLElement;
  runBtn!: HTMLButtonElement;
  varsEl!: HTMLElement;
  serialEl!: HTMLElement;
  caseEl!: HTMLElement;
  modalEl!: HTMLElement;
  textarea: HTMLTextAreaElement | null = null;

  pi = 0;
  state!: PuzzleState;
  failedRuns = 0;
  hintsUsed = 0;
  playId = 0;
  playing = false;
  selSlot = 0;
  selLine: number | null = null;
  editing = true;
  errLine: number | null = null;
  curLine: number | null = null;
  ro: ResizeObserver;

  constructor(public root: HTMLElement, public view: WorldView, public level: Level, start: number, public nav: PlayNav) {
    this.stage = h('div', { class: 'stage' });
    this.el = this.build();
    root.replaceChildren(this.el);
    this.stage.prepend(view.renderer.domElement, view.flashEl);
    view.el = this.stage;
    this.ro = new ResizeObserver(() => view.resize());
    this.ro.observe(this.stage);
    view.start();
    this.loadPuzzle(Math.min(start, level.puzzles.length - 1));
    if (!loadProgress().seen[level.id]) this.showLesson(true);
  }

  get p(): Puzzle {
    return this.level.puzzles[this.pi];
  }

  /** โค้ดที่ค้างไว้แยกตามโหมด (แตะเลือก / พิมพ์เอง) */
  private draftKey(): string {
    return this.p.id + (loadProgress().typeMode && this.p.kind !== 'type' ? ':typed' : '');
  }

  destroy(): void {
    this.playId++;
    this.ro.disconnect();
    this.view.stop();
  }

  // ---------- โครงหน้าจอ ----------
  private build(): HTMLElement {
    this.varsEl = h('div', { class: 'ov-vars' });
    this.serialEl = h('div', { class: 'ov-serial' });
    this.caseEl = h('div', { class: 'ov-case' });
    this.stage.append(this.caseEl, this.varsEl, this.serialEl);
    this.headEl = h('div', { class: 'bar-title' });
    this.missionEl = h('div', { class: 'mission' });
    this.codeEl = h('div', { class: 'code' });
    this.feedEl = h('div', { class: 'feed', hidden: true });
    this.bankEl = h('div', { class: 'bank' });
    this.runBtn = h('button', { class: 'btn run', onclick: () => this.onRun() }, '▶ รัน');
    this.modalEl = h('div', { class: 'modal-wrap', hidden: true });
    const prog = loadProgress();
    const speedBtn = h('button', { class: 'btn ghost', title: 'ความเร็ว', onclick: () => {
      prog.fast = !prog.fast;
      saveProgress();
      speedBtn.textContent = prog.fast ? '⏩ เร็ว' : '▷ ปกติ';
    } }, prog.fast ? '⏩ เร็ว' : '▷ ปกติ');
    const typeBtn = h('button', { class: 'tog' + (prog.typeMode ? ' on' : ''), title: 'โหมดพิมพ์เอง', 'aria-pressed': String(prog.typeMode), onclick: () => {
      prog.typeMode = !prog.typeMode;
      saveProgress();
      typeBtn.classList.toggle('on', prog.typeMode);
      typeBtn.setAttribute('aria-pressed', String(prog.typeMode));
      const fails = this.failedRuns, hints = this.hintsUsed;
      this.loadPuzzle(this.pi);
      this.failedRuns = fails;
      this.hintsUsed = hints;
    } }, '⌨ พิมพ์เอง');
    const soundBtn = h('button', { class: 'icon', title: 'เสียง', onclick: () => {
      prog.sound = !prog.sound;
      saveProgress();
      soundBtn.textContent = prog.sound ? '🔊' : '🔇';
    } }, prog.sound ? '🔊' : '🔇');

    return h(
      'div',
      { class: 'play' },
      h(
        'header',
        { class: 'bar' },
        h('button', { class: 'icon', title: 'กลับแผนที่', onclick: () => this.nav.toMap() }, '‹'),
        this.headEl,
        typeBtn,
        h('button', { class: 'icon', title: 'บทเรียน', onclick: () => this.showLesson(false) }, '📖'),
        soundBtn,
      ),
      this.stage,
      h(
        'section',
        { class: 'panel' },
        this.missionEl,
        this.codeEl,
        this.feedEl,
        this.bankEl,
        h(
          'div',
          { class: 'actions' },
          h('button', { class: 'btn ghost', onclick: () => this.onHint() }, '💡 ใบ้'),
          h('button', { class: 'btn ghost', onclick: () => this.onReset() }, '↺ เริ่มใหม่'),
          speedBtn,
          this.runBtn,
        ),
      ),
      this.modalEl,
    );
  }

  // ---------- เปิดโจทย์ ----------
  loadPuzzle(i: number): void {
    this.playId++;
    this.playing = false;
    this.pi = i;
    const p = this.p;
    const typed = loadProgress().typeMode && p.kind !== 'type';
    this.state = drafts.get(this.draftKey()) ?? (typed ? { kind: 'type', text: typedStarter(p) } : initialState(p));
    this.failedRuns = 0;
    this.hintsUsed = 0;
    this.selSlot = 0;
    this.selLine = null;
    this.editing = true;
    this.errLine = null;
    this.curLine = null;
    const done = loadProgress().stars[p.id] ?? 0;
    this.headEl.innerHTML =
      `<b>${this.level.id}</b><span class="name">${esc(this.level.title)}</span>` +
      `<span class="dots">${this.level.puzzles
        .map((q, k) => `<i class="${k === i ? 'on' : (loadProgress().stars[q.id] ?? 0) > 0 ? 'done' : ''}"></i>`)
        .join('')}</span>`;
    this.missionEl.innerHTML =
      `<div class="mission-top"><span class="kind k-${typed ? 'type' : p.kind}">${typed ? 'พิมพ์โค้ดเอง' : KIND_LABEL[p.kind]}</span><b>${esc(p.title)}</b>` +
      (done ? `<span class="got">${'★'.repeat(done)}</span>` : '') +
      `</div><p>${rich(p.mission)}${typed ? '<br><i class="typed-note">' + TYPED_NOTE[p.kind] + '</i>' : ''}</p>`;
    this.hideFeed();
    this.view.load(specFor(this.level, p, p.cases?.[0]));
    this.setOverlays([], '', p.cases?.length ? `ทดสอบ ${p.cases.length} กรณี` : '');
    this.renderCode();
    this.renderBank();
    this.setRun(false);
  }

  private setRun(playing: boolean): void {
    this.playing = playing;
    this.runBtn.textContent = playing ? '■ หยุด' : '▶ รัน';
    this.runBtn.classList.toggle('stop', playing);
    this.el.classList.toggle('is-playing', playing);
  }

  // ---------- แสดงโค้ด ----------
  private lineEl(n: number, inner: string | Node[], cls = ''): HTMLElement {
    const el = h('div', { class: 'ln ' + cls, 'data-n': n });
    el.append(h('span', { class: 'no' }, String(n)));
    const tx = h('span', { class: 'tx' });
    if (typeof inner === 'string') tx.innerHTML = inner || '&nbsp;';
    else tx.append(...inner);
    el.append(tx);
    if (n === this.curLine) el.classList.add('cur');
    if (n === this.errLine) el.classList.add('err');
    return el;
  }

  renderCode(): void {
    const p = this.p;
    const s = this.state;
    this.codeEl.replaceChildren();
    this.textarea = null;
    this.codeEl.classList.toggle('editing', s.kind === 'type' && this.editing);

    if (p.kind === 'blank' && s.kind === 'blank') {
      p.code.split('\n').forEach((line, i) => {
        const parts: Node[] = [];
        const re = /\{\{(\d+)\}\}/g;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(line))) {
          if (m.index > last) parts.push(h('span', { html: hl(line.slice(last, m.index)) }));
          const k = Number(m[1]);
          const val = s.slots[k];
          parts.push(
            h(
              'button',
              {
                class: 'slot' + (val === null ? ' empty' : '') + (k === this.selSlot ? ' sel' : ''),
                onclick: () => {
                  if (this.playing) return;
                  this.selSlot = k;
                  sfx.tap();
                  this.renderCode();
                },
              },
              val ?? '?',
            ),
          );
          last = m.index + m[0].length;
        }
        if (last < line.length) parts.push(h('span', { html: hl(line.slice(last)) }));
        this.codeEl.append(this.lineEl(i + 1, parts));
      });
      return;
    }

    if (p.kind === 'order' && s.kind === 'order') {
      let n = 1;
      for (const line of p.head.split('\n')) this.codeEl.append(this.lineEl(n++, hl(line), 'fixed'));
      s.order.forEach((idx, pos) => {
        const el = this.lineEl(n++, hl(p.lines[idx]), 'move' + (this.selLine === pos ? ' sel' : ''));
        el.addEventListener('click', () => {
          if (this.playing) return;
          this.selLine = this.selLine === pos ? null : pos;
          sfx.tap();
          this.renderCode();
          this.renderBank();
        });
        this.codeEl.append(el);
      });
      for (const line of p.tail.split('\n')) this.codeEl.append(this.lineEl(n++, hl(line), 'fixed'));
      return;
    }

    if (p.kind === 'fix' && s.kind === 'fix') {
      buildCode(p, s)
        .split('\n')
        .forEach((line, i) => {
          const n = i + 1;
          const changed = (s.picks[n] ?? 0) !== 0;
          const el = this.lineEl(n, hl(line), 'pick' + (this.selLine === n ? ' sel' : '') + (changed ? ' changed' : ''));
          el.addEventListener('click', () => {
            if (this.playing) return;
            this.selLine = this.selLine === n ? null : n;
            sfx.tap();
            this.renderCode();
            this.renderBank();
          });
          this.codeEl.append(el);
        });
      return;
    }

    if (s.kind === 'type') {
      if (this.editing) {
        const ta = h('textarea', {
          class: 'editor',
          spellcheck: 'false',
          autocapitalize: 'off',
          autocomplete: 'off',
          autocorrect: 'off',
          'aria-label': 'พิมพ์โค้ด',
        }) as HTMLTextAreaElement;
        ta.value = s.text;
        ta.rows = Math.max(8, s.text.split('\n').length + 1);
        ta.addEventListener('input', () => {
          s.text = ta.value;
          drafts.set(this.draftKey(), s);
          ta.rows = Math.max(8, ta.value.split('\n').length + 1);
        });
        ta.addEventListener('keydown', (e) => this.onEditorKey(e, ta));
        ta.addEventListener('focus', () => this.el.classList.add('typing'));
        ta.addEventListener('blur', () => this.el.classList.remove('typing'));
        this.textarea = ta;
        this.codeEl.append(ta);
      } else {
        s.text.split('\n').forEach((line, i) => {
          const el = this.lineEl(i + 1, hl(line));
          el.addEventListener('click', () => this.edit());
          this.codeEl.append(el);
        });
      }
    }
  }

  private onEditorKey(e: KeyboardEvent, ta: HTMLTextAreaElement): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void this.onRun();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.insert('  ');
    } else if (e.key === 'Enter') {
      const before = ta.value.slice(0, ta.selectionStart);
      const line = before.slice(before.lastIndexOf('\n') + 1);
      let indent = /^\s*/.exec(line)![0];
      if (/\{\s*$/.test(line)) indent += '  ';
      e.preventDefault();
      this.insert('\n' + indent);
    } else if (e.key === '}') {
      const before = ta.value.slice(0, ta.selectionStart);
      const line = before.slice(before.lastIndexOf('\n') + 1);
      if (/^\s{2,}$/.test(line)) {
        e.preventDefault();
        ta.setRangeText('', ta.selectionStart - 2, ta.selectionStart, 'end');
        this.insert('}');
      }
    }
  }

  private insert(text: string): void {
    const ta = this.textarea;
    if (!ta) return;
    ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
    ta.dispatchEvent(new Event('input'));
  }

  private edit(): void {
    if (this.playing || this.state.kind !== 'type') return;
    this.editing = true;
    this.curLine = null;
    this.renderCode();
    this.renderBank();
    this.textarea?.focus();
  }

  // ---------- แถบชิ้นคำสั่ง / ตัวเลือก ----------
  renderBank(): void {
    const p = this.p;
    const s = this.state;
    this.bankEl.replaceChildren();
    this.bankEl.className = 'bank b-' + s.kind;

    if (p.kind === 'blank' && s.kind === 'blank') {
      for (const tok of p.bank) {
        this.bankEl.append(
          h('button', { class: 'chip', onclick: () => {
            if (this.playing) return;
            sfx.tap();
            s.slots[this.selSlot] = tok;
            drafts.set(p.id, s);
            const next = s.slots.findIndex((v) => v === null);
            if (next >= 0) this.selSlot = next;
            this.renderCode();
          } }, tok),
        );
      }
      return;
    }
    if (p.kind === 'order' && s.kind === 'order') {
      if (this.selLine === null) {
        this.bankEl.append(h('p', { class: 'tip' }, 'แตะบรรทัดที่มีแถบสีฟ้าเพื่อเลือก แล้วเลื่อนขึ้นหรือลง'));
        return;
      }
      const move = (d: number) => {
        const a = this.selLine!;
        const b = a + d;
        if (b < 0 || b >= s.order.length || this.playing) return;
        [s.order[a], s.order[b]] = [s.order[b], s.order[a]];
        this.selLine = b;
        drafts.set(p.id, s);
        sfx.tap();
        this.renderCode();
      };
      this.bankEl.append(
        h('button', { class: 'btn wide', onclick: () => move(-1) }, '▲ เลื่อนขึ้น'),
        h('button', { class: 'btn wide', onclick: () => move(1) }, '▼ เลื่อนลง'),
      );
      return;
    }
    if (p.kind === 'fix' && s.kind === 'fix') {
      if (this.selLine === null) {
        this.bankEl.append(h('p', { class: 'tip' }, 'กด "รัน" ดู error ก่อน แล้วแตะบรรทัดที่คิดว่าผิด'));
        return;
      }
      const f = p.fixes[this.selLine];
      if (!f) {
        this.bankEl.append(h('p', { class: 'tip' }, `บรรทัด ${this.selLine} ไม่มีอะไรให้แก้ ลองดูบรรทัดอื่น`));
        return;
      }
      this.bankEl.append(h('p', { class: 'tip' }, `เลือกบรรทัด ${this.selLine} แบบที่ถูก:`));
      const ln = this.selLine;
      f.options.forEach((opt, k) => {
        const cur = (s.picks[ln] ?? 0) === k;
        const b = h('button', { class: 'opt' + (cur ? ' on' : ''), onclick: () => {
          if (this.playing) return;
          s.picks[ln] = k;
          drafts.set(p.id, s);
          sfx.tap();
          this.errLine = null;
          this.renderCode();
          this.renderBank();
        } });
        b.innerHTML = opt === '' ? '<i>(บรรทัดว่าง)</i>' : hl(opt);
        this.bankEl.append(b);
      });
      return;
    }
    if (s.kind === 'type') {
      if (!this.editing) {
        this.bankEl.append(h('button', { class: 'btn wide', onclick: () => this.edit() }, '✎ แก้โค้ด'));
        return;
      }
      const row = h('div', { class: 'keys' });
      for (const k of KEYS) {
        const b = h('button', { class: 'key' }, k);
        // pointerdown + preventDefault: คีย์บอร์ดของมือถือไม่หุบ
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.insert(k);
        });
        row.append(b);
      }
      const tab = h('button', { class: 'key' }, '⇥');
      tab.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.insert('  ');
      });
      row.append(tab);
      this.bankEl.append(row);
    }
  }

  // ---------- ซ้อนบนฉาก ----------
  private setOverlays(vars: VarView[], serial: string, caseLabel?: string): void {
    this.varsEl.innerHTML = vars
      .slice(-6)
      .map((v) => `<span class="var"><i>${esc(v.type)}</i> ${esc(v.name)} = <b>${esc(v.text)}</b></span>`)
      .join('');
    const lines = serial.replace(/\n$/, '').split('\n').slice(-3);
    this.serialEl.innerHTML = serial ? `<label>Serial Monitor</label><pre>${esc(lines.join('\n'))}</pre>` : '';
    if (caseLabel !== undefined) {
      this.caseEl.textContent = caseLabel;
      this.caseEl.hidden = !caseLabel;
    }
  }

  // ---------- ข้อความตอบกลับ ----------
  private hideFeed(): void {
    this.feedEl.hidden = true;
    this.feedEl.replaceChildren();
    this.feedEl.parentElement?.classList.remove('has-feed');
  }
  private showFeed(kind: 'error' | 'fail' | 'hint' | 'info', title: string, bodyHtml: string): void {
    this.feedEl.hidden = false;
    this.feedEl.className = 'feed f-' + kind;
    this.feedEl.parentElement?.classList.add('has-feed');
    this.feedEl.replaceChildren(
      h('div', { class: 'feed-head' }, h('b', {}, title), h('button', { class: 'x', onclick: () => this.hideFeed(), 'aria-label': 'ปิด' }, '×')),
      h('div', { class: 'feed-body', html: bodyHtml }),
    );
    this.feedEl.scrollTop = 0;
  }
  private notesHtml(warnings: Diag[]): string {
    if (!warnings.length) return '';
    return (
      '<div class="notes"><b>ข้อสังเกต</b> (เครื่องจริงไม่เตือนเรื่องพวกนี้)' +
      warnings
        .slice(0, 3)
        .map((w) => `<p><span class="lnref">บรรทัด ${w.line}</span> ${esc(w.th)}</p>`)
        .join('') +
      '</div>'
    );
  }

  // ---------- ปุ่ม ----------
  private onHint(): void {
    const p = this.p;
    const k = Math.min(this.hintsUsed, p.hints.length - 1);
    this.hintsUsed++;
    sfx.tap();
    this.showFeed('hint', `คำใบ้ ${k + 1}/${p.hints.length}`, `<p>${rich(p.hints[k])}</p>`);
  }

  private onReset(): void {
    this.playId++;
    drafts.delete(this.draftKey());
    const fails = this.failedRuns, hints = this.hintsUsed;
    this.loadPuzzle(this.pi);
    this.failedRuns = fails;
    this.hintsUsed = hints;
  }

  private async onRun(): Promise<void> {
    if (this.playing) {
      // หยุด
      this.playId++;
      this.setRun(false);
      this.curLine = null;
      this.renderCode();
      return;
    }
    const p = this.p;
    if (!isComplete(p, this.state)) {
      this.showFeed('info', 'ยังเติมไม่ครบ', '<p>แตะช่อง <b>?</b> ในโค้ด แล้วแตะชิ้นคำสั่งด้านล่างเพื่อเติมให้ครบทุกช่องก่อน</p>');
      return;
    }
    this.textarea?.blur();
    const code = buildCode(p, this.state);
    const v = runPuzzle(this.level, p, code);
    this.hideFeed();
    this.errLine = null;
    this.selLine = null;
    if (this.state.kind === 'type') this.editing = false;

    if (v.status === 'compile' && v.compileError) {
      const e = v.compileError;
      this.failedRuns++;
      this.errLine = e.line;
      this.curLine = null;
      this.renderCode();
      this.renderBank();
      this.scrollTo(e.line);
      this.view.reset();
      this.view.setMood('error');
      sfx.bad();
      this.showFeed(
        'error',
        `บิตไม่เข้าใจ · บรรทัด ${e.line}`,
        `<pre class="en">error: ${esc(e.en ?? '')}</pre><p>${esc(e.th)}</p>`,
      );
      return;
    }
    await this.playback(v);
  }

  private scrollTo(line: number): void {
    const el = this.codeEl.querySelector(`[data-n="${line}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }

  private setCur(line: number | null): void {
    this.codeEl.querySelector('.ln.cur')?.classList.remove('cur');
    this.curLine = line;
    if (line === null) return;
    const el = this.codeEl.querySelector(`[data-n="${line}"]`);
    el?.classList.add('cur');
    el?.scrollIntoView({ block: 'nearest' });
  }

  private async playback(v: Verdict): Promise<void> {
    const id = ++this.playId;
    const run = v.shown;
    const p = this.p;
    this.setRun(true);
    this.renderCode();
    this.renderBank();
    this.view.load(run.spec);
    const many = v.cases.length > 1;
    this.setOverlays([], '', many ? `กรณี ${run.index + 1}/${v.cases.length}: ${run.label}` : '');
    const speed = () => (loadProgress().fast ? 0.3 : 1);
    await sleep(250);

    const trace = run.result.trace;
    const limit = trace.length > 140 ? 45 : trace.length;
    let serial = '';
    for (let i = 0; i < limit; i++) {
      if (id !== this.playId) return;
      const step = trace[i];
      this.setCur(step.line);
      sfx.step();
      for (const ev of step.events) {
        const d = this.view.apply(ev);
        if (d) await sleep(d * (ev.type === 'rush' ? 1 : speed()));
        if (id !== this.playId) return;
      }
      if (step.out) {
        serial += step.out;
        this.view.apply({ type: 'serial', text: serial.replace(/\n$/, '') });
      }
      this.setOverlays(step.vars, serial);
      await sleep((limit < trace.length ? 60 : 360) * speed() + Math.min(step.wait * 0.5, 900) * speed());
    }
    if (id !== this.playId) return;
    this.setRun(false);
    this.setCur(null);

    if (v.status === 'pass') {
      this.view.setMood('win');
      this.view.flash('green');
      sfx.win();
      const stars = starsFor(this.failedRuns, this.hintsUsed);
      setStars(p.id, stars);
      drafts.delete(this.draftKey());
      await sleep(900);
      if (id !== this.playId) return;
      this.showWin(stars, v);
      return;
    }
    // ไม่ผ่าน
    this.failedRuns++;
    sfx.bad();
    if (this.view.mood === 'idle') this.view.setMood('fail');
    const rt = run.result.runtimeError;
    if (rt) this.errLine = rt.line;
    this.renderCode();
    this.renderBank();
    const head = many ? `ยังไม่ผ่าน · กรณี "${run.label}"` : 'ยังไม่ผ่าน';
    const passed = v.cases.filter((c) => c.pass).length;
    const body =
      run.reasons.map((r) => `<p>${esc(r).replace(/\n/g, '<br>')}</p>`).join('') +
      (many ? `<p class="dim">ผ่าน ${passed} จาก ${v.cases.length} กรณี</p>` : '') +
      this.notesHtml(v.warnings);
    this.showFeed('fail', head, body);
  }

  // ---------- หน้าต่าง ----------
  private openModal(...children: (Node | null)[]): void {
    this.modalEl.hidden = false;
    this.modalEl.replaceChildren(h('div', { class: 'modal' }, ...children));
  }
  private closeModal(): void {
    this.modalEl.hidden = true;
    this.modalEl.replaceChildren();
  }

  private blockEl(b: LessonBlock): HTMLElement {
    if ('p' in b) return h('p', { html: rich(b.p) });
    if ('tip' in b) return h('p', { class: 'tipbox', html: '💡 ' + rich(b.tip) });
    if ('list' in b) {
      const ul = h('ul');
      for (const it of b.list) ul.append(h('li', { html: rich(it) }));
      return ul;
    }
    const pre = h('pre', { class: 'codebox' });
    pre.innerHTML = b.code.split('\n').map(hl).join('\n');
    return pre;
  }

  showLesson(first: boolean): void {
    const L = this.level;
    this.openModal(
      h('div', { class: 'lesson-art' }, h('span', {}, `องก์ ${L.act} · ด่าน ${L.id}`), h('h2', {}, L.title)),
      h('p', { class: 'story' }, L.story),
      h('div', { class: 'lesson' }, h('h3', {}, L.lesson.title), h('small', {}, `ตรงกับบทเรียน ${L.ref}`), ...L.lesson.blocks.map((b) => this.blockEl(b))),
      h('button', { class: 'btn run big', onclick: () => {
        loadProgress().seen[L.id] = true;
        saveProgress();
        this.closeModal();
      } }, first ? 'เริ่มภารกิจ ▶' : 'กลับไปที่โจทย์'),
    );
    this.modalEl.querySelector('.modal')!.scrollTop = 0;
  }

  private showWin(stars: number, v: Verdict): void {
    const p = this.p;
    const last = this.pi === this.level.puzzles.length - 1;
    const starEl = h('div', { class: 'stars' });
    for (let i = 0; i < 3; i++) starEl.append(h('span', { class: i < stars ? 'on' : '', style: `animation-delay:${i * 0.18}s` }, '★'));
    const note =
      stars === 3 ? 'ผ่านตั้งแต่ครั้งแรก ไม่ใช้คำใบ้' : stars === 2 ? 'ผ่านแล้ว ลองอีกครั้งโดยไม่พลาดเพื่อเก็บ 3 ดาว' : 'ผ่านแล้ว! พลาดระหว่างทางคือการเรียนรู้';
    const many = v.cases.length > 1 ? `ผ่านครบทั้ง ${v.cases.length} กรณีทดสอบ` : '';
    this.openModal(
      h('h2', { class: 'win-title' }, p.win ?? 'ผ่าน!'),
      starEl,
      h('p', { class: 'dim center' }, note),
      many ? h('p', { class: 'dim center' }, many) : null,
      h('pre', { class: 'codebox small', html: v.code.split('\n').map(hl).join('\n') }),
      h(
        'div',
        { class: 'row' },
        h('button', { class: 'btn ghost', onclick: () => {
          this.closeModal();
          this.loadPuzzle(this.pi);
        } }, 'เล่นข้อนี้อีกครั้ง'),
        h('button', { class: 'btn run', onclick: () => {
          this.closeModal();
          if (last) this.showLevelDone();
          else this.loadPuzzle(this.pi + 1);
        } }, last ? 'จบด่าน ▶' : 'ข้อต่อไป ▶'),
      ),
    );
  }

  private showLevelDone(): void {
    const L = this.level;
    const stars = levelStars(L);
    const starEl = h('div', { class: 'stars' });
    for (let i = 0; i < 3; i++) starEl.append(h('span', { class: i < stars ? 'on' : '' }, '★'));
    const hasNext = this.nav.hasNext(L);
    this.openModal(
      h('div', { class: 'lesson-art' }, h('span', {}, `จบด่าน ${L.id}`), h('h2', {}, L.title)),
      starEl,
      L.outro ? h('p', { class: 'story' }, L.outro) : null,
      h('p', { class: 'dim center' }, `เรื่องที่ได้ฝึก: ${L.concept}`),
      h(
        'div',
        { class: 'row' },
        h('button', { class: 'btn ghost', onclick: () => this.nav.toMap() }, 'แผนที่ด่าน'),
        hasNext
          ? h('button', { class: 'btn run', onclick: () => this.nav.next(L) }, 'ด่านต่อไป ▶')
          : h('button', { class: 'btn run', onclick: () => this.nav.toMap() }, 'จบองก์ 1 ▶'),
      ),
    );
  }
}

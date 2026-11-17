// หน้าแรก แผนที่ด่าน และการสลับหน้า
import { ACTS, LEVELS } from '../game/levels';
import { isUnlocked, levelStars, loadProgress, puzzlesDone, resetProgress } from '../game/progress';
import { Level, WorldSpec } from '../game/types';
import { WorldView } from '../view/worldView';
import { h } from './dom';
import { PlayNav, PlayScreen } from './play';
import { sfx } from './sound';

/** ฉากโชว์หลังหน้าแรก */
const TITLE_SPEC: WorldSpec = {
  map: ['  AAA  ', ' .....  ', '###D###', '#L...L#', '#.....#', '#..B..#', '#.....#', '#######'],
  dir: 'S',
  aliens: 3,
  hero: true,
};

/** บรรทัดโค้ดที่พิมพ์วนบนหน้าปก (ทุกบรรทัดมาจากด่านจริง) */
const COVER_CODE = [
  'forward();',
  'if (scanAliens() == 0) openDoor();',
  'for (int i = 0; i < 3; i++) fire();',
  'while (readDistance() > 8) creep();',
  'Serial.println("กลับบ้านกัน");',
];

/** ฉากหลังของหน้าจอจบเกม: ห้องบนยานที่ไฟกลับมาติด */
const END_SPEC: WorldSpec = {
  map: ['#######', '#L.W.L#', '#.....#', '#..B..#', '#.....#', '#######'],
  dir: 'S',
  pins: { 13: 'lamp' },
};

export class App {
  view: WorldView | null = null;
  play: PlayScreen | null = null;
  holder = h('div', { class: 'view-holder' });

  constructor(public root: HTMLElement) {
    document.body.append(this.holder);
    window.addEventListener('resize', () => this.view?.resize());
    const m = /^#\/play\/([\w-]+)/.exec(location.hash);
    const lv = m ? LEVELS.find((l) => l.id === m[1]) : undefined;
    if (lv) this.openLevel(lv);
    else if (location.hash === '#/map') this.showMap();
    else if (location.hash === '#/end') this.showEnding();
    else this.showTitle();
  }

  private leavePlay(): void {
    this.play?.destroy();
    this.play = null;
    if (this.view) {
      this.view.stop();
      this.holder.append(this.view.renderer.domElement, this.view.flashEl);
      this.view.el = this.holder;
    }
  }

  private nextLevelToPlay(): Level {
    for (let i = 0; i < LEVELS.length; i++) if (levelStars(LEVELS[i]) === 0) return LEVELS[i];
    return LEVELS[0];
  }

  showTitle(): void {
    this.leavePlay();
    history.replaceState(null, '', '#/');
    const started = Object.keys(loadProgress().stars).length > 0;
    const total = LEVELS.reduce((s, l) => s + levelStars(l), 0);
    const art = h('div', { class: 'title-art' });
    const typed = h('span', {});
    const codeLine = h('div', { class: 'cover-code' }, h('i', {}, '>'), typed, h('em', {}));
    // พิมพ์โค้ดทีละตัว ค้างไว้ ลบ แล้วขึ้นบรรทัดถัดไป
    let line = 0, pos = 0, hold = 0;
    const timer = window.setInterval(() => {
      if (!codeLine.isConnected) {
        window.clearInterval(timer);
        return;
      }
      const text = COVER_CODE[line];
      if (pos < text.length) pos++;
      else if (++hold > 26) {
        hold = 0;
        pos = 0;
        line = (line + 1) % COVER_CODE.length;
      }
      typed.textContent = COVER_CODE[line].slice(0, pos);
    }, 70);
    this.root.replaceChildren(
      h(
        'div',
        { class: 'title-screen cover' },
        art,
        h('div', { class: 'cover-fx' }),
        h(
          'div',
          { class: 'title-box' },
          h('div', { class: 'eyebrow' }, 'เกมฝึกเขียนโปรแกรม Arduino ตั้งแต่ศูนย์'),
          h('h1', {}, h('span', {}, 'โค้ดกู้ยาน'), h('b', {}, 'อรุณ-7')),
          codeLine,
          h('p', { class: 'lead' }, 'ชาวเคลธบุกขึ้นยาน เหลือแค่คุณกับหุ่นตัวเล็กชื่อบิต ทุกอย่างบนยานขยับได้ด้วยโค้ดที่คุณเขียนเองเท่านั้น'),
          h('div', { class: 'cover-chips' }, h('span', {}, '7 องก์'), h('span', {}, `${LEVELS.length} ด่าน`), h('span', {}, 'เขียนโค้ดจริงทุกด่าน')),
          h('button', { class: 'btn run big cover-start', onclick: () => {
            sfx.tap();
            this.openLevel(this.nextLevelToPlay());
          } }, started ? 'เล่นต่อ ▶' : 'เริ่มภารกิจ ▶'),
          h(
            'div',
            { class: 'row' },
            h('button', { class: 'btn ghost wide', onclick: () => this.showMap() }, 'แผนที่ด่าน'),
            LEVELS.every((l) => levelStars(l) > 0) ? h('button', { class: 'btn ghost wide', onclick: () => this.showEnding() }, 'ดูตอนจบ') : null,
          ),
          started ? h('p', { class: 'dim center' }, `★ ${total} / ${LEVELS.length * 3}`) : null,
        ),
      ),
    );
    // พื้นหลัง: ฉาก 3D จริงของเกม — ถ้ามีไฟล์ public/art/title.jpg จะใช้ภาพนั้นแทน
    try {
      this.view ??= new WorldView(this.holder);
      const view = this.view;
      art.append(view.renderer.domElement);
      view.el = art;
      view.load(TITLE_SPEC);
      view.resize();
      view.start();
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth < 600 || !art.isConnected) return;
        view.stop();
        this.holder.append(view.renderer.domElement);
        view.el = this.holder;
        art.style.backgroundImage = `url(${img.src})`;
      };
      img.src = 'art/title.jpg';
    } catch {
      // เครื่องไม่รองรับ WebGL: ใช้พื้นหลังไล่สี
    }
  }

  /** หน้าจอจบเกม: สรุปดาว สิ่งที่เรียนมาทั้ง 7 องก์ และก้าวต่อไป (รถจริง) */
  showEnding(): void {
    this.leavePlay();
    history.replaceState(null, '', '#/end');
    const total = LEVELS.reduce((s, l) => s + levelStars(l), 0);
    const max = LEVELS.length * 3;
    const done = LEVELS.filter((l) => levelStars(l) > 0).length;
    const all = done === LEVELS.length;
    const retry = LEVELS.find((l) => levelStars(l) < 3);
    const art = h('div', { class: 'title-art' });
    const acts = h('ol', { class: 'end-acts' });
    for (const act of ACTS) {
      const levels = LEVELS.filter((l) => l.act === act.n);
      const got = levels.reduce((s, l) => s + levelStars(l), 0);
      acts.append(h('li', {}, h('b', {}, act.title), h('small', {}, act.teaches), h('span', { class: 'end-stars' }, `★ ${got}/${levels.length * 3}`)));
    }
    this.root.replaceChildren(
      h(
        'div',
        { class: 'title-screen end-screen' },
        art,
        h(
          'div',
          { class: 'title-box' },
          h('div', { class: 'eyebrow' }, all ? 'ภารกิจสำเร็จ' : `ผ่านแล้ว ${done} จาก ${LEVELS.length} ด่าน`),
          h('h1', {}, h('span', {}, all ? 'อรุณ-7' : 'ยังไม่จบ'), h('b', {}, all ? 'ปลอดภัย' : 'สู้ต่อ')),
          h(
            'p',
            { class: 'lead' },
            all
              ? 'ประตูมิติปิดแล้ว ยานกลับมาเป็นของลูกเรือ และทุกบรรทัดที่พาบิตมาถึงตรงนี้ คุณเขียนเองทั้งหมด'
              : 'ยังมีด่านที่ไม่ผ่าน กลับไปที่แผนที่ด่านเพื่อเล่นต่อ',
          ),
          h('p', { class: 'end-total' }, `ดาวที่เก็บได้ ${total} / ${max}`),
          h('p', { class: 'dim' }, 'สิ่งที่เขียนเป็นแล้ว'),
          acts,
          all
            ? h('p', { class: 'end-next' }, 'ก้าวต่อไป: เอาโค้ดขององก์ 5–6 ไปลองกับรถจริงในบทเรียน R03–R10 ชื่อฟังก์ชันเหมือนกัน ต่างกันแค่ตัวเลขเวลาเลี้ยวที่ต้องหาเองจากรถของเรา')
            : null,
          retry && all
            ? h('button', { class: 'btn run big', onclick: () => {
                sfx.tap();
                this.openLevel(retry);
              } }, `เก็บ 3 ดาวให้ครบ: ด่าน ${retry.id} ▶`)
            : null,
          h('button', { class: 'btn ghost big', onclick: () => this.showMap() }, 'แผนที่ด่าน'),
        ),
      ),
    );
    try {
      this.view ??= new WorldView(this.holder);
      const view = this.view;
      art.append(view.renderer.domElement);
      view.el = art;
      view.load(END_SPEC);
      view.resize();
      view.start();
      if (all) {
        view.apply({ type: 'lamp', pin: 13, on: true });
        view.setMood('win');
      }
    } catch {
      // เครื่องไม่รองรับ WebGL
    }
    if (all) sfx.finale();
  }

  showMap(): void {
    this.leavePlay();
    history.replaceState(null, '', '#/map');
    const list = h('div', { class: 'acts' });
    for (const act of ACTS) {
      const levels = LEVELS.filter((l) => l.act === act.n);
      const built = levels.length > 0;
      const box = h(
        'section',
        { class: 'act' + (built ? '' : ' locked') },
        h(
          'div',
          { class: 'act-head' },
          h('span', { class: 'act-n' }, `องก์ ${act.n}`),
          h('h2', {}, act.title),
          h('p', {}, act.blurb),
          h('p', { class: 'teaches' }, act.teaches),
        ),
      );
      const grid = h('div', { class: 'levels' });
      levels.forEach((lv) => {
        const idx = LEVELS.indexOf(lv);
        const open = isUnlocked(LEVELS, idx);
        const stars = levelStars(lv);
        const done = puzzlesDone(lv);
        grid.append(
          h(
            'button',
            {
              class: 'level' + (open ? '' : ' locked') + (stars ? ' done' : ''),
              disabled: !open,
              onclick: () => {
                sfx.tap();
                this.openLevel(lv);
              },
            },
            h('span', { class: 'lv-id' }, open ? lv.id : '🔒'),
            h('span', { class: 'lv-body' }, h('b', {}, lv.title), h('small', {}, lv.concept)),
            h(
              'span',
              { class: 'lv-stars' },
              stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : open ? `${done}/${lv.puzzles.length}` : '',
            ),
          ),
        );
      });
      for (const name of act.planned) {
        grid.append(
          h(
            'div',
            { class: 'level locked planned' },
            h('span', { class: 'lv-id' }, '🔒'),
            h('span', { class: 'lv-body' }, h('b', {}, name), h('small', {}, 'กำลังสร้าง')),
          ),
        );
      }
      box.append(grid);
      list.append(box);
    }
    this.root.replaceChildren(
      h(
        'div',
        { class: 'map-screen' },
        h(
          'header',
          { class: 'bar' },
          h('button', { class: 'icon', onclick: () => this.showTitle(), title: 'หน้าแรก' }, '‹'),
          h('div', { class: 'bar-title' }, h('b', {}, 'แผนที่ด่าน')),
          h('button', { class: 'icon', title: 'ล้างความคืบหน้า', onclick: () => {
            if (confirm('ล้างดาวและความคืบหน้าทั้งหมด?')) {
              resetProgress();
              this.showMap();
            }
          } }, '🗑'),
        ),
        list,
      ),
    );
  }

  openLevel(level: Level): void {
    this.leavePlay();
    history.replaceState(null, '', '#/play/' + level.id);
    this.view ??= new WorldView(this.holder);
    const nav: PlayNav = {
      toMap: () => this.showMap(),
      hasNext: (l) => LEVELS.indexOf(l) < LEVELS.length - 1,
      next: (l) => this.openLevel(LEVELS[LEVELS.indexOf(l) + 1]),
      toEnd: () => this.showEnding(),
    };
    const prog = loadProgress();
    const first = level.puzzles.findIndex((p) => !(prog.stars[p.id] > 0));
    this.play = new PlayScreen(this.root, this.view, level, first < 0 ? 0 : first, nav);
  }
}

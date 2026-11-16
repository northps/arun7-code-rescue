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
  map: ['  .G.  ', ' .AAA. ', '###D###', '#L...L#', '#.....#', '#..B..#', '#######'],
  dir: 'N',
  aliens: 3,
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
    this.root.replaceChildren(
      h(
        'div',
        { class: 'title-screen' },
        art,
        h(
          'div',
          { class: 'title-box' },
          h('div', { class: 'eyebrow' }, 'เกมฝึกเขียนโปรแกรม Arduino ตั้งแต่ศูนย์'),
          h('h1', {}, h('span', {}, 'โค้ดกู้ยาน'), h('b', {}, 'อรุณ-7')),
          h(
            'p',
            { class: 'lead' },
            'ชาวเคลธบุกขึ้นยาน ระบบอัตโนมัติถูกปิดทั้งลำ อุปกรณ์ทุกชิ้นทำงานได้ด้วยโปรแกรมที่คุณเขียนเท่านั้น',
          ),
          h('button', { class: 'btn run big', onclick: () => {
            sfx.tap();
            this.openLevel(this.nextLevelToPlay());
          } }, started ? 'เล่นต่อ ▶' : 'เริ่มเล่น ▶'),
          h('button', { class: 'btn ghost big', onclick: () => this.showMap() }, 'แผนที่ด่าน'),
          started ? h('p', { class: 'dim center' }, `ดาวที่เก็บได้ ${total} / ${LEVELS.length * 3}`) : null,
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
    };
    const prog = loadProgress();
    const first = level.puzzles.findIndex((p) => !(prog.stars[p.id] > 0));
    this.play = new PlayScreen(this.root, this.view, level, first < 0 ? 0 : first, nav);
  }
}

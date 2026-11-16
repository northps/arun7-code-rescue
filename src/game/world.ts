// โลกจำลองเชิงตรรกะ: รับคำสั่งจากตัวแปลภาษา เปลี่ยนสถานะ และส่งเหตุการณ์ให้ฉาก 3D
import { Host, HostCtx, HostFn, HostValue } from '../interp';
import { ApiName, Dir, Goal, WorldSpec } from './types';

const DX: Record<Dir, number> = { N: 0, E: 1, S: 0, W: -1 };
const DY: Record<Dir, number> = { N: -1, E: 0, S: 1, W: 0 };
const LEFT: Record<Dir, Dir> = { N: 'W', W: 'S', S: 'E', E: 'N' };
const RIGHT: Record<Dir, Dir> = { N: 'E', E: 'S', S: 'W', W: 'N' };

export interface Cell {
  x: number;
  y: number;
  ch: string;
}

export function parseMap(map: string[]): { w: number; h: number; cells: Cell[]; find(ch: string): Cell[] } {
  const h = map.length;
  const w = Math.max(...map.map((r) => r.length));
  const cells: Cell[] = [];
  map.forEach((row, y) => {
    for (let x = 0; x < w; x++) cells.push({ x, y, ch: row[x] ?? ' ' });
  });
  return { w, h, cells, find: (ch) => cells.filter((c) => c.ch === ch) };
}

export function sameValue(a: HostValue | undefined, b: HostValue): boolean {
  if (a === undefined) return false;
  const norm = (v: HostValue): HostValue => (typeof v === 'boolean' ? (v ? 1 : 0) : v);
  const x = norm(a), y = norm(b);
  if (typeof x === 'number' && typeof y === 'number') return Math.abs(x - y) < 0.001;
  return x === y;
}

export function showValue(v: HostValue): string {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
  return v.length === 1 ? `'${v}'` : `"${v}"`;
}

export class WorldSim implements Host {
  fns: Record<string, HostFn> = {};
  halted: string | null = null;
  inputs: number[];

  w: number;
  h: number;
  grid: string[][];
  bot: { x: number; y: number; dir: Dir };
  door: 'open' | 'closed' | 'locked' = 'closed';
  hasDoor: boolean;
  aliens: number;
  pinMode: Record<number, number> = {};
  pinVal: Record<number, number> = {};
  lastArgs: Record<string, HostValue[]> = {};
  bumped = false;
  caught = false;

  constructor(public spec: WorldSpec, public goal: Goal = {}) {
    const m = parseMap(spec.map);
    this.w = m.w;
    this.h = m.h;
    this.grid = spec.map.map((r) => r.padEnd(m.w, ' ').split(''));
    const b = m.find('B')[0] ?? { x: 0, y: 0 };
    this.bot = { x: b.x, y: b.y, dir: spec.dir ?? 'N' };
    this.hasDoor = m.find('D').length > 0;
    this.aliens = spec.aliens ?? spec.sensors?.scanAliens ?? 0;
    this.inputs = [...(spec.inputs ?? [])];

    for (const name of spec.api ?? []) this.fns[name] = { min: 0, max: 0 };
    for (const [name, a] of Object.entries(spec.actions ?? {})) this.fns[name] = { min: a.args, max: a.args };
    for (const name of Object.keys(spec.sensors ?? {})) {
      const v = spec.sensors![name];
      this.fns[name] = { min: 0, max: 0, ret: Number.isInteger(v) ? 'int' : 'float' };
    }
    this.fns.pinMode = { min: 2, max: 2 };
    this.fns.digitalWrite = { min: 2, max: 2 };
    this.fns.digitalRead = { min: 1, max: 1, ret: 'int' };
  }

  cell(x: number, y: number): string {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return ' ';
    return this.grid[y][x];
  }
  blocked(x: number, y: number): boolean {
    const c = this.cell(x, y);
    if (c === 'D') return this.door !== 'open';
    return c === '#' || c === ' ' || c === 'X' || c === 'T' || c === 'L' || c === 'G' || c === 'W' || c === 'A';
  }
  onPad(): boolean {
    return this.cell(this.bot.x, this.bot.y) === 'P';
  }

  private openDoor(ctx: HostCtx, how: string): void {
    if (!this.hasDoor || this.door === 'open') return;
    this.door = 'open';
    ctx.emit({ type: 'door', state: 'open', how });
    if (this.aliens > 0) {
      this.caught = true;
      this.halted = 'caught';
      ctx.emit({ type: 'rush', count: this.aliens });
    }
  }

  private move(ctx: HostCtx, sign: 1 | -1): void {
    const nx = this.bot.x + DX[this.bot.dir] * sign;
    const ny = this.bot.y + DY[this.bot.dir] * sign;
    if (this.blocked(nx, ny)) {
      this.bumped = true;
      this.halted = 'bump';
      ctx.emit({ type: 'bump', x: nx, y: ny });
      return;
    }
    this.bot.x = nx;
    this.bot.y = ny;
    ctx.emit({ type: 'move', x: nx, y: ny });
    if (this.onPad()) {
      ctx.emit({ type: 'pad', x: nx, y: ny });
      this.openDoor(ctx, 'pad');
    }
  }

  call(name: string, args: HostValue[], ctx: HostCtx): HostValue | void {
    switch (name as ApiName | string) {
      case 'forward':
        return this.move(ctx, 1);
      case 'backward':
        return this.move(ctx, -1);
      case 'turnLeft':
        this.bot.dir = LEFT[this.bot.dir];
        ctx.emit({ type: 'turn', dir: this.bot.dir });
        return;
      case 'turnRight':
        this.bot.dir = RIGHT[this.bot.dir];
        ctx.emit({ type: 'turn', dir: this.bot.dir });
        return;
      case 'openDoor':
        return this.openDoor(ctx, 'cmd');
      case 'closeDoor':
        if (this.door !== 'closed') {
          this.door = 'closed';
          ctx.emit({ type: 'door', state: 'closed' });
        }
        return;
      case 'lockDoor':
        this.door = 'locked';
        ctx.emit({ type: 'door', state: 'locked' });
        return;
      case 'pinMode':
        this.pinMode[Number(args[0])] = Number(args[1]);
        return;
      case 'digitalRead':
        return this.pinVal[Number(args[0])] ?? 0;
      case 'digitalWrite': {
        const pin = Number(args[0]);
        const on = Number(args[1]) !== 0 ? 1 : 0;
        const dev = this.spec.pins?.[pin];
        if (!dev) {
          const list = Object.keys(this.spec.pins ?? {}).join(', ');
          ctx.warn('noDevice', `ขา ${pin} ไม่ได้ต่อกับอุปกรณ์ใดในฉากนี้` + (list ? ` (อุปกรณ์ต่ออยู่ที่ขา ${list})` : ''));
          return;
        }
        const isOut = this.pinMode[pin] === 1;
        if (!isOut) {
          ctx.warn('noPinMode', `สั่ง digitalWrite ที่ขา ${pin} โดยยังไม่ได้ตั้ง pinMode(${pin}, OUTPUT); ไฟจึงออกมาอ่อนมากจนอุปกรณ์ไม่ทำงาน`);
        }
        this.pinVal[pin] = isOut ? on : 0;
        if (dev === 'lamp') ctx.emit({ type: 'lamp', pin, on: isOut && on === 1, dim: !isOut && on === 1 });
        if (dev === 'lock') {
          if (isOut && on) this.openDoor(ctx, 'pin');
          else if (isOut && !on && this.door === 'open') {
            this.door = 'closed';
            ctx.emit({ type: 'door', state: 'closed' });
          }
        }
        return;
      }
    }
    const action = this.spec.actions?.[name];
    if (action) {
      this.lastArgs[name] = args;
      const want = this.goal.set?.[name];
      const ok = want ? want.length === args.length && want.every((w, i) => sameValue(args[i], w)) : undefined;
      ctx.emit({ type: 'panel', name, label: action.label, text: args.map(showValue).join(', '), ok });
      if (ok === false) ctx.emit({ type: 'alarm' });
      if (ok && action.opensDoor) this.openDoor(ctx, 'panel');
      return;
    }
    if (this.spec.sensors && name in this.spec.sensors) {
      const v = this.spec.sensors[name];
      ctx.emit({ type: 'sense', name, value: v });
      return v;
    }
  }
}

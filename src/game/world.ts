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
  /** เป้ายิงตามตำแหน่ง (index 0 = ตำแหน่ง 1): 'k' เคลธ, 'h' ตัวประกัน, '' ว่าง */
  slots: string[] = [];
  wasted = 0;
  hostageHit = false;
  shield = 0;
  cells: Record<string, number> = {};
  badCell = false;
  clamps = 0;
  clampUnlocked = false;
  clampJam = false;
  engine = false;
  chuteTorn = false;

  constructor(public spec: WorldSpec, public goal: Goal = {}) {
    const m = parseMap(spec.map);
    this.w = m.w;
    this.h = m.h;
    this.grid = spec.map.map((r) => r.padEnd(m.w, ' ').split(''));
    const b = m.find('B')[0] ?? { x: 0, y: 0 };
    this.bot = { x: b.x, y: b.y, dir: spec.dir ?? 'N' };
    this.hasDoor = m.find('D').length > 0;
    this.aliens = spec.aliens ?? (typeof spec.sensors?.scanAliens === 'number' ? spec.sensors.scanAliens : 0);
    this.inputs = [...(spec.inputs ?? [])];

    const argc: Record<string, number> = { fireAt: 1, powerCell: 2 };
    for (const name of spec.api ?? []) this.fns[name] = { min: argc[name] ?? 0, max: argc[name] ?? 0 };
    // เป้ายิง
    const places = m.find('A').length;
    let left = spec.targets ?? 0;
    for (let i = 0; i < places; i++) {
      if (spec.hostage === i + 1) this.slots.push('h');
      else if (left > 0) {
        this.slots.push('k');
        left--;
      } else this.slots.push('');
    }
    this.shield = spec.shield ?? 0;
    this.clamps = spec.pod?.clamps ?? 0;
    if (spec.shield !== undefined) this.fns.readShield = { min: 0, max: 0, ret: 'int' };
    for (const [name, a] of Object.entries(spec.actions ?? {})) this.fns[name] = { min: a.args, max: a.args };
    for (const name of Object.keys(spec.sensors ?? {})) {
      const v = spec.sensors![name];
      this.fns[name] = { min: 0, max: 0, ret: typeof v === 'string' ? 'char' : Number.isInteger(v) ? 'int' : 'float' };
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
    return c === '#' || c === ' ' || c === 'X' || c === 'T' || c === 'L' || c === 'G' || c === 'W' || c === 'A' || c === 'U';
  }
  onPad(): boolean {
    return this.cell(this.bot.x, this.bot.y) === 'P';
  }

  targetsLeft(): number {
    return this.slots.filter((s) => s === 'k').length;
  }

  private shoot(ctx: HostCtx, index: number): void {
    const s = this.slots[index];
    if (s === 'h') {
      this.hostageHit = true;
      this.halted = 'hostage';
      ctx.emit({ type: 'fire', index, hostage: true });
      return;
    }
    if (s !== 'k') {
      this.wasted++;
      ctx.emit({ type: 'fire', index: index >= 0 && index < this.slots.length ? index : -1, miss: true });
      return;
    }
    if (this.shield > 0) {
      this.shield--;
      if (this.shield > 0) {
        ctx.emit({ type: 'fire', index, shield: this.shield });
        return;
      }
    }
    this.slots[index] = '';
    ctx.emit({ type: 'fire', index, kill: true });
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
      case 'fire':
        return this.shoot(ctx, this.slots.findIndex((s) => s === 'k'));
      case 'fireAt':
        return this.shoot(ctx, Math.trunc(Number(args[0])) - 1);
      case 'aimLeft':
      case 'aimRight':
      case 'standby':
        ctx.emit({ type: 'aim', dir: name });
        return;
      case 'readShield':
        ctx.emit({ type: 'sense', name, value: this.shield });
        return this.shield;
      case 'powerCell': {
        const r = Math.trunc(Number(args[0])), c = Math.trunc(Number(args[1]));
        const g = this.spec.grid;
        const ok = !!g && r >= 0 && c >= 0 && r < g.rows && c < g.cols;
        if (!ok) this.badCell = true;
        const key = r + ',' + c;
        this.cells[key] = (this.cells[key] ?? 0) + 1;
        ctx.emit({ type: 'cell', r, c, ok, again: this.cells[key] > 1 });
        return;
      }
      case 'unlockClamp':
        this.clampUnlocked = true;
        ctx.emit({ type: 'clamp', step: 'unlock', index: (this.spec.pod?.clamps ?? 0) - this.clamps });
        return;
      case 'releaseClamp':
        if (!this.clampUnlocked || this.clamps <= 0) {
          this.clampJam = true;
          this.halted = 'jam';
          ctx.emit({ type: 'clamp', step: 'jam', none: this.clamps <= 0 });
          return;
        }
        this.clampUnlocked = false;
        this.clamps--;
        ctx.emit({ type: 'clamp', step: 'release', index: (this.spec.pod?.clamps ?? 0) - this.clamps - 1, left: this.clamps });
        return;
      case 'engineOn':
      case 'engineOff':
        this.engine = name === 'engineOn';
        ctx.emit({ type: 'engine', on: this.engine });
        return;
      case 'openChute': {
        const h = this.spec.sensors?.readAltitude;
        const range = this.spec.pod?.chute;
        const ok = !(range && typeof h === 'number') || (h > range[0] && h < range[1]);
        if (!ok) this.chuteTorn = true;
        ctx.emit({ type: 'chute', ok, high: typeof h === 'number' && !!range && h >= range[1] });
        return;
      }
      case 'extendLegs':
        ctx.emit({ type: 'legs' });
        return;
      case 'beginDescent':
        ctx.emit({ type: 'descent' });
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

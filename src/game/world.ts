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
  feedPos: Record<string, number> = {};
  /** ชื่อเซนเซอร์ที่ถูกอ่านเกินจำนวนค่าที่มี */
  overFeed: string | null = null;
  vaultTries = 0;
  /** โหมดขับ: ตำแหน่งจริง (หน่วยช่อง) และมุมหัน (องศา ตามเข็มจากทิศเหนือ) */
  pose = { x: 0, y: 0, th: 0 };
  motor = { l: 0, r: 0 };
  crashed = false;
  flagsLeft = new Set<string>();
  senseCount = 0;
  vaultOpen = false;
  lockedOut = false;
  wallClock = false;
  /** เวลาของโลกเกม (ms) = ผลรวมของ delay */
  now = 0;
  serialIn?: Host['serialIn'];
  remotePos = 0;
  lastFed = 0;
  overheated = false;
  fell = false;
  history: Record<string, HostValue[][]> = {};
  alienCells: string[] = [];

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
    this.alienCells = m.find('A').map((c) => c.x + ',' + c.y);
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
      this.fns[name] = { min: 0, max: 0, ret: typeof v === 'string' ? (v.length === 1 ? 'char' : 'String') : Number.isInteger(v) ? 'int' : 'float' };
    }
    for (const [name, list] of Object.entries(spec.feeds ?? {})) {
      this.fns[name] = { min: 0, max: 0, ret: list.every((x) => Number.isInteger(x)) ? 'int' : 'float' };
    }
    if (spec.vault) this.fns.tryCode = { min: 1, max: 1, ret: 'int' };
    this.pose = { x: b.x, y: b.y, th: { N: 0, E: 90, S: 180, W: 270 }[this.bot.dir] };
    if (spec.watchdog) this.fns[spec.watchdog.name] = { min: 0, max: 0 };
    if (spec.remote) {
      const list = spec.remote;
      this.serialIn = {
        available: (now) => {
          let n = 0;
          for (let i = this.remotePos; i < list.length && list[i].t <= now; i++) n++;
          return n;
        },
        read: (now, ctx) => {
          const e = list[this.remotePos];
          if (!e || e.t > now) return -1;
          this.remotePos++;
          ctx.emit({ type: 'remote', c: e.c });
          return e.c.charCodeAt(0);
        },
      };
    }
    if (spec.drive) {
      this.wallClock = true;
      if (places > 0) this.fns.seeKleth = { min: 0, max: 0, ret: 'bool' };
      this.fns.atPad = { min: 0, max: 0, ret: 'bool' };
      this.fns.setMotor = { min: 2, max: 2 };
      this.fns.readDistance = { min: 0, max: 0, ret: 'int' };
      for (const f of m.find('F')) this.flagsLeft.add(f.x + ',' + f.y);
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
    if (c === 'A') return !!this.slots[this.alienCells.indexOf(x + ',' + y)];
    return c === '#' || c === ' ' || c === 'S' || c === 'X' || c === 'T' || c === 'L' || c === 'G' || c === 'W' || c === 'U';
  }
  onPad(): boolean {
    return this.cell(this.bot.x, this.bot.y) === 'P';
  }

  /** ระยะจริงจากหน้ารถถึงสิ่งกีดขวางตรงหน้า (ซม.) และจุดที่ลำคลื่นชน */
  frontDistance(): { cm: number; x: number; y: number; cell: string } {
    const rad = (this.pose.th * Math.PI) / 180;
    const sx = Math.sin(rad), sy = -Math.cos(rad);
    const cm = this.spec.drive?.cm ?? 80;
    const x0 = this.pose.x + sx * 0.3, y0 = this.pose.y + sy * 0.3;
    let d = 0;
    for (let i = 0; i < (400 / cm) * 200; i++) {
      d = i / 200;
      if (this.blocked(Math.round(x0 + sx * d), Math.round(y0 + sy * d))) break;
    }
    return { cm: Math.min(400, Math.round(d * cm)), x: x0 + sx * d, y: y0 + sy * d, cell: Math.round(x0 + sx * d) + ',' + Math.round(y0 + sy * d) };
  }

  /** โหมดขับ: ตำแหน่งในรายการเป้าของเคลธที่อยู่ตรงหน้า (-1 = ไม่มี) */
  aheadAlien(): number {
    const i = this.alienCells.indexOf(this.frontDistance().cell);
    return i >= 0 && this.slots[i] ? i : -1;
  }

  /** โหมดขับ: เดินเวลา ms ให้รถเคลื่อนที่ตามความเร็วล้อ */
  onDelay(ms: number, ctx: HostCtx): void {
    this.now += ms;
    this.driveFor(ms, ctx);
    const wd = this.spec.watchdog;
    if (wd && !this.halted && this.now - this.lastFed > wd.maxGap) {
      this.overheated = true;
      this.halted = 'overheat';
      ctx.emit({ type: 'overheat', label: wd.label, gap: this.now - this.lastFed });
    }
  }

  private driveFor(ms: number, ctx: HostCtx): void {
    if (!this.spec.drive || this.crashed) return;
    const { l, r } = this.motor;
    if (l === 0 && r === 0) return;
    const v = (l + r) / 2 / 150 / 500; // ช่องต่อ ms
    const w = ((l - r) / 300) * 0.3; // องศาต่อ ms
    let left = ms;
    while (left > 0 && !this.crashed) {
      const dt = Math.min(5, left);
      left -= dt;
      this.pose.th += w * dt;
      const rad = (this.pose.th * Math.PI) / 180;
      this.pose.x += Math.sin(rad) * v * dt;
      this.pose.y -= Math.cos(rad) * v * dt;
      const sg = v >= 0 ? 1 : -1;
      const fx = Math.round(this.pose.x + Math.sin(rad) * 0.3 * sg), fy = Math.round(this.pose.y - Math.cos(rad) * 0.3 * sg);
      if (v !== 0 && this.blocked(fx, fy)) {
        this.crashed = true;
        this.halted = 'crash';
      }
      if (this.cell(Math.round(this.pose.x), Math.round(this.pose.y)) === 'V') {
        this.fell = true;
        this.crashed = true;
        this.halted = 'fell';
      }
      const key = Math.round(this.pose.x) + ',' + Math.round(this.pose.y);
      if (this.flagsLeft.delete(key)) {
        const [gx, gy] = key.split(',').map(Number);
        ctx.emit({ type: 'flag', x: gx, y: gy, left: this.flagsLeft.size });
      }
    }
    this.pose.x = Math.round(this.pose.x * 1e6) / 1e6;
    this.pose.y = Math.round(this.pose.y * 1e6) / 1e6;
    this.pose.th = Math.round(this.pose.th * 1e6) / 1e6;
    this.bot.x = Math.round(this.pose.x);
    this.bot.y = Math.round(this.pose.y);
    ctx.emit({ type: 'drive', x: this.pose.x, y: this.pose.y, th: this.pose.th, ms: ms - left });
    if (this.fell) ctx.emit({ type: 'fall' });
    if (this.crashed && !this.fell) ctx.emit({ type: 'crash' });
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
        return this.shoot(ctx, this.spec.drive ? this.aheadAlien() : this.slots.findIndex((s) => s === 'k'));
      case 'seeKleth': {
        if (!this.spec.drive) break;
        const see = this.aheadAlien() >= 0;
        ctx.emit({ type: 'see', see });
        return see;
      }
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
      case 'setMotor': {
        const clamp = (v: HostValue) => Math.max(-255, Math.min(255, Math.trunc(Number(v))));
        if (Math.abs(Number(args[0])) > 255 || Math.abs(Number(args[1])) > 255) {
          ctx.warn('motorRange', 'ความเร็วของ setMotor ต้องอยู่ระหว่าง -255 ถึง 255 ค่าที่เกินถูกตัดเหลือ 255');
        }
        this.motor = { l: clamp(args[0]), r: clamp(args[1]) };
        ctx.emit({ type: 'motor', l: this.motor.l, r: this.motor.r });
        // หยุดสนิทบนจุดหมาย = ถึงแล้ว จบการรัน
        if (this.spec.drive && !this.spec.drive.stay && this.motor.l === 0 && this.motor.r === 0 && this.onPad() && !this.crashed) {
          this.halted = 'arrived';
          ctx.emit({ type: 'pad', x: this.bot.x, y: this.bot.y });
        }
        return;
      }
      case 'atPad':
        if (!this.spec.drive) break;
        return this.onPad();
      case 'readDistance': {
        if (!this.spec.drive) break;
        const f = this.frontDistance();
        const noise = this.spec.drive?.noise;
        const n = noise && noise.length ? noise[this.senseCount % noise.length] : 0;
        this.senseCount++;
        const value = Math.max(0, Math.min(400, f.cm + n));
        ctx.emit({ type: 'sense', name, value, beam: [f.x, f.y] });
        return value;
      }
      case 'tryCode': {
        const v = this.spec.vault!;
        const n = Math.trunc(Number(args[0]));
        if (this.vaultOpen) return 0;
        this.vaultTries++;
        const res = n === v.secret ? 0 : n > v.secret ? 1 : -1;
        const left = v.tries - this.vaultTries;
        ctx.emit({ type: 'vault', guess: n, res, left, tries: this.vaultTries });
        if (res === 0) {
          this.vaultOpen = true;
          this.openDoor(ctx, 'panel');
        } else if (left <= 0) {
          this.lockedOut = true;
          this.halted = 'lockout';
          ctx.emit({ type: 'alarm' });
        }
        return res;
      }
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
    if (this.spec.watchdog?.name === name) {
      this.lastFed = this.now;
      ctx.emit({ type: 'pump' });
      return;
    }
    const feed = this.spec.feeds?.[name];
    if (feed) {
      const i = this.feedPos[name] ?? 0;
      this.feedPos[name] = i + 1;
      if (i >= feed.length) this.overFeed = name;
      const v = feed[Math.min(i, feed.length - 1)] ?? 0;
      ctx.emit({ type: 'sense', name, value: v, nth: i + 1, over: i >= feed.length });
      return v;
    }
    const action = this.spec.actions?.[name];
    if (action) {
      this.lastArgs[name] = args;
      (this.history[name] ??= []).push(args);
      if (action.ends) this.halted = 'done';
      const want = this.goal.set?.[name];
      const ok = want ? want.length === args.length && want.every((w, i) => sameValue(args[i], w)) : undefined;
      ctx.emit({ type: 'panel', name, label: action.label, text: args.length ? args.map(showValue).join(', ') : 'ON', ok });
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

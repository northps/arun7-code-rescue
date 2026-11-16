// ฉาก 3D (three.js): สร้างห้องจากแผนที่ของด่าน และเล่นเหตุการณ์จากโลกจำลอง
// โมเดลทั้งหมดสร้างด้วยโค้ด ถ้ามีไฟล์ public/models/bit.glb | kleth.glb | pod.glb จะใช้ไฟล์นั้นแทน
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WorldEvent } from '../interp';
import { Dir, WorldSpec } from '../game/types';
import { parseMap } from '../game/world';

const C = {
  bg: 0x05070d,
  tile: 0x1d2940,
  tileAlt: 0x25334e,
  seam: 0x18c8e8,
  wall: 0x2c3e60,
  wallDark: 0x18233a,
  cyan: 0x35e0ff,
  red: 0xff3344,
  green: 0x3dff9a,
  amber: 0xffb020,
  white: 0xeef3f8,
  orange: 0xff8a1f,
  klethBody: 0x2b1040,
  klethGlow: 0xd04dff,
};

const ROT: Record<Dir, number> = { N: Math.PI, E: Math.PI / 2, S: 0, W: -Math.PI / 2 };

interface Tween {
  t: number;
  dur: number;
  fn: (k: number) => void;
  done?: () => void;
}

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

function std(color: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.4, ...o });
}
function glow(color: number, intensity = 2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
}

export class WorldView {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
  composer: EffectComposer | null = null;
  bloom: UnrealBloomPass | null = null;
  root = new THREE.Group();
  tweens: Tween[] = [];
  clock = new THREE.Clock();
  running = false;
  raf = 0;
  flashEl: HTMLDivElement;

  spec: WorldSpec | null = null;
  w = 1;
  h = 1;
  bot!: THREE.Group;
  botParts: { eyes: THREE.MeshStandardMaterial; wheels: THREE.Object3D[]; body: THREE.Object3D; antenna: THREE.MeshStandardMaterial } | null = null;
  doorL: THREE.Object3D | null = null;
  doorR: THREE.Object3D | null = null;
  doorStripe: THREE.MeshStandardMaterial | null = null;
  doorLight: THREE.PointLight | null = null;
  doorPos = new THREE.Vector3();
  pads: THREE.Mesh[] = [];
  lamps: { bulb: THREE.MeshStandardMaterial; light: THREE.PointLight }[] = [];
  aliens: THREE.Group[] = [];
  alienHome: THREE.Vector3[] = [];
  panel: { tex: THREE.CanvasTexture; ctx: CanvasRenderingContext2D; pos: THREE.Vector3 } | null = null;
  trims: THREE.MeshStandardMaterial[] = [];
  pod: THREE.Group | null = null;
  hemi = new THREE.HemisphereLight(0x8fb4ff, 0x0c1018, 0.75);
  key = new THREE.DirectionalLight(0xfff4e6, 2.6);
  alarm = new THREE.PointLight(C.red, 0, 14, 1.6);
  alert = true;
  mood: 'idle' | 'error' | 'win' | 'fail' = 'idle';
  moving = 0;
  target = new THREE.Vector3();
  camBase = new THREE.Vector3();
  particles: { m: THREE.Mesh; v: THREE.Vector3; life: number }[] = [];
  slowFrames = 0;
  models: Record<string, THREE.Object3D | null> = {};

  constructor(public el: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(this.renderer.domElement);
    this.flashEl = document.createElement('div');
    this.flashEl.className = 'view-flash';
    el.appendChild(this.flashEl);

    this.scene.background = new THREE.Color(C.bg);
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pm.dispose();

    this.scene.add(this.hemi);
    this.key.position.set(-4, 9, 5);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.bias = -0.0015;
    this.key.shadow.normalBias = 0.03;
    const sc = this.key.shadow.camera;
    sc.left = -7;
    sc.right = 7;
    sc.top = 7;
    sc.bottom = -7;
    sc.near = 1;
    sc.far = 30;
    this.scene.add(this.key, this.key.target);
    this.alarm.position.set(0, 2.2, 0);
    this.scene.add(this.alarm);
    this.scene.add(this.root);
    this.buildSpace();

    try {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.45, 1.5);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    } catch {
      this.composer = null;
    }
    this.loadOptionalModels();
    this.resize();
  }

  // ---------- โมเดลจากไฟล์ (ถ้ามี) ----------
  private loadOptionalModels(): void {
    const loader = new GLTFLoader();
    for (const name of ['bit', 'kleth', 'pod']) {
      const url = `models/${name}.glb`;
      fetch(url, { method: 'HEAD' })
        .then((r) => {
          const type = r.headers.get('content-type') ?? '';
          if (!r.ok || type.includes('text/html')) return;
          loader.load(url, (g) => {
            const obj = g.scene;
            obj.traverse((o) => {
              o.castShadow = true;
            });
            // ปรับขนาดให้สูงประมาณ 1 ช่อง
            const box = new THREE.Box3().setFromObject(obj);
            const size = box.getSize(new THREE.Vector3());
            const s = 0.95 / Math.max(size.y, 0.001);
            obj.scale.setScalar(s);
            obj.position.y = -box.min.y * s;
            this.models[name] = obj;
            if (this.spec) this.load(this.spec);
          });
        })
        .catch(() => undefined);
    }
  }

  // ---------- ฉากหลัง: ดาวและดาวเคราะห์ ----------
  private buildSpace(): void {
    const n = 900;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = 120 + Math.random() * 60;
      const s = Math.sqrt(1 - u * u);
      pos.set([r * s * Math.cos(a), r * u, r * s * Math.sin(a)], i * 3);
      const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.15, 0.5, 0.6 + Math.random() * 0.4);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.9, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.9 }));
    this.scene.add(stars);

    // ดาวเวฬา
    const cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 128;
    const cx = cv.getContext('2d')!;
    const grad = cx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#0d3b4f');
    grad.addColorStop(0.35, '#1f8a8a');
    grad.addColorStop(0.55, '#e0a35a');
    grad.addColorStop(0.75, '#2a6f7a');
    grad.addColorStop(1, '#0b2a3a');
    cx.fillStyle = grad;
    cx.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 220; i++) {
      cx.fillStyle = `rgba(${200 + Math.random() * 55},${180 + Math.random() * 60},${150 + Math.random() * 80},${Math.random() * 0.12})`;
      cx.fillRect(Math.random() * 256, Math.random() * 128, 20 + Math.random() * 60, 1 + Math.random() * 3);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const planet = new THREE.Mesh(new THREE.SphereGeometry(26, 48, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0, color: 0x55626e }));
    planet.position.set(40, -58, -50);
    planet.rotation.z = 0.4;
    this.scene.add(planet);
    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(27.2, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x4fd8ff, transparent: true, opacity: 0.05, side: THREE.BackSide }),
    );
    rim.position.copy(planet.position);
    this.scene.add(rim);
    const sun = new THREE.DirectionalLight(0xfff0d8, 0.5);
    sun.position.set(-30, 10, -30);
    this.scene.add(sun);
  }

  // ---------- สร้างห้อง ----------
  cellPos(x: number, y: number): THREE.Vector3 {
    return new THREE.Vector3(x - (this.w - 1) / 2, 0, y - (this.h - 1) / 2);
  }

  /** ล้าง tween ที่ค้าง โดยให้ตัวที่มีงานเก็บกวาด (เช่น ลบป้ายลอย) ได้ทำงานก่อน */
  private flushTweens(): void {
    const old = this.tweens;
    this.tweens = [];
    for (const t of old) t.done?.();
  }

  load(spec: WorldSpec): void {
    this.spec = spec;
    this.flushTweens();
    this.root.clear();
    this.pads = [];
    this.lamps = [];
    this.aliens = [];
    this.alienHome = [];
    this.trims = [];
    this.panel = null;
    this.pod = null;
    this.doorL = this.doorR = null;
    this.mood = 'idle';
    for (const p of this.particles) this.scene.remove(p.m);
    this.particles = [];

    const m = parseMap(spec.map);
    this.w = m.w;
    this.h = m.h;
    const tileGeo = new RoundedBoxGeometry(0.94, 0.12, 0.94, 2, 0.03);
    const tileA = std(C.tile, { metalness: 0.65, roughness: 0.38 });
    const tileB = std(C.tileAlt, { metalness: 0.65, roughness: 0.42 });
    const seam = glow(C.seam, 0.55);
    const wallMat = std(C.wall, { metalness: 0.55, roughness: 0.5 });
    const wallDark = std(C.wallDark, { metalness: 0.6, roughness: 0.45 });
    const trim = glow(C.red, 1.6);
    this.trims.push(trim);
    const lastRow = m.h - 1;

    for (const c of m.cells) {
      if (c.ch === ' ') continue;
      const p = this.cellPos(c.x, c.y);
      // พื้น
      const under = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 1), seam);
      under.position.set(p.x, -0.07, p.z);
      this.root.add(under);
      const tile = new THREE.Mesh(tileGeo, (c.x + c.y) % 2 ? tileA : tileB);
      tile.position.set(p.x, -0.03, p.z);
      tile.receiveShadow = true;
      this.root.add(tile);

      switch (c.ch) {
        case '#':
        case 'W': {
          const low = c.y === lastRow;
          const hgt = low ? 0.28 : 1.25;
          const wall = new THREE.Mesh(new RoundedBoxGeometry(1, hgt, 1, 2, 0.04), wallMat);
          wall.position.set(p.x, hgt / 2 + 0.03, p.z);
          wall.castShadow = !low;
          wall.receiveShadow = true;
          this.root.add(wall);
          const strip = new THREE.Mesh(new THREE.BoxGeometry(1.01, 0.05, 1.01), trim);
          strip.position.set(p.x, hgt - 0.12, p.z);
          this.root.add(strip);
          if (!low) {
            const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 1.02), wallDark);
            plate.position.set(p.x, 0.5, p.z);
            this.root.add(plate);
          }
          break;
        }
        case 'D':
          this.buildDoor(p);
          break;
        case 'P': {
          const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 32), glow(C.green, 1.4));
          pad.position.set(p.x, 0.05, p.z);
          this.root.add(pad);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 8, 40), glow(C.green, 2.2));
          ring.rotation.x = Math.PI / 2;
          ring.position.set(p.x, 0.06, p.z);
          this.root.add(ring);
          this.pads.push(pad);
          break;
        }
        case 'T':
          this.buildPanel(p);
          break;
        case 'L':
          this.buildLamp(p);
          break;
        case 'X':
          this.buildCrate(p, c.x + c.y);
          break;
        case 'A':
          this.buildAlien(p);
          break;
        case 'G':
          this.buildPod(p);
          break;
      }
    }
    // บิต
    this.bot = this.buildBot();
    this.root.add(this.bot);

    this.alert = true;
    this.fitCamera();
    this.reset();
  }

  private buildDoor(p: THREE.Vector3): void {
    this.doorPos.copy(p);
    const frameMat = std(0x34435f, { metalness: 0.7, roughness: 0.35 });
    for (const sx of [-0.46, 0.46]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 1.02), frameMat);
      post.position.set(p.x + sx, 0.68, p.z);
      post.castShadow = true;
      this.root.add(post);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.14, 1.02), frameMat);
    lintel.position.set(p.x, 1.3, p.z);
    this.root.add(lintel);
    this.doorStripe = glow(C.red, 2.4);
    const panelMat = std(0x55657f, { metalness: 0.75, roughness: 0.3 });
    const mk = (sx: number): THREE.Group => {
      const g = new THREE.Group();
      const leaf = new THREE.Mesh(new RoundedBoxGeometry(0.42, 1.16, 0.14, 2, 0.02), panelMat);
      leaf.castShadow = true;
      g.add(leaf);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.16), this.doorStripe!);
      stripe.position.x = -sx * 0.15;
      g.add(stripe);
      const hazard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.155), std(C.amber, { metalness: 0.2, roughness: 0.6 }));
      hazard.position.set(sx * 0.03, -0.4, 0);
      g.add(hazard);
      g.position.set(p.x + sx * 0.21, 0.64, p.z);
      this.root.add(g);
      return g;
    };
    this.doorL = mk(-1);
    this.doorR = mk(1);
    this.doorLight = new THREE.PointLight(C.red, 2.5, 4, 1.8);
    this.doorLight.position.set(p.x, 1.1, p.z + 0.8);
    this.root.add(this.doorLight);
  }

  private buildPanel(p: THREE.Vector3): void {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.55, 12), std(0x33425c, { metalness: 0.7, roughness: 0.35 }));
    base.position.set(p.x, 0.3, p.z);
    base.castShadow = true;
    this.root.add(base);
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.56, 0.12, 2, 0.04), std(0x10151f, { metalness: 0.8, roughness: 0.25 }));
    body.position.set(p.x, 0.86, p.z);
    body.rotation.x = -0.32;
    body.castShadow = true;
    this.root.add(body);
    const cv = document.createElement('canvas');
    cv.width = 384;
    cv.height = 240;
    const ctx = cv.getContext('2d')!;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.48),
      new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.1, roughness: 0.3 }),
    );
    screen.position.set(p.x, 0.86, p.z);
    screen.rotation.x = -0.32;
    screen.translateZ(0.065);
    this.root.add(screen);
    this.panel = { tex, ctx, pos: new THREE.Vector3(p.x, 1.25, p.z) };
  }

  drawPanel(title: string, text: string, state: 'idle' | 'ok' | 'bad' | 'info' = 'idle'): void {
    if (!this.panel) return;
    const { ctx, tex } = this.panel;
    const col = { idle: '#35e0ff', ok: '#3dff9a', bad: '#ff4455', info: '#ffd166' }[state];
    ctx.fillStyle = '#04121c';
    ctx.fillRect(0, 0, 384, 240);
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 372, 228);
    ctx.fillStyle = col;
    ctx.font = '600 30px Sarabun, "Noto Sans Thai", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 192, 50);
    ctx.fillStyle = '#e8f6ff';
    const lines = text.split('\n').slice(-4);
    const big = lines.length === 1 && text.length <= 12;
    ctx.font = big ? '700 72px "IBM Plex Mono", Consolas, monospace' : '600 30px "IBM Plex Mono", Consolas, monospace';
    if (big) ctx.fillText(text, 192, 150);
    else {
      ctx.textAlign = 'left';
      lines.forEach((l, i) => ctx.fillText(l.slice(0, 20), 22, 96 + i * 36));
    }
    if (state === 'ok' || state === 'bad') {
      ctx.textAlign = 'center';
      ctx.font = '700 34px sans-serif';
      ctx.fillStyle = col;
      ctx.fillText(state === 'ok' ? '✓ ถูกต้อง' : '✗ ไม่ถูก', 192, 214);
    }
    tex.needsUpdate = true;
  }

  private buildLamp(p: THREE.Vector3): void {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.35, 8), std(0x3a4a66, { metalness: 0.8, roughness: 0.3 }));
    pole.position.set(p.x, 0.7, p.z);
    pole.castShadow = true;
    this.root.add(pole);
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.06, 12), std(0x2a3750));
    cage.position.set(p.x, 1.38, p.z);
    this.root.add(cage);
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0x222a33, emissive: 0xcfeaff, emissiveIntensity: 0, roughness: 0.3 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), bulbMat);
    bulb.position.set(p.x, 1.5, p.z);
    this.root.add(bulb);
    const light = new THREE.PointLight(0xcfeaff, 0, 9, 1.6);
    light.position.set(p.x, 1.5, p.z);
    this.root.add(light);
    this.lamps.push({ bulb: bulbMat, light });
  }

  private buildCrate(p: THREE.Vector3, seed: number): void {
    const s = 0.62 + (seed % 3) * 0.06;
    const crate = new THREE.Mesh(new RoundedBoxGeometry(s, s, s, 2, 0.04), std(0x3d4a3a, { metalness: 0.3, roughness: 0.7 }));
    crate.position.set(p.x, s / 2 + 0.03, p.z);
    crate.rotation.y = (seed % 4) * 0.2;
    crate.castShadow = true;
    crate.receiveShadow = true;
    this.root.add(crate);
    const band = new THREE.Mesh(new THREE.BoxGeometry(s + 0.02, 0.08, s + 0.02), std(C.amber, { metalness: 0.2, roughness: 0.5 }));
    band.position.copy(crate.position);
    band.rotation.y = crate.rotation.y;
    this.root.add(band);
    const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.24, 12), glow(C.cyan, 1.8));
    cell.position.set(p.x, s + 0.15, p.z);
    this.root.add(cell);
  }

  private buildAlien(p: THREE.Vector3): void {
    const g = new THREE.Group();
    if (this.models.kleth) {
      g.add(this.models.kleth.clone());
    } else {
      const skin = new THREE.MeshStandardMaterial({ color: C.klethBody, roughness: 0.25, metalness: 0.6, emissive: 0x3a0d55, emissiveIntensity: 0.5 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), skin);
      body.scale.set(1, 1.35, 0.95);
      body.position.y = 0.66;
      body.castShadow = true;
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), skin);
      head.scale.set(1.15, 0.8, 1.25);
      head.position.set(0, 1.02, 0.08);
      head.castShadow = true;
      g.add(head);
      const eyeMat = glow(C.klethGlow, 3.2);
      for (const [ex, ey] of [[-0.11, 1.05], [0.11, 1.05], [0, 0.96]]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), eyeMat);
        eye.position.set(ex, ey, 0.31);
        g.add(eye);
      }
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.015, 0.62, 8), skin);
        leg.position.set(Math.cos(a) * 0.27, 0.3, Math.sin(a) * 0.27);
        leg.rotation.z = Math.cos(a) * 0.55;
        leg.rotation.x = -Math.sin(a) * 0.55;
        leg.castShadow = true;
        g.add(leg);
      }
      for (let i = 0; i < 3; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.26, 6), glow(C.klethGlow, 1.2));
        spike.position.set(0, 0.95 - i * 0.2, -0.25 + i * 0.01);
        spike.rotation.x = -1.9;
        g.add(spike);
      }
    }
    g.position.copy(p);
    g.userData.phase = Math.random() * 6;
    this.root.add(g);
    this.aliens.push(g);
    this.alienHome.push(p.clone());
  }

  private buildPod(p: THREE.Vector3): void {
    const g = new THREE.Group();
    if (this.models.pod) {
      g.add(this.models.pod.clone());
    } else {
      const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.5, 8, 20), std(C.white, { metalness: 0.5, roughness: 0.3 }));
      hull.position.y = 0.72;
      hull.castShadow = true;
      g.add(hull);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.035, 8, 32), std(C.orange, { metalness: 0.3, roughness: 0.4 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.55;
      g.add(ring);
      const win = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({ color: 0x0a1a2a, emissive: C.cyan, emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.9 }));
      win.position.set(0, 0.92, 0.27);
      win.scale.z = 0.5;
      g.add(win);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.26), std(0x8fa0b8, { metalness: 0.6 }));
        fin.position.set(Math.cos(a) * 0.36, 0.26, Math.sin(a) * 0.36);
        fin.rotation.y = -a;
        g.add(fin);
      }
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glow(C.green, 3));
      beacon.position.y = 1.36;
      g.add(beacon);
    }
    g.position.copy(p);
    this.root.add(g);
    this.pod = g;
  }

  private buildBot(): THREE.Group {
    const g = new THREE.Group();
    const eyes = glow(C.cyan, 3);
    const antenna = glow(C.orange, 2.5);
    const wheels: THREE.Object3D[] = [];
    const bodyGroup = new THREE.Group();
    if (this.models.bit) {
      bodyGroup.add(this.models.bit.clone());
    } else {
      const shell = std(0xc3ccd8, { metalness: 0.25, roughness: 0.4 });
      const dark = std(0x1c2230, { metalness: 0.7, roughness: 0.3 });
      const accent = std(C.orange, { metalness: 0.3, roughness: 0.4 });
      const body = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.4, 0.46, 4, 0.1), shell);
      body.position.y = 0.38;
      body.castShadow = true;
      bodyGroup.add(body);
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.06, 0.47), accent);
      belt.position.y = 0.3;
      bodyGroup.add(belt);
      const chest = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), eyes);
      chest.position.set(0, 0.42, 0.232);
      bodyGroup.add(chest);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.08, 12), dark);
      neck.position.y = 0.61;
      bodyGroup.add(neck);
      const head = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.3, 0.4, 4, 0.11), shell);
      head.position.y = 0.79;
      head.castShadow = true;
      bodyGroup.add(head);
      const visor = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.17, 0.06, 3, 0.03), new THREE.MeshStandardMaterial({ color: 0x05080d, metalness: 0.9, roughness: 0.12 }));
      visor.position.set(0, 0.79, 0.185);
      bodyGroup.add(visor);
      for (const ex of [-0.09, 0.09]) {
        const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.045, 4, 8), eyes);
        eye.position.set(ex, 0.795, 0.218);
        bodyGroup.add(eye);
      }
      for (const ex of [-0.245, 0.245]) {
        const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), accent);
        ear.rotation.z = Math.PI / 2;
        ear.position.set(ex, 0.79, 0);
        bodyGroup.add(ear);
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.16, 4, 8), dark);
        arm.position.set(ex * 1.2, 0.38, 0.03);
        arm.rotation.x = -0.3;
        bodyGroup.add(arm);
      }
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), dark);
      stalk.position.set(0.1, 1.01, -0.05);
      bodyGroup.add(stalk);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), antenna);
      tip.position.set(0.1, 1.1, -0.05);
      bodyGroup.add(tip);
      for (const ex of [-0.28, 0.28]) {
        const wheel = new THREE.Group();
        const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.09, 20), dark);
        tyre.rotation.z = Math.PI / 2;
        tyre.castShadow = true;
        wheel.add(tyre);
        const hub = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.2, 0.05), accent);
        wheel.add(hub);
        wheel.position.set(ex, 0.17, 0);
        g.add(wheel);
        wheels.push(wheel);
      }
    }
    g.add(bodyGroup);
    const under = new THREE.PointLight(C.cyan, 0.5, 2.2, 2);
    under.position.set(0, 0.25, 0.3);
    g.add(under);
    this.botParts = { eyes, wheels, body: bodyGroup, antenna };
    return g;
  }

  // ---------- สถานะเริ่มต้น ----------
  reset(): void {
    if (!this.spec) return;
    this.flushTweens();
    this.moving = 0;
    const spec = this.spec;
    const m = parseMap(spec.map);
    const b = m.find('B')[0] ?? { x: 0, y: 0 };
    this.bot.position.copy(this.cellPos(b.x, b.y));
    this.bot.rotation.set(0, ROT[spec.dir ?? 'N'], 0);
    this.bot.scale.setScalar(1.2);
    this.setMood('idle');
    this.setDoor('closed', true);
    const count = spec.aliens ?? spec.sensors?.scanAliens ?? 0;
    this.aliens.forEach((a, i) => {
      a.visible = i < count;
      a.position.copy(this.alienHome[i]);
      a.rotation.set(0, 0, 0);
    });
    for (const l of this.lamps) {
      l.bulb.emissiveIntensity = 0;
      l.light.intensity = 0;
    }
    this.setDark(!!spec.dark);
    for (const p of this.pads) (p.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4;
    if (this.pod) this.pod.position.y = 0;
    const firstAction = Object.values(spec.actions ?? {})[0];
    this.drawPanel(firstAction ? firstAction.label : 'SERIAL', firstAction ? '- - -' : '', 'idle');
    this.flashEl.className = 'view-flash';
    this.alert = true;
  }

  private setDark(dark: boolean, animate = false): void {
    const hemi = dark ? 0.1 : 0.75;
    const key = dark ? 0.12 : 2.6;
    const env = dark ? 0.12 : 0.55;
    if (!animate) {
      this.hemi.intensity = hemi;
      this.key.intensity = key;
      this.scene.environmentIntensity = env;
      return;
    }
    const h0 = this.hemi.intensity, k0 = this.key.intensity, e0 = this.scene.environmentIntensity;
    this.tween(500, (k) => {
      this.hemi.intensity = h0 + (hemi - h0) * k;
      this.key.intensity = k0 + (key - k0) * k;
      this.scene.environmentIntensity = e0 + (env - e0) * k;
    });
  }

  private setDoor(state: 'open' | 'closed' | 'locked', instant = false): void {
    if (!this.doorL || !this.doorR) return;
    const col = state === 'open' ? C.green : state === 'locked' ? C.amber : C.red;
    this.doorStripe!.emissive.setHex(col);
    this.doorLight!.color.setHex(col);
    const open = state === 'open' ? 0.4 : 0;
    const l0 = this.doorL.position.x, r0 = this.doorR.position.x;
    const l1 = this.doorPos.x - 0.21 - open, r1 = this.doorPos.x + 0.21 + open;
    const sx0 = this.doorL.scale.x, sx1 = state === 'open' ? 0.25 : 1;
    const set = (k: number) => {
      this.doorL!.position.x = l0 + (l1 - l0) * k;
      this.doorR!.position.x = r0 + (r1 - r0) * k;
      const s = sx0 + (sx1 - sx0) * k;
      this.doorL!.scale.x = s;
      this.doorR!.scale.x = s;
    };
    if (instant) set(1);
    else this.tween(550, set);
  }

  setMood(m: 'idle' | 'error' | 'win' | 'fail'): void {
    this.mood = m;
    if (!this.botParts) return;
    const col = m === 'error' || m === 'fail' ? C.red : m === 'win' ? C.green : C.cyan;
    this.botParts.eyes.emissive.setHex(col);
    if (m === 'win') {
      this.alert = false;
      const y0 = this.bot.position.y;
      this.tween(700, (k) => {
        this.bot.position.y = y0 + Math.sin(k * Math.PI) * 0.35;
        this.bot.rotation.y += 0.22 * (1 - k);
      });
      this.burst(this.bot.position.clone().setY(0.9), C.green, 26);
    }
    if (m === 'error') {
      const r0 = this.bot.rotation.y;
      this.tween(600, (k) => {
        this.bot.rotation.y = r0 + Math.sin(k * Math.PI * 4) * 0.35 * (1 - k);
      });
      this.floatText('?', this.bot.position.clone().setY(1.45), '#ff5566');
    }
  }

  // ---------- เหตุการณ์ ----------
  /** เริ่มเล่นเหตุการณ์ คืนเวลาที่ใช้ (ms) */
  apply(ev: WorldEvent): number {
    switch (ev.type) {
      case 'move': {
        const from = this.bot.position.clone();
        const to = this.cellPos(ev.x as number, ev.y as number);
        this.moving++;
        this.tween(
          380,
          (k) => {
            this.bot.position.lerpVectors(from, to, ease(k));
          },
          () => this.moving--,
        );
        return 400;
      }
      case 'turn': {
        const r0 = this.bot.rotation.y;
        let d = ROT[ev.dir as Dir] - r0;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        this.tween(300, (k) => {
          this.bot.rotation.y = r0 + d * ease(k);
        });
        return 320;
      }
      case 'bump': {
        const from = this.bot.position.clone();
        const to = this.cellPos(ev.x as number, ev.y as number);
        const mid = from.clone().lerp(to, 0.32);
        this.tween(420, (k) => {
          const s = Math.sin(k * Math.PI);
          this.bot.position.lerpVectors(from, mid, s);
        });
        this.burst(mid.clone().setY(0.5), C.amber, 18);
        this.floatText('ชน!', from.clone().setY(1.45), '#ffb020');
        this.setMood('fail');
        this.flash('red');
        return 520;
      }
      case 'pad': {
        for (const p of this.pads) (p.material as THREE.MeshStandardMaterial).emissiveIntensity = 4;
        return 180;
      }
      case 'door':
        this.setDoor(ev.state as 'open' | 'closed' | 'locked');
        return 620;
      case 'lamp': {
        const on = !!ev.on, dim = !!ev.dim;
        const target = on ? 5 : dim ? 0.25 : 0;
        for (const l of this.lamps) {
          const b0 = l.bulb.emissiveIntensity, i0 = l.light.intensity;
          this.tween(260, (k) => {
            l.bulb.emissiveIntensity = b0 + (target - b0) * k;
            l.light.intensity = i0 + (on ? 14 : dim ? 0.4 : 0) * k - i0 * k;
          });
        }
        if (this.spec?.dark) this.setDark(!on, true);
        if (dim) this.floatText('ไฟอ่อนเกินไป', (this.lamps[0]?.light.position ?? this.bot.position).clone(), '#ffb020');
        return 420;
      }
      case 'panel': {
        const ok = ev.ok as boolean | undefined;
        this.drawPanel(String(ev.label), String(ev.text), ok === undefined ? 'info' : ok ? 'ok' : 'bad');
        if (this.panel) this.burst(this.panel.pos.clone(), ok === false ? C.red : C.cyan, 8);
        return 560;
      }
      case 'serial':
        this.drawPanel('SERIAL', String(ev.text), 'info');
        return 0;
      case 'alarm':
        this.flash('red');
        return 300;
      case 'sense':
        this.floatText(`${ev.name}() → ${ev.value}`, this.bot.position.clone().setY(1.5), '#7fe9ff');
        return 650;
      case 'input':
        this.floatText(`รับค่า ${ev.value}`, this.bot.position.clone().setY(1.5), '#ffd166');
        return 650;
      case 'rush': {
        const dest = this.bot.position.clone();
        this.aliens.forEach((a, i) => {
          if (!a.visible) return;
          const from = a.position.clone();
          const via = this.doorPos.clone();
          const to = dest.clone().add(new THREE.Vector3((i - 1) * 0.55, 0, -0.75));
          this.tween(1100, (k) => {
            const e = ease(k);
            if (e < 0.5) a.position.lerpVectors(from, via, e * 2);
            else a.position.lerpVectors(via, to, (e - 0.5) * 2);
          });
        });
        this.setMood('fail');
        this.flash('red');
        return 1300;
      }
      default:
        return 0;
    }
  }

  flash(kind: 'red' | 'green'): void {
    this.flashEl.className = 'view-flash';
    void this.flashEl.offsetWidth;
    this.flashEl.className = 'view-flash on ' + kind;
  }

  private burst(at: THREE.Vector3, color: number, n: number): void {
    const mat = new THREE.MeshBasicMaterial({ color });
    const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(at);
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 + 0.3, Math.random() - 0.5).multiplyScalar(3);
      this.scene.add(m);
      this.particles.push({ m, v, life: 0.7 + Math.random() * 0.4 });
    }
  }

  private floatText(text: string, at: THREE.Vector3, color: string): void {
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d')!;
    const font = '700 44px Sarabun, "IBM Plex Mono", sans-serif';
    ctx.font = font;
    const wpx = Math.ceil(ctx.measureText(text).width) + 40;
    cv.width = wpx;
    cv.height = 72;
    ctx.font = font;
    ctx.fillStyle = 'rgba(4,10,18,0.82)';
    ctx.beginPath();
    ctx.roundRect(0, 0, wpx, 72, 16);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, wpx / 2, 38);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sp = new THREE.Sprite(mat);
    const sc = 0.0062 * Math.max(1, this.camera.position.distanceTo(this.target) / 9);
    sp.scale.set(wpx * sc, 72 * sc, 1);
    sp.position.copy(at);
    sp.renderOrder = 10;
    this.scene.add(sp);
    const y0 = at.y;
    this.tween(
      1500,
      (k) => {
        sp.position.y = y0 + k * 0.5;
        mat.opacity = k < 0.75 ? 1 : 1 - (k - 0.75) * 4;
      },
      () => {
        this.scene.remove(sp);
        tex.dispose();
        mat.dispose();
      },
    );
  }

  tween(dur: number, fn: (k: number) => void, done?: () => void): void {
    this.tweens.push({ t: 0, dur, fn, done });
  }

  // ---------- กล้อง ----------
  fitCamera(): void {
    const rect = this.el.getBoundingClientRect();
    const aspect = Math.max(0.3, rect.width / Math.max(1, rect.height));
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.target.set(0, 0.35, 0.15);
    const el = (44 * Math.PI) / 180;
    const az = (-20 * Math.PI) / 180;
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const hw = this.w / 2 - 0.35, hh = this.h / 2 + 0.05;
    const corners: THREE.Vector3[] = [];
    for (const x of [-hw, hw]) for (const z of [-hh, hh]) for (const y of [0, 1.25]) corners.push(new THREE.Vector3(x, y, z));
    let dist = 6;
    for (; dist < 60; dist += 0.25) {
      this.camera.position.copy(this.target).addScaledVector(dir, dist);
      this.camera.lookAt(this.target);
      this.camera.updateMatrixWorld();
      const fits = corners.every((c) => {
        const v = c.clone().project(this.camera);
        return Math.abs(v.x) < 0.98 && v.y < 0.97 && v.y > -0.99;
      });
      if (fits) break;
    }
    this.camBase.copy(this.camera.position);
    this.key.target.position.set(0, 0, 0);
  }

  resize(): void {
    const rect = this.el.getBoundingClientRect();
    const w = Math.max(50, Math.floor(rect.width));
    const h = Math.max(50, Math.floor(rect.height));
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.bloom?.resolution.set(w / 2, h / 2);
    if (this.spec) this.fitCamera();
    else {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  // ---------- วนภาพ ----------
  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.getDelta();
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private frame(): void {
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    // tween
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t += dt * 1000;
      const k = Math.min(1, tw.t / tw.dur);
      tw.fn(k);
      if (k >= 1) {
        this.tweens.splice(i, 1);
        tw.done?.();
      }
    }
    // บิต: ลอยตัวเบา ๆ ล้อหมุน
    if (this.botParts) {
      this.botParts.body.position.y = Math.sin(t * 2.4) * 0.012;
      this.botParts.body.rotation.z = this.moving ? Math.sin(t * 14) * 0.03 : 0;
      if (this.moving) for (const w of this.botParts.wheels) w.rotation.x += dt * 9;
      this.botParts.antenna.emissiveIntensity = 1.6 + Math.sin(t * 5) * 1.2;
      const blink = (t % 3.7) > 3.58 ? 0.2 : 1;
      this.botParts.eyes.emissiveIntensity = 3 * blink;
    }
    // เคลธ
    for (const a of this.aliens) {
      if (!a.visible) continue;
      const ph = a.userData.phase as number;
      a.position.y = Math.abs(Math.sin(t * 1.7 + ph)) * 0.06;
      a.rotation.y = Math.sin(t * 0.8 + ph) * 0.35;
      a.scale.y = 1 + Math.sin(t * 2.2 + ph) * 0.03;
    }
    // แผ่นเหยียบและไฟเตือน
    for (const p of this.pads) p.scale.setScalar(1 + Math.sin(t * 3) * 0.05);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
    for (const m of this.trims) {
      if (this.alert) {
        m.emissive.setHex(C.red);
        m.emissiveIntensity = 0.5 + pulse * 1.5;
      } else {
        m.emissive.setHex(C.cyan);
        m.emissiveIntensity = 1.3;
      }
    }
    this.alarm.intensity = this.alert ? pulse * (this.spec?.dark ? 2 : 5) : 0;
    if (this.pod) this.pod.rotation.y = Math.sin(t * 0.5) * 0.1;
    // เศษประกาย
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.v.y -= 6 * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.rotation.x += dt * 8;
      if (p.life <= 0 || p.m.position.y < 0) {
        this.scene.remove(p.m);
        this.particles.splice(i, 1);
      }
    }
    // กล้องแกว่งเบา ๆ
    this.camera.position.copy(this.camBase);
    this.camera.position.x += Math.sin(t * 0.25) * 0.25;
    this.camera.position.y += Math.sin(t * 0.33) * 0.08;
    this.camera.lookAt(this.target);

    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);

    // เครื่องช้า: ปิด bloom และลดความละเอียด
    if (dt > 0.045) this.slowFrames++;
    else if (this.slowFrames > 0) this.slowFrames--;
    if (this.slowFrames > 90 && this.composer) {
      this.composer = null;
      this.renderer.setPixelRatio(1);
      this.resize();
    }
  }

  dispose(): void {
    this.stop();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.flashEl.remove();
  }
}

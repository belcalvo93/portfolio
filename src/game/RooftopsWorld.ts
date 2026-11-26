import * as THREE from 'three';
import type { Locale, SectionId } from '../types/content';
import { CityGround } from './CityGround';
import { WindowLights, buildingColors, windowColorMix } from './cityLife';
import { BACKGROUND_BLOCKS, GROUND_Y, ROOFTOP_BUILDINGS, fillerBlocks, type BlockSpec } from './cityLayout';
import { createFrustumGeometry, createGableRoofGeometry } from './geometry';
import { BRIDGES, CHIMNEYS, DORMERS, DORMER_SIZE, clampToWalkArea, railZOffset } from './walkArea';

export interface WindowSpot {
  sectionId: SectionId;
  label: { es: string; en: string };
  position: THREE.Vector3;
  sprite: THREE.Sprite;
  paneMat: THREE.MeshBasicMaterial;
}

/**
 * Escena "Tejados de París de noche" (ilustración nocturna):
 * - Techos de pizarra/zinc gris oscuro con textura CC0 1K, mansardas, buhardillas,
 *   chimeneas de ladrillo con remate y canaletas.
 * - Cielo nocturno azul-violeta con estrellas sutiles de distinto tamaño (sin luna)
 *   y siluetas lejanas con un campanario.
 * - 5 buhardillas iluminadas con luz cálida amarilla (una por sección).
 * - Modo claro: versión de tarde temprana / día suave.
 */
/**
 * Color del cielo en el horizonte. La neblina usa el mismo color, así lo lejano
 * (calles, edificios) se funde con el cielo y no se nota dónde termina la ciudad.
 */
export const SKY_HORIZON = { dark: 0x342d5e, light: 0xf4cbc9 } as const;

/** Alto de la cápsula del letrero en píxeles del canvas. */
const LABEL_PILL_PX = 116;
/** Alto total del letrero en la escena (incluye colita y margen de sombra). */
const LABEL_WORLD_HEIGHT = 1.12;

export class RooftopsWorld {
  readonly group = new THREE.Group();
  readonly walkableMeshes: THREE.Mesh[] = [];
  readonly windows: WindowSpot[] = [];
  /** Mallas de las buhardillas que responden al toque/clic (userData.sectionId). */
  readonly windowHitMeshes: THREE.Mesh[] = [];
  private highlightedWindow: SectionId | null = null;
  /** Edificios de la ciudad (uno por instancia) y sus ventanas con luces. */
  private cityBuildings!: THREE.InstancedMesh;
  private facadeWindows: THREE.InstancedMesh | null = null;
  private windowLights: WindowLights | null = null;
  private lastElapsed: number | null = null;
  private tmpColor = new THREE.Color();
  /** Hojas de cada ventana: [izquierda, derecha], cada una girando en su bisagra. */
  private windowLeaves = new Map<SectionId, THREE.Group[]>();
  private disposed = false;
  private city!: CityGround;
  /** Paredes de las buhardillas: ladrillo pintado de blanco (textura dibujada por código). */
  private dormerWallMat: THREE.MeshLambertMaterial;

  private skyUniforms: {
    uTop: { value: THREE.Color };
    uMid: { value: THREE.Color };
    uHorizon: { value: THREE.Color };
  };
  private starUniforms: {
    uTime: { value: number };
    uOpacity: { value: number };
  };
  private starsPoints: THREE.Points;
  private moon: THREE.Sprite;

  private slateMat: THREE.MeshLambertMaterial;
  private zincMat: THREE.MeshLambertMaterial;
  private brickMat: THREE.MeshLambertMaterial;
  private plasterMat: THREE.MeshLambertMaterial;
  private darkTrimMat: THREE.MeshLambertMaterial;
  private silhouetteMat: THREE.MeshLambertMaterial;
  private skylineWindowMat: THREE.MeshBasicMaterial;
  /** Piso de las terrazas y pasarelas: textura "de tierra" teñida color teja. */
  private deckMat: THREE.MeshLambertMaterial;
  /** Faldones inclinados bajo el reborde: pizarra oscura tirando a marrón. */
  private mansardMat: THREE.MeshLambertMaterial;
  private spireMat: THREE.MeshLambertMaterial;
  private sootMat = new THREE.MeshBasicMaterial({ color: 0x140e14 });
  /** Remate de la chimenea: color ladrillo liso (la textura se estira en piezas finas). */
  private brickCapMat = new THREE.MeshLambertMaterial({ color: 0x8e4a38 });
  /** Reborde de los techos, en el mismo tono teja que el piso pero liso. */
  private edgeMat: THREE.MeshLambertMaterial;
  private woodMat: THREE.MeshLambertMaterial;
  private woodDarkMat: THREE.MeshLambertMaterial;
  /** Material que no se dibuja: solo para zonas que reciben toques. */
  private invisibleMat = new THREE.MeshBasicMaterial({ visible: false });
  private textures: THREE.Texture[] = [];
  private warmLights: THREE.PointLight[] = [];

  private currentTheme: 'dark' | 'light' = 'dark';
  private currentLocale: Locale = 'es';


  constructor(theme: 'dark' | 'light', locale: Locale) {
    this.currentTheme = theme;
    this.currentLocale = locale;

    this.skyUniforms = {
      uTop: { value: new THREE.Color(0x0d1024) },
      uMid: { value: new THREE.Color(0x1b1938) },
      uHorizon: { value: new THREE.Color(0x2f254a) },
    };

    this.starUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0.85 },
    };

    const loader = new THREE.TextureLoader();
    const slateTex = this.loadRepeatingTexture(loader, 'assets/textures/roof_slates_03_diff_1k.jpg', 0.5, 0.5);
    const brickTex = this.loadRepeatingTexture(loader, 'assets/textures/brick_wall_02_diff_1k.jpg', 1.5, 2);
    const zincTex = this.loadRepeatingTexture(loader, 'assets/textures/metal_plate_diff_1k.jpg', 3, 2);

    this.slateMat = new THREE.MeshLambertMaterial({ map: slateTex, color: 0x8b90a8 });
    this.zincMat = new THREE.MeshLambertMaterial({ map: zincTex, color: 0x7c8296 });
    this.brickMat = new THREE.MeshLambertMaterial({ map: brickTex, color: 0xb8968e });
    this.plasterMat = new THREE.MeshLambertMaterial({ color: 0x2c253b });
    this.dormerWallMat = new THREE.MeshLambertMaterial({ map: this.createPaintedBrickTexture() });
    this.darkTrimMat = new THREE.MeshLambertMaterial({ color: 0x1d1829 });
    this.silhouetteMat = new THREE.MeshLambertMaterial({ color: 0x120e1e });
    this.skylineWindowMat = new THREE.MeshBasicMaterial({ color: 0x0c0a18 });
    this.deckMat = new THREE.MeshLambertMaterial({ map: zincTex, color: 0xe0915e });
    this.edgeMat = new THREE.MeshLambertMaterial({ color: 0x9a5434 });
    this.mansardMat = new THREE.MeshLambertMaterial({ map: slateTex, color: 0x8a6656 });
    // flatShading: cada cara del techo puntiagudo recibe la luz distinto y se nota su forma
    this.spireMat = new THREE.MeshLambertMaterial({ color: 0x2a2440, flatShading: true });
    this.woodMat = new THREE.MeshLambertMaterial({ color: 0xa8784c });
    this.woodDarkMat = new THREE.MeshLambertMaterial({ color: 0x7e5536 });

    this.buildSky();
    this.starsPoints = this.buildStars();
    this.group.add(this.starsPoints);
    this.moon = this.buildMoon();
    this.group.add(this.moon);

    this.buildParisianRooftops();
    this.buildDistantSkyline();
    this.city = new CityGround(theme);
    this.group.add(this.city.group);
    this.buildDormerWindows();
    this.updateTheme(theme);
    this.updateLocale(locale);

    // Si DM Sans todavía no cargó, el canvas usa otra letra: redibujamos cuando esté lista
    document.fonts
      ?.load('600 64px "DM Sans"')
      .then(() => this.refreshWindowLabels())
      .catch(() => undefined);
  }

  /**
   * Ladrillo pintado de blanco, dibujado en un canvas de 256 px (sin descargar imágenes):
   * hileras desplazadas a media pieza, juntas grisáceas y una leve variación de tono
   * por ladrillo para que no se vea plano. La luz de la escena sigue sombreándolo.
   */
  private createPaintedBrickTexture(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const rows = 9;
      const cols = 4;
      const bh = size / rows;
      const bw = size / cols;
      const joint = 3;

      // Juntas (el fondo que queda entre ladrillos)
      ctx.fillStyle = '#c9c0c4';
      ctx.fillRect(0, 0, size, size);

      let seed = 21;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let r = 0; r < rows; r++) {
        const offset = r % 2 === 0 ? 0 : bw / 2;
        for (let c = -1; c <= cols; c++) {
          const x = c * bw + offset;
          const tone = 236 + Math.round(rand() * 16);
          ctx.fillStyle = `rgb(${tone}, ${tone - 4}, ${tone - 2})`;
          ctx.fillRect(x + joint / 2, r * bh + joint / 2, bw - joint, bh - joint);
          // Borde inferior apenas más oscuro: da relieve
          ctx.fillStyle = 'rgba(120, 100, 110, 0.12)';
          ctx.fillRect(x + joint / 2, r * bh + bh - joint / 2 - 2, bw - joint, 2);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.textures.push(tex);
    return tex;
  }

  /**
   * Interior de la habitación visto por la ventana abierta (canvas de 128 px):
   * pared cálida, zócalo, piso de madera y una lámpara de pie. Colores planos.
   */
  private createRoomTexture(): THREE.CanvasTexture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Pared
      ctx.fillStyle = '#e9a85c';
      ctx.fillRect(0, 0, size, size);
      // Piso de madera
      ctx.fillStyle = '#8a5434';
      ctx.fillRect(0, size * 0.72, size, size * 0.28);
      ctx.fillStyle = '#6f4129';
      ctx.fillRect(0, size * 0.72, size, 3);
      // Cuadro en la pared
      ctx.fillStyle = '#b86f3d';
      ctx.fillRect(size * 0.16, size * 0.22, size * 0.26, size * 0.2);
      ctx.fillStyle = '#f6d39a';
      ctx.fillRect(size * 0.19, size * 0.25, size * 0.2, size * 0.14);
      // Lámpara de pie
      ctx.fillStyle = '#5c3a26';
      ctx.fillRect(size * 0.74, size * 0.36, 3, size * 0.37);
      ctx.fillStyle = '#ffe7b3';
      ctx.beginPath();
      ctx.moveTo(size * 0.66, size * 0.36);
      ctx.lineTo(size * 0.84, size * 0.36);
      ctx.lineTo(size * 0.79, size * 0.24);
      ctx.lineTo(size * 0.71, size * 0.24);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(tex);
    return tex;
  }

  private loadRepeatingTexture(
    loader: THREE.TextureLoader,
    url: string,
    repeatX: number,
    repeatY: number
  ): THREE.Texture {
    const tex = loader.load(url);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(tex);
    return tex;
  }

  private buildSky(): void {
    // Más grande que la ciudad entera (la cámara ve hasta 280)
    const skyGeo = new THREE.SphereGeometry(265, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: this.skyUniforms,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uTop;
        uniform vec3 uMid;
        uniform vec3 uHorizon;
        varying vec3 vWorldPos;
        void main() {
          float h = clamp(normalize(vWorldPos).y * 1.4 + 0.08, 0.0, 1.0);
          vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.45, h));
          col = mix(col, uTop, smoothstep(0.45, 0.95, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.group.add(new THREE.Mesh(skyGeo, skyMat));
  }

  private buildStars(): THREE.Points {
    const count = 900;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    // Distribución determinista en la bóveda celeste (sin luna)
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = rand() * Math.PI * 0.46 + 0.04;
      const r = 240;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 4;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      // La mayoría chiquitas y unas pocas más brillantes, como en un cielo real
      const kind = rand();
      sizes[i] = kind < 0.85 ? 0.9 + rand() * 1.4 : 2.4 + rand() * 2.2;
      phases[i] = rand() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: this.starUniforms,
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying float vPhase;
        void main() {
          vPhase = aPhase;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (560.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        varying float vPhase;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float twinkle = 0.65 + 0.35 * sin(uTime * 1.1 + vPhase * 4.0);
          float alpha = smoothstep(0.5, 0.1, dist) * twinkle * uOpacity;
          gl_FragColor = vec4(0.92, 0.91, 1.0, alpha);
        }
      `,
    });

    return new THREE.Points(geo, mat);
  }

  /**
   * Luna llena dibujada en un canvas de 256 px (sin archivos externos).
   * Los "mares" (manchas oscuras) siguen aproximadamente la cara visible real:
   * Océano de las Tormentas a la izquierda, mares de la Lluvia, Serenidad y
   * Tranquilidad arriba al centro, mar de las Crisis a la derecha y el cráter
   * Tycho abajo con rayos muy tenues. Todo con poca opacidad para que sea sutil.
   */
  private buildMoon(): THREE.Sprite {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const c = size / 2;
      const r = size / 2 - 4;

      ctx.save();
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.clip();

      // Disco base color hueso
      ctx.fillStyle = '#efe9dc';
      ctx.fillRect(0, 0, size, size);

      // Mares: elipses suaves con bordes difuminados
      const maria: [number, number, number, number, number, number][] = [
        // x, y, rx, ry, rotación, opacidad (relativos al radio)
        [-0.42, -0.05, 0.3, 0.52, 0.15, 0.2], // Océano de las Tormentas
        [-0.18, -0.38, 0.26, 0.2, -0.3, 0.24], // Mar de la Lluvia
        [0.14, -0.34, 0.15, 0.14, 0, 0.22], // Mar de la Serenidad
        [0.22, -0.08, 0.2, 0.15, 0.4, 0.22], // Mar de la Tranquilidad
        [0.56, -0.24, 0.12, 0.1, 0.2, 0.24], // Mar de las Crisis
        [0.34, 0.16, 0.12, 0.14, 0, 0.16], // Mar de la Fecundidad
        [-0.14, 0.24, 0.17, 0.12, -0.2, 0.15], // Mar de las Nubes
        [-0.36, 0.38, 0.12, 0.08, 0, 0.14], // Mar de los Humores
      ];
      ctx.filter = 'blur(6px)';
      for (const [x, y, rx, ry, rot, alpha] of maria) {
        ctx.fillStyle = `rgba(118, 116, 138, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(c + x * r, c + y * r, rx * r, ry * r, rot, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.filter = 'none';

      // Cráteres chicos: aro claro y centro apenas más oscuro
      let seed = 7;
      const rand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };
      for (let i = 0; i < 26; i++) {
        const a = rand() * Math.PI * 2;
        const d = Math.sqrt(rand()) * r * 0.88;
        const cr = 1.5 + rand() * 4.5;
        const x = c + Math.cos(a) * d;
        const y = c + Math.sin(a) * d;
        ctx.fillStyle = 'rgba(110, 106, 124, 0.16)';
        ctx.beginPath();
        ctx.arc(x, y, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x - 0.6, y - 0.6, cr, Math.PI * 0.9, Math.PI * 1.7);
        ctx.stroke();
      }

      // Tycho: punto claro con rayos muy tenues
      const tx = c - 0.12 * r;
      const ty = c + 0.62 * r;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + 0.3;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.cos(a) * r * 0.55, ty + Math.sin(a) * r * 0.55);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Oscurecimiento suave hacia el borde (como la luna real)
      const limb = ctx.createRadialGradient(c, c, r * 0.55, c, c, r);
      limb.addColorStop(0, 'rgba(60, 56, 80, 0)');
      limb.addColorStop(1, 'rgba(60, 56, 80, 0.28)');
      ctx.fillStyle = limb;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const moon = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, fog: false, depthWrite: false })
    );
    // Arriba de la silueta de la ciudad y dentro del cuadro también en celular
    moon.position.set(14, 20, -80);
    moon.scale.set(9, 9, 1);
    return moon;
  }

  private addMansardBuilding(
    cx: number,
    cz: number,
    w: number,
    d: number
  ): void {
    // Fachada: desde la base de la mansarda (y = -1.2) hasta el suelo de la calle
    const height = -1.2 - GROUND_Y;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), this.plasterMat);
    wall.position.set(cx, -height / 2 - 1.2, cz);
    this.group.add(wall);

    // Faldón inclinado de mansarda en pizarra: tronco de pirámide alineado a las paredes.
    // Abajo sobresale como alero; arriba coincide con el borde de la terraza.
    const mansardHeight = 1.25;
    const mansard = new THREE.Mesh(
      createFrustumGeometry(w + 1.1, d + 1.1, w + 0.15, d + 0.15, mansardHeight),
      this.mansardMat
    );
    mansard.position.set(cx, -mansardHeight, cz);
    this.group.add(mansard);

    // Terraza superior caminable de zinc/pizarra (y = 0)
    const roofDeck = new THREE.Mesh(new THREE.BoxGeometry(w + 0.15, 0.22, d + 0.15), this.deckMat);
    roofDeck.position.set(cx, -0.11, cz);
    this.group.add(roofDeck);
    this.walkableMeshes.push(roofDeck);

    // Canaletas metálicas en el borde del alero
    const gutterFront = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, w + 0.4, 8), this.zincMat);
    gutterFront.rotation.z = Math.PI / 2;
    gutterFront.position.set(cx, -mansardHeight, cz + (d + 1.1) / 2 + 0.08);
    this.group.add(gutterFront);

    // Reborde bajo en los cuatro lados del techo (color teja liso)
    const edgeH = 0.14;
    const edgeT = 0.18;
    for (const side of [-1, 1]) {
      const front = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, edgeH, edgeT), this.edgeMat);
      front.position.set(cx, edgeH / 2, cz + side * (d / 2 + 0.04));
      this.group.add(front);

      const lateral = new THREE.Mesh(new THREE.BoxGeometry(edgeT, edgeH, d + 0.2), this.edgeMat);
      lateral.position.set(cx + side * (w / 2 + 0.04), edgeH / 2, cz);
      this.group.add(lateral);
    }

    // Chimeneas de ladrillo con remate y caños de zinc
  }

  /**
   * Chimenea de ladrillo hueca: cuerpo, una franja que sobresale y un remate
   * más ancho con forma de marco (4 lados) que deja ver el interior oscuro.
   */
  private addChimney(x: number, z: number): void {
    const bodyW = 1.0;
    const bodyD = 0.8;
    const bodyH = 1.75;

    const stack = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), this.brickMat);
    stack.position.set(x, bodyH / 2, z);
    this.group.add(stack);

    // Primer escalón: franja de ladrillo un poco más ancha
    const band = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.14, 0.13, bodyD + 0.14), this.brickCapMat);
    band.position.set(x, bodyH + 0.065, z);
    this.group.add(band);

    // Remate hueco: marco de 4 paredes alrededor del agujero
    const rimW = bodyW + 0.26;
    const rimD = bodyD + 0.26;
    const rimH = 0.2;
    const wall = 0.17;
    const rimY = bodyH + 0.13 + rimH / 2;
    for (const side of [-1, 1]) {
      const long = new THREE.Mesh(new THREE.BoxGeometry(rimW, rimH, wall), this.brickCapMat);
      long.position.set(x, rimY, z + side * (rimD / 2 - wall / 2));
      this.group.add(long);

      const short = new THREE.Mesh(new THREE.BoxGeometry(wall, rimH, rimD - wall * 2), this.brickCapMat);
      short.position.set(x + side * (rimW / 2 - wall / 2), rimY, z);
      this.group.add(short);
    }

    // Interior hollín: siempre oscuro, un poco más abajo que el borde para dar profundidad
    const hole = new THREE.Mesh(
      new THREE.BoxGeometry(rimW - wall * 2, 0.05, rimD - wall * 2),
      this.sootMat
    );
    hole.position.set(x, rimY - 0.02, z);
    this.group.add(hole);
  }

  /**
   * Puente improvisado de madera entre dos techos: tablones sueltos con espacios,
   * un poco desparejos, sobre dos vigas, con postes y baranda.
   * Se ve como algo agregado, no como parte original de los edificios.
   */
  private addBridge(cx: number, cz: number, w: number, d: number): void {
    // Superficie invisible para que el toque/clic funcione aunque caiga entre tablones
    const hitArea = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), this.invisibleMat);
    hitArea.position.set(cx, -0.1, cz);
    this.group.add(hitArea);
    this.walkableMeshes.push(hitArea);

    let seed = Math.round(Math.abs(cx) * 100) + 3;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const plankWidth = 0.34;
    const gap = 0.07;
    const deckDepth = d - 0.5;
    const count = Math.floor(w / (plankWidth + gap));
    const startX = cx - ((count - 1) * (plankWidth + gap)) / 2;
    const plankGeo = new THREE.BoxGeometry(plankWidth, 0.09, deckDepth);

    for (let i = 0; i < count; i++) {
      const plank = new THREE.Mesh(plankGeo, rand() < 0.5 ? this.woodMat : this.woodDarkMat);
      plank.position.set(
        startX + i * (plankWidth + gap),
        -0.045 + (rand() - 0.5) * 0.03,
        cz + (rand() - 0.5) * 0.18
      );
      plank.rotation.y = (rand() - 0.5) * 0.06;
      plank.rotation.z = (rand() - 0.5) * 0.04;
      this.group.add(plank);
    }

    // Dos vigas largas debajo de los tablones
    for (const side of [-1, 1]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.16, 0.16), this.woodDarkMat);
      beam.position.set(cx, -0.17, cz + side * (deckDepth / 2 - 0.3));
      this.group.add(beam);
    }

    // Postes y baranda a cada lado
    const postGeo = new THREE.BoxGeometry(0.1, 0.62, 0.1);
    const posts = 3;
    for (const side of [-1, 1]) {
      // Misma posición que usa walkArea.ts para que el gato no atraviese la baranda
      const z = cz + side * railZOffset(d);
      for (let p = 0; p < posts; p++) {
        const post = new THREE.Mesh(postGeo, this.woodDarkMat);
        post.position.set(cx - w / 2 + 0.25 + (p * (w - 0.5)) / (posts - 1), 0.26, z);
        post.rotation.z = (rand() - 0.5) * 0.08;
        this.group.add(post);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.07, 0.08), this.woodMat);
      rail.position.set(cx, 0.55, z);
      rail.rotation.z = (rand() - 0.5) * 0.03;
      this.group.add(rail);
    }
  }

  private buildParisianRooftops(): void {
    for (const [x, z, w, d] of ROOFTOP_BUILDINGS) this.addMansardBuilding(x, z, w, d);
    // Las chimeneas vienen de walkArea.ts (también son obstáculos para el gato)
    for (const [x, z] of CHIMNEYS) this.addChimney(x, z);

    for (const b of BRIDGES) this.addBridge(b.cx, b.cz, b.w, b.d);
  }

  private buildDistantSkyline(): void {
    // Todos los edificios de la ciudad (fondo + manzanas de relleno) en un solo
    // InstancedMesh: una caja de 1×1×1 escalada, con un color de fachada por edificio.
    const fillers = fillerBlocks();
    const blocks = [...BACKGROUND_BLOCKS, ...fillers];
    const buildingMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.cityBuildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), buildingMat, blocks.length);
    blocks.forEach(([x, z, w, d, h], i) => {
      this.cityBuildings.setMatrixAt(
        i,
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, GROUND_Y + h / 2, z),
          new THREE.Quaternion(),
          new THREE.Vector3(w, h, d)
        )
      );
    });
    this.cityBuildings.instanceMatrix.needsUpdate = true;
    this.group.add(this.cityBuildings);

    this.group.add(this.buildFacadeWindows(fillers));

    // Campanario / aguja lejana en el horizonte.
    // Va en su propio grupo girado: así se ven dos caras de la torre y del techo
    // puntiagudo, cada una con distinta luz.
    const tower = new THREE.Group();
    tower.position.set(-14, 0, -36);
    tower.rotation.y = 0.55;
    this.group.add(tower);

    // Del suelo hasta la cornisa (y = 8)
    const towerHeight = 8 - GROUND_Y;
    const towerBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, towerHeight, 3.8), this.silhouetteMat);
    towerBase.position.y = 8 - towerHeight / 2;
    tower.add(towerBase);

    // Cornisa: separa la torre del techo puntiagudo
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.45, 4.4), this.spireMat);
    cornice.position.y = 8.1;
    tower.add(cornice);

    // Techo puntiagudo en otro tono y con caras planas (alineado con la torre)
    const spire = new THREE.Mesh(new THREE.ConeGeometry(2.95, 8.5, 4), this.spireMat);
    spire.rotation.y = Math.PI / 4;
    spire.position.y = 12.55;
    tower.add(spire);

    // Dos ventanas altas y angostas en el frente de la torre
    for (const dx of [-0.75, 0.75]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.9), this.skylineWindowMat);
      win.position.set(dx, 5.9, 1.92);
      tower.add(win);
    }
  }

  /**
   * Ventanas (rectángulos oscuros) en las fachadas de todos los edificios: frente y costados,
   * desde arriba hasta el primer piso (la planta baja queda libre para la puerta).
   * Es un solo InstancedMesh: cientos de ventanas en una única llamada de dibujo.
   */
  private buildFacadeWindows(fillers: BlockSpec[]): THREE.InstancedMesh {
    const winW = 0.75;
    const winH = 1.15;
    const colGap = 1.7;
    const rowGap = 2.3;
    const margin = 1.0;
    const bottom = GROUND_Y + 4.2;
    const FRONT = 0;
    const RIGHT = Math.PI / 2;
    const LEFT = -Math.PI / 2;

    let seed = 11;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // Cada fachada: centro (x, z), ancho, altura de la fila de arriba y orientación
    const facades: { x: number; z: number; width: number; top: number; rotY: number }[] = [];
    const addBox = (x: number, z: number, w: number, d: number, top: number) => {
      facades.push({ x, z: z + d / 2 + 0.03, width: w, top, rotY: FRONT });
      facades.push({ x: x + w / 2 + 0.03, z, width: d, top, rotY: RIGHT });
      facades.push({ x: x - w / 2 - 0.03, z, width: d, top, rotY: LEFT });
    };
    // Las ventanas de los edificios muy lejanos no se distinguen entre la neblina: se omiten
    const nearFillers = fillers.filter(([x, z]) => Math.hypot(x, z) < 95);
    for (const [x, z, w, d, h] of [...BACKGROUND_BLOCKS, ...nearFillers]) addBox(x, z, w, d, GROUND_Y + h - 1.4);
    // Edificios con techo: por debajo de la mansarda
    for (const [x, z, w, d] of ROOFTOP_BUILDINGS) addBox(x, z, w, d, -2.4);

    const matrices: THREE.Matrix4[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (const f of facades) {
      const cols = Math.floor((f.width - margin * 2) / colGap) + 1;
      const start = -((cols - 1) * colGap) / 2;
      const q = new THREE.Quaternion().setFromAxisAngle(up, f.rotY);
      // Dirección "a lo ancho" de la fachada
      const across = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
      for (let y = f.top - winH / 2; y > bottom; y -= rowGap) {
        for (let c = 0; c < cols; c++) {
          // Algunas ventanas faltan, para que no parezca una grilla perfecta
          if (rand() < 0.18) continue;
          const offset = start + c * colGap;
          matrices.push(
            new THREE.Matrix4().compose(
              new THREE.Vector3(f.x + across.x * offset, y, f.z + across.z * offset),
              q,
              new THREE.Vector3(1, 1, 1)
            )
          );
        }
      }
    }

    // Blanco × color propio de cada ventana (instanceColor): así cada una se prende o apaga sola
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(winW, winH), windowMat, matrices.length);
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    this.windowLights = new WindowLights(matrices.length, 7);
    this.facadeWindows = mesh;
    return mesh;
  }

  /** Pinta las ventanas indicadas (o todas) según si tienen la luz prendida. */
  private paintWindows(indices?: number[]): void {
    const mesh = this.facadeWindows;
    const lights = this.windowLights;
    if (!mesh || !lights) return;
    const list = indices ?? lights.lit.map((_, i) => i);
    for (const i of list) {
      // Según el brillo del momento: así se ve el fundido al prenderse o apagarse
      this.tmpColor.setHex(windowColorMix(lights.level[i], lights.tint[i], this.currentTheme));
      mesh.setColorAt(i, this.tmpColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  /** Color de fachada de cada edificio de la ciudad según el tema. */
  private paintBuildings(): void {
    if (!this.cityBuildings) return;
    buildingColors(this.cityBuildings.count, this.currentTheme).forEach((hex, i) => {
      this.cityBuildings.setColorAt(i, this.tmpColor.setHex(hex));
    });
    if (this.cityBuildings.instanceColor) this.cityBuildings.instanceColor.needsUpdate = true;
  }

  private buildDormerWindows(): void {
    const labels: Record<string, { es: string; en: string }> = {
      projects: { es: 'Proyectos', en: 'Projects' },
      technologies: { es: 'Tecnologías', en: 'Technologies' },
      education: { es: 'Formación', en: 'Education' },
      achievements: { es: 'Logros', en: 'Achievements' },
      contact: { es: 'Contacto', en: 'Contact' },
    };
    // Las posiciones vienen de walkArea.ts, que también las usa como obstáculos
    const specs = DORMERS.map((d) => ({ sectionId: d.id as SectionId, label: labels[d.id], x: d.x, z: d.z }));
    const roomTexture = this.createRoomTexture();

    // Medidas del hueco de la ventana
    const openW = 1.12;
    const openH = 0.98;
    const winY = 1.02;
    const leafZ = 0.9;

    for (const spec of specs) {
      const dormer = new THREE.Group();
      dormer.position.set(spec.x, 0, spec.z);

      // Cuerpo de la buhardilla
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(DORMER_SIZE.w, 1.9, DORMER_SIZE.d),
        this.dormerWallMat
      );
      body.position.set(0, 0.95, 0);
      dormer.add(body);

      // Tejadillo a dos aguas de pizarra, con un poco de alero sobre el cuerpo
      const roof = new THREE.Mesh(createGableRoofGeometry(2.6, 1.95, 0.95), this.slateMat);
      roof.position.set(0, 1.9, -0.05);
      dormer.add(roof);

      // Habitación iluminada que se ve cuando la ventana se abre (tapa al gato al entrar)
      const room = new THREE.Mesh(
        new THREE.PlaneGeometry(openW, openH),
        new THREE.MeshBasicMaterial({ map: roomTexture })
      );
      room.position.set(0, winY, DORMER_SIZE.d / 2 + 0.015);
      dormer.add(room);

      // Marco hueco: dintel, jambas y repisa (donde se apoya el gato)
      const bars: [number, number, number, number, number, number][] = [
        [openW + 0.2, 0.1, 0.14, 0, winY + openH / 2 + 0.05, 0.86],
        [0.1, openH + 0.2, 0.14, -openW / 2 - 0.05, winY, 0.86],
        [0.1, openH + 0.2, 0.14, openW / 2 + 0.05, winY, 0.86],
        [openW + 0.36, 0.09, 0.32, 0, winY - openH / 2 - 0.045, 0.94],
      ];
      for (const [w, h, d, x, y, z] of bars) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.darkTrimMat);
        bar.position.set(x, y, z);
        dormer.add(bar);
      }

      // Dos hojas con bisagra en los costados: se abren hacia afuera como puertitas
      // DoubleSide: al abrirse se ve la cara de atrás del vidrio
      const paneMat = new THREE.MeshBasicMaterial({ color: 0xf7d58b, side: THREE.DoubleSide });
      const leaves: THREE.Group[] = [];
      for (const side of [-1, 1]) {
        const hinge = new THREE.Group();
        hinge.position.set(side * (openW / 2), winY, leafZ);
        const leafW = openW / 2;
        const inward = -side; // hacia el centro de la ventana

        const pane = new THREE.Mesh(new THREE.PlaneGeometry(leafW - 0.02, openH), paneMat);
        pane.position.x = (inward * leafW) / 2;
        pane.userData.sectionId = spec.sectionId;
        this.windowHitMeshes.push(pane);
        hinge.add(pane);
        // Travesaño horizontal y montante del lado de adentro (la "cruz" al estar cerrada)
        const cross = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.06, 0.05), this.darkTrimMat);
        cross.position.set((inward * leafW) / 2, 0, 0.02);
        hinge.add(cross);
        const stile = new THREE.Mesh(new THREE.BoxGeometry(0.035, openH, 0.05), this.darkTrimMat);
        stile.position.set(inward * (leafW - 0.0175), 0, 0.02);
        hinge.add(stile);

        dormer.add(hinge);
        leaves.push(hinge);
      }

      body.userData.sectionId = spec.sectionId;
      roof.userData.sectionId = spec.sectionId;
      room.userData.sectionId = spec.sectionId;
      this.windowHitMeshes.push(body, roof, room);
      this.windowLeaves.set(spec.sectionId, leaves);

      // Luz cálida puntual que baña el tejado frente a la buhardilla
      const warmLight = new THREE.PointLight(0xffcf7d, 2.2, 6.5, 1.8);
      warmLight.position.set(0, 1.05, 1.55);
      dormer.add(warmLight);
      this.warmLights.push(warmLight);

      // Letrero arriba (sin neblina para que se lea siempre)
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ transparent: true, fog: false, depthWrite: false })
      );
      sprite.position.set(0, 3.5, 0);
      dormer.add(sprite);

      this.group.add(dormer);
      this.windows.push({
        sectionId: spec.sectionId,
        label: spec.label,
        position: new THREE.Vector3(spec.x, 0, spec.z),
        sprite,
        paneMat,
      });
    }
  }

  /**
   * Letrero tipo "globito" (estilo iOS): cápsula del ancho justo del texto, sombra suave
   * y una colita que apunta a la ventana. Se dibuja a alta resolución para que el texto
   * se vea nítido. Devuelve también la proporción ancho/alto para escalar el sprite.
   */
  private createLabelTexture(text: string): { texture: THREE.CanvasTexture; aspect: number } {
    const fontSize = 64;
    const font = `600 ${fontSize}px "DM Sans", -apple-system, "SF Pro Text", system-ui, sans-serif`;
    const padX = 46;
    const pillH = LABEL_PILL_PX;
    const tailH = 16;
    const margin = 26; // espacio para la sombra

    const measure = document.createElement('canvas').getContext('2d');
    let textW = text.length * fontSize * 0.55;
    if (measure) {
      measure.font = font;
      textW = measure.measureText(text).width;
    }

    const canvas = document.createElement('canvas');
    const pillW = Math.ceil(textW + padX * 2);
    canvas.width = pillW + margin * 2;
    canvas.height = pillH + tailH + margin * 2;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const isLight = this.currentTheme === 'light';
      const x = margin;
      const y = margin;
      const r = pillH / 2;
      const cx = canvas.width / 2;

      // Cápsula + colita en un solo contorno
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + pillW - r, y);
      ctx.arc(x + pillW - r, y + r, r, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(cx + 15, y + pillH);
      ctx.quadraticCurveTo(cx + 3, y + pillH + tailH - 2, cx, y + pillH + tailH);
      ctx.quadraticCurveTo(cx - 3, y + pillH + tailH - 2, cx - 15, y + pillH);
      ctx.lineTo(x + r, y + pillH);
      ctx.arc(x + r, y + r, r, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();

      // Sombra suave debajo (le da profundidad y lo separa del fondo)
      ctx.save();
      ctx.shadowColor = isLight ? 'rgba(40, 20, 60, 0.22)' : 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = isLight ? 'rgba(250, 248, 253, 0.94)' : 'rgba(21, 8, 28, 0.88)';
      ctx.fill();
      ctx.restore();

      // Borde fino (mismos colores de antes)
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isLight ? 'rgba(124, 58, 237, 0.45)' : 'rgba(192, 155, 255, 0.45)';
      ctx.stroke();

      ctx.fillStyle = isLight ? '#171324' : '#F5F2FB';
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0.5px';
      }
      ctx.fillText(text, cx, y + pillH / 2 + 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return { texture, aspect: canvas.width / canvas.height };
  }

  /** Ajusta el tamaño del letrero a su texto (más grande si la ventana está resaltada). */
  private scaleLabel(sprite: THREE.Sprite, emphasis = 1): void {
    const aspect = (sprite.userData.aspect as number | undefined) ?? 3;
    const h = LABEL_WORLD_HEIGHT * emphasis;
    sprite.scale.set(h * aspect, h, 1);
  }

  update(elapsedSeconds: number): void {
    this.starUniforms.uTime.value = elapsedSeconds;

    // Luces de la ciudad: algunas se prenden y otras se apagan con el tiempo
    const dt = this.lastElapsed === null ? 0 : Math.min(elapsedSeconds - this.lastElapsed, 0.5);
    this.lastElapsed = elapsedSeconds;
    if (this.windowLights && dt > 0) {
      const changed = this.windowLights.step(dt);
      if (changed.length > 0) this.paintWindows(changed);
    }
  }

  updateTheme(theme: 'dark' | 'light'): void {
    this.currentTheme = theme;
    if (theme === 'light') {
      // Amanecer: cielo celeste arriba que baja a rosado y durazno en el horizonte
      this.skyUniforms.uTop.value.setHex(0x9db3e4);
      this.skyUniforms.uMid.value.setHex(0xe9b9d4);
      this.skyUniforms.uHorizon.value.setHex(SKY_HORIZON.light);
      this.starUniforms.uOpacity.value = 0.0;
      this.moon.visible = false;
      this.slateMat.color.setHex(0xa9a6bd);
      this.zincMat.color.setHex(0xc2bccd);
      this.brickMat.color.setHex(0xdcb0a6);
      this.plasterMat.color.setHex(0xe6d6e2);
      this.darkTrimMat.color.setHex(0x6a5a78);
      this.silhouetteMat.color.setHex(0xc7b3cf);
      this.skylineWindowMat.color.setHex(0x6a5680);
      // Tinte "más fuerte que blanco" (valores > 1) porque la textura de base es muy oscura
      this.deckMat.color.setRGB(1.7, 0.62, 0.24, THREE.LinearSRGBColorSpace);
      this.edgeMat.color.setHex(0xa85a36);
      this.mansardMat.color.setHex(0x7d5747);
      this.spireMat.color.setHex(0x9c84a6);
      for (const l of this.warmLights) l.intensity = 0.6;
    } else {
      // Noche de luna llena: más luz que antes para que se lean las tejas y los detalles
      this.skyUniforms.uTop.value.setHex(0x131a3a);
      this.skyUniforms.uMid.value.setHex(0x242650);
      this.skyUniforms.uHorizon.value.setHex(SKY_HORIZON.dark);
      this.starUniforms.uOpacity.value = 0.85;
      this.moon.visible = true;
      this.slateMat.color.setHex(0xc9cde6);
      this.zincMat.color.setHex(0xb3b9d2);
      this.brickMat.color.setHex(0xd0a89e);
      this.plasterMat.color.setHex(0x4a4068);
      this.darkTrimMat.color.setHex(0x2e2747);
      this.silhouetteMat.color.setHex(0x1f1c3a);
      this.skylineWindowMat.color.setHex(0x0e0c1e);
      // Con luz de luna azulada hace falta un naranja más fuerte para que siga viéndose teja
      this.deckMat.color.setHex(0xffa060);
      this.edgeMat.color.setHex(0xd27446);
      // La luz de luna es azulada: hace falta un marrón más cálido para que no se vea gris
      this.mansardMat.color.setHex(0xb07a62);
      this.spireMat.color.setHex(0x3a3260);
      for (const l of this.warmLights) l.intensity = 2.4;
    }
    // Las buhardillas conservan el mismo tono de antes, ahora con ladrillos
    this.dormerWallMat.color.copy(this.plasterMat.color);
    this.paintBuildings();
    this.paintWindows();
    this.city?.updateTheme(theme);
    this.applyWindowColors();
    this.refreshWindowLabels();
  }

  /** Resalta la ventana frente a la que está el gato (cristal más claro y cartel más grande). */
  setHighlightedWindow(sectionId: SectionId | null): void {
    this.highlightedWindow = sectionId;
    this.applyWindowColors();
  }

  private applyWindowColors(): void {
    const isLight = this.currentTheme === 'light';
    for (const win of this.windows) {
      const active = win.sectionId === this.highlightedWindow;
      const base = isLight ? 0xf6e6b8 : 0xf7d58b;
      const bright = isLight ? 0xfff6d8 : 0xfff1c2;
      win.paneMat.color.setHex(active ? bright : base);
      this.scaleLabel(win.sprite, active ? 1.15 : 1);
    }
  }

  /**
   * Abre (1) o cierra (0) las dos hojas de una ventana. Valores intermedios
   * sirven para animar. Se abren hacia afuera, casi hasta tocar la pared.
   */
  setWindowOpen(sectionId: SectionId, amount: number): void {
    const leaves = this.windowLeaves.get(sectionId);
    if (!leaves) return;
    const angle = Math.max(0, Math.min(1, amount)) * 1.7;
    // Hoja izquierda gira en un sentido y la derecha en el otro
    leaves[0].rotation.y = -angle;
    leaves[1].rotation.y = angle;
  }

  /** Oculta el cartel de una ventana (cuando la cámara se acerca para entrar). */
  setLabelHidden(sectionId: SectionId | null): void {
    for (const win of this.windows) {
      win.sprite.visible = win.sectionId !== sectionId;
    }
  }

  getWindowAnchor(sectionId: SectionId): { x: number; z: number } | null {
    const win = this.windows.find((w) => w.sectionId === sectionId);
    return win ? { x: win.position.x, z: win.position.z } : null;
  }

  updateLocale(locale: Locale): void {
    this.currentLocale = locale;
    this.refreshWindowLabels();
  }

  private refreshWindowLabels(): void {
    if (this.disposed) return;
    for (const win of this.windows) {
      const mat = win.sprite.material as THREE.SpriteMaterial;
      mat.map?.dispose();
      const { texture, aspect } = this.createLabelTexture(win.label[this.currentLocale]);
      mat.map = texture;
      mat.needsUpdate = true;
      win.sprite.userData.aspect = aspect;
      this.scaleLabel(win.sprite, win.sectionId === this.highlightedWindow ? 1.15 : 1);
    }
  }

  /** Dentro de techos y puentes, sin atravesar barandas (ver walkArea.ts). */
  clampPosition(x: number, z: number): { x: number; z: number } {
    return clampToWalkArea(x, z);
  }

  dispose(): void {
    this.disposed = true;
    const materials = new Set<THREE.Material>();
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => materials.add(m));
        } else {
          materials.add(obj.material);
        }
      } else if (obj instanceof THREE.Sprite) {
        obj.material.map?.dispose();
        materials.add(obj.material);
      }
    });
    materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
  }
}

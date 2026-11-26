import * as THREE from 'three';
import type { Locale, SectionId } from '../types/content';
import { createFrustumGeometry, createGableRoofGeometry } from './geometry';

export interface RooftopWalkRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

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
export class RooftopsWorld {
  readonly group = new THREE.Group();
  readonly walkableMeshes: THREE.Mesh[] = [];
  readonly windows: WindowSpot[] = [];
  /** Mallas de las buhardillas que responden al toque/clic (userData.sectionId). */
  readonly windowHitMeshes: THREE.Mesh[] = [];
  private highlightedWindow: SectionId | null = null;

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

  private readonly walkZones: RooftopWalkRect[] = [
    // Techo central (Proyectos + Tecnologías)
    { minX: -7.5, maxX: 7.5, minZ: -5.4, maxZ: 5.4 },
    // Pasarela izquierda
    { minX: -11.5, maxX: -7.2, minZ: -1.6, maxZ: 1.6 },
    // Techo izquierdo (Formación)
    { minX: -20.5, maxX: -11.2, minZ: -4.9, maxZ: 4.9 },
    // Pasarela derecha
    { minX: 7.2, maxX: 11.5, minZ: -1.6, maxZ: 1.6 },
    // Techo derecho (Logros + Contacto)
    { minX: 11.2, maxX: 20.5, minZ: -4.9, maxZ: 4.9 },
  ];

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
    this.darkTrimMat = new THREE.MeshLambertMaterial({ color: 0x1d1829 });
    this.silhouetteMat = new THREE.MeshLambertMaterial({ color: 0x120e1e });
    this.skylineWindowMat = new THREE.MeshBasicMaterial({ color: 0x0c0a18 });
    this.deckMat = new THREE.MeshLambertMaterial({ map: zincTex, color: 0xe0915e });
    this.edgeMat = new THREE.MeshLambertMaterial({ color: 0x9a5434 });
    this.woodMat = new THREE.MeshLambertMaterial({ color: 0xa8784c });
    this.woodDarkMat = new THREE.MeshLambertMaterial({ color: 0x7e5536 });

    this.buildSky();
    this.starsPoints = this.buildStars();
    this.group.add(this.starsPoints);
    this.moon = this.buildMoon();
    this.group.add(this.moon);

    this.buildParisianRooftops();
    this.buildDistantSkyline();
    this.buildDormerWindows();
    this.updateTheme(theme);
    this.updateLocale(locale);
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
    const skyGeo = new THREE.SphereGeometry(110, 24, 16);
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
    const count = 240;
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
      const phi = rand() * Math.PI * 0.42 + 0.08;
      const r = 92;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 4;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = 1.4 + rand() * 2.6;
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
          gl_PointSize = aSize * (220.0 / -mvPosition.z);
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
    d: number,
    height: number,
    chimneys: [number, number][]
  ): void {
    // Fachada inferior
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), this.plasterMat);
    wall.position.set(cx, -height / 2 - 1.2, cz);
    this.group.add(wall);

    // Faldón inclinado de mansarda en pizarra: tronco de pirámide alineado a las paredes.
    // Abajo sobresale como alero; arriba coincide con el borde de la terraza.
    const mansardHeight = 1.25;
    const mansard = new THREE.Mesh(
      createFrustumGeometry(w + 1.1, d + 1.1, w + 0.15, d + 0.15, mansardHeight),
      this.slateMat
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
    for (const [ox, oz] of chimneys) {
      this.addChimney(cx + ox, cz + oz);
    }
  }

  private addChimney(x: number, z: number): void {
    const stack = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.9, 0.85), this.brickMat);
    stack.position.set(x, 0.95, z);
    this.group.add(stack);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 1.02), this.darkTrimMat);
    cap.position.set(x, 1.96, z);
    this.group.add(cap);

    for (const dx of [-0.24, 0.24]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.42, 8), this.zincMat);
      pot.position.set(x + dx, 2.22, z);
      this.group.add(pot);
    }
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
      const z = cz + side * (deckDepth / 2 - 0.02);
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
    this.addMansardBuilding(0, 0, 15.2, 11.2, 14, [
      [-6.2, 3.8],
      [6.2, -3.4],
    ]);
    // Las chimeneas van en coordenadas relativas al centro del edificio
    this.addMansardBuilding(-16, 0, 9.6, 10.2, 15, [[-3.1, 3.3]]);
    this.addMansardBuilding(16, 0, 9.6, 10.2, 14, [[3.1, -3.2]]);

    this.addBridge(-9.4, 0, 4.4, 3.2);
    this.addBridge(9.4, 0, 4.4, 3.2);
  }

  private buildDistantSkyline(): void {
    const blocks: [number, number, number, number, number][] = [
      [-34, -26, 9, 8, 22],
      [-22, -30, 11, 8, 26],
      [-9, -32, 10, 8, 24],
      [5, -31, 12, 8, 27],
      [20, -29, 10, 8, 23],
      [33, -25, 9, 9, 21],
      [-33, 10, 8, 10, 18],
      [33, 9, 8, 10, 19],
    ];
    for (const [x, z, w, d, h] of blocks) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.silhouetteMat);
      b.position.set(x, h / 2 - 18, z);
      this.group.add(b);
    }

    this.group.add(this.buildSkylineWindows(blocks));

    // Campanario / aguja lejana en el horizonte
    const towerBase = new THREE.Mesh(new THREE.BoxGeometry(3.8, 18, 3.8), this.silhouetteMat);
    towerBase.position.set(-14, -5, -36);
    this.group.add(towerBase);

    const spire = new THREE.Mesh(new THREE.ConeGeometry(2.4, 8.5, 4), this.silhouetteMat);
    spire.rotation.y = Math.PI / 4;
    spire.position.set(-14, 8.2, -36);
    this.group.add(spire);
  }

  /**
   * Ventanas (rectángulos oscuros) en la cara de los edificios del fondo que mira a la cámara.
   * Es un solo InstancedMesh: cientos de ventanas en una única llamada de dibujo.
   * Solo se llenan los pisos altos, que son los que se ven por encima de los techos.
   */
  private buildSkylineWindows(blocks: [number, number, number, number, number][]): THREE.InstancedMesh {
    const winW = 0.75;
    const winH = 1.15;
    const colGap = 1.7;
    const rowGap = 2.3;
    const margin = 1.0;

    let seed = 11;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const spots: [number, number, number][] = [];
    for (const [x, z, w, d, h] of blocks) {
      const top = h - 18 - 1.4; // borde superior del edificio menos una cornisa
      const front = z + d / 2 + 0.03;
      const cols = Math.floor((w - margin * 2) / colGap) + 1;
      const startX = x - ((cols - 1) * colGap) / 2;
      for (let y = top - winH / 2; y > -7; y -= rowGap) {
        for (let c = 0; c < cols; c++) {
          // Algunas ventanas faltan, para que no parezca una grilla perfecta
          if (rand() < 0.18) continue;
          spots.push([startX + c * colGap, y, front]);
        }
      }
    }

    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(winW, winH), this.skylineWindowMat, spots.length);
    const m = new THREE.Matrix4();
    spots.forEach(([x, y, z], i) => {
      m.makeTranslation(x, y, z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  private buildDormerWindows(): void {
    const specs: { sectionId: SectionId; label: { es: string; en: string }; x: number; z: number }[] = [
      { sectionId: 'projects', label: { es: 'Proyectos', en: 'Projects' }, x: -3.0, z: -4.2 },
      { sectionId: 'technologies', label: { es: 'Tecnologías', en: 'Technologies' }, x: 3.4, z: -4.2 },
      { sectionId: 'education', label: { es: 'Formación', en: 'Education' }, x: -16.0, z: -3.8 },
      { sectionId: 'achievements', label: { es: 'Logros', en: 'Achievements' }, x: 14.4, z: -3.8 },
      { sectionId: 'contact', label: { es: 'Contacto', en: 'Contact' }, x: 17.6, z: 3.1 },
    ];

    for (const spec of specs) {
      const dormer = new THREE.Group();
      dormer.position.set(spec.x, 0, spec.z);

      // Cuerpo de la buhardilla
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.9, 1.65), this.plasterMat);
      body.position.set(0, 0.95, 0);
      dormer.add(body);

      // Tejadillo a dos aguas de pizarra, con un poco de alero sobre el cuerpo
      const roof = new THREE.Mesh(createGableRoofGeometry(2.6, 1.95, 0.95), this.slateMat);
      roof.position.set(0, 1.9, -0.05);
      dormer.add(roof);

      // Marco de ventana oscuro
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.18, 0.14), this.darkTrimMat);
      frame.position.set(0, 1.02, 0.82);
      dormer.add(frame);

      // Cristal iluminado con luz cálida amarilla (sin colores saturados)
      const paneMat = new THREE.MeshBasicMaterial({ color: 0xf7d58b });
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.98), paneMat);
      pane.position.set(0, 1.02, 0.9);
      dormer.add(pane);

      body.userData.sectionId = spec.sectionId;
      pane.userData.sectionId = spec.sectionId;
      roof.userData.sectionId = spec.sectionId;
      this.windowHitMeshes.push(body, pane, roof);

      // Parteluz (cruz de madera de la ventana)
      const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.02, 0.05), this.darkTrimMat);
      mullionV.position.set(0, 1.02, 0.92);
      dormer.add(mullionV);
      const mullionH = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.06, 0.05), this.darkTrimMat);
      mullionH.position.set(0, 1.02, 0.92);
      dormer.add(mullionH);

      // Luz cálida puntual que baña el tejado frente a la buhardilla
      const warmLight = new THREE.PointLight(0xffcf7d, 2.2, 6.5, 1.8);
      warmLight.position.set(0, 1.05, 1.55);
      dormer.add(warmLight);
      this.warmLights.push(warmLight);

      // Cartelito discreto arriba
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.createLabelTexture(spec.label[this.currentLocale]),
          transparent: true,
        })
      );
      sprite.position.set(0, 3.25, 0);
      sprite.scale.set(2.5, 0.64, 1);
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

  private createLabelTexture(text: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const isLight = this.currentTheme === 'light';
      ctx.fillStyle = isLight ? 'rgba(250, 248, 253, 0.9)' : 'rgba(21, 8, 28, 0.84)';
      ctx.strokeStyle = isLight ? 'rgba(124, 58, 237, 0.45)' : 'rgba(192, 155, 255, 0.45)';
      ctx.lineWidth = 3;

      const r = 22;
      const x = 18;
      const y = 18;
      const w = canvas.width - 36;
      const h = canvas.height - 36;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isLight ? '#171324' : '#F5F2FB';
      ctx.font = '500 40px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  update(elapsedSeconds: number): void {
    this.starUniforms.uTime.value = elapsedSeconds;
  }

  updateTheme(theme: 'dark' | 'light'): void {
    this.currentTheme = theme;
    if (theme === 'light') {
      // Amanecer: cielo celeste arriba que baja a rosado y durazno en el horizonte
      this.skyUniforms.uTop.value.setHex(0x9db3e4);
      this.skyUniforms.uMid.value.setHex(0xe9b9d4);
      this.skyUniforms.uHorizon.value.setHex(0xfbd3c4);
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
      for (const l of this.warmLights) l.intensity = 0.6;
    } else {
      // Noche de luna llena: más luz que antes para que se lean las tejas y los detalles
      this.skyUniforms.uTop.value.setHex(0x131a3a);
      this.skyUniforms.uMid.value.setHex(0x242650);
      this.skyUniforms.uHorizon.value.setHex(0x3d3466);
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
      for (const l of this.warmLights) l.intensity = 2.4;
    }
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
      const scale = active ? 1.15 : 1;
      win.sprite.scale.set(2.5 * scale, 0.64 * scale, 1);
    }
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
    for (const win of this.windows) {
      const mat = win.sprite.material as THREE.SpriteMaterial;
      mat.map?.dispose();
      mat.map = this.createLabelTexture(win.label[this.currentLocale]);
      mat.needsUpdate = true;
    }
  }

  clampPosition(x: number, z: number): { x: number; z: number } {
    for (const zone of this.walkZones) {
      if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
        return { x, z };
      }
    }

    let bestX = x;
    let bestZ = z;
    let bestDist = Infinity;

    for (const zone of this.walkZones) {
      const cx = Math.max(zone.minX, Math.min(zone.maxX, x));
      const cz = Math.max(zone.minZ, Math.min(zone.maxZ, z));
      const dist = (x - cx) ** 2 + (z - cz) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        bestX = cx;
        bestZ = cz;
      }
    }
    return { x: bestX, z: bestZ };
  }

  dispose(): void {
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

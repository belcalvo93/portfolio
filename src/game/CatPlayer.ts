import * as THREE from 'three';

/**
 * Mike: gato gris atigrado con pecho, hocico y patitas blancas.
 * Hecho con formas simples redondeadas (esferas, cilindros y conos de pocos lados),
 * así se ve suave y lindo sin cargar modelos externos.
 * El gato mira hacia +Z y apoya las patas en y = 0.
 */

const FUR = 0x7b7f8c;
const STRIPE = 0x3e404a;
const WHITE = 0xf4f3f7;
const PINK = 0xfda4cf;
const EYE = 0xfef08a;
const PUPIL = 0x15081c;

const BODY_Y = 0.5;
const BODY_RX = 0.29;
const BODY_RY = 0.25;
const BODY_RZ = 0.52;
const HEAD_Y = 0.88;
const HEAD_Z = 0.5;

export class CatPlayer {
  readonly group = new THREE.Group();
  private legs: THREE.Group[] = [];
  private tailSegments: THREE.Group[] = [];
  private headGroup = new THREE.Group();
  private eyes: THREE.Group[] = [];
  private walkTime = 0;
  private idleTime = 0;
  private blinkTimer = 2.5;
  private blinkPhase = 0;

  private readonly speed = 5.4;

  private fur = new THREE.MeshLambertMaterial({ color: FUR });
  private stripe = new THREE.MeshLambertMaterial({ color: STRIPE });
  private white = new THREE.MeshLambertMaterial({ color: WHITE });
  private pink = new THREE.MeshLambertMaterial({ color: PINK });
  private eyeMat = new THREE.MeshBasicMaterial({ color: EYE });
  private pupilMat = new THREE.MeshBasicMaterial({ color: PUPIL });
  private shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  constructor() {
    this.buildBody();
    this.buildHead();
    this.buildLegs();
    this.buildTail();
  }

  /** Esfera escalada (elipsoide) con pocos lados: liviana y redondeada. */
  private blob(
    mat: THREE.Material,
    r: number,
    pos: [number, number, number],
    scale: [number, number, number] = [1, 1, 1],
    parent: THREE.Object3D = this.group
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  private buildBody(): void {
    // Torso ovalado, más ancho atrás (cadera) que adelante
    this.blob(this.fur, 1, [0, BODY_Y, 0], [BODY_RX, BODY_RY, BODY_RZ]);
    this.blob(this.fur, 0.25, [0, BODY_Y + 0.01, -0.3], [1.12, 1, 1]);

    // Pecho y panza blancos
    // Adelante del frente del torso (z ≈ 0.52) para que el gris no asome por el medio
    this.blob(this.white, 0.16, [0, 0.46, 0.44], [1, 1.15, 0.85]);
    this.blob(this.white, 0.18, [0, 0.31, 0.08], [0.75, 0.4, 1.35]);

    // Rayas atigradas: medios anillos que abrazan el lomo
    for (const z of [-0.32, -0.17, -0.02, 0.13]) {
      const k = Math.sqrt(Math.max(0, 1 - (z / BODY_RZ) ** 2));
      const rx = BODY_RX * k + 0.012;
      const ry = BODY_RY * k + 0.012;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.075, 5, 14, Math.PI), this.stripe);
      ring.scale.set(rx, ry, 0.35);
      ring.position.set(0, BODY_Y, z);
      // Un poco inclinadas, como las rayas reales
      ring.rotation.x = -0.12;
      this.group.add(ring);
    }
  }

  private buildHead(): void {
    const h = this.headGroup;
    h.position.set(0, HEAD_Y, HEAD_Z);
    this.group.add(h);

    // Cabeza y cachetes (los cachetes la hacen más ancha abajo, como un gato real)
    this.blob(this.fur, 0.22, [0, 0, 0], [1.1, 0.95, 1], h);
    for (const side of [-1, 1]) {
      this.blob(this.fur, 0.12, [side * 0.12, -0.07, 0.09], [1, 0.85, 1], h);
    }

    // "M" de gato atigrado en la frente
    const mGeo = new THREE.CapsuleGeometry(0.011, 0.055, 2, 6);
    const marks: [number, number, number][] = [
      [-0.055, 0.12, 0.3],
      [0, 0.135, 0],
      [0.055, 0.12, -0.3],
    ];
    for (const [x, y, rot] of marks) {
      const mark = new THREE.Mesh(mGeo, this.stripe);
      mark.position.set(x, y, 0.165);
      mark.rotation.set(-0.75, 0, rot);
      mark.scale.set(1, 1, 0.45);
      h.add(mark);
    }
    // Rayitas en los costados de la cara
    for (const side of [-1, 1]) {
      const cheekStripe = new THREE.Mesh(mGeo, this.stripe);
      cheekStripe.position.set(side * 0.205, -0.03, 0.07);
      cheekStripe.scale.set(1, 1, 0.5);
      cheekStripe.rotation.set(0, side * 0.5, side * 1.2);
      h.add(cheekStripe);
    }

    // Hocico blanco, mentón y nariz rosada
    for (const side of [-1, 1]) {
      this.blob(this.white, 0.065, [side * 0.048, -0.09, 0.19], [1, 0.85, 0.9], h);
    }
    this.blob(this.white, 0.055, [0, -0.14, 0.16], [1, 0.8, 1], h);
    this.blob(this.pink, 0.028, [0, -0.045, 0.235], [1.3, 0.8, 0.8], h);

    // Ojos almendrados con pupila vertical y brillito
    for (const side of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(side * 0.095, 0.03, 0.185);
      eye.rotation.set(0, side * 0.15, side * -0.15);
      this.blob(this.eyeMat, 0.054, [0, 0, 0], [1.15, 0.82, 0.5], eye);
      this.blob(this.pupilMat, 0.042, [0, 0, 0.01], [0.34, 0.88, 0.5], eye);
      this.blob(this.shineMat, 0.011, [0.015, 0.018, 0.025], [1, 1, 1], eye);
      h.add(eye);
      this.eyes.push(eye);
    }

    // Orejas: triángulos inclinados hacia afuera con interior rosado
    const earGeo = new THREE.ConeGeometry(0.095, 0.2, 4);
    const innerGeo = new THREE.ConeGeometry(0.055, 0.13, 4);
    for (const side of [-1, 1]) {
      const ear = new THREE.Group();
      ear.position.set(side * 0.13, 0.17, -0.02);
      ear.rotation.set(-0.15, 0, side * -0.32);
      const outer = new THREE.Mesh(earGeo, this.fur);
      outer.rotation.y = Math.PI / 4;
      outer.scale.set(1, 1, 0.55);
      ear.add(outer);
      const inner = new THREE.Mesh(innerGeo, this.pink);
      inner.rotation.y = Math.PI / 4;
      inner.scale.set(1, 1, 0.4);
      inner.position.set(0, -0.02, 0.03);
      ear.add(inner);
      h.add(ear);
    }
  }

  private buildLegs(): void {
    // Cada pata cuelga de un "hombro/cadera" (pivote) para que el paso gire desde arriba
    const legGeo = new THREE.CylinderGeometry(0.06, 0.052, 0.36, 8);
    const offsets: [number, number, boolean][] = [
      [-0.13, 0.3, true],
      [0.13, 0.3, true],
      [-0.14, -0.32, false],
      [0.14, -0.32, false],
    ];

    for (const [x, z, front] of offsets) {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.42, z);

      // Muslo redondeado en las patas de atrás
      if (!front) this.blob(this.fur, 0.12, [0, 0.02, 0], [0.85, 1.1, 1.2], pivot);

      const leg = new THREE.Mesh(legGeo, this.fur);
      leg.position.y = -0.2;
      pivot.add(leg);
      // Patita blanca
      this.blob(this.white, 0.068, [0, -0.39, 0.025], [1, 0.6, 1.3], pivot);

      this.group.add(pivot);
      this.legs.push(pivot);
    }
  }

  private buildTail(): void {
    // Cola larga en 6 partes que se afinan, con anillos atigrados y punta oscura
    let parent: THREE.Object3D = this.group;
    const count = 6;
    const segLen = 0.14;
    for (let i = 0; i < count; i++) {
      const pivot = new THREE.Group();
      if (i === 0) {
        pivot.position.set(0, 0.6, -0.5);
        pivot.rotation.x = 0.5;
      } else {
        pivot.position.set(0, 0, -segLen);
        pivot.rotation.x = 0.2;
      }
      const r0 = 0.055 - i * 0.006;
      const r1 = r0 - 0.006;
      const mat = i === count - 1 || i % 2 === 1 ? this.stripe : this.fur;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen + 0.03, 8), mat);
      // Bolita en la unión para que no se vean cortes al doblarse
      this.blob(mat, r0, [0, 0, 0], [1, 1, 1], pivot);
      seg.rotation.x = Math.PI / 2;
      seg.position.z = -segLen / 2;
      pivot.add(seg);
      parent.add(pivot);
      this.tailSegments.push(pivot);
      parent = pivot;
    }
    // Puntita redonda
    this.blob(this.stripe, 0.022, [0, 0, -segLen], [1, 1, 1], parent);
  }

  update(dt: number, moveX: number, moveZ: number): void {
    const mag = Math.hypot(moveX, moveZ);
    const isMoving = mag > 0.01;

    if (isMoving) {
      const nx = moveX / mag;
      const nz = moveZ / mag;

      this.group.position.x += nx * this.speed * dt;
      this.group.position.z += nz * this.speed * dt;

      // Rotar suavemente hacia la dirección de movimiento
      const targetAngle = Math.atan2(nx, nz);
      let diff = targetAngle - this.group.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.group.rotation.y += diff * Math.min(1, dt * 12);

      // Paso cruzado: pata delantera izquierda con trasera derecha
      this.walkTime += dt * 10;
      const swing = Math.sin(this.walkTime) * 0.55;
      this.legs[0].rotation.x = swing;
      this.legs[3].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.legs[2].rotation.x = -swing;
      this.group.position.y = Math.abs(Math.sin(this.walkTime)) * 0.04;
      this.headGroup.position.y = HEAD_Y + Math.sin(this.walkTime * 2) * 0.012;
      this.headGroup.rotation.x = 0;

      this.tailSegments.forEach((seg, i) => {
        seg.rotation.y = Math.sin(this.walkTime * 0.6 - i * 0.5) * 0.14;
      });
    } else {
      // Reposo: patas a neutro, respiración suave y la cola se mece
      this.idleTime += dt * 2.4;
      for (const leg of this.legs) leg.rotation.x *= 0.85;
      this.group.position.y *= 0.85;
      this.headGroup.position.y = HEAD_Y + Math.sin(this.idleTime * 0.6) * 0.01;
      this.headGroup.rotation.x = Math.sin(this.idleTime * 0.3) * 0.05;

      this.tailSegments.forEach((seg, i) => {
        seg.rotation.y = Math.sin(this.idleTime - i * 0.6) * (0.18 + i * 0.05);
      });
    }

    this.updateBlink(dt);
  }

  /** Parpadeo cada algunos segundos: los ojos se achatan y vuelven. */
  private updateBlink(dt: number): void {
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0 && this.blinkPhase === 0) {
      this.blinkPhase = 1;
    }
    if (this.blinkPhase > 0) {
      this.blinkPhase += dt * 9;
      const closed = Math.sin(Math.min(this.blinkPhase - 1, 1) * Math.PI);
      for (const eye of this.eyes) eye.scale.y = 1 - closed * 0.9;
      if (this.blinkPhase >= 2) {
        this.blinkPhase = 0;
        for (const eye of this.eyes) eye.scale.y = 1;
        this.blinkTimer = 2.5 + Math.random() * 3;
      }
    }
  }

  getPosition(): THREE.Vector3 {
    return this.group.position;
  }

  dispose(): void {
    const materials = new Set<THREE.Material>();
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => materials.add(m));
        } else {
          materials.add(obj.material);
        }
      }
    });
    materials.forEach((m) => m.dispose());
  }
}

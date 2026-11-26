import * as THREE from 'three';

/**
 * Gato provisorio construido con primitivas de Three.js:
 * pelaje gris atigrado con rayas oscuras, pecho y patitas blancas y cola larga.
 */
export class CatPlayer {
  readonly group = new THREE.Group();
  private legs: THREE.Mesh[] = [];
  private tailSegments: THREE.Group[] = [];
  private headGroup = new THREE.Group();
  private walkTime = 0;
  private idleTime = 0;

  private readonly speed = 5.4;

  constructor() {
    const furMat = new THREE.MeshLambertMaterial({ color: 0x7b7f8c });
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0x3e404a });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf4f3f7 });
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xfda4cf });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x15081c });

    // Cuerpo principal
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 1.05), furMat);
    body.position.set(0, 0.56, 0);
    this.group.add(body);

    // Rayas atigradas sobre el lomo
    for (let i = -1; i <= 1; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.14), stripeMat);
      stripe.position.set(0, 0.76, i * 0.28);
      this.group.add(stripe);
    }

    // Pecho blanco
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.22), whiteMat);
    chest.position.set(0, 0.52, 0.48);
    this.group.add(chest);

    // Cabeza
    this.headGroup.position.set(0, 0.88, 0.56);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.44, 0.46), furMat);
    this.headGroup.add(head);

    // Rayas en la frente
    for (let i = -1; i <= 1; i += 2) {
      const browStripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.22), stripeMat);
      browStripe.position.set(i * 0.11, 0.2, 0.08);
      this.headGroup.add(browStripe);
    }

    // Orejas + interior rosado
    const earGeo = new THREE.ConeGeometry(0.11, 0.22, 4);
    const innerEarGeo = new THREE.ConeGeometry(0.06, 0.14, 4);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, furMat);
      ear.position.set(side * 0.16, 0.31, -0.02);
      ear.rotation.y = Math.PI / 4;
      this.headGroup.add(ear);

      const inner = new THREE.Mesh(innerEarGeo, pinkMat);
      inner.position.set(side * 0.16, 0.29, 0.02);
      inner.rotation.y = Math.PI / 4;
      this.headGroup.add(inner);
    }

    // Hocico blanco y nariz rosada
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.1), whiteMat);
    muzzle.position.set(0, -0.07, 0.24);
    this.headGroup.add(muzzle);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.04), pinkMat);
    nose.position.set(0, -0.02, 0.29);
    this.headGroup.add(nose);

    // Ojos
    const eyeGeo = new THREE.BoxGeometry(0.09, 0.07, 0.03);
    const pupilGeo = new THREE.BoxGeometry(0.04, 0.06, 0.04);
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(side * 0.13, 0.05, 0.23);
      this.headGroup.add(eye);

      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(side * 0.13, 0.05, 0.235);
      this.headGroup.add(pupil);
    }

    this.group.add(this.headGroup);

    // 4 patas grises con patitas blancas
    const legGeo = new THREE.BoxGeometry(0.15, 0.32, 0.15);
    const pawGeo = new THREE.BoxGeometry(0.16, 0.09, 0.18);
    const legOffsets: [number, number][] = [
      [-0.18, 0.34],
      [0.18, 0.34],
      [-0.18, -0.34],
      [0.18, -0.34],
    ];

    for (const [lx, lz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, furMat);
      leg.position.set(lx, 0.22, lz);
      const paw = new THREE.Mesh(pawGeo, whiteMat);
      paw.position.set(0, -0.15, 0.02);
      leg.add(paw);
      this.group.add(leg);
      this.legs.push(leg);
    }

    // Cola larga articulada (3 segmentos)
    let parent: THREE.Object3D = this.group;
    const segSizes: [number, number, number][] = [
      [0.11, 0.11, 0.32],
      [0.09, 0.09, 0.3],
      [0.07, 0.07, 0.26],
    ];
    segSizes.forEach(([w, h, len], idx) => {
      const pivot = new THREE.Group();
      if (idx === 0) {
        pivot.position.set(0, 0.66, -0.52);
        pivot.rotation.x = 0.55;
      } else {
        pivot.position.set(0, 0, -0.28);
        pivot.rotation.x = 0.22;
      }
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, h, len), idx === 1 ? stripeMat : furMat);
      seg.position.set(0, 0, -len / 2);
      pivot.add(seg);
      parent.add(pivot);
      this.tailSegments.push(pivot);
      parent = pivot;
    });
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
      const current = this.group.rotation.y;
      let diff = targetAngle - current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.group.rotation.y += diff * Math.min(1, dt * 12);

      // Animación de caminata
      this.walkTime += dt * 10;
      const swing = Math.sin(this.walkTime) * 0.48;
      this.legs[0].rotation.x = swing;
      this.legs[3].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.legs[2].rotation.x = -swing;
      this.group.position.y = Math.abs(Math.sin(this.walkTime)) * 0.05;
      this.headGroup.position.y = 0.88 + Math.sin(this.walkTime * 2) * 0.015;

      // Cola acompañando suave
      this.tailSegments.forEach((seg, i) => {
        seg.rotation.y = Math.sin(this.walkTime * 0.6 - i * 0.5) * 0.16;
      });
    } else {
      // Reposo: piernas vuelven a neutro y la cola se mueve suave
      this.idleTime += dt * 2.4;
      for (const leg of this.legs) {
        leg.rotation.x *= 0.85;
      }
      this.group.position.y *= 0.85;
      this.headGroup.position.y = 0.88 + Math.sin(this.idleTime) * 0.012;

      this.tailSegments.forEach((seg, i) => {
        seg.rotation.y = Math.sin(this.idleTime - i * 0.65) * (0.24 + i * 0.08);
      });
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

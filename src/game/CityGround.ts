import * as THREE from 'three';
import {
  BACKGROUND_BLOCKS,
  GROUND_Y,
  PARKS,
  ROOFTOP_BUILDINGS,
  STREETS,
  carPlacements,
  fillerBlocks,
  insideAny,
  lampPositions,
  treePositions,
} from './cityLayout';

type Theme = 'dark' | 'light';

/** Colores por tema: [modo oscuro, modo claro]. */
const PALETTE = {
  ground: [0x2e2b3c, 0xc9bfc6],
  asphalt: [0x1c1b26, 0x77717f],
  dash: [0xb8b4a6, 0xf2efe6],
  grass: [0x2a4634, 0x86b27e],
  trunk: [0x4a3428, 0x7a5a44],
  crown: [0x335f42, 0x5f9a5c],
  pole: [0x24212f, 0x5a5266],
  lampHead: [0xffd98a, 0xf1e9d6],
  glass: [0x1a2230, 0x5d6b7d],
  tire: [0x111014, 0x2a2830],
  doorWood: [0x5a3a2a, 0x8a5a3c],
  doorFrame: [0x2e2747, 0x6a5a78],
} as const;

/**
 * Suelo de la ciudad bajo los techos: veredas, calles con líneas, plazas,
 * árboles, farolas, autos estacionados y puertas de los edificios.
 *
 * Todo lo que se repite (árboles, farolas, autos, líneas, puertas) usa
 * InstancedMesh: cientos de piezas iguales que la placa de video dibuja
 * con una sola orden, así la escena sigue liviana.
 */
export class CityGround {
  readonly group = new THREE.Group();
  private mats: Record<keyof typeof PALETTE, THREE.MeshLambertMaterial | THREE.MeshBasicMaterial>;

  constructor(theme: Theme) {
    this.mats = {
      ground: new THREE.MeshLambertMaterial(),
      asphalt: new THREE.MeshLambertMaterial(),
      dash: new THREE.MeshLambertMaterial(),
      grass: new THREE.MeshLambertMaterial(),
      trunk: new THREE.MeshLambertMaterial(),
      crown: new THREE.MeshLambertMaterial({ flatShading: true }),
      pole: new THREE.MeshLambertMaterial(),
      lampHead: new THREE.MeshBasicMaterial(),
      glass: new THREE.MeshLambertMaterial(),
      tire: new THREE.MeshLambertMaterial(),
      doorWood: new THREE.MeshLambertMaterial(),
      doorFrame: new THREE.MeshLambertMaterial(),
    };

    this.buildGround();
    this.buildStreets();
    this.buildParks();
    this.buildTrees();
    this.buildLamps();
    this.buildCars();
    this.buildDoors();
    this.updateTheme(theme);
  }

  updateTheme(theme: Theme): void {
    const i = theme === 'dark' ? 0 : 1;
    for (const key of Object.keys(PALETTE) as (keyof typeof PALETTE)[]) {
      this.mats[key].color.setHex(PALETTE[key][i]);
    }
  }

  /** Plano horizontal a una altura sobre el suelo (para que no "titile" con el de abajo). */
  private flatRect(minX: number, maxX: number, minZ: number, maxZ: number, lift: number, mat: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(maxX - minX, maxZ - minZ), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((minX + maxX) / 2, GROUND_Y + lift, (minZ + maxZ) / 2);
    this.group.add(mesh);
    return mesh;
  }

  private buildGround(): void {
    // Vereda/hormigón que cubre todo; la neblina lo funde con el horizonte
    this.flatRect(-220, 220, -220, 220, 0, this.mats.ground);
  }

  private buildStreets(): void {
    for (const s of STREETS) {
      this.flatRect(s.minX, s.maxX, s.minZ, s.maxZ, 0.02, this.mats.asphalt);
    }

    // Líneas punteadas en el centro de cada calle (salteando los cruces)
    const dashes: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    for (const s of STREETS) {
      const alongX = s.maxX - s.minX > s.maxZ - s.minZ;
      const cx = (s.minX + s.maxX) / 2;
      const cz = (s.minZ + s.maxZ) / 2;
      const others = STREETS.filter((o) => o !== s);
      for (let t = -110; t <= 110; t += 4.5) {
        const x = alongX ? t : cx;
        const z = alongX ? cz : t;
        if (insideAny(x, z, others, 1)) continue;
        q.copy(flat);
        if (!alongX) q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2));
        dashes.push(new THREE.Matrix4().compose(new THREE.Vector3(x, GROUND_Y + 0.04, z), q, new THREE.Vector3(1, 1, 1)));
      }
    }
    this.instanced(new THREE.PlaneGeometry(2, 0.18), this.mats.dash, dashes);
  }

  private buildParks(): void {
    for (const p of PARKS) {
      this.flatRect(p.minX, p.maxX, p.minZ, p.maxZ, 0.03, this.mats.grass);
    }
  }

  private buildTrees(): void {
    const trees = treePositions();
    const trunks: THREE.Matrix4[] = [];
    const crowns: THREE.Matrix4[] = [];
    const rand = seeded(5);

    for (const t of trees) {
      const s = t.scale;
      trunks.push(compose(t.x, GROUND_Y + 1 * s, t.z, 0, s));
      // Copa low-poly un poco achatada y girada distinto en cada árbol
      const crown = new THREE.Matrix4().compose(
        new THREE.Vector3(t.x, GROUND_Y + 2.9 * s, t.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 0.5, rand() * Math.PI * 2, 0)),
        new THREE.Vector3(s, s * 1.15, s)
      );
      crowns.push(crown);
    }

    this.instanced(new THREE.CylinderGeometry(0.16, 0.24, 2, 6), this.mats.trunk, trunks);
    this.instanced(new THREE.IcosahedronGeometry(1.45, 0), this.mats.crown, crowns);
  }

  private buildLamps(): void {
    const lamps = lampPositions();
    const poles: THREE.Matrix4[] = [];
    const arms: THREE.Matrix4[] = [];
    const heads: THREE.Matrix4[] = [];
    const height = 4.4;

    for (const l of lamps) {
      const base = compose(l.x, GROUND_Y, l.z, l.rotY, 1);
      poles.push(base.clone().multiply(new THREE.Matrix4().makeTranslation(0, height / 2, 0)));
      // Brazo que sale hacia la calle y la lámpara en la punta
      arms.push(base.clone().multiply(new THREE.Matrix4().makeTranslation(0, height - 0.05, 0.45)));
      heads.push(base.clone().multiply(new THREE.Matrix4().makeTranslation(0, height - 0.18, 0.85)));
    }

    this.instanced(new THREE.CylinderGeometry(0.07, 0.11, height, 6), this.mats.pole, poles);
    this.instanced(new THREE.BoxGeometry(0.08, 0.08, 0.95), this.mats.pole, arms);
    this.instanced(new THREE.BoxGeometry(0.42, 0.16, 0.32), this.mats.lampHead, heads);
  }

  private buildCars(): void {
    const cars = carPlacements();
    const bodies: THREE.Matrix4[] = [];
    const cabins: THREE.Matrix4[] = [];
    const wheels: THREE.Matrix4[] = [];
    const wheelTurn = new THREE.Matrix4().makeRotationZ(Math.PI / 2);

    for (const c of cars) {
      const base = compose(c.x, GROUND_Y, c.z, c.rotY, 1);
      bodies.push(base.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.62, 0)));
      cabins.push(base.clone().multiply(new THREE.Matrix4().makeTranslation(0, 1.12, -0.15)));
      for (const wx of [-0.86, 0.86]) {
        for (const wz of [-1.25, 1.25]) {
          wheels.push(
            base.clone().multiply(new THREE.Matrix4().makeTranslation(wx, 0.33, wz)).multiply(wheelTurn)
          );
        }
      }
    }

    // La carrocería usa un color por auto (instanceColor)
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const body = this.instanced(new THREE.BoxGeometry(1.8, 0.6, 3.9), bodyMat, bodies);
    cars.forEach((c, i) => body.setColorAt(i, new THREE.Color(c.color)));
    if (body.instanceColor) body.instanceColor.needsUpdate = true;

    this.instanced(new THREE.BoxGeometry(1.58, 0.5, 2.0), this.mats.glass, cabins);
    this.instanced(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 10), this.mats.tire, wheels);
  }

  /** Puerta con marco y escalón en el frente de cada edificio. */
  private buildDoors(): void {
    const frames: THREE.Matrix4[] = [];
    const leaves: THREE.Matrix4[] = [];
    const steps: THREE.Matrix4[] = [];

    const fronts: [number, number][] = [
      ...ROOFTOP_BUILDINGS.map(([x, z, , d]) => [x, z + d / 2] as [number, number]),
      ...[...BACKGROUND_BLOCKS, ...fillerBlocks()].map(([x, z, , d]) => [x, z + d / 2] as [number, number]),
    ];
    for (const [x, frontZ] of fronts) {
      frames.push(compose(x, GROUND_Y + 1.45, frontZ + 0.05, 0, 1));
      leaves.push(compose(x, GROUND_Y + 1.32, frontZ + 0.12, 0, 1));
      steps.push(compose(x, GROUND_Y + 0.1, frontZ + 0.35, 0, 1));
    }

    this.instanced(new THREE.BoxGeometry(1.8, 2.9, 0.12), this.mats.doorFrame, frames);
    this.instanced(new THREE.BoxGeometry(1.35, 2.55, 0.1), this.mats.doorWood, leaves);
    this.instanced(new THREE.BoxGeometry(2.2, 0.2, 0.7), this.mats.doorFrame, steps);
  }

  private instanced(geo: THREE.BufferGeometry, mat: THREE.Material, matrices: THREE.Matrix4[]): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geo, mat, matrices.length);
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
    return mesh;
  }
}

function compose(x: number, y: number, z: number, rotY: number, scale: number): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
    new THREE.Vector3(scale, scale, scale)
  );
}

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Plano de la ciudad (lógica pura, sin Three.js): calles, edificios, plazas y
 * dónde van árboles, farolas y autos. Al estar separado se puede testear que
 * nada quede en un lugar imposible (un árbol en la calle, un auto en una vereda…).
 *
 * Vista desde arriba: X es izquierda/derecha y Z es adelante (+) / atrás (−).
 * Los techos por los que camina el gato están en el centro, alrededor de z = 0.
 */

/** Altura del suelo de la calle (los techos caminables están en y = 0). */
export const GROUND_Y = -16;

export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Edificio como caja: centro (x, z), ancho, profundidad y alto. */
export type BlockSpec = [x: number, z: number, w: number, d: number, h: number];

/** Los 3 edificios con techo caminable (centro x, z, ancho, profundidad). */
export const ROOFTOP_BUILDINGS: [number, number, number, number][] = [
  [0, 0, 15.2, 11.2],
  [-16, 0, 9.6, 10.2],
  [16, 0, 9.6, 10.2],
];
/** Cuánto sobresale el faldón de la mansarda por fuera de las paredes. */
const MANSARD_OVERHANG = 0.55;

/** Edificios del fondo y de los costados (la altura se mide desde el suelo). */
export const BACKGROUND_BLOCKS: BlockSpec[] = [
  // Detrás de la calle de atrás
  [-15, -30, 11, 8, 26],
  [-2, -32, 10, 8, 24],
  [12, -31, 12, 8, 27],
  [-35, -26, 9, 8, 22],
  [-48, -29, 12, 8, 25],
  [35, -25, 9, 9, 21],
  [48, -28, 12, 8, 24],
  // A los costados, pasando las calles transversales
  [37, -2, 9, 12, 19],
  [-52, -1, 10, 12, 20],
];

const FAR = 220;
export const STREETS: Rect[] = [
  // Calle de adelante (frente de los edificios con techo)
  { minX: -FAR, maxX: FAR, minZ: 9, maxZ: 16 },
  // Calle de atrás
  { minX: -FAR, maxX: FAR, minZ: -17.5, maxZ: -10.5 },
  // Calles transversales a cada lado
  { minX: -29.5, maxX: -22.5, minZ: -FAR, maxZ: FAR },
  { minX: 22.5, maxX: 29.5, minZ: -FAR, maxZ: FAR },
  // Calle lejana (detrás de la primera fila del fondo) y transversales más afuera
  { minX: -FAR, maxX: FAR, minZ: -50, maxZ: -43 },
  { minX: -71, maxX: -64, minZ: -FAR, maxZ: FAR },
  { minX: 64, maxX: 71, minZ: -FAR, maxZ: FAR },
];

export const PARKS: Rect[] = [
  { minX: -45, maxX: -31, minZ: -9, maxZ: 7.5 },
  { minX: 43, maxX: 62, minZ: -9, maxZ: 7.5 },
];

function blockRect([x, z, w, d]: readonly number[]): Rect {
  return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
}

/** Huellas de todos los edificios (incluye el alero de las mansardas). */
export const BUILDINGS: Rect[] = [
  ...ROOFTOP_BUILDINGS.map(([x, z, w, d]) =>
    blockRect([x, z, w + MANSARD_OVERHANG * 2, d + MANSARD_OVERHANG * 2])
  ),
  ...BACKGROUND_BLOCKS.map((b) => blockRect(b)),
];

export function blockToRect(b: BlockSpec): Rect {
  return blockRect(b);
}

/** ¿Se superponen dos rectángulos? (con margen opcional alrededor de `a`) */
export function overlaps(a: Rect, b: Rect, margin = 0): boolean {
  return (
    a.minX - margin < b.maxX && a.maxX + margin > b.minX && a.minZ - margin < b.maxZ && a.maxZ + margin > b.minZ
  );
}

/** Lugar que ocupa la torre del fondo (no se construye encima). */
const TOWER_RECT: Rect = { minX: -17.5, maxX: -10.5, minZ: -39.5, maxZ: -32.5 };

/**
 * Manzanas de relleno: edificios en el borde de cada manzana (los del medio no se
 * verían) para que las calles se pierdan entre edificios en perspectiva.
 * Se dejan 3 unidades de vereda entre la calle y las fachadas.
 */
export function fillerBlocks(): BlockSpec[] {
  const rand = seededRandom(313);
  const sidewalk = 3;
  // Franjas libres entre calles (en X y en Z). Solo hacia atrás y los costados:
  // adelante queda detrás de la cámara.
  const xCells: [number, number][] = [
    [-200, -71],
    [-64, -29.5],
    [-22.5, 22.5],
    [29.5, 64],
    [71, 200],
  ];
  const zCells: [number, number][] = [
    [-200, -50],
    [-43, -17.5],
    [-10.5, 9],
  ];

  const placed: Rect[] = [];
  const result: BlockSpec[] = [];

  const tryPlace = (cell: Rect, x: number, z: number, w: number, d: number) => {
    const r = blockRect([x, z, w, d]);
    const fits = r.minX >= cell.minX && r.maxX <= cell.maxX && r.minZ >= cell.minZ && r.maxZ <= cell.maxZ;
    if (!fits) return;
    if (placed.some((p) => overlaps(r, p, 0.4))) return;
    if (BUILDINGS.some((b) => overlaps(r, b, 1))) return;
    if (PARKS.some((p) => overlaps(r, p, 1))) return;
    if (overlaps(r, TOWER_RECT)) return;
    placed.push(r);
    result.push([x, z, w, d, 14 + rand() * 20]);
  };

  for (const [x0, x1] of xCells) {
    for (const [z0, z1] of zCells) {
      // La manzana del centro es la de los techos del gato
      if (x0 === -22.5 && z0 === -10.5) continue;
      const cell: Rect = { minX: x0 + sidewalk, maxX: x1 - sidewalk, minZ: z0 + sidewalk, maxZ: z1 - sidewalk };

      // Borde de adelante y de atrás (fachadas a lo largo de X)
      for (const edge of ['front', 'back'] as const) {
        let x = cell.minX;
        while (x < cell.maxX) {
          const w = 7 + rand() * 5;
          const d = 8 + rand() * 4;
          const z = edge === 'front' ? cell.maxZ - d / 2 : cell.minZ + d / 2;
          tryPlace(cell, x + w / 2, z, w, d);
          x += w + 0.8;
        }
      }
      // Bordes laterales (fachadas a lo largo de Z)
      for (const edge of ['left', 'right'] as const) {
        let z = cell.minZ;
        while (z < cell.maxZ) {
          const d = 7 + rand() * 5;
          const w = 8 + rand() * 4;
          const x = edge === 'left' ? cell.minX + w / 2 : cell.maxX - w / 2;
          tryPlace(cell, x, z + d / 2, w, d);
          z += d + 0.8;
        }
      }
    }
  }
  return result;
}

/** Todos los edificios que ocupan lugar (para que árboles y farolas no caigan adentro). */
let allBuildingsCache: Rect[] | null = null;
function allBuildings(): Rect[] {
  allBuildingsCache ??= [...BUILDINGS, ...fillerBlocks().map(blockRect)];
  return allBuildingsCache;
}

export function insideAny(x: number, z: number, rects: Rect[], margin = 0): boolean {
  return rects.some(
    (r) => x >= r.minX - margin && x <= r.maxX + margin && z >= r.minZ - margin && z <= r.maxZ + margin
  );
}

/** Números "al azar" pero siempre iguales (misma semilla → misma ciudad). */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export interface TreeSpot {
  x: number;
  z: number;
  scale: number;
}

export function treePositions(): TreeSpot[] {
  const rand = seededRandom(97);
  const candidates: { x: number; z: number }[] = [];

  // Plazas: árboles repartidos
  for (const p of PARKS) {
    for (let i = 0; i < 14; i++) {
      candidates.push({
        x: p.minX + 1.2 + rand() * (p.maxX - p.minX - 2.4),
        z: p.minZ + 1.2 + rand() * (p.maxZ - p.minZ - 2.4),
      });
    }
  }
  // Veredas de la calle de atrás
  for (let x = -20; x <= 20; x += 5) candidates.push({ x, z: -9.2 });
  for (let x = -60; x <= 60; x += 7) candidates.push({ x: x + 2, z: -18.8 });
  // Vereda de enfrente de la calle de adelante
  for (let x = -60; x <= 60; x += 8) candidates.push({ x, z: 17.4 });
  // Veredas exteriores de las transversales
  for (let z = -40; z <= 30; z += 6) {
    candidates.push({ x: -31, z }, { x: 31, z });
  }

  return candidates
    .filter((c) => !insideAny(c.x, c.z, STREETS, 0.6) && !insideAny(c.x, c.z, allBuildings(), 1))
    .map((c) => ({ ...c, scale: 0.8 + rand() * 0.45 }));
}

export interface LampSpot {
  x: number;
  z: number;
  /** Hacia dónde apunta el brazo de la farola (hacia la calle). */
  rotY: number;
}

export function lampPositions(): LampSpot[] {
  const gap = 0.8;
  const spots: LampSpot[] = [];
  const TO_MINUS_Z = Math.PI;
  const TO_PLUS_Z = 0;
  const TO_PLUS_X = Math.PI / 2;
  const TO_MINUS_X = -Math.PI / 2;

  for (let x = -60; x <= 60; x += 12) {
    // Calle de atrás: una vereda a cada lado
    spots.push({ x, z: -10.5 + gap, rotY: TO_MINUS_Z });
    spots.push({ x: x + 6, z: -17.5 - gap, rotY: TO_PLUS_Z });
    // Calle de adelante
    spots.push({ x: x + 3, z: 9 - gap, rotY: TO_PLUS_Z });
    spots.push({ x: x + 9, z: 16 + gap, rotY: TO_MINUS_Z });
  }
  for (let z = -40; z <= 30; z += 12) {
    spots.push({ x: -29.5 - gap, z, rotY: TO_PLUS_X });
    spots.push({ x: 29.5 + gap, z: z + 6, rotY: TO_MINUS_X });
  }

  return spots.filter((s) => !insideAny(s.x, s.z, STREETS) && !insideAny(s.x, s.z, allBuildings(), 0.3));
}

export interface CarSpot {
  x: number;
  z: number;
  rotY: number;
  color: number;
}

/** Autos estacionados junto al cordón, con colores apagados para no competir con la escena. */
export function carPlacements(): CarSpot[] {
  const ALONG_X = Math.PI / 2;
  return [
    { x: -15, z: -11.6, rotY: ALONG_X, color: 0x8c3a3f },
    { x: -3, z: -11.6, rotY: ALONG_X, color: 0xd9d4c7 },
    { x: 13, z: -11.6, rotY: -ALONG_X, color: 0x3a5f86 },
    { x: -8, z: -16.4, rotY: -ALONG_X, color: 0x4a4a52 },
    { x: 6, z: -16.4, rotY: ALONG_X, color: 0x6b8f71 },
    { x: 18, z: -16.4, rotY: -ALONG_X, color: 0xc9a23a },
    { x: -23.6, z: -2, rotY: 0, color: 0x2f3e5c },
    { x: 28.4, z: 3, rotY: Math.PI, color: 0xa65d3b },
    { x: -10, z: 10.1, rotY: ALONG_X, color: 0x7a6a8c },
    { x: 9, z: 14.9, rotY: -ALONG_X, color: 0xd9d4c7 },
  ];
}

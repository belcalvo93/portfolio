/**
 * Por dónde puede caminar el gato (lógica pura, sin Three.js).
 *
 * Además de no salirse de los techos y puentes, el gato tiene "cuerpo":
 * no se acerca a una baranda a menos de CAT_RADIUS, así no queda
 * atravesándola con la panza.
 */

export interface WalkRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const WALK_ZONES: WalkRect[] = [
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

/** Puentes de madera: centro (cx, cz), largo (w, en X) y ancho (d, en Z). */
export const BRIDGES = [
  { cx: -9.4, cz: 0, w: 4.4, d: 3.2 },
  { cx: 9.4, cz: 0, w: 4.4, d: 3.2 },
];

/** Las barandas van a 0.25 del borde del tablado y cubren casi todo el largo. */
export function railZOffset(d: number): number {
  return (d - 0.5) / 2 - 0.02;
}

export const BRIDGE_RAILS: { minX: number; maxX: number; z: number }[] = BRIDGES.flatMap((b) =>
  [1, -1].map((side) => ({
    minX: b.cx - b.w / 2,
    maxX: b.cx + b.w / 2,
    z: b.cz + side * railZOffset(b.d),
  }))
);

/** Medio ancho del cuerpo del gato (más un poquito de aire). */
export const CAT_RADIUS = 0.45;

/** Buhardillas (habitaciones con ventana): una por sección, mirando hacia +Z. */
export const DORMERS: { id: string; x: number; z: number }[] = [
  { id: 'projects', x: -3.0, z: -4.2 },
  { id: 'technologies', x: 3.4, z: -4.2 },
  { id: 'education', x: -16.0, z: -3.8 },
  { id: 'achievements', x: 14.4, z: -3.8 },
  { id: 'contact', x: 17.6, z: 3.1 },
];

/** Chimeneas (posición absoluta sobre los techos). */
export const CHIMNEYS: [number, number][] = [
  [-6.2, 3.8],
  [6.2, -3.4],
  [-19.1, 3.3],
  [19.1, -3.2],
];

/** Medidas de la base de cada obstáculo (lo que el gato tocaría al caminar). */
export const DORMER_SIZE = { w: 2.1, d: 1.65, frontExtra: 0.13 };
export const CHIMNEY_SIZE = { w: 1.0, d: 0.8 };

export const OBSTACLES: WalkRect[] = [
  ...DORMERS.map((d) => ({
    minX: d.x - DORMER_SIZE.w / 2,
    maxX: d.x + DORMER_SIZE.w / 2,
    minZ: d.z - DORMER_SIZE.d / 2,
    // El marco de la ventana sobresale un poco al frente
    maxZ: d.z + DORMER_SIZE.d / 2 + DORMER_SIZE.frontExtra,
  })),
  ...CHIMNEYS.map(([x, z]) => ({
    minX: x - CHIMNEY_SIZE.w / 2,
    maxX: x + CHIMNEY_SIZE.w / 2,
    minZ: z - CHIMNEY_SIZE.d / 2,
    maxZ: z + CHIMNEY_SIZE.d / 2,
  })),
];

/** Si el gato se metió en un obstáculo, lo saca por el costado más cercano donde pueda pararse. */
function pushOutOfObstacles(p: { x: number; z: number }): void {
  for (const o of OBSTACLES) {
    const minX = o.minX - CAT_RADIUS;
    const maxX = o.maxX + CAT_RADIUS;
    const minZ = o.minZ - CAT_RADIUS;
    const maxZ = o.maxZ + CAT_RADIUS;
    if (p.x <= minX || p.x >= maxX || p.z <= minZ || p.z >= maxZ) continue;

    const options = [
      { x: minX, z: p.z, dist: p.x - minX },
      { x: maxX, z: p.z, dist: maxX - p.x },
      { x: p.x, z: minZ, dist: p.z - minZ },
      { x: p.x, z: maxZ, dist: maxZ - p.z },
    ].sort((a, b) => a.dist - b.dist);
    const best = options.find((c) => isWalkable(c.x, c.z)) ?? options[0];
    p.x = best.x;
    p.z = best.z;
  }
}

function inside(x: number, z: number, r: WalkRect): boolean {
  return x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;
}

function isWalkable(x: number, z: number): boolean {
  return WALK_ZONES.some((zone) => inside(x, z, zone));
}

/** Lleva un punto al lugar caminable más cercano (sin mirar barandas). */
function clampToZones(x: number, z: number): { x: number; z: number } {
  if (isWalkable(x, z)) return { x, z };

  let best = { x, z };
  let bestDist = Infinity;
  for (const zone of WALK_ZONES) {
    const cx = Math.max(zone.minX, Math.min(zone.maxX, x));
    const cz = Math.max(zone.minZ, Math.min(zone.maxZ, z));
    const dist = (x - cx) ** 2 + (z - cz) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = { x: cx, z: cz };
    }
  }
  return best;
}

/** Posición válida para el gato: dentro de techos/puentes y sin atravesar barandas. */
export function clampToWalkArea(x: number, z: number): { x: number; z: number } {
  const p = clampToZones(x, z);
  pushOutOfObstacles(p);

  for (const rail of BRIDGE_RAILS) {
    const nearAlong = p.x >= rail.minX - CAT_RADIUS && p.x <= rail.maxX + CAT_RADIUS;
    const gap = p.z - rail.z;
    if (!nearAlong || Math.abs(gap) >= CAT_RADIUS) continue;

    // Dos opciones: quedarse del lado de adentro del puente o del lado de afuera
    const outward = Math.sign(rail.z) || 1;
    const insideZ = rail.z - outward * CAT_RADIUS;
    const outsideZ = rail.z + outward * CAT_RADIUS;
    const outsideOk = isWalkable(p.x, outsideZ);
    const useOutside = outsideOk && Math.abs(p.z - outsideZ) < Math.abs(p.z - insideZ);
    p.z = useOutside ? outsideZ : insideZ;
  }
  return p;
}

/**
 * Lógica pura (sin Three.js) para que el gato se acerque y entre por las ventanas.
 * Al no depender de la escena, se puede testear con Vitest.
 */

export interface Point2 {
  x: number;
  z: number;
}

export interface Point3 extends Point2 {
  y: number;
}

export interface WindowAnchor extends Point2 {
  id: string;
}

/** Cuánto se separa del frente de la buhardilla el lugar donde se para el gato. */
export const APPROACH_DISTANCE = 1.7;
/** Radio alrededor de ese lugar en el que se ofrece "Entrar". */
export const ENTER_RADIUS = 1.6;
/** Altura máxima extra del salto. */
const HOP_ARC = 0.8;

/** Punto del techo justo frente a la ventana (las ventanas miran hacia +Z). */
export function getApproachPoint(win: Point2, distance = APPROACH_DISTANCE): Point2 {
  return { x: win.x, z: win.z + distance };
}

/** Devuelve el id de la ventana más cercana al gato, o null si ninguna está en rango. */
export function findNearestWindow(
  cat: Point2,
  windows: WindowAnchor[],
  radius = ENTER_RADIUS
): string | null {
  let bestId: string | null = null;
  let bestDist = radius;

  for (const win of windows) {
    // Si el gato está detrás de la buhardilla no ve la ventana
    if (cat.z < win.z) continue;

    const spot = getApproachPoint(win);
    const dist = Math.hypot(cat.x - spot.x, cat.z - spot.z);
    if (dist <= bestDist) {
      bestDist = dist;
      bestId = win.id;
    }
  }
  return bestId;
}

/**
 * Posición del gato durante un salto de `from` a `to`.
 * `t` va de 0 a 1; el recorrido hace un arco (parábola) hacia arriba.
 */
export function hopPosition(from: Point3, to: Point3, t: number): Point3 {
  if (t <= 0) return { ...from };
  if (t >= 1) return { ...to };

  const arc = 4 * t * (1 - t) * HOP_ARC;
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t + arc,
    z: from.z + (to.z - from.z) * t,
  };
}

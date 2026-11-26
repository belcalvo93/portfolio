/**
 * "Vida" de la ciudad (lógica pura, sin Three.js):
 * - luces de ventanas que se prenden y apagan de a poco, como gente que llega o se va a dormir;
 * - colores variados para las fachadas, porque una ciudad real no es de un solo color.
 */

type Theme = 'dark' | 'light';

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Cuántas variantes de tono hay para las ventanas (luz cálida, blanca, "tele", etc.). */
export const WINDOW_TINTS = 5;

/**
 * Tiempos de las luces (en segundos). Cada ventana "habitada" se queda prendida
 * un rato, después se apaga otro rato más largo, y así: se van turnando.
 */
export const LIGHT_TIMING = {
  onMin: 30,
  onMax: 70,
  offMin: 90,
  offMax: 210,
  /** Cuánto tarda en prenderse o apagarse del todo (fundido). */
  fade: 1.2,
  /** Parte de las ventanas que nunca se prende (departamentos vacíos). */
  alwaysDark: 0.35,
} as const;

/**
 * Luces de muchas ventanas. Cada una tiene su propio reloj:
 * prendida entre onMin y onMax segundos, apagada entre offMin y offMax.
 * Así ninguna queda prendida para siempre y, en promedio, hay pocas
 * encendidas a la vez. Algunas ventanas están siempre apagadas.
 * `level` va de 0 (apagada) a 1 (prendida) y cambia de a poco (fundido).
 */
export class WindowLights {
  readonly lit: boolean[];
  readonly level: Float32Array;
  readonly alwaysDark: boolean[];
  /** Tono de cada ventana (0 … WINDOW_TINTS − 1). */
  readonly tint: number[];
  private readonly timer: Float32Array;
  private rand: () => number;

  constructor(count: number, seed: number) {
    const T = LIGHT_TIMING;
    this.rand = seededRandom(seed);
    this.alwaysDark = Array.from({ length: count }, () => this.rand() < T.alwaysDark);
    this.tint = Array.from({ length: count }, () => Math.floor(this.rand() * WINDOW_TINTS));

    // Arranque: cada ventana habitada está en un momento distinto de su ciclo
    const meanOn = (T.onMin + T.onMax) / 2;
    const meanOff = (T.offMin + T.offMax) / 2;
    const onChance = meanOn / (meanOn + meanOff);
    this.lit = this.alwaysDark.map((dark) => !dark && this.rand() < onChance);
    this.level = Float32Array.from(this.lit, (v) => (v ? 1 : 0));
    this.timer = Float32Array.from(this.lit, (v) => this.rand() * this.duration(v));
  }

  private duration(on: boolean): number {
    const T = LIGHT_TIMING;
    return on ? T.onMin + this.rand() * (T.onMax - T.onMin) : T.offMin + this.rand() * (T.offMax - T.offMin);
  }

  /** Avanza el tiempo `dt` segundos y devuelve qué ventanas cambiaron de brillo. */
  step(dt: number): number[] {
    const changed: number[] = [];
    const fadeStep = dt / LIGHT_TIMING.fade;

    for (let i = 0; i < this.lit.length; i++) {
      if (this.alwaysDark[i]) continue;

      this.timer[i] -= dt;
      if (this.timer[i] <= 0) {
        this.lit[i] = !this.lit[i];
        this.timer[i] = this.duration(this.lit[i]);
      }

      const target = this.lit[i] ? 1 : 0;
      const current = this.level[i];
      if (current !== target) {
        this.level[i] = target > current ? Math.min(1, current + fadeStep) : Math.max(0, current - fadeStep);
        changed.push(i);
      }
    }
    return changed;
  }
}

/**
 * Colores de ventana por tema. De noche: apagadas casi negras y encendidas en
 * distintos tonos de luz. De día: vidrio con reflejos levemente distintos.
 */
const WINDOW_PALETTE = {
  dark: {
    off: [0x0e0c1e, 0x110f24, 0x0c0b1a, 0x14112a, 0x0f0d20],
    on: [0xffd27a, 0xffe1a6, 0xf6b85e, 0xfff0c8, 0x9db6ff],
  },
  light: {
    off: [0x6a5a80, 0x75688f, 0x62577a, 0x7b7196, 0x5d5374],
    on: [0x8f7fa4, 0x9a8bae, 0x887a9e, 0xa294b5, 0x8a85aa],
  },
} as const;

export function windowColor(lit: boolean, tint: number, theme: Theme): number {
  const set = WINDOW_PALETTE[theme];
  const t = ((tint % WINDOW_TINTS) + WINDOW_TINTS) % WINDOW_TINTS;
  return lit ? set.on[t] : set.off[t];
}

/** Color de una ventana a mitad de prenderse: mezcla entre apagada (0) y prendida (1). */
export function windowColorMix(level: number, tint: number, theme: Theme): number {
  const off = windowColor(false, tint, theme);
  const on = windowColor(true, tint, theme);
  if (level <= 0) return off;
  if (level >= 1) return on;
  let out = 0;
  for (const shift of [16, 8, 0]) {
    const a = (off >> shift) & 255;
    const b = (on >> shift) & 255;
    out |= Math.round(a + (b - a) * level) << shift;
  }
  return out;
}

/**
 * Fachadas: de día una paleta de ciudad real (crema, beige, terracota,
 * rosado viejo, ocre, grises); de noche variantes oscuras con matices.
 * El mismo edificio usa la misma posición en las dos paletas.
 */
const FACADE_PALETTE = {
  light: [0xe6d8c6, 0xd9c2a6, 0xcf9d82, 0xd6adb1, 0xc9c3cc, 0xa9b3c5, 0xd6b67e, 0xc4b0cf, 0xcdbb9e, 0xb9a7a0],
  dark: [0x2a2650, 0x2e2a52, 0x332845, 0x24294a, 0x2c223c, 0x35294d, 0x222746, 0x2b2a4c, 0x30283f, 0x272442],
} as const;

export function buildingColors(count: number, theme: Theme, seed = 41): number[] {
  const rand = seededRandom(seed);
  const palette = FACADE_PALETTE[theme];
  return Array.from({ length: count }, () => palette[Math.floor(rand() * palette.length)]);
}

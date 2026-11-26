import { describe, expect, it } from 'vitest';
import { BRIDGE_RAILS, CAT_RADIUS, CHIMNEYS, DORMERS, OBSTACLES, clampToWalkArea } from './walkArea';

const railZ = BRIDGE_RAILS[0].z; // baranda de un lado (el otro es simétrico)

describe('obstáculos del techo (buhardillas y chimeneas)', () => {
  const isClear = (p: { x: number; z: number }) =>
    OBSTACLES.every(
      (o) =>
        p.x <= o.minX - CAT_RADIUS + 1e-9 ||
        p.x >= o.maxX + CAT_RADIUS - 1e-9 ||
        p.z <= o.minZ - CAT_RADIUS + 1e-9 ||
        p.z >= o.maxZ + CAT_RADIUS - 1e-9
    );

  it('hay un obstáculo por cada buhardilla y cada chimenea', () => {
    expect(OBSTACLES.length).toBe(DORMERS.length + CHIMNEYS.length);
  });

  it('el gato no puede quedar adentro de una buhardilla', () => {
    for (const d of DORMERS) {
      const p = clampToWalkArea(d.x, d.z);
      expect(isClear(p)).toBe(true);
    }
  });

  it('el gato no puede quedar adentro de una chimenea', () => {
    for (const [x, z] of CHIMNEYS) {
      const p = clampToWalkArea(x + 0.1, z);
      expect(isClear(p)).toBe(true);
    }
  });

  it('pegado al costado de una buhardilla, lo corre lo justo hacia afuera', () => {
    const d = DORMERS[0];
    const p = clampToWalkArea(d.x + 1.1, d.z);
    expect(isClear(p)).toBe(true);
    expect(Math.abs(p.x - (d.x + 1.1))).toBeLessThan(0.6);
  });

  it('el lugar para entrar frente a cada ventana queda libre', () => {
    for (const d of DORMERS) {
      const spot = { x: d.x, z: d.z + 1.7 };
      expect(clampToWalkArea(spot.x, spot.z)).toEqual(spot);
    }
  });
});

describe('clampToWalkArea', () => {
  it('deja quieto al gato en el medio del techo', () => {
    expect(clampToWalkArea(0, 2)).toEqual({ x: 0, z: 2 });
  });

  it('deja quieto al gato en el centro del puente', () => {
    expect(clampToWalkArea(9.4, 0)).toEqual({ x: 9.4, z: 0 });
  });

  it('si el gato pisa justo la baranda del puente, lo corre hacia adentro', () => {
    const p = clampToWalkArea(9.4, railZ);
    expect(Math.abs(p.z - railZ)).toBeGreaterThanOrEqual(CAT_RADIUS - 1e-9);
    expect(Math.abs(p.z)).toBeLessThan(Math.abs(railZ));
  });

  it('funciona igual del otro lado y en el otro puente', () => {
    const p = clampToWalkArea(-9.4, -railZ + 0.1);
    expect(Math.abs(p.z - -railZ)).toBeGreaterThanOrEqual(CAT_RADIUS - 1e-9);
    expect(p.z).toBeGreaterThan(-railZ);
  });

  it('en el techo, cerca de donde empieza la baranda, tampoco se la clava', () => {
    // Borde del techo central, a la altura de la baranda
    const p = clampToWalkArea(7.4, railZ - 0.1);
    expect(Math.abs(p.z - railZ)).toBeGreaterThanOrEqual(CAT_RADIUS - 1e-9);
  });

  it('en el techo, lejos de los puentes, puede ir pegado al borde', () => {
    expect(clampToWalkArea(0, 5.3)).toEqual({ x: 0, z: 5.3 });
  });

  it('si el toque cae fuera de los techos, lo trae al punto caminable más cercano', () => {
    const p = clampToWalkArea(0, 9);
    expect(p.x).toBe(0);
    expect(p.z).toBeLessThan(6);
  });
});

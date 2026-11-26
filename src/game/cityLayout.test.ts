import { describe, expect, it } from 'vitest';
import {
  BUILDINGS,
  PARKS,
  STREETS,
  blockToRect,
  carPlacements,
  fillerBlocks,
  insideAny,
  overlaps,
  lampPositions,
  treePositions,
} from './cityLayout';

describe('insideAny', () => {
  const rects = [{ minX: 0, maxX: 2, minZ: 0, maxZ: 2 }];

  it('detecta un punto adentro', () => {
    expect(insideAny(1, 1, rects)).toBe(true);
  });

  it('detecta un punto afuera', () => {
    expect(insideAny(3, 1, rects)).toBe(false);
  });

  it('el margen agranda el rectángulo', () => {
    expect(insideAny(2.5, 1, rects, 0.6)).toBe(true);
  });
});

describe('el plano de la ciudad', () => {
  it('ningún edificio pisa una calle', () => {
    for (const b of BUILDINGS) {
      for (const corner of [
        [b.minX, b.minZ],
        [b.maxX, b.maxZ],
        [(b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2],
      ]) {
        expect(insideAny(corner[0], corner[1], STREETS)).toBe(false);
      }
    }
  });

  it('las plazas no pisan calles ni edificios', () => {
    for (const p of PARKS) {
      const c = { x: (p.minX + p.maxX) / 2, z: (p.minZ + p.maxZ) / 2 };
      expect(insideAny(c.x, c.z, STREETS)).toBe(false);
      expect(insideAny(c.x, c.z, BUILDINGS)).toBe(false);
    }
  });
});

describe('treePositions', () => {
  const trees = treePositions();

  it('hay árboles', () => {
    expect(trees.length).toBeGreaterThan(20);
  });

  it('ningún árbol queda en la calle ni dentro de un edificio', () => {
    for (const t of trees) {
      expect(insideAny(t.x, t.z, STREETS, 0.6)).toBe(false);
      expect(insideAny(t.x, t.z, BUILDINGS, 1)).toBe(false);
    }
  });

  it('siempre da el mismo resultado (no cambia en cada carga)', () => {
    expect(treePositions()).toEqual(trees);
  });
});

describe('lampPositions', () => {
  const lamps = lampPositions();

  it('hay farolas', () => {
    expect(lamps.length).toBeGreaterThan(10);
  });

  it('están en la vereda: cerca de una calle pero no sobre ella ni en un edificio', () => {
    for (const l of lamps) {
      expect(insideAny(l.x, l.z, STREETS)).toBe(false);
      expect(insideAny(l.x, l.z, STREETS, 1.2)).toBe(true);
      expect(insideAny(l.x, l.z, BUILDINGS, 0.3)).toBe(false);
    }
  });
});

describe('fillerBlocks (manzanas de relleno)', () => {
  const fillers = fillerBlocks().map(blockToRect);

  it('hay muchos edificios para llenar la ciudad en perspectiva', () => {
    expect(fillers.length).toBeGreaterThan(40);
  });

  it('hay edificios a los dos costados (izquierda y derecha)', () => {
    expect(fillers.some((f) => f.maxX < -30)).toBe(true);
    expect(fillers.some((f) => f.minX > 30)).toBe(true);
  });

  it('ninguno pisa una calle, una plaza ni un edificio que ya existía', () => {
    for (const f of fillers) {
      for (const s of STREETS) expect(overlaps(f, s)).toBe(false);
      for (const p of PARKS) expect(overlaps(f, p)).toBe(false);
      for (const b of BUILDINGS) expect(overlaps(f, b)).toBe(false);
    }
  });

  it('no se superponen entre ellos', () => {
    for (let i = 0; i < fillers.length; i++) {
      for (let j = i + 1; j < fillers.length; j++) {
        expect(overlaps(fillers[i], fillers[j])).toBe(false);
      }
    }
  });

  it('los árboles y las farolas tampoco quedan dentro de ellos', () => {
    for (const t of treePositions()) expect(insideAny(t.x, t.z, fillers, 0.8)).toBe(false);
    for (const l of lampPositions()) expect(insideAny(l.x, l.z, fillers, 0.2)).toBe(false);
  });
});

describe('overlaps', () => {
  const a = { minX: 0, maxX: 2, minZ: 0, maxZ: 2 };

  it('detecta rectángulos que se tocan por dentro', () => {
    expect(overlaps(a, { minX: 1, maxX: 3, minZ: 1, maxZ: 3 })).toBe(true);
  });

  it('rectángulos separados no se superponen', () => {
    expect(overlaps(a, { minX: 3, maxX: 4, minZ: 0, maxZ: 2 })).toBe(false);
  });
});

describe('carPlacements', () => {
  it('todos los autos están estacionados sobre una calle', () => {
    const cars = carPlacements();
    expect(cars.length).toBeGreaterThan(4);
    for (const c of cars) {
      expect(insideAny(c.x, c.z, STREETS)).toBe(true);
    }
  });
});

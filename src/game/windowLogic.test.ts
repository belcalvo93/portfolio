import { describe, expect, it } from 'vitest';
import { findNearestWindow, getApproachPoint, hopPosition } from './windowLogic';

const windows = [
  { id: 'projects', x: -3, z: -4.2 },
  { id: 'technologies', x: 3.4, z: -4.2 },
];

describe('getApproachPoint', () => {
  it('devuelve el punto del techo frente a la ventana (hacia +Z)', () => {
    expect(getApproachPoint({ x: -3, z: -4.2 })).toEqual({ x: -3, z: -4.2 + 1.7 });
  });

  it('respeta una distancia distinta', () => {
    expect(getApproachPoint({ x: 2, z: 1 }, 1)).toEqual({ x: 2, z: 2 });
  });
});

describe('findNearestWindow', () => {
  it('encuentra la ventana si el gato está parado enfrente', () => {
    expect(findNearestWindow({ x: -3, z: -2.4 }, windows)).toBe('projects');
  });

  it('devuelve null si el gato está lejos de todas', () => {
    expect(findNearestWindow({ x: 0, z: 4 }, windows)).toBeNull();
  });

  it('elige la más cercana cuando hay dos en rango', () => {
    expect(findNearestWindow({ x: 2.6, z: -2.5 }, windows, 10)).toBe('technologies');
  });

  it('no cuenta al gato que está detrás de la ventana', () => {
    expect(findNearestWindow({ x: -3, z: -6 }, windows)).toBeNull();
  });
});

describe('hopPosition', () => {
  const from = { x: 0, y: 0, z: 2 };
  const to = { x: 0, y: 1, z: 0 };

  it('arranca en el punto de partida', () => {
    expect(hopPosition(from, to, 0)).toEqual(from);
  });

  it('termina en el punto de llegada', () => {
    expect(hopPosition(from, to, 1)).toEqual(to);
  });

  it('a mitad de camino está más alto que ambos extremos (hace un arco)', () => {
    const mid = hopPosition(from, to, 0.5);
    expect(mid.y).toBeGreaterThan(1);
    expect(mid.z).toBeCloseTo(1);
  });

  it('limita t entre 0 y 1', () => {
    expect(hopPosition(from, to, 1.4)).toEqual(to);
    expect(hopPosition(from, to, -1)).toEqual(from);
  });
});

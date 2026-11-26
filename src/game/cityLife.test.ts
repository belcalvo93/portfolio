import { describe, expect, it } from 'vitest';
import { LIGHT_TIMING, WindowLights, buildingColors, windowColor, windowColorMix } from './cityLife';

const litRatio = (w: WindowLights) => w.lit.filter(Boolean).length / w.lit.length;

/** Simula `seconds` segundos en pasos de 1/10 s y devuelve cuántas veces se prendió/apagó cada ventana. */
function simulate(w: WindowLights, seconds: number, onEachStep?: () => void): number[] {
  const toggles = new Array(w.lit.length).fill(0);
  for (let t = 0; t < seconds * 10; t++) {
    const before = [...w.lit];
    w.step(0.1);
    w.lit.forEach((v, i) => {
      if (v !== before[i]) toggles[i]++;
    });
    onEachStep?.();
  }
  return toggles;
}

describe('WindowLights', () => {
  it('hay pocas luces prendidas a la vez (no toda la ciudad)', () => {
    const w = new WindowLights(2000, 1);
    expect(litRatio(w)).toBeGreaterThan(0.1);
    expect(litRatio(w)).toBeLessThan(0.25);
  });

  it('algunas ventanas están siempre apagadas (departamentos vacíos)', () => {
    const w = new WindowLights(2000, 1);
    const dark = w.alwaysDark.filter(Boolean).length / 2000;
    expect(dark).toBeGreaterThan(0.25);
    expect(dark).toBeLessThan(0.45);
    const toggles = simulate(w, 400);
    w.alwaysDark.forEach((isDark, i) => {
      if (isDark) {
        expect(toggles[i]).toBe(0);
        expect(w.lit[i]).toBe(false);
      }
    });
  });

  it('las luces se van turnando: casi todas las que no están vacías se prenden o apagan en algún momento', () => {
    const w = new WindowLights(2000, 2);
    const toggles = simulate(w, 400);
    const active = w.alwaysDark.map((d, i) => (d ? -1 : i)).filter((i) => i >= 0);
    const moved = active.filter((i) => toggles[i] > 0).length;
    expect(moved / active.length).toBeGreaterThan(0.85);
  });

  it('ninguna luz queda prendida para siempre', () => {
    const w = new WindowLights(1000, 4);
    const onFor = new Array(1000).fill(0);
    let longest = 0;
    simulate(w, 400, () => {
      w.lit.forEach((v, i) => {
        onFor[i] = v ? onFor[i] + 0.1 : 0;
        longest = Math.max(longest, onFor[i]);
      });
    });
    expect(longest).toBeLessThanOrEqual(LIGHT_TIMING.onMax + 0.2);
  });

  it('la proporción de luces prendidas se mantiene estable con el tiempo', () => {
    const w = new WindowLights(2000, 2);
    simulate(w, 600);
    expect(litRatio(w)).toBeGreaterThan(0.1);
    expect(litRatio(w)).toBeLessThan(0.25);
  });

  it('las luces se prenden y apagan de forma gradual (fundido)', () => {
    const w = new WindowLights(2000, 6);
    // Avanzamos hasta encontrar una ventana a mitad de camino
    let found = false;
    for (let t = 0; t < 600 && !found; t++) {
      w.step(0.1);
      found = Array.from(w.level).some((l) => l > 0.05 && l < 0.95);
    }
    expect(found).toBe(true);
  });

  it('avisa qué ventanas cambiaron de brillo para repintarlas', () => {
    const w = new WindowLights(2000, 3);
    const before = Array.from(w.level);
    const changed = w.step(5);
    expect(changed.length).toBeGreaterThan(0);
    for (const i of changed) expect(w.level[i]).not.toBe(before[i]);
  });

  it('con la misma semilla da siempre la misma ciudad', () => {
    const a = new WindowLights(300, 9);
    const b = new WindowLights(300, 9);
    expect(a.lit).toEqual(b.lit);
    expect(a.step(1)).toEqual(b.step(1));
  });

  it('sin ventanas no se rompe', () => {
    const w = new WindowLights(0, 1);
    expect(w.step(1)).toEqual([]);
  });
});

describe('windowColorMix', () => {
  it('en 0 es la ventana apagada y en 1 la encendida', () => {
    expect(windowColorMix(0, 2, 'dark')).toBe(windowColor(false, 2, 'dark'));
    expect(windowColorMix(1, 2, 'dark')).toBe(windowColor(true, 2, 'dark'));
  });

  it('a mitad de camino es un color intermedio', () => {
    const mid = windowColorMix(0.5, 0, 'dark');
    expect(mid).not.toBe(windowColor(false, 0, 'dark'));
    expect(mid).not.toBe(windowColor(true, 0, 'dark'));
  });
});

describe('buildingColors', () => {
  it('da un color por edificio', () => {
    expect(buildingColors(40, 'light')).toHaveLength(40);
  });

  it('de día hay variedad de colores (no todo igual)', () => {
    expect(new Set(buildingColors(40, 'light')).size).toBeGreaterThanOrEqual(5);
  });

  it('de noche también hay matices distintos', () => {
    expect(new Set(buildingColors(40, 'dark')).size).toBeGreaterThanOrEqual(4);
  });

  it('cada edificio conserva su "personalidad" al cambiar de tema', () => {
    const day = buildingColors(20, 'light');
    expect(buildingColors(20, 'light')).toEqual(day);
  });
});

describe('windowColor', () => {
  it('de noche una ventana encendida es más clara que una apagada', () => {
    const brightness = (hex: number) => ((hex >> 16) & 255) + ((hex >> 8) & 255) + (hex & 255);
    for (let tint = 0; tint < 5; tint++) {
      expect(brightness(windowColor(true, tint, 'dark'))).toBeGreaterThan(
        brightness(windowColor(false, tint, 'dark'))
      );
    }
  });
});

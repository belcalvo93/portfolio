import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createGableRoofGeometry } from './geometry';

/** Normal de cada triángulo (la geometría no usa índices: 3 vértices seguidos por triángulo). */
function faceNormals(geo: THREE.BufferGeometry): THREE.Vector3[] {
  const pos = geo.getAttribute('position');
  const normals: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    normals.push(new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize());
  }
  return normals;
}

describe('createGableRoofGeometry (techito a dos aguas)', () => {
  const geo = createGableRoofGeometry(2.6, 1.95, 0.95);

  it('todas las caras miran hacia afuera (ninguna hacia el centro del techo)', () => {
    const pos = geo.getAttribute('position');
    const normals = faceNormals(geo);
    normals.forEach((n, f) => {
      const center = new THREE.Vector3();
      for (let k = 0; k < 3; k++) center.add(new THREE.Vector3().fromBufferAttribute(pos, f * 3 + k));
      center.divideScalar(3);
      // Desde el centro del techo hacia la cara, la normal apunta en el mismo sentido
      const fromInside = center.sub(new THREE.Vector3(0, 0.3, 0));
      expect(n.dot(fromInside)).toBeGreaterThan(0);
    });
  });

  it('las coordenadas de la textura no cruzan la unión entre copias (sin línea clara)', () => {
    const uv = geo.getAttribute('uv');
    // La textura se repite cada 2 unidades (repeat 0.5): todo tiene que quedar dentro de una copia
    for (let i = 0; i < uv.count; i++) {
      expect(uv.getX(i)).toBeGreaterThan(0);
      expect(uv.getX(i)).toBeLessThan(2);
      expect(uv.getY(i)).toBeGreaterThan(0);
      expect(uv.getY(i)).toBeLessThan(2);
    }
  });

  it('en los faldones, las hileras de tejas van paralelas a la cumbrera', () => {
    // En cada faldón, moverse a lo largo de la cumbrera (eje Z) no cambia la coordenada V
    const pos = geo.getAttribute('position');
    const uv = geo.getAttribute('uv');
    const normals = faceNormals(geo);
    normals.forEach((n, f) => {
      if (Math.abs(n.z) > 0.5 || n.y < 0.1) return; // solo faldones
      for (let k = 0; k < 3; k++) {
        const i = f * 3 + k;
        const y = pos.getY(i);
        // V depende solo de la altura sobre el faldón, no de Z
        const expectedV = uv.getY(f * 3);
        if (Math.abs(y - pos.getY(f * 3)) < 1e-6) expect(uv.getY(i)).toBeCloseTo(expectedV);
      }
    });
  });
});

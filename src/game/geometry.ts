import * as THREE from 'three';

/**
 * Pirámide truncada alineada a los ejes X/Z (faldón de mansarda).
 * A diferencia de un cilindro de 4 lados girado y estirado, sus bordes
 * siempre quedan paralelos a las paredes del edificio.
 * La base está en y = 0 y la tapa en y = height (sin tapas: solo los 4 faldones).
 */
export function createFrustumGeometry(
  bottomW: number,
  bottomD: number,
  topW: number,
  topD: number,
  height: number
): THREE.BufferGeometry {
  const bx = bottomW / 2;
  const bz = bottomD / 2;
  const tx = topW / 2;
  const tz = topD / 2;

  // Esquinas en sentido antihorario visto desde arriba
  const bottom: [number, number][] = [
    [-bx, bz],
    [bx, bz],
    [bx, -bz],
    [-bx, -bz],
  ];
  const top: [number, number][] = [
    [-tx, tz],
    [tx, tz],
    [tx, -tz],
    [-tx, -tz],
  ];

  const positions: number[] = [];
  const uvs: number[] = [];
  const slope = Math.hypot(height, Math.max(bx - tx, bz - tz));

  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const b0 = bottom[i];
    const b1 = bottom[j];
    const t0 = top[i];
    const t1 = top[j];
    const edge = Math.hypot(b1[0] - b0[0], b1[1] - b0[1]);

    // Dos triángulos por faldón (sin índices → normales planas, look low-poly)
    positions.push(b0[0], 0, b0[1], b1[0], 0, b1[1], t1[0], height, t1[1]);
    positions.push(b0[0], 0, b0[1], t1[0], height, t1[1], t0[0], height, t0[1]);

    // UV en metros para que la textura no se deforme según el tamaño
    const inset = (edge - Math.hypot(t1[0] - t0[0], t1[1] - t0[1])) / 2;
    uvs.push(0, 0, edge, 0, edge - inset, slope);
    uvs.push(0, 0, edge - inset, slope, inset, slope);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Techo a dos aguas: prisma triangular con la cumbrera a lo largo del eje Z,
 * de modo que el triángulo del frente mira hacia +Z (donde está la ventana).
 * Centrado en X y Z, con la base en y = 0.
 */
export function createGableRoofGeometry(width: number, depth: number, height: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

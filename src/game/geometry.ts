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
  const hw = width / 2;
  const hd = depth / 2;
  const slope = Math.hypot(hw, height);
  // Pequeño margen para que las coordenadas de textura nunca toquen la unión entre copias
  const pad = 0.05;
  // La textura de pizarra se repite cada 2 unidades: escalamos parejo (sin deformar)
  // para que todo el techito entre en una sola copia y no aparezca la línea de unión.
  const k = Math.min(1, (2 - pad * 3) / Math.max(width, depth, slope));

  // Esquinas: aleros (y = 0) y cumbrera (y = height)
  const eaveL = (z: number) => [-hw, 0, z];
  const eaveR = (z: number) => [hw, 0, z];
  const ridge = (z: number) => [0, height, z];

  const positions: number[] = [];
  const uvs: number[] = [];
  const tri = (a: number[], b: number[], c: number[], ua: number[], ub: number[], uc: number[]) => {
    positions.push(...a, ...b, ...c);
    uvs.push(...ua, ...ub, ...uc);
  };

  // Faldones: U a lo largo de la cumbrera (Z) y V subiendo por la pendiente,
  // así las hileras de tejas quedan paralelas a la cumbrera, como en un techo real.
  const u = (z: number) => (z + hd) * k + pad;
  const vEave = pad;
  const vRidge = slope * k + pad;

  // Faldón izquierdo
  tri(eaveL(-hd), eaveL(hd), ridge(hd), [u(-hd), vEave], [u(hd), vEave], [u(hd), vRidge]);
  tri(eaveL(-hd), ridge(hd), ridge(-hd), [u(-hd), vEave], [u(hd), vRidge], [u(-hd), vRidge]);
  // Faldón derecho
  tri(eaveR(hd), eaveR(-hd), ridge(-hd), [u(hd), vEave], [u(-hd), vEave], [u(-hd), vRidge]);
  tri(eaveR(hd), ridge(-hd), ridge(hd), [u(hd), vEave], [u(-hd), vRidge], [u(hd), vRidge]);

  // Triángulos de adelante y de atrás
  const gx = (x: number) => (x + hw) * k + pad;
  const gy = (y: number) => y * k + pad;
  tri(eaveL(hd), eaveR(hd), ridge(hd), [gx(-hw), gy(0)], [gx(hw), gy(0)], [gx(0), gy(height)]);
  tri(eaveL(-hd), ridge(-hd), eaveR(-hd), [gx(-hw), gy(0)], [gx(0), gy(height)], [gx(hw), gy(0)]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

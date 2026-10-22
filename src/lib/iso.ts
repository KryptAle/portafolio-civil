/**
 * Genera una estructura isométrica en líneas (edificio de vanos y pisos).
 * Se calcula en el build: el navegador solo recibe SVG, sin JavaScript de dibujo.
 */

export type Linea = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tipo: 'suelo' | 'columna' | 'losa' | 'nucleo';
  delay: number;
  fuerza: number;
};

export type Nivel = { x: number; y: number; texto: string };

export type Dibujo = {
  lineas: Linea[];
  niveles: Nivel[];
  cota: { x: number; y1: number; y2: number; texto: string };
  tapa: string;
  caras: string[];
  viewBox: string;
  ancho: number;
  alto: number;
};

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);

type Opciones = {
  vanosX?: number;
  vanosY?: number;
  pisos?: number;
  vano?: number;
  alturaPiso?: number;
  u?: number;
};

export function generarEstructura(opciones: Opciones = {}): Dibujo {
  const {
    vanosX = 3,
    vanosY = 2,
    pisos = 6,
    vano = 6,
    alturaPiso = 3.2,
    u = 13,
  } = opciones;

  const X = vanosX * vano;
  const Y = vanosY * vano;
  const H = pisos * alturaPiso;
  const ext = vano * 0.55;

  // Proyección isométrica: x crece a la derecha-abajo, y a la izquierda-abajo, z hacia arriba.
  const crudo = (x: number, y: number, z: number): [number, number] => [
    (x - y) * COS * u,
    ((x + y) * SIN - z) * u,
  ];

  // Caja envolvente con la retícula de suelo incluida.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const medir = (x: number, y: number, z: number) => {
    const [px, py] = crudo(x, y, z);
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  };

  for (let i = 0; i <= vanosX; i++) {
    for (let j = 0; j <= vanosY; j++) {
      medir(i * vano, j * vano, 0);
      medir(i * vano, j * vano, H);
    }
  }
  medir(-ext, -ext, 0);
  medir(X + ext, Y + ext, 0);

  const padL = 64;
  const padR = 74;
  const padT = 30;
  const padB = 34;
  const dx = padL - minX;
  const dy = padT - minY;
  const ancho = Math.round(maxX - minX + padL + padR);
  const alto = Math.round(maxY - minY + padT + padB);

  const P = (x: number, y: number, z: number): [number, number] => {
    const [px, py] = crudo(x, y, z);
    return [px + dx, py + dy];
  };

  const lineas: Linea[] = [];
  const push = (
    a: [number, number],
    b: [number, number],
    tipo: Linea['tipo'],
    delay: number,
    fuerza: number,
  ) => {
    lineas.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], tipo, delay, fuerza });
  };

  // Retícula de suelo, un poco más allá del edificio.
  for (let i = 0; i <= vanosX; i++) {
    push(P(i * vano, -ext, 0), P(i * vano, Y + ext, 0), 'suelo', 0.02 * i, 1);
  }
  for (let j = 0; j <= vanosY; j++) {
    push(P(-ext, j * vano, 0), P(X + ext, j * vano, 0), 'suelo', 0.02 * j, 1);
  }

  // Columnas piso a piso.
  for (let f = 0; f < pisos; f++) {
    const z0 = f * alturaPiso;
    const z1 = z0 + alturaPiso;
    for (let i = 0; i <= vanosX; i++) {
      for (let j = 0; j <= vanosY; j++) {
        const prof = (i + j) / (vanosX + vanosY || 1);
        push(
          P(i * vano, j * vano, z0),
          P(i * vano, j * vano, z1),
          'columna',
          0.3 + f * 0.06 + prof * 0.1,
          0.4 + prof * 0.35,
        );
      }
    }
  }

  // Losas: contorno de cada nivel.
  for (let f = 0; f <= pisos; f++) {
    const z = f * alturaPiso;
    const d = 0.18 + f * 0.07;
    push(P(0, 0, z), P(X, 0, z), 'losa', d, 1);
    push(P(X, 0, z), P(X, Y, z), 'losa', d + 0.02, 1);
    push(P(X, Y, z), P(0, Y, z), 'losa', d + 0.04, 1);
    push(P(0, Y, z), P(0, 0, z), 'losa', d + 0.06, 1);
  }

  // Losa de cubierta: se dibuja como plano lleno para que el volumen se lea.
  const tapa = [P(0, 0, H), P(X, 0, H), P(X, Y, H), P(0, Y, H)]
    .map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`)
    .join(' ');

  // Caras visibles del volumen: dan cuerpo al edificio detrás de la retícula.
  const caras = [
    [P(0, Y, 0), P(X, Y, 0), P(X, Y, H), P(0, Y, H)],
    [P(X, 0, 0), P(X, Y, 0), P(X, Y, H), P(X, 0, H)],
  ].map((cara) =>
    cara.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' '),
  );

  // Cotas de nivel al costado derecho.
  const niveles: Nivel[] = [];
  const nivelesVisibles = [0, Math.round(pisos / 3), Math.round((2 * pisos) / 3), pisos];
  nivelesVisibles.forEach((f) => {
    const [px, py] = P(X, 0, f * alturaPiso);
    niveles.push({
      x: Math.round(px + 16),
      y: Math.round(py + 3),
      texto: `N+${(f * alturaPiso).toFixed(2).replace('.', ',')}`,
    });
  });

  // Cota vertical total a la izquierda.
  const [izqX, izqY] = P(0, Y, 0);
  const [, arribaY] = P(0, Y, H);

  return {
    lineas,
    niveles,
    cota: {
      x: Math.round(izqX - 34),
      y1: Math.round(arribaY),
      y2: Math.round(izqY),
      texto: `${H.toFixed(2).replace('.', ',')} m`,
    },
    tapa,
    caras,
    viewBox: `0 0 ${ancho} ${alto}`,
    ancho,
    alto,
  };
}

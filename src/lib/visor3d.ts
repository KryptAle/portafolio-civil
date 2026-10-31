/**
 * Visor IFC mínimo: three.js + web-ifc.
 * Solo lectura: orbitar, hacer zoom y encuadrar. Sin edición ni medición.
 */

export type EstadoCarga = (texto: string) => void;

export interface OpcionesVisor {
  contenedor: HTMLElement;
  archivo: string;
  base: string;
  onEstado?: EstadoCarga;
}

export interface Visor {
  reencuadrar: () => void;
  destruir: () => void;
}

export async function iniciarVisor({
  contenedor,
  archivo,
  base,
  onEstado,
}: OpcionesVisor): Promise<Visor> {
  const avisar = (texto: string) => onEstado?.(texto);

  avisar('Cargando visor…');
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const webIfc = await import('web-ifc');
  const { IfcAPI } = webIfc;

  const ancho = contenedor.clientWidth || 960;
  const alto = contenedor.clientHeight || 540;

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x10151a);

  const camara = new THREE.PerspectiveCamera(50, ancho / alto, 0.1, 5000);
  camara.up.set(0, 0, 1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(ancho, alto);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.addEventListener('contextmenu', (evento) => evento.preventDefault());
  renderer.domElement.style.userSelect = 'none';
  contenedor.appendChild(renderer.domElement);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.screenSpacePanning = true;

  escena.add(new THREE.HemisphereLight(0xffffff, 0x334455, 2.2));
  const luz = new THREE.DirectionalLight(0xffffff, 2.4);
  luz.position.set(6, 8, 12);
  escena.add(luz);
  const luz2 = new THREE.DirectionalLight(0xffffff, 0.7);
  luz2.position.set(-8, -6, 6);
  escena.add(luz2);

  avisar('Descargando modelo…');
  const respuesta = await fetch(archivo);
  if (!respuesta.ok) throw new Error(`No se pudo descargar el modelo (${respuesta.status})`);
  const datos = new Uint8Array(await respuesta.arrayBuffer());

  avisar('Leyendo geometría…');
  const api = new IfcAPI();
  const baseLimpia = base.endsWith('/') ? base : `${base}/`;
  api.SetWasmPath(baseLimpia, true);
  await api.Init();

  const modeloID = api.OpenModel(datos);
  const grupo = new THREE.Group();
  escena.add(grupo);

  const malla = api.LoadAllGeometry(modeloID);
  const total = malla.size();
  for (let i = 0; i < total; i++) {
    const plana = malla.get(i);
    const geometrias = plana.geometries;
    for (let g = 0; g < geometrias.size(); g++) {
      const colocada = geometrias.get(g);
      const geometria = api.GetGeometry(modeloID, colocada.geometryExpressID);
      const vertices = api.GetVertexArray(
        geometria.GetVertexData(),
        geometria.GetVertexDataSize(),
      );
      const indices = api.GetIndexArray(geometria.GetIndexData(), geometria.GetIndexDataSize());

      const buffer = new THREE.InterleavedBuffer(vertices, 6);
      const bufferGeom = new THREE.BufferGeometry();
      bufferGeom.setAttribute('position', new THREE.InterleavedBufferAttribute(buffer, 3, 0));
      bufferGeom.setAttribute('normal', new THREE.InterleavedBufferAttribute(buffer, 3, 3));
      bufferGeom.setIndex(new THREE.BufferAttribute(indices, 1));

      const color = colocada.color;
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color.x, color.y, color.z),
        roughness: 0.85,
        metalness: 0.02,
      });

      const objeto = new THREE.Mesh(bufferGeom, material);
      objeto.matrixAutoUpdate = false;
      objeto.matrix.fromArray(colocada.flatTransformation);
      grupo.add(objeto);
    }
  }

  grupo.updateMatrixWorld(true);
  const cajaInicial = new THREE.Box3().setFromObject(grupo);
  const tamanoInicial = cajaInicial.getSize(new THREE.Vector3());

  /* El IFC puede venir con la altura en X o Y según cómo se exportó.
     Se compara la extensión de cada eje con el rango de niveles para
     elegir el eje vertical y girar el modelo a Z-arriba. */
  const rangoNiveles = (() => {
    try {
      const ids = api.GetLineIDsWithType(modeloID, webIfc.IFCBUILDINGSTOREY);
      const valores: number[] = [];
      for (let i = 0; i < ids.size(); i++) {
        const nivel = api.GetLine(modeloID, ids.get(i)) as {
          Elevation?: number | { value?: number; _representationValue?: number };
        };
        const elevacion = nivel?.Elevation;
        const valor =
          typeof elevacion === 'number'
            ? elevacion
            : (elevacion?.value ?? elevacion?._representationValue);
        const numero = Number(valor);
        if (Number.isFinite(numero)) valores.push(numero);
      }
      if (valores.length < 2) return null;
      return Math.max(...valores) - Math.min(...valores);
    } catch {
      return null;
    }
  })();

  let ejeArriba: 'x' | 'y' | 'z' = 'z';
  if (rangoNiveles && rangoNiveles > 1) {
    const ratios = {
      x: tamanoInicial.x / rangoNiveles,
      y: tamanoInicial.y / rangoNiveles,
      z: tamanoInicial.z / rangoNiveles,
    };
    let mejor = Infinity;
    (['x', 'y', 'z'] as const).forEach((eje) => {
      const distancia = Math.abs(ratios[eje] - 1.08);
      if (distancia < mejor) {
        mejor = distancia;
        ejeArriba = eje;
      }
    });
  }

  if (ejeArriba === 'y') grupo.rotation.x = Math.PI / 2;
  if (ejeArriba === 'x') grupo.rotation.y = -Math.PI / 2;
  grupo.updateMatrixWorld(true);

  const caja = new THREE.Box3().setFromObject(grupo);
  const centro = caja.getCenter(new THREE.Vector3());
  const tamano = caja.getSize(new THREE.Vector3());
  const mayor = Math.max(tamano.x, tamano.y, tamano.z) || 1;
  const escala = 10 / mayor;
  grupo.scale.setScalar(escala);
  grupo.position.copy(centro).multiplyScalar(-escala);

  const rejilla = new THREE.GridHelper(24, 24, 0x2a3a44, 0x1a252d);
  rejilla.rotation.x = Math.PI / 2;
  rejilla.position.z = (-tamano.z / 2) * escala;
  escena.add(rejilla);

  const encuadrar = () => {
    const fov = (camara.fov * Math.PI) / 180;
    const tanV = Math.tan(fov / 2);
    const tanH = tanV * Math.max(camara.aspect, 1);

    const direccion = new THREE.Vector3(0.57, -0.71, 0.43).normalize();
    const adelante = direccion.clone().negate();
    const derecha = new THREE.Vector3().crossVectors(adelante, new THREE.Vector3(0, 0, 1)).normalize();
    const arriba = new THREE.Vector3().crossVectors(derecha, adelante).normalize();

    const mitad = new THREE.Vector3(
      (tamano.x * escala) / 2,
      (tamano.y * escala) / 2,
      (tamano.z * escala) / 2,
    );

    let distancia = 0;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const punto = new THREE.Vector3(
            sx * mitad.x,
            sy * mitad.y,
            sz * mitad.z,
          );
          const fondo = punto.dot(adelante);
          distancia = Math.max(
            distancia,
            fondo + Math.abs(punto.dot(derecha)) / tanH,
            fondo + Math.abs(punto.dot(arriba)) / tanV,
          );
        }
      }
    }
    distancia *= 1.08;

    controles.target.set(0, 0, 0);
    camara.position.copy(direccion.multiplyScalar(distancia));
    camara.near = 0.1;
    camara.far = 200;
    camara.updateProjectionMatrix();
    controles.minDistance = 2;
    controles.maxDistance = distancia * 4;
    controles.update();
  };
  encuadrar();

  const redimensionar = () => {
    const w = contenedor.clientWidth;
    const h = contenedor.clientHeight;
    if (!w || !h) return;
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const observador = new ResizeObserver(redimensionar);
  observador.observe(contenedor);

  renderer.setAnimationLoop(() => {
    controles.update();
    renderer.render(escena, camara);
  });

  avisar('');

  return {
    reencuadrar: encuadrar,
    destruir: () => {
      renderer.setAnimationLoop(null);
      observador.disconnect();
      renderer.dispose();
      contenedor.removeChild(renderer.domElement);
      api.CloseModel(modeloID);
    },
  };
}

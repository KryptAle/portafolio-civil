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
  const { IfcAPI } = await import('web-ifc');

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

  const caja = new THREE.Box3().setFromObject(grupo);
  const centro = caja.getCenter(new THREE.Vector3());
  const tamano = caja.getSize(new THREE.Vector3());
  const mayor = Math.max(tamano.x, tamano.y, tamano.z) || 1;

  grupo.position.sub(centro);
  const escala = 10 / mayor;
  grupo.scale.setScalar(escala);

  const rejilla = new THREE.GridHelper(24, 24, 0x2a3a44, 0x1a252d);
  rejilla.rotation.x = Math.PI / 2;
  rejilla.position.z = (-tamano.z / 2) * escala;
  escena.add(rejilla);

  const encuadrar = () => {
    controles.target.set(0, 0, 0);
    camara.position.set(9, -11, 7);
    camara.near = 0.1;
    camara.far = 200;
    camara.updateProjectionMatrix();
    controles.minDistance = 2;
    controles.maxDistance = 60;
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

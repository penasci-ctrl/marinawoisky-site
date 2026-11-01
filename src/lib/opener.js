// Abertura: escultura 3D "respirando" em zoom, sangrando pelas bordas.
// Todos os ajustes do movimento estão em CFG.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const CFG = {
  zoomPeriod: 16,  // segundos para ir e voltar
  swayPeriod: 27,  // balanço lateral, fora de fase com o zoom
  swayAngle: 28,   // graus para cada lado
  farFill: 0.62,   // longe: a peça ocupa 62% da altura da tela
  nearFill: 1.9,   // perto: 190% da altura, sangrando
  fovFar: 20,
  fovNear: 34,
};

export function mountOpener(canvas, urls) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(innerWidth, innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  // Resolução: no máximo 1,5x (a diferença para 2x quase não se vê, e o custo cai pela metade).
  // Se o aparelho não aguentar 60 fps, a resolução baixa sozinha; durante o mergulho do scroll (com desfoque) baixa também.
  const maxRatio = Math.min(devicePixelRatio, small ? 1.25 : 1.5);
  let ratio = maxRatio, slowFrames = 0, lastTime = 0;
  const setRatio = (r) => { r = Math.max(0.75, Math.min(maxRatio, r)); if (Math.abs(r - renderer.getPixelRatio()) > 0.01) renderer.setPixelRatio(r); };
  renderer.setPixelRatio(ratio);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(1.5, 3, 2);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(CFG.fovFar, 1, 0.01, 50);
  const pivot = new THREE.Group();
  scene.add(pivot);

  let H = 0.8, W = 0.55, t0 = 0, raf = 0, visible = true;

  const resize = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Para de desenhar quando a abertura já sumiu (rolou além de uma tela) ou a aba está escondida:
  // assim a vitrine rola sem disputar a placa de vídeo com o 3D.
  const check = () => {
    const was = visible;
    visible = scrollY < innerHeight * 1.02 && !document.hidden;
    if (visible && !was && !raf && pivot.children.length) { lastTime = 0; raf = requestAnimationFrame(frame); }
  };
  addEventListener('scroll', check, { passive: true });
  document.addEventListener('visibilitychange', check);

  const ease = (s) => s * s * (3 - 2 * s);
  const lerp = (a, b, t) => a + (b - a) * t;

  function frame(time) {
    raf = 0;
    if (!visible) return;
    if (!t0) t0 = time;
    // resolução adaptativa
    if (lastTime) {
      const dt = time - lastTime;
      slowFrames = dt > 20 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 20) { ratio = Math.max(0.75, ratio - 0.25); slowFrames = 0; }
    }
    lastTime = time;
    setRatio(scrollY > 30 ? Math.min(ratio, 1) : ratio);
    const t = reduce ? 0 : (time - t0) / 1000;
    const z = ease(0.5 - 0.5 * Math.cos((t / CFG.zoomPeriod) * Math.PI * 2));
    const sway = Math.sin((t / CFG.swayPeriod) * Math.PI * 2);
    pivot.rotation.y = THREE.MathUtils.degToRad(CFG.swayAngle) * sway;
    const portrait = camera.aspect < 0.8;
    const farFill = Math.min(CFG.farFill, 0.72 * camera.aspect * H / W);
    const fill = lerp(farFill, CFG.nearFill * (portrait ? 0.8 : 1), z);
    const fov = lerp(CFG.fovFar, CFG.fovNear, z);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    const dist = (H / fill) / 2 / Math.tan(THREE.MathUtils.degToRad(fov) / 2);
    const target = new THREE.Vector3(lerp(0, -0.06 * sway, z), lerp(H * 0.5, H * 0.66, z), 0);
    const lift = lerp(0.18, 0.05, z);
    camera.position.set(target.x + dist * 0.12 * sway * z, target.y + dist * lift, target.z + dist);
    camera.lookAt(target);
    renderer.render(scene, camera);
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  new GLTFLoader().load(small && urls.mobile ? urls.mobile : urls.web, (gltf) => {
    const model = gltf.scene;
    // scans vêm sem normais: calcula normais suaves para não facetar no zoom
    model.traverse((o) => { if (o.isMesh && !o.geometry.attributes.normal) o.geometry.computeVertexNormals(); });
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -box.min.y, -c.z);
    H = box.max.y - box.min.y;
    W = Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) * 0.8;
    pivot.add(model);
    // compila os shaders e sobe as texturas antes de mostrar, para o primeiro movimento não engasgar
    const show = () => { renderer.render(scene, camera); canvas.style.opacity = '1'; raf = requestAnimationFrame(frame); };
    (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve(renderer.compile(scene, camera))).then(show, show);
  }, undefined, (err) => console.error('Modelo 3D não carregou', err));
}

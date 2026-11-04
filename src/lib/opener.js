// Abertura: escultura 3D "respirando" em zoom, sangrando pelas bordas.
// Todos os ajustes do movimento estão em CFG.
//
// Fluidez:
//  - resolução fixa (nada de trocar o tamanho do quadro no meio da animação, que dava trancos);
//  - o tempo da animação avança no máximo 1/30 s por quadro, então um quadro atrasado não vira um pulo;
//  - o desfoque do "mergulho" no scroll é feito dentro do próprio 3D, numa cópia em 1/6 da resolução
//    (bem mais leve que desfocar a tela inteira com CSS).
// Acabamento:
//  - as normais são recalculadas juntando os vértices das emendas da textura, então as facetas da malha somem;
//  - luz mais difusa e reflexo mais baixo, para a superfície ficar macia.
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

// Normais suaves por POSIÇÃO: vértices na mesma posição (emendas de UV) somam as normais das faces vizinhas.
function smoothNormals(geometry) {
  const pos = geometry.attributes.position;
  const index = geometry.index;
  const n = pos.count;
  const key = (i) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
  const group = new Int32Array(n);
  const ids = new Map();
  for (let i = 0; i < n; i++) {
    const k = key(i);
    let g = ids.get(k);
    if (g === undefined) { g = ids.size; ids.set(k, g); }
    group[i] = g;
  }
  const acc = new Float32Array(ids.size * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  const tri = index ? index.count / 3 : n / 3;
  for (let t = 0; t < tri; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3, i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1, i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    ab.subVectors(b, a); ac.subVectors(c, a); ab.cross(ac); // peso pela área do triângulo
    for (const i of [i0, i1, i2]) { const g = group[i] * 3; acc[g] += ab.x; acc[g + 1] += ab.y; acc[g + 2] += ab.z; }
  }
  const normals = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const g = group[i] * 3;
    const l = Math.hypot(acc[g], acc[g + 1], acc[g + 2]) || 1;
    normals[i * 3] = acc[g] / l; normals[i * 3 + 1] = acc[g + 1] / l; normals[i * 3 + 2] = acc[g + 2] / l;
  }
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
}

export function mountOpener(canvas, urls) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(innerWidth, innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.5)); // fixa
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.0;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d6d0, 0.35)); // luz ambiente difusa
  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(1.5, 3, 2);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(CFG.fovFar, 1, 0.01, 50);
  const pivot = new THREE.Group();
  scene.add(pivot);

  // ---- desfoque em 1/6 da resolução, desenhado por cima com transparência crescente
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace });
  const blurMat = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: { tex: { value: rt.texture }, texel: { value: new THREE.Vector2() }, radius: { value: 0 }, alpha: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tex; uniform vec2 texel; uniform float radius; uniform float alpha; varying vec2 vUv;
      void main(){
        vec4 s = vec4(0.0); float w = 0.0;
        for (int x = -3; x <= 3; x++) for (int y = -3; y <= 3; y++) {
          vec2 o = vec2(float(x), float(y));
          float k = exp(-dot(o, o) / 8.0);
          s += texture2D(tex, vUv + o * texel * radius) * k; w += k;
        }
        s /= w;
        gl_FragColor = vec4(s.rgb, s.a * alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const blurScene = new THREE.Scene();
  blurScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat));
  const blurCam = new THREE.Camera();
  let blur = 0; // 0 = nítido, 1 = desfoque máximo

  let H = 0.8, W = 0.55, t = 0, last = 0, raf = 0, visible = true;

  const resize = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const q = renderer.getPixelRatio() / 6;
    rt.setSize(Math.max(2, Math.round(w * q)), Math.max(2, Math.round(h * q)));
    blurMat.uniforms.texel.value.set(1 / rt.width, 1 / rt.height);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Para de desenhar quando a abertura já sumiu ou a aba está escondida
  const check = () => {
    const was = visible;
    visible = scrollY < innerHeight * 1.02 && !document.hidden;
    if (visible && !was && !raf && pivot.children.length) { last = 0; raf = requestAnimationFrame(frame); }
  };
  addEventListener('scroll', check, { passive: true });
  document.addEventListener('visibilitychange', check);

  const ease = (s) => s * s * (3 - 2 * s);
  const lerp = (a, b, k) => a + (b - a) * k;
  const target = new THREE.Vector3();

  function frame(time) {
    raf = 0;
    if (!visible) return;
    const dt = last ? Math.min((time - last) / 1000, 1 / 30) : 0; // quadro atrasado não vira pulo
    last = time;
    if (!reduce) t += dt;
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
    target.set(lerp(0, -0.06 * sway, z), lerp(H * 0.5, H * 0.66, z), 0);
    const lift = lerp(0.18, 0.05, z);
    camera.position.set(target.x + dist * 0.12 * sway * z, target.y + dist * lift, target.z + dist);
    camera.lookAt(target);

    const alpha = Math.min(1, blur / 0.25); // o desfoque entra rápido no começo do scroll
    if (alpha < 0.999) renderer.render(scene, camera); // nítido por baixo (pulado quando o desfoque já cobre tudo)
    if (alpha > 0.001) {
      renderer.setRenderTarget(rt);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      blurMat.uniforms.radius.value = 0.5 + blur * 1.1;
      blurMat.uniforms.alpha.value = alpha;
      if (alpha >= 0.999) renderer.clear();
      renderer.autoClear = false;
      renderer.render(blurScene, blurCam);
      renderer.autoClear = true;
    }
    raf = requestAnimationFrame(frame);
  }

  new GLTFLoader().load(small && urls.mobile ? urls.mobile : urls.web, (gltf) => {
    const model = gltf.scene;
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    model.traverse((o) => {
      if (!o.isMesh) return;
      smoothNormals(o.geometry); // sem facetas, mesmo nas emendas
      const m = o.material;
      if (m) {
        m.flatShading = false;
        if ('roughness' in m) m.roughness = Math.max(m.roughness ?? 1, 0.62); // reflexo mais baixo, superfície macia
        if ('envMapIntensity' in m) m.envMapIntensity = 0.85;
        for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) if (m[k]) m[k].anisotropy = aniso;
        if (m.normalScale) m.normalScale.multiplyScalar(0.85);
        m.needsUpdate = true;
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -box.min.y, -c.z);
    H = box.max.y - box.min.y;
    W = Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) * 0.8;
    pivot.add(model);
    // compila os shaders e sobe as texturas antes de mostrar, para o primeiro movimento não engasgar
    const show = () => { renderer.compile(blurScene, blurCam); canvas.style.opacity = '1'; raf = requestAnimationFrame(frame); };
    (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve(renderer.compile(scene, camera))).then(show, show);
  }, undefined, (err) => console.error('Modelo 3D não carregou', err));

  return {
    // 0..1, chamado pelo scroll da página
    setBlur(v) { blur = Math.max(0, Math.min(1, v)); },
  };
}

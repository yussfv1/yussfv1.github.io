document.documentElement.classList.add('js');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const C = { clay: '#d29a5f', clayDeep: '#9c6a3c', turq: '#45c2b6', lapis: '#3a6fc4', sand: '#efe2c8', night: '#0c1522', white: '#f3efe6' };

/* ================= навигация и прогресс ================= */
(() => {
  const nav = document.getElementById('nav'), prog = document.getElementById('progress');
  const links = [...nav.querySelectorAll('ul a')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href')));
  const tl = document.getElementById('timeline');
  const items = [...tl.querySelectorAll('li')];
  function onScroll() {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('solid', y > 40);
    prog.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : 0);
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === cur));
    const r = tl.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    tl.style.setProperty('--t', t.toFixed(4));
    const line = innerHeight * 0.6;
    items.forEach(li => li.classList.toggle('lit', li.getBoundingClientRect().top + 30 < line));
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();

/* ================= появление блоков ================= */
(() => {
  const els = [...document.querySelectorAll('.reveal')];
  if (REDUCED || !('IntersectionObserver' in window)) return;
  els.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) el.classList.add('pre'); });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(el => io.observe(el));
})();

/* ================= счётчики в шапке ================= */
(() => {
  if (REDUCED) return;
  document.querySelectorAll('[data-count]').forEach((el, i) => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const suffix = el.textContent.includes('м') ? ' м' : '';
    const t0 = performance.now() + 400 + i * 120, dur = 1400;
    function f(now) {
      const k = Math.min(1, Math.max(0, (now - t0) / dur));
      const e = 1 - Math.pow(1 - k, 4);
      const v = end > 1000 ? Math.round(1300 + (end - 1300) * e) : end * e;
      el.textContent = v.toFixed(dec).replace('.', ',') + suffix;
      if (k < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  });
})();

/* ================= текстуры ================= */
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rand(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function archPath(g, x, y, w, h) {
  g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + h * 0.42);
  g.quadraticCurveTo(x, y + h * 0.08, x + w / 2, y);
  g.quadraticCurveTo(x + w, y + h * 0.08, x + w, y + h * 0.42);
  g.lineTo(x + w, y + h); g.closePath();
}
function brickBase(g, w, h, seed, base = [190, 138, 90]) {
  const r = rand(seed);
  g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
  const bh = 8, bw = 26;
  for (let y = 0; y < h; y += bh) {
    const off = (y / bh) % 2 ? bw / 2 : 0;
    for (let x = -bw; x < w; x += bw) {
      const k = 0.86 + r() * 0.22;
      g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`;
      g.fillRect(x + off + 1, y + 1, bw - 2, bh - 2);
    }
  }
}
function lattice(g, x, y, w, h, s, c1, c2) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = c2; g.fillRect(x, y, w, h);
  for (let j = -1; j * s < h + s; j++) for (let i = -1; i * s < w + s; i++) {
    const cx = x + i * s + (j % 2 ? s / 2 : 0), cy = y + j * s / 2;
    g.beginPath(); g.moveTo(cx, cy - s * .42); g.lineTo(cx + s * .42, cy); g.lineTo(cx, cy + s * .42); g.lineTo(cx - s * .42, cy); g.closePath();
    g.fillStyle = c1; g.fill();
    g.fillStyle = C.white; g.fillRect(cx - s * .08, cy - s * .08, s * .16, s * .16);
  }
  g.restore();
}
function kufiBand(g, x, y, w, h, seed) {
  // полоса с угловатым орнаментом по мотивам квадратного куфи
  g.fillStyle = C.lapis; g.fillRect(x, y, w, h);
  const cell = h / 7, r = rand(seed);
  const cols = Math.floor(w / cell);
  const motif = ['1111111', '1000001', '1011101', '1010101', '1010001', '1011111', '1000000'];
  for (let i = 0; i < cols; i++) for (let j = 0; j < 7; j++) {
    const m = motif[j][i % 7];
    if (m === '1') { g.fillStyle = (i % 14 < 7) ? C.white : C.turq; g.fillRect(x + i * cell + 1, y + j * cell + 1, cell - 2, cell - 2); }
  }
}
function wallTexture() {
  const w = 1024, h = 512, c = mkCanvas(w, h), g = c.getContext('2d');
  brickBase(g, w, h, 7);
  kufiBand(g, 0, 18, w, 42, 3);
  const n = 4, pw = w / n;
  for (let i = 0; i < n; i++) {
    for (const [yy, hh] of [[86, 190], [296, 190]]) {
      const x = i * pw + 22, ww = pw - 44;
      g.fillStyle = 'rgba(80,50,28,.55)'; archPath(g, x - 6, yy - 6, ww + 12, hh + 12); g.fill();
      g.save(); archPath(g, x, yy, ww, hh); g.clip();
      lattice(g, x, yy, ww, hh, 30, C.turq, '#2d5aa6');
      g.restore();
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
function drumTexture() {
  const w = 1024, h = 256, c = mkCanvas(w, h), g = c.getContext('2d');
  lattice(g, 0, 0, w, h, 28, C.turq, '#1f4f97');
  kufiBand(g, 0, 170, w, 70, 11);
  g.fillStyle = C.white; g.fillRect(0, 160, w, 6); g.fillRect(0, 244, w, 6);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
function glazeTexture() {
  const w = 512, h = 512, c = mkCanvas(w, h), g = c.getContext('2d'), r = rand(5);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6fd8cc'); gr.addColorStop(1, '#2fa39a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 10) for (let x = 0; x < w; x += 18) {
    g.fillStyle = `rgba(${r() > .5 ? '255,255,255' : '10,60,70'},${r() * .12})`;
    g.fillRect(x + ((y / 10) % 2) * 9, y, 17, 9);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function brickTexture(holes) {
  const w = 512, h = 512, c = mkCanvas(w, h), g = c.getContext('2d');
  brickBase(g, w, h, holes ? 13 : 17, [184, 134, 88]);
  if (holes) { g.fillStyle = 'rgba(40,24,12,.8)'; for (let y = 30; y < h; y += 64) for (let x = 20; x < w; x += 58) g.fillRect(x, y, 9, 9); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

/* ================= 3D-модель ================= */
function buildMausoleum() {
  const root = new THREE.Group();
  const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .85, metalness: 0 }, o));
  const wallT = wallTexture(); wallT.repeat.set(3, 1);
  const wallTs = wallT.clone(); wallTs.needsUpdate = true; wallTs.repeat.set(4, 1);
  const drumT = drumTexture(); drumT.repeat.set(3, 1);
  const glazeT = glazeTexture(); glazeT.repeat.set(6, 3);
  const brickT = brickTexture(false); brickT.repeat.set(4, 2);
  const portalT = brickTexture(true); portalT.repeat.set(1 / 9, 1 / 9);
  const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

  // основной объём
  const W = 46.5, L = 65.5, H = 18;
  const body = cast(new THREE.Mesh(new THREE.BoxGeometry(W, H, 55), [
    mat({ map: wallTs }), mat({ map: wallTs }), mat({ color: '#c79a6c' }), mat({ color: '#c79a6c' }), mat({ map: wallT }), mat({ map: wallT })
  ]));
  body.position.set(0, H / 2, -5.25); root.add(body);
  // парапет-полоса
  const band = new THREE.Mesh(new THREE.BoxGeometry(W + .4, .8, 55.4), mat({ color: C.lapis, roughness: .5 }));
  band.position.set(0, H + .1, -5.25); root.add(band);

  // портал (пештак) с аркой-нишей
  const PW = 40, PH = 37.5, depth = 8;
  const sh = new THREE.Shape(); sh.moveTo(-PW / 2, 0); sh.lineTo(PW / 2, 0); sh.lineTo(PW / 2, PH); sh.lineTo(-PW / 2, PH); sh.closePath();
  const hole = new THREE.Path(); const aw = 9, ah = 28;
  hole.moveTo(-aw, 0); hole.lineTo(-aw, ah * .55); hole.quadraticCurveTo(-aw, ah * .9, 0, ah); hole.quadraticCurveTo(aw, ah * .9, aw, ah * .55); hole.lineTo(aw, 0); hole.closePath();
  sh.holes.push(hole);
  const pg = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 24 });
  const portalMat = mat({ map: portalT });
  const portal = cast(new THREE.Mesh(pg, portalMat)); portal.position.z = 32.75 - depth; root.add(portal);
  const back = cast(new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 2.5), mat({ map: brickT }))); back.position.set(0, PH / 2, 32.75 - depth - 1.25); root.add(back);
  // дверь в глубине ниши
  const ds = new THREE.Shape(); ds.moveTo(-3, 0); ds.lineTo(-3, 6); ds.quadraticCurveTo(-3, 9, 0, 9.6); ds.quadraticCurveTo(3, 9, 3, 6); ds.lineTo(3, 0); ds.closePath();
  const door = new THREE.Mesh(new THREE.ShapeGeometry(ds), mat({ color: '#2a1a10' })); door.position.set(0, 0, 32.75 - depth + .02); root.add(door);
  // ряды малых ниш внутри арки
  for (let i = -1; i <= 1; i += 2) for (let k = 0; k < 2; k++) {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(3, 5), mat({ color: '#5a3a22' }));
    n.position.set(i * 5.5, 12 + k * 7, 32.75 - depth + .03); root.add(n);
  }
  // торчащие балки лесов
  const beamG = new THREE.CylinderGeometry(.14, .14, 1.4, 6); beamG.rotateX(Math.PI / 2);
  const beamM = mat({ color: '#6b4a2b' });
  const rr = rand(21), beams = new THREE.Group();
  for (let y = 3; y < PH - 1; y += 3.2) for (let x = -19; x <= 19; x += 2.9) {
    if (Math.abs(x) < 10.5 && y < 29) continue;
    if (rr() < .45) continue;
    const b = new THREE.Mesh(beamG, beamM); b.position.set(x, y, 32.75 + .6); beams.add(b);
  }
  for (let y = 3; y < PH - 1; y += 3.2) for (const s of [-1, 1]) if (rr() > .4) {
    const b = new THREE.Mesh(beamG, beamM); b.rotation.y = Math.PI / 2; b.position.set(s * (PW / 2 + .6), y, 30 - rr() * 5); beams.add(b);
  }
  root.add(beams);

  // угловые башни
  const towerG = new THREE.CylinderGeometry(3.0, 3.5, 32, 28);
  for (const s of [-1, 1]) {
    const t = cast(new THREE.Mesh(towerG, mat({ map: brickT }))); t.position.set(s * 21.6, 16, 30.2); root.add(t);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.0, .8, 28), mat({ color: '#8a5e36' })); cap.position.set(s * 21.6, 32.4, 30.2); root.add(cap);
  }
  const rearG = new THREE.CylinderGeometry(2.6, 3.0, 21, 24);
  for (const s of [-1, 1]) {
    const t = cast(new THREE.Mesh(rearG, mat({ map: drumT }))); t.position.set(s * 23, 10.5, -32.3); root.add(t);
  }

  // Казандык: барабан и конический купол
  const kd = cast(new THREE.Mesh(new THREE.CylinderGeometry(12.6, 12.8, 6, 48), mat({ map: brickT }))); kd.position.set(0, H + 3, 5); root.add(kd);
  const kp = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI / 2; kp.push(new THREE.Vector2(12.6 * Math.cos(a) * (1 - .12 * Math.sin(a)), 14.7 * Math.pow(Math.sin(a), .85))); }
  const kDome = cast(new THREE.Mesh(new THREE.LatheGeometry(kp, 48), mat({ map: brickT, color: '#d8b48c' }))); kDome.position.set(0, H + 6, 5); root.add(kDome);

  // Гурхана: барабан с плиткой и ребристый бирюзовый купол
  const gd = cast(new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.6, 9, 48, 1, true), mat({ map: drumT, side: THREE.DoubleSide }))); gd.position.set(0, H + 4.5, -18); root.add(gd);
  const gp = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI / 2; gp.push(new THREE.Vector2(Math.max(.001, 8.9 * Math.pow(Math.cos(a), .9) * (1 + .06 * Math.sin(a * 2))), 9.5 * Math.sin(a))); }
  const geo = new THREE.LatheGeometry(gp, 120), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), th = Math.atan2(z, x);
    const f = 1 + .055 * Math.pow(Math.abs(Math.cos(th * 16 / 2)), .5);
    pos.setX(i, x * f); pos.setZ(i, z * f);
  }
  geo.computeVertexNormals();
  const gDome = cast(new THREE.Mesh(geo, mat({ map: glazeT, roughness: .35, metalness: .05 }))); gDome.position.set(0, H + 9, -18); root.add(gDome);
  const fin = new THREE.Mesh(new THREE.CylinderGeometry(.08, .3, 2.4, 8), mat({ color: '#d9c27a', metalness: .6, roughness: .3 })); fin.position.set(0, H + 9 + 9.5 + 1.1, -18); root.add(fin);

  // купол мечети
  const md = cast(new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.5, 3, 32), mat({ map: drumT }))); md.position.set(-13.5, H + 1.5, 13); root.add(md);
  const mp = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI / 2; mp.push(new THREE.Vector2(Math.max(.001, 4.4 * Math.cos(a)), 5 * Math.sin(a))); }
  const mDome = cast(new THREE.Mesh(new THREE.LatheGeometry(mp, 32), mat({ map: glazeT, roughness: .4, color: '#9fd3ff' }))); mDome.position.set(-13.5, H + 3, 13); root.add(mDome);
  // малые купола
  for (const [x, z] of [[13.5, 13], [-13.5, -8], [13.5, -8]]) {
    const d = cast(new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat({ map: brickT }))); d.position.set(x, H, z); root.add(d);
  }

  // люди для масштаба
  const pm = mat({ color: '#e9e2d0' }), pm2 = mat({ color: '#3a6fc4' });
  for (const [x, z, c] of [[3, 40, pm], [4.2, 41, pm2], [-6, 44, pm], [-12, 38.5, pm2]]) {
    const p = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, 1.45, 8), c); b.position.y = .72; p.add(b);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 8), pm); hd.position.y = 1.6; p.add(hd);
    p.position.set(x, 0, z); p.traverse(o => o.castShadow = true); root.add(p);
  }

  // площадь
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(110, .3, 130), mat({ color: '#b9a585' })); plaza.position.set(0, -.15, 5); plaza.receiveShadow = true; root.add(plaza);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(600, 48), mat({ color: '#8a7658' })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.31; ground.receiveShadow = true; root.add(ground);
  return root;
}

const MODES = {
  day:  { sky: ['#8fb8de', '#dfe9ef'], fog: '#cfdde6', sun: [80, 120, 60], sunC: '#fff4e0', sunI: 1.25, hemi: ['#cfe6ff', '#a58860', .6], stars: 0, exp: 1 },
  dusk: { sky: ['#1b2748', '#e0935a'], fog: '#b67a55', sun: [-110, 26, 50], sunC: '#ffb070', sunI: 1.5, hemi: ['#6b7fb8', '#5a3a22', .5], stars: .25, exp: 1 },
  night:{ sky: ['#050a14', '#18284a'], fog: '#111d33', sun: [60, 90, -40], sunC: '#9fb8ff', sunI: .35, hemi: ['#3a5288', '#1a1410', .35], stars: 1, exp: 1 }
};

function createViewer(canvas, opts) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .5, 2000);
  scene.add(buildMausoleum());
  const hemi = new THREE.HemisphereLight('#fff', '#444', .5); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff', 1.2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 400 }); sun.shadow.bias = -.0005;
  scene.add(sun);
  const lamp = new THREE.PointLight('#ffb35c', 0, 60); lamp.position.set(0, 10, 36); scene.add(lamp);
  const starG = new THREE.BufferGeometry(); const sp = []; const r = rand(99);
  for (let i = 0; i < 1400; i++) { const th = r() * Math.PI * 2, ph = r() * Math.PI * .45; sp.push(700 * Math.cos(th) * Math.sin(ph + .15), 700 * Math.cos(ph + .15), 700 * Math.sin(th) * Math.sin(ph + .15)); }
  starG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starG, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
  scene.add(stars);
  scene.fog = new THREE.Fog('#b67a55', 140, 520);

  function setMode(name) {
    const m = MODES[name];
    canvas.style.background = `linear-gradient(180deg, ${m.sky[0]} 0%, ${m.sky[1]} 70%)`;
    scene.fog.color.set(m.fog);
    sun.position.set(...m.sun); sun.color.set(m.sunC); sun.intensity = m.sunI;
    hemi.color.set(m.hemi[0]); hemi.groundColor.set(m.hemi[1]); hemi.intensity = m.hemi[2];
    stars.material.opacity = m.stars;
    lamp.intensity = name === 'night' ? 2.2 : name === 'dusk' ? .8 : 0;
  }
  setMode(opts.mode || 'dusk');

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  let visible = true, raf = 0;
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) loop(); }, { threshold: 0 });
  io.observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  const api = { renderer, scene, camera, setMode, onFrame: null };
  function loop(t) {
    raf = 0; if (!visible) return;
    if (api.onFrame) api.onFrame(t || 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  resize(); loop();
  return api;
}

let heroViewer, modelViewer;
function initThree() {
  if (!window.THREE) return false;
  // ---- hero ----
  const hc = document.getElementById('heroCanvas');
  heroViewer = createViewer(hc, { mode: 'dusk' });
  const hcam = heroViewer.camera;
  let ang = 0.55;
  heroViewer.onFrame = () => {
    if (!REDUCED) ang += 0.0009;
    const wide = hc.clientWidth > 900;
    const R = wide ? 150 : 175;
    hcam.position.set(Math.sin(ang) * R, wide ? 24 : 30, Math.cos(ang) * R);
    const tx = wide ? -30 : 0;
    const off = new THREE.Vector3(Math.cos(ang), 0, -Math.sin(ang)).multiplyScalar(tx);
    hcam.lookAt(off.x, 17, off.z);
  };

  // ---- интерактивная модель ----
  const mc = document.getElementById('modelCanvas');
  modelViewer = createViewer(mc, { mode: 'dusk' });
  const cam = modelViewer.camera; cam.position.set(70, 38, 95);
  const ctrl = new THREE.OrbitControls(cam, mc);
  ctrl.target.set(0, 14, 0); ctrl.enableDamping = true; ctrl.dampingFactor = .08;
  ctrl.minDistance = 25; ctrl.maxDistance = 240; ctrl.maxPolarAngle = Math.PI * .49; ctrl.enablePan = false;
  ctrl.autoRotate = !REDUCED; ctrl.autoRotateSpeed = .5;
  const hint = document.getElementById('hint');
  ctrl.addEventListener('start', () => { ctrl.autoRotate = false; hint.textContent = 'колесо или щипок: приближение'; fly = null; });

  const SPOTS = [
    { id: 1, t: 'Главный портал', p: [0, 30, 33], cam: [22, 22, 95], look: [0, 18, 30], d: 'Пештак высотой 37,5 м смотрит на юго-восток. Это самая высокая стена здания, и её так и не облицевали плиткой.' },
    { id: 2, t: 'Балки лесов', p: [-15, 14, 33.4], cam: [-26, 12, 52], look: [-14, 13, 32], d: 'Деревянные балки остались от строительных лесов 1405 года. По ним видно, как возводили здание.' },
    { id: 3, t: 'Купол Казандыка', p: [0, 38.5, 5], cam: [55, 52, 50], look: [0, 30, 5], d: 'Купол над главным залом 18,2 × 18,2 м. Его называют самым большим кирпичным куполом Средней Азии.' },
    { id: 4, t: 'Бирюзовый купол', p: [0, 37, -18], cam: [-48, 42, -62], look: [0, 30, -18], d: 'Ребристый купол над Гурханой, залом с надгробием Ясави. Он покрыт бирюзовой глазурью и стоит на барабане с узорами.' },
    { id: 5, t: 'Узорные стены', p: [-23.4, 10, -12], cam: [-70, 12, -16], look: [-23, 10, -12], d: 'Боковые фасады выложены глазурованным кирпичом: ниши в два яруса, сетки гириха и надписи квадратным куфи.' },
    { id: 6, t: 'Угловые башни', p: [21.6, 33, 30.2], cam: [58, 30, 60], look: [21, 22, 30], d: 'Круглые башни-гульдасты подпирают портал по углам. Сзади стоят ещё две, пониже, покрытые плиткой.' },
    { id: 7, t: 'Масштаб', p: [2, 3, 41], cam: [14, 4, 60], look: [0, 10, 36], d: 'Фигурки у входа ростом 175 см. Рядом с порталом человек кажется крошечным.' }
  ];
  const stage = document.getElementById('stage'), list = document.getElementById('spotList'), info = document.getElementById('spotInfo');
  const pins = SPOTS.map(s => {
    const b = document.createElement('button'); b.className = 'pin'; b.textContent = s.id; b.setAttribute('aria-label', s.t);
    b.addEventListener('click', () => go(s)); stage.appendChild(b);
    const li = document.createElement('li'); const lb = document.createElement('button');
    lb.innerHTML = `<b>0${s.id}</b><span></span>`; lb.querySelector('span').textContent = s.t;
    lb.addEventListener('click', () => go(s)); li.appendChild(lb); list.appendChild(li);
    return { s, b, lb, v: new THREE.Vector3(...s.p) };
  });
  let fly = null;
  function go(s) {
    ctrl.autoRotate = false;
    fly = { t0: performance.now(), p0: cam.position.clone(), l0: ctrl.target.clone(), p1: new THREE.Vector3(...s.cam), l1: new THREE.Vector3(...s.look) };
    pins.forEach(p => { p.b.classList.toggle('on', p.s === s); p.lb.classList.toggle('on', p.s === s); });
    info.innerHTML = '<h3></h3><p></p>'; info.querySelector('h3').textContent = s.t; info.querySelector('p').textContent = s.d;
  }
  const tmp = new THREE.Vector3(), ray = new THREE.Raycaster(), dir = new THREE.Vector3();
  const solids = []; modelViewer.scene.traverse(o => { if (o.isMesh && o.geometry.type !== 'CircleGeometry') solids.push(o); });
  let tick = 0;
  modelViewer.onFrame = (now) => {
    if (fly) {
      const k = Math.min(1, (performance.now() - fly.t0) / (REDUCED ? 1 : 1400));
      const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      cam.position.lerpVectors(fly.p0, fly.p1, e); ctrl.target.lerpVectors(fly.l0, fly.l1, e);
      if (k >= 1) fly = null;
    }
    ctrl.update();
    const w = mc.clientWidth, h = mc.clientHeight; tick++;
    pins.forEach(p => {
      tmp.copy(p.v).project(cam);
      const off = tmp.z > 1 || Math.abs(tmp.x) > 1.05 || Math.abs(tmp.y) > 1.05;
      p.b.classList.toggle('off', off);
      if (!off && tick % 6 === 0) {
        dir.copy(p.v).sub(cam.position); const dist = dir.length(); ray.set(cam.position, dir.normalize()); ray.far = dist - 1.2;
        p.b.classList.toggle('hid', ray.intersectObjects(solids, false).length > 0 && !p.b.classList.contains('on'));
      }
      p.b.style.transform = `translate(${(tmp.x * .5 + .5) * w}px, ${(-tmp.y * .5 + .5) * h}px)`;
    });
  };
  document.querySelectorAll('.modes button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.modes button').forEach(x => x.classList.toggle('on', x === b));
    modelViewer.setMode(b.dataset.mode);
  }));
  return true;
}
if (!initThree()) addEventListener('load', initThree);

/* ================= план ================= */
(() => {
  const ROOMS = [
    { k: 'kaz', n: 'Казандык', r: [141, 335, 182, 182], tag: 'главный зал', size: ['18,2 × 18,2 м', 'стены до 3 м'], d: 'Самый большой зал, накрытый огромным куполом. Название происходит от слова «казан»: в центре стоит тайказан. Здесь собирались паломники и суфии.' },
    { k: 'gur', n: 'Гурхана', r: [177, 165, 110, 110], tag: 'усыпальница', size: ['7,5 × 7,5 м', 'надгробие 3,25 × 2 м'], d: 'Самое священное место: здесь находится надгробие Ходжи Ахмеда Ясави. Снаружи над Гурханой поднимается бирюзовый ребристый купол.' },
    { k: 'mos', n: 'Мечеть', r: [20, 340, 105, 180], tag: 'место молитвы', size: ['с михрабом'], d: 'Небольшая мечеть с михрабом, нишей, указывающей направление на Мекку. Внутри сохранились остатки старинных росписей.' },
    { k: 'lib', n: 'Кітапхана', r: [340, 340, 105, 180], tag: 'библиотека', size: ['книги и рукописи'], d: 'Здесь хранились книги и рукописи. Мавзолей был и местом учёбы, куда приходили за знаниями.' },
    { k: 'bak', n: 'Большой Аксарай', r: [20, 150, 120, 170], tag: 'парадный зал', size: ['«белый дворец»'], d: 'Аксарай означает «белый дворец». В этом зале проходили торжественные собрания и приёмы.' },
    { k: 'sak', n: 'Малый Аксарай', r: [325, 150, 120, 170], tag: 'зал с надгробиями', size: ['43 надгробия', '1431–1917'], d: 'Здесь стоят 43 надгробия: самое раннее датировано 1431 годом, самое позднее 1917-м.' },
    { k: 'ash', n: 'Асхана', r: [20, 20, 205, 110], tag: 'трапезная', size: ['еда для паломников'], d: 'Столовая, где кормили паломников и бедняков. Забота о нуждающихся была частью учения Ясави.' },
    { k: 'kud', n: 'Кудукхана', r: [240, 20, 205, 110], tag: 'колодец', size: ['святая вода'], d: 'Зал с колодцем. Воду из него паломники считали целебной и брали с собой.' },
    { k: 'por', n: 'Портал', r: [20, 540, 425, 100], tag: 'вход', size: ['высота 37,5 м', 'не достроен'], d: 'Огромный входной портал. Через арку попадаешь прямо в Казандык. Работы на нём прервались в 1405 году.' }
  ];
  const g = document.getElementById('rooms'), card = document.getElementById('roomCard'), tabs = document.getElementById('roomTabs');
  const NS = 'http://www.w3.org/2000/svg';
  const els = ROOMS.map(r => {
    const rect = document.createElementNS(NS, 'rect');
    const [x, y, w, h] = r.r;
    Object.entries({ x, y, width: w, height: h, rx: 2, class: 'room', tabindex: 0, role: 'button', 'aria-label': r.n }).forEach(([a, v]) => rect.setAttribute(a, v));
    if (r.k === 'kaz' || r.k === 'gur') rect.setAttribute('rx', 4);
    const t = document.createElementNS(NS, 'text'); t.setAttribute('x', x + w / 2); t.setAttribute('y', y + h / 2 + 5); t.setAttribute('text-anchor', 'middle'); t.textContent = r.n;
    if (w < 130 && r.n.length > 9) { t.textContent = ''; r.n.split(' ').forEach((part, i, arr) => { const ts = document.createElementNS(NS, 'tspan'); ts.setAttribute('x', x + w / 2); ts.setAttribute('dy', i ? 18 : -(arr.length - 1) * 9); ts.textContent = part; t.appendChild(ts); }); }
    g.append(rect, t);
    const b = document.createElement('button'); b.textContent = r.n; tabs.appendChild(b);
    const pick = () => show(r);
    rect.addEventListener('click', pick); rect.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    b.addEventListener('click', pick);
    return { r, rect, b };
  });
  // купол Казандыка на схеме
  const circ = document.createElementNS(NS, 'circle'); circ.setAttribute('cx', 232); circ.setAttribute('cy', 426); circ.setAttribute('r', 78); circ.setAttribute('fill', 'none'); circ.setAttribute('stroke', 'rgba(69,194,182,.45)'); circ.setAttribute('stroke-dasharray', '4 6'); circ.setAttribute('pointer-events', 'none'); g.appendChild(circ);
  const arch = document.createElementNS(NS, 'path'); arch.setAttribute('d', 'M200 640 V600 Q200 572 232 566 Q264 572 264 600 V640'); arch.setAttribute('fill', 'none'); arch.setAttribute('stroke', 'rgba(210,154,95,.7)'); arch.setAttribute('stroke-width', 2); arch.setAttribute('pointer-events', 'none'); g.appendChild(arch);
  function show(r) {
    els.forEach(e => { e.rect.classList.toggle('on', e.r === r); e.b.classList.toggle('on', e.r === r); });
    card.innerHTML = '<span class="tag"></span><h3></h3><p></p><div class="size"></div>';
    card.querySelector('.tag').textContent = r.tag; card.querySelector('h3').textContent = r.n; card.querySelector('p').textContent = r.d;
    r.size.forEach(s => { const sp = document.createElement('span'); sp.textContent = s; card.querySelector('.size').appendChild(sp); });
  }
  show(ROOMS[0]);
})();

/* ================= рисунок портала ================= */
(() => {
  const cv = document.getElementById('portalCanvas'), g = cv.getContext('2d');
  let W, H, beams = [], start = 0;
  function build() {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio, 2);
    W = cv.width = Math.round(r.width * d); H = cv.height = Math.round(r.height * d);
    const rr = rand(4); beams = [];
    for (let y = H * .08; y < H * .95; y += H * .055) for (let x = W * .06; x < W * .96; x += W * .07) {
      const inArch = Math.abs(x - W / 2) < W * .26 && y > H * .22;
      if (!inArch && rr() > .35) beams.push({ x, y, l: W * (.02 + rr() * .02), d: rr() });
    }
  }
  function draw(now) {
    const k = REDUCED ? 1 : Math.min(1, (now - start) / 1800);
    brickBase(g, W, H, 31, [176, 124, 78]);
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, 'rgba(12,21,34,.0)'); sky.addColorStop(1, 'rgba(12,21,34,.35)');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // арка
    const ax = W * .24, aw = W * .52, ay = H * .18, ah = H * .82;
    g.fillStyle = '#3a2616'; archPath(g, ax, ay, aw, ah); g.fill();
    g.strokeStyle = 'rgba(239,226,200,.18)'; g.lineWidth = W * .012; archPath(g, ax - W * .02, ay - W * .02, aw + W * .04, ah + W * .04); g.stroke();
    // сталактиты-мукарнасы в своде
    g.fillStyle = 'rgba(210,154,95,.28)';
    for (let row = 0; row < 4; row++) for (let i = 0; i < 6 + row; i++) {
      const cx = ax + aw * (.2 + .6 * (i + .5) / (6 + row)), cy = ay + ah * (.12 + row * .06);
      g.beginPath(); g.moveTo(cx - W * .025, cy); g.lineTo(cx, cy - H * .025); g.lineTo(cx + W * .025, cy); g.lineTo(cx, cy + H * .02); g.fill();
    }
    // дверь
    g.fillStyle = '#1a100a'; archPath(g, W * .42, H * .7, W * .16, H * .3); g.fill();
    // балки: появляются по очереди
    beams.forEach((b, i) => {
      const t = Math.min(1, Math.max(0, k * beams.length * 1.3 - i * 1.0) / 1.2);
      if (t <= 0) return;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(b.x + b.l * .3, b.y + W * .012, b.l * t, W * .01);
      g.fillStyle = `rgb(${100 + b.d * 30 | 0},${70 + b.d * 20 | 0},${40 + b.d * 10 | 0})`;
      g.fillRect(b.x - W * .008, b.y - W * .008, W * .016, W * .016);
      g.fillRect(b.x, b.y - W * .006, b.l * t, W * .012);
    });
    // фигура для масштаба
    const ph = H * .045, px = W * .5, py = H;
    g.fillStyle = C.sand; g.fillRect(px - ph * .12, py - ph, ph * .24, ph * .8); g.beginPath(); g.arc(px, py - ph * 1.05, ph * .12, 0, 7); g.fill();
    if (k < 1) requestAnimationFrame(draw);
  }
  build(); draw(0);
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); start = performance.now(); requestAnimationFrame(draw); } }, { threshold: .3 });
  io.observe(cv);
  addEventListener('resize', () => { build(); draw(performance.now() + 1e5); });
})();

/* ================= редактор узора ================= */
(() => {
  const cv = document.getElementById('tileCanvas'), g = cv.getContext('2d');
  const N = 16, S = cv.width / N;
  const COLORS = [
    { n: 'Кирпич', c: '#bf8a58' }, { n: 'Бирюза', c: C.turq }, { n: 'Лазурь', c: '#2d5aa6' }, { n: 'Белая глазурь', c: C.white }, { n: 'Тёмная глина', c: '#6e4527' }
  ];
  let cur = 1;
  const grid = Array.from({ length: N }, () => Array(N).fill(0));
  const preset = [
    '22222222', '21111111', '21333331', '21322231', '21321231', '21322231', '21333331', '21111111'
  ];
  const preset2 = [
    '00100100', '01110111', '00100100', '11111111', '00100100', '01110111', '00100100', '11111111'
  ];
  function loadPreset(p) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) setCell(x, y, +p[y][x], true); render(); }
  function setCell(x, y, v, quiet) {
    const m = [[x, y], [N - 1 - x, y], [x, N - 1 - y], [N - 1 - x, N - 1 - y]];
    m.forEach(([a, b]) => grid[b][a] = v);
    if (!quiet) render();
  }
  function render() {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v = grid[y][x];
      g.fillStyle = '#4a2f1a'; g.fillRect(x * S, y * S, S, S);
      g.fillStyle = COLORS[v].c; g.fillRect(x * S + 2, y * S + 2, S - 4, S - 4);
      if (v !== 0 && v !== 4) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x * S + 4, y * S + 4, S - 8, (S - 8) * .3); }
    }
    g.strokeStyle = 'rgba(239,226,200,.2)'; g.lineWidth = 2; g.setLineDash([8, 8]);
    g.beginPath(); g.moveTo(cv.width / 2, 0); g.lineTo(cv.width / 2, cv.height); g.moveTo(0, cv.height / 2); g.lineTo(cv.width, cv.height / 2); g.stroke(); g.setLineDash([]);
  }
  let painting = false;
  function cellFrom(e) {
    const r = cv.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / r.width * N), y = Math.floor((e.clientY - r.top) / r.height * N);
    return [Math.min(N - 1, Math.max(0, x)), Math.min(N - 1, Math.max(0, y))];
  }
  cv.addEventListener('pointerdown', e => { painting = true; cv.setPointerCapture(e.pointerId); const [x, y] = cellFrom(e); setCell(x, y, cur); });
  cv.addEventListener('pointermove', e => { if (!painting) return; const [x, y] = cellFrom(e); if (grid[y][x] !== cur) setCell(x, y, cur); });
  cv.addEventListener('pointerup', () => painting = false);
  cv.addEventListener('pointercancel', () => painting = false);
  const pal = document.getElementById('palette');
  COLORS.forEach((c, i) => {
    const b = document.createElement('button'); b.className = 'swatch' + (i === cur ? ' on' : ''); b.style.background = c.c; b.setAttribute('aria-label', c.n); b.title = c.n;
    b.addEventListener('click', () => { cur = i; pal.querySelectorAll('.swatch').forEach((s, j) => s.classList.toggle('on', j === i)); });
    pal.appendChild(b);
  });
  const mk = (t, f) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = t; b.addEventListener('click', f); pal.appendChild(b); };
  mk('Узор 1', () => loadPreset(preset));
  mk('Узор 2', () => loadPreset(preset2));
  mk('Очистить', () => { grid.forEach(r => r.fill(0)); render(); });
  loadPreset(preset);
})();

/* ================= тайказан ================= */
(() => {
  const NS = 'http://www.w3.org/2000/svg', scale = 100; // 1 м = 100 единиц
  const base = 330, cx = 245, R = 2.45 / 2 * scale;
  const k = document.getElementById('kazanShape');
  const hK = 1.58 * scale; // высота около 1,58 м
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', `M ${cx - R} ${base - hK} Q ${cx - R} ${base - 20} ${cx - 40} ${base - 16} L ${cx - 50} ${base} L ${cx + 50} ${base} L ${cx + 40} ${base - 16} Q ${cx + R} ${base - 20} ${cx + R} ${base - hK} Z`);
  path.setAttribute('fill', '#8a6a3c'); path.setAttribute('stroke', '#d9c27a'); path.setAttribute('stroke-width', 2);
  const rim = document.createElementNS(NS, 'ellipse'); rim.setAttribute('cx', cx); rim.setAttribute('cy', base - hK); rim.setAttribute('rx', R); rim.setAttribute('ry', 14); rim.setAttribute('fill', '#3b2a16'); rim.setAttribute('stroke', '#d9c27a'); rim.setAttribute('stroke-width', 2);
  const bandP = document.createElementNS(NS, 'path'); bandP.setAttribute('d', `M ${cx - R + 4} ${base - hK + 40} Q ${cx} ${base - hK + 58} ${cx + R - 4} ${base - hK + 40}`); bandP.setAttribute('fill', 'none'); bandP.setAttribute('stroke', 'rgba(217,194,122,.6)'); bandP.setAttribute('stroke-width', 10); bandP.setAttribute('stroke-dasharray', '3 5');
  k.append(path, rim, bandP);
  const hw = document.createElementNS(NS, 'line'); Object.entries({ x1: cx - R, x2: cx + R, y1: base + 12, y2: base + 12, stroke: 'rgba(69,194,182,.8)' }).forEach(([a, v]) => hw.setAttribute(a, v)); k.appendChild(hw);
  const person = document.getElementById('person');
  const range = document.getElementById('heightRange'), out = document.getElementById('heightOut'), pl = document.getElementById('personLabel');
  function drawPerson(cm) {
    const h = cm / 100 * scale, x = 520, head = h * .13;
    person.innerHTML = '';
    const body = document.createElementNS(NS, 'path');
    body.setAttribute('d', `M ${x - h * .1} ${base} L ${x - h * .09} ${base - h * .5} L ${x - h * .13} ${base - h * .8} L ${x + h * .13} ${base - h * .8} L ${x + h * .09} ${base - h * .5} L ${x + h * .1} ${base} Z`);
    body.setAttribute('fill', C.sand);
    const hd = document.createElementNS(NS, 'circle'); hd.setAttribute('cx', x); hd.setAttribute('cy', base - h + head * .55); hd.setAttribute('r', head * .55); hd.setAttribute('fill', C.sand);
    const ln = document.createElementNS(NS, 'line'); Object.entries({ x1: 20, x2: 600, y1: base - h, y2: base - h, stroke: 'rgba(239,226,200,.25)', 'stroke-dasharray': '4 6' }).forEach(([a, v]) => ln.setAttribute(a, v));
    person.append(ln, body, hd);
    out.textContent = cm + ' см'; pl.textContent = cm + ' см';
  }
  range.addEventListener('input', () => drawPerson(+range.value));
  drawPerson(175);
})();

/* ================= тест ================= */
(() => {
  const Q = [
    { q: 'Кто приказал построить мавзолей?', a: ['Тимур (Тамерлан)', 'Хан Абылай', 'Чингисхан', 'Улугбек'], c: 0, e: 'Стройку начали по приказу Тимура в конце XIV века.' },
    { q: 'Почему главный портал остался недостроенным?', a: ['Кончился кирпич', 'В 1405 году умер Тимур', 'Так задумали архитекторы', 'Помешало землетрясение'], c: 1, e: 'После смерти Тимура в 1405 году работы остановились.' },
    { q: 'Как называется главный зал мавзолея?', a: ['Гурхана', 'Асхана', 'Казандык', 'Кудукхана'], c: 2, e: 'Казандык, от слова «казан»: в нём стоит тайказан.' },
    { q: 'Сколько лет тайказан пробыл в Эрмитаже?', a: ['3 месяца', '12 лет', '54 года', '100 лет'], c: 2, e: 'Его увезли в 1935 году на три месяца, а вернули только в 1989-м.' },
    { q: 'Как называется сборник стихов Ясави?', a: ['«Шахнаме»', '«Диван-и Хикмет»', '«Кутадгу билиг»', '«Манас»'], c: 1, e: '«Диван-и Хикмет», то есть «Книга мудрости».' },
    { q: 'Кто был первым наставником Ясави?', a: ['Юсуф Хамадани', 'Аль-Фараби', 'Арыстан-баб', 'Абай'], c: 2, e: 'Арыстан-баб. Поэтому паломники сначала едут к его мавзолею.' },
    { q: 'В каком году мавзолей включили в список ЮНЕСКО?', a: ['1978', '1991', '2003', '2015'], c: 2, e: 'В 2003 году, первым из памятников Казахстана.' }
  ];
  const box = document.getElementById('quizBox');
  let i = 0, score = 0;
  function view() {
    if (i >= Q.length) {
      const msg = score === Q.length ? 'Идеально! Ты настоящий знаток.' : score >= 5 ? 'Отлично, почти всё запомнил.' : score >= 3 ? 'Неплохо! Пролистай страницу ещё раз.' : 'Стоит перечитать главы выше.';
      box.innerHTML = `<div class="q-meta"><span>Результат</span><span></span></div><div class="q-bar"><i style="width:100%"></i></div><p class="q-text">${score} из ${Q.length}</p><p class="q-explain"></p><div class="q-foot"><button class="btn primary" id="again">Пройти заново</button></div>`;
      box.querySelector('.q-explain').textContent = msg;
      box.querySelector('#again').onclick = () => { i = 0; score = 0; view(); };
      return;
    }
    const q = Q[i];
    box.innerHTML = `<div class="q-meta"><span>Вопрос ${i + 1} из ${Q.length}</span><span>Верно: ${score}</span></div><div class="q-bar"><i style="width:${i / Q.length * 100}%"></i></div><p class="q-text"></p><div class="q-opts"></div><p class="q-explain"></p><div class="q-foot"></div>`;
    box.querySelector('.q-text').textContent = q.q;
    const opts = box.querySelector('.q-opts');
    q.a.forEach((t, j) => {
      const b = document.createElement('button'); b.textContent = t;
      b.onclick = () => {
        opts.querySelectorAll('button').forEach((x, k) => { x.disabled = true; if (k === q.c) x.classList.add('ok'); });
        if (j === q.c) score++; else b.classList.add('bad');
        box.querySelector('.q-explain').textContent = (j === q.c ? 'Верно! ' : 'Не совсем. ') + q.e;
        box.querySelector('.q-meta span:last-child').textContent = 'Верно: ' + score;
        const nx = document.createElement('button'); nx.className = 'btn primary'; nx.textContent = i + 1 < Q.length ? 'Следующий вопрос' : 'Узнать результат';
        nx.onclick = () => { i++; view(); }; box.querySelector('.q-foot').appendChild(nx); nx.focus({ preventScroll: true });
      };
      opts.appendChild(b);
    });
  }
  view();
})();

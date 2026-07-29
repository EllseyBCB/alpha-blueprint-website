/* Alpha Blueprint – WebGL-Hero: goldenes 3D-Markenzeichen (Three.js).
   Läuft nur auf großen Viewports mit Maus, pausiert außerhalb des Sichtbereichs
   und fällt bei fehlendem WebGL auf den CSS-Würfel zurück. */
import * as THREE from "./vendor/three.module.min.js";

(function () {
  const host = document.querySelector(".hero-3d");
  if (!host) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(min-width: 880px)").matches) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch (e) {
    return; // CSS-Würfel bleibt als Fallback stehen
  }

  const SIZE = 460;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(SIZE, SIZE);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 6.2);

  /* Spiegel-Umgebung für das Metall: kleine Lichtbox statt externem HDR */
  const envScene = new THREE.Scene();
  const mkLight = (color, intensity, x, y, z, sx, sy) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(sx, sy),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    );
    m.material.color.multiplyScalar(intensity);
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  };
  mkLight(0xfff3cf, 4.5, 4, 5, 3, 6, 3);      // warmes Hauptlicht oben
  mkLight(0xd4af37, 2.2, -6, 1, -2, 5, 5);    // goldener Reflex seitlich
  mkLight(0x241c09, 1.4, 0, -6, 2, 8, 4);     // dunkler Boden
  mkLight(0xfff8e2, 3.0, 2, 0, -6, 3, 6);     // Kante von hinten
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();

  /* Das Markenzeichen: extrudierter goldener Dreiecksring (das "A") */
  const outer = new THREE.Shape();
  outer.moveTo(0, 1.25);
  outer.lineTo(-1.15, -0.9);
  outer.lineTo(1.15, -0.9);
  outer.closePath();
  const inner = new THREE.Path();
  inner.moveTo(0, 0.62);
  inner.lineTo(-0.62, -0.55);
  inner.lineTo(0.62, -0.55);
  inner.closePath();
  outer.holes.push(inner);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geo.center();
  const gold = new THREE.MeshStandardMaterial({
    color: 0xdcb84a,
    metalness: 0.88,
    roughness: 0.3,
    envMapIntensity: 1.6,
  });
  const mark = new THREE.Mesh(geo, gold);
  scene.add(mark);

  /* Goldstaub-Partikel */
  const N = 90;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 7;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ color: 0xecd06f, size: 0.035, transparent: true, opacity: 0.75, depthWrite: false })
  );
  scene.add(dust);

  const key = new THREE.DirectionalLight(0xfff1c4, 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x6b5a1e, 1.5));

  /* Einhängen: CSS-Würfel weichen lassen, Canvas einblenden */
  host.classList.add("webgl-on");
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  /* Maus-Parallaxe (gelerpt, kein React auf jedes Event) */
  let tx = 0, ty = 0, cx = 0, cy = 0;
  window.addEventListener("pointermove", (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 0.9;
    ty = (e.clientY / window.innerHeight - 0.5) * 0.6;
  }, { passive: true });

  /* Nur rendern, wenn Hero sichtbar und Tab aktiv */
  let inView = true, running = false, raf = null;
  const clock = new THREE.Clock();
  const tick = () => {
    raf = null;
    if (!inView || document.hidden) { running = false; return; }
    const t = clock.getElapsedTime();
    cx += (tx - cx) * 0.05;
    cy += (ty - cy) * 0.05;
    mark.rotation.y = t * 0.45 + cx;
    mark.rotation.x = Math.sin(t * 0.35) * 0.12 + cy;
    dust.rotation.y = t * 0.03;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
    running = true;
  };
  const start = () => { if (!running && !raf) raf = requestAnimationFrame(tick); };

  const hero = document.querySelector(".hero");
  if (hero) {
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (inView) start();
    }).observe(hero);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });
  start();
})();

export const id = "galaxy3d";
export const label = "🌌 Galaxy (3D)";
export const engine = "webgl";

const STAR_COUNT = 2400;

export async function create(canvas) {
  const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
  camera.position.set(0, 0, 260);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(STAR_COUNT * 3);
  const basePositions = new Float32Array(STAR_COUNT * 3);
  const colorsAttr = new Float32Array(STAR_COUNT * 3);
  const freqIndex = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    const arm = i % 3;
    const t = Math.random();
    const angle = t * Math.PI * 6 + (arm * Math.PI * 2) / 3;
    const radius = t * 220 + Math.random() * 18;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.random() - 0.5) * 20 * (1 - t * 0.6);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;
    freqIndex[i] = Math.random();
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colorsAttr, 3));

  const material = new THREE.PointsMaterial({
    size: 2.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const coreGeo = new THREE.SphereGeometry(14, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  function hexToThreeColor(hex) {
    return new THREE.Color(hex);
  }

  function updateColors(colors, timeSec) {
    const c1 = hexToThreeColor(colors.c1);
    const c2 = hexToThreeColor(colors.mode === "solid" ? colors.c1 : colors.c2);
    const colorAttrArr = geometry.attributes.color.array;
    for (let i = 0; i < STAR_COUNT; i++) {
      let col;
      if (colors.mode === "rainbow") {
        const hue = (freqIndex[i] * 360 + timeSec * 30) % 360;
        col = new THREE.Color().setHSL(hue / 360, 0.85, 0.6);
      } else {
        col = c1.clone().lerp(c2, freqIndex[i]);
      }
      colorAttrArr[i * 3] = col.r;
      colorAttrArr[i * 3 + 1] = col.g;
      colorAttrArr[i * 3 + 2] = col.b;
    }
    geometry.attributes.color.needsUpdate = true;
    core.material.color = colors.mode === "rainbow" ? new THREE.Color().setHSL((timeSec * 30 % 360) / 360, 0.8, 0.7) : c1;
  }

  function applyAudio(freq, volume, sensitivity, timeSec, staticMode) {
    const posArr = geometry.attributes.position.array;
    for (let i = 0; i < STAR_COUNT; i++) {
      const fi = Math.floor(freqIndex[i] * freq.length);
      const mag = freq[fi] || 0;
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];
      const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      const push = 1 + mag * 0.6 * sensitivity;
      posArr[i * 3] = bx * push;
      posArr[i * 3 + 1] = by * push + (staticMode ? 0 : Math.sin(timeSec * 2 + i) * 1.5);
      posArr[i * 3 + 2] = bz * push;
    }
    geometry.attributes.position.needsUpdate = true;
    core.scale.setScalar(1 + volume * sensitivity * 1.8);
    if (!staticMode) {
      points.rotation.y = timeSec * 0.08;
    }
  }

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function renderFrame(colors) {
    if (colors.transparent) {
      renderer.setClearColor(0x000000, 0);
    } else {
      renderer.setClearColor(new THREE.Color(colors.bg), 1);
    }
    renderer.render(scene, camera);
  }

  return {
    resize(w, h) {
      resize(w, h);
    },
    render(frame) {
      updateColors(frame.colors, frame.time);
      applyAudio(frame.freq, frame.volume, frame.colors.sensitivity, frame.time, false);
      renderFrame(frame.colors);
    },
    renderAverage(frame) {
      updateColors(frame.colors, 0.6);
      points.rotation.y = 0.6;
      applyAudio(frame.freq, frame.volume, frame.colors.sensitivity, 0.6, true);
      renderFrame(frame.colors);
    },
    destroy() {
      geometry.dispose();
      material.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      renderer.dispose();
    },
  };
}

import { resolveColor } from "../colors.js";

export const id = "particleSwarm";
export const label = "✨ Partikelschwarm";
export const engine = "2d";

const PARTICLE_COUNT = 160;

export function create(canvas) {
  const ctx = canvas.getContext("2d");
  let particles = [];
  let w = 0;
  let h = 0;

  function initParticles() {
    particles = new Array(PARTICLE_COUNT).fill(0).map((_, i) => ({
      angle: (i / PARTICLE_COUNT) * Math.PI * 2,
      baseRadius: 40 + Math.random() * 30,
      speed: 0.2 + Math.random() * 0.6,
      wobble: Math.random() * Math.PI * 2,
      size: 1.5 + Math.random() * 2.5,
    }));
  }
  initParticles();

  function paintBackground(colors) {
    if (colors.transparent) {
      ctx.clearRect(0, 0, w, h);
    } else {
      ctx.fillStyle = colors.bg;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawSwarm(freq, volume, colors, timeSec, alphaMul, spreadMul) {
    const cx = w / 2;
    const cy = h / 2;
    const spread = Math.min(w, h) * 0.42 * spreadMul * colors.sensitivity;

    ctx.save();
    ctx.shadowBlur = colors.glow;
    ctx.shadowColor = colors.mode === "solid" ? colors.c1 : colors.c2;

    particles.forEach((p, i) => {
      const freqIdx = Math.floor((i / particles.length) * freq.length);
      const mag = freq[freqIdx];
      const r = p.baseRadius + mag * spread + Math.sin(timeSec * p.speed + p.wobble) * 14;
      const angle = p.angle + timeSec * p.speed * 0.15;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r * 0.8;
      const size = p.size + mag * 6 * colors.sensitivity + volume * 4;

      ctx.globalAlpha = (0.4 + mag * 0.6) * alphaMul;
      ctx.fillStyle = resolveColor(colors, i / particles.length, timeSec);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  return {
    resize(nw, nh) {
      w = nw;
      h = nh;
    },
    render(frame) {
      w = frame.width;
      h = frame.height;
      paintBackground(frame.colors);
      drawSwarm(frame.freq, frame.volume, frame.colors, frame.time, 1, 1);
    },
    renderAverage(frame) {
      w = frame.width;
      h = frame.height;
      paintBackground(frame.colors);
      for (let layer = 2; layer >= 0; layer--) {
        drawSwarm(frame.freq, frame.volume, frame.colors, layer * 2.1, layer === 0 ? 1 : 0.45, 1 + layer * 0.25);
      }
    },
    destroy() {},
  };
}

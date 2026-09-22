import { resolveColor } from "../colors.js";

export const id = "kaleidoscope";
export const label = "🔮 Kaleidoskop";
export const engine = "2d";

const SEGMENTS = 8;
const BINS_PER_WEDGE = 28;

export function create(canvas) {
  const ctx = canvas.getContext("2d");

  function paintBackground(w, h, colors, trail) {
    if (colors.transparent) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    ctx.globalAlpha = trail;
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  function drawWedge(freq, colors, timeSec, radius, alphaMul) {
    const wedgeAngle = (Math.PI * 2) / SEGMENTS;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < BINS_PER_WEDGE; i++) {
      const t = i / (BINS_PER_WEDGE - 1);
      const angle = t * wedgeAngle;
      const freqIdx = Math.floor(t * (freq.length - 1));
      const mag = freq[freqIdx];
      const r = radius * 0.1 + mag * radius * 0.9;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = alphaMul * 0.55;
    ctx.fillStyle = resolveColor(colors, 0.5, timeSec);
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < BINS_PER_WEDGE; i++) {
      const t = i / (BINS_PER_WEDGE - 1);
      const angle = t * wedgeAngle;
      const freqIdx = Math.floor(t * (freq.length - 1));
      const mag = freq[freqIdx];
      const r = radius * 0.1 + mag * radius * 0.9;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.globalAlpha = alphaMul;
    ctx.lineWidth = 2;
    ctx.strokeStyle = resolveColor(colors, 0.9, timeSec);
    ctx.stroke();
  }

  function drawKaleidoscope(w, h, freq, colors, timeSec, opts) {
    const { alphaMul = 1, radiusMul = 1, spin = true } = opts;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.46 * radiusMul * colors.sensitivity;
    const wedgeAngle = (Math.PI * 2) / SEGMENTS;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin ? timeSec * 0.06 : 0.4);
    ctx.shadowBlur = colors.glow;
    ctx.shadowColor = colors.mode === "solid" ? colors.c1 : colors.c2;

    for (let s = 0; s < SEGMENTS; s++) {
      ctx.save();
      ctx.rotate(s * wedgeAngle);
      if (s % 2 === 1) ctx.scale(1, -1);
      drawWedge(freq, colors, timeSec, radius, alphaMul);
      ctx.restore();
    }

    // glowing core
    ctx.globalAlpha = alphaMul;
    ctx.shadowBlur = colors.glow * 1.5;
    ctx.fillStyle = resolveColor(colors, 0.05, timeSec);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.06 + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  return {
    resize() {},
    render(frame) {
      const { width: w, height: h, freq, colors, time } = frame;
      paintBackground(w, h, colors, 0.16);
      drawKaleidoscope(w, h, freq, colors, time, { spin: true });
    },
    renderAverage(frame) {
      const { width: w, height: h, freq, colors } = frame;
      paintBackground(w, h, colors, 1);
      for (let layer = 2; layer >= 0; layer--) {
        drawKaleidoscope(w, h, freq, colors, layer * 0.5, {
          alphaMul: layer === 0 ? 1 : 0.35,
          radiusMul: 1 + layer * 0.2,
          spin: false,
        });
      }
    },
    destroy() {},
  };
}

import { makeRadialGradient, resolveColor } from "../colors.js";

export const id = "radialSpectrum";
export const label = "☀️ Radial-Spektrum";
export const engine = "2d";

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

  function drawRing(w, h, freq, colors, timeSec, radiusScale, alphaMul, rotationSpeed) {
    const cx = w / 2;
    const cy = h / 2;
    const baseR = Math.min(w, h) * 0.16 * radiusScale;
    const maxLen = Math.min(w, h) * 0.32 * colors.sensitivity;
    const n = 128;
    const rotation = timeSec * rotationSpeed;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.shadowBlur = colors.glow;
    ctx.shadowColor = colors.mode === "solid" ? colors.c1 : colors.c2;
    ctx.globalAlpha = alphaMul;

    for (let i = 0; i < n; i++) {
      const t = i / n;
      const angle = t * Math.PI * 2;
      const freqIdx = Math.floor(Math.pow(t, 2.3) * (freq.length - 1));
      const mag = freq[freqIdx];
      const len = baseR + mag * maxLen;
      const x1 = Math.cos(angle) * baseR;
      const y1 = Math.sin(angle) * baseR;
      const x2 = Math.cos(angle) * len;
      const y2 = Math.sin(angle) * len;
      ctx.strokeStyle = resolveColor(colors, i / n, timeSec);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // inner glowing core
    ctx.shadowBlur = colors.glow * 1.5;
    ctx.fillStyle = makeRadialGradient(ctx, 0, 0, 0, baseR, colors, timeSec);
    ctx.beginPath();
    ctx.arc(0, 0, baseR * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  return {
    resize() {},
    render(frame) {
      const { width: w, height: h, freq, colors, time } = frame;
      paintBackground(w, h, colors, 0.18);
      drawRing(w, h, freq, colors, time, 1, 1, 0.15);
    },
    renderAverage(frame) {
      const { width: w, height: h, freq, colors } = frame;
      paintBackground(w, h, colors, 1);
      for (let layer = 2; layer >= 0; layer--) {
        drawRing(w, h, freq, colors, layer * 1.1, 1 + layer * 0.35, layer === 0 ? 1 : 0.4, layer * 0.4);
      }
    },
    destroy() {},
  };
}

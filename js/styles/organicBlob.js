import { makeRadialGradient } from "../colors.js";

export const id = "organicBlob";
export const label = "🫧 Organischer Blob";
export const engine = "2d";

const POINTS = 96;

export function create(canvas) {
  const ctx = canvas.getContext("2d");

  function paintBackground(w, h, colors) {
    if (colors.transparent) {
      ctx.clearRect(0, 0, w, h);
    } else {
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawBlob(w, h, freq, colors, timeSec, alphaMul, scaleMul) {
    const cx = w / 2;
    const cy = h / 2;
    const baseR = Math.min(w, h) * 0.22 * scaleMul;
    const maxWobble = Math.min(w, h) * 0.22 * colors.sensitivity;

    ctx.save();
    ctx.globalAlpha = alphaMul;
    ctx.shadowBlur = colors.glow * 1.2;
    ctx.shadowColor = colors.mode === "solid" ? colors.c1 : colors.c2;

    ctx.beginPath();
    const pts = [];
    for (let i = 0; i <= POINTS; i++) {
      const angle = (i / POINTS) * Math.PI * 2;
      const freqIdx = Math.floor((i / POINTS) * freq.length);
      const mag = freq[freqIdx];
      const noise = Math.sin(angle * 3 + timeSec * 1.4) * 0.15 + Math.sin(angle * 7 - timeSec * 0.8) * 0.08;
      const r = baseR + mag * maxWobble + noise * maxWobble * 0.5;
      pts.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      });
    }

    ctx.moveTo((pts[0].x + pts[pts.length - 1].x) / 2, (pts[0].y + pts[pts.length - 1].y) / 2);
    for (let i = 0; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    ctx.closePath();

    ctx.fillStyle = makeRadialGradient(ctx, cx, cy, baseR * 0.2, baseR + maxWobble, colors, timeSec);
    ctx.fill();

    ctx.restore();
  }

  return {
    resize() {},
    render(frame) {
      const { width: w, height: h, freq, colors, time } = frame;
      paintBackground(w, h, colors);
      drawBlob(w, h, freq, colors, time, 0.9, 1);
    },
    renderAverage(frame) {
      const { width: w, height: h, freq, colors } = frame;
      paintBackground(w, h, colors);
      for (let layer = 2; layer >= 0; layer--) {
        drawBlob(w, h, freq, colors, layer * 1.7, layer === 0 ? 0.95 : 0.35, 1 + layer * 0.3);
      }
    },
    destroy() {},
  };
}

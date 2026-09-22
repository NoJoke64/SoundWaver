import { makeLinearGradient, rgba } from "../colors.js";

export const id = "waveLine";
export const label = "🌊 Wellenlinie";
export const engine = "2d";

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

  function drawWave(w, h, waveform, colors, timeSec, lineWidth, glowBoost) {
    const mid = h / 2;
    const amp = (h / 2.4) * colors.sensitivity;

    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowBlur = colors.glow + glowBoost;
    ctx.shadowColor = colors.mode === "solid" ? colors.c1 : colors.c2;
    ctx.strokeStyle = makeLinearGradient(ctx, 0, 0, w, 0, colors, timeSec);

    ctx.beginPath();
    const step = w / (waveform.length - 1);
    for (let i = 0; i < waveform.length; i++) {
      const x = i * step;
      const y = mid + waveform[i] * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // mirrored faint reflection
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    for (let i = 0; i < waveform.length; i++) {
      const x = i * step;
      const y = mid - waveform[i] * amp * 0.6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  return {
    resize() {},
    render(frame) {
      const { width: w, height: h, waveform, colors, time } = frame;
      paintBackground(w, h, colors);
      drawWave(w, h, waveform, colors, time, 3, 0);
    },
    renderAverage(frame) {
      const { width: w, height: h, waveform, colors } = frame;
      paintBackground(w, h, colors);
      // layered echoes for a richer still image
      for (let layer = 2; layer >= 0; layer--) {
        ctx.save();
        ctx.globalAlpha = layer === 0 ? 1 : 0.35 - layer * 0.1;
        const scaled = waveform.map((v) => v * (1 + layer * 0.18));
        drawWave(w, h, scaled, colors, layer * 0.6, 4 + layer * 2, layer * 6);
        ctx.restore();
      }
    },
    destroy() {},
  };
}

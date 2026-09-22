import { makeLinearGradient, resolveColor, rgba } from "../colors.js";

export const id = "waveLine";
export const label = "🌊 Wellenlinie";
export const engine = "2d";

const BINS = 110;

function smooth(arr, passes = 2) {
  let out = arr.slice();
  for (let p = 0; p < passes; p++) {
    const next = out.slice();
    for (let i = 1; i < out.length - 1; i++) {
      next[i] = (out[i - 1] + out[i] * 2 + out[i + 1]) / 4;
    }
    out = next;
  }
  return out;
}

function sampleBins(freq, n) {
  const out = new Array(n);
  const step = freq.length / n;
  for (let i = 0; i < n; i++) {
    out[i] = freq[Math.min(freq.length - 1, Math.floor(i * step))];
  }
  return out;
}

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

  // y-axis = wavelength (low frequency / long wavelength at the bottom,
  // high frequency / short wavelength at the top). Horizontal deviation
  // from the center spine = loudness of that frequency band.
  function drawRibbon(w, h, freq, colors, timeSec, opts) {
    const { alphaMul = 1, ampMul = 1, wobble = true, widthMul = 1 } = opts;
    const cx = w / 2;
    const maxDev = (w / 2.5) * colors.sensitivity * ampMul;
    const margin = h * 0.04;
    const usableH = h - margin * 2;

    const raw = sampleBins(freq, BINS);
    const mags = smooth(raw, 2);

    const left = [];
    const right = [];
    for (let i = 0; i < BINS; i++) {
      const t = i / (BINS - 1);
      const y = h - margin - t * usableH;
      const wob = wobble ? Math.sin(timeSec * 1.6 + i * 0.35) * 3 : 0;
      const dev = Math.max(2, mags[i] * maxDev + wob);
      left.push({ x: cx - dev, y });
      right.push({ x: cx + dev, y });
    }

    ctx.save();
    ctx.globalAlpha = alphaMul;
    ctx.shadowBlur = colors.glow;
    ctx.shadowColor = colors.mode === "solid" ? colors.c1 : colors.c2;

    // filled ribbon between the two mirrored curves
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < left.length; i++) {
      const midX = (left[i - 1].x + left[i].x) / 2;
      const midY = (left[i - 1].y + left[i].y) / 2;
      ctx.quadraticCurveTo(left[i - 1].x, left[i - 1].y, midX, midY);
    }
    ctx.lineTo(right[right.length - 1].x, right[right.length - 1].y);
    for (let i = right.length - 2; i >= 0; i--) {
      const midX = (right[i + 1].x + right[i].x) / 2;
      const midY = (right[i + 1].y + right[i].y) / 2;
      ctx.quadraticCurveTo(right[i + 1].x, right[i + 1].y, midX, midY);
    }
    ctx.closePath();
    ctx.fillStyle = makeLinearGradient(ctx, 0, h, 0, 0, colors, timeSec);
    ctx.globalAlpha = alphaMul * 0.32;
    ctx.fill();

    // crisp outline strokes on both sides
    ctx.globalAlpha = alphaMul;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 2.5 * widthMul;
    [left, right].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(side[0].x, side[0].y);
      for (let i = 1; i < side.length; i++) {
        const midX = (side[i - 1].x + side[i].x) / 2;
        const midY = (side[i - 1].y + side[i].y) / 2;
        ctx.quadraticCurveTo(side[i - 1].x, side[i - 1].y, midX, midY);
      }
      const t = 1;
      ctx.strokeStyle = resolveColor(colors, t, timeSec);
      ctx.stroke();
    });

    // faint center spine for orientation
    ctx.globalAlpha = alphaMul * 0.25;
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba("#ffffff", 0.5);
    ctx.beginPath();
    ctx.moveTo(cx, margin);
    ctx.lineTo(cx, h - margin);
    ctx.stroke();

    ctx.restore();
  }

  return {
    resize() {},
    render(frame) {
      const { width: w, height: h, freq, colors, time } = frame;
      paintBackground(w, h, colors);
      drawRibbon(w, h, freq, colors, time, { wobble: true });
    },
    renderAverage(frame) {
      const { width: w, height: h, freq, colors } = frame;
      paintBackground(w, h, colors);
      for (let layer = 2; layer >= 0; layer--) {
        drawRibbon(w, h, freq, colors, layer * 0.9, {
          alphaMul: layer === 0 ? 1 : 0.3,
          ampMul: 1 + layer * 0.22,
          widthMul: 1 + layer * 0.6,
          wobble: false,
        });
      }
    },
    destroy() {},
  };
}

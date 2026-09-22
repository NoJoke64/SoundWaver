import { resolveColor } from "../colors.js";

export const id = "waveLine";
export const label = "🌊 Wellenlinie";
export const engine = "2d";

const BINS = 90;

function smooth(arr, passes = 1) {
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

// Real audio energy concentrates in the lowest ~20% of linear FFT bins,
// so a plain linear sweep leaves most of the range visually silent.
// A power curve spreads the bass/mid content over more of the axis and
// compresses the (usually quiet) highs instead of giving them equal space.
function sampleBins(freq, n, exponent = 2.3) {
  const out = new Array(n);
  const maxIdx = freq.length - 1;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const idx = Math.floor(Math.pow(t, exponent) * maxIdx);
    out[i] = freq[idx];
  }
  return out;
}

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

  // y-axis = wavelength: low frequency / long wavelength at the bottom,
  // high frequency / short wavelength at the top. Horizontal deviation
  // from the center spine = loudness of that frequency band.
  function drawWave(w, h, freq, colors, timeSec, opts) {
    const { alphaMul = 1, ampMul = 1, wobble = true, lineWidth = 2.4 } = opts;
    const cx = w / 2;
    const maxDev = (w / 7) * colors.sensitivity * ampMul;
    const margin = h * 0.05;
    const usableH = h - margin * 2;

    const raw = sampleBins(freq, BINS);
    const smoothed = smooth(raw, 1);
    const mags = smoothed.map((m) => Math.pow(m, 1.6));

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = lineWidth;
    ctx.shadowBlur = colors.glow;
    ctx.shadowColor = colors.mode === "solid" ? colors.c1 : colors.c2;

    for (const sign of [-1, 1]) {
      ctx.beginPath();
      let prevX, prevY;
      for (let i = 0; i < BINS; i++) {
        const t = i / (BINS - 1);
        const y = h - margin - t * usableH;
        const wob = wobble ? Math.sin(timeSec * 1.4 + i * 0.3) * 1.5 : 0;
        const dev = Math.max(1, mags[i] * maxDev + wob);
        const x = cx + sign * dev;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }
        prevX = x;
        prevY = y;

        if (i % 6 === 0) {
          ctx.save();
          ctx.globalAlpha = alphaMul * (0.5 + mags[i] * 0.5);
          ctx.fillStyle = resolveColor(colors, t, timeSec);
          ctx.beginPath();
          ctx.arc(x, y, 1.5 + mags[i] * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.globalAlpha = alphaMul;
      ctx.strokeStyle = resolveColor(colors, sign === -1 ? 0.15 : 0.85, timeSec);
      ctx.stroke();
    }

    ctx.restore();
  }

  return {
    resize() {},
    render(frame) {
      const { width: w, height: h, freq, colors, time } = frame;
      paintBackground(w, h, colors, 0.22);
      drawWave(w, h, freq, colors, time, { wobble: true });
    },
    renderAverage(frame) {
      const { width: w, height: h, freq, colors } = frame;
      paintBackground(w, h, colors, 1);
      for (let layer = 2; layer >= 0; layer--) {
        drawWave(w, h, freq, colors, layer * 0.9, {
          alphaMul: layer === 0 ? 1 : 0.3,
          ampMul: 1 + layer * 0.22,
          lineWidth: 2.4 + layer * 1.4,
          wobble: false,
        });
      }
    },
    destroy() {},
  };
}

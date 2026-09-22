export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

export function rgba(hex, alpha = 1) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function hslColor(hue, s = 85, l = 60, alpha = 1) {
  return `hsla(${hue % 360}, ${s}%, ${l}%, ${alpha})`;
}

/**
 * Resolves the "next" color for a given progress t (0..1) and time-based
 * hue offset, according to the active color config.
 */
export function resolveColor(colors, t, timeSec = 0, alpha = 1) {
  switch (colors.mode) {
    case "gradient":
      return withAlpha(mixHex(colors.c1, colors.c2, t), alpha);
    case "rainbow": {
      const hue = (t * 360 + timeSec * 40) % 360;
      return hslColor(hue, 85, 60, alpha);
    }
    case "solid":
    default:
      return rgba(colors.c1, alpha);
  }
}

function withAlpha(rgbString, alpha) {
  if (alpha === 1) return rgbString;
  const m = rgbString.match(/rgb\((\d+), (\d+), (\d+)\)/);
  if (!m) return rgbString;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
}

export function makeLinearGradient(ctx, x0, y0, x1, y1, colors, timeSec = 0) {
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  if (colors.mode === "rainbow") {
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      grad.addColorStop(i / steps, resolveColor(colors, i / steps, timeSec));
    }
  } else if (colors.mode === "gradient") {
    grad.addColorStop(0, rgba(colors.c1, 1));
    grad.addColorStop(1, rgba(colors.c2, 1));
  } else {
    grad.addColorStop(0, rgba(colors.c1, 1));
    grad.addColorStop(1, rgba(colors.c1, 1));
  }
  return grad;
}

export function makeRadialGradient(ctx, cx, cy, r0, r1, colors, timeSec = 0) {
  const grad = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
  if (colors.mode === "rainbow") {
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      grad.addColorStop(i / steps, resolveColor(colors, i / steps, timeSec));
    }
  } else if (colors.mode === "gradient") {
    grad.addColorStop(0, rgba(colors.c2, 1));
    grad.addColorStop(1, rgba(colors.c1, 1));
  } else {
    grad.addColorStop(0, rgba(colors.c1, 1));
    grad.addColorStop(1, rgba(colors.c1, 0.2));
  }
  return grad;
}

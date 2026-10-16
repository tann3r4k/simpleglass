/** Rounded-rect SDF + Snell-style edge bend. From liquid-glass-react (MIT, Max Rovensky). */

export function smoothStep(a, b, t) {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function roundedRectSDF(x, y, width, height, radius) {
  const qx = Math.abs(x) - width + radius;
  const qy = Math.abs(y) - height + radius;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - radius;
}

export const DEFAULT_BEZEL = 0.16;

/**
 * Fill RGBA displacement map. data is Uint8ClampedArray length w*h*4.
 * bezel is the bending rim as a fraction of the element. The center stays
 * neutral (128). 0.16 is wide enough to see on a large card. The previous
 * SDF stayed at 1 until the last 2 percent, so feDisplacementMap barely moved.
 */
export function fillDisplacement(data, w, h, bezel = DEFAULT_BEZEL) {
  const rim = bezel > 0 ? bezel : DEFAULT_BEZEL;
  const raw = new Float32Array(w * h * 2);
  let max = 1;
  let i = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ix = x / w - 0.5;
      const iy = y / h - 0.5;
      const edgeDist = Math.min(0.5 - Math.abs(ix), 0.5 - Math.abs(iy));
      const scaled = smoothStep(0, 1, Math.min(1, Math.max(0, edgeDist / rim)));
      const dx = w * ix * (scaled - 1);
      const dy = h * iy * (scaled - 1);
      raw[i++] = dx;
      raw[i++] = dy;
      max = Math.max(max, Math.abs(dx), Math.abs(dy));
    }
  }
  i = 0;
  for (let p = 0; p < w * h; p++) {
    const dx = raw[i++];
    const dy = raw[i++];
    const px = p % w;
    const py = (p / w) | 0;
    const edge = Math.min(px, py, w - px - 1, h - py - 1);
    const ef = Math.min(1, edge / 2);
    const o = p * 4;
    data[o] = Math.max(0, Math.min(255, ((dx * ef) / max + 0.5) * 255));
    data[o + 1] = Math.max(0, Math.min(255, ((dy * ef) / max + 0.5) * 255));
    data[o + 2] = data[o + 1];
    data[o + 3] = 255;
  }
  return data;
}

export function displacementDataURL(w = 128, h = 128, bezel = DEFAULT_BEZEL) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(w, h);
  fillDisplacement(img.data, w, h, bezel);
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

import { backdrop, composite } from "../../src/core/index.js";

async function loadResvg() {
  try {
    const { Resvg } = await import("@resvg/resvg-js");
    return Resvg;
  } catch (error) {
    if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
    throw new Error("SVG export requires the art dependencies. Run npm ci in the repository first.", { cause: error });
  }
}

export async function renderSvgFrames(fx, n, options) {
  const Resvg = await loadResvg();
  const { size: [w, h], origin: [x, y], fps, bg } = fx.meta;
  const frame = { w, h, light: new Uint32Array(w * h) };
  const background = backdrop(bg, w, h, y);
  const frames = [];

  for (let i = 0; i < n; i++) {
    const t = i / fps;
    const content = fx.mod.svg(t, options);
    if (typeof content !== "string") throw new Error(`${fx.id}: svg() must return SVG markup`);
    const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g transform="translate(${x} ${y})">${content}</g></svg>`;
    const image = new Resvg(source, { font: { loadSystemFonts: false } }).render();
    const clear = new Uint8ClampedArray(image.pixels);
    // Resvg's raw buffer is premultiplied. PNG and PixelFX's compositor expect straight RGBA.
    for (let p = 0; p < clear.length; p += 4) {
      const alpha = clear[p + 3];
      if (alpha === 0 || alpha === 255) continue;
      const scale = 255 / alpha;
      clear[p] = Math.round(clear[p] * scale);
      clear[p + 1] = Math.round(clear[p + 1] * scale);
      clear[p + 2] = Math.round(clear[p + 2] * scale);
    }
    frame.color = new Uint32Array(clear.buffer);
    const color = composite(frame, new Uint8ClampedArray(clear.length), background);
    frames.push({ t, clear, color });
  }
  return { w, h, fps, n, frames };
}

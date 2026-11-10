#!/usr/bin/env node

import { readdirSync, rmSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { artPreview } from "./lib/art-preview.mjs";
import { ROOT, contactSheet, loadEffect, renderFrames, save, spriteSheet, writeVideo } from "./lib/fxlib.mjs";
import { encodePNG } from "./lib/png.mjs";

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const USAGE = "node tools/art.mjs <recipe.mjs> [category/name ...] [--out DIR] [--opts JSON] [--list] [--frames] [--preview] [--gif]";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function pair(value, test) {
  return Array.isArray(value) && value.length === 2 && test(value[0], 0) && test(value[1], 1);
}

function positiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function validateAsset(asset) {
  if (!isObject(asset) || typeof asset.id !== "string" || !ID.test(asset.id)) {
    throw new Error("Asset id must use the format category/name with lowercase letters, digits or hyphens");
  }
  const { id, kind, effect, draw, svg, size, pivot = [0, 0], fps = 12, frames = 1, loop = false, slice, markers } = asset;
  if (!["ui", "character", "vfx"].includes(kind)) throw new Error(`${id}: invalid kind`);
  if (asset.options !== undefined && !isObject(asset.options)) throw new Error(`${id}: options must be an object`);
  if (effect !== undefined) {
    if (kind !== "vfx" || typeof effect !== "string" || !ID.test(effect) || draw !== undefined || svg !== undefined) {
      throw new Error(`${id}: effect must be a vfx effect id and cannot be combined with draw or svg`);
    }
    if (slice !== undefined || markers !== undefined) throw new Error(`${id}: slice and markers require draw or svg`);
    return;
  }
  const painter = typeof draw === "function" && svg === undefined;
  const vector = typeof svg === "function" && draw === undefined;
  if ((!painter && !vector) || !pair(size, positiveInteger)) throw new Error(`${id}: specify draw or svg and a positive [width, height]`);
  if (!pair(pivot, (v, i) => Number.isInteger(v) && v >= 0 && v <= size[i])) throw new Error(`${id}: pivot is outside the canvas`);
  if (!positiveInteger(fps) || !positiveInteger(frames) || typeof loop !== "boolean") throw new Error(`${id}: invalid timing`);
  if (slice !== undefined) {
    if (!Array.isArray(slice) || slice.length !== 4 || ![...slice].every((v) => Number.isInteger(v) && v >= 0)
      || slice[0] + slice[2] >= size[0] || slice[1] + slice[3] >= size[1]) {
      throw new Error(`${id}: invalid nine-slice margins`);
    }
  }
  if (markers !== undefined && (!isObject(markers) || !Object.values(markers).every((v) => Number.isInteger(v) && v >= 0 && v < frames))) {
    throw new Error(`${id}: markers must point to zero-based frame indices`);
  }
}

async function effectFor(asset) {
  if (asset.effect) {
    const fx = await loadEffect(asset.effect);
    return { ...fx, id: asset.id };
  }
  const { id, size, pivot = [0, 0], fps = 12, frames = 1, loop = false, options } = asset;
  // renderFrames includes the endpoint of a one-shot. Derive its sampling span from the requested frame count.
  const duration = (loop ? frames : frames - 1) / fps;
  const meta = { name: asset.name ?? id, size, origin: pivot, fps, duration, loop, options, bg: asset.kind === "character" ? "ground" : "dark" };
  return { id, meta, mod: { meta, draw: asset.draw, svg: asset.svg } };
}

async function renderAsset(asset, fx, options) {
  const merged = { ...asset.options, ...options };
  if (!asset.svg) return renderFrames(fx, { actor: false, options: merged });
  const { renderSvgFrames } = await import("./lib/svg-art.mjs");
  return renderSvgFrames(fx, asset.frames ?? 1, merged);
}

function writeSequence(directory, render) {
  const { w, h, frames } = render;
  const digits = Math.max(4, String(frames.length - 1).length);
  for (const [i, frame] of frames.entries()) {
    save(join(directory, `frame-${String(i).padStart(digits, "0")}.png`), encodePNG(w, h, frame.clear));
  }
  const frameFile = /^frame-(\d{4,})\.png$/;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const match = frameFile.exec(entry.name);
    if (entry.isFile() && match && (+match[1] >= frames.length || match[1].length !== digits)) {
      rmSync(join(directory, entry.name), { force: true });
    }
  }
  return `frames/frame-%0${digits}d.png`;
}

async function exportAsset(asset, out, flags, options) {
  const fx = await effectFor(asset);
  const render = await renderAsset(asset, fx, options);
  const { png, json } = spriteSheet(fx, render, "atlas");
  const info = json.meta.pixelfx;
  info.kind = asset.kind;
  info.rows = Math.ceil(info.frames / info.columns);
  info.seconds = info.frames / info.fps;
  if (asset.slice) info.slice = asset.slice;
  if (asset.markers) info.markers = asset.markers;

  const dir = join(out, asset.id);
  save(join(dir, "atlas.png"), png);
  save(join(dir, "atlas.json"), JSON.stringify(json, null, 2));
  save(join(dir, "preview.png"), contactSheet(fx, render, {
    max: asset.svg ? 6 : undefined,
    title: `${asset.id}  ${render.w}x${render.h}  ${render.n}F @${render.fps}`,
  }));

  const item = { ...info, atlas: `${asset.id}/atlas.png`, metadata: `${asset.id}/atlas.json`, preview: `${asset.id}/preview.png` };
  if (flags.frames) item.sequence = `${asset.id}/${writeSequence(join(dir, "frames"), render)}`;
  if (flags.gif && render.n > 1) {
    const scale = Math.max(1, Math.min(4, Math.floor(480 / Math.max(render.w, render.h))));
    if (!writeVideo(join(dir, "preview.gif"), render, scale)) throw new Error(`${asset.id}: --gif requires ffmpeg on PATH`);
    item.animation = `${asset.id}/preview.gif`;
  }
  console.log(`${asset.id}  ${render.n} frame(s) at ${render.fps} fps`);
  return item;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: "string" }, opts: { type: "string" }, list: { type: "boolean" },
      frames: { type: "boolean" }, preview: { type: "boolean" }, gif: { type: "boolean" }, help: { type: "boolean" },
    },
  });
  if (values.help) {
    console.log(USAGE);
    return;
  }
  const [input, ...ids] = positionals;
  if (!input) throw new Error(USAGE);
  const file = resolve(input);
  const { default: assets } = await import(pathToFileURL(file).href);
  if (!Array.isArray(assets) || assets.length === 0) throw new Error("Recipe must default-export a non-empty array of assets");
  const byId = new Map();
  for (const asset of assets) {
    validateAsset(asset);
    if (byId.has(asset.id)) throw new Error(`Duplicate asset id: ${asset.id}`);
    byId.set(asset.id, asset);
  }
  for (const id of ids) if (!byId.has(id)) throw new Error(`Unknown asset id: ${id}`);
  const selected = ids.length ? [...new Set(ids)].map((id) => byId.get(id)) : assets;
  if (values.list) {
    for (const asset of selected) console.log(asset.id);
    return;
  }

  const options = values.opts === undefined ? {} : JSON.parse(values.opts);
  if (!isObject(options)) throw new Error("--opts must be a JSON object");
  const recipe = basename(file, extname(file));
  const out = values.out === undefined ? join(ROOT, "records", "art", recipe) : resolve(values.out);
  const items = [];
  for (const asset of selected) items.push(await exportAsset(asset, out, values, options));
  const manifest = { recipe, assets: items };
  if (values.preview) {
    manifest.preview = "preview.html";
    const preview = save(join(out, manifest.preview), artPreview(recipe, items));
    console.log(`Playable preview -> ${preview}`);
  }
  const index = join(out, "index.json");
  save(index, JSON.stringify(manifest, null, 2));
  console.log(`${items.length} assets -> ${index}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

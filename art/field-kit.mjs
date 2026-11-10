import { BUTTON_SIZE, BUTTON_STATES, HUD_SIZE, drawAmmoIcon, drawButton, drawHud, drawPanel, drawVitalIcon } from "../src/art/hud.js";
import { drawScout, scoutClips, scoutPivot, scoutSize } from "../src/art/scout.js";
import { artTheme } from "../src/art/themes.js";

const panel = [96, 24];

export default [
  { id: "ui/hud", kind: "ui", size: HUD_SIZE, draw: (p, t, options) => drawHud(p, options) },
  {
    id: "ui/panel", kind: "ui", size: panel, slice: [5, 5, 5, 5],
    draw: (p, t, options) => drawPanel(p, 0, 0, ...panel, artTheme(options.theme)),
  },
  {
    id: "ui/vital-icon", kind: "ui", size: [12, 12],
    draw: (p, t, options) => drawVitalIcon(p, 2, 2, artTheme(options.theme).accent),
  },
  {
    id: "ui/ammo-icon", kind: "ui", size: [8, 12],
    draw: (p, t, options) => drawAmmoIcon(p, 2, 2, artTheme(options.theme).text),
  },
  ...BUTTON_STATES.map((state) => ({
    id: `ui/button-${state}`, kind: "ui", size: BUTTON_SIZE,
    draw: (p, t, options) => drawButton(p, state, options),
  })),
  ...Object.entries(scoutClips).map(([name, clip]) => ({
    id: `scout/${name}`, kind: "character", size: scoutSize, pivot: scoutPivot,
    fps: clip.fps, frames: clip.frames, loop: clip.loop, markers: clip.markers,
    draw: (p, t, options) => drawScout(p, clip, t, options),
  })),
  { id: "fx/muzzle-pistol", kind: "vfx", effect: "projectiles/muzzle-pistol" },
];

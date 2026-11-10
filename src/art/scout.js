import { DUMMY_PAL, READY, hex, poseAt, posed, skeleton } from "../core/index.js";
import { artTheme } from "./themes.js";

const FPS = 12;
const HOLD = { ...READY, lean: 1, fx: 10, fy: -21, bx: 1, by: -20 };
const AIM = { ...HOLD, crouch: 2, lean: 2, fx: 12, fy: -25, sa: 0 };
const RECOIL = { ...AIM, crouch: 3, lean: -1, fx: 9, fy: -26, sa: -0.19 };
const WALK = { ...HOLD, crouch: 2, lean: 3, fx: 9, fy: -21 };
const CONTACT = { ...WALK, ffx: 7, fbx: -6, ffy: -3, fby: -3 };

export const scoutSize = [64, 48];
export const scoutPivot = [25, 42];
export const scoutClips = {
  idle: {
    fps: FPS, frames: 12, loop: true,
    keys: [[0, HOLD], [0.5, { ...HOLD, crouch: 2, fy: -22, sa: -0.05 }], [1, HOLD]],
  },
  walk: {
    fps: FPS, frames: 12, loop: true,
    keys: [
      [0, CONTACT],
      [0.25, { ...WALK, crouch: 1, ffx: 0, fbx: 1, ffy: -3, fby: -8, sa: 0.08 }],
      [0.5, { ...CONTACT, ffx: -6, fbx: 7 }],
      [0.75, { ...WALK, crouch: 1, ffx: 1, fbx: 0, ffy: -8, fby: -3, sa: 0.08 }],
      [1, CONTACT],
    ],
  },
  fire: {
    fps: FPS, frames: 10, loop: false, markers: { fire: 3 },
    keys: [[0, HOLD], [2 / FPS, AIM], [3 / FPS, RECOIL, "snap"], [5 / FPS, AIM, "out"], [9 / FPS, HOLD]],
  },
};

const HELMETS = {
  visor: [".llll...", "lsssss..", "lssvvvv.", "lssvttt.", ".sssdd..", "..ddd..."],
  respirator: ["..lll...", ".lssss..", "lsssvv..", "lsssvt..", ".ssdddd.", "..dtdt..", "...ddd.."],
};

const RIG_TONES = {
  k: "ink", A: "armorLight", B: "armor", C: "armorShade", D: "armorDark",
  E: "armorShade", F: "armorDark", G: "panel", J: "inset", m: "accent",
};
const RIG_COLORS = Object.entries(RIG_TONES).map(([key, tone]) => [hex(DUMMY_PAL[key]) >>> 0, tone]);

/** Draw one pose around the feet. The helmet and weapon can be changed independently of the track. */
export function drawScout(p, clip, t, { theme, helmet = "visor", weapon = "pistol" } = {}) {
  if (!Object.hasOwn(HELMETS, helmet)) throw new Error(`Unknown scout helmet: ${helmet}`);
  if (weapon !== "pistol" && weapon !== "launcher") throw new Error(`Unknown scout weapon: ${weapon}`);
  const C = artTheme(theme);
  const pose = { ...poseAt(clip.keys, t), weapon, two: weapon === "launcher" };
  const body = posed(pose);
  const colors = new Map(RIG_COLORS.map(([color, tone]) => [color, C[tone]]));
  for (let i = 0; i < body.n; i++) p.px(body.xs[i], body.ys[i], colors.get(body.color[i]) ?? body.color[i]);

  const [hx, hy] = skeleton(pose).joints.head;
  const left = Math.round(hx) - 3, top = Math.round(hy) - 4;
  const shades = { l: C.armorLight, s: C.armorShade, d: C.ink, v: C.accent, t: C.text };
  HELMETS[helmet].forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = shades[row[x]];
      if (color) p.px(left + x, top + y, color);
    }
  });
}

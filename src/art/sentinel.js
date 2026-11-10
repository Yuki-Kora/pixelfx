import { poseAt, skeleton } from "../core/index.js";
import { artTheme } from "./themes.js";

export const sentinelSize = [112, 88];
export const sentinelPivot = [42, 77];

const SCALE = 1.85;

function brush(p, point) {
  function polygon(color, points, outline) {
    const vertices = points.map(([x, y]) => point(x, y));
    p.poly(vertices, color);
    if (outline) {
      for (let i = 0; i < vertices.length; i++) {
        p.line(...vertices[i], ...vertices[(i + 1) % vertices.length], outline);
      }
    }
  }

  return {
    polygon,
    line(color, x0, y0, x1, y1) { p.line(...point(x0, y0), ...point(x1, y1), color); },
  };
}

function translated(p, [x, y]) {
  return brush(p, (u, v) => [x + u, y + v]);
}

function limb(p, [x, y], [endX, endY], width, C, far) {
  const dx = endX - x, dy = endY - y, length = Math.hypot(dx, dy) || 1;
  const sideX = dy / length, sideY = -dx / length;
  const b = brush(p, (across, along) => [x + sideX * across + dx * along, y + sideY * across + dy * along]);
  const plate = far ? C.armorDark : C.armorShade;
  const highlight = far ? C.armorShade : C.armor;
  b.polygon(C.inset, [[-width, -0.04], [width, -0.04], [width - 1, 1.05], [-width + 1, 1.05]], C.ink);
  b.polygon(plate, [[-width, 0.03], [width - 1, 0.12], [width - 1, 0.66], [0, 0.86], [-width, 0.72]], C.ink);
  b.polygon(highlight, [[-width + 1, 0.14], [0, 0.15], [0, 0.64], [-width + 1, 0.55]]);
  b.line(far ? C.armorDark : C.armorLight, -width + 1, 0.18, 0, 0.18);
  b.line(C.ink, 0, 0.70, width - 2, 0.61);
}

function leg(p, joints, side, C, far) {
  const hip = joints[`hip${side}`], knee = joints[`knee${side}`], ankle = joints[`ankle${side}`];
  limb(p, hip, knee, 5, C, far);
  limb(p, knee, ankle, 4, C, far);
  const guard = translated(p, knee);
  guard.polygon(far ? C.armorDark : C.armor, [[-4, -2], [1, -4], [5, -2], [4, 2], [1, 4], [-3, 2]], C.ink);
  guard.line(far ? C.armorShade : C.armorLight, 0, -2, 3, -1);

  const boot = translated(p, ankle);
  boot.polygon(far ? C.armorDark : C.armorShade, [[-4, -4], [2, -4], [3, -2], [8, -2], [11, 0], [11, 2], [-4, 2]], C.ink);
  boot.line(far ? C.armorShade : C.armor, 4, -1, 8, -1);
  boot.line(C.inset, -3, 1, 9, 1);
}

function torso(p, joints, C) {
  const [x, y] = joints.chest;
  const lean = (joints.pelvis[0] - x) / (joints.pelvis[1] - y || 1);
  const b = brush(p, (u, v) => [x + u + lean * v, y + v]);

  // Radio, webbing and the oxygen canister sit behind the shell.
  b.polygon(C.armorDark, [[-16, -4], [-10, -8], [-5, -5], [-5, 12], [-9, 16], [-16, 13]], C.ink);
  b.polygon(C.armorShade, [[-17, 0], [-13, -2], [-11, 0], [-11, 12], [-14, 14], [-17, 12]], C.ink);
  b.line(C.armor, -16, 2, -16, 10);
  b.line(C.armorShade, -13, -7, -14, -15);
  b.line(C.accent, -14, -14, -14, -13);
  b.line(C.inset, -16, 6, -12, 6);

  b.polygon(C.armorDark, [[-8, -7], [5, -7], [10, -3], [10, 6], [6, 10], [5, 15], [-8, 16], [-10, 9], [-11, -1]], C.ink);
  b.polygon(C.armor, [[-7, -5], [5, -5], [8, -3], [8, 3], [2, 7], [-6, 5], [-9, 1]], C.ink);
  b.polygon(C.armorShade, [[-7, -2], [-1, -1], [-1, 4], [-6, 3]]);
  b.line(C.armorLight, -6, -4, 4, -4);
  b.line(C.armorLight, 4, -4, 6, -3);
  b.line(C.inset, 3, 1, 6, 1);
  b.line(C.accent, 4, 1, 5, 1);
  b.line(C.ink, -6, 8, 6, 8);
  b.polygon(C.inset, [[-8, 11], [7, 11], [7, 15], [-9, 15]], C.ink);
  b.polygon(C.armorShade, [[-8, 12], [-4, 12], [-4, 17], [-8, 17]], C.ink);
  b.polygon(C.armorShade, [[-2, 12], [2, 12], [2, 17], [-2, 17]], C.ink);
  b.line(C.warn, 4, 13, 6, 13);
}

function helmet(p, head, C, variant) {
  const b = translated(p, head);
  b.polygon(C.armorShade, [[-8, -3], [-5, -8], [3, -9], [8, -6], [9, -1], [10, 1], [7, 5], [4, 7], [-5, 5], [-8, 2]], C.ink);
  b.polygon(C.armor, [[-7, -3], [-4, -7], [3, -8], [7, -6], [5, -4], [-1, -4], [-4, 0]]);
  b.line(C.armorLight, -3, -6, 3, -7);
  b.line(C.armorLight, 3, -7, 6, -6);
  b.polygon(C.inset, [[-6, -1], [-3, -3], [1, -1], [0, 3], [-4, 4], [-6, 2]], C.ink);
  b.line(C.edge, -5, 0, -4, -1);
  b.line(C.warn, -4, 2, -3, 2);

  if (variant === "visor") {
    b.polygon(C.inset, [[0, -3], [7, -4], [9, -2], [9, 1], [6, 3], [2, 2]], C.ink);
    b.line(C.accent, 2, -1, 7, -2);
    b.line(C.text, 3, -1, 5, -1);
    b.line(C.armorLight, 2, 5, 5, 5);
  } else {
    b.line(C.accent, 3, -2, 7, -2);
    b.polygon(C.armorDark, [[2, 0], [8, 0], [9, 3], [6, 6], [2, 5]], C.ink);
    b.line(C.armorLight, 4, 2, 4, 4);
    b.line(C.armorLight, 6, 2, 6, 4);
  }
}

function weapon(p, [x, y], angle, C, carbine) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const b = brush(p, (u, v) => [x + dx * u - dy * v, y + dy * u + dx * v]);
  const length = carbine ? 29 : 17;
  const receiver = carbine ? 17 : 13;
  if (carbine) b.polygon(C.armorDark, [[-12, -3], [-3, -5], [1, -3], [0, 1], [-7, 1], [-12, 3]], C.ink);
  b.polygon(C.armorDark, [[0, -3], [6, -3], [4, 5], [0, 5], [-1, 2]], C.ink);
  b.polygon(C.inset, [[-2, -6], [receiver, -6], [receiver + 2, -4], [length, -4], [length, 0], [0, 0], [-3, -2]], C.ink);
  b.polygon(C.armor, [[-1, -5], [receiver - 1, -5], [receiver, -3], [0, -3]]);
  b.line(C.armorLight, 0, -5, receiver - 2, -5);
  b.line(C.armor, receiver + 2, -3, length - 1, -3);
  b.line(C.armorShade, length, -4, length, 0);
  b.line(C.warn, 3, -3, 6, -3);
  if (carbine) {
    b.polygon(C.armorShade, [[9, 0], [14, 0], [13, 6], [10, 7], [8, 4]], C.ink);
    b.line(C.armorDark, 12, 1, 11, 5);
    b.polygon(C.armorDark, [[5, -6], [6, -8], [11, -8], [12, -6]], C.ink);
    b.line(C.armor, 7, -7, 10, -7);
    for (const slot of [15, 18, 21]) b.line(C.armorShade, slot, -3, slot, -1);
  }
}

/** Draw the same pose tracks using native-resolution armor plates and pixel details. */
export function drawSentinel(p, clip, t, { theme, helmet: headgear = "visor", weapon: loadout = "carbine" } = {}) {
  if (headgear !== "visor" && headgear !== "respirator") throw new Error(`Unknown sentinel helmet: ${headgear}`);
  if (loadout !== "carbine" && loadout !== "pistol") throw new Error(`Unknown sentinel weapon: ${loadout}`);
  const C = artTheme(theme), pose = poseAt(clip.keys, t);
  const carbine = loadout === "carbine";
  const grip = carbine ? { bx: pose.fx + 5, by: pose.fy - 2 } : {};
  const { joints: solved } = skeleton({ ...pose, ...grip, ffy: pose.ffy ?? -3, fby: pose.fby ?? -3 });
  const j = Object.fromEntries(Object.entries(solved).map(([name, [x, y]]) => [name, [x * SCALE, y * SCALE]]));

  leg(p, j, "F", C, true);
  limb(p, j.shoulderF, j.elbowF, 4, C, true);
  limb(p, j.elbowF, j.handF, 3, C, true);
  leg(p, j, "N", C, false);
  torso(p, j, C);
  helmet(p, j.head, C, headgear);
  limb(p, j.shoulderN, j.elbowN, 4.8, C, false);
  limb(p, j.elbowN, j.handN, 3.7, C, false);

  const shoulder = translated(p, j.shoulderN);
  shoulder.polygon(C.armor, [[-5, -3], [-1, -5], [4, -4], [6, -1], [4, 3], [-4, 2]], C.ink);
  shoulder.line(C.armorLight, -3, -3, 3, -3);
  shoulder.line(C.accent, -3, -1, 0, -1);
  weapon(p, j.handN, pose.sa ?? 0, C, carbine);
  const glove = translated(p, j.handN);
  glove.polygon(C.armorShade, [[-3, -2], [1, -3], [3, -1], [3, 2], [0, 3], [-3, 1]], C.ink);
  glove.line(C.armor, -1, -1, 1, -1);
}

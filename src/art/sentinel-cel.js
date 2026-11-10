import { lerpPose, skeleton } from "../core/index.js";
import { scoutClips } from "./scout.js";

const SCALE = 2;
export const FPS = 24;
export const SIZE = [340 * SCALE, 300 * SCALE];
export const PIVOT = [121 * SCALE, 272 * SCALE];
export const CLIPS = Object.fromEntries(Object.entries(scoutClips).map(([id, clip]) => [id, {
  ...clip, frames: clip.frames * 2, markers: clip.markers && { fire: clip.markers.fire * 2 },
}]));

export const LOADOUTS = {
  field: {
    label: "FIELD", gear: "VISOR / CARBINE", ink: "#111d28", joint: "#223442", seam: "#304753",
    shade: "#456775", mid: "#658c96", base: "#8eb1b6", light: "#c4d9d7", white: "#eaf5e9",
    accent: "#69e3c1", accentDark: "#217d75", warn: "#ffa866", visor: "#122c38",
  },
  hazard: {
    label: "HAZARD", gear: "RESPIRATOR / PISTOL", ink: "#271d2c", joint: "#48343a", seam: "#63434a",
    shade: "#895e54", mid: "#b38362", base: "#d3a575", light: "#f6d1a2", white: "#fff0d1",
    accent: "#ffc25e", accentDark: "#bc702e", warn: "#fa7468", visor: "#362633",
  },
};

function shape(d, fill, stroke = "none", width = 0) {
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

function line(d, color, width = 1.5) {
  return shape(d, "none", color, width);
}

function place([x, y], contents, extra = "") {
  return `<g transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) ${extra}">${contents}</g>`;
}

function along([x, y], [endX, endY], contents) {
  const dx = endX - x, dy = endY - y;
  const length = Math.hypot(dx, dy) || 1;
  return `<g transform="matrix(${[dy / length, -dx / length, dx / 50, dy / 50, x, y].map((v) => v.toFixed(4)).join(" ")})">${contents}</g>`;
}

function muted(C) {
  return { ...C, white: C.light, light: C.mid, base: C.shade, mid: C.seam, shade: C.joint, accent: C.accentDark };
}

function leg(j, side, C) {
  const h = j[`hip${side}`], k = j[`knee${side}`], a = j[`ankle${side}`];
  const thigh = along(h, k,
    shape("M-13-7 Q-5-12 9-8 L15 3 13 21 10 50 -11 50 -15 29 -16 7Z", C.joint, C.ink, 2.5) +
    shape("M-12 2 Q-5-1 8 2 L11 14 9 27 5 37 -9 34 -13 22Z", C.base, C.ink, 1.7) +
    shape("M-12 10 -6 15 -4 29 6 34 5 37 -9 34 -13 22Z", C.shade) +
    shape("M-10 4 Q0 1 8 4 L9 8 -9 8Z", C.light) +
    line("M-11 39 7 41 M-8 44 6 45", C.seam, 1.7));

  const shin = along(k, a,
    shape("M-10-5 10-5 13 10 10 28 8 50 -9 53 -13 38 -15 15Z", C.joint, C.ink, 2.5) +
    shape("M-10 5 6 2 11 9 9 24 5 42 -7 44 -11 32 -13 18Z", C.base, C.ink, 1.7) +
    shape("M-10 8 -4 13 -3 34 5 38 5 42 -7 44 -11 32 -13 18Z", C.shade) +
    shape("M-8 7 6 5 8 8 5 12 -8 14Z", C.light) +
    line("M-6 18 5 16 M-5 23 4 21", C.mid, 1.35) +
    line("M1 35 5 34", C.accent, 2.3));

  const boot = place(a,
    shape("M-14-11 -2-13 10-8 14-4 26-3 34 2 34 8 28 9 -12 9 -16 5Z", C.joint, C.ink, 2.8) +
    shape("M-13-10 -3-10 7-8 9-4 3 1 -10 1Z", C.mid) +
    shape("M12-4 25-2 31 1 31 4 12 4 5 1Z", C.base) +
    line("M-11 5 H29 M-9 8 V6 M-2 8 V6 M6 8 V6 M22 8 V6", C.seam, 1.25));

  const knee = place(k,
    shape("M-11-5 -3-11 8-9 14-2 12 6 4 12 -7 8 -12 2Z", C.mid, C.ink, 2.2) +
    shape("M-8-4 -2-8 8-6 10-3 2 0 -7-1Z", C.light) +
    shape("M-7 3 3 5 11 2 10 6 4 9 -6 6Z", C.shade) +
    line("M3 3 8 2", C.seam, 1.3));
  return thigh + shin + boot + knee;
}

function pack(C) {
  return shape("M-24-19 -34-22 -47-12 -54 0 -53 25 -46 34 -30 36 -20 20Z", C.shade, C.ink, 2.9) +
    shape("M-31-19 -45-11 -49 0 -44 5 -32-2 -26-13Z", C.base, C.ink, 1.4) +
    shape("M-46 0 -54 4 -57 16 -55 31 -48 34 -43 25 -43 8Z", C.mid, C.ink, 2.1) +
    shape("M-53 6 -50 5 -49 24 -51 29 -54 27Z", C.light) +
    shape("M-42 11 -29 8 -26 17 -28 30 -39 33 -45 27Z", C.joint, C.ink, 1.7) +
    line("M-41 15 -31 13 M-41 20 -32 18 M-40 25 -32 23", C.mid, 1.65) +
    line("M-39-17 -42-35 -40-48", C.ink, 2.7) +
    line("M-40-47 -40-41", C.accent, 1.6) +
    line("M-47-8 -42-11", C.warn, 2);
}

function torso(j, C) {
  const lean = Math.atan2(j.pelvis[0] - j.chest[0], j.pelvis[1] - j.chest[1]) * -180 / Math.PI;
  return place(j.chest, pack(C) +
    shape("M-19-31 -4-34 14-29 28-18 31 1 24 14 21 32 14 48 -18 51 -31 39 -34 19 -34-11Z", C.joint, C.ink, 3.2) +
    shape("M-12-32 -5-39 10-39 19-33 18-25 7-21 -9-23Z", C.seam, C.ink, 2.5) +
    line("M-7-32 11-32 M-7-28 12-28", C.mid, 1.4) +
    shape("M-25-18 -12-26 12-24 26-16 27-2 17 10 1 14 -21 9 -28-1Z", C.base, C.ink, 2.5) +
    shape("M-24-13 -12-21 11-20 23-14 19-9 8-11 -9-12 -22-6Z", C.light) +
    shape("M-27-2 -14 1 -2 8 18 5 23 1 17 10 1 14 -21 9Z", C.shade) +
    shape("M-19-20 -13-24 -5-22 -9-11 -16 0 -22 0 -23-6Z", C.mid, C.ink, 1.3) +
    shape("M10-6 23-8 23-1 19 3 10 4Z", C.visor, C.ink, 1.3) +
    line("M13-2 19-3", C.accent, 2.6) +
    line("M-20 18 -6 23 13 20 M-21 24 -7 28 12 26", C.mid, 1.55) +
    shape("M-30 30 -17 33 0 34 20 29 19 40 4 45 -20 44 -29 41Z", C.ink) +
    shape("M-26 32 -13 33 -11 46 -14 50 -27 48 -29 41Z", C.shade, C.ink, 2) +
    shape("M-9 34 4 34 7 45 4 50 -10 50Z", C.mid, C.ink, 2) +
    line("M-26 36 -16 37 M-7 37 2 37", C.light, 1.7) +
    shape("M9 34 18 31 20 36 17 40 9 41Z", C.accentDark, C.ink, 1.5) +
    line("M12 36 16 35", C.warn, 1.7), `rotate(${lean.toFixed(2)})`);
}

function helmet(j, C, respirator) {
  const hood = shape("M-27-3 -27-12 Q-25-24-15-29 Q1-36 19-29 L28-21 33-7 32 5 25 17 17 23 -2 25 -19 17 -26 8Z", C.base, C.ink, 3.4) +
    shape("M-25-10 Q-24-24-12-28 Q4-33 18-27 L25-20 16-19 3-22 -11-20 -19-12Z", C.light) +
    shape("M-24-6 -15-14 -8-10 -11 3 -2 16 16 20 22 18 17 23 -2 25 -19 17 -26 8Z", C.shade) +
    shape("M-8-25 Q4-31 16-25 L19-22 Q8-24 0-22Z", C.white) +
    shape("M-20-9 -10-13 -3-8 -5 5 -11 10 -20 8 -23 1Z", C.seam, C.ink, 2.4) +
    shape("M-18-6 -12-9 -8-6 -9 2 -13 6 -18 4Z", C.mid) +
    line("M-17-5 -13-7 M-16 3 -13 2", C.light, 1.2) +
    line("M-12 0 H-10", C.warn, 1.8);

  const visor = shape("M-1-13 19-17 29-14 33-7 32 3 25 10 8 9 0 4 -4-3Z", C.visor, C.ink, 2.5) +
    shape("M2-11 19-14 28-12 30-7 23-8 11-5 0-2Z", C.accentDark) +
    shape("M7-6 21-10 29-9 26-6 15-4 8-1Z", C.accent) +
    line("M11-5 19-7", C.white, 1.75) +
    line("M9 6 24 6 28 3", C.mid, 1.2) +
    line("M7 18 16 17 22 14", C.light, 1.35);

  const mask = shape("M1-12 19-15 27-13 30-6 26-1 10 0 0-5Z", C.visor, C.ink, 2.3) +
    shape("M5-8 18-11 25-10 22-7 8-4Z", C.accent) +
    line("M11-7 19-9", C.white, 1.35) +
    shape("M4 0 23-3 30 1 30 10 22 19 8 20 1 15 -1 7Z", C.seam, C.ink, 2.4) +
    shape("M8 3 21 1 24 5 22 13 16 17 8 15 4 10Z", C.shade, C.ink, 1.45) +
    line("M9 5 10 12 M13 4 14 13 M17 3 18 11", C.light, 1.85) +
    line("M-4 8 -8 16 -15 17 -19 13", C.ink, 3) +
    line("M-7 14 -13 15 -17 13", C.mid, 1.2);

  const rotation = Math.atan2(j.head[0] - j.neck[0], j.neck[1] - j.head[1]) * 28 / Math.PI;
  return place(j.head, hood + (respirator ? mask : visor), `rotate(${rotation.toFixed(2)})`);
}

function arm(j, side, C) {
  const shoulder = j[`shoulder${side}`], elbow = j[`elbow${side}`], hand = j[`hand${side}`];
  return along(shoulder, elbow,
    shape("M-11-5 -3-10 9-7 13 5 11 22 9 46 3 52 -8 49 -12 31 -14 8Z", C.joint, C.ink, 2.6) +
    shape("M-12 1 -5-6 6-5 11 3 9 16 3 24 -7 23 -12 15Z", C.base, C.ink, 1.7) +
    shape("M-10 2 -4-4 5-3 8 1 0 4 -8 9Z", C.light) +
    shape("M-10 15 -3 17 8 14 5 21 2 24 -7 23Z", C.shade) +
    line("M-6 11 -2 13 3 10 M-6 15 -2 17 3 14", C.accent, 1.65) +
    line("M-7 30 7 29 M-6 36 7 35", C.seam, 1.4)) +
    along(elbow, hand,
      shape("M-9-3 8-4 12 8 10 25 8 43 6 50 -6 51 -10 44 -13 22 -13 8Z", C.joint, C.ink, 2.4) +
      shape("M-10 4 6 0 9 9 7 29 4 38 -7 39 -10 28 -12 12Z", C.mid, C.ink, 1.55) +
      shape("M-8 7 6 4 6 10 -8 16Z", C.light) +
      shape("M-9 22 -3 24 6 22 4 37 -7 39Z", C.shade) +
      line("M-6 19 5 15 M-6 43 H6", C.seam, 1.55));
}

function glove(hand, C, rotation) {
  return place(hand,
    shape("M-9-6 -3-11 4-10 9-5 10 4 6 11 -2 11 -9 6 -12 0Z", C.joint, C.ink, 2.25) +
    shape("M-8-5 -2-8 3-7 5-2 2 2 -5 3 -9 0Z", C.mid) +
    line("M2 1 7 1 M2 5 7 5", C.shade, 1.2), `rotate(${rotation.toFixed(2)})`);
}

function gun(hand, rotation, C, pistol) {
  const upper = pistol ? "M-10-19 45-19 54-16 55-5 48-2 2-3 -10-7Z" :
    "M-12-19 49-19 57-16 73-16 78-13 94-13 94-6 76-6 72-4 4-3 -12-8Z";
  const base = shape("M-8-7 14-6 10 4 6 22 -5 22 -10 15 -8 2Z", C.joint, C.ink, 2.7) +
    shape("M8-4 25-3 25 5 19 9 10 7 9 2 18 4 20 1Z", C.seam, C.ink, 2.2) +
    shape(upper, C.seam, C.ink, 2.9);

  const details = pistol ? shape("M-7-17 45-17 50-14 48-9 0-9 -7-11Z", C.base) +
    line("M-5-16 H44", C.light, 1.65) +
    line("M3-15 1-10 M7-15 5-10 M11-15 9-10 M44-12 H49", C.mid, 1.7) +
    line("M17-11 H29", C.warn, 2.1) +
    line("M12-20 H17 M44-21 H49", C.ink, 2.65) :
    shape("M-43-17 -12-15 -6-9 -11-4 -28-3 -36 8 -44 7Z", C.mid, C.ink, 2.5) +
    shape("M-41-15 -32-14 -33-3 -40 3Z", C.joint) +
    shape("M-9-16 H46 L51-14 47-9 -5-9 -9-11Z", C.base) +
    line("M-7-15 H43", C.light, 1.65) +
    shape("M26-4 44-4 44 6 39 19 30 20 24 15Z", C.mid, C.ink, 2.25) +
    line("M31 0 29 12 M37 0 34 15", C.shade, 1.45) +
    shape("M9-19 13-25 32-25 36-20 35-17 9-17Z", C.joint, C.ink, 1.75) +
    line("M15-23 H29 M33-22 33-19", C.mid, 1.55) +
    line("M52-12 H72 M78-10 H92", C.light, 1.55) +
    line("M51-8 H74 M57-13 V-8 M63-13 V-8 M69-13 V-8", C.shade, 1.5) +
    line("M15-11 H29", C.accent, 2.15);
  return place(hand, base + details, `rotate(${rotation.toFixed(2)})`);
}

function flash(hand, rotation, pistol, age) {
  if (age < 0 || age > 0.18) return "";
  const tip = pistol ? 55 : 94;
  const burst = age < 0.067 ? `<g opacity="${age < 0.04 ? 1 : 0.72}">` +
    shape("M0 0 11-5 8-15 18-7 33-12 27-5 47 0 27 5 33 13 18 7 8 14 11 5Z", "#ffad52", "#fa703b", 1.3) +
    shape("M1 0 16-4 25-3 37 0 24 3 15 4Z", "#fff3c8") +
    line("M32-8 40-13 M33 8 43 12", "#ffc272", 2) + `</g>` : "";
  const drift = age * 130;
  const smoke = age > 0.04 ? `<g opacity="${Math.max(0, (0.18 - age) * 3.3).toFixed(3)}" transform="translate(${drift.toFixed(2)} ${(-drift * 0.45).toFixed(2)})">` +
    shape("M0 2 Q0-5 7-4 Q9-10 15-7 Q24-6 24 2 Q21 7 14 6 Q7 10 0 2Z", "#cad7d9") + `</g>` : "";
  return place(hand, `<g transform="translate(${tip} -10)">${burst}${smoke}</g>`, `rotate(${rotation.toFixed(2)})`);
}

function sample(track, time) {
  for (let i = 1; i < track.length; i++) {
    const [start, a] = track[i - 1], [end, b, ease] = track[i];
    if (time >= end) continue;
    if (ease === "snap") return a;
    const u = Math.max(0, (time - start) / (end - start));
    const q = ease === "out" ? 1 - (1 - u) ** 2 : u * u * (3 - 2 * u);
    return lerpPose({ sa: 0, ...a }, { sa: 0, ...b }, q);
  }
  return track.at(-1)[1];
}

export function drawCelSentinel(loadout, clipId, time) {
  const C = LOADOUTS[loadout], clip = CLIPS[clipId];
  const pistol = loadout === "hazard";
  const pose = sample(clip.keys, time);
  const settings = {
    ...pose, ffy: clipId === "walk" ? pose.ffy : -3, fby: clipId === "walk" ? pose.fby : -3,
  };
  if (!pistol) Object.assign(settings, { bx: pose.fx + 7.1, by: pose.fy + 0.2 });
  const { joints } = skeleton(settings);
  const j = Object.fromEntries(Object.entries(joints).map(([key, [x, y]]) => [key, [x * 6.4, y * 6.4]]));
  const far = muted(C);
  const angle = (pose.sa ?? 0) * 180 / Math.PI;
  const support = pistol ? "" : glove(j.handF, far, angle - 15);
  const blast = clipId === "fire" ? flash(j.handN, angle, pistol, time - clip.markers.fire / FPS) : "";
  const body = leg(j, "F", far) + arm(j, "F", far) + leg(j, "N", C) + torso(j, C) + helmet(j, C, pistol) +
    arm(j, "N", C) + gun(j.handN, angle, C, pistol) + support + glove(j.handN, C, angle) + blast;
  return `<g transform="scale(${SCALE})">${body}</g>`;
}

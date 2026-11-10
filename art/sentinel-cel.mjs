import { CLIPS, FPS, LOADOUTS, PIVOT, SIZE, drawCelSentinel } from "../src/art/sentinel-cel.js";

export default Object.entries(LOADOUTS).flatMap(([loadout, { label, gear }]) =>
  Object.entries(CLIPS).map(([action, clip]) => ({
    id: `${loadout}/${action}`, kind: "character", name: `${label} · ${gear}`,
    size: SIZE, pivot: PIVOT, fps: FPS, frames: clip.frames, loop: clip.loop, markers: clip.markers,
    svg: (t) => drawCelSentinel(loadout, action, t),
  })),
);

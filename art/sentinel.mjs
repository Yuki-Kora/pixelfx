import { scoutClips } from "../src/art/scout.js";
import { drawSentinel, sentinelPivot, sentinelSize } from "../src/art/sentinel.js";

export default Object.entries(scoutClips).map(([name, clip]) => ({
  id: `sentinel/${name}`, kind: "character", size: sentinelSize, pivot: sentinelPivot,
  fps: clip.fps, frames: clip.frames, loop: clip.loop, markers: clip.markers,
  draw: (p, t, options) => drawSentinel(p, clip, t, options),
}));

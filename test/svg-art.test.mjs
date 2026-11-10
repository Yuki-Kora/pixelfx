import assert from "node:assert/strict";
import test from "node:test";
import { renderSvgFrames } from "../tools/lib/svg-art.mjs";

test("SVG export samples in order, applies the pivot and preserves straight alpha", async () => {
  const times = [];
  const fx = {
    id: "test/vector", meta: { size: [4, 2], origin: [1, 0], fps: 24, bg: "dark" },
    mod: {
      svg(t, { fill }) {
        times.push(t);
        return `<rect width="1" height="1" fill="${fill}" opacity=".5"/>`;
      },
    },
  };
  const render = await renderSvgFrames(fx, 2, { fill: "#c86432" });
  assert.deepEqual(times, [0, 1 / 24]);
  assert.deepEqual([...render.frames[0].clear.slice(0, 12)], [0, 0, 0, 0, 199, 100, 50, 128, 0, 0, 0, 0]);
  assert.equal(render.frames[0].color[7], 255);
});

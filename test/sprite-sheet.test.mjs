import assert from "node:assert/strict";
import test from "node:test";
import { inflateSync } from "node:zlib";
import { spriteSheet } from "../tools/lib/fxlib.mjs";

test("atlas cells preserve the same straight RGBA as standalone frames", () => {
  const fx = { id: "test/alpha", mod: {}, meta: { name: "Alpha", origin: [0, 0], loop: false } };
  const frame = (rgba) => ({ clear: Uint8ClampedArray.from(rgba) });
  const frames = [frame([220, 120, 60, 128]), frame([225, 140, 90, 255])];
  const { png, json } = spriteSheet(fx, { w: 1, h: 1, fps: 12, frames }, "atlas");
  assert.equal(json.meta.pixelfx.columns, 2);

  // The PNG writer emits one IDAT chunk after IHDR and uses the Sub filter for each row.
  const idat = 33;
  assert.equal(png.toString("ascii", idat + 4, idat + 8), "IDAT");
  const row = inflateSync(png.subarray(idat + 8, idat + 8 + png.readUInt32BE(idat)));
  assert.deepEqual([...row], [1, 220, 120, 60, 128, 5, 20, 30, 127]);
});

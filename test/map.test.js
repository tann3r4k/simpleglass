import { fillDisplacement, roundedRectSDF, smoothStep, DEFAULT_BEZEL } from "../src/map.js";
import assert from "node:assert/strict";

assert.equal(smoothStep(0, 1, 0), 0);
assert.equal(smoothStep(0, 1, 1), 1);
assert.ok(smoothStep(0, 1, 0.5) > 0.4 && smoothStep(0, 1, 0.5) < 0.6);

assert.ok(roundedRectSDF(0, 0, 0.32, 0.22, 0.55) < 0);
assert.ok(roundedRectSDF(2, 2, 0.32, 0.22, 0.55) > 0);

const w = 16, h = 16;
const data = new Uint8ClampedArray(w * h * 4);
fillDisplacement(data, w, h);
assert.equal(data.length, w * h * 4);
for (let i = 0; i < data.length; i += 4) {
  assert.equal(data[i + 3], 255);
  assert.ok(data[i] >= 0 && data[i] <= 255);
}
let bent = 0;
for (let i = 0; i < data.length; i += 4) {
  if (data[i] !== 128 || data[i + 1] !== 128) bent++;
}
assert.ok(bent > 0, "map should bend some pixels");

const center = (8 * w + 8) * 4;
assert.equal(data[center], 128, "center stays neutral");
assert.equal(data[center + 1], 128, "center stays neutral");

const rim = (8 * w + 2) * 4;
assert.ok(Math.abs(data[rim] - 128) > 20, "rim bends");
assert.equal(DEFAULT_BEZEL, 0.16);
console.log("ok");

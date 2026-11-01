import test from "node:test";
import assert from "node:assert/strict";
import {clampFloatingPosition, snapFloatingPosition} from "@/app/components/youtube-player/floating-position";

test("floating player is constrained to screen bounds", () => {
  assert.deepEqual(clampFloatingPosition({x:-500,y:-200}, 390, 844, 200, 113), {x:12,y:44});
  assert.deepEqual(clampFloatingPosition({x:900,y:900}, 390, 844, 200, 113), {x:178,y:719});
});
test("floating player snaps to nearest horizontal edge", () => {
  assert.equal(snapFloatingPosition({x:20,y:200}, 1000, 800, 400, 226).x,12);
  assert.equal(snapFloatingPosition({x:700,y:200}, 1000, 800, 400, 226).x,588);
});

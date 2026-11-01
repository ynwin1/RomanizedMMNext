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

test("snap side preserves edge choice regardless of vertical drag coordinate", () => {
  const left = snapFloatingPosition({x:30,y:120}, 390, 844, 200, 113);
  const right = snapFloatingPosition({x:180,y:650}, 390, 844, 200, 113);
  assert.equal(left.x, 12);
  assert.equal(right.x, 178);
});

test("mobile release position snaps correctly to both sides",()=>{
  const rightStart={x:178,y:690};
  const rightRelease=clampFloatingPosition({x:rightStart.x+40,y:rightStart.y-20},390,844,200,113);
  assert.equal(snapFloatingPosition(rightRelease,390,844,200,113).x,178);
  const leftRelease=clampFloatingPosition({x:rightStart.x-175,y:rightStart.y-20},390,844,200,113);
  assert.equal(snapFloatingPosition(leftRelease,390,844,200,113).x,12);
});

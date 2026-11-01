import test from "node:test";
import assert from "node:assert/strict";
import {moodometerBarWidth} from "@/app/components/music-box/Moodometer";

test("Moodometer score bars scale 0–10 to percent",()=>{
  assert.equal(moodometerBarWidth(0),"0%");
  assert.equal(moodometerBarWidth(8.7),"87%");
  assert.equal(moodometerBarWidth(10),"100%");
  assert.equal(moodometerBarWidth(-1),"0%");
  assert.equal(moodometerBarWidth(11),"100%");
});

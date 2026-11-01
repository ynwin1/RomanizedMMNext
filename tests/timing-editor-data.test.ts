import test from "node:test";
import assert from "node:assert/strict";
import {secondsToMilliseconds, draftTimingLines} from "@/app/admin/songs/timing-editor-data";

test("capture times in milliseconds with centisecond precision", () => {
  assert.equal(secondsToMilliseconds(12.345), 12345);
  assert.throws(() => secondsToMilliseconds(-1));
  assert.throws(() => secondsToMilliseconds(NaN));
});
test("partial timing rows are excluded from draft persistence and lines sorted", () => {
  assert.deepEqual(draftTimingLines({
    4: {startMs: 5000, endMs: 7000},
    0: {startMs: 1000, endMs: 2000},
    2: {startMs: 4000},
  }), [
    {entryIndex: 0, startMs: 1000, endMs: 2000},
    {entryIndex: 4, startMs: 5000, endMs: 7000},
  ]);
});

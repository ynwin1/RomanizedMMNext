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

import {nudgeTime, activeTimingIndex, validateDraftTimes} from "@/app/admin/songs/timing-editor-data";

test("nudges clamp at zero and preserve unset time", () => {
  assert.equal(nudgeTime(50, -100), 0);
  assert.equal(nudgeTime(1200, 100), 1300);
  assert.equal(nudgeTime(undefined, 100), undefined);
});

test("preview stops highlighting during instrumental gaps and after line ends", () => {
  const lines = [{entryIndex:0,startMs:1000,endMs:2000},{entryIndex:2,startMs:4000,endMs:5000}];
  assert.equal(activeTimingIndex(lines, 1500), 0);
  assert.equal(activeTimingIndex(lines, 3000), null);
  assert.equal(activeTimingIndex(lines, 5000), null);
  assert.equal(activeTimingIndex(lines, 4500), 2);
});

test("draft validation warns about partial, inverted and overlapping rows", () => {
  assert.equal(validateDraftTimes({0:{startMs:1000,endMs:2000},2:{startMs:3000,endMs:4000}}).length, 0);
  assert.match(validateDraftTimes({0:{startMs:1000}})[0], /both start and end/);
  assert.match(validateDraftTimes({0:{startMs:2000,endMs:1000}})[0], /after start/);
  assert.match(validateDraftTimes({0:{startMs:1000,endMs:2500},2:{startMs:2000,endMs:3000}})[0], /overlap/);
});

test("validation reports visible line numbers excluding LyricsV2 breaks and exact overlap", () => {
  const errors = validateDraftTimes({
    0: {startMs: 1000, endMs: 2500},
    2: {startMs: 2200, endMs: 3000},
  }, [0, 2]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^Line 2: starts at 2\.20s but Line 1 ends at 2\.50s \(overlap: 0\.30s\)/);
});

test("invalid end timing includes both values and does not create misleading overlap", () => {
  const errors = validateDraftTimes({
    0: {startMs: 5000, endMs: 2000},
    1: {startMs: 3000, endMs: 4000},
  }, [0, 1]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Line 1: end must be after start \(start: 5\.00s, end: 2\.00s\)/);
});

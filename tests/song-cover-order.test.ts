import test from "node:test";
import assert from "node:assert/strict";
import { moveCover, orderedCoverIds } from "@/app/admin/songs/song-cover-order";

const records = [{ id: "a" }, { id: "b" }, { id: "c" }];

test("moving covers changes order without mutating original records", () => {
  const moved = moveCover(records, "b", -1);
  assert.deepEqual(orderedCoverIds(moved), ["b", "a", "c"]);
  assert.deepEqual(orderedCoverIds(records), ["a", "b", "c"]);
  assert.deepEqual(orderedCoverIds(moveCover(records, "b", 1)), ["a", "c", "b"]);
});

test("edge and missing moves do nothing", () => {
  assert.equal(moveCover(records, "a", -1), records);
  assert.equal(moveCover(records, "c", 1), records);
  assert.equal(moveCover(records, "missing", 1), records);
  assert.deepEqual(orderedCoverIds([]), []);
});

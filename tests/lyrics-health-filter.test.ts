import test from "node:test";
import assert from "node:assert/strict";
import { filterLyricsHealth, parseLyricsHealthFilter } from "@/app/admin/lyrics-health/lyrics-health-filter";
import type { LyricsMigrationAssessment } from "@/modules/songs/domain/lyrics-migration.types";

const rows: LyricsMigrationAssessment[] = [
  { mmid: 1, songName: "Hello World", status: "SAFE", diagnostics: [] },
  { mmid: 2, songName: "မင်္ဂလာပါ", status: "WARNING", diagnostics: [] },
  { mmid: 3, songName: "Another Song", status: "INVALID", diagnostics: [] },
  { mmid: 4, songName: "Review Song", status: "MANUAL_REVIEW", diagnostics: [] },
];

test("health filters default to actionable issues, but allow all statuses", () => {
  assert.equal(parseLyricsHealthFilter(undefined), "ISSUES");
  assert.equal(parseLyricsHealthFilter("bogus"), "ISSUES");
  assert.equal(parseLyricsHealthFilter("invalid"), "INVALID");
  assert.deepEqual(filterLyricsHealth(rows, "ISSUES", "").map(x => x.mmid), [2, 3, 4]);
  assert.equal(filterLyricsHealth(rows, "ALL", "").length, 4);
  assert.deepEqual(filterLyricsHealth(rows, "WARNING", "").map(x => x.mmid), [2]);
});

test("health search matches case-insensitive names, Burmese text, and MMID", () => {
  assert.deepEqual(filterLyricsHealth(rows, "ALL", "HELLO").map(x => x.mmid), [1]);
  assert.deepEqual(filterLyricsHealth(rows, "ISSUES", " မင်္ဂလာ ").map(x => x.mmid), [2]);
  assert.deepEqual(filterLyricsHealth(rows, "ALL", "4").map(x => x.mmid), [4]);
  assert.deepEqual(filterLyricsHealth(rows, "SAFE", "review"), []);
  assert.deepEqual(filterLyricsHealth(rows, "INVALID", "nothing"), []);
});

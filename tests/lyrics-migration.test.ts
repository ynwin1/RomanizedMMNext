import test from "node:test";
import assert from "node:assert/strict";
import {
  assessLyricsMigration,
  buildLyricsMigrationReport,
} from "@/modules/songs/application/lyrics-migration.validator";
import type { LegacyLyricsMigrationCandidate } from "@/modules/songs/domain/lyrics-migration.types";

function candidate(overrides: Partial<LegacyLyricsMigrationCandidate> = {}): LegacyLyricsMigrationCandidate {
  return {
    mmid: 17,
    songName: "Song",
    burmese: "တစ်\n\nနှစ်",
    romanized: "tit\n\nhnit",
    meaning: "One\n\nTwo",
    ...overrides,
  };
}

test("migration assessment marks aligned legacy lyrics SAFE and builds a V2 preview", () => {
  const result = assessLyricsMigration(candidate());
  assert.equal(result.status, "SAFE");
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.preview, {
    version: 2,
    entries: [
      { kind: "line", burmese: "တစ်", romanized: "tit", meaning: "One" },
      { kind: "break" },
      { kind: "line", burmese: "နှစ်", romanized: "hnit", meaning: "Two" },
    ],
  });
});

test("migration assessment marks aligned missing meanings as WARNING with null preview meaning", () => {
  const result = assessLyricsMigration(candidate({ meaning: "One\n\n" }));
  assert.equal(result.status, "WARNING");
  assert.deepEqual(result.diagnostics, [{
    code: "MISSING_MEANING",
    line: 3,
    message: "Line 3 has no English meaning and would migrate as null.",
  }]);
  assert.deepEqual(result.preview?.entries[2], {
    kind: "line",
    burmese: "နှစ်",
    romanized: "hnit",
    meaning: null,
  });
});

test("migration assessment sends line-count drift to MANUAL_REVIEW", () => {
  const result = assessLyricsMigration(candidate({ romanized: "tit\nhnit" }));
  assert.equal(result.status, "MANUAL_REVIEW");
  assert.equal(result.preview, undefined);
  assert.equal(result.diagnostics[0]?.code, "LINE_COUNT_MISMATCH");
  assert.match(result.diagnostics[0]?.message ?? "", /Burmese: 3, Romanized: 2, Meaning: 3/);
});

test("migration assessment sends break mismatches and missing romanization to MANUAL_REVIEW", () => {
  const breakMismatch = assessLyricsMigration(candidate({ romanized: "tit\nnot blank\nhnit" }));
  assert.equal(breakMismatch.status, "MANUAL_REVIEW");
  assert.deepEqual(breakMismatch.diagnostics.map(item => item.code), ["BREAK_STRUCTURE_MISMATCH"]);

  const missingRomanization = assessLyricsMigration(candidate({ romanized: "tit\n\n" }));
  assert.equal(missingRomanization.status, "MANUAL_REVIEW");
  assert.deepEqual(missingRomanization.diagnostics.map(item => item.code), ["MISSING_ROMANIZATION"]);
});

test("migration assessment marks unusable source data INVALID", () => {
  const result = assessLyricsMigration(candidate({ burmese: "   ", romanized: "   " }));
  assert.equal(result.status, "INVALID");
  assert.deepEqual(result.diagnostics.map(item => item.code), ["EMPTY_BURMESE", "EMPTY_ROMANIZED"]);
  assert.equal(result.preview, undefined);
});

test("migration assessment recognizes songs already on V2 without reinterpreting legacy text", () => {
  const lyricsV2 = {
    version: 2 as const,
    entries: [{ kind: "line" as const, burmese: "အသစ်", romanized: "a thit", meaning: "New" }],
  };
  const result = assessLyricsMigration(candidate({
    burmese: "bad legacy",
    romanized: "",
    meaning: "",
    lyricsV2,
  }));
  assert.equal(result.status, "SAFE");
  assert.equal(result.diagnostics[0]?.code, "ALREADY_V2");
  assert.deepEqual(result.preview, lyricsV2);
});

test("migration report aggregates deterministic status counts", () => {
  const report = buildLyricsMigrationReport([
    candidate({ mmid: 1 }),
    candidate({ mmid: 2, meaning: "One\n\n" }),
    candidate({ mmid: 3, romanized: "tit\nhnit" }),
    candidate({ mmid: 4, burmese: "", romanized: "" }),
  ]);

  assert.equal(report.total, 4);
  assert.deepEqual(report.counts, {
    SAFE: 1,
    WARNING: 1,
    INVALID: 1,
    MANUAL_REVIEW: 1,
  });
  assert.deepEqual(report.assessments.map(item => item.mmid), [1, 2, 3, 4]);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLyricsMigrationRepairReport,
  planLyricsMigrationRepair,
} from "@/modules/songs/application/lyrics-migration.repair";
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

test("repair plan marks already-valid songs READY", () => {
  const plan = planLyricsMigrationRepair(candidate());
  assert.equal(plan.strategy, "READY");
  assert.ok(plan.preview);
});

test("repair plan deterministically fixes blank-line drift without rewriting lyric text", () => {
  const plan = planLyricsMigrationRepair(candidate({
    burmese: " တစ် \n\n နှစ် ",
    romanized: " tit \n hnit ",
    meaning: " One\nTwo ",
  }));

  assert.equal(plan.strategy, "DETERMINISTIC_REPAIR");
  assert.deepEqual(plan.preview, {
    version: 2,
    entries: [
      { kind: "line", burmese: "တစ်", romanized: "tit", meaning: "One" },
      { kind: "break" },
      { kind: "line", burmese: "နှစ်", romanized: "hnit", meaning: "Two" },
    ],
  });
});

test("repair plan routes aligned Burmese/Romanized backbones with incomplete meanings to AI meaning alignment", () => {
  const plan = planLyricsMigrationRepair(candidate({
    burmese: "တစ်\nနှစ်\nသုံး",
    romanized: "tit\nhnit\nthone",
    meaning: "One\nTwo",
  }));

  assert.equal(plan.strategy, "AI_MEANING_ALIGNMENT");
  assert.equal(plan.sourceLyricLines, 3);
  assert.equal(plan.romanizedLines, 3);
  assert.equal(plan.meaningLines, 2);
  assert.equal(plan.preview, undefined);
});

test("repair plan routes genuine Burmese/Romanized row disagreement to AI romanization repair", () => {
  const plan = planLyricsMigrationRepair(candidate({
    burmese: "တစ်\nနှစ်\nသုံး",
    romanized: "tit\nhnit",
    meaning: "One\nTwo\nThree",
  }));

  assert.equal(plan.strategy, "AI_ROMANIZATION_REPAIR");
  assert.equal(plan.sourceLyricLines, 3);
  assert.equal(plan.romanizedLines, 2);
});

test("repair plan leaves unusable anchor data for manual review", () => {
  const plan = planLyricsMigrationRepair(candidate({ burmese: "", romanized: "" }));
  assert.equal(plan.strategy, "MANUAL_REVIEW");
});

test("repair report aggregates strategy counts", () => {
  const report = buildLyricsMigrationRepairReport([
    candidate({ mmid: 1 }),
    candidate({ mmid: 2, burmese: "တစ်\n\nနှစ်", romanized: "tit\nhnit", meaning: "One\nTwo" }),
    candidate({ mmid: 3, burmese: "တစ်\nနှစ်", romanized: "tit\nhnit", meaning: "One" }),
    candidate({ mmid: 4, burmese: "တစ်\nနှစ်", romanized: "tit", meaning: "One\nTwo" }),
    candidate({ mmid: 5, burmese: "", romanized: "" }),
  ]);

  assert.deepEqual(report.counts, {
    READY: 1,
    DETERMINISTIC_REPAIR: 1,
    AI_MEANING_ALIGNMENT: 1,
    AI_ROMANIZATION_REPAIR: 1,
    MANUAL_REVIEW: 1,
  });
});

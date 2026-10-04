import test from "node:test";
import assert from "node:assert/strict";
import { LyricsMeaningAlignmentService } from "@/modules/songs/application/lyrics-meaning-alignment.service";
import type { LyricsMeaningAlignmentProvider } from "@/modules/songs/application/lyrics-meaning-alignment.provider";

const candidate = {
  mmid: 17,
  songName: "Song",
  burmese: "တစ်\n\nနှစ်",
  romanized: "tit\n\nhnit",
  meaning: "One",
};

test("AI meaning preview preserves Burmese/Romanized and tags reused/generated meanings", async () => {
  const provider: LyricsMeaningAlignmentProvider = {
    alignMeaning: async input => {
      assert.deepEqual(input.lines, [
        { index: 0, burmese: "တစ်", romanized: "tit" },
        { index: 1, burmese: "နှစ်", romanized: "hnit" },
      ]);
      assert.deepEqual(input.existingMeaningLines, ["One"]);
      return {
        lines: [
          { index: 0, meaning: "One", source: "reused", confidence: "high" },
          { index: 1, meaning: "Two", source: "generated", confidence: "medium" },
        ],
      };
    },
  };

  const service = new LyricsMeaningAlignmentService({
    getLyricsMigrationCandidate: async () => candidate,
  }, provider);

  const preview = await service.preview(17);
  assert.deepEqual(preview.lyricsV2, {
    version: 2,
    entries: [
      { kind: "line", burmese: "တစ်", romanized: "tit", meaning: "One" },
      { kind: "break" },
      { kind: "line", burmese: "နှစ်", romanized: "hnit", meaning: "Two" },
    ],
  });
  assert.deepEqual(preview.counts, { reused: 1, generated: 1, lowConfidence: 0 });
});

test("AI meaning preview rejects changed text falsely marked as reused", async () => {
  const service = new LyricsMeaningAlignmentService({
    getLyricsMigrationCandidate: async () => candidate,
  }, {
    alignMeaning: async () => ({
      lines: [
        { index: 0, meaning: "Changed One", source: "reused", confidence: "high" },
        { index: 1, meaning: "Two", source: "generated", confidence: "high" },
      ],
    }),
  });

  await assert.rejects(() => service.preview(17), /reused but changed/);
});

test("AI meaning preview rejects row-count and index drift", async () => {
  const source = { getLyricsMigrationCandidate: async () => candidate };

  await assert.rejects(
    () => new LyricsMeaningAlignmentService(source, {
      alignMeaning: async () => ({
        lines: [{ index: 0, meaning: "One", source: "reused", confidence: "high" }],
      }),
    }).preview(17),
    /row count/,
  );

  await assert.rejects(
    () => new LyricsMeaningAlignmentService(source, {
      alignMeaning: async () => ({
        lines: [
          { index: 1, meaning: "One", source: "reused", confidence: "high" },
          { index: 0, meaning: "Two", source: "generated", confidence: "high" },
        ],
      }),
    }).preview(17),
    /indexes/,
  );
});

test("AI meaning preview refuses songs outside the AI meaning bucket", async () => {
  const service = new LyricsMeaningAlignmentService({
    getLyricsMigrationCandidate: async () => ({
      ...candidate,
      meaning: "One\n\nTwo",
    }),
  }, {
    alignMeaning: async () => ({ lines: [] }),
  });

  await assert.rejects(() => service.preview(17), /not eligible/);
});

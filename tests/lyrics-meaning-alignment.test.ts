import test from "node:test";
import assert from "node:assert/strict";
import { LyricsMeaningAlignmentService } from "@/modules/songs/application/lyrics-meaning-alignment.service";
import type { LyricsMeaningAlignmentProvider } from "@/modules/songs/application/lyrics-meaning-alignment.provider";
import type { ILyricsMeaningReviewDraftRepository } from "@/modules/songs/application/lyrics-meaning-review-draft.repository";
import type { LyricsMeaningReviewDraft } from "@/modules/songs/domain/lyrics-meaning-review-draft.types";
import type { LegacyLyricsMigrationCandidate } from "@/modules/songs/domain/lyrics-migration.types";

const candidate = {
  mmid: 17,
  songName: "Song",
  burmese: "တစ်\n\nနှစ်",
  romanized: "tit\n\nhnit",
  meaning: "One",
};

function songSource() {
  return {
    getLyricsMigrationCandidate: async () => candidate,
    saveLyricsV2IfLegacyMatches: async () => ({ status: "saved" as const }),
  };
}

function memoryDrafts(): ILyricsMeaningReviewDraftRepository & { current: LyricsMeaningReviewDraft | null } {
  return {
    current: null,
    async findByMmid() {
      return this.current;
    },
    async listMmids() {
      return this.current ? [this.current.mmid] : [];
    },
    async upsertGenerated(mmid, songName, legacySnapshot, rows, updatedBy) {
      this.current = { mmid, songName, legacySnapshot, rows, updatedBy };
      return this.current;
    },
    async updateRowsIfSnapshotMatches(_mmid, expected, rows, updatedBy) {
      if (!this.current) return null;
      const snapshot = this.current.legacySnapshot;
      if (
        snapshot.burmese !== expected.burmese
        || snapshot.romanized !== expected.romanized
        || snapshot.meaning !== expected.meaning
      ) return null;
      this.current = { ...this.current, rows, updatedBy };
      return this.current;
    },
    async deleteByMmid() {
      this.current = null;
    },
  };
}

function provider(counter?: { calls: number }): LyricsMeaningAlignmentProvider {
  return {
    alignMeaning: async input => {
      if (counter) counter.calls += 1;
      assert.deepEqual(input.lines, [
        { index: 0, burmese: "တစ်", romanized: "tit" },
        { index: 1, burmese: "နှစ်", romanized: "hnit" },
      ]);
      return {
        lines: [
          { index: 0, meaning: "One", source: "reused", confidence: "high" },
          { index: 1, meaning: "Two", source: "generated", confidence: "medium" },
        ],
      };
    },
  };
}

test("AI meaning preview preserves Burmese/Romanized and persists generated review draft", async () => {
  const drafts = memoryDrafts();
  const service = new LyricsMeaningAlignmentService(songSource(), drafts, provider());

  const preview = await service.preview(17, { updatedBy: "admin-1" });
  assert.equal(preview.cached, false);
  assert.deepEqual(preview.lyricsV2, {
    version: 2,
    entries: [
      { kind: "line", burmese: "တစ်", romanized: "tit", meaning: "One" },
      { kind: "break" },
      { kind: "line", burmese: "နှစ်", romanized: "hnit", meaning: "Two" },
    ],
  });
  assert.deepEqual(preview.counts, { reused: 1, generated: 1, lowConfidence: 0 });
  assert.equal(drafts.current?.rows[1]?.meaning, "Two");
});

test("reopening a valid preview uses persisted draft and does not spend AI tokens again", async () => {
  const calls = { calls: 0 };
  const drafts = memoryDrafts();
  const service = new LyricsMeaningAlignmentService(songSource(), drafts, provider(calls));

  const first = await service.preview(17);
  const second = await service.preview(17);

  assert.equal(first.cached, false);
  assert.equal(second.cached, true);
  assert.equal(calls.calls, 1);
});

test("explicit regeneration is the only way to call AI again when a draft exists", async () => {
  const calls = { calls: 0 };
  const drafts = memoryDrafts();
  const service = new LyricsMeaningAlignmentService(songSource(), drafts, provider(calls));

  await service.preview(17);
  await service.preview(17);
  await service.preview(17, { regenerate: true });

  assert.equal(calls.calls, 2);
});

test("manual Meaning edits can be saved as a draft and survive reopening without AI", async () => {
  const calls = { calls: 0 };
  const drafts = memoryDrafts();
  const service = new LyricsMeaningAlignmentService(songSource(), drafts, provider(calls));
  const first = await service.preview(17);

  assert.deepEqual(
    await service.saveDraft(
      17,
      first.legacySnapshot,
      ["My corrected one", "My corrected two"],
      "admin-1",
    ),
    { status: "saved" },
  );

  const reopened = await service.preview(17);
  assert.equal(calls.calls, 1);
  assert.equal(reopened.cached, true);
  assert.equal(reopened.rows[0]?.meaning, "My corrected one");
  assert.equal(reopened.rows[0]?.edited, true);
  assert.equal(reopened.rows[1]?.edited, true);
});

test("AI meaning preview rejects changed text falsely marked as reused", async () => {
  const service = new LyricsMeaningAlignmentService(songSource(), memoryDrafts(), {
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
  await assert.rejects(
    () => new LyricsMeaningAlignmentService(songSource(), memoryDrafts(), {
      alignMeaning: async () => ({
        lines: [{ index: 0, meaning: "One", source: "reused", confidence: "high" }],
      }),
    }).preview(17),
    /row count/,
  );

  await assert.rejects(
    () => new LyricsMeaningAlignmentService(songSource(), memoryDrafts(), {
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
    getLyricsMigrationCandidate: async () => ({ ...candidate, meaning: "One\n\nTwo" }),
    saveLyricsV2IfLegacyMatches: async () => ({ status: "saved" as const }),
  }, memoryDrafts(), {
    alignMeaning: async () => ({ lines: [] }),
  });

  await assert.rejects(() => service.preview(17), /not eligible/);
});

test("reviewed Meaning save rebuilds V2 from protected Burmese/Romanized and clears cached draft", async () => {
  let saved: any;
  const drafts = memoryDrafts();
  const service = new LyricsMeaningAlignmentService({
    getLyricsMigrationCandidate: async () => candidate,
    saveLyricsV2IfLegacyMatches: async (mmid, expected, lyricsV2, updatedBy) => {
      saved = { mmid, expected, lyricsV2, updatedBy };
      return { status: "saved" as const };
    },
  }, drafts, provider());

  const preview = await service.preview(17);
  const result = await service.saveReviewed(
    17,
    preview.legacySnapshot,
    ["My corrected one", "My corrected two"],
    "admin-1",
  );

  assert.deepEqual(result, { status: "saved" });
  assert.deepEqual(saved.lyricsV2, {
    version: 2,
    entries: [
      { kind: "line", burmese: "တစ်", romanized: "tit", meaning: "My corrected one" },
      { kind: "break" },
      { kind: "line", burmese: "နှစ်", romanized: "hnit", meaning: "My corrected two" },
    ],
  });
  assert.equal(drafts.current, null);
});

test("reviewed Meaning save refuses stale source snapshots before persistence", async () => {
  let writes = 0;
  const service = new LyricsMeaningAlignmentService({
    getLyricsMigrationCandidate: async () => candidate,
    saveLyricsV2IfLegacyMatches: async () => {
      writes++;
      return { status: "saved" as const };
    },
  }, memoryDrafts());

  const result = await service.saveReviewed(17, {
    burmese: candidate.burmese,
    romanized: candidate.romanized + " changed",
    meaning: candidate.meaning,
  }, ["One", "Two"], "admin-1");

  assert.deepEqual(result, { status: "stale" });
  assert.equal(writes, 0);
});

test("reviewed Meaning save rejects missing rows and blank edits", async () => {
  const service = new LyricsMeaningAlignmentService(songSource(), memoryDrafts());
  const expected = {
    burmese: candidate.burmese,
    romanized: candidate.romanized,
    meaning: candidate.meaning,
  };

  await assert.rejects(() => service.saveReviewed(17, expected, ["Only one"], "admin-1"), /row count/);
  await assert.rejects(() => service.saveReviewed(17, expected, ["One", "   "], "admin-1"), /cannot be blank/);
});


test("AI Meaning draft batch generates each missing eligible song at most once", async () => {
  const calls = { calls: 0 };
  const candidates = new Map<number, LegacyLyricsMigrationCandidate>([
    [17, candidate],
    [18, { ...candidate, mmid: 18, songName: "Song 18" }],
    [19, { ...candidate, mmid: 19, songName: "Song 19", lyricsV2: { version: 2 as const, entries: [{ kind: "line" as const, burmese: "တစ်", romanized: "tit", meaning: "One" }] } }],
  ]);
  const stored = new Map<number, LyricsMeaningReviewDraft>();
  stored.set(18, {
    mmid: 18,
    songName: "Song 18",
    legacySnapshot: { burmese: candidate.burmese, romanized: candidate.romanized, meaning: candidate.meaning },
    rows: [],
  });

  const drafts: ILyricsMeaningReviewDraftRepository = {
    findByMmid: async mmid => stored.get(mmid) ?? null,
    listMmids: async () => [...stored.keys()],
    upsertGenerated: async (mmid, songName, legacySnapshot, rows, updatedBy) => {
      const value = { mmid, songName, legacySnapshot, rows, updatedBy };
      stored.set(mmid, value);
      return value;
    },
    updateRowsIfSnapshotMatches: async () => null,
    deleteByMmid: async () => {},
  };

  const service = new LyricsMeaningAlignmentService({
    getLyricsMigrationCandidate: async mmid => candidates.get(mmid) ?? null,
    saveLyricsV2IfLegacyMatches: async () => ({ status: "saved" as const }),
  }, drafts, {
    alignMeaning: async () => {
      calls.calls += 1;
      return {
        lines: [
          { index: 0, meaning: "One", source: "reused", confidence: "high" },
          { index: 1, meaning: "Two", source: "generated", confidence: "high" },
        ],
      };
    },
  });

  const result = await service.generateDraftBatch([17, 17, 18, 19, 999], "admin-1", 5);
  assert.deepEqual(result, {
    requested: 4,
    generated: 1,
    skippedExisting: 1,
    skippedIneligible: 2,
    failed: 0,
  });
  assert.equal(calls.calls, 1);
  assert.ok(stored.has(17));
});

test("AI Meaning draft batch respects the requested limit and keeps individual failures isolated", async () => {
  const candidates = new Map<number, LegacyLyricsMigrationCandidate>([
    [17, candidate],
    [18, { ...candidate, mmid: 18, songName: "Song 18" }],
    [20, { ...candidate, mmid: 20, songName: "Song 20" }],
  ]);
  const stored = new Map<number, LyricsMeaningReviewDraft>();
  let calls = 0;

  const drafts: ILyricsMeaningReviewDraftRepository = {
    findByMmid: async mmid => stored.get(mmid) ?? null,
    listMmids: async () => [...stored.keys()],
    upsertGenerated: async (mmid, songName, legacySnapshot, rows, updatedBy) => {
      const value = { mmid, songName, legacySnapshot, rows, updatedBy };
      stored.set(mmid, value);
      return value;
    },
    updateRowsIfSnapshotMatches: async () => null,
    deleteByMmid: async () => {},
  };

  const service = new LyricsMeaningAlignmentService({
    getLyricsMigrationCandidate: async mmid => candidates.get(mmid) ?? null,
    saveLyricsV2IfLegacyMatches: async () => ({ status: "saved" as const }),
  }, drafts, {
    alignMeaning: async input => {
      calls += 1;
      if (input.songName === "Song 18") throw new Error("provider failure");
      return {
        lines: [
          { index: 0, meaning: "One", source: "reused", confidence: "high" },
          { index: 1, meaning: "Two", source: "generated", confidence: "high" },
        ],
      };
    },
  });

  const result = await service.generateDraftBatch([17, 18, 20], "admin-1", 2);
  assert.deepEqual(result, {
    requested: 2,
    generated: 1,
    skippedExisting: 0,
    skippedIneligible: 0,
    failed: 1,
  });
  assert.equal(calls, 2);
  assert.equal(stored.has(20), false);
});


test("generate-and-accept batch reuses saved drafts before generating new ones and writes lyricsV2", async () => {
  const candidates = new Map<number, LegacyLyricsMigrationCandidate>([
    [17, candidate],
    [18, { ...candidate, mmid: 18, songName: "Song 18" }],
  ]);
  const stored = new Map<number, LyricsMeaningReviewDraft>();
  stored.set(17, {
    mmid: 17,
    songName: "Song",
    legacySnapshot: {
      burmese: candidate.burmese,
      romanized: candidate.romanized,
      meaning: candidate.meaning,
    },
    rows: [
      { index: 0, burmese: "တစ်", romanized: "tit", meaning: "One", source: "reused", confidence: "high", edited: false },
      { index: 1, burmese: "နှစ်", romanized: "hnit", meaning: "Two", source: "generated", confidence: "medium", edited: false },
    ],
  });
  let aiCalls = 0;
  const writes: number[] = [];

  const drafts: ILyricsMeaningReviewDraftRepository = {
    findByMmid: async mmid => stored.get(mmid) ?? null,
    listMmids: async () => [...stored.keys()],
    upsertGenerated: async (mmid, songName, legacySnapshot, rows, updatedBy) => {
      const value = { mmid, songName, legacySnapshot, rows, updatedBy };
      stored.set(mmid, value);
      return value;
    },
    updateRowsIfSnapshotMatches: async () => null,
    deleteByMmid: async mmid => {
      stored.delete(mmid);
    },
  };

  const service = new LyricsMeaningAlignmentService({
    getLyricsMigrationCandidate: async mmid => candidates.get(mmid) ?? null,
    saveLyricsV2IfLegacyMatches: async (mmid, _expected, lyricsV2) => {
      const current = candidates.get(mmid);
      if (!current) return { status: "stale" as const };
      candidates.set(mmid, { ...current, lyricsV2 });
      writes.push(mmid);
      return { status: "saved" as const };
    },
  }, drafts, {
    alignMeaning: async () => {
      aiCalls += 1;
      return {
        lines: [
          { index: 0, meaning: "One", source: "reused", confidence: "high" },
          { index: 1, meaning: "Two", source: "generated", confidence: "high" },
        ],
      };
    },
  });

  const result = await service.generateAndAcceptBatch([17, 18], "admin-1", 10);

  assert.deepEqual(result, {
    requested: 2,
    generated: 1,
    reusedDraft: 1,
    saved: 2,
    alreadyV2: 0,
    stale: 0,
    failed: 0,
  });
  assert.equal(aiCalls, 1);
  assert.deepEqual(writes, [17, 18]);
  assert.equal(stored.size, 0);
  assert.ok(candidates.get(17)?.lyricsV2);
  assert.ok(candidates.get(18)?.lyricsV2);
});

test("generate-and-accept batch never overwrites V2 and isolates stale writes", async () => {
  const existingV2 = {
    version: 2 as const,
    entries: [{ kind: "line" as const, burmese: "တစ်", romanized: "tit", meaning: "One" }],
  };
  const candidates = new Map<number, LegacyLyricsMigrationCandidate>([
    [17, { ...candidate, lyricsV2: existingV2 }],
    [18, { ...candidate, mmid: 18, songName: "Song 18" }],
  ]);
  const stored = new Map<number, LyricsMeaningReviewDraft>([
    [18, {
      mmid: 18,
      songName: "Song 18",
      legacySnapshot: {
        burmese: candidate.burmese,
        romanized: candidate.romanized,
        meaning: candidate.meaning,
      },
      rows: [
        { index: 0, burmese: "တစ်", romanized: "tit", meaning: "One", source: "reused", confidence: "high", edited: false },
        { index: 1, burmese: "နှစ်", romanized: "hnit", meaning: "Two", source: "generated", confidence: "high", edited: false },
      ],
    }],
  ]);

  const drafts: ILyricsMeaningReviewDraftRepository = {
    findByMmid: async mmid => stored.get(mmid) ?? null,
    listMmids: async () => [...stored.keys()],
    upsertGenerated: async () => {
      throw new Error("should not generate");
    },
    updateRowsIfSnapshotMatches: async () => null,
    deleteByMmid: async mmid => {
      stored.delete(mmid);
    },
  };

  const service = new LyricsMeaningAlignmentService({
    getLyricsMigrationCandidate: async mmid => candidates.get(mmid) ?? null,
    saveLyricsV2IfLegacyMatches: async mmid => (
      mmid === 18 ? { status: "stale" as const } : { status: "already_v2" as const }
    ),
  }, drafts, {
    alignMeaning: async () => {
      throw new Error("AI should not be called");
    },
  });

  const result = await service.generateAndAcceptBatch([17, 18], "admin-1", 10);
  assert.deepEqual(result, {
    requested: 2,
    generated: 0,
    reusedDraft: 1,
    saved: 0,
    alreadyV2: 1,
    stale: 1,
    failed: 0,
  });
  assert.ok(stored.has(18));
});

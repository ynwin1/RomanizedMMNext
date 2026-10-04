import { z } from "zod";
import type { LyricsMeaningAlignmentProvider } from "./lyrics-meaning-alignment.provider";
import type { ILyricsMeaningReviewDraftRepository } from "./lyrics-meaning-review-draft.repository";
import type {
  LegacyLyricsMigrationCandidate,
  LyricsMigrationRepairStrategy,
} from "../domain/lyrics-migration.types";
import type {
  LegacyLyricsSnapshot,
  LyricsMeaningAlignmentPreview,
  LyricsMeaningAlignmentSaveResult,
  MeaningAlignmentInputLine,
  MeaningAlignmentResult,
} from "../domain/lyrics-meaning-alignment.types";
import type { LyricsMeaningReviewDraft } from "../domain/lyrics-meaning-review-draft.types";
import type { LyricsV2Entry } from "../domain/lyrics-v2.types";
import { planLyricsMigrationRepair } from "./lyrics-migration.repair";
import { parseLyricsV2 } from "./lyrics-v2.validation";
import { NotFoundError } from "@/shared/errors/not-found.error";

const ResultSchema = z.object({
  lines: z.array(z.object({
    index: z.number().int().min(0),
    meaning: z.string().trim().min(1).max(10000),
    source: z.enum(["reused", "generated"]),
    confidence: z.enum(["high", "medium", "low"]),
  }).strict()).min(1).max(5000),
}).strict();

function split(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function nonblank(value: string) {
  return value.trim().length > 0;
}

function snapshot(candidate: LegacyLyricsMigrationCandidate): LegacyLyricsSnapshot {
  return {
    burmese: candidate.burmese,
    romanized: candidate.romanized,
    meaning: candidate.meaning,
  };
}

function sameSnapshot(left: LegacyLyricsSnapshot, right: LegacyLyricsSnapshot) {
  return left.burmese === right.burmese
    && left.romanized === right.romanized
    && left.meaning === right.meaning;
}

interface CandidateSource {
  getLyricsMigrationCandidate(mmid: number): Promise<LegacyLyricsMigrationCandidate | null>;
  saveLyricsV2IfLegacyMatches(
    mmid: number,
    expected: LegacyLyricsSnapshot,
    lyricsV2: ReturnType<typeof parseLyricsV2>,
    updatedBy: string,
  ): Promise<LyricsMeaningAlignmentSaveResult>;
}

export class LyricsMeaningAlignmentService {
  constructor(
    private readonly songs: CandidateSource,
    private readonly drafts: ILyricsMeaningReviewDraftRepository,
    private readonly provider?: LyricsMeaningAlignmentProvider,
  ) {}

  async preview(
    mmid: number,
    options: { regenerate?: boolean; updatedBy?: string } = {},
  ): Promise<LyricsMeaningAlignmentPreview> {
    const candidate = await this.requireEligibleCandidate(mmid);
    const expected = snapshot(candidate);

    if (!options.regenerate) {
      const cached = await this.drafts.findByMmid(mmid);
      if (cached && sameSnapshot(cached.legacySnapshot, expected)) {
        return this.previewFromDraft(candidate, cached, true);
      }
    }

    if (!this.provider) throw new Error("AI Meaning Alignment provider is required to generate a preview.");

    const sourceLines = split(candidate.burmese);
    const romanizedValues = split(candidate.romanized).filter(nonblank).map(value => value.trim());
    const existingMeaningLines = split(candidate.meaning).filter(nonblank).map(value => value.trim());
    const lines: MeaningAlignmentInputLine[] = [];
    let lyricIndex = 0;

    for (const source of sourceLines) {
      if (!nonblank(source)) continue;
      lines.push({
        index: lyricIndex,
        burmese: source.trim(),
        romanized: romanizedValues[lyricIndex]!,
      });
      lyricIndex += 1;
    }

    const raw = await this.provider.alignMeaning({
      songName: candidate.songName,
      lines,
      existingMeaningLines,
    });
    const result: MeaningAlignmentResult = ResultSchema.parse(raw);

    if (result.lines.length !== lines.length) {
      throw new Error("AI Meaning Alignment row count did not match the protected lyric backbone.");
    }

    const existing = new Set(existingMeaningLines);
    result.lines.forEach((row, index) => {
      if (row.index !== index) throw new Error("AI Meaning Alignment indexes did not match the protected lyric backbone.");
      if (row.source === "reused" && !existing.has(row.meaning)) {
        throw new Error("AI marked a Meaning as reused but changed the legacy text.");
      }
    });

    const rows = result.lines.map((row, index) => ({
      ...row,
      burmese: lines[index]!.burmese,
      romanized: lines[index]!.romanized,
      edited: false,
    }));

    const persisted = await this.drafts.upsertGenerated(
      candidate.mmid,
      candidate.songName,
      expected,
      rows,
      options.updatedBy,
    );

    return this.previewFromDraft(candidate, persisted, false);
  }

  async saveDraft(
    mmid: number,
    expected: LegacyLyricsSnapshot,
    meanings: string[],
    updatedBy: string,
  ): Promise<LyricsMeaningAlignmentSaveResult> {
    const candidate = await this.requireEligibleCandidate(mmid);
    const current = snapshot(candidate);
    if (!sameSnapshot(current, expected)) return { status: "stale" };

    const draft = await this.drafts.findByMmid(mmid);
    if (!draft || !sameSnapshot(draft.legacySnapshot, expected)) return { status: "stale" };

    const validated = this.validateReviewedMeanings(candidate, meanings);
    const rows = draft.rows.map((row, index) => {
      const meaning = validated[index]!;
      return {
        ...row,
        meaning,
        edited: row.edited || meaning !== row.meaning,
      };
    });

    const saved = await this.drafts.updateRowsIfSnapshotMatches(mmid, expected, rows, updatedBy);
    return saved ? { status: "saved" } : { status: "stale" };
  }

  async saveReviewed(
    mmid: number,
    expected: LegacyLyricsSnapshot,
    meanings: string[],
    updatedBy: string,
  ): Promise<LyricsMeaningAlignmentSaveResult> {
    const candidate = await this.songs.getLyricsMigrationCandidate(mmid);
    if (!candidate) throw new NotFoundError("Song not found", "SONG_NOT_FOUND");

    const plan = planLyricsMigrationRepair(candidate);
    if (plan.strategy !== ("AI_MEANING_ALIGNMENT" satisfies LyricsMigrationRepairStrategy)) {
      if (candidate.lyricsV2) return { status: "already_v2" };
      throw new Error("Song is not eligible for AI Meaning Alignment.");
    }

    const current = snapshot(candidate);
    if (!sameSnapshot(current, expected)) return { status: "stale" };

    const validated = this.validateReviewedMeanings(candidate, meanings);
    const sourceLines = split(candidate.burmese);
    const romanizedValues = split(candidate.romanized).filter(nonblank).map(value => value.trim());
    const entries: LyricsV2Entry[] = [];
    let lyricIndex = 0;

    for (const source of sourceLines) {
      if (!nonblank(source)) {
        if (entries.length && entries[entries.length - 1]?.kind !== "break") entries.push({ kind: "break" });
        continue;
      }

      entries.push({
        kind: "line",
        burmese: source.trim(),
        romanized: romanizedValues[lyricIndex]!,
        meaning: validated[lyricIndex]!,
      });
      lyricIndex += 1;
    }

    if (entries[entries.length - 1]?.kind === "break") entries.pop();
    const lyricsV2 = parseLyricsV2({ version: 2, entries });
    const result = await this.songs.saveLyricsV2IfLegacyMatches(mmid, expected, lyricsV2, updatedBy);
    if (result.status === "saved") await this.drafts.deleteByMmid(mmid);
    return result;
  }

  private async requireEligibleCandidate(mmid: number) {
    const candidate = await this.songs.getLyricsMigrationCandidate(mmid);
    if (!candidate) throw new NotFoundError("Song not found", "SONG_NOT_FOUND");

    const plan = planLyricsMigrationRepair(candidate);
    if (plan.strategy !== ("AI_MEANING_ALIGNMENT" satisfies LyricsMigrationRepairStrategy)) {
      throw new Error("Song is not eligible for AI Meaning Alignment.");
    }
    return candidate;
  }

  private validateReviewedMeanings(candidate: LegacyLyricsMigrationCandidate, meanings: string[]) {
    const lyricCount = split(candidate.burmese).filter(nonblank).length;
    if (meanings.length !== lyricCount) {
      throw new Error("Reviewed Meaning row count did not match the protected lyric backbone.");
    }
    return meanings.map(meaning => {
      const value = meaning.trim();
      if (!value) throw new Error("Reviewed Meaning cannot be blank.");
      return value;
    });
  }

  private previewFromDraft(
    candidate: LegacyLyricsMigrationCandidate,
    draft: LyricsMeaningReviewDraft,
    cached: boolean,
  ): LyricsMeaningAlignmentPreview {
    const sourceLines = split(candidate.burmese);
    const byIndex = new Map(draft.rows.map(row => [row.index, row]));
    const entries: LyricsV2Entry[] = [];
    const rows: LyricsMeaningAlignmentPreview["rows"] = [];
    let lyricIndex = 0;

    for (const source of sourceLines) {
      if (!nonblank(source)) {
        if (entries.length && entries[entries.length - 1]?.kind !== "break") entries.push({ kind: "break" });
        continue;
      }

      const row = byIndex.get(lyricIndex);
      if (!row) throw new Error("Saved AI Meaning review draft no longer matches the protected lyric backbone.");

      rows.push(row);
      entries.push({
        kind: "line",
        burmese: row.burmese,
        romanized: row.romanized,
        meaning: row.meaning,
      });
      lyricIndex += 1;
    }

    if (entries[entries.length - 1]?.kind === "break") entries.pop();
    const lyricsV2 = parseLyricsV2({ version: 2, entries });

    return {
      mmid: candidate.mmid,
      songName: candidate.songName,
      strategy: "AI_MEANING_ALIGNMENT",
      legacySnapshot: draft.legacySnapshot,
      lyricsV2,
      rows,
      cached,
      counts: {
        reused: rows.filter(row => row.source === "reused").length,
        generated: rows.filter(row => row.source === "generated").length,
        lowConfidence: rows.filter(row => row.confidence === "low" && !row.edited).length,
      },
    };
  }
}

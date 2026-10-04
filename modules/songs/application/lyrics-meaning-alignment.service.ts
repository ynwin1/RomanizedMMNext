import { z } from "zod";
import type { LyricsMeaningAlignmentProvider } from "./lyrics-meaning-alignment.provider";
import type {
  LegacyLyricsMigrationCandidate,
  LyricsMigrationRepairStrategy,
} from "../domain/lyrics-migration.types";
import type {
  LyricsMeaningAlignmentPreview,
  MeaningAlignmentInputLine,
  MeaningAlignmentResult,
} from "../domain/lyrics-meaning-alignment.types";
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

interface CandidateSource {
  getLyricsMigrationCandidate(mmid: number): Promise<LegacyLyricsMigrationCandidate | null>;
}

export class LyricsMeaningAlignmentService {
  constructor(
    private readonly songs: CandidateSource,
    private readonly provider: LyricsMeaningAlignmentProvider,
  ) {}

  async preview(mmid: number): Promise<LyricsMeaningAlignmentPreview> {
    const candidate = await this.songs.getLyricsMigrationCandidate(mmid);
    if (!candidate) throw new NotFoundError("Song not found", "SONG_NOT_FOUND");

    const plan = planLyricsMigrationRepair(candidate);
    if (plan.strategy !== ("AI_MEANING_ALIGNMENT" satisfies LyricsMigrationRepairStrategy)) {
      throw new Error("Song is not eligible for AI Meaning Alignment.");
    }

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

    const byIndex = new Map(result.lines.map(row => [row.index, row]));
    const entries: LyricsV2Entry[] = [];
    const rows: LyricsMeaningAlignmentPreview["rows"] = [];
    lyricIndex = 0;

    for (const source of sourceLines) {
      if (!nonblank(source)) {
        if (entries.length && entries[entries.length - 1]?.kind !== "break") entries.push({ kind: "break" });
        continue;
      }

      const aligned = byIndex.get(lyricIndex)!;
      const row = {
        ...aligned,
        burmese: source.trim(),
        romanized: romanizedValues[lyricIndex]!,
      };
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
      strategy: plan.strategy,
      lyricsV2,
      rows,
      counts: {
        reused: rows.filter(row => row.source === "reused").length,
        generated: rows.filter(row => row.source === "generated").length,
        lowConfidence: rows.filter(row => row.confidence === "low").length,
      },
    };
  }
}

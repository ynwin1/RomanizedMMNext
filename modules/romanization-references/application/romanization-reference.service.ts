import type { RomanizationReference, RomanizationReferenceSource } from "./romanization-reference.types";
import { LyricsV2Schema } from "@/modules/songs/application/lyrics-v2.validation";
import {refineRomanization} from "./romanization-refinement";

const MAX_SONGS = 30;
const MAX_REFERENCES = 24;
const MAX_LINE_LENGTH = 200;

function relevance(line: string, sources: string[]): number {
  if (sources.includes(line)) return 1000;
  const words = new Set(line.split(" ").filter(part => part.length > 1));
  let best = 0;
  for (const source of sources) {
    const matchingWords = source.split(" ").filter(word => words.has(word)).length;
    best = Math.max(best, matchingWords);
  }
  return best;
}

function normalize(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}

export class RomanizationReferenceService {
  constructor(private readonly source: RomanizationReferenceSource) {}

  async refineGenerated(lines: Array<{index: number; text: string}>, generated: Array<{index: number; text: string}>) {
    // The full corrected catalogue is the trusted source. The DB returns newest first.
    const songs = await this.source.recentReviewedSongs(500);
    return refineRomanization(lines, generated, songs);
  }

  async findRelevant(sourceLines: string[], options: { recentSongs?: number; maxReferences?: number } = {}): Promise<RomanizationReference[]> {
    const recentSongs = Math.min(MAX_SONGS, Math.max(1, Math.trunc(options.recentSongs ?? 10)));
    const maxReferences = Math.min(MAX_REFERENCES, Math.max(1, Math.trunc(options.maxReferences ?? 12)));
    const source = sourceLines.map(normalize).filter(Boolean);
    const target = new Set(source);
    if (!target.size) return [];

    const songs = await this.source.recentReviewedSongs(recentSongs);
    const seen = new Set<string>();
    const exact: RomanizationReference[] = [];
    const other: Array<{ reference: RomanizationReference; score: number; order: number }> = [];

    for (const song of songs) {
      const parsed = LyricsV2Schema.safeParse(song.lyricsV2);
      if (!parsed.success) continue;
      for (const entry of parsed.data.entries) {
        if (entry.kind !== "line") continue;
        const burmese = normalize(entry.burmese);
        const romanized = normalize(entry.romanized);
        if (!burmese || !romanized || burmese.length > MAX_LINE_LENGTH || romanized.length > MAX_LINE_LENGTH) continue;
        // A recent song wins for identical Burmese source lines; don't dilute its spelling with older variants.
        if (seen.has(burmese)) continue;
        seen.add(burmese);
        const reference = { mmid: song.mmid, burmese, romanized };
        if (target.has(burmese)) exact.push(reference);
        else other.push({ reference, score: relevance(burmese, source), order: other.length });
      }
    }

    // Exact source-line matches first; fill remaining slots using the most recent unique examples.
    return [...exact, ...other.sort((a, b) => b.score - a.score || a.order - b.order).map(item => item.reference)].slice(0, maxReferences);
  }
}

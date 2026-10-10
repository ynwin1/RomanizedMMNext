import type { RomanizationReference, RomanizationReferenceSource } from "./romanization-reference.types";
import { LyricsV2Schema } from "@/modules/songs/application/lyrics-v2.validation";

const MAX_SONGS = 30;
const MAX_REFERENCES = 24;
const MAX_LINE_LENGTH = 200;

function normalize(value: string): string {
  return value.normalize("NFC").trim().replace(/\\s+/g, " ");
}

export class RomanizationReferenceService {
  constructor(private readonly source: RomanizationReferenceSource) {}

  async findRelevant(sourceLines: string[], options: { recentSongs?: number; maxReferences?: number } = {}): Promise<RomanizationReference[]> {
    const recentSongs = Math.min(MAX_SONGS, Math.max(1, Math.trunc(options.recentSongs ?? 10)));
    const maxReferences = Math.min(MAX_REFERENCES, Math.max(1, Math.trunc(options.maxReferences ?? 12)));
    const target = new Set(sourceLines.map(normalize).filter(Boolean));
    if (!target.size) return [];

    const songs = await this.source.recentReviewedSongs(recentSongs);
    const seen = new Set<string>();
    const exact: RomanizationReference[] = [];
    const other: RomanizationReference[] = [];

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
        (target.has(burmese) ? exact : other).push(reference);
      }
    }

    // Exact source-line matches first; fill remaining slots using the most recent unique examples.
    return [...exact, ...other].slice(0, maxReferences);
  }
}

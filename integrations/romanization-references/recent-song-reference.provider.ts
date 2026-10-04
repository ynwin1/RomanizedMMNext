import { logger } from "@/infrastructure/logging/logger";
import type { SongService } from "@/modules/songs/application/song.service";
import type {
  LyricSourceLine,
  RomanizationReference,
  RomanizationReferenceProvider,
} from "@/modules/content-generation";

interface RecentSongRomanizationReferenceProviderOptions {
  recentSongLimit?: number;
  referenceLineLimit?: number;
}

interface CandidateLine {
  burmese: string;
  romanized: string;
  meaning?: string;
  sourceSongMmid: number;
  sourceSongName: string;
  recencyRank: number;
}

function lines(value: string): string[] {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function normalizeBurmese(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase()
    .replace(/[\s၊။!?.,'"“”‘’()[\]{}:;\-–—…]/gu, "");
}

function ngrams(value: string, size: number): Set<string> {
  const result = new Set<string>();
  if (value.length < size) {
    if (value) result.add(value);
    return result;
  }
  for (let index = 0; index <= value.length - size; index++) {
    result.add(value.slice(index, index + size));
  }
  return result;
}

function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection++;
  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function matchScore(source: string, candidate: string): {
  match: RomanizationReference["match"];
  score: number;
} | null {
  const sourceNormalized = normalizeBurmese(source);
  const candidateNormalized = normalizeBurmese(candidate);
  if (!sourceNormalized || !candidateNormalized) return null;

  if (sourceNormalized === candidateNormalized) {
    return { match: "exact", score: 1 };
  }

  const shorter = Math.min(sourceNormalized.length, candidateNormalized.length);
  const longer = Math.max(sourceNormalized.length, candidateNormalized.length);
  if (
    shorter >= 2 &&
    (sourceNormalized.includes(candidateNormalized) ||
      candidateNormalized.includes(sourceNormalized))
  ) {
    return {
      match: "phrase",
      score: 0.8 + 0.15 * (shorter / longer),
    };
  }

  const bigram = jaccard(ngrams(sourceNormalized, 2), ngrams(candidateNormalized, 2));
  const trigram = jaccard(ngrams(sourceNormalized, 3), ngrams(candidateNormalized, 3));
  const similarity = 0.4 * bigram + 0.6 * trigram;

  if (similarity < 0.3) return null;
  return { match: "similar", score: similarity };
}

export class RecentSongRomanizationReferenceProvider implements RomanizationReferenceProvider {
  private readonly recentSongLimit: number;
  private readonly referenceLineLimit: number;

  constructor(
    private readonly songs: Pick<SongService, "getRecentRomanizationReferenceSongs">,
    options: RecentSongRomanizationReferenceProviderOptions = {},
  ) {
    this.recentSongLimit = Math.max(1, Math.min(100, options.recentSongLimit ?? 25));
    this.referenceLineLimit = Math.max(1, Math.min(100, options.referenceLineLimit ?? 30));
  }

  async findRelevantReferences(sourceLines: LyricSourceLine[]): Promise<RomanizationReference[]> {
    let recentSongs;
    try {
      recentSongs = await this.songs.getRecentRomanizationReferenceSongs(this.recentSongLimit);
    } catch (error) {
      logger.warn("Romanization reference lookup failed; continuing without references.", {
        error: error instanceof Error ? error.name : "unknown",
      });
      return [];
    }

    const candidates: CandidateLine[] = [];

    recentSongs.forEach((song, recencyRank) => {
      const burmeseLines = lines(song.burmese);
      const romanizedLines = lines(song.romanized);
      const meaningLines = lines(song.meaning);
      const count = Math.min(burmeseLines.length, romanizedLines.length);

      for (let index = 0; index < count; index++) {
        const burmese = burmeseLines[index]?.trim();
        const romanized = romanizedLines[index]?.trim();
        if (!burmese || !romanized) continue;

        const meaning = meaningLines[index]?.trim();
        candidates.push({
          burmese,
          romanized,
          ...(meaning ? { meaning } : {}),
          sourceSongMmid: song.mmid,
          sourceSongName: song.songName,
          recencyRank,
        });
      }
    });

    const scored = new Map<string, RomanizationReference>();

    for (const candidate of candidates) {
      let best: { match: RomanizationReference["match"]; score: number } | null = null;

      for (const source of sourceLines) {
        if (!source.text.trim()) continue;
        const current = matchScore(source.text, candidate.burmese);
        if (!current || (best && current.score <= best.score)) continue;
        best = current;
      }

      if (!best) continue;

      const recencyBonus =
        recentSongs.length <= 1
          ? 0.02
          : 0.02 * (1 - candidate.recencyRank / (recentSongs.length - 1));
      const score = Math.min(1, best.score + recencyBonus);
      const key = normalizeBurmese(candidate.burmese) + "\u0000" + candidate.romanized.toLocaleLowerCase();

      const reference: RomanizationReference = {
        burmese: candidate.burmese,
        romanized: candidate.romanized,
        meaning: candidate.meaning,
        sourceSongMmid: candidate.sourceSongMmid,
        sourceSongName: candidate.sourceSongName,
        match: best.match,
        score,
      };

      const previous = scored.get(key);
      if (!previous || reference.score > previous.score) {
        scored.set(key, reference);
      }
    }

    return [...scored.values()]
      .sort((left, right) => {
        const matchPriority = { exact: 3, phrase: 2, similar: 1 };
        const priorityDifference = matchPriority[right.match] - matchPriority[left.match];
        return priorityDifference || right.score - left.score || right.sourceSongMmid - left.sourceSongMmid;
      })
      .slice(0, this.referenceLineLimit);
  }
}

export function createRecentSongRomanizationReferenceProvider(
  songs: Pick<SongService, "getRecentRomanizationReferenceSongs">,
  environment: NodeJS.ProcessEnv = process.env,
) {
  const recentSongLimit = Number(environment.ROMANIZATION_REFERENCE_SONG_LIMIT || "25");
  const referenceLineLimit = Number(environment.ROMANIZATION_REFERENCE_LINE_LIMIT || "30");

  return new RecentSongRomanizationReferenceProvider(songs, {
    recentSongLimit: Number.isFinite(recentSongLimit) ? recentSongLimit : 25,
    referenceLineLimit: Number.isFinite(referenceLineLimit) ? referenceLineLimit : 30,
  });
}

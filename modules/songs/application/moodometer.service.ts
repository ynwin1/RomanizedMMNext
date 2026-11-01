import type { MoodometerAnalysis } from "../domain/moodometer.types";
import { MoodometerAnalysisSchema } from "./moodometer.validation";
import { lyricTimingFingerprint } from "./lyric-timing.fingerprint";
import type { LyricsV2 } from "../domain/lyrics-v2.types";

export interface MoodometerRecord {
  id: string;
  mmid: number;
  analysis: MoodometerAnalysis;
  createdAt: Date;
}
export interface MoodometerStorage {
  insert(mmid: number, analysis: MoodometerAnalysis): Promise<MoodometerRecord>;
  history(mmid: number, limit: number): Promise<MoodometerRecord[]>;
  byId(mmid: number, id: string): Promise<MoodometerRecord | null>;
  publish(mmid: number, id: string): Promise<MoodometerRecord | null>;
  published(mmid: number): Promise<MoodometerRecord | null>;
}
export class MoodometerService {
  constructor(private readonly storage: MoodometerStorage, private readonly songLyrics: (mmid: number) => Promise<LyricsV2 | undefined>) {}
  private validateId(mmid: number) {
    if (!Number.isSafeInteger(mmid) || mmid <= 0) throw new Error("Invalid song ID");
  }
  async saveDraft(mmid: number, input: unknown) {
    this.validateId(mmid);
    const analysis = MoodometerAnalysisSchema.parse(input);
    if (analysis.status !== "draft") throw new Error("New analyses must be drafts");
    const lyrics = await this.songLyrics(mmid);
    if (!lyrics) throw new Error("LyricsV2 is required");
    if (lyricTimingFingerprint(lyrics) !== analysis.lyricsFingerprint) throw new Error("Lyrics changed since mood analysis");
    return this.storage.insert(mmid, analysis);
  }
  async history(mmid: number, limit = 20) {
    this.validateId(mmid);
    return this.storage.history(mmid, Math.min(100, Math.max(1, Math.floor(limit))));
  }
  async publish(mmid: number, id: string) {
    this.validateId(mmid);
    const record = await this.storage.byId(mmid, id);
    if (!record) throw new Error("Mood analysis not found");
    const lyrics = await this.songLyrics(mmid);
    if (!lyrics || lyricTimingFingerprint(lyrics) !== record.analysis.lyricsFingerprint)
      throw new Error("Mood analysis is stale: review and regenerate after lyrics changes");
    return this.storage.publish(mmid, id);
  }
  async publicResult(mmid: number) {
    this.validateId(mmid);
    const result = await this.storage.published(mmid);
    if (!result) return null;
    const lyrics = await this.songLyrics(mmid);
    if (!lyrics || lyricTimingFingerprint(lyrics) !== result.analysis.lyricsFingerprint) return null;
    return result;
  }
}

import connectDB from "@/infrastructure/database/mongodb";
import { LyricTimingModel } from "./lyric-timing.model";
import type { LyricTimingTrack } from "../domain/lyric-timing.types";
import type { TimingStorage } from "../application/lyric-timing.service";

export class MongoLyricTimingRepository implements TimingStorage {
  async load(mmid: number, videoId: string): Promise<LyricTimingTrack | null> {
    await connectDB();
    const result = await LyricTimingModel.findOne({mmid, youtubeVideoId: videoId}).lean();
    if (!result) return null;
    return {
      version: result.version, youtubeVideoId: result.youtubeVideoId,
      lyricsFingerprint: result.lyricsFingerprint, status: result.status,
      lines: result.lines.map((line: {entryIndex:number; startMs:number; endMs:number}) => ({
        entryIndex: line.entryIndex, startMs: line.startMs, endMs: line.endMs,
      })),
    };
  }
  async save(mmid: number, track: LyricTimingTrack): Promise<void> {
    await connectDB();
    await LyricTimingModel.updateOne({mmid, youtubeVideoId: track.youtubeVideoId},
      {$set: {...track, mmid}}, {upsert: true, runValidators: true});
  }
}

/** Admin recovery only: retrieve the untouched stored record even if lyrics changed. */
export async function loadRawLyricTimingTrack(mmid: number, videoId: string): Promise<LyricTimingTrack | null> {
  return new MongoLyricTimingRepository().load(mmid, videoId);
}

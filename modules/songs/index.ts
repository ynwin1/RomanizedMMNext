import { SongCoverService } from "./application/song-cover.service";
import { fetchYouTubeCoverMetadata } from "./application/song-cover.metadata";
import { MongoSongCoverRepository } from "./infrastructure/song-cover.repository";
import {buildMoodReviewQueue} from "./application/moodometer.review-queue";
import type {QueueRecord} from "./application/moodometer.review-queue";
import {selectMissingMoodCandidates} from "./application/moodometer.backfill";
import { discoverSongsByMood } from "./infrastructure/mood-discovery.repository";
import type { MoodId } from "./domain/moodometer.types";
import { MoodometerModel } from "./infrastructure/moodometer.model";
import connectDB from "@/infrastructure/database/mongodb";
import { createMoodometerReviewTemplate } from "./application/moodometer.review-export";
import { MoodometerAnalysisSchema } from "./application/moodometer.validation";
import { MoodometerService } from "./application/moodometer.service";
import { MongoMoodometerRepository } from "./infrastructure/moodometer.repository";
import { analyzeMoodometer } from "./application/moodometer.analysis";
import { createMoodometerOpenAIGenerator, MOODOMETER_MODEL } from "./infrastructure/moodometer.openai";
import { SongService } from "./application/song.service";
import { LyricTimingService } from "./application/lyric-timing.service";
import { MongoLyricTimingRepository } from "./infrastructure/lyric-timing.repository";
import { MongoSongRepository } from "./infrastructure/song.repository";
import { loadRawLyricTimingTrack } from "./infrastructure/lyric-timing.repository";
import { MongoRomanizationReferenceSource } from "./infrastructure/mongo-romanization-reference.source";

const songRepository = new MongoSongRepository();

export const songService = new SongService(songRepository);
export const songCoverService = new SongCoverService(
  new MongoSongCoverRepository(),
  async mmid => (await songRepository.findByMmid(mmid)) !== null,
  fetchYouTubeCoverMetadata,
);
export const lyricTimingService = new LyricTimingService(new MongoLyricTimingRepository(), mmid => songService.getByMmid(mmid));
export const romanizationReferenceSource = new MongoRomanizationReferenceSource();

export * from "./domain/song.types";
export * from "./domain/lyrics-v2.types";
export * from "./domain/lyrics.compatibility";
export * from "./domain/lyrics-migration.types";
export * from "./application/lyrics-migration.validator";
export * from "./application/song.dto";

export * from "./application/song.validation";
export * from "./application/lyrics-v2.validation";
export * from "./application/lyrics-v2.builder";
export * from "./application/song-write.error";


export { loadRawLyricTimingTrack };

/** Admin-facing operation, provider details remain inside the songs module. */
export async function generateSongMoodPreview(mmid: number) {
  const song = await songService.getSongForEdit(mmid);
  if (!song.lyricsV2) throw new Error("LyricsV2 is required to analyze mood");
  return analyzeMoodometer({
    title: song.songName,
    artistNames: song.artistName.map(artist => artist.name),
    genre: song.genre,
    lyrics: song.lyricsV2,
  }, createMoodometerOpenAIGenerator({
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.MOODOMETER_MODEL || MOODOMETER_MODEL,
  }), process.env.MOODOMETER_MODEL || MOODOMETER_MODEL);
}

export const moodometerService = new MoodometerService(new MongoMoodometerRepository(), async mmid => (await songService.getByMmid(mmid)).lyricsV2);

/** Read-only admin export of current published analyses; no scores are regenerated. */
export async function exportMoodometerReviewTemplate() {
  await connectDB();
  const records = await MoodometerModel.find({"analysis.status":"published"})
    .sort({createdAt:-1,_id:-1}).limit(500).lean();
  return createMoodometerReviewTemplate(records.map(record => ({
    id:String(record._id),
    mmid:record.mmid,
    analysis:MoodometerAnalysisSchema.parse(record.analysis),
    createdAt:record.createdAt,
  })));
}

export async function discoverMoodSongs(mood:MoodId) {
  return discoverSongsByMood(songService,mood);
}

/** Admin-only callers: show a bounded list of songs without any Moodometer history. */
export async function listMoodometerMissingSongs() {
 await connectDB();
 const [songs, existing] = await Promise.all([
  songService.getCatalogueSongs(),
  MoodometerModel.distinct("mmid"),
 ]);
 return selectMissingMoodCandidates(songs,new Set(existing),20).map(song=>({
  mmid:song.mmid,songName:song.songName,artistName:song.artistName.map(a=>a.name).join(", "),
 }));
}

/** Admin-only inventory: compares latest stored analyses with the song's current lyrics. */
export async function listMoodReviewQueue() {
 await connectDB();
 const catalogue=await songService.getCatalogueSongs();
 const ids=catalogue.map(song=>song.mmid);
 const [fullSongs,records]=await Promise.all([
   ids.length?songService.getSongsByMmids(ids):[],
   MoodometerModel.find({}).select("mmid analysis.status analysis.lyricsFingerprint createdAt")
     .sort({createdAt:-1,_id:-1}).lean(),
 ]);
 const byId=new Map(fullSongs.map(song=>[song.mmid,song]));
 const rows:QueueRecord[]=records.map(record=>({
   mmid:record.mmid,status:record.analysis.status,
   lyricsFingerprint:record.analysis.lyricsFingerprint,createdAt:record.createdAt,
 }));
 return buildMoodReviewQueue(catalogue.map(song=>({
   mmid:song.mmid,songName:song.songName,
   artistName:song.artistName.map(a=>a.name).join(", "),
   lyricsV2:byId.get(song.mmid)?.lyricsV2,
 })),rows);
}

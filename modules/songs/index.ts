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
  }), MOODOMETER_MODEL);
}

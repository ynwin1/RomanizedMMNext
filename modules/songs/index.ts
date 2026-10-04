import { SongService } from "./application/song.service";
import { MongoSongRepository } from "./infrastructure/song.repository";
import { MongoLyricsMeaningReviewDraftRepository } from "./infrastructure/lyrics-meaning-review-draft.repository";

const songRepository = new MongoSongRepository();
export const lyricsMeaningReviewDraftRepository = new MongoLyricsMeaningReviewDraftRepository();

export const songService = new SongService(songRepository);

export * from "./domain/song.types";
export * from "./domain/lyrics-v2.types";
export * from "./domain/lyrics.compatibility";
export * from "./domain/lyrics-migration.types";
export * from "./application/lyrics-migration.validator";
export * from "./application/lyrics-migration.repair";
export * from "./application/song.dto";

export * from "./application/song.validation";
export * from "./application/lyrics-v2.validation";
export * from "./application/song-write.error";

export * from "./domain/lyrics-meaning-alignment.types";
export * from "./application/lyrics-meaning-alignment.provider";
export * from "./application/lyrics-meaning-alignment.service";

export * from "./domain/lyrics-meaning-review-draft.types";
export * from "./application/lyrics-meaning-review-draft.repository";

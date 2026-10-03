import { SongService } from "./application/song.service";
import { MongoSongRepository } from "./infrastructure/song.repository";

const songRepository = new MongoSongRepository();

export const songService = new SongService(songRepository);

export * from "./domain/song.types";
export * from "./application/song.dto";

export * from "./application/song.validation";
export * from "./application/song-write.error";

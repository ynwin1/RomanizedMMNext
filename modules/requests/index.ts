import { SongRequestService } from "./application/song-request.service";
import { MongoSongRequestRepository } from "./infrastructure/song-request.repository";

const songRequestRepository = new MongoSongRequestRepository();

export const songRequestService = new SongRequestService(songRequestRepository);

export * from "./domain/song-request.types";
export * from "./application/song-request.dto";

export * from "./application/song-request.validation";

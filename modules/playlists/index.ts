import {PlaylistService} from "./application/playlist.service";
import {MongoPlaylistRepository} from "./infrastructure/playlist.repository";

export const playlistService = new PlaylistService(new MongoPlaylistRepository());

export * from "./domain/playlist.types";
export * from "./application/playlist.validation";
export * from "./application/playlist-write.error";

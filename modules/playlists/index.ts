import {PlaylistService} from "./application/playlist.service";
import {MongoPlaylistRepository} from "./infrastructure/playlist.repository";
import {createPlaylistSubmission, listPlaylistSubmissions, getPendingPlaylistSubmission, decidePlaylistSubmission} from "./infrastructure/playlist-submission.repository";

export const playlistService = new PlaylistService(new MongoPlaylistRepository());
export const findSpotifyPlaylistById = (id: string) => new MongoPlaylistRepository().findByPlatformId("spotify", id);
export {createPlaylistSubmission, listPlaylistSubmissions, getPendingPlaylistSubmission, decidePlaylistSubmission};

export * from "./domain/playlist.types";
export * from "./application/playlist.validation";
export * from "./application/playlist-write.error";

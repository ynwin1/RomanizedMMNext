import type {PlaylistEntity, PlaylistGenre, PlaylistPlatform, PlaylistStatus} from "../domain/playlist.types";
import type {PlaylistInput} from "./playlist.validation";

export type PlaylistWrite = PlaylistInput & {platformPlaylistId: string};

export interface IPlaylistRepository {
  create(input: PlaylistWrite, updatedBy?: string): Promise<PlaylistEntity>;
  findById(id: string): Promise<PlaylistEntity | null>;
  findByPlatformId(platform: PlaylistPlatform, platformPlaylistId: string): Promise<PlaylistEntity | null>;
  listAdmin(): Promise<PlaylistEntity[]>;
  listPublishedByGenre(genre: PlaylistGenre, limit: number): Promise<PlaylistEntity[]>;
  update(id: string, revision: number, input: PlaylistWrite, updatedBy?: string): Promise<PlaylistEntity | null>;
  setStatus(id: string, revision: number, status: PlaylistStatus, updatedBy?: string): Promise<PlaylistEntity | null>;
}

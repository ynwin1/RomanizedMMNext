import {NotFoundError} from "@/shared/errors/not-found.error";
import type {PlaylistEntity} from "../domain/playlist.types";
import {PlaylistConflictError} from "./playlist-write.error";
import type {IPlaylistRepository} from "./playlist.repository";
import {
  PlaylistGenreSchema, PlaylistIdSchema, PlaylistRevisionSchema, PlaylistStatusSchema, validatePlaylistInput,
} from "./playlist.validation";

export class PlaylistService {
  constructor(private readonly playlists: IPlaylistRepository) {}

  async create(input: unknown, updatedBy?: string): Promise<PlaylistEntity> {
    return this.playlists.create(validatePlaylistInput(input), updatedBy);
  }

  async getForAdmin(id: unknown): Promise<PlaylistEntity> {
    const playlist = await this.playlists.findById(PlaylistIdSchema.parse(id));
    if (!playlist) throw new NotFoundError("Playlist not found", "PLAYLIST_NOT_FOUND");
    return playlist;
  }

  async listAdmin(): Promise<PlaylistEntity[]> {
    return this.playlists.listAdmin();
  }

  async listPublishedByGenre(genre: unknown, limit = 5): Promise<PlaylistEntity[]> {
    const parsedGenre = PlaylistGenreSchema.parse(genre);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) throw new Error("Invalid playlist limit");
    return this.playlists.listPublishedByGenre(parsedGenre, limit);
  }

  async update(id: unknown, revision: unknown, input: unknown, updatedBy?: string): Promise<PlaylistEntity> {
    const playlistId = PlaylistIdSchema.parse(id);
    const expectedRevision = PlaylistRevisionSchema.parse(revision);
    const updated = await this.playlists.update(playlistId, expectedRevision, validatePlaylistInput(input), updatedBy);
    if (updated) return updated;
    return this.throwMissingOrConflict(playlistId);
  }

  async setStatus(id: unknown, revision: unknown, status: unknown, updatedBy?: string): Promise<PlaylistEntity> {
    const playlistId = PlaylistIdSchema.parse(id);
    const expectedRevision = PlaylistRevisionSchema.parse(revision);
    const validatedStatus = PlaylistStatusSchema.parse(status);
    const updated = await this.playlists.setStatus(playlistId, expectedRevision, validatedStatus, updatedBy);
    if (updated) return updated;
    return this.throwMissingOrConflict(playlistId);
  }

  private async throwMissingOrConflict(id: string): Promise<never> {
    if (!(await this.playlists.findById(id))) throw new NotFoundError("Playlist not found", "PLAYLIST_NOT_FOUND");
    throw new PlaylistConflictError();
  }
}

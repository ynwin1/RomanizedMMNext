import type { AdminPage } from "@/shared/admin-list";
import type { AdminSongRecord } from "@/modules/songs/application/song.dto";
import type { AdminArtistRecord } from "@/modules/artists/application/artist.dto";
import type { AdminSongRequestRecord } from "@/modules/requests/application/song-request.dto";
import type { SongRequestStatus } from "@/modules/requests/domain/song-request.types";
import type { LyricsMigrationReport } from "@/modules/songs/domain/lyrics-migration.types";

interface ReadService<T> {
  getAdminList(input?: unknown): Promise<AdminPage<T>>;
  getAdminCount(): Promise<number>;
}

interface SongReadService extends ReadService<AdminSongRecord> {
  analyzeLyricsMigration(): Promise<LyricsMigrationReport>;
}
interface RequestReadService extends ReadService<AdminSongRequestRecord> {
  getAdminCount(status?: SongRequestStatus): Promise<number>;
}

export class AdminReadService {
  constructor(
    private readonly authorize: () => Promise<unknown>,
    private readonly songs: SongReadService,
    private readonly artists: ReadService<AdminArtistRecord>,
    private readonly requests: RequestReadService,
  ) {}

  async dashboard() {
    await this.authorize();
    const [songs, artists, requests, pendingRequests, recent] = await Promise.all([
      this.songs.getAdminCount(), this.artists.getAdminCount(),
      this.requests.getAdminCount(), this.requests.getAdminCount("pending"),
      this.songs.getAdminList({ page: 1, limit: 5 }),
    ]);
    return { songs, artists, requests, pendingRequests, recentSongs: recent.items };
  }

  async listSongs(input: unknown) {
    await this.authorize();
    return this.songs.getAdminList(input);
  }
  async listArtists(input: unknown) {
    await this.authorize();
    return this.artists.getAdminList(input);
  }
  async listRequests(input: unknown) {
    await this.authorize();
    return this.requests.getAdminList(input);
  }

  async lyricsMigrationReadiness() {
    await this.authorize();
    return this.songs.analyzeLyricsMigration();
  }
}

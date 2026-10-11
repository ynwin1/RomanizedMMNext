import type {PlaylistService} from "./playlist.service";
import type {PlaylistGenre} from "../domain/playlist.types";

export async function approvePlaylistSuggestion(
  submission: {playlistId: string; url: string; genre: PlaylistGenre},
  dependencies: {
    fetchMetadata: (url: string) => Promise<{title: string; url: string; description?: string; imageUrl?: string; curator?: string}>;
    playlistService: Pick<PlaylistService, "create" | "setStatus" | "update">;
    findExisting: (id: string) => Promise<{id: string; status: string; revision: number; genres: PlaylistGenre[]; platform: "spotify" | "youtube" | "apple_music"; url: string; title: string; description?: string; imageUrl?: string; curator?: string; sortOrder: number} | null>;
  },
) {
  const metadata = await dependencies.fetchMetadata(submission.url);
  const existing = await dependencies.findExisting(submission.playlistId);
  if (existing) {
    let revision = existing.revision;
    if (!existing.genres.includes(submission.genre)) {
      if (existing.genres.length >= 3) throw new Error("This playlist already has the maximum of three genres. Edit it manually.");
      const updated = await dependencies.playlistService.update(existing.id, revision, {
        platform: existing.platform, url: existing.url, title: existing.title,
        description: existing.description, imageUrl: existing.imageUrl, curator: existing.curator,
        genres: [...existing.genres, submission.genre], sortOrder: existing.sortOrder,
      });
      revision = updated.revision;
    }
    if (existing.status !== "published") await dependencies.playlistService.setStatus(existing.id, revision, "published");
    return existing.id;
  }
  const created = await dependencies.playlistService.create({
    platform: "spotify", url: metadata.url, title: metadata.title,
    description: metadata.description, imageUrl: metadata.imageUrl, curator: metadata.curator,
    genres: [submission.genre], sortOrder: 0,
  });
  await dependencies.playlistService.setStatus(created.id, created.revision, "published");
  return created.id;
}

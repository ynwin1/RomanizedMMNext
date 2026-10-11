"use server";

import {revalidatePath} from "next/cache";
import {requireAdmin} from "@/infrastructure/auth";
import {logger} from "@/infrastructure/logging/logger";
import {playlistService, findSpotifyPlaylistById, getPendingPlaylistSubmission, decidePlaylistSubmission} from "@/modules/playlists";
import {approvePlaylistSuggestion} from "@/modules/playlists/application/playlist-submission-review";
import {fetchSpotifyPlaylistMetadata} from "@/integrations/spotify/spotify-playlist-metadata";

export async function reviewPlaylistSubmissionAction(id: string, decision: "approved" | "rejected") {
  await requireAdmin();
  if (decision !== "approved" && decision !== "rejected") return {error: "Invalid decision"};
  const pending = await getPendingPlaylistSubmission(id);
  if (!pending) return {error: "This submission has already been reviewed."};
  try {
    let playlistRecordId: string | undefined;
    if (decision === "approved") {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      if (!clientId || !clientSecret) return {error: "Spotify credentials are not configured."};
      playlistRecordId = await approvePlaylistSuggestion(pending, {
        fetchMetadata: url => fetchSpotifyPlaylistMetadata(url, {clientId, clientSecret}),
        playlistService,
        findExisting: findSpotifyPlaylistById,
      });
    }
    const updated = await decidePlaylistSubmission(id, decision, playlistRecordId);
    if (!updated) return {error: "Another admin has already reviewed this submission."};
    revalidatePath("/admin/playlists/submissions");
    revalidatePath("/admin/playlists");
    revalidatePath("/en/playlists");
    revalidatePath("/my/playlists");
    return {ok: true};
  } catch (error) {
    logger.error("Playlist review failed", error);
    return {error: error instanceof Error ? error.message : "Could not review playlist."};
  }
}

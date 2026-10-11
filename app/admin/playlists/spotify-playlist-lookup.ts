"use server";

import {requireAdmin} from "@/infrastructure/auth";
import {fetchSpotifyPlaylistMetadata} from "@/integrations/spotify/spotify-playlist-metadata";

export async function lookupSpotifyPlaylistAction(input: string) {
  await requireAdmin();
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {ok: false as const, message: "Configure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET on the server."};
  }
  try {
    return {ok: true as const, playlist: await fetchSpotifyPlaylistMetadata(input, {clientId, clientSecret})};
  } catch (error) {
    return {ok: false as const, message: error instanceof Error ? error.message : "Spotify lookup failed."};
  }
}

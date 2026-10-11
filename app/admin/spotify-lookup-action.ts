"use server";

import { requireAdmin } from "@/infrastructure/auth";
import { fetchSpotifyTrackMetadata } from "@/integrations/spotify/spotify-metadata";

export async function lookupSpotifyTrackAction(input: string) {
  await requireAdmin();
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { ok: false as const, message: "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET on the server first." };
  }
  try {
    return { ok: true as const, track: await fetchSpotifyTrackMetadata(input, { clientId, clientSecret }) };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "Spotify lookup failed." };
  }
}

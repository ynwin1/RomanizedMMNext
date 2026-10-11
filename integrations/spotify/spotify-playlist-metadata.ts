import {parsePlaylistUrl} from "@/modules/playlists/application/playlist.validation";

export interface SpotifyPlaylistMetadata {
  playlistId: string;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  curator?: string;
}

type SpotifyPlaylistResponse = {
  id: string;
  name: string;
  description?: string | null;
  images?: {url: string}[];
  owner?: {display_name?: string; id?: string};
};

export async function fetchSpotifyPlaylistMetadata(
  input: string,
  credentials: {clientId: string; clientSecret: string},
  fetcher: typeof fetch = fetch,
): Promise<SpotifyPlaylistMetadata> {
  const parsed = parsePlaylistUrl("spotify", input.trim());
  if (!parsed) throw new Error("Enter a valid Spotify playlist URL.");

  const tokenResponse = await fetcher("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!tokenResponse.ok) throw new Error("Spotify authentication failed. Check the server credentials.");
  const token = await tokenResponse.json() as {access_token?: string};
  if (!token.access_token) throw new Error("Spotify did not return an access token.");

  const response = await fetcher(`https://api.spotify.com/v1/playlists/${parsed.id}`, {
    headers: {Authorization: `Bearer ${token.access_token}`},
    cache: "no-store",
  });
  if (response.status === 404) throw new Error("Spotify could not find this public playlist.");
  if (response.status === 403) throw new Error("Spotify does not permit access to this playlist with the current app credentials.");
  if (!response.ok) throw new Error("Spotify playlist lookup failed. Please try again shortly.");

  const playlist = await response.json() as SpotifyPlaylistResponse;
  if (playlist.id !== parsed.id || !playlist.name?.trim()) throw new Error("Spotify returned incomplete playlist metadata.");
  return {
    playlistId: parsed.id,
    url: parsed.url,
    title: playlist.name.trim(),
    description: playlist.description?.trim() || undefined,
    imageUrl: playlist.images?.find(image => image.url.startsWith("https://"))?.url,
    curator: playlist.owner?.display_name?.trim() || playlist.owner?.id || undefined,
  };
}

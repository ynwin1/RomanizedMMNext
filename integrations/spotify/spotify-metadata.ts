export interface SpotifyTrackMetadata {
  trackId: string;
  name: string;
  artists: { id: string; name: string }[];
  albumName: string;
  imageLink: string;
  spotifyLink: string;
  genres: string[];
  releaseDate: string;
  durationMs: number;
  isrc?: string;
}

export function parseSpotifyTrackId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9]{22}$/.test(trimmed)) return trimmed;
  const uri = /^spotify:track:([A-Za-z0-9]{22})$/.exec(trimmed);
  if (uri) return uri[1];
  try {
    const url = new URL(trimmed);
    if (url.hostname !== "open.spotify.com" && url.hostname !== "play.spotify.com") return null;
    const match = /^\/(?:intl-[a-z]{2}\/)?track\/([A-Za-z0-9]{22})\/?$/.exec(url.pathname);
    return match?.[1] ?? null;
  } catch { return null; }
}

type TrackResponse = {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { name: string; images: { url: string }[]; release_date: string };
  external_urls?: { spotify?: string };
  duration_ms: number;
  external_ids?: { isrc?: string };
};

export async function fetchSpotifyTrackMetadata(
  input: string,
  credentials: { clientId: string; clientSecret: string },
  fetcher: typeof fetch = fetch,
): Promise<SpotifyTrackMetadata> {
  const trackId = parseSpotifyTrackId(input);
  if (!trackId) throw new Error("Enter a valid Spotify track ID or track URL.");

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
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Spotify did not return an access token.");

  const request = async (url: string) => fetcher(url, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  const response = await request(`https://api.spotify.com/v1/tracks/${trackId}?market=US`);
  if (response.status === 404) throw new Error("Spotify could not find that track.");
  if (!response.ok) throw new Error("Spotify track lookup failed. Try again shortly.");
  const track = (await response.json()) as TrackResponse;
  const genres = new Set<string>();
  // Genres are generally artist-level in Spotify, not track-level; treat as suggestions.
  for (const artist of track.artists.slice(0, 5)) {
    const artistResponse = await request(`https://api.spotify.com/v1/artists/${encodeURIComponent(artist.id)}`);
    if (artistResponse.ok) {
      const info = (await artistResponse.json()) as { genres?: string[] };
      for (const genre of info.genres ?? []) genres.add(genre);
    }
  }
  return {
    trackId: track.id,
    name: track.name,
    artists: track.artists.map(artist => ({ id: artist.id, name: artist.name })),
    albumName: track.album.name,
    imageLink: track.album.images[0]?.url ?? "",
    spotifyLink: track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`,
    genres: [...genres],
    releaseDate: track.album.release_date,
    durationMs: track.duration_ms,
    isrc: track.external_ids?.isrc,
  };
}

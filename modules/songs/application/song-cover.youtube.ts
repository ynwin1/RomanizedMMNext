/**
 * Parse an ordinary YouTube link into a canonical video identity.
 * We intentionally do not accept arbitrary hosts or parse an 11-character ID
 * from unrelated URLs: this is also used for anonymous cover submissions.
 */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const MAX_URL_LENGTH = 2048;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);
const SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);
const EMBED_HOSTS = new Set(["youtube-nocookie.com", "www.youtube-nocookie.com"]);

export function parseYouTubeVideoId(input: string): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (!value || value.length > MAX_URL_LENGTH) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!["https:", "http:"].includes(url.protocol)) return null;
  if (url.username || url.password || url.port) return null;

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);
  let videoId: string | null = null;

  if (SHORT_HOSTS.has(host) && segments.length === 1) {
    videoId = segments[0];
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === "/watch") {
      const ids = url.searchParams.getAll("v");
      if (ids.length === 1) videoId = ids[0];
    } else if (
      segments.length === 2 &&
      ["shorts", "embed", "live"].includes(segments[0])
    ) {
      videoId = segments[1];
    }
  } else if (
    EMBED_HOSTS.has(host) &&
    segments.length === 2 &&
    segments[0] === "embed"
  ) {
    videoId = segments[1];
  }

  return videoId && VIDEO_ID.test(videoId) ? videoId : null;
}

/** Stable representation for persistence, previews and duplicate detection. */
export function normalizeYouTubeVideoUrl(input: string): string | null {
  const id = parseYouTubeVideoId(input);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

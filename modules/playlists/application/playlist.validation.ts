import {z} from "zod";
import {PLAYLIST_GENRES, PLAYLIST_PLATFORMS, PLAYLIST_STATUSES, type PlaylistPlatform} from "../domain/playlist.types";

export const PlaylistPlatformSchema = z.enum(PLAYLIST_PLATFORMS);
export const PlaylistGenreSchema = z.enum(PLAYLIST_GENRES);
export const PlaylistStatusSchema = z.enum(PLAYLIST_STATUSES);
export const PlaylistIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid playlist ID");
export const PlaylistRevisionSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

const optionalText = (max: number) => z.string().trim().max(max).optional();
const secureImageUrl = z.string().url().refine(value => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password;
}, "Image must use HTTPS").optional();

export const PlaylistInputSchema = z.object({
  platform: PlaylistPlatformSchema,
  url: z.string().trim().url().max(2048),
  title: z.string().trim().min(1).max(180),
  description: optionalText(1200),
  imageUrl: secureImageUrl,
  curator: optionalText(120),
  genres: z.array(PlaylistGenreSchema).min(1).max(3).refine(values => new Set(values).size === values.length, "Duplicate genres"),
  sortOrder: z.number().int().min(0).max(10000).default(0),
}).strict();

export type PlaylistInput = z.infer<typeof PlaylistInputSchema>;

/** Validate platform ownership and derive IDs from approved public playlist URLs. No network access. */
export function parsePlaylistUrl(platform: PlaylistPlatform, value: string): {id: string; url: string} | null {
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  if (platform === "spotify") {
    if (url.hostname !== "open.spotify.com") return null;
    const match = /^\/(?:intl-[a-z]{2}\/)?playlist\/([A-Za-z0-9]{22})\/?$/.exec(url.pathname);
    return match ? {id: match[1], url: `https://open.spotify.com/playlist/${match[1]}`} : null;
  }
  if (platform === "youtube") {
    if (!["www.youtube.com", "youtube.com", "music.youtube.com"].includes(url.hostname) || url.pathname !== "/playlist") return null;
    const id = url.searchParams.get("list");
    return id && /^[A-Za-z0-9_-]{10,150}$/.test(id) ? {id, url: `https://www.youtube.com/playlist?list=${id}`} : null;
  }
  if (!["music.apple.com"].includes(url.hostname)) return null;
  const match = /^\/[a-z]{2}\/playlist\/(?:[^/]+\/)?(pl\.[A-Za-z0-9._-]+)\/?$/.exec(url.pathname);
  return match ? {id: match[1], url: `https://music.apple.com${url.pathname.replace(/\/$/, "")}`} : null;
}

export function validatePlaylistInput(input: unknown): PlaylistInput & {platformPlaylistId: string} {
  const content = PlaylistInputSchema.parse(input);
  const parsedUrl = parsePlaylistUrl(content.platform, content.url);
  if (!parsedUrl) {
    throw new z.ZodError([{code: "custom", path: ["url"], message: "Use a valid public playlist URL for the selected platform"}]);
  }
  return {...content, url: parsedUrl.url, platformPlaylistId: parsedUrl.id};
}

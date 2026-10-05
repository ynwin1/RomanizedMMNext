import { legacyLyricsFromV2 } from "@/modules/songs/domain/lyrics.compatibility";
import { parseLyricsV2 } from "@/modules/songs/application/lyrics-v2.validation";

export interface SongFormState {
  message?: string;
  errors?: Record<string, string[]>;
}

export const songTextFields = [
  "songName", "albumName", "genre", "spotifyTrackId", "spotifyLink", "appleMusicLink", "imageLink",
  "about", "whenToListen", "requestedBy", "songStoryEn", "songStoryMy",
] as const;

const optional = new Set<string>([
  "albumName", "spotifyTrackId", "spotifyLink", "appleMusicLink", "imageLink",
  "requestedBy", "songStoryEn", "songStoryMy",
]);

export function songFormInput(form: FormData, create: boolean): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const field of songTextFields) {
    const value = form.get(field);
    input[field] = optional.has(field) && (value === "" || value === null) ? undefined : value;
  }

  const artists = form.get("artistName");
  try { input.artistName = typeof artists === "string" ? JSON.parse(artists) : null; }
  catch { input.artistName = null; }

  const lyricsV2 = form.get("lyricsV2");
  if (typeof lyricsV2 === "string" && lyricsV2.trim()) {
    try {
      const parsedLyricsV2 = parseLyricsV2(JSON.parse(lyricsV2));
      input.lyricsV2 = parsedLyricsV2;
      Object.assign(input, legacyLyricsFromV2(parsedLyricsV2));
    } catch {
      input.lyricsV2 = null;
    }
  } else {
    // Admin writes are V2-first. Missing V2 intentionally fails SongContentSchema validation.
    input.lyricsV2 = null;
  }

  const youtube = form.get("youtubeLink");
  input.youtubeLink = typeof youtube === "string"
    ? youtube.split(/\r?\n/).map(value => value.trim()).filter(Boolean)
    : [];
  input.isRequested = form.get("isRequested") === "on";
  if (create) input.mmid = form.get("mmid");
  return input;
}

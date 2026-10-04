export interface SongFormState {
  message?: string;
  errors?: Record<string, string[]>;
}

export const songTextFields = [
  "songName", "albumName", "genre", "spotifyTrackId", "spotifyLink", "appleMusicLink", "imageLink",
  "about", "whenToListen", "lyrics", "romanized", "burmese", "meaning", "requestedBy", "songStoryEn", "songStoryMy",
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
    try { input.lyricsV2 = JSON.parse(lyricsV2); }
    catch { input.lyricsV2 = null; }
  } else {
    input.lyricsV2 = undefined;
  }

  const youtube = form.get("youtubeLink");
  input.youtubeLink = typeof youtube === "string"
    ? youtube.split(/\r?\n/).map(value => value.trim()).filter(Boolean)
    : [];
  input.isRequested = form.get("isRequested") === "on";
  if (create) input.mmid = form.get("mmid");
  return input;
}

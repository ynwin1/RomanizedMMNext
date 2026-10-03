import { z } from "zod";

export interface SongFormState {
  message?: string;
  errors?: Record<string, string[]>;
}
export const songTextFields = [
  "songName", "albumName", "genre", "spotifyTrackId", "spotifyLink", "appleMusicLink", "imageLink",
  "about", "whenToListen", "lyrics", "romanized", "burmese", "meaning", "requestedBy", "songStoryEn", "songStoryMy",
] as const;
const optional = new Set<string>(["albumName", "spotifyTrackId", "spotifyLink", "appleMusicLink", "imageLink", "requestedBy", "songStoryEn", "songStoryMy"]);

export function songFormInput(form: FormData, create: boolean): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const field of songTextFields) {
    const value = form.get(field);
    input[field] = optional.has(field) && (value === "" || value === null) ? undefined : value;
  }
  const artists = form.get("artistName");
  try { input.artistName = typeof artists === "string" ? JSON.parse(artists) : null; }
  catch { input.artistName = null; }
  const youtube = form.get("youtubeLink");
  input.youtubeLink = typeof youtube === "string" ? youtube.split(/\r?\n/).map(value => value.trim()).filter(Boolean) : [];
  input.isRequested = form.get("isRequested") === "on";
  if (create) input.mmid = form.get("mmid");
  return input;
}

export function songValidationErrors(error: z.ZodError): SongFormState {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    (errors[field] ??= []).push(issue.message);
  }
  return { message: "Please correct the highlighted fields.", errors };
}

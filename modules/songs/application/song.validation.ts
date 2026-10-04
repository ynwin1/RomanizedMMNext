import { z } from "zod";

export const SongIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const title = z.string().trim().min(1).max(500);
const content = z.string().max(200000).refine(value => value.trim().length > 0, "Required");
const optionalText = z.string().max(10000).optional();
const url = z.string().url().max(2048).refine(
  value => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  },
  "Use an HTTP or HTTPS URL",
);
const artistSlug = z.string().trim().min(1).max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase artist slug");

export const SongContentSchema = z.object({
  songName: title,
  artistName: z.array(z.object({
    name: title,
    slug: artistSlug.optional(),
  }).strict()).min(1).max(30),
  albumName: optionalText,
  genre: title,
  spotifyTrackId: z.string().trim().max(200).optional(),
  spotifyLink: url.optional(),
  appleMusicLink: url.optional(),
  youtubeLink: z.array(url).max(20).optional(),
  imageLink: url.optional(),
  about: content,
  whenToListen: content,
  lyrics: content,
  romanized: content,
  burmese: content,
  meaning: content,
  isRequested: z.boolean().default(false),
  requestedBy: optionalText,
  songStoryEn: optionalText,
  songStoryMy: optionalText,
}).strict();

export const CreateSongSchema = SongContentSchema.extend({ mmid: SongIdSchema });
export const SongRevisionSchema = z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const UpdateSongCommandSchema = z.object({
  id: SongIdSchema,
  revision: SongRevisionSchema,
  input: SongContentSchema,
}).strict();

export type SongContentInput = z.infer<typeof SongContentSchema>;
export type CreateSongInput = z.infer<typeof CreateSongSchema>;
export type UpdateSongCommand = z.infer<typeof UpdateSongCommandSchema>;

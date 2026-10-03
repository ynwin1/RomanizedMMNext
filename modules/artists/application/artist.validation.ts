import { z } from "zod";
const text = z.string().trim().min(1).max(500);
const optionalText = z.string().max(100000).optional();
const slug = z.string().trim().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase artist slug");
const url = z.string().url().max(2048).refine(value => ["http:", "https:"].includes(new URL(value).protocol), "Use an HTTP or HTTPS URL");
const optionalUrl = url.optional();
const songId = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const ArtistSlugSchema = slug;
export const ArtistRevisionSchema = z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

const MemberSchema = z.object({
  name: text,
  imageLink: optionalUrl,
  slug: slug.optional(),
}).strict();

const SocialsSchema = z.object({
  facebook: optionalUrl,
  instagram: optionalUrl,
  youtube: optionalUrl,
  spotify: optionalUrl,
  appleMusic: optionalUrl,
}).strict();

const stringList = z.array(text).max(100);
const songList = z.array(songId).max(5000).refine(values => new Set(values).size === values.length, "Song IDs must be unique");

export const ArtistContentSchema = z.object({
  name: text,
  imageLink: url,
  bannerLink: optionalUrl,
  biography: optionalText,
  biographyMy: optionalText,
  unknownFact: optionalText,
  type: text,
  members: z.array(MemberSchema).max(50).optional(),
  origin: stringList.optional(),
  labels: stringList.optional(),
  musicGenre: stringList.min(1),
  songs: songList,
  socials: SocialsSchema.optional(),
}).strict();

export const CreateArtistSchema = ArtistContentSchema.extend({
  slug,
  likes: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
}).strict();

export type ArtistContentInput = z.infer<typeof ArtistContentSchema>;
export type CreateArtistInput = z.infer<typeof CreateArtistSchema>;

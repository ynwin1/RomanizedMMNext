import { z } from "zod";

export const ContentDraftIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid draft id");
export const ContentDraftIngestionIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ingestion id");
export const ContentDraftRevisionSchema = z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

const shortText = z.string().trim().min(1).max(500);
const content = z.string().max(200000).refine(value => value.trim().length > 0, "Required");
const editorial = z.string().max(10000).refine(value => value.trim().length > 0, "Required");
const url = z.string().url().max(2048).refine(
  value => ["http:", "https:"].includes(new URL(value).protocol),
  "Use an HTTP or HTTPS URL",
);
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid artist id");
const slug = z.string().trim().min(1).max(200).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Use a lowercase artist slug",
);

export const DraftIdentitySchema = z.object({
  songName: shortText.optional(),
}).strict();

export const DraftSourceSchema = z.object({
  burmeseLyrics: content.optional(),
}).strict();

export const DraftGeneratedContentSchema = z.object({
  romanized: content.optional(),
  meaning: content.optional(),
  about: editorial.optional(),
  whenToListen: editorial.optional(),
}).strict();

export const DraftMetadataSchema = z.object({
  albumName: z.string().max(10000).optional(),
  genre: shortText.optional(),
  spotifyTrackId: z.string().trim().min(1).max(200).optional(),
  spotifyLink: url.optional(),
  appleMusicLink: url.optional(),
  youtubeLinks: z.array(url).max(20).optional(),
  imageLink: url.optional(),
  requestedBy: z.string().max(10000).optional(),
}).strict();

export const DraftArtistReferenceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("resolved"),
    artistId: objectId,
    name: shortText,
    slug,
  }).strict(),
  z.object({
    kind: z.literal("unresolved"),
    name: shortText,
  }).strict(),
]);

export const CreateContentDraftSchema = z.object({
  ingestionId: ContentDraftIngestionIdSchema,
}).strict();

const nonEmptyPatch = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).strict().refine(value => Object.keys(value).length > 0, "At least one field is required");

const IdentityPatchSchema = nonEmptyPatch({
  songName: shortText.optional(),
});

const SourcePatchSchema = nonEmptyPatch({
  burmeseLyrics: content.optional(),
});

const GeneratedPatchSchema = nonEmptyPatch({
  romanized: content.optional(),
  meaning: content.optional(),
  about: editorial.optional(),
  whenToListen: editorial.optional(),
});

const MetadataPatchSchema = nonEmptyPatch({
  albumName: z.string().max(10000).optional(),
  genre: shortText.optional(),
  spotifyTrackId: z.string().trim().min(1).max(200).optional(),
  spotifyLink: url.optional(),
  appleMusicLink: url.optional(),
  youtubeLinks: z.array(url).max(20).optional(),
  imageLink: url.optional(),
  requestedBy: z.string().max(10000).optional(),
});

export const ContentDraftPatchSchema = z.object({
  identity: IdentityPatchSchema.optional(),
  source: SourcePatchSchema.optional(),
  generated: GeneratedPatchSchema.optional(),
  metadata: MetadataPatchSchema.optional(),
  artists: z.array(DraftArtistReferenceSchema).max(30).optional(),
}).strict().refine(
  value => Object.keys(value).length > 0,
  "At least one draft section is required",
);

export type CreateContentDraftInput = z.infer<typeof CreateContentDraftSchema>;
export type ContentDraftPatch = z.infer<typeof ContentDraftPatchSchema>;

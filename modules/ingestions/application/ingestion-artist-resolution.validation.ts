import { z } from "zod";
import {
  ContentDraftIdSchema,
  ContentDraftRevisionSchema,
} from "@/modules/content-drafts";
import { ArtistSlugSchema } from "@/modules/artists";

const artistIndex = z.coerce.number().int().min(0).max(29);
const artistName = z.string().trim().min(1).max(500);

export const ResolveDraftArtistSchema = z.object({
  draftId: ContentDraftIdSchema,
  draftRevision: ContentDraftRevisionSchema,
  artistIndex,
  artistSlug: ArtistSlugSchema,
}).strict();

export const AddDraftArtistSchema = z.object({
  draftId: ContentDraftIdSchema,
  draftRevision: ContentDraftRevisionSchema,
  artistName,
}).strict();

export const RemoveDraftArtistSchema = z.object({
  draftId: ContentDraftIdSchema,
  draftRevision: ContentDraftRevisionSchema,
  artistIndex,
}).strict();

export const ConfirmDraftArtistsSchema = z.object({
  draftId: ContentDraftIdSchema,
}).strict();

export type ResolveDraftArtistInput = z.infer<typeof ResolveDraftArtistSchema>;
export type AddDraftArtistInput = z.infer<typeof AddDraftArtistSchema>;
export type RemoveDraftArtistInput = z.infer<typeof RemoveDraftArtistSchema>;
export type ConfirmDraftArtistsInput = z.infer<typeof ConfirmDraftArtistsSchema>;

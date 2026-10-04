import { z } from "zod";
import type { IngestionWorkflowService } from "@/modules/ingestions/application/ingestion-workflow.service";
import {
  GenerateAiContentSchema,
  IngestionIdSchema,
  IngestionRequestIdSchema,
  SaveIngestionSourceSchema,
} from "@/modules/ingestions/application/ingestion.validation";
import {
  ContentDraftConflictError,
  SaveDraftMetadataSchema,
  SaveDraftReviewSchema,
} from "@/modules/content-drafts";
import {
  ContentGenerationProviderError,
  GeneratedContentQualityError,
  InvalidGeneratedContentError,
} from "@/modules/content-generation";
import { IngestionConflictError } from "@/modules/ingestions/application/ingestion-write.error";
import {
  IngestionSourceStateError,
  RequestNotAcceptedForIngestionError,
} from "@/modules/ingestions/application/ingestion-workflow.error";
import {
  MissingTrustedSourceError,
  RomanizationStateError,
} from "@/modules/ingestions/application/ingestion-romanization.error";
import {
  AiGenerationStateError,
  IncompleteAiGenerationError,
} from "@/modules/ingestions/application/ingestion-generation.error";
import { IngestionMetadataStateError } from "@/modules/ingestions/application/ingestion-metadata.error";
import { IngestionReviewStateError } from "@/modules/ingestions/application/ingestion-review.error";
import {
  DraftArtistResolutionError,
  IngestionArtistResolutionStateError,
} from "@/modules/ingestions/application/ingestion-artist-resolution.error";
import {
  AddDraftArtistSchema,
  ConfirmDraftArtistsSchema,
  RemoveDraftArtistSchema,
  ResolveDraftArtistSchema,
} from "@/modules/ingestions/application/ingestion-artist-resolution.validation";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { prepareValidatedWrite, type AdminWritePrincipal } from "@/shared/write/validated-write";

export interface IngestionActionState {
  message?: string;
  errors?: Record<string, string[]>;
}

const StartIngestionSchema = z.object({ requestId: IngestionRequestIdSchema }).strict();
const SaveIngestionMetadataSchema = SaveDraftMetadataSchema.extend({
  ingestionId: IngestionIdSchema,
}).strict();
const SaveIngestionReviewSchema = SaveDraftReviewSchema.extend({
  ingestionId: IngestionIdSchema,
}).strict();
const ResolveIngestionArtistSchema = ResolveDraftArtistSchema.extend({
  ingestionId: IngestionIdSchema,
}).strict();
const AddIngestionArtistSchema = AddDraftArtistSchema.extend({
  ingestionId: IngestionIdSchema,
}).strict();
const RemoveIngestionArtistSchema = RemoveDraftArtistSchema.extend({
  ingestionId: IngestionIdSchema,
}).strict();
const ConfirmIngestionArtistsSchema = ConfirmDraftArtistsSchema.extend({
  ingestionId: IngestionIdSchema,
}).strict();

function nullableText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function youtubeLinks(value: FormDataEntryValue | null): string[] | null {
  if (typeof value !== "string") return null;
  const links = value.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
  return links.length > 0 ? links : null;
}

function isGenerationFailure(error: unknown) {
  return (
    error instanceof ContentGenerationProviderError ||
    error instanceof InvalidGeneratedContentError ||
    error instanceof GeneratedContentQualityError ||
    error instanceof IncompleteAiGenerationError
  );
}

export function createIngestionActionHandler(dependencies: {
  authorize: () => Promise<AdminWritePrincipal>;
  workflow: Pick<IngestionWorkflowService, "startAcceptedRequest" | "saveAndConfirmSource">;
  generateAiContent: (ingestionId: string, updatedBy: string) => Promise<unknown>;
  saveMetadata: (ingestionId: string, input: z.infer<typeof SaveDraftMetadataSchema>, updatedBy: string) => Promise<unknown>;
  saveReview: (ingestionId: string, input: z.infer<typeof SaveDraftReviewSchema>, updatedBy: string) => Promise<unknown>;
  resolveArtist: (ingestionId: string, input: z.infer<typeof ResolveDraftArtistSchema>, updatedBy: string) => Promise<unknown>;
  addArtist: (ingestionId: string, input: z.infer<typeof AddDraftArtistSchema>, updatedBy: string) => Promise<unknown>;
  removeArtist: (ingestionId: string, input: z.infer<typeof RemoveDraftArtistSchema>, updatedBy: string) => Promise<unknown>;
  confirmArtists: (ingestionId: string, input: z.infer<typeof ConfirmDraftArtistsSchema>, updatedBy: string) => Promise<unknown>;
  started: (ingestionId: string) => never;
  aiGenerated: (ingestionId: string) => never;
  generationFailed: (ingestionId: string) => never;
  metadataSaved: (ingestionId: string) => never;
  reviewSaved: (ingestionId: string) => never;
  artistChanged: (ingestionId: string) => never;
  artistsConfirmed: (ingestionId: string) => never;
  logFailure: (error: unknown) => void;
}) {
  const artistError = (error: unknown) =>
    error instanceof ContentDraftConflictError ||
    error instanceof IngestionConflictError ||
    error instanceof IngestionArtistResolutionStateError ||
    error instanceof DraftArtistResolutionError ||
    error instanceof NotFoundError;

  return {
    async start(requestId: string, _previous: IngestionActionState, _form: FormData): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ requestId }),
        schema: StartIngestionSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Unable to start ingestion.", errors: prepared.errors };

      try {
        const result = await dependencies.workflow.startAcceptedRequest(
          prepared.value.requestId,
          prepared.principal.userId,
        );
        return dependencies.started(result.ingestion.id);
      } catch (error) {
        if (error instanceof RequestNotAcceptedForIngestionError || error instanceof NotFoundError) {
          return { message: error.message };
        }
        dependencies.logFailure(error);
        return { message: "Unable to start ingestion. Please try again." };
      }
    },

    async saveSource(
      ingestionId: string,
      ingestionRevision: number,
      draftRevision: number,
      _previous: IngestionActionState,
      form: FormData,
    ): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ ingestionId, ingestionRevision, draftRevision, burmeseLyrics: form.get("burmeseLyrics") }),
        schema: SaveIngestionSourceSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Enter valid Burmese source lyrics.", errors: prepared.errors };

      try {
        await dependencies.workflow.saveAndConfirmSource(prepared.value, prepared.principal.userId);
      } catch (error) {
        if (
          error instanceof ContentDraftConflictError ||
          error instanceof IngestionConflictError ||
          error instanceof IngestionSourceStateError ||
          error instanceof NotFoundError
        ) return { message: error.message };
        dependencies.logFailure(error);
        return { message: "Unable to save Burmese source. Please try again." };
      }

      try {
        await dependencies.generateAiContent(prepared.value.ingestionId, prepared.principal.userId);
      } catch (error) {
        dependencies.logFailure(error);
        if (
          isGenerationFailure(error) ||
          error instanceof AiGenerationStateError ||
          error instanceof RomanizationStateError ||
          error instanceof MissingTrustedSourceError ||
          error instanceof ContentDraftConflictError ||
          error instanceof IngestionConflictError ||
          error instanceof NotFoundError
        ) {
          return dependencies.generationFailed(prepared.value.ingestionId);
        }
        return dependencies.generationFailed(prepared.value.ingestionId);
      }

      return dependencies.aiGenerated(prepared.value.ingestionId);
    },

    async generateAiContent(
      ingestionId: string,
      _previous: IngestionActionState,
      _form: FormData,
    ): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ ingestionId }),
        schema: GenerateAiContentSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Invalid ingestion.", errors: prepared.errors };

      try {
        await dependencies.generateAiContent(prepared.value.ingestionId, prepared.principal.userId);
      } catch (error) {
        if (
          error instanceof AiGenerationStateError ||
          error instanceof RomanizationStateError ||
          error instanceof MissingTrustedSourceError ||
          error instanceof ContentDraftConflictError ||
          error instanceof IngestionConflictError ||
          error instanceof NotFoundError
        ) return { message: error.message };

        if (isGenerationFailure(error)) {
          dependencies.logFailure(error);
          return { message: "AI generation failed quality or provider checks. You can retry." };
        }
        dependencies.logFailure(error);
        return { message: "Unable to generate AI content. Please try again." };
      }
      return dependencies.aiGenerated(prepared.value.ingestionId);
    },

    async saveReview(
      ingestionId: string,
      draftId: string,
      draftRevision: number,
      _previous: IngestionActionState,
      form: FormData,
    ): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({
          ingestionId,
          draftId,
          draftRevision,
          songName: form.get("songName"),
          burmeseLyrics: form.get("burmeseLyrics"),
          romanized: form.get("romanized"),
          meaning: form.get("meaning"),
          about: form.get("about"),
          whenToListen: form.get("whenToListen"),
          genre: nullableText(form.get("genre")),
          albumName: nullableText(form.get("albumName")),
          spotifyTrackId: nullableText(form.get("spotifyTrackId")),
          spotifyLink: nullableText(form.get("spotifyLink")),
          appleMusicLink: nullableText(form.get("appleMusicLink")),
          youtubeLinks: youtubeLinks(form.get("youtubeLinks")),
          imageLink: nullableText(form.get("imageLink")),
        }),
        schema: SaveIngestionReviewSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Please correct the review fields.", errors: prepared.errors };

      const { ingestionId: parsedIngestionId, ...input } = prepared.value;
      try {
        await dependencies.saveReview(parsedIngestionId, input, prepared.principal.userId);
      } catch (error) {
        if (
          error instanceof ContentDraftConflictError ||
          error instanceof IngestionReviewStateError ||
          error instanceof NotFoundError
        ) return { message: error.message };
        dependencies.logFailure(error);
        return { message: "Unable to save review changes. Please try again." };
      }
      return dependencies.reviewSaved(parsedIngestionId);
    },

    async saveMetadata(
      ingestionId: string,
      draftId: string,
      draftRevision: number,
      _previous: IngestionActionState,
      form: FormData,
    ): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({
          ingestionId,
          draftId,
          draftRevision,
          genre: form.get("genre"),
          albumName: nullableText(form.get("albumName")),
          spotifyTrackId: nullableText(form.get("spotifyTrackId")),
          spotifyLink: nullableText(form.get("spotifyLink")),
          appleMusicLink: nullableText(form.get("appleMusicLink")),
          youtubeLinks: youtubeLinks(form.get("youtubeLinks")),
          imageLink: nullableText(form.get("imageLink")),
        }),
        schema: SaveIngestionMetadataSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Enter valid factual metadata.", errors: prepared.errors };

      const { ingestionId: parsedIngestionId, ...metadata } = prepared.value;
      try {
        await dependencies.saveMetadata(parsedIngestionId, metadata, prepared.principal.userId);
      } catch (error) {
        if (
          error instanceof ContentDraftConflictError ||
          error instanceof IngestionConflictError ||
          error instanceof IngestionMetadataStateError ||
          error instanceof NotFoundError
        ) return { message: error.message };
        dependencies.logFailure(error);
        return { message: "Unable to save factual metadata. Please try again." };
      }
      return dependencies.metadataSaved(parsedIngestionId);
    },

    async resolveArtist(
      ingestionId: string,
      draftId: string,
      draftRevision: number,
      artistIndex: number,
      _previous: IngestionActionState,
      form: FormData,
    ): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ ingestionId, draftId, draftRevision, artistIndex, artistSlug: form.get("artistSlug") }),
        schema: ResolveIngestionArtistSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Select a valid existing artist.", errors: prepared.errors };

      const { ingestionId: parsedIngestionId, ...resolution } = prepared.value;
      try {
        await dependencies.resolveArtist(parsedIngestionId, resolution, prepared.principal.userId);
      } catch (error) {
        if (artistError(error)) return { message: (error as Error).message };
        dependencies.logFailure(error);
        return { message: "Unable to resolve artist. Please try again." };
      }
      return dependencies.artistChanged(parsedIngestionId);
    },

    async addArtist(
      ingestionId: string,
      draftId: string,
      draftRevision: number,
      _previous: IngestionActionState,
      form: FormData,
    ): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ ingestionId, draftId, draftRevision, artistName: form.get("artistName") }),
        schema: AddIngestionArtistSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Enter a valid artist name.", errors: prepared.errors };

      const { ingestionId: parsedIngestionId, ...input } = prepared.value;
      try {
        await dependencies.addArtist(parsedIngestionId, input, prepared.principal.userId);
      } catch (error) {
        if (artistError(error)) return { message: (error as Error).message };
        dependencies.logFailure(error);
        return { message: "Unable to add artist. Please try again." };
      }
      return dependencies.artistChanged(parsedIngestionId);
    },

    async removeArtist(
      ingestionId: string,
      draftId: string,
      draftRevision: number,
      artistIndex: number,
      _previous: IngestionActionState,
      _form: FormData,
    ): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ ingestionId, draftId, draftRevision, artistIndex }),
        schema: RemoveIngestionArtistSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Invalid artist selection.", errors: prepared.errors };

      const { ingestionId: parsedIngestionId, ...input } = prepared.value;
      try {
        await dependencies.removeArtist(parsedIngestionId, input, prepared.principal.userId);
      } catch (error) {
        if (artistError(error)) return { message: (error as Error).message };
        dependencies.logFailure(error);
        return { message: "Unable to remove artist. Please try again." };
      }
      return dependencies.artistChanged(parsedIngestionId);
    },

    async confirmArtists(
      ingestionId: string,
      draftId: string,
      _previous: IngestionActionState,
      _form: FormData,
    ): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ ingestionId, draftId }),
        schema: ConfirmIngestionArtistsSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Invalid artist list.", errors: prepared.errors };

      const { ingestionId: parsedIngestionId, ...input } = prepared.value;
      try {
        await dependencies.confirmArtists(parsedIngestionId, input, prepared.principal.userId);
      } catch (error) {
        if (artistError(error)) return { message: (error as Error).message };
        dependencies.logFailure(error);
        return { message: "Unable to confirm artist list. Please try again." };
      }
      return dependencies.artistsConfirmed(parsedIngestionId);
    },
  };
}

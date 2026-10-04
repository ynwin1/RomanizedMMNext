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

export function createIngestionActionHandler(dependencies: {
  authorize: () => Promise<AdminWritePrincipal>;
  workflow: Pick<IngestionWorkflowService, "startAcceptedRequest" | "saveAndConfirmSource">;
  generateAiContent: (ingestionId: string, updatedBy: string) => Promise<unknown>;
  saveMetadata: (ingestionId: string, input: z.infer<typeof SaveDraftMetadataSchema>, updatedBy: string) => Promise<unknown>;
  started: (ingestionId: string) => never;
  sourceSaved: (ingestionId: string) => never;
  aiGenerated: (ingestionId: string) => never;
  metadataSaved: (ingestionId: string) => never;
  logFailure: (error: unknown) => void;
}) {
  return {
    async start(requestId: string, _previous: IngestionActionState, _form: FormData): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ requestId }),
        schema: StartIngestionSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Unable to start ingestion.", errors: prepared.errors };

      let ingestionId: string;
      try {
        const result = await dependencies.workflow.startAcceptedRequest(prepared.value.requestId, prepared.principal.userId);
        ingestionId = result.ingestion.id;
      } catch (error) {
        if (error instanceof RequestNotAcceptedForIngestionError || error instanceof NotFoundError) {
          return { message: error.message };
        }
        dependencies.logFailure(error);
        return { message: "Unable to start ingestion. Please try again." };
      }
      return dependencies.started(ingestionId);
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
        ) {
          return { message: error.message };
        }
        dependencies.logFailure(error);
        return { message: "Unable to save Burmese source. Please try again." };
      }
      return dependencies.sourceSaved(IngestionIdSchema.parse(prepared.value.ingestionId));
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
        ) {
          return { message: error.message };
        }
        if (
          error instanceof ContentGenerationProviderError ||
          error instanceof InvalidGeneratedContentError ||
          error instanceof GeneratedContentQualityError ||
          error instanceof IncompleteAiGenerationError
        ) {
          dependencies.logFailure(error);
          return { message: "AI generation failed quality or provider checks. You can retry this generation." };
        }
        dependencies.logFailure(error);
        return { message: "Unable to generate AI content. Please try again." };
      }

      return dependencies.aiGenerated(prepared.value.ingestionId);
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
          error instanceof IngestionMetadataStateError ||
          error instanceof NotFoundError
        ) {
          return { message: error.message };
        }
        dependencies.logFailure(error);
        return { message: "Unable to save factual metadata. Please try again." };
      }

      return dependencies.metadataSaved(parsedIngestionId);
    },
  };
}

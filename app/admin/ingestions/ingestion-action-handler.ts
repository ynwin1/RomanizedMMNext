import { z } from "zod";
import type { IngestionWorkflowService } from "@/modules/ingestions/application/ingestion-workflow.service";
import { GenerateRomanizationSchema, IngestionIdSchema, IngestionRequestIdSchema, SaveIngestionSourceSchema } from "@/modules/ingestions/application/ingestion.validation";
import { ContentDraftConflictError } from "@/modules/content-drafts/application/content-draft-write.error";
import { ContentGenerationProviderError, InvalidGeneratedContentError } from "@/modules/content-generation";
import { IngestionConflictError } from "@/modules/ingestions/application/ingestion-write.error";
import {
  IngestionSourceStateError,
  RequestNotAcceptedForIngestionError,
} from "@/modules/ingestions/application/ingestion-workflow.error";
import {
  MissingTrustedSourceError,
  RomanizationStateError,
} from "@/modules/ingestions/application/ingestion-romanization.error";
import { NotFoundError } from "@/shared/errors/not-found.error";
import { prepareValidatedWrite, type AdminWritePrincipal } from "@/shared/write/validated-write";

export interface IngestionActionState {
  message?: string;
  errors?: Record<string, string[]>;
}

const StartIngestionSchema = z.object({ requestId: IngestionRequestIdSchema }).strict();

export function createIngestionActionHandler(dependencies: {
  authorize: () => Promise<AdminWritePrincipal>;
  workflow: Pick<IngestionWorkflowService, "startAcceptedRequest" | "saveAndConfirmSource">;
  generateRomanization: (ingestionId: string, updatedBy: string) => Promise<unknown>;
  started: (ingestionId: string) => never;
  sourceSaved: (ingestionId: string) => never;
  romanized: (ingestionId: string) => never;
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
        if (error instanceof RequestNotAcceptedForIngestionError || error instanceof NotFoundError) return { message: error.message };
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
        if (error instanceof ContentDraftConflictError || error instanceof IngestionConflictError || error instanceof IngestionSourceStateError || error instanceof NotFoundError) {
          return { message: error.message };
        }
        dependencies.logFailure(error);
        return { message: "Unable to save Burmese source. Please try again." };
      }
      return dependencies.sourceSaved(IngestionIdSchema.parse(prepared.value.ingestionId));
    },

    async generateRomanization(
      ingestionId: string,
      _previous: IngestionActionState,
      _form: FormData,
    ): Promise<IngestionActionState> {
      const prepared = await prepareValidatedWrite({
        parse: () => ({ ingestionId }),
        schema: GenerateRomanizationSchema,
        authorize: dependencies.authorize,
      });
      if (!prepared.ok) return { message: "Invalid ingestion.", errors: prepared.errors };

      try {
        await dependencies.generateRomanization(prepared.value.ingestionId, prepared.principal.userId);
      } catch (error) {
        if (error instanceof RomanizationStateError || error instanceof MissingTrustedSourceError || error instanceof ContentDraftConflictError || error instanceof IngestionConflictError || error instanceof NotFoundError) {
          return { message: error.message };
        }
        if (error instanceof ContentGenerationProviderError || error instanceof InvalidGeneratedContentError) {
          dependencies.logFailure(error);
          return { message: "Romanization failed. You can retry this generation." };
        }
        dependencies.logFailure(error);
        return { message: "Unable to generate romanization. Please try again." };
      }
      return dependencies.romanized(prepared.value.ingestionId);
    },
  };
}

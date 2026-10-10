import { ContentGenerationService } from "@/modules/content-generation";
import { RomanizationReferenceService } from "@/modules/romanization-references/application/romanization-reference.service";
import { romanizationReferenceSource } from "@/modules/songs";
import { createOpenAIContentGenerationAdapter } from "./openai-content-generation.adapter";

/** Shared generation construction for both admin request processing and direct Create Song. */
export function createCatalogueContentGenerationService(): ContentGenerationService {
  return new ContentGenerationService(
    createOpenAIContentGenerationAdapter(),
    new RomanizationReferenceService(romanizationReferenceSource),
  );
}

import {
  ContentGenerationProviderError,
  GeneratedContentQualityError,
  InvalidGeneratedContentError,
} from "@/modules/content-generation";
import { IncompleteAiGenerationError } from "@/modules/ingestions/application/ingestion-generation.error";

/** Safe, actionable admin-facing messages; never expose provider response bodies. */
export function generationFailureMessage(error: unknown): string {
  if (error instanceof ContentGenerationProviderError) {
    if (!error.retryable) return "AI provider rejected generation. Check the model configuration or provider access before retrying.";
    if (error.causeCode === "http_429") return "AI provider rate limit or quota reached. Check your OpenAI quota and retry when available.";
    return "AI provider is temporarily unavailable. Retry generation.";
  }
  if (error instanceof GeneratedContentQualityError) {
    const field = error.issues[0]?.field;
    const label = field === "romanized" ? "Romanization" : field === "meaning" ? "English Meaning" : "Generated content";
    return label + " did not pass quality checks. Review the source lyrics, then retry.";
  }
  if (error instanceof InvalidGeneratedContentError || error instanceof IncompleteAiGenerationError) {
    return "AI returned incomplete or misaligned lyrics. Check the Burmese source lines and retry.";
  }
  return "Unable to generate AI content. Please try again.";
}

import { z } from "zod";
import { generationFailureMessage } from "@/shared/ai-generation-failure-message";

export function directSongGenerationFailureMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return "Please provide valid Burmese lyrics and song details before generating.";
  }
  return generationFailureMessage(error);
}

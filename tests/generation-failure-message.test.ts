import test from "node:test";
import assert from "node:assert/strict";
import { generationFailureMessage } from "@/app/admin/ingestions/generation-failure-message";
import { ContentGenerationProviderError, InvalidGeneratedContentError, GeneratedContentQualityError } from "@/modules/content-generation";
import { IncompleteAiGenerationError } from "@/modules/ingestions/application/ingestion-generation.error";

test("generation failures distinguish retryable, quota and configuration problems safely", () => {
  assert.match(generationFailureMessage(new ContentGenerationProviderError("secret", true, "http_429")), /quota reached/);
  assert.match(generationFailureMessage(new ContentGenerationProviderError("secret", true, "http_500")), /temporarily unavailable/);
  assert.match(generationFailureMessage(new ContentGenerationProviderError("secret", false, "invalid_auth")), /configuration/);
  assert.doesNotMatch(generationFailureMessage(new ContentGenerationProviderError("secret", false)), /secret/);
});

test("generation failures advise source review for incomplete or invalid results", () => {
  const quality = new GeneratedContentQualityError([{ field: "romanized", code: "romanized_sentence_not_capitalized", message: "Bad" } as any]);
  assert.match(generationFailureMessage(quality), /Romanization did not pass/);
  assert.match(generationFailureMessage(new InvalidGeneratedContentError()), /source lines/);
  assert.match(generationFailureMessage(new IncompleteAiGenerationError()), /source lines/);
  assert.match(generationFailureMessage(new Error("secret")), /Unable to generate/);
});

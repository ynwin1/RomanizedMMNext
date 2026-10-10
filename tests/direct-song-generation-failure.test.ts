import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { directSongGenerationFailureMessage } from "@/app/admin/songs/song-generation-error";
import { ContentGenerationProviderError, GeneratedContentQualityError, InvalidGeneratedContentError } from "@/modules/content-generation";

test("direct-song generation failures give actionable messages without leaking provider details", () => {
  assert.match(directSongGenerationFailureMessage(new ContentGenerationProviderError("API key is secret", true, "http_429")), /quota reached/);
  assert.match(directSongGenerationFailureMessage(new ContentGenerationProviderError("connection secret", true, "http_500")), /temporarily unavailable/);
  assert.match(directSongGenerationFailureMessage(new ContentGenerationProviderError("configuration secret", false, "unauthorized")), /configuration/);
  assert.doesNotMatch(directSongGenerationFailureMessage(new Error("Sensitive server credentials")), /credentials/);
});

test("direct-song generation distinguishes invalid inputs from invalid AI output", () => {
  const invalid = z.object({ burmeseLyrics: z.string().min(1) }).safeParse({ burmeseLyrics: "" });
  assert.equal(invalid.success, false);
  if (!invalid.success) assert.match(directSongGenerationFailureMessage(invalid.error), /valid Burmese lyrics/);
  assert.match(directSongGenerationFailureMessage(new InvalidGeneratedContentError()), /incomplete or misaligned/);
  const quality = new GeneratedContentQualityError([{ field: "romanized", code: "romanized_sentence_not_capitalized", message: "bad" } as any]);
  assert.match(directSongGenerationFailureMessage(quality), /Romanization/);
});

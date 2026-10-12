import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ContentGenerationService} from "@/modules/content-generation/application/content-generation.service";
import {FakeContentGenerationProvider} from "./fakes/fake-content-generation.provider";

test("conflicting exact spellings remain visible even when AI already matches the latest spelling", async () => {
  const provider = new FakeContentGenerationProvider({romanized: {lines: [{index: 0, text: "Mingalar par"}]}});
  const service = new ContentGenerationService(provider, {
    findRelevant: async () => [],
    refineGenerated: async (_source, generated) => ({lines: generated, changes: [], ambiguousLines: [0]}),
  });
  const result = await service.romanize({lines: [{index: 0, text: "မင်္ဂလာပါ"}]});
  assert.deepEqual(result.refinements, [{
    index: 0, kind: "conflict", original: "Mingalar par", corrected: "Mingalar par", referenceMmids: [], hasConflict: true,
  }]);
});

test("ingestion and direct song generation both expose refinement review UI", () => {
  const path = (value: string) => readFileSync(value, "utf8");
  assert.match(path("modules/ingestions/application/ingestion-romanization.service.ts"), /refinements: generated\.refinements/);
  assert.match(path("app/admin/ingestions/review-form.tsx"), /RomanizationRefinementReview/);
  assert.match(path("app/admin/ingestions/review-form.tsx"), /onRestore=/);
  assert.match(path("modules/admin/application/admin-song-generation.service.ts"), /refinements: romanized\.refinements/);
  assert.match(path("app/admin/songs/song-form.tsx"), /RomanizationRefinementReview/);
  assert.match(path("modules/ingestions/application/ingestion-review.service.ts"), /refinements: null/);
});

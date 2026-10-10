import test from "node:test";
import assert from "node:assert/strict";
import { ContentGenerationService } from "@/modules/content-generation/application/content-generation.service";
import type { ContentGenerationProvider } from "@/modules/content-generation/application/content-generation.provider";

test("Romanization enriches the provider with seven recent songs and aligned examples", async () => {
  let received: unknown;
  let queries = 0;
  const provider: ContentGenerationProvider = {
    romanize: async input => {
      received = input;
      return { lines: input.lines.map(line => ({ index: line.index, text: line.text ? "Min" : "" })) };
    },
    translateMeaning: async input => ({ lines: input.lines.map(line => ({ index: line.index, text: "Meaning" })) }),
    generateEditorialMetadata: async () => ({ about: "A song.", whenToListen: "At night." }),
  };
  const references = {
    findRelevant: async (lines: string[], options: { recentSongs: number; maxReferences: number }) => {
      queries++;
      assert.deepEqual(lines, ["မင်း", ""]);
      assert.deepEqual(options, { recentSongs: 7, maxReferences: 12 });
      return [{ burmese: "မင်း", romanized: "Min" }];
    },
  };
  const service = new ContentGenerationService(provider, references);
  await service.romanize({ lines: [{ index: 0, text: "မင်း" }, { index: 1, text: "" }] });
  assert.deepEqual(received, {
    lines: [{ index: 0, text: "မင်း" }, { index: 1, text: "" }],
    references: [{ burmese: "မင်း", romanized: "Min" }],
  });
  assert.equal(queries, 1);
  await service.translateMeaning({ lines: [{ index: 0, text: "မင်း" }] });
  assert.equal(queries, 1);
});

test("Romanization works without references and preserves compatibility with existing provider", async () => {
  let received: unknown;
  const service = new ContentGenerationService({
    romanize: async input => { received = input; return { lines: [{ index: 0, text: "Min" }] }; },
    translateMeaning: async () => ({ lines: [] }),
    generateEditorialMetadata: async () => ({ about: "About", whenToListen: "Anytime" }),
  });
  assert.deepEqual(await service.romanize({ lines: [{ index: 0, text: "မင်း" }] }), {
    lines: [{ index: 0, text: "Min" }],
  });
  assert.deepEqual(received, { lines: [{ index: 0, text: "မင်း" }] });
});

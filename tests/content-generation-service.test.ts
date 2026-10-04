import test from "node:test";
import assert from "node:assert/strict";
import { ContentGenerationService } from "@/modules/content-generation";
import { InvalidGeneratedContentError } from "@/modules/content-generation/application/content-generation.error";
import { FakeContentGenerationProvider } from "./fakes/fake-content-generation.provider";

const input = {
  lines: [
    { index: 0, text: "မင်္ဂလာပါ" },
    { index: 1, text: "" },
    { index: 2, text: "ချစ်တယ်" },
  ],
};

test("content generation service validates deterministic provider results", async () => {
  const provider = new FakeContentGenerationProvider();
  const service = new ContentGenerationService(provider);

  const romanized = await service.romanize(input);
  const meaning = await service.translateMeaning(input);
  const editorial = await service.generateEditorialMetadata({
    ...input,
    songName: "Song",
    artistNames: ["Artist"],
  });

  assert.equal(romanized.lines[0]?.index, 0);
  assert.equal(meaning.lines[2]?.index, 2);
  assert.equal(editorial.about, "Deterministic test about text.");
  assert.equal(provider.romanizationCalls, 1);
  assert.equal(provider.meaningCalls, 1);
  assert.equal(provider.editorialCalls, 1);
});

test("generation input requires continuous zero-based lyric indexes before provider access", async () => {
  const provider = new FakeContentGenerationProvider();
  const service = new ContentGenerationService(provider);

  await assert.rejects(() => service.romanize({
    lines: [{ index: 1, text: "line" }],
  }));

  assert.equal(provider.romanizationCalls, 0);
});

test("content generation service rejects provider output outside runtime contract", async () => {
  const provider = new FakeContentGenerationProvider({
    romanized: { lines: [{ index: 0, text: "ok" }, { index: 1, text: "ok" }] },
    editorial: { about: "", whenToListen: "" },
  });
  const service = new ContentGenerationService(provider);

  const structurallyValid = await service.romanize(input);
  assert.equal(structurallyValid.lines.length, 2);

  await assert.rejects(
    () => service.generateEditorialMetadata(input),
    InvalidGeneratedContentError,
  );
});

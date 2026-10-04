import test from "node:test";
import assert from "node:assert/strict";
import {
  ContentGenerationService,
  GeneratedContentQualityError,
} from "@/modules/content-generation";
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
    romanizedLines: romanized.lines,
    meaningLines: meaning.lines,
  });

  assert.equal(romanized.lines[0]?.index, 0);
  assert.equal(romanized.lines[1]?.text, "");
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

test("editorial context also validates continuous generated-line indexes", async () => {
  const provider = new FakeContentGenerationProvider();
  const service = new ContentGenerationService(provider);

  await assert.rejects(() => service.generateEditorialMetadata({
    ...input,
    meaningLines: [{ index: 2, text: "bad" }],
  }));

  assert.equal(provider.editorialCalls, 0);
});

test("content generation rejects line count, index, and blank-line alignment violations", async () => {
  const countMismatch = new ContentGenerationService(new FakeContentGenerationProvider({
    romanized: { lines: [{ index: 0, text: "Okay" }] },
  }));
  await assert.rejects(() => countMismatch.romanize(input), InvalidGeneratedContentError);

  const indexMismatch = new ContentGenerationService(new FakeContentGenerationProvider({
    romanized: {
      lines: [
        { index: 0, text: "Okay" },
        { index: 2, text: "" },
        { index: 1, text: "Okay" },
      ],
    },
  }));
  await assert.rejects(() => indexMismatch.romanize(input), InvalidGeneratedContentError);

  const blankMismatch = new ContentGenerationService(new FakeContentGenerationProvider({
    meaning: {
      lines: [
        { index: 0, text: "Okay" },
        { index: 1, text: "Invented" },
        { index: 2, text: "Okay" },
      ],
    },
  }));
  await assert.rejects(() => blankMismatch.translateMeaning(input), InvalidGeneratedContentError);
});

test("content generation rejects output that fails RomanizedMM quality rules", async () => {
  const lowercase = new ContentGenerationService(new FakeContentGenerationProvider({
    romanized: {
      lines: [
        { index: 0, text: "lowercase start." },
        { index: 1, text: "" },
        { index: 2, text: "Valid start." },
      ],
    },
  }));

  await assert.rejects(
    () => lowercase.romanize(input),
    GeneratedContentQualityError,
  );

  const scriptLeak = new ContentGenerationService(new FakeContentGenerationProvider({
    meaning: {
      lines: [
        { index: 0, text: "English မြန်မာ." },
        { index: 1, text: "" },
        { index: 2, text: "Valid." },
      ],
    },
  }));

  await assert.rejects(
    () => scriptLeak.translateMeaning(input),
    GeneratedContentQualityError,
  );
});

test("content generation service rejects invalid or multiline editorial output", async () => {
  const empty = new ContentGenerationService(new FakeContentGenerationProvider({
    editorial: { about: "", whenToListen: "" },
  }));
  await assert.rejects(() => empty.generateEditorialMetadata(input), InvalidGeneratedContentError);

  const multiline = new ContentGenerationService(new FakeContentGenerationProvider({
    editorial: { about: "Line one\nLine two", whenToListen: "One line" },
  }));
  await assert.rejects(() => multiline.generateEditorialMetadata(input), InvalidGeneratedContentError);
});

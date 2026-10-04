import test from "node:test";
import assert from "node:assert/strict";
import { IngestionGenerationService } from "@/modules/ingestions/application/ingestion-generation.service";
import { AiGenerationStateError } from "@/modules/ingestions/application/ingestion-generation.error";
import type { IngestionRecord } from "@/modules/ingestions/domain/ingestion.types";
import type { ContentDraftRecord } from "@/modules/content-drafts/domain/content-draft.types";
import {
  ContentGenerationProviderError,
  GeneratedContentQualityError,
} from "@/modules/content-generation";

const ingestionId = "507f1f77bcf86cd799439011";
const draftId = "507f191e810c19729de860ea";

function ingestion(overrides: Partial<IngestionRecord> = {}): IngestionRecord {
  return {
    id: ingestionId,
    songRequestId: "507f191e810c19729de860eb",
    status: "ready_to_generate",
    revision: 3,
    ...overrides,
  };
}

function draft(overrides: Partial<ContentDraftRecord> = {}): ContentDraftRecord {
  return {
    id: draftId,
    ingestionId,
    identity: { songName: "Song" },
    source: { burmeseLyrics: "တစ်\n\nနှစ်" },
    generated: { romanized: "R0\n\nR2" },
    metadata: {},
    artists: [{ kind: "unresolved", name: "Artist" }],
    revision: 5,
    ...overrides,
  };
}

test("AI generation reuses existing romanization without spending a review call", async () => {
  let current = ingestion();
  let currentDraft = draft({
    generated: {
      romanized: "R0\n\nR2",
      meaning: "M0\n\nM2",
    },
  });
  const transitions: string[] = [];
  let meaningCalls = 0;
  let reviewCalls = 0;
  let editorialInput: any;

  const service = new IngestionGenerationService(
    {
      getById: async () => current,
      transition: async (_id: unknown, _revision: unknown, next: unknown) => {
        transitions.push(String(next));
        current = ingestion({ status: next as any, revision: current.revision + 1 });
        return current;
      },
    } as any,
    {
      getByIngestionId: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        currentDraft = draft({
          generated: { ...currentDraft.generated, ...patch.generated },
          revision: currentDraft.revision + 1,
        });
        return currentDraft;
      },
    } as any,
    {
      romanize: async () => { throw new Error("should not romanize"); },
      reviewRomanization: async () => { reviewCalls++; throw new Error("should not review"); },
      translateMeaning: async (input: any) => {
        meaningCalls++;
        return {
          lines: input.lines.map((line: any) => ({
            index: line.index,
            text: line.text === "" ? "" : "M" + line.index,
          })),
        };
      },
      generateEditorialMetadata: async (input: any) => {
        editorialInput = input;
        return { about: "About song", whenToListen: "Late at night" };
      },
    },
    {
      findRelevantReferences: async () => [{
        burmese: "တစ်",
        romanized: "Approved",
        sourceSongMmid: 25,
        sourceSongName: "Recent",
        match: "exact",
        score: 1,
      }],
    },
  );

  const result = await service.generateAll(ingestionId, "admin-1");

  assert.equal(meaningCalls, 0);
  assert.equal(reviewCalls, 0);
  assert.deepEqual(transitions, ["generating", "ready_for_review"]);
  assert.equal(editorialInput.romanizedLines[0].text, "R0");
  assert.equal(result.ingestion.status, "ready_for_review");
});

test("new romanization uses recent references and is corrected after meaning generation", async () => {
  let current = ingestion();
  let currentDraft = draft({ generated: {} });
  const transitions: string[] = [];
  let firstPassInput: any;
  let reviewInput: any;
  let referenceCalls = 0;

  const reference = {
    burmese: "တစ်",
    romanized: "Approved One",
    meaning: "One",
    sourceSongMmid: 25,
    sourceSongName: "Recent Song",
    match: "exact" as const,
    score: 1,
  };

  const service = new IngestionGenerationService(
    {
      getById: async () => current,
      transition: async (_id: unknown, _revision: unknown, next: unknown) => {
        transitions.push(String(next));
        current = ingestion({ status: next as any, revision: current.revision + 1 });
        return current;
      },
    } as any,
    {
      getByIngestionId: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        currentDraft = draft({
          generated: { ...currentDraft.generated, ...patch.generated },
          revision: currentDraft.revision + 1,
        });
        return currentDraft;
      },
    } as any,
    {
      romanize: async (input: any) => {
        firstPassInput = input;
        return {
          lines: input.lines.map((line: any) => ({
            index: line.index,
            text: line.text === "" ? "" : "Initial " + line.index + ".",
          })),
        };
      },
      reviewRomanization: async (input: any) => {
        reviewInput = input;
        return {
          lines: input.lines.map((line: any) => ({
            index: line.index,
            text: line.text === "" ? "" : "Reviewed " + line.index + ".",
          })),
        };
      },
      translateMeaning: async (input: any) => ({
        lines: input.lines.map((line: any) => ({
          index: line.index,
          text: line.text === "" ? "" : "Meaning " + line.index + ".",
        })),
      }),
      generateEditorialMetadata: async () => ({ about: "About.", whenToListen: "When." }),
    },
    {
      findRelevantReferences: async () => {
        referenceCalls++;
        return [reference];
      },
    },
  );

  const result = await service.generateAll(ingestionId);

  assert.equal(referenceCalls, 1);
  assert.deepEqual(firstPassInput.references, [reference]);
  assert.equal(reviewInput.romanizedLines[0].text, "Initial 0.");
  assert.equal(reviewInput.meaningLines[0].text, "Meaning 0.");
  assert.deepEqual(reviewInput.references, [reference]);
  assert.deepEqual(transitions, [
    "generating",
    "ready_to_generate",
    "generating",
    "ready_for_review",
  ]);
  assert.equal(result.draft.generated.romanized, "Reviewed 0.\n\nReviewed 2.");
  assert.equal(result.draft.generated.meaning, "Meaning 0.\n\nMeaning 2.");
});

test("retry reuses corrected romanization and completed meaning to reduce provider usage", async () => {
  let current = ingestion({ status: "failed", revision: 8 });
  let currentDraft = draft({
    generated: {
      romanized: "Reviewed 0.\n\nReviewed 2.",
      meaning: "Meaning 0.\n\nMeaning 2.",
    },
  });
  let meaningCalls = 0;
  let reviewCalls = 0;

  const service = new IngestionGenerationService(
    {
      getById: async () => current,
      transition: async (_id: unknown, _revision: unknown, next: unknown) => {
        current = ingestion({ status: next as any, revision: current.revision + 1 });
        return current;
      },
    } as any,
    {
      getByIngestionId: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        currentDraft = draft({
          generated: { ...currentDraft.generated, ...patch.generated },
          revision: currentDraft.revision + 1,
        });
        return currentDraft;
      },
    } as any,
    {
      romanize: async () => { throw new Error("unused"); },
      reviewRomanization: async () => { reviewCalls++; throw new Error("should reuse"); },
      translateMeaning: async () => { meaningCalls++; throw new Error("should reuse"); },
      generateEditorialMetadata: async () => ({ about: "About.", whenToListen: "When." }),
    },
  );

  await service.generateAll(ingestionId);
  assert.equal(meaningCalls, 0);
  assert.equal(reviewCalls, 0);
  assert.equal(currentDraft.generated.about, "About.");
});

test("reused stored AI content must still pass quality checks", async () => {
  let current = ingestion({ status: "failed", revision: 8 });
  const badDraft = draft({
    generated: {
      romanized: "lowercase romanization.",
      meaning: "Valid meaning.",
      about: "About",
      whenToListen: "When",
    },
  });
  const transitions: string[] = [];

  const service = new IngestionGenerationService(
    {
      getById: async () => current,
      transition: async (_id: unknown, _revision: unknown, next: unknown) => {
        transitions.push(String(next));
        current = ingestion({ status: next as any, revision: current.revision + 1 });
        return current;
      },
    } as any,
    {
      getByIngestionId: async () => badDraft,
      update: async () => { throw new Error("should not write"); },
    } as any,
    {
      romanize: async () => { throw new Error("should not regenerate"); },
      reviewRomanization: async () => { throw new Error("should not review"); },
      translateMeaning: async () => { throw new Error("should not regenerate"); },
      generateEditorialMetadata: async () => { throw new Error("should not regenerate"); },
    },
  );

  await assert.rejects(() => service.generateAll(ingestionId), GeneratedContentQualityError);
  assert.deepEqual(transitions, ["generating", "failed"]);
});

test("remaining AI provider failure marks ingestion failed", async () => {
  let current = ingestion();
  const transitions: string[] = [];
  const service = new IngestionGenerationService(
    {
      getById: async () => current,
      transition: async (_id: unknown, _revision: unknown, next: unknown) => {
        transitions.push(String(next));
        current = ingestion({ status: next as any, revision: current.revision + 1 });
        return current;
      },
    } as any,
    {
      getByIngestionId: async () => draft({
        generated: {
          romanized: "R0\n\nR2",
          meaning: "Meaning 0.\n\nMeaning 2.",
        },
      }),
      update: async () => draft(),
    } as any,
    {
      romanize: async () => { throw new Error("unused"); },
      reviewRomanization: async () => { throw new Error("unused"); },
      translateMeaning: async () => { throw new Error("unused"); },
      generateEditorialMetadata: async () => {
        throw new ContentGenerationProviderError("provider down", true, "http_500");
      },
    },
  );

  await assert.rejects(() => service.generateAll(ingestionId), ContentGenerationProviderError);
  assert.deepEqual(transitions, ["generating", "failed"]);
});

test("AI generation rejects states outside ready_to_generate/failed", async () => {
  const service = new IngestionGenerationService(
    { getById: async () => ingestion({ status: "ready_for_review" }) } as any,
    {} as any,
    {} as any,
  );
  await assert.rejects(() => service.generateAll(ingestionId), AiGenerationStateError);
});

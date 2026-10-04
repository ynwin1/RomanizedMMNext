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

test("AI generation reuses romanization, generates meaning/editorial, and advances to needs_admin_input", async () => {
  let current = ingestion();
  let currentDraft = draft();
  const transitions: string[] = [];
  let romanizeCalls = 0;
  let meaningCalls = 0;
  let editorialCalls = 0;
  let editorialInput: any;
  let patchSeen: any;

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
        patchSeen = patch;
        currentDraft = draft({
          generated: { ...currentDraft.generated, ...patch.generated },
          revision: currentDraft.revision + 1,
        });
        return currentDraft;
      },
    } as any,
    {
      romanize: async () => { romanizeCalls++; throw new Error("should not romanize"); },
      translateMeaning: async input => {
        meaningCalls++;
        return {
          lines: input.lines.map(line => ({ index: line.index, text: line.text === "" ? "" : "M" + line.index })),
        };
      },
      generateEditorialMetadata: async input => {
        editorialCalls++;
        editorialInput = input;
        return { about: "About song", whenToListen: "Late at night" };
      },
    },
  );

  const result = await service.generateAll(ingestionId, "admin-1");

  assert.equal(romanizeCalls, 0);
  assert.equal(meaningCalls, 1);
  assert.equal(editorialCalls, 1);
  assert.deepEqual(transitions, ["generating", "needs_admin_input"]);
  assert.deepEqual(patchSeen, {
    generated: {
      meaning: "M0\n\nM2",
      about: "About song",
      whenToListen: "Late at night",
    },
  });
  assert.equal(editorialInput.songName, "Song");
  assert.deepEqual(editorialInput.artistNames, ["Artist"]);
  assert.equal(editorialInput.romanizedLines[0].text, "R0");
  assert.equal(editorialInput.meaningLines[2].text, "M2");
  assert.equal(result.ingestion.status, "needs_admin_input");
});

test("AI generation creates missing romanization before remaining content without admin intervention", async () => {
  let current = ingestion();
  let currentDraft = draft({ generated: {} });
  const transitions: string[] = [];
  let romanizeCalls = 0;

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
      romanize: async input => {
        romanizeCalls++;
        return { lines: input.lines.map(line => ({ index: line.index, text: line.text === "" ? "" : "R" + line.index })) };
      },
      translateMeaning: async input => ({
        lines: input.lines.map(line => ({ index: line.index, text: line.text === "" ? "" : "M" + line.index })),
      }),
      generateEditorialMetadata: async () => ({ about: "About", whenToListen: "When" }),
    },
  );

  const result = await service.generateAll(ingestionId);
  assert.equal(romanizeCalls, 1);
  assert.deepEqual(transitions, [
    "generating",
    "ready_to_generate",
    "generating",
    "needs_admin_input",
  ]);
  assert.equal(result.draft.generated.romanized, "R0\n\nR2");
  assert.equal(result.draft.generated.meaning, "M0\n\nM2");
});

test("AI generation reuses completed meaning on retry to reduce provider usage", async () => {
  let current = ingestion({ status: "failed", revision: 8 });
  let currentDraft = draft({ generated: { romanized: "R0\n\nR2", meaning: "M0\n\nM2" } });
  let meaningCalls = 0;

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
      translateMeaning: async () => { meaningCalls++; throw new Error("should reuse"); },
      generateEditorialMetadata: async () => ({ about: "About", whenToListen: "When" }),
    },
  );

  await service.generateAll(ingestionId);
  assert.equal(meaningCalls, 0);
  assert.equal(currentDraft.generated.about, "About");
});

test("reused stored AI content must pass quality checks before needs_admin_input", async () => {
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
      translateMeaning: async () => { throw new Error("should not regenerate"); },
      generateEditorialMetadata: async () => { throw new Error("should not regenerate"); },
    },
  );

  await assert.rejects(() => service.generateAll(ingestionId), GeneratedContentQualityError);
  assert.deepEqual(transitions, ["generating", "failed"]);
});

test("remaining AI provider failure marks ingestion failed and does not write incomplete meaning/editorial", async () => {
  let current = ingestion();
  let writes = 0;
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
      getByIngestionId: async () => draft(),
      update: async () => { writes++; return draft(); },
    } as any,
    {
      romanize: async () => { throw new Error("unused"); },
      translateMeaning: async input => ({
        lines: input.lines.map(line => ({ index: line.index, text: line.text === "" ? "" : "M" + line.index })),
      }),
      generateEditorialMetadata: async () => {
        throw new ContentGenerationProviderError("provider down", true, "http_500");
      },
    },
  );

  await assert.rejects(() => service.generateAll(ingestionId), ContentGenerationProviderError);
  assert.deepEqual(transitions, ["generating", "failed"]);
  assert.equal(writes, 0);
});

test("AI generation rejects states outside ready_to_generate/failed", async () => {
  const service = new IngestionGenerationService(
    { getById: async () => ingestion({ status: "needs_admin_input" }) } as any,
    {} as any,
    {} as any,
  );
  await assert.rejects(() => service.generateAll(ingestionId), AiGenerationStateError);
});

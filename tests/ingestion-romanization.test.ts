import test from "node:test";
import assert from "node:assert/strict";
import { IngestionRomanizationService } from "@/modules/ingestions/application/ingestion-romanization.service";
import { MissingTrustedSourceError, RomanizationStateError } from "@/modules/ingestions/application/ingestion-romanization.error";
import type { IngestionRecord } from "@/modules/ingestions/domain/ingestion.types";
import type { ContentDraftRecord } from "@/modules/content-drafts/domain/content-draft.types";
import { InvalidGeneratedContentError } from "@/modules/content-generation";

const ingestionId = "507f1f77bcf86cd799439011";
const draftId = "507f191e810c19729de860ea";

function ingestion(overrides: Partial<IngestionRecord> = {}): IngestionRecord {
  return { id: ingestionId, songRequestId: "507f191e810c19729de860eb", status: "ready_to_generate", revision: 2, ...overrides };
}
function draft(overrides: Partial<ContentDraftRecord> = {}): ContentDraftRecord {
  return {
    id: draftId,
    ingestionId,
    identity: { songName: "Song" },
    source: { burmeseLyrics: "တစ်\n\nနှစ်" },
    generated: { meaning: "existing meaning", about: "existing about" },
    metadata: { genre: "Pop" },
    artists: [{ kind: "unresolved", name: "Artist" }],
    revision: 4,
    ...overrides,
  };
}

test("romanization workflow preserves line structure and patches only generated.romanized", async () => {
  let current = ingestion();
  let currentDraft = draft();
  const transitions: string[] = [];
  let patchSeen: unknown;

  const service = new IngestionRomanizationService(
    {
      getById: async () => current,
      transition: async (_id: unknown, _revision: unknown, next: unknown) => {
        transitions.push(String(next));
        current = ingestion({
          status: next === "generating" ? "generating" : "ready_to_generate",
          revision: current.revision + 1,
        });
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
      romanize: async input => ({
        lines: input.lines.map(line => ({
          index: line.index,
          text: line.text === "" ? "" : "R" + line.index,
        })),
      }),
    },
  );

  const result = await service.generate(ingestionId, "admin-1");
  assert.deepEqual(transitions, ["generating", "ready_to_generate"]);
  assert.deepEqual(patchSeen, { generated: { romanized: "R0\n\nR2" } });
  assert.equal(result.draft.generated.meaning, "existing meaning");
  assert.equal(result.draft.generated.about, "existing about");
  assert.equal(result.draft.metadata.genre, "Pop");
});

test("romanization workflow rejects invalid states and missing trusted source", async () => {
  const wrongState = new IngestionRomanizationService(
    { getById: async () => ingestion({ status: "awaiting_source" }) } as any,
    {} as any,
    {} as any,
  );
  await assert.rejects(() => wrongState.generate(ingestionId), RomanizationStateError);

  const missingSource = new IngestionRomanizationService(
    { getById: async () => ingestion() } as any,
    { getByIngestionId: async () => draft({ source: {} }) } as any,
    {} as any,
  );
  await assert.rejects(() => missingSource.generate(ingestionId), MissingTrustedSourceError);
});

test("romanization failure leaves draft untouched and marks ingestion failed", async () => {
  let current = ingestion();
  let writes = 0;
  const transitions: string[] = [];
  const service = new IngestionRomanizationService(
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
      romanize: async () => { throw new InvalidGeneratedContentError("bad alignment"); },
    },
  );

  await assert.rejects(() => service.generate(ingestionId), InvalidGeneratedContentError);
  assert.deepEqual(transitions, ["generating", "failed"]);
  assert.equal(writes, 0);
});

test("romanization can retry from failed using the same ingestion", async () => {
  let current = ingestion({ status: "failed", revision: 7 });
  const transitions: string[] = [];
  const service = new IngestionRomanizationService(
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
      update: async () => draft({ generated: { romanized: "R0\n\nR2" }, revision: 5 }),
    } as any,
    {
      romanize: async input => ({
        lines: input.lines.map(line => ({ index: line.index, text: line.text === "" ? "" : "R" + line.index })),
      }),
    },
  );

  await service.generate(ingestionId);
  assert.deepEqual(transitions, ["generating", "ready_to_generate"]);
});

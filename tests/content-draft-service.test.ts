import test from "node:test";
import assert from "node:assert/strict";
import { ContentDraftService } from "@/modules/content-drafts/application/content-draft.service";
import type { IContentDraftRepository } from "@/modules/content-drafts/application/content-draft.repository";
import type { ContentDraftRecord } from "@/modules/content-drafts/domain/content-draft.types";
import { ContentDraftConflictError } from "@/modules/content-drafts/application/content-draft-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";

const id = "507f1f77bcf86cd799439011";
const ingestionId = "507f191e810c19729de860ea";

function record(overrides: Partial<ContentDraftRecord> = {}): ContentDraftRecord {
  return {
    id,
    ingestionId,
    identity: {},
    source: {},
    generated: {},
    metadata: {},
    artists: [],
    revision: 0,
    ...overrides,
  };
}

function repository(overrides: Partial<IContentDraftRepository> = {}): IContentDraftRepository {
  return {
    create: async (input, updatedBy) => ({ ...record(), ingestionId: input.ingestionId, updatedBy }),
    findById: async () => record(),
    findByIngestionId: async () => record(),
    update: async (_id, _revision, patch, updatedBy) => {
      const metadata = { ...record().metadata } as Record<string, unknown>;
      for (const [key, value] of Object.entries(patch.metadata ?? {})) {
        if (value === null) delete metadata[key];
        else metadata[key] = value;
      }
      return {
        ...record(),
        identity: { ...record().identity, ...patch.identity },
        source: { ...record().source, ...patch.source },
        generated: { ...record().generated, ...patch.generated },
        metadata,
        artists: patch.artists ?? [],
        updatedBy,
      } as any;
    },
    ...overrides,
  };
}

test("draft creation validates ingestion id and starts empty", async () => {
  let calls = 0;
  const service = new ContentDraftService(repository({
    create: async (input, updatedBy) => {
      calls++;
      assert.equal(input.ingestionId, ingestionId);
      assert.equal(updatedBy, "admin-1");
      return { ...record(), updatedBy };
    },
  }));

  await assert.rejects(() => service.createForIngestion("bad", "admin-1"));
  assert.equal(calls, 0);
  const created = await service.createForIngestion(ingestionId, "admin-1");
  assert.deepEqual(created.generated, {});
  assert.deepEqual(created.artists, []);
  assert.equal(calls, 1);
});

test("draft patch validates nested ownership-safe sections before persistence", async () => {
  let patchSeen: unknown;
  const service = new ContentDraftService(repository({
    update: async (_id, _revision, patch) => {
      patchSeen = patch;
      return { ...record(), generated: { romanized: patch.generated?.romanized } };
    },
  }));

  await assert.rejects(() => service.update(id, 0, {}));
  await assert.rejects(() => service.update(id, 0, { generated: {} }));
  await assert.rejects(() => service.update(id, 0, { generated: { romanized: "" } }));

  const updated = await service.update(id, 0, { generated: { romanized: "Min ko chit tal" } });
  assert.equal(updated.generated.romanized, "Min ko chit tal");
  assert.deepEqual(patchSeen, { generated: { romanized: "Min ko chit tal" } });
});

test("draft artist references distinguish resolved from unresolved artists", async () => {
  const service = new ContentDraftService(repository());
  await service.update(id, 0, {
    artists: [
      {
        kind: "resolved",
        artistId: "507f191e810c19729de860eb",
        name: "Existing Artist",
        slug: "existing-artist",
      },
      { kind: "unresolved", name: "Future Artist" },
    ],
  });

  await assert.rejects(() => service.update(id, 0, {
    artists: [{ kind: "resolved", artistId: "bad", name: "Artist", slug: "artist" }],
  }));
});

test("draft service distinguishes missing draft from stale revision", async () => {
  const missing = new ContentDraftService(repository({
    update: async () => null,
    findById: async () => null,
  }));
  await assert.rejects(() => missing.update(id, 0, { identity: { songName: "Song" } }), NotFoundError);

  const stale = new ContentDraftService(repository({ update: async () => null }));
  await assert.rejects(
    () => stale.update(id, 0, { identity: { songName: "Song" } }),
    ContentDraftConflictError,
  );
});

test("draft reads validate identifiers and return not found", async () => {
  let calls = 0;
  const service = new ContentDraftService(repository({
    findById: async () => { calls++; return null; },
    findByIngestionId: async () => { calls++; return null; },
  }));

  await assert.rejects(() => service.getById("bad"));
  await assert.rejects(() => service.getByIngestionId("bad"));
  assert.equal(calls, 0);

  await assert.rejects(() => service.getById(id), NotFoundError);
  await assert.rejects(() => service.getByIngestionId(ingestionId), NotFoundError);
  assert.equal(calls, 2);
});

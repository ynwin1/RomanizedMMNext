import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { prepareValidatedWrite, zodFieldErrors } from "@/shared/write/validated-write";
import { SongRequestService } from "@/modules/requests/application/song-request.service";
import type { ISongRequestRepository } from "@/modules/requests/application/song-request.repository";

test("validated write pipeline parses, validates, authorizes, and returns typed normalized input in order", async () => {
  const calls: string[] = [];
  const schema = z.object({ id: z.coerce.number().int().positive(), name: z.string().trim().min(1) }).strict();

  const result = await prepareValidatedWrite({
    parse: () => { calls.push("parse"); return { id: "17", name: "  Song  " }; },
    schema,
    authorize: async () => { calls.push("authorize"); return { userId: "admin-1" }; },
  });

  assert.deepEqual(calls, ["parse", "authorize"]);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value, { id: 17, name: "Song" });
    assert.deepEqual(result.principal, { userId: "admin-1" });
  }
});

test("validated write pipeline does not authorize or reach a write when validation fails", async () => {
  const calls: string[] = [];
  const result = await prepareValidatedWrite({
    parse: () => { calls.push("parse"); return { name: "" }; },
    schema: z.object({ name: z.string().min(1) }),
    authorize: async () => { calls.push("authorize"); },
  });

  assert.deepEqual(calls, ["parse"]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.name.length > 0);
});

test("validated write pipeline preserves authorization failures instead of converting them to form errors", async () => {
  const denied = new Error("auth redirect");
  await assert.rejects(
    () => prepareValidatedWrite({
      parse: () => ({ name: "Song" }),
      schema: z.object({ name: z.string().min(1) }),
      authorize: async () => { throw denied; },
    }),
    error => error === denied,
  );
});

test("shared Zod error shaping groups nested issues by top-level field", () => {
  const schema = z.object({
    artistName: z.array(z.object({ slug: z.string().min(1) })),
    songName: z.string().min(1),
  });
  const parsed = schema.safeParse({ artistName: [{ slug: "" }], songName: "" });
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    const fields = zodFieldErrors(parsed.error);
    assert.equal(fields.artistName.length, 1);
    assert.equal(fields.songName.length, 1);
  }
});

test("SongRequestService validates create input before repository access", async () => {
  let creates = 0;
  const repository: ISongRequestRepository = {
    create: async input => { creates += 1; return { id: "r1", ...input, status: "pending" }; },
    listQueue: async () => [],
    listAdmin: async () => ({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    countAdmin: async () => 0,
    findAdminDetail: async () => null,
    updateStatus: async () => null,
    findById: async () => null,
  };
  const service = new SongRequestService(repository);

  await assert.rejects(() => service.create({ artist: "Artist" }));
  await assert.rejects(() => service.create({ songName: "Song", artist: "Artist", injected: true }));
  assert.equal(creates, 0);

  const created = await service.create({ songName: "Song", artist: "Artist", notifyEmail: "" });
  assert.equal(creates, 1);
  assert.equal(created.notifyEmail, undefined);
});

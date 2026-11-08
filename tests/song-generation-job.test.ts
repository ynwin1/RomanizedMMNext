import mongoose from "mongoose";
import test from "node:test";
import assert from "node:assert/strict";
import { executeGenerationJob, normalizeGenerationJobInput, type GenerationJob, type GenerationJobStore, type GenerationResult } from "@/infrastructure/jobs/song-generation";
import { AdminSongGenerationInputSchema } from "@/modules/admin/application/admin-song-generation.service";

const generated = { romanized: "saved" } as GenerationResult;
function fixture() {
  const job: GenerationJob = {
    _id: "job", owner: "admin", status: "queued", input: { burmeseLyrics: "စာသား" },
  };
  const store: GenerationJobStore = {
    async claim(id, owner) {
      if (job._id !== id || job.owner !== owner || job.status !== "queued") return null;
      job.status = "running";
      return job;
    },
    async complete(_id, _owner, result) { job.generated = result; job.status = "completed"; },
    async fail(_id, _owner, message) { job.message = message; job.status = "failed"; },
  };
  return { job, store };
}

test("duplicate workers generate once and persist the result for later reads", async () => {
  const { job, store } = fixture();
  let calls = 0;
  let finish!: () => void;
  const waiting = new Promise<void>(resolve => { finish = resolve; });
  const generate = async () => { calls++; await waiting; return generated; };
  const first = executeGenerationJob("job", "admin", store, generate);
  await executeGenerationJob("job", "admin", store, generate);
  assert.equal(calls, 1);
  finish();
  await first;
  assert.equal(job.status, "completed");
  assert.deepEqual(job.generated, generated);
  await executeGenerationJob("job", "admin", store, generate);
  assert.equal(calls, 1);
});

test("another admin cannot claim the job", async () => {
  const { job, store } = fixture();
  await executeGenerationJob("job", "other-admin", store, async () => {
    assert.fail("must not generate");
  });
  assert.equal(job.status, "queued");
});

test("generation failures are saved and do not trigger an automatic paid retry", async () => {
  const { job, store } = fixture();
  let calls = 0;
  const generate = async () => { calls++; throw new Error("provider unavailable"); };
  await executeGenerationJob("job", "admin", store, generate);
  await executeGenerationJob("job", "admin", store, generate);
  assert.equal(job.status, "failed");
  assert.ok(job.message);
  assert.equal(calls, 1);
});

test("job input uses the existing strict generation validation", () => {
  assert.equal(AdminSongGenerationInputSchema.safeParse({ burmeseLyrics: " " }).success, false);
  assert.equal(AdminSongGenerationInputSchema.safeParse({ burmeseLyrics: "စာသား", requestId: "trace" }).success, false);
  assert.equal(AdminSongGenerationInputSchema.safeParse({ burmeseLyrics: "စာသား" }).success, true);
});


test("worker accepts optional fields persisted as BSON null and completes generation", async () => {
  const { job, store } = fixture();
  const { BSON } = mongoose.mongo;
  job.input = BSON.deserialize(BSON.serialize({
    burmeseLyrics: "စာသား",
    songName: undefined,
    artistNames: undefined,
  }, { ignoreUndefined: false })) as typeof job.input;
  assert.equal(job.input.songName, null);
  assert.equal(job.input.artistNames, null);
  let calls = 0;
  await executeGenerationJob("job", "admin", store, async input => {
    calls++;
    assert.deepEqual(input, { burmeseLyrics: "စာသား" });
    AdminSongGenerationInputSchema.parse(input);
    return generated;
  });
  assert.equal(calls, 1);
  assert.equal(job.status, "completed");
  assert.deepEqual(job.generated, generated);
});

test("new job inputs omit absent fields and preserve supplied identity through BSON", () => {
  const { BSON } = mongoose.mongo;
  const absent = normalizeGenerationJobInput({
    burmeseLyrics: "စာသား", songName: undefined, artistNames: undefined,
  });
  assert.deepEqual(
    BSON.deserialize(BSON.serialize(absent, { ignoreUndefined: false })),
    { burmeseLyrics: "စာသား" },
  );
  const named = { burmeseLyrics: "စာသား", songName: "Purple", artistNames: ["pGb", "Wink"] };
  assert.deepEqual(normalizeGenerationJobInput(
    BSON.deserialize(BSON.serialize(named)) as typeof named,
  ), named);
});

test("stored input normalization still rejects missing or null source lyrics", () => {
  assert.throws(() => normalizeGenerationJobInput({ burmeseLyrics: null } as any));
  assert.throws(() => normalizeGenerationJobInput({ burmeseLyrics: "" }));
});

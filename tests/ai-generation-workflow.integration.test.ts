import test from "node:test";
import assert from "node:assert/strict";
import { AdminSongGenerationService } from "@/modules/admin/application/admin-song-generation.service";
import { ContentGenerationService } from "@/modules/content-generation/application/content-generation.service";
import { IngestionGenerationService } from "@/modules/ingestions/application/ingestion-generation.service";
import type { ContentGenerationProvider } from "@/modules/content-generation/application/content-generation.provider";
import type { IngestionRecord } from "@/modules/ingestions/domain/ingestion.types";
import type { ContentDraftRecord } from "@/modules/content-drafts/domain/content-draft.types";

/** Both real application workflows use the same reference-aware service contract. */
test("direct admin creation and request ingestion share seven-song reference-aware generation", async () => {
  const source = "မင်း\n\nငါ";
  const seen: string[] = [];
  let referenceQueries = 0;
  let romanizeCalls = 0;
  let meaningCalls = 0;
  let editorialCalls = 0;
  const provider: ContentGenerationProvider = {
    romanize: async input => {
      romanizeCalls++;
      assert.deepEqual(input.references, [{ burmese: "မင်း", romanized: "Min" }]);
      seen.push("romanize");
      return { lines: input.lines.map(line => ({ index: line.index, text: line.text ? "R" + line.index : "" })) };
    },
    translateMeaning: async input => {
      meaningCalls++;
      assert.equal(input.references, undefined);
      seen.push("meaning");
      return { lines: input.lines.map(line => ({ index: line.index, text: line.text ? "M" + line.index : "" })) };
    },
    generateEditorialMetadata: async input => {
      editorialCalls++;
      assert.equal(input.romanizedLines?.length, 3);
      assert.equal(input.meaningLines?.length, 3);
      seen.push("editorial");
      return { about: "A reflective song.", whenToListen: "Late at night." };
    },
  };
  const generation = new ContentGenerationService(provider, {
    findRelevant: async (lines, options) => {
      referenceQueries++;
      assert.deepEqual(lines, ["မင်း", "", "ငါ"]);
      assert.deepEqual(options, { recentSongs: 7, maxReferences: 12 });
      return [{ burmese: "မင်း", romanized: "Min" }];
    },
  });

  const direct = await new AdminSongGenerationService(generation).generate({
    burmeseLyrics: source, songName: "Direct song", artistNames: ["Singer"],
  });
  assert.equal(direct.lyricsV2.entries.length, 3);
  assert.deepEqual(direct.lyricsV2.entries[1], { kind: "break" });
  assert.equal(direct.about, "A reflective song.");

  const ingestionId = "507f1f77bcf86cd799439011";
  const draftId = "507f191e810c19729de860ea";
  let current: IngestionRecord = {
    id: ingestionId, songRequestId: "507f191e810c19729de860eb",
    status: "ready_to_generate", revision: 0,
  };
  let currentDraft: ContentDraftRecord = {
    id: draftId, ingestionId,
    identity: { songName: "Request song" },
    source: { burmeseLyrics: source }, generated: {}, metadata: {},
    artists: [{ kind: "unresolved", name: "Singer" }], revision: 0,
  };
  const states: string[] = [];
  const request = new IngestionGenerationService(
    {
      getById: async () => current,
      transition: async (_id: unknown, _revision: unknown, status: unknown) => {
        current = { ...current, status: status as IngestionRecord["status"], revision: current.revision + 1 };
        states.push(String(status));
        return current;
      },
    } as any,
    {
      getByIngestionId: async () => currentDraft,
      update: async (_id: unknown, _revision: unknown, patch: any) => {
        currentDraft = {
          ...currentDraft, generated: { ...currentDraft.generated, ...patch.generated },
          revision: currentDraft.revision + 1,
        };
        return currentDraft;
      },
    } as any,
    generation,
  );

  const result = await request.generateAll(ingestionId, "admin");
  assert.equal(result.ingestion.status, "ready_for_review");
  assert.equal(result.draft.generated.romanized, direct.romanized);
  assert.equal(result.draft.generated.meaning, direct.meaning);
  assert.equal(result.draft.generated.about, direct.about);
  assert.deepEqual(states, ["generating", "ready_to_generate", "generating", "ready_for_review"]);
  assert.equal(referenceQueries, 2, "one lookup per requested Romanization, never per other AI operation");
  assert.equal(romanizeCalls, 2);
  assert.equal(meaningCalls, 2);
  assert.equal(editorialCalls, 2);
  assert.equal(seen.filter(value => value === "romanize").length, 2);
});

test("shared generation skips catalogue lookup when no Romanization is requested", async () => {
  let queries = 0;
  const generation = new ContentGenerationService({
    romanize: async () => { throw new Error("should not romanize"); },
    translateMeaning: async input => ({ lines: input.lines.map(line => ({ index: line.index, text: "One." })) }),
    generateEditorialMetadata: async () => ({ about: "About song.", whenToListen: "At night." }),
  }, { findRelevant: async () => { queries++; return []; } });
  await generation.translateMeaning({ lines: [{ index: 0, text: "တစ်" }] });
  await generation.generateEditorialMetadata({ lines: [{ index: 0, text: "တစ်" }] });
  assert.equal(queries, 0);
});

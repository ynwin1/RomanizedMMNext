import test from "node:test";
import assert from "node:assert/strict";
import {refineRomanization} from "@/modules/romanization-references/application/romanization-refinement";
import {RomanizationReferenceService} from "@/modules/romanization-references/application/romanization-reference.service";
import type {RomanizationReferenceSong} from "@/modules/romanization-references/application/romanization-reference.types";
import {ContentGenerationService} from "@/modules/content-generation/application/content-generation.service";
import {FakeContentGenerationProvider} from "./fakes/fake-content-generation.provider";

function song(mmid: number, ...entries: Array<[string, string]>): RomanizationReferenceSong {
  return {mmid, lyricsV2: {version: 2, entries: entries.map(([burmese, romanized]) => ({kind: "line" as const, burmese, romanized, meaning: null}))}};
}

test("refiner reuses corrected exact lines and records conflicts without changing line order", () => {
  const source = [{index: 0, text: "မင်္ဂလာပါ"}, {index: 1, text: ""}, {index: 2, text: "မင်္ဂလာပါ"}];
  const generated = [{index: 0, text: "Mingala ba"}, {index: 1, text: ""}, {index: 2, text: "Mingala ba"}];
  const result = refineRomanization(source, generated, [song(21, ["မင်္ဂလာပါ", "Mingalar par"]), song(20, ["မင်္ဂလာပါ", "Mingala ba"])]);
  assert.deepEqual(result.lines.map(line => line.text), ["Mingalar par", "", "Mingalar par"]);
  assert.deepEqual(result.ambiguousLines, [0, 2]);
  assert.equal(result.changes.length, 2);
  assert.ok(result.changes.every(change => change.kind === "exact-line"));
  assert.deepEqual(result.changes[0].referenceMmids, [21]);
  assert.equal(generated[0].text, "Mingala ba", "original AI output stays untouched");
});

test("word evidence learns repeated alignments across songs, with two anchors and one correction", () => {
  const reference = [song(3, ["မင်းကို ချစ်တယ်", "Min ko chit tal"]), song(2, ["မင်းကို ချစ်တယ် နော်", "Min ko chit tal naw"]), song(1, ["မင်းကို ချစ်တယ် ပဲ", "Min ko chit tal bae"])];
  const result = refineRomanization(
    [{index: 7, text: "မင်းကို ချစ်တယ် လား"}],
    [{index: 7, text: "Min ko chit tel lar"}], reference,
  );
  assert.equal(result.lines[0].text, "Min ko chit tal lar");
  assert.equal(result.changes[0]?.kind, "word");
  assert.deepEqual(result.changes[0]?.referenceMmids, [3, 2, 1]);
});

test("word changes are blocked on weak evidence, missing anchors, or unknown segmentation", () => {
  const refs = [song(1, ["မင်းကို ချစ်တယ်", "Min ko chit tal"])];
  const unchanged = refineRomanization([{index: 0, text: "မင်းကို ချစ်တယ် နော်"}], [{index: 0, text: "Min ko chit tel naw"}], refs);
  assert.equal(unchanged.lines[0].text, "Min ko chit tel naw");
  assert.equal(unchanged.changes.length, 0);
});

test("generation applies optional refinement after AI validation without changing source", async () => {
  const provider = new FakeContentGenerationProvider({romanized: {lines: [{index: 0, text: "Mingala ba"}]}});
  const service = new ContentGenerationService(provider, {
    findRelevant: async () => [],
    refineGenerated: async (_source, generated) => ({lines: generated.map(line => ({...line, text: "Mingalar par"})), changes: [{index: 0, kind: "exact-line", original: "Mingala ba", corrected: "Mingalar par", referenceMmids: [42]}]}),
  });
  assert.deepEqual(await service.romanize({lines: [{index: 0, text: "မင်္ဂလာပါ"}]}), {
    lines: [{index: 0, text: "Mingalar par"}],
    refinements: [{index: 0, kind: "exact-line", original: "Mingala ba", corrected: "Mingalar par", referenceMmids: [42], hasConflict: false}],
  });
});

test("bad refinement cannot break validated AI output", async () => {
  const provider = new FakeContentGenerationProvider({romanized: {lines: [{index: 0, text: "Mingala ba"}]}});
  const service = new ContentGenerationService(provider, {
    findRelevant: async () => [],
    refineGenerated: async () => ({lines: [], changes: []}),
  });
  assert.deepEqual(await service.romanize({lines: [{index: 0, text: "မင်္ဂလာပါ"}]}), {lines: [{index: 0, text: "Mingala ba"}]});
});

test("catalogue refinement loads beyond the prompt's recent-seven-song window", async () => {
  let requestedLimit = 0;
  const references = new RomanizationReferenceService({recentReviewedSongs: async limit => {
    requestedLimit = limit;
    return [song(100, ["မင်္ဂလာပါ", "Mingalar par"])];
  }});
  const result = await references.refineGenerated([{index: 0, text: "မင်္ဂလာပါ"}], [{index: 0, text: "Mingala ba"}]);
  assert.equal(requestedLimit, 500);
  assert.equal(result.lines[0].text, "Mingalar par");
});

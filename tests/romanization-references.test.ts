import test from "node:test";
import assert from "node:assert/strict";
import { RomanizationReferenceService } from "@/modules/romanization-references/application/romanization-reference.service";
import type { RomanizationReferenceSong } from "@/modules/romanization-references/application/romanization-reference.types";

function song(mmid: number, lines: Array<[string, string]>): RomanizationReferenceSong {
  return { mmid, lyricsV2: { version: 2, entries: lines.map(([burmese, romanized]) =>
    ({ kind: "line" as const, burmese, romanized, meaning: null })) } };
}

test("exact matches are ranked first; the recent spelling wins repeated sources", async () => {
  const items = [song(9, [["မင်္ဂလာပါ", "mingalar par"], ["နှစ်", "hnit"]]), song(8, [["မင်္ဂလာပါ", "mingala ba"], ["တစ်", "tit"]])];
  const references = await new RomanizationReferenceService({ recentReviewedSongs: async () => items })
    .findRelevant(["တစ်", "မင်္ဂလာပါ"], { maxReferences: 3 });
  assert.deepEqual(references.map(x => [x.mmid, x.burmese, x.romanized]), [
    [9, "မင်္ဂလာပါ", "mingalar par"], [8, "တစ်", "tit"], [9, "နှစ်", "hnit"],
  ]);
});

test("invalid V2 entries are skipped; only canonical examples are returned", async () => {
  const invalid: RomanizationReferenceSong = {
    mmid: 11, lyricsV2: { version: 2, entries: [{ kind: "line", burmese: "တစ်", romanized: "", meaning: null }] },
  };
  const references = await new RomanizationReferenceService({
    recentReviewedSongs: async () => [invalid, song(10, [["တစ်", "tit"]])],
  }).findRelevant(["တစ်"]);
  assert.deepEqual(references, [{ mmid: 10, burmese: "တစ်", romanized: "tit" }]);
});

test("empty inputs do not query the database, and result count is capped", async () => {
  let calls = 0;
  const service = new RomanizationReferenceService({
    recentReviewedSongs: async limit => {
      calls += 1;
      assert.equal(limit, 30);
      return [song(1, Array.from({ length: 40 }, (_, i) => [String(i), "roman " + i]))];
    },
  });
  assert.deepEqual(await service.findRelevant([" ", ""]), []);
  assert.equal(calls, 0);
  assert.equal((await service.findRelevant(["1"], { recentSongs: 1000, maxReferences: 1000 })).length, 24);
  assert.equal(calls, 1);
});

test("related non-exact lines outrank unrelated recent examples", async () => {
  const service = new RomanizationReferenceService({ recentReviewedSongs: async () => [
    song(3, [["ခရီး လမ်းမှာ", "kha yee lan hmar"], ["မင်း ကို ချစ်", "min ko chit"]]),
    song(2, [["မင်း ကို သတိရ", "min ko tha ti ya"]]),
  ] });
  const references = await service.findRelevant(["မင်း ကို ပြန်တွေ့"], { maxReferences: 2 });
  assert.deepEqual(references.map(item => item.mmid), [3, 2]);
  assert.equal(references[0]?.burmese, "မင်း ကို ချစ်");
});

test("line normalization handles repeated whitespace for exact matches", async () => {
  const service = new RomanizationReferenceService({ recentReviewedSongs: async () => [
    song(5, [["မင်း    ကို", "Min ko"], ["အချစ်", "a chit"]]),
  ] });
  const matches = await service.findRelevant([" မင်း ကို "], { maxReferences: 1 });
  assert.deepEqual(matches, [{ mmid: 5, burmese: "မင်း ကို", romanized: "Min ko" }]);
});

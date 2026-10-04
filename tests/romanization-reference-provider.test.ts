import test from "node:test";
import assert from "node:assert/strict";
import { RecentSongRomanizationReferenceProvider } from "@/integrations/romanization-references/recent-song-reference.provider";

test("recent-song reference provider uses configured recent-song window and returns strongest mappings first", async () => {
  let limitSeen = 0;
  const provider = new RecentSongRomanizationReferenceProvider({
    getRecentRomanizationReferenceSongs: async (limit: number) => {
      limitSeen = limit;
      return [
        {
          mmid: 25,
          songName: "Newest",
          burmese: "ချစ်တယ်\nမင်းကိုချစ်တယ်",
          romanized: "Chit tal\nMin ko chit tal",
          meaning: "I love you\nI love you",
        },
        {
          mmid: 24,
          songName: "Older",
          burmese: "ချစ်ပါတယ်",
          romanized: "Chit par tal",
          meaning: "I love you",
        },
      ];
    },
  } as any, { recentSongLimit: 2, referenceLineLimit: 10 });

  const references = await provider.findRelevantReferences([
    { index: 0, text: "မင်းကိုချစ်တယ်" },
  ]);

  assert.equal(limitSeen, 2);
  assert.equal(references[0]?.match, "exact");
  assert.equal(references[0]?.romanized, "Min ko chit tal");
  assert.equal(references[0]?.meaning, "I love you");
  assert.equal(references[0]?.sourceSongMmid, 25);
  assert.ok(references.some(reference => reference.romanized === "Chit tal"));
});

test("recent-song reference provider ignores unrelated mappings and respects line cap", async () => {
  const provider = new RecentSongRomanizationReferenceProvider({
    getRecentRomanizationReferenceSongs: async () => [{
      mmid: 30,
      songName: "Recent",
      burmese: "ချစ်တယ်\nမင်းကိုချစ်တယ်\nလုံးဝမဆိုင်သောစာ",
      romanized: "Chit tal\nMin ko chit tal\nUnrelated",
      meaning: "Love\nLove you\nUnrelated",
    }],
  } as any, { referenceLineLimit: 1 });

  const references = await provider.findRelevantReferences([
    { index: 0, text: "မင်းကိုချစ်တယ်" },
  ]);

  assert.equal(references.length, 1);
  assert.notEqual(references[0]?.romanized, "Unrelated");
});

test("recent-song reference provider can be configured from environment", async () => {
  let limitSeen = 0;
  const { createRecentSongRomanizationReferenceProvider } = await import(
    "@/integrations/romanization-references/recent-song-reference.provider"
  );
  const provider = createRecentSongRomanizationReferenceProvider({
    getRecentRomanizationReferenceSongs: async (limit: number) => {
      limitSeen = limit;
      return [];
    },
  } as any, {
    ROMANIZATION_REFERENCE_SONG_LIMIT: "17",
    ROMANIZATION_REFERENCE_LINE_LIMIT: "12",
  } as unknown as NodeJS.ProcessEnv);

  await provider.findRelevantReferences([{ index: 0, text: "စာ" }]);
  assert.equal(limitSeen, 17);
});

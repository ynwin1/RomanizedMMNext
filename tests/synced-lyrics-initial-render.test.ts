import test from "node:test";
import assert from "node:assert/strict";
import { parseLyricsWithTimestamps, selectLyricsText } from "@/app/components/sync-lyrics/lyrics-parser";

test("Burmese lyrics are selected and parsed synchronously for the initial render", () => {
  const lyrics = {
    burmese: "မင်္ဂလာပါ\n\nငါ ချစ်တယ်",
    romanized: "Mingalar par\n\nNgar chit tal",
    meaning: "Hello\n\nI love you",
  };
  const selected = selectLyricsText(lyrics, "burmese");
  assert.deepEqual(parseLyricsWithTimestamps(selected), [
    { text: "မင်္ဂလာပါ", startTime: -1 },
    { text: "", startTime: -1 },
    { text: "ငါ ချစ်တယ်", startTime: -1 },
  ]);
  assert.equal(selectLyricsText(lyrics, "romanized"), lyrics.romanized);
  assert.equal(selectLyricsText(lyrics, "meaning"), lyrics.meaning);
  assert.equal(selectLyricsText(lyrics, "unexpected"), lyrics.burmese);
});

test("timestamped lyrics preserve human-readable text and sync offsets", () => {
  assert.deepEqual(parseLyricsWithTimestamps("[01:23]မင်း ကို ချစ်\nPlain lyric"), [
    { text: "မင်း ကို ချစ်", startTime: 83 },
    { text: "Plain lyric", startTime: -1 },
  ]);
});

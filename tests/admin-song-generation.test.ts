import test from "node:test";
import assert from "node:assert/strict";
import { AdminSongGenerationService } from "@/modules/admin/application/admin-song-generation.service";
import type { EditorialGenerationInput, LyricGenerationInput } from "@/modules/content-generation";
import { buildLyricsV2FromAlignedText, LyricsV2BuildError } from "@/modules/songs/application/lyrics-v2.builder";

test("admin direct song generation reuses aligned AI outputs and builds canonical V2", async () => {
  let editorialInput: any;
  const service = new AdminSongGenerationService({
    romanize: async (input: LyricGenerationInput) => ({
      lines: input.lines.map(line => ({
        index: line.index,
        text: line.text === "" ? "" : "R" + line.index,
      })),
    }),
    translateMeaning: async (input: LyricGenerationInput) => ({
      lines: input.lines.map(line => ({
        index: line.index,
        text: line.text === "" ? "" : "M" + line.index,
      })),
    }),
    generateEditorialMetadata: async (input: EditorialGenerationInput) => {
      editorialInput = input;
      return {
        about: "A reflective song.",
        whenToListen: "Late at night.",
      };
    },
  } as any);

  const result = await service.generate({
    burmeseLyrics: "ပထမ\n\nဒုတိယ",
    songName: "Song",
    artistNames: ["Artist"],
  });

  assert.deepEqual(result.lyricsV2, {
    version: 2,
    entries: [
      { kind: "line", burmese: "ပထမ", romanized: "R0", meaning: "M0" },
      { kind: "break" },
      { kind: "line", burmese: "ဒုတိယ", romanized: "R2", meaning: "M2" },
    ],
  });
  assert.equal(result.romanized, "R0\n\nR2");
  assert.equal(result.meaning, "M0\n\nM2");
  assert.equal(result.about, "A reflective song.");
  assert.equal(result.whenToListen, "Late at night.");
  assert.equal(editorialInput.songName, "Song");
  assert.deepEqual(editorialInput.artistNames, ["Artist"]);
  assert.equal(editorialInput.romanizedLines[2].text, "R2");
  assert.equal(editorialInput.meaningLines[0].text, "M0");
});

test("shared V2 builder collapses repeated blank source lines into one section break", () => {
  assert.deepEqual(
    buildLyricsV2FromAlignedText(
      "တစ်\n\n\nနှစ်",
      "Tit\n\n\nHnit",
      "One\n\n\nTwo",
    ),
    {
      version: 2,
      entries: [
        { kind: "line", burmese: "တစ်", romanized: "Tit", meaning: "One" },
        { kind: "break" },
        { kind: "line", burmese: "နှစ်", romanized: "Hnit", meaning: "Two" },
      ],
    },
  );
});

test("shared V2 builder rejects misaligned generated lyric blocks", () => {
  assert.throws(
    () => buildLyricsV2FromAlignedText("တစ်\nနှစ်", "Tit", "One\nTwo"),
    error => error instanceof LyricsV2BuildError && /matching line counts/.test(error.message),
  );
});

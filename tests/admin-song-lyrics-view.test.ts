import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderLyricsV2Column } from "@/modules/songs/domain/lyrics.compatibility";
import { buildLyricsV2FromAlignedText, LyricsV2BuildError } from "@/modules/songs/application/lyrics-v2.builder";

const entries = [
  { kind: "line" as const, burmese: "ပထမ", romanized: "Pa hta ma", meaning: "First" },
  { kind: "break" as const },
  { kind: "line" as const, burmese: "ဒုတိယ", romanized: "Du ti ya", meaning: null },
];

test("full-lyrics view uses V2 columns including section breaks and empty meanings", () => {
  const lyrics = { version: 2 as const, entries };
  assert.equal(renderLyricsV2Column(lyrics, "burmese"), "ပထမ\n\nဒုတိယ");
  assert.equal(renderLyricsV2Column(lyrics, "romanized"), "Pa hta ma\n\nDu ti ya");
  assert.equal(renderLyricsV2Column(lyrics, "meaning"), "First\n\n");
});

test("full-lyrics edits can rebuild canonical V2 with blank meaning rows", () => {
  const original = { version: 2 as const, entries };
  const edited = buildLyricsV2FromAlignedText(
    renderLyricsV2Column(original, "burmese"),
    "Updated first line\n\nUpdated second line",
    renderLyricsV2Column(original, "meaning"),
  );
  assert.equal(edited.entries[0]?.kind, "line");
  if (edited.entries[0]?.kind === "line") assert.equal(edited.entries[0].romanized, "Updated first line");
  assert.deepEqual(edited.entries[1], { kind: "break" });
  if (edited.entries[2]?.kind === "line") assert.equal(edited.entries[2].meaning, null);
});

test("full-lyrics edits reject missing lines and mismatched section breaks", () => {
  assert.throws(() => buildLyricsV2FromAlignedText("line one\nline two", "one", "meaning one\nmeaning two"), LyricsV2BuildError);
  assert.throws(() => buildLyricsV2FromAlignedText("line one\n\nline two", "one\nnot blank\ntwo", "meaning one\n\nmeaning two"), /section breaks must be blank/);
});

test("song editor offers both views without introducing another save source", () => {
  const source = readFileSync("app/admin/songs/song-form.tsx", "utf8");
  assert.match(source, /Aligned rows/);
  assert.match(source, /Full lyrics/);
  assert.match(source, /aria-pressed=\{view === "blob"\}/);
  assert.match(source, /renderLyricsV2Column\(lyrics, "burmese"\)/);
  assert.match(source, /renderLyricsV2Column\(lyrics, "romanized"\)/);
  assert.match(source, /renderLyricsV2Column\(lyrics, "meaning"\)/);
  assert.match(source, /Apply full-lyrics changes/);
  assert.match(source, /onChange=\{event => \{/);
  assert.match(source, /disabled=\{blobChangesPending\}/);
  assert.equal((source.match(/name="lyricsV2"/g) ?? []).length, 1);
});

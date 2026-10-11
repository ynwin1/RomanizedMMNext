import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("lyrics language choices and bounded reading controls are accessible", () => {
  const source = readFileSync("app/components/music-box/LyricsSection.tsx", "utf8");
  assert.match(source, /aria-label="Lyrics language"/);
  assert.match(source, /aria-pressed={selectedOption === mode}/);
  assert.match(source, /aria-label="Lyrics font size"/);
  assert.match(source, /aria-label="Lyrics line spacing"/);
  assert.match(source, /const FONT_MIN = 12/);
  assert.match(source, /const DEFAULT_FONT = 16/);
  assert.match(source, /const FONT_MAX = 32/);
  assert.match(source, /const LINE_MIN = 1.2/);
  assert.match(source, /const LINE_MAX = 2.6/);
  assert.match(source, /Reset to defaults/);
  assert.match(source, /RomanizedMM_lyricsReadingSettings/);
  assert.match(source, /settingsLoaded/);
  assert.match(source, /style={{fontSize:/);
  assert.match(source, /fontSizeLabel\(fontSize\)/);
  assert.match(source, /Smaller/);
  assert.match(source, /Larger/);
  assert.doesNotMatch(source, /<output>{fontSize}px<\/output>/);
  assert.match(source, /searchParams.get\("option"\)/);
  assert.match(source, /customRenderer\(chosenLyrics\)/);
});
test("only timestamped lyrics with player visible enable seeking", () => {
  const source = readFileSync("app/components/sync-lyrics/SyncedLyricsPlayer.tsx", "utf8");
  assert.match(source, /playerVisible && lyric.startTime >= 0/);
  assert.match(source, /aria-label={`Seek to lyric:/);
  assert.match(source, /onClick={\(\) => handleLyricClick\(lyric.startTime\)}/);
  assert.match(source, /<div key={index} className={className}>/);
});

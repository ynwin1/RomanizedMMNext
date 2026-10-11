import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const song = readFileSync("app/(pages)/[locale]/(songs)/song/[name]/[id]/page.tsx", "utf8");
const search = readFileSync("app/components/searchbar/SearchBar.tsx", "utf8");
test("song page search precedes details and action buttons remain at bottom", () => {
  assert.ok(song.indexOf("<SearchBar />") < song.indexOf("<header"));
  assert.ok(song.indexOf("<SearchBar />") < song.indexOf("<SyncedLyricsPlayer"));
  assert.ok(song.indexOf("<RandomSongButton") > song.indexOf("<MoreSongs"));
  assert.ok(song.indexOf("<SongReportButton") > song.indexOf("<MoreSongs"));
  assert.equal((song.match(/<SearchBar \/>/g) ?? []).length, 1);
});
test("artist biography card removed while song discovery remains", () => {
  assert.doesNotMatch(song, /AboutArtistCard|firstArtist|artistService/);
  assert.match(song, /<MoreSongs/);
});
test("search maintains an accessible name without a visible label", () => {
  assert.match(search, /<label className="sr-only" htmlFor="song-search">Find a song<\/label>/);
});

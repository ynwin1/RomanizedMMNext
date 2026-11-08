import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("app/(pages)/[locale]/(songs)/song/[name]/[id]/page.tsx", "utf8");

test("song search and quick actions precede details and lyrics", () => {
  const header = source.indexOf('<header className=');
  const player = source.indexOf('<SyncedLyricsPlayer extLinks=');
  const search = source.indexOf("<SearchBar showLabel={false} />");
  const whenToListen = source.indexOf('translator("whenToListen")');
  assert.ok(search > 0 && search < header && search < player);
  assert.match(source, /<SearchBar showLabel={false} \/>/);
  assert.doesNotMatch(source, /See something that isn’t right\?/);
  assert.doesNotMatch(source, /AboutArtistCard|artistService|getFirstProfileBySlugs/);
  assert.ok(header > 0 && player > header);
  assert.ok(whenToListen > header && whenToListen < player);
  assert.doesNotMatch(source, /<details/);
  assert.match(source, /<h1 className=.*song.songName/);
});

test("song pages retain canonical share links, JSON-LD, and locale-specific artist links", () => {
  assert.match(source, /jsonLdScriptValue\(seo.recording\)/);
  assert.match(source, /<SocialShare url={seo.canonical}/);
  assert.match(source, /href={`\/\$\{locale\}\/artist\/\$\{artist.slug\}`}/);
  assert.match(source, /lyrics=\{\{romanized: song.romanized, burmese: song.burmese, meaning: song.meaning, initialOption: option\}\}/);
});

test("song search stays on the page rather than the navigation", () => {
  const navbar = readFileSync("app/components/navbar/Navbar.tsx", "utf8");
  assert.doesNotMatch(navbar, /HeaderSearch/);
  assert.match(source, /<SearchBar showLabel={false} \/>/);
});

test("song footer has just one divider and no empty related-songs wrapper", () => {
  assert.doesNotMatch(source, /<section aria-labelledby="more-from-artist"/);
  assert.match(source, /<MoreSongs artists={cleanedArtistNames}/);
  assert.equal((source.match(/border-t border-theme-border/g) ?? []).length, 1);
});

test("search label can be visually hidden without losing accessibility", () => {
  const search = readFileSync("app/components/searchbar/SearchBar.tsx", "utf8");
  assert.match(search, /showLabel = true/);
  assert.match(search, /"sr-only"/);
  assert.match(search, /htmlFor="song-search"/);
  assert.match(source, /<RandomSongButton locale={locale}\s*\/>/);
  assert.match(source, /<SongReportButton songName={song.songName} artist={artistNames} \/>/);
});

test("Surprise and Report appear once, centered directly beneath the search bar", () => {
  const search = source.indexOf("<SearchBar showLabel={false} />");
  const quickActions = source.indexOf('aria-label="Quick song actions"');
  const surprise = source.indexOf("<RandomSongButton locale={locale}/>");
  const report = source.indexOf("<SongReportButton songName={song.songName} artist={artistNames} />");
  const header = source.indexOf("<header className=");
  const share = source.indexOf('<aside aria-label="Share this song"');
  assert.ok(search >= 0 && search < quickActions && quickActions < surprise &&
    surprise < report && report < header && header < share);
  assert.match(source, /className="flex flex-wrap items-center justify-center gap-3" aria-label="Quick song actions"/);
  assert.equal((source.match(/<RandomSongButton /g) ?? []).length, 1);
  assert.equal((source.match(/<SongReportButton /g) ?? []).length, 1);
  assert.match(source.slice(share), /<SocialShare url={seo.canonical}/);
  assert.doesNotMatch(source.slice(share), /<RandomSongButton|<SongReportButton/);
});

test("song search and centered action buttons have comfortable vertical separation", () => {
  assert.match(source, /className="mx-auto w-full max-w-2xl space-y-6" aria-label="Search and song actions"/);
});

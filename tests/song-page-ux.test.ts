import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("app/(pages)/[locale]/(songs)/song/[name]/[id]/page.tsx", "utf8");

test("search precedes song details and lyrics", () => {
  const header = source.indexOf('<header className=');
  const player = source.indexOf('<SyncedLyricsPlayer extLinks=');
  const search = source.indexOf("<SearchBar />");
  const whenToListen = source.indexOf('translator("whenToListen")');
  assert.ok(search > 0 && search < header);
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
  assert.match(source, /<SearchBar \/>/);
});

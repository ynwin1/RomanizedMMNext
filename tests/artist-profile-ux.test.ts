import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {artistBiographyForLocale} from "@/app/(pages)/[locale]/(artists)/artist/[slug]/artist-profile-content";

test("artist biography uses Burmese copy when available and falls back to English", () => {
  const artist = {biography: "English life story", biographyMy: "မြန်မာ အတ္ထုပ္ပတ္တိ"};
  assert.equal(artistBiographyForLocale(artist, "my"), artist.biographyMy);
  assert.equal(artistBiographyForLocale(artist, "en"), artist.biography);
  assert.equal(artistBiographyForLocale({biography: "English life story", biographyMy: "  "}, "my"), "English life story");
  assert.equal(artistBiographyForLocale({}, "en"), "");
});

test("artist profiles support missing photos, biographies, and songs without losing navigation", () => {
  const page = readFileSync("app/(pages)/[locale]/(artists)/artist/[slug]/page.tsx", "utf8");
  const biography = readFileSync("app/components/artist/biography.tsx", "utf8");
  const songCard = readFileSync("app/components/artist/SongCard.tsx", "utf8");
  assert.match(page, /src \? <Image/);
  assert.match(page, /biography\.trim\(\) &&/);
  assert.match(page, /artistSongs\.length \?/);
  assert.match(page, /No songs listed yet/);
  assert.match(page, /artist-catalogue/);
  assert.match(page, /song-request/);
  assert.match(page, /jsonLdScriptValue\(seo\.entity\)/);
  assert.match(page, /grid-cols-1 gap-3 md:grid-cols-2/);
  assert.match(biography, /aria-expanded={showMore}/);
  assert.match(songCard, /formatSongNameForURL\(names\.engName\)/);
});

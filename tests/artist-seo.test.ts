import test from "node:test";
import assert from "node:assert/strict";
import { artistSeo, jsonLdScriptValue } from "@/app/lib/artist-seo";
import type { ArtistEntity } from "@/modules/artists/domain/artist.types";

const artist: ArtistEntity = {
  id: "artist-1", name: "Example Burmese Singer", slug: "example-singer",
  imageLink: "https://example.test/image.jpg", biography: "A singer from Myanmar.",
  type: "Singer", musicGenre: ["Pop"], songs: [17], likes: 0,
  socials: { youtube: "https://www.youtube.com/@example", spotify: "https://open.spotify.com/artist/abc" },
};

test("artist pages expose artist entities rather than incorrectly labelling artists as recordings", () => {
  const seo = artistSeo(artist, "my");
  assert.equal(seo.entity["@type"], "Person");
  assert.equal(seo.canonical, "https://www.romanizedmm.com/my/artist/example-singer");
  assert.deepEqual(seo.alternateLanguages, {
    en: "https://www.romanizedmm.com/en/artist/example-singer",
    my: seo.canonical,
  });
  assert.equal(seo.entity["@id"], "https://www.romanizedmm.com/en/artist/example-singer#artist");
  assert.deepEqual(seo.entity.sameAs, ["https://www.youtube.com/@example", "https://open.spotify.com/artist/abc"]);
});

test("band pages use MusicGroup and omit unverifiable social links", () => {
  const seo = artistSeo({
    ...artist, type: "Band", socials: { facebook: "javascript:alert(1)" },
  }, "en");
  assert.equal(seo.entity["@type"], "MusicGroup");
  assert.equal("sameAs" in seo.entity, false);
});

test("artist JSON-LD escapes HTML-sensitive strings while preserving parsed JSON", () => {
  const seo = artistSeo({ ...artist, biography: "</script><script>alert(1)</script>" }, "en");
  const serialized = jsonLdScriptValue(seo.entity);
  assert.doesNotMatch(serialized, /</);
  assert.equal(JSON.parse(serialized).description, "</script><script>alert(1)</script>");
});

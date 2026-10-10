import test from "node:test";
import assert from "node:assert/strict";
import { songSeo, jsonLdScriptValue } from "@/app/lib/song-seo";

const base = { mmid: 17, songName: "A Hnaung A Phweh (အနှောင်အဖွဲ့)", artistName: [{ name: "Singer" }] };

test("song SEO includes Burmese and romanized names and stable locale-specific canonical URLs", () => {
  const en = songSeo(base, "en");
  const my = songSeo(base, "my");
  assert.equal(en.title, "အနှောင်အဖွဲ့ (A Hnaung A Phweh) Lyrics - Singer");
  assert.match(my.description, /အနှောင်အဖွဲ့/);
  assert.equal(en.canonical, "https://www.romanizedmm.com/en/song/AHnaungAPhweh/17");
  assert.equal(my.canonical, "https://www.romanizedmm.com/my/song/AHnaungAPhweh/17");
  assert.deepEqual(en.alternateLanguages, { en: en.canonical, my: my.canonical });
  assert.deepEqual(my.recording.alternateName, ["A Hnaung A Phweh", "အနှောင်အဖွဲ့"]);
});

test("song SEO handles missing Burmese title and multiple artist names without inventing translations", () => {
  const seo = songSeo({ mmid: 19, songName: "Lost in Universe", artistName: [{ name: "A" }, { name: "B" }] }, "en");
  assert.equal(seo.title, "Lost in Universe Lyrics - A, B");
  assert.deepEqual(seo.recording.alternateName, ["Lost in Universe"]);
  assert.deepEqual(seo.recording.byArtist, [{ "@type": "MusicGroup", name: "A" }, { "@type": "MusicGroup", name: "B" }]);
});

test("structured data remains JSON and escapes HTML-significant less-than characters", () => {
  const encoded = jsonLdScriptValue({ description: "</script><script>alert(1)</script>" });
  assert.doesNotMatch(encoded, /</);
  assert.deepEqual(JSON.parse(encoded), { description: "</script><script>alert(1)</script>" });
});

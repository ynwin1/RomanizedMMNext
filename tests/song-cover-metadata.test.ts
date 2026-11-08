import test from "node:test";
import assert from "node:assert/strict";
import { fetchYouTubeCoverMetadata } from "@/modules/songs/application/song-cover.metadata";

const videoId = "dQw4w9WgXcQ";
const link = `https://youtu.be/${videoId}`;

test("metadata lookup requests only canonical YouTube oEmbed and returns safe fields", async () => {
  let requested = "";
  const fakeFetch: typeof fetch = async (input, options) => {
    requested = String(input);
    assert.equal(options?.redirect, "error");
    assert.equal(options?.cache, "no-store");
    return new Response(JSON.stringify({
      title: " Test Acoustic Cover ",
      author_name: "Artist",
      thumbnail_url: "https://evil.example/image.jpg",
      html: "<iframe>unsafe</iframe>",
    }), { status: 200 });
  };
  const metadata = await fetchYouTubeCoverMetadata(link, fakeFetch);
  assert.match(requested, /www\.youtube\.com\/oembed/);
  assert.match(requested, /watch%3Fv%3D/);
  assert.deepEqual(metadata, {
    videoId,
    title: "Test Acoustic Cover",
    authorName: "Artist",
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  });
});

test("metadata lookup does not request invalid or untrusted URLs", async () => {
  let called = false;
  const fakeFetch: typeof fetch = async () => { called = true; throw new Error("unexpected"); };
  assert.equal(await fetchYouTubeCoverMetadata("https://youtube.com.evil.example/", fakeFetch), null);
  assert.equal(called, false);
});

test("metadata unavailable, invalid or oversized response does not break cover creation", async () => {
  const cases = [
    new Response("Not found", { status: 404 }),
    new Response('{"title":null}', { status: 200 }),
    new Response("x".repeat(16385), { status: 200 }),
    new Response("not json", { status: 200 }),
  ];
  for (const response of cases) {
    assert.equal(await fetchYouTubeCoverMetadata(link, async () => response), null);
  }
  assert.equal(await fetchYouTubeCoverMetadata(link, async () => { throw new Error("network"); }), null);
});

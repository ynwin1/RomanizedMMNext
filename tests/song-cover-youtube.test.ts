import test from "node:test";
import assert from "node:assert/strict";
import {
  parseYouTubeVideoId,
  normalizeYouTubeVideoUrl,
} from "@/modules/songs/application/song-cover.youtube";

const id = "dQw4w9WgXcQ";

test("recognizes standard watch, shortened, shorts, embed, live and mobile URLs", () => {
  const urls = [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=34s`,
    `https://m.youtube.com/watch?feature=share&v=${id}`,
    `https://music.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=example`,
    `https://www.youtube.com/shorts/${id}`,
    `https://youtube.com/embed/${id}`,
    `https://youtube.com/live/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `http://youtube.com/watch?v=${id}`,
  ];
  for (const url of urls) {
    assert.equal(parseYouTubeVideoId(url), id, url);
    assert.equal(normalizeYouTubeVideoUrl(url), `https://www.youtube.com/watch?v=${id}`);
  }
});

test("trims whitespace and ignores irrelevant tracking parameters", () => {
  assert.equal(parseYouTubeVideoId(`  https://youtu.be/${id}?si=xyz  `), id);
  assert.equal(parseYouTubeVideoId(`https://youtube.com/watch?list=foo&v=${id}&t=20`), id);
});

test("rejects lookalike hosts, untrusted schemes, credentials and custom ports", () => {
  const rejected = [
    `https://youtube.com.evil.example/watch?v=${id}`,
    `https://notyoutube.com/watch?v=${id}`,
    `https://evil.example/youtube.com/watch?v=${id}`,
    `https://youtube.com@evil.example/watch?v=${id}`,
    `https://foo@youtube.com/watch?v=${id}`,
    `https://youtube.com:8080/watch?v=${id}`,
    `javascript:alert('youtube.com/watch?v=${id}')`,
    `ftp://youtube.com/watch?v=${id}`,
    `//youtube.com/watch?v=${id}`,
  ];
  for (const url of rejected) assert.equal(parseYouTubeVideoId(url), null, url);
});

test("rejects malformed, ambiguous, non-video and excessively long URLs", () => {
  const rejected = [
    "",
    "not a URL",
    id,
    "https://www.youtube.com/",
    "https://www.youtube.com/playlist?list=PL123",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/watch?v=short",
    `https://www.youtube.com/watch?v=${id}&v=${id}`,
    `https://www.youtube.com/watch?v=${id}&v=ZZZZZZZZZZZ`,
    `https://www.youtube.com/shorts/${id}/extra`,
    `https://www.youtube.com/user/${id}`,
    `https://youtu.be/${id}/extra`,
    `https://youtu.be/${id.slice(0, 10)}!`,
    "https://youtu.be/" + "a".repeat(2100),
  ];
  for (const url of rejected) {
    assert.equal(parseYouTubeVideoId(url), null, url.slice(0, 100));
    assert.equal(normalizeYouTubeVideoUrl(url), null);
  }
});

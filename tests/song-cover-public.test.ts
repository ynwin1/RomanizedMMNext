import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { publicCoverRecords } from "@/modules/songs/application/song-cover.public";
import type { StoredSongCover } from "@/modules/songs/application/song-cover.repository";

const sample: StoredSongCover = {
  id: "a".repeat(24), mmid: 205, youtubeVideoId: "PFkeRVvPPQ4",
  title: "Piano cover", description: "A very different version",
  contributorName: "Private contributor", source: "community", status: "approved",
  sortOrder: 0, reviewedBy: "clerk-user-private-id",
  reviewedAt: new Date("2026-11-07"), createdAt: new Date("2026-11-06"),
};

test("public cover projection omits private moderation data and never publishes pending items", () => {
  const result = publicCoverRecords([sample, {...sample,id:"b".repeat(24),status:"pending"},
    {...sample,id:"c".repeat(24),status:"rejected"}]);
  assert.deepEqual(result, [{
    id:sample.id, youtubeVideoId: sample.youtubeVideoId,
    title: "Piano cover", description: "A very different version",
  }]);
  const json = JSON.stringify(result);
  for (const privateField of ["contributorName","reviewedBy","reviewedAt","createdAt","source","status","mmid","sortOrder"]) {
    assert.ok(!json.includes(privateField), privateField);
  }
  assert.doesNotMatch(json,/Private contributor|clerk-user-private-id/);
});

test("public projection preserves minimal approved covers without optional fields", () => {
  const result = publicCoverRecords([{...sample, title:undefined, description:undefined}]);
  assert.deepEqual(result,[{id:sample.id,youtubeVideoId:sample.youtubeVideoId}]);
});

test("both public entry points apply the same privacy projection", () => {
  const api=readFileSync("app/api/song/[mmid]/covers/route.ts","utf8");
  const page=readFileSync("app/(pages)/[locale]/(songs)/song/[name]/[id]/page.tsx","utf8");
  assert.match(api, /publicCoverRecords\(covers\)/);
  assert.match(page, /publicCoverRecords\(covers\)/);
  assert.match(api, /Cache-Control/);
});

test("song page keeps the contribution action available when there are no approved covers", () => {
  const source=readFileSync("app/(pages)/[locale]/(songs)/song/[name]/[id]/page.tsx","utf8");
  assert.match(source, /covers\.length > 0 && <SongCoversCarousel/);
  assert.match(source, /<SuggestSongCover mmid=\{song\.mmid\} locale=\{locale\}/);
  assert.match(source, /<SyncedLyricsPlayer/);
});

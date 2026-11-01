import test from "node:test";
import assert from "node:assert/strict";
import { LyricTimingService, extractYouTubeVideoId } from "@/modules/songs/application/lyric-timing.service";
import { lyricTimingFingerprint } from "@/modules/songs/application/lyric-timing.fingerprint";
import type { LyricTimingTrack } from "@/modules/songs/domain/lyric-timing.types";

const lyrics = {version: 2 as const, entries: [
  {kind: "line" as const, burmese: "မင်္ဂလာပါ", romanized: "mingalar par", meaning: "Hello"},
  {kind: "break" as const},
  {kind: "line" as const, burmese: "ချစ်တယ်", romanized: "chit tal", meaning: "Love"},
]};
const videoId = "dQw4w9WgXcQ";
const original: LyricTimingTrack = {
  version: 1, youtubeVideoId: videoId, lyricsFingerprint: lyricTimingFingerprint(lyrics),
  status: "published", lines: [
    {entryIndex:0,startMs:1000,endMs:2000}, {entryIndex:2,startMs:4000,endMs:5000},
  ],
};
test("YouTube IDs are parsed only from trusted hostnames", () => {
  assert.equal(extractYouTubeVideoId("https://youtu.be/" + videoId), videoId);
  assert.equal(extractYouTubeVideoId("https://www.youtube.com/watch?v=" + videoId), videoId);
  assert.equal(extractYouTubeVideoId("https://youtube.com.evil.test/watch?v=" + videoId), null);
});
test("save enforces recording association and lyrics fingerprint", async () => {
  let saved: LyricTimingTrack | null = null;
  const service = new LyricTimingService({
    load: async () => saved,
    save: async (_id, t) => { saved=t; },
  }, async () => ({youtubeLink: ["https://youtu.be/"+videoId], lyricsV2:lyrics}));
  await service.save(203, original);
  assert.deepEqual(await service.load(203, videoId, true), original);
  await assert.rejects(service.save(203, {...original,lyricsFingerprint:"b".repeat(64)}),/Lyrics changed/);
  await assert.rejects(service.save(203, {...original,youtubeVideoId:"01234567890"}),/recording must/);
});
test("edited lyrics invalidate previously stored published track", async () => {
  let current = lyrics;
  const service = new LyricTimingService({
    load: async () => original,
    save: async () => {},
  }, async () => ({youtubeLink:["https://youtu.be/"+videoId],lyricsV2:current}));
  assert.ok(await service.load(203,videoId,true));
  current = {...lyrics,entries:[{...lyrics.entries[0],burmese:"အသစ်"} as typeof lyrics.entries[0],...lyrics.entries.slice(1)]};
  assert.equal(await service.load(203,videoId,true),null);
});
test("drafts are not returned to public published-only readers", async () => {
  const service = new LyricTimingService({
    load: async () => ({...original,status:"draft"}), save: async () => {},
  }, async () => ({youtubeLink:["https://youtu.be/"+videoId],lyricsV2:lyrics}));
  assert.equal(await service.load(203,videoId,true),null);
});

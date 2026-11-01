import test from "node:test";
import assert from "node:assert/strict";
import { parseLyricTimingTrack } from "@/modules/songs/application/lyric-timing.validation";

const lyrics = {
  version: 2,
  entries: [
    {kind:"line", burmese:"မင်္ဂလာပါ", romanized:"mingalar par", meaning:"Hello"},
    {kind:"break"},
    {kind:"line", burmese:"ချစ်တယ်", romanized:"chit tal", meaning:"Love"},
  ],
};
const base = {
  version: 1, youtubeVideoId: "dQw4w9WgXcQ", lyricsFingerprint: "a".repeat(64),
  status: "published",
  lines: [{entryIndex:0,startMs:12000,endMs:16000},{entryIndex:2,startMs:22000,endMs:26000}],
};

test("timings reference LyricsV2 entries and allow instrumental gaps", () => {
  assert.deepEqual(parseLyricTimingTrack(base, lyrics),base);
});
test("drafts may have incomplete coverage", () => {
  assert.equal(parseLyricTimingTrack({...base,status:"draft",lines:base.lines.slice(0,1)},lyrics).status,"draft");
});
test("published tracks require all lyric lines", () => {
  assert.throws(()=>parseLyricTimingTrack({...base,lines:base.lines.slice(0,1)},lyrics),/every lyric line/);
});
test("breaks and out-of-range entries are rejected", () => {
  for(const entryIndex of [1,3]) assert.throws(()=>parseLyricTimingTrack({...base,status:"draft",lines:[{entryIndex,startMs:0,endMs:1000}]},lyrics),/does not reference/);
});
test("overlapping, duplicate, reverse and invalid ranges are rejected", () => {
  const bad = [
    [{entryIndex:0,startMs:1,endMs:100},{entryIndex:2,startMs:90,endMs:200}],
    [{entryIndex:0,startMs:1,endMs:100},{entryIndex:0,startMs:100,endMs:200}],
    [{entryIndex:2,startMs:100,endMs:200},{entryIndex:0,startMs:300,endMs:400}],
    [{entryIndex:0,startMs:100,endMs:100}],
    [{entryIndex:0,startMs:-1,endMs:100}],
  ];
  for(const lines of bad) assert.throws(()=>parseLyricTimingTrack({...base,status:"draft",lines},lyrics));
});
test("invalid recording ID and invalid fingerprint are rejected",()=>{
  for(const patch of [{youtubeVideoId:"video"},{lyricsFingerprint:"stale"}]) assert.throws(()=>parseLyricTimingTrack({...base,...patch},lyrics));
});

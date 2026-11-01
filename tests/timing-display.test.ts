import test from "node:test";
import assert from "node:assert/strict";
import { syncedEntries, activeSyncedEntry } from "@/app/components/sync-lyrics/timing-display";
const lyrics = {version:2 as const,entries:[
 {kind:"line" as const,burmese:"ဟယ်လို",romanized:"hello",meaning:"hello"},
 {kind:"break" as const},
 {kind:"line" as const,burmese:"အချစ်",romanized:"a chit",meaning:null},
]};
const track = {version:1 as const,youtubeVideoId:"dQw4w9WgXcQ",lyricsFingerprint:"a".repeat(64),status:"published" as const,lines:[
 {entryIndex:0,startMs:1000,endMs:2000},{entryIndex:2,startMs:4000,endMs:5000},
]};
test("all three aligned views preserve entry indices and breaks",()=>{
 assert.deepEqual(syncedEntries(lyrics,"romanized").map(x=>x.text),["hello","","a chit"]);
 assert.deepEqual(syncedEntries(lyrics,"meaning").map(x=>x.text),["hello","",""]);
 assert.equal(syncedEntries(lyrics,"burmese")[2].entryIndex,2);
});
test("highlight clears in instrumental gaps and at line end",()=>{
 assert.equal(activeSyncedEntry(track,1500),0);
 assert.equal(activeSyncedEntry(track,2500),null);
 assert.equal(activeSyncedEntry(track,4500),2);
 assert.equal(activeSyncedEntry(track,5000),null);
 assert.equal(activeSyncedEntry(null,1000),null);
});

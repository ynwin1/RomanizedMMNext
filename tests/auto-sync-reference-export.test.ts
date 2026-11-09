import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {lyricTimingFingerprint} from "@/modules/songs/application/lyric-timing.fingerprint";
import {createAutoSyncReferenceExport} from "@/modules/songs/application/auto-sync.reference-export";

const lyrics={version:2 as const,entries:[
 {kind:"line" as const,burmese:"ချစ်တယ်",romanized:"chit tal",meaning:"love"},
 {kind:"break" as const},
 {kind:"line" as const,burmese:"ချစ်တယ်",romanized:"chit tal",meaning:"love"},
]};
const fingerprint=lyricTimingFingerprint(lyrics);
const track={version:1 as const,youtubeVideoId:"abcdefghijk",
 lyricsFingerprint:fingerprint,status:"published" as const,
 lines:[{entryIndex:0,startMs:1000,endMs:2700},{entryIndex:2,startMs:6500,endMs:8200}]};

test("exports complete published track with canonical lyrics and reference",()=>{
 const result=createAutoSyncReferenceExport(205,lyrics,track);
 assert.equal(result.mmid,205);
 assert.deepEqual(result.lyrics,lyrics);
 assert.deepEqual(result.reference.lines,track.lines);
 assert.equal(result.reference.youtubeVideoId,track.youtubeVideoId);
 assert.equal(result.reference.lyricsFingerprint,fingerprint);
 assert.equal(result.version,1);
 assert.doesNotMatch(JSON.stringify(result),/audioBytes|audioUrl|secret/);
});
test("rejects drafts, missing entries, stale and overlapping tracks",()=>{
 assert.throws(()=>createAutoSyncReferenceExport(205,lyrics,{...track,status:"draft"}),/Only published/);
 assert.throws(()=>createAutoSyncReferenceExport(205,lyrics,{...track,lines:track.lines.slice(0,1)}),/every lyric line/);
 assert.throws(()=>createAutoSyncReferenceExport(205,lyrics,{...track,lyricsFingerprint:"a".repeat(64)}),/stale/);
 assert.throws(()=>createAutoSyncReferenceExport(205,lyrics,{...track,lines:[
  track.lines[0],{entryIndex:2,startMs:2000,endMs:8200},
 ]}));
 assert.throws(()=>createAutoSyncReferenceExport(0,lyrics,track),/Invalid song ID/);
});
test("server action is admin guarded and UI only offers export for unchanged published tracks",()=>{
 const action=readFileSync("app/admin/songs/auto-sync-reference-actions.ts","utf8");
 const editor=readFileSync("app/admin/songs/timing-editor.tsx","utf8");
 assert.match(action,/await requireAdmin\(\)/);
 assert.match(action,/lyricTimingService\.load\(id,videoId,true\)/);
 assert.match(editor,/exportAutoSyncReferenceAction\(mmid,\s*videoId\)/);
 assert.match(editor,/disabled=\{busy \|\| !published \|\| dirty\}/);
 assert.match(editor,/window\.confirm\(/);
});

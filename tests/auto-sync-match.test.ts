import test from "node:test";
import assert from "node:assert/strict";
import {lyricTextSimilarity,normalizedBurmese,suggestAutoSyncFromTranscript} from "@/modules/songs/application/auto-sync.match";
import {validateAutoSyncPair} from "@/modules/songs/application/auto-sync.contract";
import {lyricTimingFingerprint} from "@/modules/songs/application/lyric-timing.fingerprint";

const lyric=(burmese:string)=>({kind:"line" as const,burmese,romanized:"placeholder",meaning:null});
const lyrics={version:2 as const,entries:[lyric("မင်းကိုချစ်တယ်"),{kind:"break" as const},
 lyric("ဒီနေ့နေရောင်"),lyric("အိပ်မက်တွေအားလုံး")]};
const transcription={version:1 as const,languageHint:"my" as const,youtubeVideoId:"abcdefghijk",
 segments:[{startMs:1000,endMs:2800,text:"မင်း ကို ချစ်တယ်"},
 {startMs:3000,endMs:3800,text:"(instrumental)"},
 {startMs:5800,endMs:7700,text:"ဒီနေ့နေရောင်"},
 {startMs:8200,endMs:11100,text:"အိပ်မက်တွေအားလုံး"}]};
test("normalizes Unicode and scores lexical overlap, not short false matches",()=>{
 assert.equal(normalizedBurmese("မင်း ကို ချစ်တယ်။"),normalizedBurmese("မင်းကိုချစ်တယ်"));
 assert.equal(lyricTextSimilarity("မင်း ကို ချစ်တယ်","မင်းကိုချစ်တယ်"),1);
 assert.equal(lyricTextSimilarity("က","က"),0);
});
test("matches segments to LyricsV2 entry indices and preserves instrumental gaps",()=>{
 const output=suggestAutoSyncFromTranscript(lyrics,transcription);
 assert.equal(output.matchedLines,3);
 assert.deepEqual(output.suggestion.lines.map(line=>line.entryIndex),[0,2,3]);
 assert.deepEqual(output.suggestion.lines.map(line=>[line.startMs,line.endMs]),
  [[1000,2800],[5800,7700],[8200,11100]]);
 assert.equal(output.suggestion.lyricsFingerprint,lyricTimingFingerprint(lyrics));
 assert.equal(output.suggestion.modelVersion,"whisper-segment-lexical-v1");
 const reference={version:1 as const,youtubeVideoId:"abcdefghijk",lyricsFingerprint:lyricTimingFingerprint(lyrics),
  lines:output.suggestion.lines.map(({entryIndex,startMs,endMs})=>({entryIndex,startMs,endMs}))};
 assert.equal(validateAutoSyncPair(lyrics,reference,output.suggestion).suggestion.lines.length,3);
});
test("does not force unrelated or concatenated transcription into separate lyric lines",()=>{
 const transcriptionWithMerge={...transcription,segments:[
  {startMs:1000,endMs:6000,text:"မင်းကိုချစ်တယ်ဒီနေ့နေရောင်"},
  {startMs:8200,endMs:11100,text:"အိပ်မက်တွေအားလုံး"}]};
 const output=suggestAutoSyncFromTranscript(lyrics,transcriptionWithMerge);
 assert.equal(output.matchedLines,1);
 assert.equal(output.skippedLines,2);
 assert.equal(output.suggestion.lines[0].entryIndex,3);
});
test("repeated choruses map to distinct segments in order",()=>{
 const repeated={version:2 as const,entries:[lyric("မင်းကိုချစ်တယ်"),lyric("ဒီနေ့နေရောင်"),lyric("မင်းကိုချစ်တယ်")]};
 const data={...transcription,segments:[
  {startMs:1000,endMs:3000,text:"မင်းကိုချစ်တယ်"},
  {startMs:5000,endMs:7000,text:"ဒီနေ့နေရောင်"},
  {startMs:9000,endMs:11000,text:"မင်းကိုချစ်တယ်"}]};
 const output=suggestAutoSyncFromTranscript(repeated,data);
 assert.deepEqual(output.suggestion.lines.map(x=>x.entryIndex),[0,1,2]);
 assert.deepEqual(output.suggestion.lines.map(x=>x.startMs),[1000,5000,9000]);
});
test("ambiguous single occurrence of repeated lyric is withheld",()=>{
 const repeated={version:2 as const,entries:[lyric("မင်းကိုချစ်တယ်"),lyric("ဒီနေ့နေရောင်"),lyric("မင်းကိုချစ်တယ်")]};
 const data={...transcription,segments:[
  {startMs:1000,endMs:3000,text:"မင်းကိုချစ်တယ်"},
  {startMs:5000,endMs:7000,text:"ဒီနေ့နေရောင်"}]};
 const output=suggestAutoSyncFromTranscript(repeated,data);
 assert.deepEqual(output.suggestion.lines.map(x=>x.entryIndex),[1]);
 assert.match(output.warnings.join(" "),/repeated lyrics/);
});
test("rejects invalid timestamps, recording IDs, unsafe sizes and bad thresholds",()=>{
 assert.throws(()=>suggestAutoSyncFromTranscript(lyrics,{...transcription,youtubeVideoId:"wrong"}),/Malformed/);
 assert.throws(()=>suggestAutoSyncFromTranscript(lyrics,{...transcription,segments:[
  {startMs:1000,endMs:2500,text:"ok"},{startMs:2499,endMs:2800,text:"ok"}]}),/overlapping/);
 assert.throws(()=>suggestAutoSyncFromTranscript(lyrics,transcription,{minSimilarity:.1}),/threshold/);
});

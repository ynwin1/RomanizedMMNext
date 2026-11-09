import type {LyricsV2} from "../domain/lyrics-v2.types";
import type {AutoSyncSuggestion} from "./auto-sync.contract";
import {AutoSyncSuggestionSchema} from "./auto-sync.contract";
import {lyricTimingFingerprint} from "./lyric-timing.fingerprint";
import {parseLyricsV2} from "./lyrics-v2.validation";
import {parseLyricTimingTrack} from "./lyric-timing.validation";

export interface RecognizedSegment {startMs:number;endMs:number;text:string}
export interface RecognitionReport {
  version:1;
  youtubeVideoId:string;
  languageHint:"my";
  segments:RecognizedSegment[];
}
export interface AutoSyncMatchReport {
  suggestion:AutoSyncSuggestion;
  totalLyricLines:number;
  matchedLines:number;
  skippedLines:number;
  warnings:string[];
}

/** Normalize script without altering Burmese code points or transliterating them to English. */
export function normalizedBurmese(text:string):string {
  return text.normalize("NFC").toLocaleLowerCase("en")
    .replace(/[\p{P}\p{S}\p{Z}\s]+/gu,"");
}

/** Character-bigram Dice; a lexical diagnostic, not an acoustic confidence score. */
export function lyricTextSimilarity(left:string,right:string):number {
  const a=normalizedBurmese(left),b=normalizedBurmese(right);
  if(a.length<4||b.length<4)return 0;
  if(a===b)return 1;
  const grams=(value:string)=>{
    const array=Array.from(value);
    const counts=new Map<string,number>();
    for(let i=0;i<array.length-1;i++){
      const gram=array[i]+array[i+1];
      counts.set(gram,(counts.get(gram)??0)+1);
    }
    return {counts,total:array.length-1};
  };
  const aa=grams(a),bb=grams(b);
  let intersection=0;
  for(const [gram,n] of aa.counts)intersection+=Math.min(n,bb.counts.get(gram)??0);
  return (2*intersection)/(aa.total+bb.total);
}
const MATCH_THRESHOLD=.82;
const MAX_LINES=500,MAX_SEGMENTS=1000;
function validateRecognition(input:unknown):RecognitionReport {
  if(!input||typeof input!=="object")throw Error("Missing transcription report");
  const value=input as Partial<RecognitionReport>;
  if(value.version!==1||value.languageHint!=="my"||typeof value.youtubeVideoId!=="string"||
    !/^[a-zA-Z0-9_-]{11}$/.test(value.youtubeVideoId)||!Array.isArray(value.segments)||
    value.segments.length>MAX_SEGMENTS)throw Error("Malformed transcription report");
  let lastEnd=-1;
  for(const segment of value.segments){
    if(!segment||!Number.isSafeInteger(segment.startMs)||!Number.isSafeInteger(segment.endMs)||
      segment.startMs<0||segment.endMs<=segment.startMs||segment.endMs>86_400_000||
      segment.startMs<lastEnd||typeof segment.text!=="string"||segment.text.length>2000)
      throw Error("Invalid, overlapping or out-of-order transcription segments");
    lastEnd=segment.endMs;
  }
  return value as RecognitionReport;
}
/**
 * A first-pass conservative sequence matcher. Works only when Whisper segments
 * each closely resemble ONE LyricsV2 line. Does not distribute a multi-line
 * Whisper segment, invent end times, infer phonetic matches, or use the video URL.
 */
export function suggestAutoSyncFromTranscript(
  lyricsInput:unknown,transcriptInput:unknown,options:{minSimilarity?:number}={},
):AutoSyncMatchReport {
  const lyrics:LyricsV2=parseLyricsV2(lyricsInput);
  const transcript=validateRecognition(transcriptInput);
  const minSimilarity=options.minSimilarity??MATCH_THRESHOLD;
  if(!Number.isFinite(minSimilarity)||minSimilarity<.7||minSimilarity>1)throw Error("Invalid similarity threshold");
  const lyricLines=lyrics.entries.flatMap((entry,index)=>entry.kind==="line"?[{entryIndex:index,text:entry.burmese}]:[]);
  if(lyricLines.length>MAX_LINES)throw Error("Too many lyric lines for experimental matcher");

  const segments=transcript.segments;
  const scores=lyricLines.map(line=>segments.map(segment=>lyricTextSimilarity(line.text,segment.text)));
  const repeated=new Map<string,number>();
  for(const line of lyricLines){
    const key=normalizedBurmese(line.text);
    repeated.set(key,(repeated.get(key)??0)+1);
  }
  const repeatedAvailable=new Map<string,number>();
  for(const [key,count] of repeated){
    if(count<=1)continue;
    repeatedAvailable.set(key,segments.filter(s=>lyricTextSimilarity(key,s.text)>=minSimilarity).length);
  }
  // Repeated lyric lines require sufficient distinct recognized instances:
  // otherwise choosing which chorus occurrence to time would be arbitrary.
  const eligible=lyricLines.map(line=>{
    const key=normalizedBurmese(line.text);
    return (repeated.get(key)??0)<=1||(repeatedAvailable.get(key)??0)>=(repeated.get(key)??0);
  });

  const n=lyricLines.length,m=segments.length;
  // Optimal *monotonic* weighted alignment; skipping lines/segments is allowed.
  // Match reward is positive only for sufficiently similar text.
  const dp=Array.from({length:n+1},()=>new Float64Array(m+1));
  const choice=Array.from({length:n+1},()=>new Uint8Array(m+1));
  for(let i=1;i<=n;i++){
    for(let j=1;j<=m;j++){
      let best=dp[i-1][j],direction=1;
      if(dp[i][j-1]>best){best=dp[i][j-1];direction=2;}
      const score=scores[i-1][j-1];
      if(eligible[i-1]&&score>=minSimilarity){
        const candidate=dp[i-1][j-1]+(score-minSimilarity+.01);
        if(candidate>best+1e-10){best=candidate;direction=3;}
      }
      dp[i][j]=best;choice[i][j]=direction;
    }
  }
  const matches:Array<{entryIndex:number;startMs:number;endMs:number;confidence:number}>=[];
  let i=n,j=m;
  while(i>0&&j>0){
    const move=choice[i][j];
    if(move===3){
      const score=scores[i-1][j-1];
      // Raw *text similarity*, NOT confidence that timings are correct.
      matches.push({entryIndex:lyricLines[i-1].entryIndex,startMs:segments[j-1].startMs,
        endMs:segments[j-1].endMs,confidence:Number(score.toFixed(3))});
      i--;j--;
    }else if(move===1)i--;
    else j--;
  }
  matches.reverse();
  const suggestion=AutoSyncSuggestionSchema.parse({
    version:1,youtubeVideoId:transcript.youtubeVideoId,
    lyricsFingerprint:lyricTimingFingerprint(lyrics),
    modelVersion:"whisper-segment-lexical-v1",lines:matches,
  });
  parseLyricTimingTrack({version:1,youtubeVideoId:suggestion.youtubeVideoId,
    lyricsFingerprint:suggestion.lyricsFingerprint,status:"draft",
    lines:suggestion.lines.map(({entryIndex,startMs,endMs})=>({entryIndex,startMs,endMs}))},lyrics);
  const warnings=[
    "Candidate timings use entire Whisper segments, not acoustically aligned word or lyric boundaries.",
    "The confidence field is text similarity only, not a calibrated timing probability.",
  ];
  if(lyricLines.some((line,index)=>!eligible[index]))
    warnings.push("Some repeated lyrics were omitted because there were too few distinct matching vocal segments.");
  if(suggestion.lines.length!==lyricLines.length)
    warnings.push("Unmatched lyric lines require another alignment method or manual review.");
  return {suggestion,totalLyricLines:n,matchedLines:matches.length,
    skippedLines:n-matches.length,warnings};
}

import type {LyricsV2} from "../domain/lyrics-v2.types";
import {evaluateAutoSync} from "./auto-sync.evaluate";
import type {AutoSyncSuggestion,AutoSyncReference} from "./auto-sync.contract";

export type BenchmarkVariant = "source" | "vocals";
export interface BenchmarkSample {
  mmid:number;
  lyrics:LyricsV2;
  reference:AutoSyncReference;
  source?:AutoSyncSuggestion;
  vocals?:AutoSyncSuggestion;
  /** Optional independently observed editing time for this recording (in minutes). */
  manualMinutes?:number;
  assistedMinutes?:number;
}
export interface VariantMetrics {
  evaluatedSongs:number;
  referenceLines:number;
  predictedLines:number;
  coverage:number;
  startWithin1s:number;
  endWithin1s:number;
  bothWithin1s:number;
  meanAbsoluteStartErrorMs:number|null;
  meanAbsoluteEndErrorMs:number|null;
}
export interface LineFailure {
  mmid:number;
  youtubeVideoId:string;
  variant:BenchmarkVariant;
  entryIndex:number;
  startErrorMs:number|null;
  endErrorMs:number|null;
}
export interface AutoSyncDatasetReport {
  version:1;
  numberOfSongs:number;
  source:VariantMetrics;
  vocals:VariantMetrics;
  pairedSongs:number;
  pairedSource:VariantMetrics;
  pairedVocals:VariantMetrics;
  editingTime:{measuredSongs:number;manualMinutes:number;assistedMinutes:number;savingsRatio:number|null};
  decision:"insufficient_evidence"|"investigate_alignment"|"candidate_for_review";
  notes:string[];
  worstLines:LineFailure[];
}
type InternalAggregate={
  evaluatedSongs:number;referenceLines:number;predictedLines:number;
  startCorrect:number;endCorrect:number;bothCorrect:number;
  startAbsoluteSum:number;endAbsoluteSum:number;
};
function aggregate():InternalAggregate{
  return {evaluatedSongs:0,referenceLines:0,predictedLines:0,
    startCorrect:0,endCorrect:0,bothCorrect:0,startAbsoluteSum:0,endAbsoluteSum:0};
}
function add(agg:InternalAggregate,metrics:ReturnType<typeof evaluateAutoSync>){
  agg.evaluatedSongs++;agg.referenceLines+=metrics.totalLines;agg.predictedLines+=metrics.predictedLines;
  // Denominator is ALL reference lines; unpredicted lines count as incorrect.
  agg.startCorrect+=metrics.startWithin1s*metrics.totalLines;
  agg.endCorrect+=metrics.endWithin1s*metrics.totalLines;
  agg.bothCorrect+=metrics.bothWithin1s*metrics.totalLines;
  agg.startAbsoluteSum+=(metrics.meanAbsoluteStartErrorMs??0)*metrics.predictedLines;
  agg.endAbsoluteSum+=(metrics.meanAbsoluteEndErrorMs??0)*metrics.predictedLines;
}
function summarize(agg:InternalAggregate):VariantMetrics{
  const n=agg.referenceLines,p=agg.predictedLines;
  return {evaluatedSongs:agg.evaluatedSongs,referenceLines:n,predictedLines:p,
    coverage:n?p/n:0,startWithin1s:n?agg.startCorrect/n:0,
    endWithin1s:n?agg.endCorrect/n:0,bothWithin1s:n?agg.bothCorrect/n:0,
    meanAbsoluteStartErrorMs:p?agg.startAbsoluteSum/p:null,
    meanAbsoluteEndErrorMs:p?agg.endAbsoluteSum/p:null};
}
const isPositive=(value:number)=>Number.isFinite(value)&&value>0;
export function evaluateAutoSyncDataset(samples:BenchmarkSample[]):AutoSyncDatasetReport{
  if(!Array.isArray(samples)||samples.length===0||samples.length>100)
    throw Error("Provide 1–100 benchmark recordings");
  const totals={source:aggregate(),vocals:aggregate()};
  const paired={source:aggregate(),vocals:aggregate()};
  const seen=new Set<string>();
  const worstLines:LineFailure[]=[];
  let manualMinutes=0,assistedMinutes=0,measuredSongs=0,pairedSongs=0;
  for(const sample of samples){
    if(!Number.isSafeInteger(sample.mmid)||sample.mmid<=0)throw Error("Invalid benchmark song ID");
    const id=`${sample.mmid}:${sample.reference?.youtubeVideoId}`;
    if(seen.has(id))throw Error("Duplicate benchmark song and recording");
    seen.add(id);
    if(!sample.source&&!sample.vocals)throw Error("At least one variant must be provided per recording");
    if((sample.manualMinutes===undefined)!==(sample.assistedMinutes===undefined))
      throw Error("Both manual and assisted editing times must be supplied");
    if(sample.manualMinutes!==undefined&&sample.assistedMinutes!==undefined){
      if(!isPositive(sample.manualMinutes)||!Number.isFinite(sample.assistedMinutes)||sample.assistedMinutes<0)
        throw Error("Invalid editing time measurements");
      manualMinutes+=sample.manualMinutes;assistedMinutes+=sample.assistedMinutes;measuredSongs++;
    }
    const isPaired=Boolean(sample.source&&sample.vocals);
    if(isPaired)pairedSongs++;
    for(const variant of ["source","vocals"] as const){
      const suggestion=sample[variant];
      if(!suggestion)continue;
      const metrics=evaluateAutoSync(sample.lyrics,sample.reference,suggestion);
      add(totals[variant],metrics);
      if(isPaired)add(paired[variant],metrics);
      const reference=new Map(sample.reference.lines.map(l=>[l.entryIndex,l]));
      const predicted=new Map(suggestion.lines.map(l=>[l.entryIndex,l]));
      for(const [entryIndex,actual] of reference){
        const estimate=predicted.get(entryIndex);
        worstLines.push({
          mmid:sample.mmid,youtubeVideoId:sample.reference.youtubeVideoId,variant,entryIndex,
          startErrorMs:estimate?Math.abs(estimate.startMs-actual.startMs):null,
          endErrorMs:estimate?Math.abs(estimate.endMs-actual.endMs):null,
        });
      }
    }
  }
  worstLines.sort((a,b)=>{
    const error=(line:LineFailure)=>line.startErrorMs===null||line.endErrorMs===null?
      Number.POSITIVE_INFINITY:Math.max(line.startErrorMs,line.endErrorMs);
    return error(b)-error(a);
  });
  const source=summarize(totals.source),vocals=summarize(totals.vocals);
  const pairedSource=summarize(paired.source),pairedVocals=summarize(paired.vocals);
  const savingsRatio=measuredSongs?1-assistedMinutes/manualMinutes:null;
  const adequate=samples.length>=5&&pairedSongs>=5&&measuredSongs>=5;
  const eligible=(m:VariantMetrics)=>m.evaluatedSongs>=5&&m.startWithin1s>=.9&&m.endWithin1s>=.85;
  const decision=!adequate?"insufficient_evidence":
    ((eligible(pairedSource)||eligible(pairedVocals))&&savingsRatio!==null&&savingsRatio>=.5)
      ?"candidate_for_review":"investigate_alignment";
  return {
    version:1,numberOfSongs:samples.length,source,vocals,pairedSongs,
    pairedSource,pairedVocals,
    editingTime:{measuredSongs,manualMinutes,assistedMinutes,savingsRatio},
    decision,
    notes:[
      "Accuracy fractions include ALL reference lyric lines; absent predictions count as incorrect.",
      "Mean absolute errors apply only to predicted lines and must be interpreted alongside coverage.",
      "Compare pairedSource with pairedVocals; unmatched song sets are not an apples-to-apples comparison.",
      "This benchmark cannot establish model safety or correct audio/video offset without editorial verification.",
      "Candidate for review is NOT an authorization to auto-publish timestamps.",
    ],
    worstLines:worstLines.slice(0,25),
  };
}

import type {LyricsV2} from "../domain/lyrics-v2.types";
import {validateAutoSyncPair,type AutoSyncReference,type AutoSyncSuggestion} from "./auto-sync.contract";

export interface AutoSyncBenchmark {
  totalLines:number;
  predictedLines:number;
  coverage:number;
  startWithin1s:number;
  endWithin1s:number;
  bothWithin1s:number;
  meanAbsoluteStartErrorMs:number|null;
  meanAbsoluteEndErrorMs:number|null;
  /** Largest absolute error on a matched line boundary, in milliseconds. */
  maxBoundaryErrorMs:number|null;
}

/** Score against independent, manually checked ground truth; no AI-invented confidence is used as a truth label. */
export function evaluateAutoSync(
  lyrics:LyricsV2,
  referenceInput:AutoSyncReference,
  suggestionInput:AutoSyncSuggestion,
  toleranceMs=1000,
):AutoSyncBenchmark{
  if(!Number.isSafeInteger(toleranceMs)||toleranceMs<0)throw new Error("Invalid tolerance");
  const {reference,suggestion}=validateAutoSyncPair(lyrics,referenceInput,suggestionInput);
  const truth=new Map(reference.lines.map(line=>[line.entryIndex,line]));
  let totalStart=0,totalEnd=0,maxBoundaryError=0,startWithin1s=0,endWithin1s=0,bothWithin1s=0;
  for(const prediction of suggestion.lines){
    const actual=truth.get(prediction.entryIndex);
    if(!actual)throw new Error("No reference for predicted entry");
    const start=Math.abs(prediction.startMs-actual.startMs);
    const end=Math.abs(prediction.endMs-actual.endMs);
    totalStart+=start;totalEnd+=end;maxBoundaryError=Math.max(maxBoundaryError,start,end);
    if(start<=toleranceMs)startWithin1s++;
    if(end<=toleranceMs)endWithin1s++;
    if(start<=toleranceMs&&end<=toleranceMs)bothWithin1s++;
  }
  const totalLines=reference.lines.length;
  const predictedLines=suggestion.lines.length;
  return {
    totalLines,predictedLines,
    coverage:totalLines?predictedLines/totalLines:0,
    startWithin1s:totalLines?startWithin1s/totalLines:0,
    endWithin1s:totalLines?endWithin1s/totalLines:0,
    bothWithin1s:totalLines?bothWithin1s/totalLines:0,
    meanAbsoluteStartErrorMs:predictedLines?totalStart/predictedLines:null,
    meanAbsoluteEndErrorMs:predictedLines?totalEnd/predictedLines:null,
    maxBoundaryErrorMs:predictedLines?maxBoundaryError:null,
  };
}

import type {MoodId} from "../domain/moodometer.types";
import {MOOD_IDS} from "../domain/moodometer.types";
import type {MoodometerAnalysis} from "../domain/moodometer.types";

export type MoodDiscoveryCandidate = {mmid:number;analysis:MoodometerAnalysis};
export function isMoodId(value:string):value is MoodId {
  return (MOOD_IDS as readonly string[]).includes(value);
}
/** Pick highest relevant scores, excluding drafts and duplicate songs. */
export function rankMoodCandidates(candidates:MoodDiscoveryCandidate[],mood:MoodId,limit=24) {
  const seen=new Set<number>();
  return candidates
    .filter(item=>item.analysis.status==="published" && item.analysis.moods.some(m=>m.moodId===mood))
    .sort((a,b)=>(b.analysis.moods.find(m=>m.moodId===mood)?.score??0)-(a.analysis.moods.find(m=>m.moodId===mood)?.score??0))
    .filter(item=>{if(seen.has(item.mmid))return false;seen.add(item.mmid);return true})
    .slice(0,limit)
    .map(item=>({mmid:item.mmid,score:item.analysis.moods.find(m=>m.moodId===mood)!.score}));
}

import { z } from "zod";
import { MOOD_IDS } from "../domain/moodometer.types";

const Score = z.object({moodId:z.enum(MOOD_IDS),score:z.number().finite().min(0).max(10)}).strict();
export const EvaluationCaseSchema = z.object({
  id:z.string().min(1),
  expectedMoods:z.array(z.enum(MOOD_IDS)).min(1).max(3),
  predictedMoods:z.array(Score).length(3),
}).strict();
export type EvaluationCase = z.infer<typeof EvaluationCaseSchema>;

export function evaluateMoodometer(input:unknown) {
  const cases=z.array(EvaluationCaseSchema).min(1).parse(input);
  const ids=new Set<string>();
  let matched=0, expected=0, topOne=0;
  const counts:Record<string,number>={};
  let high=0, total=0, sum=0, sumSq=0;
  for(const item of cases) {
    if(ids.has(item.id))throw new Error("Duplicate evaluation case ID: "+item.id);
    ids.add(item.id);
    if(new Set(item.expectedMoods).size!==item.expectedMoods.length)throw new Error("Duplicate expected mood");
    if(new Set(item.predictedMoods.map(m=>m.moodId)).size!==3)throw new Error("Duplicate predicted mood");
    for(let i=1;i<item.predictedMoods.length;i++) {
      if(item.predictedMoods[i].score>item.predictedMoods[i-1].score) throw new Error("Predictions must be ranked");
    }
    const predicted=new Set(item.predictedMoods.map(m=>m.moodId));
    matched+=item.expectedMoods.filter(m=>predicted.has(m)).length;
    expected+=item.expectedMoods.length;
    topOne+=Number(item.expectedMoods.includes(item.predictedMoods[0].moodId));
    for(const m of item.predictedMoods) {
      counts[m.moodId]=(counts[m.moodId]??0)+1;
      high+=Number(m.score>=9);
      total++;sum+=m.score;sumSq+=m.score*m.score;
    }
  }
  const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  return {
    songs:cases.length,
    expectedMoodRecall:Number((matched/expected).toFixed(3)),
    topMoodAgreement:Number((topOne/cases.length).toFixed(3)),
    averageScore:Number((sum/total).toFixed(2)),
    scoreStdDev:Number(Math.sqrt(Math.max(0,sumSq/total-(sum/total)**2)).toFixed(2)),
    highScoreShare:Number((high/total).toFixed(3)),
    distinctMoods:Object.keys(counts).length,
    mostCommonMood:dominant?.[0]??null,
    mostCommonMoodShare:Number(((dominant?.[1]??0)/cases.length).toFixed(3)),
    moodCounts:counts,
    cautions:[
      ...(cases.length<20?["Small sample: evaluate at least 20 editor-reviewed songs before trusting aggregate results."]:[]),
      ...(high/total>0.6?["Scores clustered at 9+: review the model calibration."]:[]),
      ...((dominant?.[1]??0)/cases.length>0.75?["One mood dominates more than 75% of songs: inspect taxonomy and sampling."]:[]),
    ],
  };
}

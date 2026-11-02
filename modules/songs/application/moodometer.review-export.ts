import type { MoodometerRecord } from "./moodometer.service";
import type { EvaluationCase } from "./moodometer.evaluation";

/** Generates an editor-review template; no reference moods are invented. */
export function createMoodometerReviewTemplate(records: MoodometerRecord[]): Array<Omit<EvaluationCase, "expectedMoods"> & {expectedMoods: []}> {
  const seen = new Set<number>();
  return records.filter(record => {
    if (record.analysis.status !== "published" || seen.has(record.mmid)) return false;
    seen.add(record.mmid);
    return true;
  }).map(record => ({
    id: `song-${record.mmid}`,
    expectedMoods: [],
    predictedMoods: record.analysis.moods.map(m => ({moodId:m.moodId,score:m.score})),
  }));
}

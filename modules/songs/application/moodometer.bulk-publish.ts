import type {MoodometerAnalysis} from "../domain/moodometer.types";

/**
 * Generate and publish in that order. Saving first preserves an editable draft if
 * publication fails, so the admin can review/recover it from the song editor.
 */
export async function generateAndPublishMissingMoodometer(
  mmid: number,
  operations: {
    generate: (mmid: number) => Promise<MoodometerAnalysis>;
    saveDraft: (mmid: number, analysis: MoodometerAnalysis) => Promise<{id: string}>;
    publish: (mmid: number, id: string) => Promise<unknown>;
  },
): Promise<{mmid: number; recordId: string}> {
  const draft = await operations.generate(mmid);
  const saved = await operations.saveDraft(mmid, draft);
  const published = await operations.publish(mmid, saved.id);
  if (!published) throw new Error("Moodometer analysis was saved but not published. Review the draft in the song editor.");
  return {mmid, recordId: saved.id};
}

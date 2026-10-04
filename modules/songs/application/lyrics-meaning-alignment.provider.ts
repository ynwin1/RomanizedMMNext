import type { MeaningAlignmentInput, MeaningAlignmentResult } from "../domain/lyrics-meaning-alignment.types";

export interface LyricsMeaningAlignmentProvider {
  alignMeaning(input: MeaningAlignmentInput): Promise<MeaningAlignmentResult>;
}

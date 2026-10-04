import type {
  LyricSourceLine,
  RomanizationReference,
} from "../domain/content-generation.types";

export interface RomanizationReferenceProvider {
  findRelevantReferences(
    lines: LyricSourceLine[],
  ): Promise<RomanizationReference[]>;
}

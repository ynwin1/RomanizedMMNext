import type {
  EditorialGenerationInput,
  EditorialGenerationResult,
  LineGenerationResult,
  LyricGenerationInput,
  RomanizationGenerationInput,
  RomanizationReviewInput,
} from "../domain/content-generation.types";

export interface ContentGenerationProvider {
  romanize(input: RomanizationGenerationInput): Promise<LineGenerationResult>;
  reviewRomanization(input: RomanizationReviewInput): Promise<LineGenerationResult>;
  translateMeaning(input: LyricGenerationInput): Promise<LineGenerationResult>;
  generateEditorialMetadata(input: EditorialGenerationInput): Promise<EditorialGenerationResult>;
}

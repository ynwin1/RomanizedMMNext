import type {
  EditorialGenerationInput,
  EditorialGenerationResult,
  LineGenerationResult,
  LyricGenerationInput,
} from "../domain/content-generation.types";

export interface ContentGenerationProvider {
  romanize(input: LyricGenerationInput): Promise<LineGenerationResult>;
  translateMeaning(input: LyricGenerationInput): Promise<LineGenerationResult>;
  generateEditorialMetadata(input: EditorialGenerationInput): Promise<EditorialGenerationResult>;
}

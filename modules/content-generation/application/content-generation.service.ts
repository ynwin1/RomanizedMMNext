import type { ContentGenerationProvider } from "./content-generation.provider";
import {
  EditorialGenerationInputSchema,
  EditorialGenerationResultSchema,
  LineGenerationResultSchema,
  LyricGenerationInputSchema,
} from "./content-generation.validation";
import { InvalidGeneratedContentError } from "./content-generation.error";
import type {
  EditorialGenerationInput,
  EditorialGenerationResult,
  LineGenerationResult,
  LyricGenerationInput,
} from "../domain/content-generation.types";

export class ContentGenerationService {
  constructor(private readonly provider: ContentGenerationProvider) {}

  async romanize(input: LyricGenerationInput): Promise<LineGenerationResult> {
    const validatedInput = LyricGenerationInputSchema.parse(input);
    const generated = await this.provider.romanize(validatedInput);
    return this.validateLines(generated);
  }

  async translateMeaning(input: LyricGenerationInput): Promise<LineGenerationResult> {
    const validatedInput = LyricGenerationInputSchema.parse(input);
    const generated = await this.provider.translateMeaning(validatedInput);
    return this.validateLines(generated);
  }

  async generateEditorialMetadata(input: EditorialGenerationInput): Promise<EditorialGenerationResult> {
    const validatedInput = EditorialGenerationInputSchema.parse(input);
    const generated = await this.provider.generateEditorialMetadata(validatedInput);
    const parsed = EditorialGenerationResultSchema.safeParse(generated);
    if (!parsed.success) throw new InvalidGeneratedContentError();
    return parsed.data;
  }

  private validateLines(generated: unknown): LineGenerationResult {
    const parsed = LineGenerationResultSchema.safeParse(generated);
    if (!parsed.success) throw new InvalidGeneratedContentError();
    return parsed.data;
  }
}

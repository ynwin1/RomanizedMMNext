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
    return this.validateAlignedLines(validatedInput, generated);
  }

  async translateMeaning(input: LyricGenerationInput): Promise<LineGenerationResult> {
    const validatedInput = LyricGenerationInputSchema.parse(input);
    const generated = await this.provider.translateMeaning(validatedInput);
    return this.validateAlignedLines(validatedInput, generated);
  }

  async generateEditorialMetadata(input: EditorialGenerationInput): Promise<EditorialGenerationResult> {
    const validatedInput = EditorialGenerationInputSchema.parse(input);
    const generated = await this.provider.generateEditorialMetadata(validatedInput);
    const parsed = EditorialGenerationResultSchema.safeParse(generated);
    if (!parsed.success) throw new InvalidGeneratedContentError();
    return parsed.data;
  }

  private validateAlignedLines(
    input: LyricGenerationInput,
    generated: unknown,
  ): LineGenerationResult {
    const parsed = LineGenerationResultSchema.safeParse(generated);
    if (!parsed.success) throw new InvalidGeneratedContentError();

    if (parsed.data.lines.length !== input.lines.length) {
      throw new InvalidGeneratedContentError("Generated lyric line count did not match the source.");
    }

    parsed.data.lines.forEach((line, position) => {
      const source = input.lines[position];
      if (!source || line.index !== source.index) {
        throw new InvalidGeneratedContentError("Generated lyric line indexes did not match the source.");
      }
      if (source.text === "" && line.text !== "") {
        throw new InvalidGeneratedContentError("Generated lyrics did not preserve a blank source line.");
      }
      if (source.text !== "" && line.text.trim() === "") {
        throw new InvalidGeneratedContentError("Generated lyrics contained an empty result for a non-empty source line.");
      }
    });

    return parsed.data;
  }
}

import type { ContentGenerationProvider } from "./content-generation.provider";
import {
  EditorialGenerationInputSchema,
  EditorialGenerationResultSchema,
  LineGenerationResultSchema,
  LyricGenerationInputSchema,
  RomanizationGenerationInputSchema,
  RomanizationReviewInputSchema,
} from "./content-generation.validation";
import {
  GeneratedContentQualityError,
  InvalidGeneratedContentError,
} from "./content-generation.error";
import {
  evaluateEditorialContent,
  evaluateGeneratedLines,
} from "./content-generation-quality";
import type {
  EditorialGenerationInput,
  EditorialGenerationResult,
  LineGenerationResult,
  LyricGenerationInput,
  RomanizationGenerationInput,
  RomanizationReviewInput,
} from "../domain/content-generation.types";

export class ContentGenerationService {
  constructor(private readonly provider: ContentGenerationProvider) {}

  async romanize(input: RomanizationGenerationInput): Promise<LineGenerationResult> {
    const validatedInput = RomanizationGenerationInputSchema.parse(input);
    const generated = await this.provider.romanize(validatedInput);
    const aligned = this.validateAlignedLines(validatedInput, generated);
    this.validateRomanizationQuality(aligned);
    return aligned;
  }

  async reviewRomanization(input: RomanizationReviewInput): Promise<LineGenerationResult> {
    const validatedInput = RomanizationReviewInputSchema.parse(input);
    const generated = await this.provider.reviewRomanization(validatedInput);
    const aligned = this.validateAlignedLines(validatedInput, generated);
    this.validateRomanizationQuality(aligned);
    return aligned;
  }

  async translateMeaning(input: LyricGenerationInput): Promise<LineGenerationResult> {
    const validatedInput = LyricGenerationInputSchema.parse(input);
    const generated = await this.provider.translateMeaning(validatedInput);
    const aligned = this.validateAlignedLines(validatedInput, generated);
    const quality = evaluateGeneratedLines("meaning", aligned.lines);
    if (!quality.valid) throw new GeneratedContentQualityError(quality.issues);
    return aligned;
  }

  async generateEditorialMetadata(input: EditorialGenerationInput): Promise<EditorialGenerationResult> {
    const validatedInput = EditorialGenerationInputSchema.parse(input);
    const generated = await this.provider.generateEditorialMetadata(validatedInput);
    const parsed = EditorialGenerationResultSchema.safeParse(generated);
    if (!parsed.success) throw new InvalidGeneratedContentError();

    const quality = evaluateEditorialContent(parsed.data);
    if (!quality.valid) throw new GeneratedContentQualityError(quality.issues);
    return parsed.data;
  }

  private validateRomanizationQuality(result: LineGenerationResult) {
    const quality = evaluateGeneratedLines("romanized", result.lines);
    if (!quality.valid) throw new GeneratedContentQualityError(quality.issues);
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

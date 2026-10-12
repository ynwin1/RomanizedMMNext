import type { ContentGenerationProvider } from "./content-generation.provider";
import {
  EditorialGenerationInputSchema,
  EditorialGenerationResultSchema,
  LineGenerationResultSchema,
  LyricGenerationInputSchema,
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
} from "../domain/content-generation.types";

export class ContentGenerationService {
  constructor(
    private readonly provider: ContentGenerationProvider,
    private readonly references?: {
      findRelevant(lines: string[], options: { recentSongs: number; maxReferences: number }): Promise<Array<{ burmese: string; romanized: string }>>;
      refineGenerated?(source: Array<{index: number; text: string}>, generated: Array<{index: number; text: string}>): Promise<{
        lines: Array<{index: number; text: string}>;
        changes: Array<{index: number; kind: string; original: string; corrected: string}>;
      }>;
    },
  ) {}

  async romanize(input: LyricGenerationInput): Promise<LineGenerationResult> {
    const validatedInput = LyricGenerationInputSchema.parse(input);
    // This path is shared by ingestion and direct admin song generation.
    // Reference lookup is read-only and only occurs when Romanization is requested.
    let examples: Array<{ burmese: string; romanized: string }> = [];
    if (this.references) {
      try {
        examples = await this.references.findRelevant(validatedInput.lines.map(line => line.text), { recentSongs: 7, maxReferences: 12 });
      } catch {
        // Reference retrieval is best-effort: an unavailable catalogue must not block song generation.
        examples = [];
      }
    }
    const generated = await this.provider.romanize({
      ...validatedInput,
      ...(examples.length ? { references: examples.map(({ burmese, romanized }) => ({ burmese, romanized })) } : {}),
    });
    let aligned = this.validateAlignedLines(validatedInput, generated);
    const quality = evaluateGeneratedLines("romanized", aligned.lines);
    if (!quality.valid) throw new GeneratedContentQualityError(quality.issues);
    if (this.references?.refineGenerated) {
      try {
        const refined = await this.references.refineGenerated(validatedInput.lines, aligned.lines);
        // Never permit a refinement to break the line alignment or lyric contract.
        const checked = this.validateAlignedLines(validatedInput, {lines: refined.lines});
        if (evaluateGeneratedLines("romanized", checked.lines).valid) aligned = checked;
      } catch {
        // Reference refinement is best effort; validated AI output stays available.
      }
    }
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

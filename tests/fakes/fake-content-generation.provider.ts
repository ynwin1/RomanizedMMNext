import type {
  ContentGenerationProvider,
  EditorialGenerationInput,
  EditorialGenerationResult,
  LineGenerationResult,
  LyricGenerationInput,
  RomanizationGenerationInput,
  RomanizationReviewInput,
} from "@/modules/content-generation";

export class FakeContentGenerationProvider implements ContentGenerationProvider {
  romanizationCalls = 0;
  romanizationReviewCalls = 0;
  meaningCalls = 0;
  editorialCalls = 0;

  constructor(private readonly overrides: {
    romanized?: LineGenerationResult;
    reviewedRomanized?: LineGenerationResult;
    meaning?: LineGenerationResult;
    editorial?: EditorialGenerationResult;
  } = {}) {}

  async romanize(input: RomanizationGenerationInput): Promise<LineGenerationResult> {
    this.romanizationCalls++;
    return this.overrides.romanized ?? {
      lines: input.lines.map(line => ({
        index: line.index,
        text: line.text === "" ? "" : "Romanized:" + line.index,
      })),
    };
  }

  async reviewRomanization(input: RomanizationReviewInput): Promise<LineGenerationResult> {
    this.romanizationReviewCalls++;
    return this.overrides.reviewedRomanized ?? {
      lines: input.romanizedLines.map(line => ({ ...line })),
    };
  }

  async translateMeaning(input: LyricGenerationInput): Promise<LineGenerationResult> {
    this.meaningCalls++;
    return this.overrides.meaning ?? {
      lines: input.lines.map(line => ({
        index: line.index,
        text: line.text === "" ? "" : "Meaning:" + line.index,
      })),
    };
  }

  async generateEditorialMetadata(_input: EditorialGenerationInput): Promise<EditorialGenerationResult> {
    this.editorialCalls++;
    return this.overrides.editorial ?? {
      about: "Deterministic test about text.",
      whenToListen: "Deterministic test listening context.",
    };
  }
}

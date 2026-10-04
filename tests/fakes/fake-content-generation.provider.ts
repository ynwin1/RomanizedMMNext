import type {
  ContentGenerationProvider,
  EditorialGenerationInput,
  EditorialGenerationResult,
  LineGenerationResult,
  LyricGenerationInput,
} from "@/modules/content-generation";

export class FakeContentGenerationProvider implements ContentGenerationProvider {
  romanizationCalls = 0;
  meaningCalls = 0;
  editorialCalls = 0;

  constructor(private readonly overrides: {
    romanized?: LineGenerationResult;
    meaning?: LineGenerationResult;
    editorial?: EditorialGenerationResult;
  } = {}) {}

  async romanize(input: LyricGenerationInput): Promise<LineGenerationResult> {
    this.romanizationCalls++;
    return this.overrides.romanized ?? {
      lines: input.lines.map(line => ({
        index: line.index,
        text: line.text === "" ? "" : "romanized:" + line.text,
      })),
    };
  }

  async translateMeaning(input: LyricGenerationInput): Promise<LineGenerationResult> {
    this.meaningCalls++;
    return this.overrides.meaning ?? {
      lines: input.lines.map(line => ({
        index: line.index,
        text: line.text === "" ? "" : "meaning:" + line.text,
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

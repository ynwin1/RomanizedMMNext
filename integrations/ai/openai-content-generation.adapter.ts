import {
  EditorialGenerationResultSchema,
  LineGenerationResultSchema,
  type ContentGenerationProvider,
  type EditorialGenerationInput,
  type EditorialGenerationResult,
  type LineGenerationResult,
  type LyricGenerationInput,
  type RomanizationGenerationInput,
  type RomanizationReviewInput,
} from "@/modules/content-generation";
import { ContentGenerationProviderError } from "@/modules/content-generation";
import { OpenAIResponsesClient } from "./openai-responses.client";

const lineResultJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    lines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          text: { type: "string" },
        },
        required: ["index", "text"],
      },
    },
  },
  required: ["lines"],
} as const;

const editorialJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    about: { type: "string" },
    whenToListen: { type: "string" },
  },
  required: ["about", "whenToListen"],
} as const;

function parseLineResult(value: unknown): LineGenerationResult {
  const parsed = LineGenerationResultSchema.safeParse(value);
  if (!parsed.success) {
    throw new ContentGenerationProviderError(
      "OpenAI output did not match the lyric-line contract.",
      true,
      "invalid_contract",
    );
  }
  return parsed.data;
}

export class OpenAIContentGenerationAdapter implements ContentGenerationProvider {
  constructor(private readonly client: OpenAIResponsesClient) {}

  async romanize(input: RomanizationGenerationInput): Promise<LineGenerationResult> {
    return parseLineResult(await this.client.generateStructured({
      schemaName: "romanized_lyrics",
      schema: lineResultJsonSchema,
      instructions: [
        "Romanize Burmese song lyrics for RomanizedMM.",
        "Return exactly one output line for every input line.",
        "Keep every input index unchanged and in the same order.",
        "Preserve blank lines as blank text.",
        "Every sentence must begin with a capital letter.",
        "Approved references are taken from recently published RomanizedMM songs and represent the site's preferred romanization style.",
        "For exact or overlapping Burmese phrases, strongly prefer the approved spelling shown in the references unless the current context clearly requires a different pronunciation.",
        "For merely similar references, use them as style evidence and do not copy unrelated words.",
        "Reference English meanings may be used only to disambiguate Burmese segmentation or pronunciation.",
        "Preserve section labels, interjections, names, and intentional English text rather than inventing content.",
        "Do not translate meaning. Do not add commentary.",
      ].join(" "),
      input: JSON.stringify({
        lines: input.lines,
        references: input.references ?? [],
      }),
    }));
  }

  async reviewRomanization(input: RomanizationReviewInput): Promise<LineGenerationResult> {
    return parseLineResult(await this.client.generateStructured({
      schemaName: "reviewed_romanized_lyrics",
      schema: lineResultJsonSchema,
      instructions: [
        "Review and correct a proposed RomanizedMM romanization.",
        "Return exactly one output line for every source line.",
        "Keep every input index unchanged and in the same order.",
        "Preserve blank lines as blank text.",
        "Every sentence must begin with a capital letter.",
        "Use the Burmese source as authoritative content and the English meaning as semantic context.",
        "Approved references come from recently published RomanizedMM songs and are the preferred spelling precedent for matching Burmese words and phrases.",
        "Correct inconsistent spelling, segmentation, or pronunciation when the approved references or Burmese meaning indicate a better RomanizedMM rendering.",
        "Prefer exact and phrase references over merely similar references.",
        "Do not rewrite lines just for stylistic variety when the proposed romanization is already consistent with the references.",
        "Do not translate, omit, add, or reorder lyric content.",
        "Return only the corrected romanization lines.",
      ].join(" "),
      input: JSON.stringify({
        lines: input.lines,
        romanizedLines: input.romanizedLines,
        meaningLines: input.meaningLines,
        references: input.references ?? [],
      }),
    }));
  }

  async translateMeaning(input: LyricGenerationInput): Promise<LineGenerationResult> {
    return parseLineResult(await this.client.generateStructured({
      schemaName: "english_meaning",
      schema: lineResultJsonSchema,
      instructions: [
        "Translate Burmese song lyrics into natural concise English meaning for RomanizedMM.",
        "Return exactly one output line for every input line.",
        "Keep every input index unchanged and in the same order.",
        "Preserve blank lines as blank text.",
        "Every sentence must begin with a capital letter.",
        "Preserve section labels and interjections where appropriate.",
        "Do not romanize. Do not add commentary outside the corresponding line.",
      ].join(" "),
      input: JSON.stringify({ lines: input.lines }),
    }));
  }

  async generateEditorialMetadata(input: EditorialGenerationInput): Promise<EditorialGenerationResult> {
    const generated = await this.client.generateStructured({
      schemaName: "song_editorial_metadata",
      schema: editorialJsonSchema,
      instructions: [
        "Write editorial metadata for RomanizedMM based only on the supplied song context and lyrics.",
        "about must be exactly one concise line with no line breaks and should briefly describe the song's themes or emotional content without inventing factual history.",
        "whenToListen must be exactly one concise line with no line breaks describing situations or moods where the song fits.",
        "Use the English meaning as the primary semantic reference when it is provided.",
        "Romanization is pronunciation context only, not a source of new facts.",
        "Do not invent release dates, albums, artist facts, awards, or external metadata.",
      ].join(" "),
      input: JSON.stringify({
        songName: input.songName,
        artistNames: input.artistNames,
        lines: input.lines,
        romanizedLines: input.romanizedLines,
        meaningLines: input.meaningLines,
      }),
    });

    const parsed = EditorialGenerationResultSchema.safeParse(generated);
    if (!parsed.success) {
      throw new ContentGenerationProviderError(
        "OpenAI output did not match the editorial contract.",
        true,
        "invalid_contract",
      );
    }
    return parsed.data;
  }
}

export function createOpenAIContentGenerationAdapter(environment: NodeJS.ProcessEnv = process.env) {
  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for content generation.");

  return new OpenAIContentGenerationAdapter(new OpenAIResponsesClient({
    apiKey,
    model: environment.OPENAI_CONTENT_MODEL?.trim() || "gpt-5",
  }));
}

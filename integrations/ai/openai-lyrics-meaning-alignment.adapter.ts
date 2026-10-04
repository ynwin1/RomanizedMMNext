import { z } from "zod";
import type { LyricsMeaningAlignmentProvider } from "@/modules/songs/application/lyrics-meaning-alignment.provider";
import type { MeaningAlignmentInput, MeaningAlignmentResult } from "@/modules/songs/domain/lyrics-meaning-alignment.types";
import { OpenAIResponsesClient } from "./openai-responses.client";

const schema = {
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
          meaning: { type: "string" },
          source: { type: "string", enum: ["reused", "generated"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["index", "meaning", "source", "confidence"],
      },
    },
  },
  required: ["lines"],
} as const;

const ResultSchema = z.object({
  lines: z.array(z.object({
    index: z.number().int().min(0),
    meaning: z.string(),
    source: z.enum(["reused", "generated"]),
    confidence: z.enum(["high", "medium", "low"]),
  }).strict()),
}).strict();

export class OpenAILyricsMeaningAlignmentAdapter implements LyricsMeaningAlignmentProvider {
  constructor(private readonly client: OpenAIResponsesClient) {}

  async alignMeaning(input: MeaningAlignmentInput): Promise<MeaningAlignmentResult> {
    const generated = await this.client.generateStructured({
      schemaName: "lyrics_migration_meaning_alignment",
      schema,
      instructions: [
        "Align legacy English meaning lines to an immutable Burmese + Romanized lyric backbone for RomanizedMM.",
        "Return exactly one output object for every protected lyric row, preserving each row index and order.",
        "Never rewrite, normalize, or infer Burmese or Romanized text. They are context only and are not part of your output.",
        "Reuse an existing legacy Meaning line verbatim whenever it clearly matches a lyric row.",
        "When reusing, set source to reused and copy the legacy Meaning text exactly, character-for-character.",
        "If no existing Meaning line adequately covers a lyric row, write a concise natural English meaning and set source to generated.",
        "Do not merge lyric rows. Do not omit lyric rows. Do not add commentary.",
        "Use confidence high only when alignment is clear, medium when plausible but ambiguous, and low when uncertain.",
      ].join(" "),
      input: JSON.stringify(input),
    });
    return ResultSchema.parse(generated);
  }
}

export function createOpenAILyricsMeaningAlignmentAdapter(environment: NodeJS.ProcessEnv = process.env) {
  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for AI Meaning Alignment.");
  return new OpenAILyricsMeaningAlignmentAdapter(new OpenAIResponsesClient({
    apiKey,
    model: environment.OPENAI_CONTENT_MODEL?.trim() || "gpt-5",
  }));
}

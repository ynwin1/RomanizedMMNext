import { MOOD_IDS } from "../domain/moodometer.types";
import type { MoodometerTextGenerator } from "../application/moodometer.analysis";

export const MOODOMETER_MODEL = "gpt-5";

type OpenAIResponse = {
  status?: string;
  error?: {message?: string};
  output?: Array<{type?: string; content?: Array<{type?: string; text?: string}>}>;
};

export function createMoodometerOpenAIGenerator(config: {
  apiKey: string;
  fetcher?: typeof fetch;
  model?: string;
}): MoodometerTextGenerator {
  if (!config.apiKey.trim()) throw new Error("OPENAI_API_KEY is not configured");
  const fetcher = config.fetcher ?? fetch;
  return async (instructions: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetcher("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model ?? MOODOMETER_MODEL,
          store: false,
          input: [{role: "user", content: instructions}],
          reasoning: {effort: "minimal"},
          max_output_tokens: 1400,
          text: {format: {
            type: "json_schema",
            name: "moodometer_scores",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["moods", "summary"],
              properties: {
                moods: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["moodId", "score"],
                    properties: {
                      moodId: {type: "string", enum: [...MOOD_IDS]},
                      score: {type: "number"},
                    },
                  },
                },
                summary: {type: "string"},
              },
            },
          }},
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        let code = "";
        try {
          const detail = await response.json() as {error?: {code?: string; type?: string}};
          code = detail.error?.code ?? detail.error?.type ?? "";
        } catch { /* Do not reveal provider text or credentials to the browser. */ }
        throw new Error(`Moodometer AI request failed (HTTP ${response.status}${code ? `, ${code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60)}` : ""}). Check API model access and project permissions.`);
      }
      const result = await response.json() as OpenAIResponse;
      if (result.status !== "completed") {
        throw new Error("Moodometer AI did not complete the analysis");
      }
      const texts = result.output?.flatMap(item => item.type === "message" ? (item.content ?? [])
        .filter(part => part.type === "output_text" && typeof part.text === "string")
        .map(part => part.text as string) : []) ?? [];
      if (texts.length !== 1) throw new Error("Moodometer AI returned no usable analysis");
      return JSON.parse(texts[0]) as unknown;
    } finally {
      clearTimeout(timeout);
    }
  };
}

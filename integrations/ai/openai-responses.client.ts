import { ContentGenerationProviderError } from "@/modules/content-generation";

interface OpenAIResponsesClientOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export interface StructuredResponseRequest {
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
}

function extractOutputText(response: unknown): string {
  if (typeof response !== "object" || response === null) {
    throw new ContentGenerationProviderError("OpenAI returned an invalid response.", true, "invalid_response");
  }

  const record = response as Record<string, unknown>;
  if (record.status !== "completed") {
    const error = typeof record.error === "object" && record.error !== null
      ? record.error as Record<string, unknown>
      : undefined;
    throw new ContentGenerationProviderError(
      typeof error?.message === "string" ? error.message : "OpenAI response did not complete.",
      record.status === "incomplete" || record.status === "failed",
      typeof error?.code === "string" ? error.code : "response_not_completed",
    );
  }

  if (!Array.isArray(record.output)) {
    throw new ContentGenerationProviderError("OpenAI response contained no output.", true, "missing_output");
  }

  for (const item of record.output) {
    if (typeof item !== "object" || item === null) continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (typeof part !== "object" || part === null) continue;
      const value = part as Record<string, unknown>;
      if (value.type === "refusal") {
        throw new ContentGenerationProviderError("OpenAI refused this generation request.", false, "refusal");
      }
      if (value.type === "output_text" && typeof value.text === "string") return value.text;
    }
  }

  throw new ContentGenerationProviderError("OpenAI response contained no text output.", true, "missing_output_text");
}

export class OpenAIResponsesClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: OpenAIResponsesClientOptions) {
    if (!options.apiKey.trim()) throw new Error("OPENAI_API_KEY is required.");
    if (!options.model.trim()) throw new Error("OpenAI content model is required.");
    this.baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    this.fetcher = options.fetcher ?? fetch;
  }

  async generateStructured(request: StructuredResponseRequest): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetcher(this.baseUrl + "/responses", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + this.options.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.options.model,
          store: false,
          instructions: request.instructions,
          input: request.input,
          text: {
            format: {
              type: "json_schema",
              name: request.schemaName,
              strict: true,
              schema: request.schema,
            },
          },
        }),
      });
    } catch {
      throw new ContentGenerationProviderError("Unable to reach OpenAI.", true, "network_error");
    }

    if (!response.ok) {
      const retryable = response.status === 408 || response.status === 409 || response.status === 429 || response.status >= 500;
      throw new ContentGenerationProviderError(
        "OpenAI request failed with status " + response.status + ".",
        retryable,
        "http_" + response.status,
      );
    }

    const payload = await response.json().catch(() => {
      throw new ContentGenerationProviderError("OpenAI returned invalid JSON.", true, "invalid_json");
    });

    const outputText = extractOutputText(payload);
    try {
      return JSON.parse(outputText);
    } catch {
      throw new ContentGenerationProviderError("OpenAI returned malformed structured output.", true, "malformed_output");
    }
  }
}

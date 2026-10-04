import test from "node:test";
import assert from "node:assert/strict";
import { OpenAIContentGenerationAdapter } from "@/integrations/ai/openai-content-generation.adapter";
import { OpenAIResponsesClient } from "@/integrations/ai/openai-responses.client";
import { ContentGenerationProviderError } from "@/modules/content-generation";

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function completed(text: string) {
  return {
    status: "completed",
    output: [{
      type: "message",
      content: [{ type: "output_text", text }],
    }],
  };
}

test("OpenAI adapter uses Responses structured output without storing responses", async () => {
  let requestBody: any;
  const fetcher: typeof fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return response(completed(JSON.stringify({
      lines: [{ index: 0, text: "min ga lar par" }],
    })));
  };

  const adapter = new OpenAIContentGenerationAdapter(new OpenAIResponsesClient({
    apiKey: "test-key",
    model: "test-model",
    baseUrl: "https://example.test/v1",
    fetcher,
  }));

  const result = await adapter.romanize({ lines: [{ index: 0, text: "မင်္ဂလာပါ" }] });
  assert.equal(result.lines[0]?.text, "min ga lar par");
  assert.equal(requestBody.model, "test-model");
  assert.equal(requestBody.store, false);
  assert.equal(requestBody.text.format.type, "json_schema");
  assert.equal(requestBody.text.format.strict, true);
  assert.equal(requestBody.text.format.name, "romanized_lyrics");
});

test("OpenAI client classifies retryable HTTP failures without leaking response bodies", async () => {
  const client = new OpenAIResponsesClient({
    apiKey: "test-key",
    model: "test-model",
    fetcher: async () => response({ secret: "provider-body" }, 429),
  });

  await assert.rejects(
    () => client.generateStructured({
      instructions: "test",
      input: "test",
      schemaName: "test_schema",
      schema: { type: "object" },
    }),
    (error: unknown) => {
      assert.ok(error instanceof ContentGenerationProviderError);
      assert.equal(error.retryable, true);
      assert.equal(error.causeCode, "http_429");
      assert.doesNotMatch(error.message, /provider-body|secret/);
      return true;
    },
  );
});

test("OpenAI client rejects refusals and malformed structured output", async () => {
  const refusal = new OpenAIResponsesClient({
    apiKey: "test-key",
    model: "test-model",
    fetcher: async () => response({
      status: "completed",
      output: [{ content: [{ type: "refusal", refusal: "No" }] }],
    }),
  });
  await assert.rejects(
    () => refusal.generateStructured({ instructions: "", input: "", schemaName: "x", schema: {} }),
    (error: unknown) => error instanceof ContentGenerationProviderError && error.causeCode === "refusal",
  );

  const malformed = new OpenAIResponsesClient({
    apiKey: "test-key",
    model: "test-model",
    fetcher: async () => response(completed("not-json")),
  });
  await assert.rejects(
    () => malformed.generateStructured({ instructions: "", input: "", schemaName: "x", schema: {} }),
    (error: unknown) => error instanceof ContentGenerationProviderError && error.causeCode === "malformed_output",
  );
});

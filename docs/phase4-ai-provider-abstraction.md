# Phase 4.4 — AI provider abstraction

P4.4 introduces AI as an integration behind RomanizedMM-owned contracts. It does **not** yet connect AI generation to an Ingestion.

## Application contract

`ContentGenerationProvider` exposes three capabilities:

- `romanize`: Burmese lyric lines → indexed romanized lines;
- `translateMeaning`: Burmese lyric lines → indexed English meaning lines;
- `generateEditorialMetadata`: trusted context → `about` and `whenToListen`.

The application layer depends only on this provider interface. OpenAI-specific request/response types do not cross into modules.

Lyric generation uses zero-based indexed lines rather than one free-form text blob so later phases can validate source/output alignment before saving generated content.

## OpenAI adapter

The OpenAI adapter uses the Responses API and strict JSON-schema Structured Outputs.

Configuration:

- `OPENAI_API_KEY`: required when the real adapter is created.
- `OPENAI_CONTENT_MODEL`: optional; defaults to `gpt-5`.

The adapter sends `store: false`.

The API key is never included in provider errors. HTTP error response bodies are also not propagated into application errors.

## Runtime validation

Provider output is validated again with Zod even when the provider requests strict structured output. This protects the application boundary from malformed adapters, test doubles, API behavior changes, or unexpected responses.

P4.4 validates shape only. P4.5/P4.6 add semantic invariants such as exact source/output line alignment and generation-specific quality rules.

## Testing

Normal CI never calls OpenAI.

A deterministic fake provider covers application behavior, while adapter tests inject a fake HTTP transport to verify:

- Responses API request shape;
- strict JSON-schema output configuration;
- `store: false`;
- retryable HTTP classification;
- refusal handling;
- malformed-output handling;
- secret-safe error behavior.

## Deferred

P4.4 does not:

- trigger AI from the admin UI;
- transition Ingestion into `generating`;
- write generated content into ContentDraft;
- implement semantic line-alignment validation;
- retry provider calls;
- publish canonical content.

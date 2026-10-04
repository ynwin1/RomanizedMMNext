# Phase 4.5 — Romanization generation

P4.5 wires the first real AI capability into the ingestion workflow.

## Flow

An ingestion with trusted Burmese source in `ready_to_generate` can run romanization:

```text
ready_to_generate
  → generating
  → ready_to_generate
```

Romanization returns to `ready_to_generate` because P4.6 still needs to generate English meaning and editorial metadata. Once all AI-owned generation is complete, a later phase advances the ingestion to `needs_admin_input`.

Failures use:

```text
generating → failed → generating
```

The same ingestion and draft are reused for retries.

## Source/output alignment

Burmese source is normalized only for newline representation (CRLF/CR → LF) before generation.

The generation service requires:

- exactly one generated line for each source line;
- identical zero-based indexes;
- blank source lines remain blank;
- non-empty source lines cannot generate empty output.

Only after these invariants pass is `ContentDraft.generated.romanized` updated.

## Safety

- AI never writes ContentDraft directly.
- The application workflow invokes the provider, validates the result, then patches only `generated.romanized`.
- Existing draft meaning/editorial/metadata/artists are untouched.
- A generation failure leaves romanized content unchanged and marks the ingestion failed.
- Canonical Song and Artist data remain unreachable from this workflow.

## Runtime configuration

The real OpenAI adapter is created lazily when the admin triggers romanization. Local builds and normal CI therefore do not require `OPENAI_API_KEY`.

For local real-provider testing:

- set `OPENAI_API_KEY`;
- optionally set `OPENAI_CONTENT_MODEL`;
- open an ingestion in `ready_to_generate`;
- click **Generate romanization**.

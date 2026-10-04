# Phase 4.6 — Meaning and editorial generation

P4.6 completes the AI-owned portion of the ingestion workflow.

## Flow

After trusted Burmese source exists, AI generation is treated as one pipeline:

```text
ready_to_generate / failed
  → romanization if missing
  → generating
  → English meaning
  → about + whenToListen
  → needs_admin_input
```

The admin does not review between AI-owned steps.

If romanization already exists from an earlier P4.5 run, it is reused and not regenerated. Existing meaning/editorial fields are also reused. This keeps retries cheaper and avoids unnecessary provider calls.

## Meaning

Meaning generation uses the same line-alignment validation as romanization:

- one output line per source line;
- identical indexes;
- blank source lines remain blank;
- non-empty source lines cannot produce empty output.

The validated lines are joined and stored in `ContentDraft.generated.meaning`.

## Editorial generation

Editorial generation writes:

- `ContentDraft.generated.about`;
- `ContentDraft.generated.whenToListen`.

The provider receives:

- trusted Burmese source;
- song name;
- artist display names;
- romanized lines;
- generated English meaning.

The prompt explicitly forbids inventing release dates, albums, awards, artist history, or other factual metadata.

## Failure and retry

If meaning/editorial generation fails, the ingestion transitions to `failed`.

Already-persisted AI fields are reused on retry. The workflow never modifies canonical Song or Artist records.

Only after romanization, meaning, about and whenToListen are all present does the ingestion transition to `needs_admin_input`.

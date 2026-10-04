# Phase 4.7 — Generated-content quality eval foundation

P4.7 adds deterministic quality checks between AI generation and draft acceptance.

## Why deterministic checks

The provider already uses structured output and prompt instructions. P4.7 adds inexpensive application-owned invariants so obviously bad output is rejected before an ingestion advances.

This phase deliberately does not add another AI-as-judge call and does not retrieve the existing production song corpus. The evaluator is reusable so a future corpus/eval harness can run the same rules offline.

## Blocking quality checks

Romanization:

- source/output structure is still validated by the generation service;
- Myanmar script must not leak into romanized output;
- detected sentence starts must begin with a capital letter.

English meaning:

- source/output structure is still validated by the generation service;
- Myanmar script must not leak into the English meaning;
- detected sentence starts must begin with a capital letter.

Editorial:

- `about` must be one line;
- `whenToListen` must be one line.

Sentence detection follows punctuation across line boundaries. A lowercase lyric line is allowed when it continues an unfinished sentence from the previous line. Blank lines start a new sentence context.

## Stable eval results

Quality failures use stable issue codes and include the affected generated field plus a line index when applicable. This keeps the checks reusable for:

- CI fixtures;
- future admin diagnostics;
- offline comparison against existing RomanizedMM songs;
- future generation-quality dashboards.

## Workflow behavior

New provider responses are evaluated before they are returned from `ContentGenerationService`.

The complete stored generated draft is evaluated again before an ingestion can transition to `needs_admin_input`. This prevents older or reused generated fields from bypassing newly introduced quality rules.

A blocking quality issue moves an active generation to `failed`. The same ingestion remains retryable.

No canonical Song or Artist data is modified.

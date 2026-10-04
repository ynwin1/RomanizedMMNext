# P4.11 — Recent-song Romanization references

RomanizedMM now uses recently published canonical songs as approved style precedent when generating new Romanization.

## Why recent songs

The most recently published songs reflect the current preferred RomanizedMM spelling and review conventions better than older catalogue entries.

The default candidate window is:

- 25 most recently created canonical songs.

This can be changed with:

`ROMANIZATION_REFERENCE_SONG_LIMIT`

The default maximum number of reference lines sent to the AI is:

- 30 mappings.

This can be changed with:

`ROMANIZATION_REFERENCE_LINE_LIMIT`

No environment variables are required; both settings have safe defaults.

## Retrieval

The reference lookup reads only:

- mmid;
- song name;
- Burmese lyrics;
- Romanization;
- English meaning;
- creation date.

Recent songs are split into aligned Burmese / Romanized / Meaning lines.

For the new Burmese source, deterministic matching ranks approved mappings as:

1. exact Burmese line matches;
2. phrase/subphrase matches;
3. character-pattern similarity.

Only the strongest relevant mappings are included in the AI prompt. The full recent-song corpus is never dumped into the prompt.

Reference lookup does not use another AI call or embeddings.

If reference lookup fails, generation continues without references so this quality enhancement does not block ingestion.

## Generation flow

For a new Romanization:

```text
trusted Burmese source
      ↓
recent approved reference retrieval
      ↓
reference-aware Romanization pass
      ↓
English Meaning generation
      ↓
Romanization consistency/review pass
      ↓
persist corrected Romanization + Meaning
      ↓
editorial generation
      ↓
ready_for_review
```

The second pass sees:

- Burmese source;
- proposed Romanization;
- generated English Meaning;
- relevant approved RomanizedMM mappings.

Exact and phrase references are treated as strong spelling precedent. Similar references are style evidence only.

The AI is still responsible for context and pronunciation; references are not applied as blind string replacements.

## Retry behavior

Corrected Romanization and Meaning are persisted before editorial generation.

If editorial generation fails afterward, a retry reuses the corrected Romanization and Meaning and does not pay for another Romanization review call.

If Romanization already exists together with Meaning, the normal retry path does not run reference lookup or Romanization review again.

## Cost

Reference retrieval itself uses MongoDB only and adds no model cost.

A new song now uses one additional structured OpenAI call for Romanization consistency review. Prompt tokens increase modestly because only selected mappings are included rather than entire songs.

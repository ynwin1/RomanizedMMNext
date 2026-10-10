# P10.1 — Recent catalogue Romanization references

Read-only building block for catalogue-aware generation.

- Read at most 30 recently updated songs with canonical Lyrics V2, using only the MMID and V2 columns.
- Skip invalid V2 documents; ignore breaks and malformed/incomplete lyric pairs.
- Deduplicate by normalized Burmese source line; the most recently updated song's spelling wins.
- Prefer exact source-line matches; use recent unique examples for remaining prompt context.
- Cap returned examples at 24 and each reference field at 200 characters.
- No database writes, OpenAI calls, or changes to request/direct-song generation in this phase.

P10.2 should inject these examples into the shared Romanization generation flow and preserve the existing alignment/quality validation. Do not blindly copy references to different Burmese text.

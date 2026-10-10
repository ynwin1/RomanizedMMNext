# P11.6 — AI generation workflow verification

This phase adds a cross-workflow regression test. It does not call OpenAI or mutate production songs.

## Automated checks

- Direct admin Create Song uses the shared catalogue-aware `ContentGenerationService`.
- Song-request ingestion uses the same service for missing Romanization, English Meaning, and editorial metadata.
- Both receive a bounded seven-song reference lookup, once per Romanization action only.
- Generated content preserves blank lines and produces aligned canonical Lyrics V2 rows.
- Request workflow transitions to `ready_for_review` only after all generated content is stored.
- Meaning and metadata generation alone do not look up Romanization references.

## Manual acceptance checks (local admin, non-production song)

1. Open `/admin/songs/new`, paste Burmese lyrics with a section break, then click Auto-generate.
2. Verify the aligned V2 editor rows, English meanings, About, and When to listen; adjust a row manually.
3. Click Auto-generate again and verify the confirmation prevents overwriting until explicitly confirmed. Cancel preserves edits.
4. Process a song request, save its Burmese source, and verify it reaches review with aligned Romanization/Meaning and generated metadata.
5. Publish a reviewed request and verify the destination song page reads V2.
6. Use `/admin/lyrics-health` to verify the song is healthy or review any flagged diagnostics.

No automated test calls the live model; CI cannot establish subjective Romanization quality. Human review remains required.

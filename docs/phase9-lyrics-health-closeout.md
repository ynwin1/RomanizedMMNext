# Phase 9.3 — Lyrics Health verification and closeout

The one-time Lyrics V2 migration and migration-only execution/draft services were retired in P9.2. The canonical `lyricsV2` document is now authoritative for song writes and public reads.

## Permanent health diagnostics
- A present `lyricsV2` document is validated using the same `LyricsV2Schema` as regular song writes. Malformed entries, invalid break placement, unsupported versions, and missing required text are classified **Invalid**, not healthy.
- Valid V2 with one or more `meaning: null` lines is **Warning**, including an entry index for review.
- Valid V2 without missing meanings is **Healthy**. Legacy compatibility strings are not used to judge an existing V2 document, because they are derived representations.
- Missing V2 still receives legacy diagnostics as an exceptional/manual-recovery state; this does **not** re-enable migration execution.

## Admin verification checklist
1. Visit `/admin/lyrics-health` as an authorized admin; status totals should add up to Total songs.
2. Open a flagged song via its link and edit its canonical V2 rows.
3. Confirm the same page is read-only and does not expose migration/batch AI actions.
4. Check `/admin/migrations/lyrics-v2` redirects to Lyrics Health.
5. Validate direct Create Song and request Publish still persist canonical V2 with derived compatibility fields.

## Completion requirements
- CI must pass module boundaries, TypeScript, tests, and production build.
- No catalogue-wide writes or API-token-consuming generation are involved.
- Do not delete production song documents or old review-draft collections as part of cleanup.

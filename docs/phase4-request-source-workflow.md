# Phase 4.3 — Request to trusted source workflow

P4.3 connects the Phase 3 request queue to the new Phase 4 ingestion/draft foundations.

## Happy path

1. Admin marks a SongRequest as `accepted`.
2. The request detail exposes **Start ingestion**.
3. Starting ingestion:
   - re-checks that the request is still accepted;
   - creates or reuses the one Ingestion for the request;
   - creates the ContentDraft if missing;
   - seeds request-owned draft data: song name, requested artist as unresolved, YouTube URL, requester.
4. Admin lands on `/admin/ingestions/:id`.
5. Admin pastes trusted Burmese lyrics.
6. Saving the source:
   - validates and stores the exact Burmese source in ContentDraft;
   - records the admin actor;
   - transitions Ingestion from `awaiting_source` to `ready_to_generate`.

No AI generation happens in P4.3.

## Retry safety

Starting ingestion is recoverable across partial failures. If an Ingestion already exists, the workflow reuses it. If its ContentDraft is missing, retrying start creates and seeds the missing draft instead of creating a second ingestion.

The unique request/draft indexes remain the final duplicate-write guard.

## Trust boundary

The Burmese lyrics are human-provided trusted source material. AI will transform this source in later sub-phases; it will not guess or search for lyrics in P4.3.

## Canonical safety

P4.3 does not write Song or Artist canonical data. The requested artist is stored only as an unresolved draft reference until artist resolution is added later.

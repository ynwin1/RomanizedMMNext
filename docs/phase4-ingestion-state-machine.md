# Phase 4.1 — Ingestion state machine

Phase 4 introduces workflow state without giving workflow code authority over canonical Song or Artist data.

## Responsibility

- `SongRequest` remains user intent.
- `Ingestion` represents work being performed for one accepted request.
- `ContentDraft` is intentionally deferred to P4.2.
- AI generation is intentionally deferred.
- Publishing is intentionally deferred to Phase 5.

An ingestion is unique per `SongRequest`. Retries resume the same ingestion instead of creating another workflow record.

## States

```text
awaiting_source
  → ready_to_generate
  → generating
      → needs_admin_input
      → failed → generating
  → needs_admin_input
      → ready_for_review
  → ready_for_review
      → generating
      → approved
      → rejected
```

`approved` and `rejected` are terminal in P4.1.

The top-level state is deliberately coarse. Later generation steps can track their own execution/result state without expanding this lifecycle into one status per AI operation.

## Safety

Every transition is checked in the application layer and persisted atomically with:

- ingestion id;
- expected source state;
- expected Mongo `__v` revision.

This prevents stale callers from applying a transition that was valid before another writer changed the workflow.

The unique `songRequestId` index prevents accidental duplicate ingestions for the same request.

## Deferred

P4.1 does not yet:

- verify that the related SongRequest is accepted;
- capture Burmese source lyrics;
- expose admin ingestion UI;
- create ContentDraft records;
- call an AI provider;
- write Song or Artist data.

Those responsibilities land in later Phase 4 sub-phases.

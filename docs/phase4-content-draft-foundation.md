# Phase 4.2 — ContentDraft foundation

`ContentDraft` is the mutable, unpublished workspace produced and edited during ingestion.

It is intentionally **not** a partial copy of the canonical `Song` entity.

## Ownership

The draft is grouped by responsibility:

- `identity`: song identity established from request/admin input;
- `source`: trusted human-provided source material;
- `generated`: AI-produced language/editorial content;
- `metadata`: factual/external metadata supplied by admin or future integrations;
- `artists`: resolved canonical artist references or temporary unresolved names.

This separation lets later workflow steps patch only the fields they own.

## Artist references

A draft artist is either:

- `resolved`: linked to an existing canonical Artist by id, with a name/slug snapshot for review;
- `unresolved`: a temporary display name that can be resolved later.

P4.2 does not mutate canonical Artist data or `Artist.songs`.

## Persistence and concurrency

There is one ContentDraft per Ingestion, enforced by a unique `ingestionId`.

Draft updates:

- validate at the application boundary;
- patch only supplied nested fields;
- use Mongo `__v` optimistic concurrency;
- never upsert;
- record the admin actor when supplied.

## Deferred

P4.2 does not yet:

- automatically create a draft from an ingestion;
- capture Burmese lyrics in the admin UI;
- verify request/ingestion lifecycle prerequisites;
- call an AI provider;
- calculate completeness;
- approve/reject a draft;
- publish Song/Artist canonical content.

Those behaviors are layered onto this workspace in later Phase 4 sub-phases.

# Phase 4.8 — Admin factual metadata completion

P4.8 begins the human-owned portion of ingestion after AI generation.

## Scope

When an ingestion reaches `needs_admin_input`, an authenticated admin can edit factual song metadata without modifying AI-generated content or canonical Song/Artist records.

Fields:

- genre — required;
- album name — optional;
- Spotify track ID — optional;
- Spotify link — optional;
- Apple Music link — optional;
- YouTube links — optional, one or more;
- image link — optional.

`requestedBy` remains workflow-seeded data and is not exposed as factual metadata editing in this phase.

## Completeness

The current canonical Song contract requires `genre`; the other metadata fields above are optional.

P4.8 therefore defines factual metadata as complete when a non-empty genre exists.

Completing metadata does **not** transition the ingestion out of `needs_admin_input`. Artist resolution is still pending in P4.9.

## Clearing optional values

Optional metadata can be explicitly cleared from the admin form.

The application represents a requested clear as `null` in a draft patch. The Mongo repository translates that to `$unset`; empty strings are not persisted as placeholder values.

This also allows request-seeded data, such as a YouTube link, to be removed if it is incorrect.

## Safety

- metadata edits are allowed only while the ingestion is `needs_admin_input`;
- the draft must belong to the ingestion being edited;
- optimistic draft revision checks still apply;
- URLs must be valid HTTP/HTTPS URLs;
- the admin action authorizes before any write;
- no ingestion status transition occurs;
- no canonical Song or Artist write occurs.

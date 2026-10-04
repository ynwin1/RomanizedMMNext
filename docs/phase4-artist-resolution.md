# Phase 4.9 — Artist list management and resolution

P4.9 completes the human-owned artist input stage.

## Draft artist model

A ContentDraft can contain multiple artists.

Each entry is either:

```text
unresolved
  name
```

or:

```text
resolved
  artistId
  name
  slug
```

An unresolved name is a valid draft artist. The canonical Artist does not need to exist yet.

## Admin flow

While an ingestion is `needs_admin_input`, an admin can:

- add additional artists by name;
- remove any artist entry;
- search canonical artists by name/slug;
- optionally resolve a name-only artist to an existing Artist;
- leave one or more artists name-only;
- explicitly confirm the final artist list.

The initial requested artist remains a name-only draft artist until the admin chooses to resolve it.

No canonical Artist is created or modified in this phase.

## Request data

Song requests only require song name and artist name.

A request YouTube link is request context only. It is never promoted automatically into ContentDraft metadata. Final Spotify, Apple Music, YouTube and image metadata remains admin-owned.

Starting an ingestion is repair-safe: if a prior partial failure created an empty draft, retrying Start ingestion seeds missing song name, requested artist and requestedBy without overwriting existing admin-owned draft data.

## Ready-for-review transition

Metadata saves do not automatically move the ingestion forward.

The admin explicitly chooses **Confirm artist list** after finishing artist edits.

Confirmation requires:

- required factual metadata is complete (currently genre);
- at least one artist entry exists.

Resolved canonical links are optional. Name-only unresolved artists are allowed.

Successful confirmation transitions:

```text
needs_admin_input → ready_for_review
```

P4.10 owns the final review/edit/regenerate/approve/reject stage.

## Safety

- max 30 draft artists;
- duplicate artist names are rejected case-insensitively;
- artist mutations require `needs_admin_input`;
- draft ownership and indexes are validated;
- optimistic draft revisions protect add/remove/resolve writes;
- canonical Artist identity is reloaded server-side when resolving;
- authorization occurs before mutations;
- canonical Artist records are never written.


## Reopening admin input

A draft already in `ready_for_review` can be reopened when metadata or artist corrections are needed:

```text
ready_for_review → needs_admin_input
```

The admin can then edit metadata or the artist list and explicitly confirm the artist list again to return to `ready_for_review`.

This also preserves compatibility with ingestions that reached `ready_for_review` under earlier P4.9 behavior before multi-artist editing was introduced.

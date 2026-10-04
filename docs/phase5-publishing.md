# Phase 5.1 — PublishingService

PublishingService is the only sanctioned bridge from workflow-owned ContentDraft data into canonical production content.

## Admin flow

The final review form exposes:

- Save review changes
- Publish song

Publish first saves the current form values, then publishes that exact draft.

Successful publish redirects to the live public song page.

## Publishability

A draft may be saved while incomplete, but publication requires:

- song name;
- trusted Burmese source;
- Romanization;
- English meaning;
- About;
- When to listen;
- genre;
- at least one artist.

Artists may be either:

- resolved to a canonical Artist (name + slug), or
- name-only when no canonical Artist exists yet.

## Canonical mapping

ContentDraft maps to Song as follows:

- identity.songName → songName
- source.burmeseLyrics → burmese
- source.burmeseLyrics → lyrics (legacy field, pending dedicated cleanup)
- generated.romanized → romanized
- generated.meaning → meaning
- generated.about → about
- generated.whenToListen → whenToListen
- metadata fields → corresponding canonical metadata
- draft artists → Song.artistName
- isRequested → true
- metadata.requestedBy → requestedBy

## MMID allocation

Publishing allocates the next MMID server-side from the current canonical maximum.

MMID collisions are retried. Admins do not manually choose an MMID during the request workflow.

## Retry safety

Canonical Songs published from ingestion carry an internal unique sourceIngestionId.

On retry:

1. PublishingService first looks for an existing Song with that source ingestion identity.
2. If found, it reuses that Song rather than creating another.
3. Resolved Artist song backlinks use $addToSet, so retries cannot duplicate MMIDs.
4. Completed requests are not rewritten unnecessarily.
5. Approved ingestions are treated as already finalized.

This allows recovery from partial failures such as:

- Song created, Artist backlink failed;
- Song created, request completion failed;
- request completed, ingestion approval failed;
- concurrent publish attempts for the same ingestion.

## Completion order

Publishing performs:

1. validate reviewed draft;
2. create/reuse canonical Song;
3. add Song MMID to resolved canonical Artists;
4. mark SongRequest completed;
5. mark Ingestion approved.

Once complete, the request leaves the default queue and the Song is publicly readable.

## Canonical artist compatibility

Song.artistName now allows optional slugs.

That matches the public song page, which already renders a linked artist when slug exists and plain text when it does not.

The old nested unique constraint on Song.artistName.slug is removed because a canonical Artist must be able to appear on multiple songs.

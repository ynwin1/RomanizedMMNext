# P4.10 — Streamlined request-to-review workflow

This refactor keeps ingestion state for recovery and auditability while removing state management from the normal admin experience.

## Admin flow

```text
Request review
  ↓
Accept ─────────────── Reject
  ↓                       ↓
Burmese source         request rejected
  ↓
AI generation
  ↓
Final review
  ↓
PublishingService (next phase)
```

### Request review

The request page exposes only Accept and Reject for pending/reviewing requests.

Accept performs both operations as one admin action:

1. mark the request accepted;
2. create or reuse its ingestion and ContentDraft;
3. redirect to Burmese source entry.

Reject marks the request rejected and redirects to the pending request queue.

The default request queue shows only undecided requests (pending plus legacy reviewing).

### Burmese source

Saving the trusted Burmese source automatically runs the full AI-owned pipeline.

No Generate button is required in the normal path.

Successful generation transitions directly to `ready_for_review`.

Provider/quality failures use the internal `failed` status and expose only a Retry AI generation action.

### Final review

The review workspace is directly editable and includes:

- song name;
- Burmese source;
- Romanization;
- English meaning;
- About;
- When to listen;
- genre;
- album;
- Spotify track ID/link;
- Apple Music link;
- YouTube links;
- image link;
- multiple artists.

Artists can remain name-only or optionally resolve to canonical Artist records.

Legacy drafts in `needs_admin_input` render the same review workspace so old in-progress work is not stranded.

Saving review changes does not transition state.

## Publishing boundary

Canonical creation remains deliberately outside this PR.

The next PublishingService PR will make one Publish song action:

1. validate final draft publishability;
2. create canonical Song data;
3. mark ingestion approved;
4. mark SongRequest completed.

This preserves the architecture invariant that workflow/AI code never writes canonical content directly.

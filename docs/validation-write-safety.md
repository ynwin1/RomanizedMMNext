# Validation and write safety (P3.7)

Admin mutations now use one shared preparation seam:

```text
parse FormData / command
→ validate the complete command with a module-owned Zod schema
→ authorize the admin
→ call the application service
→ return a typed form result or redirect after success
```

The shared helper lives at `shared/write/validated-write.ts`. It owns validation result typing and Zod field-error shaping only. It does not know about songs, artists, requests, MongoDB, Clerk, redirects, or logging.

Each module owns its command schemas:
- songs: create content and update command
- artists: create content and update command
- requests: status-update command

Application services remain defensive boundaries. Song, artist, and song-request creation validate before repository access even when a caller already validated. This prevents future routes/jobs/scripts from bypassing runtime checks by supplying TypeScript-shaped objects.

Authorization failures are allowed to propagate, preserving Clerk/Next redirect semantics. Expected domain errors such as duplicates, stale revisions, and not-found records are mapped by the feature action handler. Unexpected failures are logged and returned as stable generic messages.

Public artist/request POST routes share the same Zod field-error shaping. Public routes may validate early for a useful 400 response, but application services still validate independently.

P3.7 intentionally does not add audit fields, destructive confirmations, AI/workflow behavior, or new canonical entities; those belong to later sub-phases.

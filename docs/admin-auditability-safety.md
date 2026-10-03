# Admin auditability and destructive safety (P3.8)

Canonical admin-managed records now carry basic audit metadata:

- `createdAt` and `updatedAt` are managed by Mongoose timestamps.
- authenticated admin creates/updates store the Clerk user id in `updatedBy`.
- song-request submissions remain public intent and therefore have no admin actor until an admin changes their lifecycle status.
- legacy records may not have `updatedAt` or `updatedBy` until their next write; admin UI renders those values as Unknown rather than inventing history.

Audit metadata is surfaced on song edit, artist edit, and request review pages. Provider-specific auth objects do not cross into modules; application/repository APIs accept only an optional actor id string.

## Destructive safety

Phase 3 currently exposes no hard-delete action for songs, artists, or requests. P3.8 intentionally preserves that posture rather than adding deletion solely to add a confirmation dialog.

Any future destructive operation must be introduced deliberately with:
- explicit authorization;
- a visible confirmation step for irreversible actions;
- a preference for archive/soft-delete semantics where practical;
- audit metadata identifying the actor and time;
- regression coverage proving the destructive path cannot be triggered accidentally.

Status changes such as rejected/completed are lifecycle updates, not deletions.

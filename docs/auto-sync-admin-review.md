# P18.4.1 — Admin review for AI timing suggestions

The existing **Admin → Songs → Lyrics Sync** editor now has an **Import AI suggestions** section, accepting a private JSON file produced by `npm run match:auto-sync` (the P18.3.2 matcher report with `suggestion`) or a standalone `AutoSyncSuggestion` JSON object.

The browser reads the selected JSON and sends it to an admin-guarded, read-only server action for validation (do not import confidential exports on shared devices). The server validates that the suggestions match the selected YouTube recording and the current LyricsV2 SHA-256 fingerprint and pass the **same draft timing validation** used by the song page. It shows a preview count before applying. Only *completely empty* timing rows can be filled; existing complete or partial manual edits are preserved. Any resulting timing overlaps cause a complete import rejection. No audio upload or JSON persistence, no automatic save, and **no automatic publishing**.

After applying, inspect each suggestion while playing the exact YouTube recording, correct imperfect boundaries, then use the existing **Save draft** button. Published tracks remain unchanged until the editor explicitly saves and publishes.

## Why audio upload is not part of this PR

The local Whisper/Demucs experiment requires actual executable model workers and durable processing/storage. A Next.js server action on serverless hosting is not a reliable place for long-running AI audio inference or persistent audio uploads. This phase makes the review UX useful without implying that a nonfunctional `Auto-Sync` button exists.

**Next P18.4.2:** design authenticated object storage, bounded upload authorization, background worker/job status, retention and cleanup; only then add an admin audio upload and a real one-click job. Authorized audio matching the YouTube recording is still required. Avoid unreviewed auto-publishing.

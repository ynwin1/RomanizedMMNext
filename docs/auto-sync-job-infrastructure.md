# P18.4.2.1 — Durable Auto-Sync job lifecycle

This PR is the **first backend foundation** for an admin-driven audio Auto-Sync flow, not a functioning uploader or a processing worker. It introduces an explicit job lifecycle and a MongoDB persistence implementation. It does not enable users to create jobs in the live UI, claim that audio is processed, or create any external storage.

## Job states
`awaiting_upload → queued → processing → completed`. A pending or queued job can be cancelled; pending, queued or processing jobs can fail. Completed/failed/cancelled jobs are terminal. Optimistic updates guard against races, and jobs are scoped by song ID and recording ID.

The job record has a SHA-256 LyricsV2 fingerprint; consumers must recheck it before attaching a result. The record holds a **storage object key only**, not audio bytes or user-visible signed URLs. MongoDB TTL index expires jobs after seven days (cleanup is eventually consistent). This is **not** a substitute for object-storage lifecycle cleanup.

Upload safety metadata is limited to ≤100 MiB and allowlisted audio MIME types; this alone is insufficient for safe upload handling. The real uploader must also verify file signatures, duration, authenticated rights/ownership, authorization of object keys, quotas and scanning policy. Job creation is not wired to the admin API until storage and worker dependencies are ready.

## Next phases
- **P18.4.2.2:** choose and configure actual private object storage and authenticated direct-to-storage upload grants. Avoid sending audio through server actions or writing audio to MongoDB. Implement cleanup/expiry and size/type verification.
- **P18.4.2.3:** authenticated worker ownership/claim, job polling and retry/timeout policies, and integration with local Python Whisper/Demucs, including bounded execution and proper deployment.
- **P18.4.3:** admin upload button and job status, with suggestions imported into the existing review UI. Always require explicit human approval to publish.

No new production external dependency or monthly charge is introduced by this PR.

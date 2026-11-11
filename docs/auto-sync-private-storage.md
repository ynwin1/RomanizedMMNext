# P18.4.2.2 — Private object storage adapter

This PR provides a **server-only** S3-compatible presigned PUT and HEAD verification adapter, suitable for private Cloudflare R2 or S3-compatible object storage. It is not the admin UI or audio processing worker.

## Environment variables (server only; never NEXT_PUBLIC)

- `AUTO_SYNC_S3_ENDPOINT`: HTTPS origin for your S3-compatible storage API, e.g. `https://<account-id>.r2.cloudflarestorage.com`
- `AUTO_SYNC_S3_BUCKET`: private bucket name
- `AUTO_SYNC_S3_REGION`: `auto` for R2; actual region for other providers
- `AUTO_SYNC_S3_ACCESS_KEY_ID`
- `AUTO_SYNC_S3_SECRET_ACCESS_KEY`

Do **not** expose credentials in a browser, store them in Git, or point the adapter at a public bucket. For browser uploads the private bucket needs a narrowly scoped CORS rule allowing the admin site's origin, PUT, and content-type/content-length request headers. Upload URLs expire after 15 minutes.

The adapter signs a single random job-key path such as `auto-sync/205/<job-id>/audio.mp3` with explicit file size and MIME type. It rejects remote paths and untrusted job IDs. HEAD verification checks the object key matches the job plus **exact byte count and MIME** before queueing. MIME/size metadata can be forged and does **not** prove file content is valid: the worker must check audio bytes/signature, duration and whether it matches the YouTube video before processing.

### Lifecycle

1. Admin-only start action (next PR) creates an `awaiting_upload` job tied to the current LyricsV2 fingerprint and selected YouTube recording, records size/type intent, then returns only a scoped signed PUT URL.
2. Browser uploads directly to private storage. Do not proxy large audio through a Next.js server action.
3. Authenticated finalization verifies the object via HEAD, then atomically transitions to `queued` and stores only its object key in MongoDB.
4. A separate worker claims the job and extracts/aligns audio, then deletes private audio according to retention policy.

The provider's bucket lifecycle rule must delete objects in `auto-sync/` within a short retention window (recommend 1–7 days). MongoDB's seven-day TTL expires job documents but **does not delete audio** from storage.

**Current limitation:** This adapter does not persist upload intent, expose upload grants, or create an executable worker. Actual production usage needs a storage account and configuration, auth-protected initiation/finalization endpoints, idempotency, upload intent persistence, content validation, quotas, and a cleanup policy. No inference or upload to a real provider was performed in CI.

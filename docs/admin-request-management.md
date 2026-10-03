# Song request management (P3.6)

Admins can review requests from /admin/requests and open a request detail page to see the submitted context and update its lifecycle status.

Managed statuses are pending, reviewing, accepted, rejected, and completed. Legacy requests with missing/null status remain pending. Legacy "added" records are displayed and filtered as completed; this phase does not require a data migration.

SongRequest remains request intent only. Changing a request status does not create or modify canonical songs, artists, ingestion jobs, or drafts.

Status updates authorize before validation/write, validate request id/revision/status in the application service, and use Mongo __v for optimistic concurrency. Stale admin forms cannot overwrite newer status changes and updates never upsert.

Tests cover lifecycle validation, legacy status mapping/filtering, authorization order, missing/stale requests, and repository write semantics. Live Mongo/browser checks remain manual.

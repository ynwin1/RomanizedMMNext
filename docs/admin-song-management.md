# Song management (P3.4)

Admins can create songs at /admin/songs/new and edit existing records at /admin/songs/[id]/edit. All canonical song content and optional metadata are editable. IDs are supplied on create and immutable afterward. Artist names and catalogue slugs are entered as repeatable rows; this phase does not change the separate Artist.songs catalogue membership array.

Server actions call requireAdmin before decoding or persisting form data. SongService performs strict runtime validation; the repository owns Mongo writes. No direct Mongoose access occurs in pages/actions. Unknown identity/timestamp fields are rejected; required content cannot be whitespace-only. HTTP/HTTPS links are validated. Lyric text retains original whitespace and line breaks.

The form offers pending feedback and field-level errors. Successful saves invalidate route caches and redirect to a fresh edit form with confirmation. Optional blanks clear their stored fields; empty YouTube lists clear the URLs. Persistence failures have a stable generic message; duplicate mmid and stale edit errors are explicit. Existing records with missing required artist slugs need those slugs supplied before saving.

Edits compare Mongo __v atomically and increment it. Legacy absent __v counts as revision zero. A stale form cannot overwrite a newer edit; missing songs do not upsert. createdAt and mmid are never updated. This protects writes made through this path; external scripts that do not increment __v cannot be detected by this guard.

Tests cover validation, immutable fields, whitespace, form decoding, authorization before both writes, success/failure handling, missing/stale writes, duplicate-key translation, optional clearing, atomic revision filters, and model validation/no-upsert options. Model tests mock the connection/query seams; live Mongo and browser testing remain manual.

Local check using a test database:
1. Create a song with an unused positive ID and complete required content; verify it appears in lists/dashboard and public reads.
2. Edit required/optional fields and verify lyrics preserve line breaks. Clear a URL and verify it stays cleared after reload.
3. Try the same ID again and verify the duplicate error.
4. Open one song in two tabs; save one, then save the other and verify the stale error.
5. Confirm invalid input does not write and unauthorized sessions cannot save.

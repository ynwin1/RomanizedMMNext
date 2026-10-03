# Admin reads (P3.3)

The dashboard shows canonical song/artist counts, total requests, pending requests, and the five most recent songs. Songs and requests sort by createdAt descending with _id as a stable tie-breaker; artists sort by name then _id. Artist timestamps are not available in the current schema, so recent additions refers to songs.

Lists use database-side filtering and pagination (20 rows in the UI, maximum 100 through the service). Search is a case-insensitive literal substring over song/artist names, artist slugs, or request song/artist names. Query schemas validate service inputs. Invalid URL page/status parameters fall back to page 1/all statuses; URL search is limited to 100 characters. Pagination preserves filters; applying filters resets the page.

Request states remain pending/added until P3.6. Missing/null legacy statuses count and display as pending. Narrow request DTOs omit email, story, and submitter details. This phase contains no writes or schema migrations.

All page data enters AdminReadService, which authorizes before calling module-owned services. Repository/model access stays in each module's infrastructure. Errors propagate into the existing retry boundary; database failures never appear as zero totals.

Tests cover validation, literal search, pagination/link filters, authorization before all reads, dashboard aggregation/failures, legacy status queries, Mongo pagination/projection/DTO mapping, and service validation before persistence access. Repository tests mock database/model seams and do not use live Mongo.

Manual check with the configured local database: verify dashboard totals, recent song order, searches (including Burmese and literal punctuation), request status filters, next/previous links, clear filters, empty results, and an out-of-range page. Authenticated UI and real Mongo checks remain manual.

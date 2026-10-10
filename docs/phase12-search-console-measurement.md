# Phase 12.5 — Google Search Console baseline and monitoring

The goal is to measure whether P12.1–P12.4 actually improve discoverability, particularly for Burmese-script searches. **Search performance is not guaranteed by SEO changes.**

## Establish a baseline

1. Open [Google Search Console](https://search.google.com/search-console) and select the `https://www.romanizedmm.com/` property (or a domain property covering the site).
2. Open **Performance → Search results**. Choose **Web** search type and **Last 28 days**, record the exact start/end dates, and export the **Queries** table as CSV. Name it `Queries-before.csv`.
3. Export the **Pages** report separately. Record total clicks, impressions, CTR, average position and the number of indexed song pages. Do not mix search types, date ranges or country filters.
4. Check **Indexing → Pages** and URL Inspection for five representative song pages, particularly Burmese-titled pages. Record the user-declared and Google-selected canonical URL, whether the URL is indexed, and the last crawl date.
5. Keep exports local; do **not** commit private Search Console exports or account tokens.

## Offline query comparison

Run:

```sh
node scripts/gsc-query-report.mjs path/to/Queries-before.csv
```

Output includes counts of visible queries, clicks, impressions, CTR and impression-weighted average position for:

- `burmeseScript`: queries with one or more Myanmar Unicode characters
- `otherScript`: all remaining queries (this **does not** automatically mean Romanized; it includes English/general terms)

The report intentionally analyzes **only the rows included in the export**, not Google's complete search-query population. Search Console may anonymize some queries, and the exported table may be truncated. Do not interpret summing row metrics as guaranteed property-wide totals.

## Follow-up

Four weeks after deployment, export an equivalent **28-day** query and page report using the same filters and compare:
- Burmese-script impressions and clicks, then CTR and average position
- count of distinct Burmese-script queries surfaced
- individual Burmese-title searches for 10 preselected songs
- number of indexed canonical song pages and any Google-selected canonicals differing from the declared ones

Re-evaluate again after 8–12 weeks if crawling or impressions remain limited. Rankings can move for reasons unrelated to code changes; use trends, not one-day screenshots.

## Scope and safeguards

This phase does **not** connect Google Search Console, automatically fetch private analytics, request indexing, or promise AI-answer citations. The report is a deterministic, offline tool that costs no OpenAI tokens.

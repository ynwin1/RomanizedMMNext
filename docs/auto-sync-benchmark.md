# P18.1.1 — AI lyrics sync benchmark contracts

This PR establishes a **read-only, model-agnostic evaluation layer**. It does not add audio fetching, downloading, AI calls, database collections, or a UI button.

## Inputs
- A canonical LyricsV2 document (including break entries).
- Manually verified reference timestamps for **every lyric line** in the same recording.
- Model-generated suggested timestamps for any subset of those entries, with optional confidence values.
- Both datasets include the exact 11-character YouTube video ID and the LyricsV2 SHA-256 fingerprint. These identify the recording, not an audio download entitlement.

Start/end timestamps are integer **milliseconds relative to the selected recording**. References must cover every lyric line; suggestions may omit uncertain lines. The schema and production draft timing validator reject duplicate indices, breaks, invalid timestamps, out-of-order and overlapping intervals. Repeated lyric text is disambiguated by LyricsV2 entry index.

## Benchmarks
`evaluateAutoSync` reports total/predicted lines, coverage, the fraction of **all reference lines** whose starts, ends, and both boundaries fall within a configurable tolerance (default ±1 second), and mean/max boundary errors on generated predictions. Unpredicted lines count against accuracy; error averages apply only to predicted lines and should never be reported without coverage.

Proposed success gates for a later feasibility decision: >=90% start accuracy within ±1 second, >=85% end accuracy within ±1 second, and >=50% reduction in manual correction time. These are targets, not measured performance.

## Next
P18.1.2 will create reference-data collection/export for a small set of songs, then an offline prototype can align authorized recordings and write suggestions in this format. No audio should be fetched from arbitrary YouTube links or permanently stored as part of this phase.

## P18.1.2 — Collecting reviewed reference timings

In **Admin → Songs → Lyrics Sync**, select the correct recording and ensure its timing track is published and unchanged. Play the recording and manually verify all line boundaries first. Choose **Export benchmark reference**, confirm that you reviewed the exact recording, then save the generated JSON.

The admin-only server action independently reloads current LyricsV2 and a published timing track, rejects missing/draft/stale/incomplete tracks, and produces `{version, mmid, lyrics, reference}`. The reference includes the video ID, lyrics SHA-256 fingerprint, and timestamp entries. Breaks are not timed and repeated text is identified by entry index. No MongoDB writes are made; no audio is downloaded. Keep downloaded exports private and handle song lyrics and rights accordingly.

Exporting is a *candidate* reference, not proof of accuracy. Editorial review is required because a previously published track may still have errors. For the initial evaluation, collect five manually checked songs with varying vocal density, style, repeated choruses, and instrumental gaps. The separate audio acquisition and alignment experiments follow in P18.2.

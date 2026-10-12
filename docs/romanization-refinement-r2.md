# Romanization Refinement Engine — R2

R2 runs **after** AI romanization and before the resulting draft is returned to
either song-request ingestion or direct admin song creation. It does not modify
previously published songs. Source lines, indices, and breaks remain unchanged.

The site owner has confirmed that the existing published RomanizedMM catalogue
was fully corrected by hand, so **existing lyricsV2 pairs are trusted**. New AI
output remains provisional until it has gone through the normal admin review.

## Matching policy

1. **Exact Burmese line:** normalize Unicode (NFC) and whitespace, look up
   human-corrected references from the newest 500 songs, and copy the exact
   approved romanization. Newest reference wins where existing styles conflict.
   Such conflicts are separately noted by the engine.
2. **Recurring Burmese words:** segment using Unicode's Burmese word
   segmentation, only consider reference lines whose Burmese and romanized
   token counts align, and build candidates from at least three distinct songs,
   two different line contexts, and 90% agreement.
3. **Conservative word rewrite:** only for unmatched lines with matching word
   counts, at least two already-correct word anchors, and exactly one
   mismatched dictionary entry. Never infer a replacement from an uncertain
   alignment, English-containing source lines, or low-evidence mappings.
4. **Fallback:** if reference retrieval or refinement fails, return validated
   AI output unchanged. Every candidate result must pass the existing line
   alignment and content-quality checks.

R2 does not call OpenAI again or incur additional AI tokens. It does query the
existing song collection at generation time; later work can optimize caching.

## Limitations and future work

- Word segmentation and one-to-one alignment are conservative heuristics; many
  valid multi-syllable spellings will be left for manual review rather than
  automatically modified.
- Some exact-line conflicts may be contextual; selecting the newest existing
  spelling is a deliberate editorial policy, not a linguistic ground truth.
- R3 should expose per-line provenance and proposed alternatives in the admin
  editor, add phrase-level alignment, and measure false corrections against
  withheld human-reviewed songs before enabling broader replacements.
- If the catalogue later contains unreviewed songs, add explicit review
  provenance before including them in this trusted reference source.

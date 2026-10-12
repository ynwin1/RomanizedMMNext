# Romanization Refinement Engine — R3: Review provenance

R3 carries refinement details from the R2 engine into admin review. It changes
neither the source Burmese text nor published songs.

## Visible refinements

Each changed line can show:

- Its source line number (1-based, including the original blank-line positions).
- Exact-line reuse versus inferred word correction.
- The original AI output and corrected romanization.
- The trusted catalogue song ID(s) behind the correction (up to eight).
- A warning if the same exact Burmese line has alternate trusted spellings.

An explicit conflict notice can appear even if AI already used the newest
preferred spelling. These are advisory; the latest corrected catalogue
spelling remains the default in R2.

## Editing behavior

- **Song-request ingestion:** review panel appears below the editable
  romanization textarea. `Restore AI version` reverts one line without changing
  other lines. Manual changes are always allowed. Saving changed source or
  romanized lyrics clears stale refinement provenance from the draft.
- **Direct admin song creation:** the panel appears above the lyricsV2 editor
  after generation. Admins edit any row as before; provenance is cleared from
  the current UI as soon as entries are manually changed. It is not published
  into the Song model.
- **No reference available:** generation and the editor behave exactly as
  before, with no empty review panel.

## Future evaluation

These notes are not an accuracy score or a claim that the suggested spelling
is always linguistically correct. A held-out accuracy benchmark and further
phrase alignment belong in R4. Additional review-provenance persisted on new
catalogue songs would be needed before unreviewed AI drafts could ever become
reference material without the owner's explicit correction.

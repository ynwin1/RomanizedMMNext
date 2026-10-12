# R4 — Held-out romanization refinement evaluation

R4 evaluates the **deterministic R2 refinement engine** against the owner's
previously reviewed `lyricsV2` catalogue. It does **not** call OpenAI, rewrite
songs, or claim to measure accuracy of raw AI generations.

## Run locally

Using a **read-only** MongoDB credential, export your latest catalogue using
the existing R1 command (skip this step if the export is already current):

```bash
node --env-file=.env.local scripts/export-romanization-references.mjs
```

Keep the export private. Evaluate it offline:

```bash
npm run evaluate:romanization
# Optional: choose export path and number of recent songs to hold out
npm run evaluate:romanization -- .romanization-work/songs.json 200
```

The command prints JSON summary and song-ID-level diagnostic counts, **not lyrics**.
No network, database connection, or OpenAI key is needed during evaluation.
By default, the 100 newest valid songs are tested. Older songs are eligible as
references. For each tested song, the engine receives at most 500 of the
remaining songs, in newest-first order; the **entire tested song is excluded**
from reference retrieval, including its duplicate verses.

## What the numbers actually mean

- `evaluatedLines`: reviewed line pairs tested.
- `cleanRegressions`: cases where passing the *correct* reviewed romanization
  through the refiner incorrectly changed it. Lower is better. Existing style
  conflicts can count as regressions, intentionally.
- `cleanChanged`: number of refinement changes to clean reviewed input.
- `seededCases`: reviewed lines where a single romanized token was replaced by
  the artificial token `zzerror`.
- `seededRecovered`: artificial typos restored to the exact human-reviewed line.
- `seededRegressions`: artificial inputs changed to an output that is neither
  the original seeded input nor the reviewed result.
- `exactLineChanges`, `wordChanges`, and `conflicts`: diagnostics from clean
  reviewed inputs only.

**Crucial limitation:** An intentionally corrupted reviewed line is not an AI
prediction. These results can establish safety and mechanical recovery capacity,
but cannot estimate real-world AI error frequency or the time saved editing.
The benchmark also inherits any inconsistency in the human-reviewed catalogue.

To measure genuine AI improvement later, capture *consented, private* pairs of
original pre-refinement AI drafts and final owner-corrected outcomes. Keep the
evaluation song out of the reference corpus and avoid uploading lyric exports.

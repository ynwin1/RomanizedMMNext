# P18.3.2 — Conservative LyricsV2-to-Whisper segment matcher

This is an **offline proof of concept**, not final audio alignment. It consumes an exported P18.1.2 reference bundle (canonical LyricsV2 + YouTube recording identity) and a P18.3.1 transcription report for the **same recording**. It emits candidate timestamps in the existing AutoSyncSuggestionSchema, without altering song records or public player data.

## Run

```bash
npm run match:auto-sync -- --reference "/path/to/romanizedmm-sync-reference-205-abcdefghijk.json" --transcript ".auto-sync-work/transcripts/abcdefghijk.source.medium.json"
```

The command compiles the project test modules, matches locally, and writes `.auto-sync-work/matches/abcdefghijk.suggestions.json`. This is a private, ignored workspace. Running again without removing the existing suggestion intentionally fails instead of overwriting it.

## Matching rules
- Compare transcription segments with Burmese source lyric strings in LyricsV2 (Unicode NFC, ignoring punctuation and spacing). **No assumption that romanization represents the same phonemes accurately, and no language-model-generated timestamps.**
- Use character-bigram Dice similarity and an adjustable conservative threshold (default 0.82).
- Dynamic programming finds the highest-scoring order-preserving one-to-one mapping; unrelated transcript segments and lyrics may be skipped.
- Two identical lyric lines in different choruses require at least two distinct matching transcript segments. If not enough evidence exists, repeated lines are excluded instead of assigning the only match to an arbitrary occurrence.
- Break entries remain untimed. Each matched line gets the entire Whisper segment boundary; we never split a long segment into multiple lyric lines or fabricate sub-segment times.
- The `confidence` value is the **text similarity score**, not an acoustic certainty or a calibrated likelihood of correct timestamps. The output includes explicit warnings.

## Major limitations
Whisper can combine multiple sung lines into one segment, hallucinate Burmese text, or mistake instrumental music for speech. A high text-similarity score **does not establish correct timing**. This matcher skips problematic cases; it may leave most lines unmatched on a real song. Results must be benchmarked against manual ground truth with P18.1.1 evaluation. We should not auto-publish these suggestions.

P18.3.3 will compare source/vocals variants and measure coverage, line start/end error, repeated sections, and manual effort. Only after measuring accuracy should we decide whether to add phonetic or acoustic forced alignment and an admin AI button.

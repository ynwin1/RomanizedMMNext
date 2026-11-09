# P18.3.3 — Offline AI sync accuracy benchmark

Run this *after* collecting real, human-reviewed published reference timing exports (P18.1.2) and generating matched suggestions (P18.3.1–3.2). This PR provides benchmarking **software**, not measured accuracy for Burmese recordings.

## Manifest

Create an ignored local file `.auto-sync-work/benchmark-manifest.json`:

```json
{
  "version": 1,
  "samples": [
    {
      "reference": "references/song-205.json",
      "source": "matches/song-205-source.json",
      "vocals": "matches/song-205-vocals.json",
      "manualMinutes": 20,
      "assistedMinutes": 10
    }
  ]
}
```

All paths are local, relative to the manifest's directory unless absolute. Each reference is the **export bundle** from the admin timing editor containing `{version,mmid,lyrics,reference}`. Each source/vocals suggestion file is the **match report** from P18.3.2 containing `{suggestion,...}`. For two variants, run P18.3.2 with distinct `--out-dir` values so no generated file gets overwritten. Do not label vocals as source or vice versa.

Manual timing minutes represent the time taken to sync without AI; assisted minutes represent a separate attempt where an admin corrected the suggestions. Don't invent these measurements. Omit both if editing time has not been measured.

## Run

```bash
npm run benchmark:auto-sync -- --manifest .auto-sync-work/benchmark-manifest.json
```

Writes a private, non-overwriting report to `.auto-sync-work/benchmark-report.json`. The command performs **no audio downloads, model inference, network calls, or database writes**.

## Reading the report

- Coverage = number of predicted lines / all reference lines.
- Start/end/both within ±1000 ms are fractions of **all reference lines**, so missing predictions count as failures.
- Mean absolute timing errors are calculated **only over predicted lines**. Read these alongside coverage.
- Compare `pairedSource` with `pairedVocals`, which evaluate the exact **same songs**. Overall `source` and `vocals` totals may include different recording sets.
- `worstLines` lists up to 25 unmatched (null errors) or largest-error entries by song, video ID and LyricsV2 entry index, with no lyric text.
- `decision` is `insufficient_evidence` unless at least five paired songs **and five real editing-time measurements** are present. `candidate_for_review` further requires >=90% start accuracy, >=85% end accuracy (in either paired condition), and >=50% time saving. Other results suggest `investigate_alignment`.

These decision gates are **experimental targets**, not proven quality metrics. A result of `candidate_for_review` only authorizes further human testing; it never authorizes automatic publishing. The reference must match the *exact recording*, including verifying any offset between local audio and YouTube playback. A high score on synthetic test fixtures is not evidence of accuracy on Burmese music.

Next: use this report to decide whether to invest in better phonetic/acoustic alignment or introduce guided timestamp anchors.

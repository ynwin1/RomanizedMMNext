# P18.3.4 — Run the first five-song evaluation

This step connects the local tools already built in P18.1–P18.3 into **one reproducible, offline benchmark command**. It does not run ASR or download YouTube audio by itself. No real accuracy number can be reported until authorized recordings and independently checked references are supplied.

## Inputs required for each song

1. **Reviewed reference export:** From Admin → Song → Lyrics Sync → Export benchmark reference. Check the entire published track against the exact recording before exporting.
2. **Original recording transcription JSON:** Run `transcribe:auto-sync` with `--variant source` on an authorized local audio file.
3. **Isolated vocals transcription JSON:** Optionally run `separate:auto-sync-vocals`, then `transcribe:auto-sync --variant vocals`. Use the **same song recording**, not a different video or arrangement.
4. **Editing measurements (optional):** Only include `manualMinutes` and `assistedMinutes` if actually observed. Both must be supplied together.

## Private input manifest

Create `.auto-sync-work/evaluation-input.json`:
```json
{
  "version": 1,
  "recordings": [
    {
      "reference": "references/song-205.json",
      "source": "transcripts/abcdefghijk.source.medium.json",
      "vocals": "transcripts/abcdefghijk.vocals.medium.json"
    }
  ]
}
```

Paths resolve relative to the manifest file. Add four more independently reviewed songs to meet the initial five-song evaluation target. The input can contain 1–100 songs; omit `vocals` if source separation isn't available. Pairing metrics only compare songs that have **both** variants.

## Run
```bash
npm run evaluate:auto-sync-batch -- --manifest .auto-sync-work/evaluation-input.json
```

This compiles TypeScript test modules locally, runs the conservative P18.3.2 matcher for each input variant, and evaluates matches against the exact P18.1.2 reference using the P18.3.3 metrics. It writes `.auto-sync-work/evaluation-results.json` without overwriting existing results.

The output reports coverage, ±1s timing accuracy, unmatched and worst lines, paired original/vocals performance, and whether evidence is sufficient for a review decision. Textual matching confidence is **not** calibrated acoustic confidence. A good result on synthetic fixtures doesn't establish accuracy on Burmese singing.

## Safety and next decision

Input files stay local and ignored by Git. Do not commit audio, lyrics, or benchmark JSON. This tool never accesses YouTube directly, invokes model APIs, creates/updates MongoDB records, or publishes timings.

If the real five-song test has poor coverage or boundary accuracy, prioritize better multilingual acoustic alignment or guided verse anchors. If good, next integrate the experimental proposals into the admin review editor **without auto-publishing**.

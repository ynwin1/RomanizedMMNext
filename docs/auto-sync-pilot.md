# P18.3.5 — Single-command local pilot

This command runs real model inference (P18.3.1) and optional vocal separation (P18.2.2), then the P18.3.2 matcher and P18.3.3 benchmark. It does not infer a YouTube video's audio from its URL: **authorized audio files must be provided**. Outputs remain in the ignored local workspace. No production services or MongoDB mutations.

## Requirements
- A fully verified, current published sync track exported from the Admin editor for each recording.
- A local recording you are authorized to process, with the **same version/edit as the YouTube video**.
- Python with `faster-whisper` installed, for a source-only run.
- For `mode: "both"`: also install `demucs`, `ffmpeg`, and `ffprobe`. Source separation may make recognition worse; use the paired benchmark to evaluate.
- Local model weights can be large. The default is multilingual Whisper `medium` on CPU, with no paid API.

Example private `.auto-sync-work/pilot-input.json`:

```json
{
  "version": 1,
  "mode": "source",
  "model": "medium",
  "device": "cpu",
  "outputDir": "pilot-results",
  "recordings": [
    {
      "reference": "references/song-205.json",
      "audio": "audio/authorized-song-205.mp3"
    }
  ]
}
```

You can choose `mode: "both"` to compare the source recording and Demucs vocals. Add up to ten songs, ideally five distinct Burmese music styles. **Do not invent editing-time measurements**: only include `manualMinutes` and `assistedMinutes` together after you really measure them.

```bash
npm run pilot:auto-sync -- --manifest .auto-sync-work/pilot-input.json
```

The command validates references and local audio file existence first, then transcribes recordings, optionally separates vocals and transcribes them, matches the Burmese text to LyricsV2, and evaluates each variant against your manual timing reference. Outputs go under `.auto-sync-work/pilot-results/`. A rerun with the same output paths will intentionally refuse to overwrite prior artifacts; choose a new `outputDir` to start again.

**Do not commit audio, exports, or transcription reports.** The output's confidence fields are text-similarity scores, not audio-alignment probabilities. The evaluation is not sufficient evidence for automatic publishing, and wrong audio/video offsets can invalidate its conclusions.

Next: inspect actual five-song results. Poor accuracy should lead to phonetic/acoustic refinement or guided synchronization, not silent auto-publication.

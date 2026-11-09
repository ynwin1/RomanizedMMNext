# P18.2.2 — Local vocal isolation experiment

Use an authorized local recording and run open-source Demucs to isolate the vocal stem. **This is experimental preprocessing, not lyrics alignment**. No audio is fetched from YouTube and nothing is uploaded to a service or stored in MongoDB.

## Install separately (on your development computer)

- Python and a compatible PyTorch environment.
- The `demucs` Python package (e.g. `python -m pip install demucs`). Model weights may download on first use; assess the license and available disk/compute before installing.
- `ffmpeg` and `ffprobe` on your PATH.

## Command

```bash
npm run separate:auto-sync-vocals -- --input "/path/to/authorized-recording.mp3" --video-id "abcdefghijk"
```

Output defaults to the ignored `.auto-sync-work/vocals/` directory and includes `abcdefghijk.vocals.wav` (mono 16kHz PCM) and a JSON manifest. Override using `--out-dir`. Inputs must be local audio files, under 200 MiB and at most 15 minutes. Existing output is never overwritten; temporary stems are deleted on completion/failure.

This tool runs the Demucs `htdemucs` two-stem model with Python locally. It does not install Demucs in the production Next.js environment or add cloud services. The source recording is preferred for separation; P18.2.1 already-normalized 16kHz audio may lose information useful for source separation. The output's `youtubeOffsetMs` is deliberately unknown until audio/video correspondence is verified.

## Evaluation

Use exactly the same reference recording and timestamp benchmark to compare the raw and isolated-vocal audio once an actual Burmese aligner is available (P18.3). **Do not assume separation improves accuracy**: artifacts and missing syllables can make alignment worse. Preserve the original audio for control measurements.

No production AI button, inference endpoint, automated timestamps, or synchronization changes are introduced in this phase.

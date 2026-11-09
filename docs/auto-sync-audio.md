# P18.2.1 — Local audio preprocessing prototype

This phase adds a **local-only** audio preparation command for authorized recordings. It does not download audio from YouTube, call an AI provider, store files in MongoDB, or add a public/admin UI.

## Prerequisites
- Install `ffmpeg` and `ffprobe` so both executables are available on your PATH.
- Obtain a local recording you have permission to analyze. The audio must match the chosen YouTube recording (same edit, speed, intro and arrangement). Providing the video ID alone **does not** retrieve the audio.

## Run

```bash
npm run prepare:auto-sync-audio -- --input "/path/to/authorized-song.mp3" --video-id "abcdefghijk"
```

An optional `--out-dir /path/to/private-output` overrides the default ignored directory `.auto-sync-work/`. The tool accepts a nonempty local file under 200 MiB, up to 15 minutes long, with an audio stream. It uses ffprobe to inspect the recording, then ffmpeg to convert it to **mono 16 kHz, 16-bit PCM WAV** for later alignment-model tests. It writes `<video-id>.wav` and `<video-id>.json` containing the recording ID, source filename, sample format, duration and `youtubeOffsetMs: null` as an explicit reminder that video/audio offset must be verified.

The tool uses direct subprocess arguments (no shell), bounded subprocess time, refuses to overwrite existing results, cleans up failed temporary files, and does not copy source audio into the repository. These files remain local until you delete them. **Do not commit or publish the generated WAV or song lyrics exports.**

## What comes next
P18.2.2 should experiment with vocal separation against this normalized WAV. No accuracy claims can be made until the alignment engine is compared to manually verified references from P18.1.2.

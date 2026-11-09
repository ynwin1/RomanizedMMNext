# P18.3.1 — Burmese transcription baseline (local experiment)

This is the **first actual AI inference experiment** in the RomanizedMM Auto-Sync roadmap. It runs **faster-whisper** locally against an authorized recording. It does **not** match recognized segments to LyricsV2 lines yet and does **not** produce publishable timings.

Whisper recognizes Burmese as language `my` (Myanmar), but recognition quality on Burmese singing, nonstandard spellings, overlapping voices and instrument-heavy audio is unproven. We force `language="my"` and `task="transcribe"`. We deliberately disable VAD in the initial experiment because singing can be mistaken for non-speech. Timestamps here are whole model segments, **not line-alignment evidence**.

## Local prerequisites

1. Python 3 environment with compatible `faster-whisper` and platform-specific CTranslate2/PyTorch requirements. Install independently; no production or CI Python dependencies are added.
2. Authorized **local** audio matching the chosen YouTube video, as obtained independently of the YouTube embedded player. Follow P18.2.1 for preparation and P18.2.2 for optional vocal isolation.
3. Downloaded model weights may consume disk space; CPU inference may be slow. Initial choice: multilingual `medium`, CPU int8; optional `large-v3` with CUDA where available.

## Run original audio

```bash
npm run transcribe:auto-sync -- --input "/path/to/source.wav" --video-id "abcdefghijk" --variant source
```

## Run isolated vocals

```bash
npm run transcribe:auto-sync -- --input ".auto-sync-work/vocals/abcdefghijk.vocals.wav" --video-id "abcdefghijk" --variant vocals
```

The resulting JSON files are written to `.auto-sync-work/transcripts/<video-id>.<variant>.<model>.json`. Each includes detected language, Burmese transcription text, segment start/end milliseconds, local source filename and purely *diagnostic* script statistics. No external provider receives the audio; nothing is written to MongoDB. Local files remain ignored by Git. Reports from source and vocals are kept separate and never silently overwrites an existing output.

## How to interpret the results

Compare the transcribed segments manually with the **actual** LyricsV2. The reported Burmese-script ratio is *not* an accuracy metric; a model can output fluent Burmese that the singer never sang. Song syllable stretching may make Whisper segment timestamps inaccurate. We must assess both recordings against manually verified reference timings.

**Next P18.3.2:** implement a conservative sequence-based candidate matcher using existing LyricsV2 and experiment with phonetic matching. No publishable timings or numeric quality claims until P18.3.3 benchmarks against ground truth.

#!/usr/bin/env python3
"""Experimental Burmese transcription. Local file only; JSON is emitted to stdout."""
import argparse
import json
import math
import os
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--model", choices=["small", "medium", "large-v3"], default="medium")
    parser.add_argument("--device", choices=["cpu", "cuda"], default="cpu")
    args = parser.parse_args()
    source = Path(args.input).resolve(strict=True)
    if not source.is_file():
        parser.error("Input must be a local audio file")
    try:
        from faster_whisper import WhisperModel
    except ImportError as error:
        parser.error("Install faster-whisper locally before running the transcription experiment")

    compute_type = "float16" if args.device == "cuda" else "int8"
    model = WhisperModel(args.model, device=args.device, compute_type=compute_type)
    # VAD can discard melodic or soft vocals. Keep it off for the first experiment.
    segments, info = model.transcribe(
        str(source), language="my", task="transcribe", beam_size=5,
        vad_filter=False, condition_on_previous_text=False,
        word_timestamps=False,
    )
    result = []
    for segment in segments:
        if not math.isfinite(segment.start) or not math.isfinite(segment.end) or segment.end <= segment.start:
            continue
        result.append({
            "startMs": round(segment.start * 1000),
            "endMs": round(segment.end * 1000),
            "text": segment.text.strip(),
        })
    print(json.dumps({
        "version": 1,
        "languageHint": "my",
        "detectedLanguage": info.language,
        "model": args.model,
        "segments": result,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()

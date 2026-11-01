# P17.1 — Lyrics synchronization foundation

Existing LyricsV2.entries align Burmese, romanized, and meaning text by position. The current public player parses legacy inline [mm:ss] markers in each text independently; P17.1 does not replace that behavior.

A timing track is **per YouTube video**, not per song translation. A track references zero-based LyricsV2 entry indices (including the index offset of a break, but never timing a break). Start/end times use integer milliseconds. An instrumental gap is represented by unused time between entries. Drafts may be incomplete, while published tracks must cover every lyric line. Lines may be repeated verbatim at distinct entry positions.

The contract requires a SHA-256 lyrics fingerprint. P17.2 must compute it from a stable serialized canonical LyricsV2 snapshot, verify it before saving, reject stale timing tracks, and enforce uniqueness of (song, YouTube video ID). Editing LyricsV2 should invalidate a track until reviewed. A separate track is needed when using another recording or different arrangement.

Security: P17.2 must gate any timing writes behind existing admin authorization. Do not expose draft tracks on public routes. No YouTube audio download is part of this feature.

P17.1 is intentionally **types, validation, and tests only**: no MongoDB writes, schema migration, public UI or player behavior changes.

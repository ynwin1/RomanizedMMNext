import type { LyricTimingTrack } from "../domain/lyric-timing.types";
import type { LyricsV2 } from "../domain/lyrics-v2.types";
import { parseLyricTimingTrack } from "./lyric-timing.validation";
import { lyricTimingFingerprint } from "./lyric-timing.fingerprint";

export interface TimingSong { youtubeLink?: string[]; lyricsV2?: LyricsV2 }
export interface TimingStorage {
  load(mmid: number, videoId: string): Promise<LyricTimingTrack | null>;
  save(mmid: number, track: LyricTimingTrack): Promise<void>;
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === "youtu.be" || host === "www.youtu.be") {
      const id = parsed.pathname.split("/")[1];
      return /^[a-zA-Z0-9_-]{11}$/.test(id || "") ? id : null;
    }
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "www.youtube-nocookie.com"].includes(host)) {
      const id = parsed.pathname === "/watch" ? parsed.searchParams.get("v") :
        parsed.pathname.match(/^\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})(?:\/|$)/)?.[1];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    return null;
  } catch { return null; }
}

export class LyricTimingService {
  constructor(private readonly storage: TimingStorage, private readonly loadSong: (mmid: number) => Promise<TimingSong>) {}

  private async context(mmid: number, videoId: string) {
    const song = await this.loadSong(mmid);
    if (!song.lyricsV2) throw new Error("LyricsV2 is required for synchronization");
    const ids = (song.youtubeLink || []).map(extractYouTubeVideoId);
    if (!ids.includes(videoId)) throw new Error("The recording must be attached to this song");
    return {lyrics: song.lyricsV2, fingerprint: lyricTimingFingerprint(song.lyricsV2)};
  }

  async save(mmid: number, input: unknown): Promise<LyricTimingTrack> {
    if (!Number.isSafeInteger(mmid) || mmid <= 0) throw new Error("Invalid song ID");
    // Validate input shape first; never trust client fingerprints or status.
    const candidate = input as Partial<LyricTimingTrack> | null;
    const videoId = candidate?.youtubeVideoId;
    if (typeof videoId !== "string") throw new Error("Missing recording ID");
    const {lyrics, fingerprint} = await this.context(mmid, videoId);
    const track = parseLyricTimingTrack(input, lyrics);
    if (track.lyricsFingerprint !== fingerprint) throw new Error("Lyrics changed; reload and retime before saving");
    await this.storage.save(mmid, track);
    return track;
  }

  async load(mmid: number, videoId: string, publishedOnly = false): Promise<LyricTimingTrack | null> {
    const {lyrics, fingerprint} = await this.context(mmid, videoId);
    const track = await this.storage.load(mmid, videoId);
    if (!track || track.lyricsFingerprint !== fingerprint || (publishedOnly && track.status !== "published")) return null;
    try { return parseLyricTimingTrack(track, lyrics); } catch { return null; }
  }
}

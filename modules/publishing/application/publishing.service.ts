import { z } from "zod";
import type { ArtistService } from "@/modules/artists/application/artist.service";
import type { ContentDraftRecord } from "@/modules/content-drafts";
import type { ContentDraftService } from "@/modules/content-drafts/application/content-draft.service";
import type { IngestionService } from "@/modules/ingestions/application/ingestion.service";
import type { SongRequestService } from "@/modules/requests/application/song-request.service";
import type { SongService } from "@/modules/songs/application/song.service";
import {
  DuplicatePublishedSongError,
  DuplicateSongError,
} from "@/modules/songs/application/song-write.error";
import { CreateSongSchema, type CreateSongInput } from "@/modules/songs/application/song.validation";
import type { SongEntity } from "@/modules/songs/domain/song.types";
import type { LyricsV2, LyricsV2Entry } from "@/modules/songs/domain/lyrics-v2.types";
import {
  DraftNotPublishableError,
  PublicationMmidAllocationError,
  PublicationStateError,
} from "./publishing.error";

const PublishableDraftSchema = z.object({
  identity: z.object({
    songName: z.string().trim().min(1),
  }),
  source: z.object({
    burmeseLyrics: z.string().refine(value => value.trim().length > 0),
  }),
  generated: z.object({
    romanized: z.string().refine(value => value.trim().length > 0),
    meaning: z.string().refine(value => value.trim().length > 0),
    about: z.string().refine(value => value.trim().length > 0),
    whenToListen: z.string().refine(value => value.trim().length > 0),
  }),
  metadata: z.object({
    genre: z.string().trim().min(1),
    albumName: z.string().optional(),
    spotifyTrackId: z.string().optional(),
    spotifyLink: z.string().optional(),
    appleMusicLink: z.string().optional(),
    youtubeLinks: z.array(z.string()).optional(),
    imageLink: z.string().optional(),
    requestedBy: z.string().optional(),
  }),
  artists: z.array(z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("resolved"),
      artistId: z.string(),
      name: z.string().trim().min(1),
      slug: z.string().trim().min(1),
    }),
    z.object({
      kind: z.literal("unresolved"),
      name: z.string().trim().min(1),
    }),
  ])).min(1),
});

function alignedLines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function buildLyricsV2(source: string, romanized: string, meaning: string): LyricsV2 {
  const sourceLines = alignedLines(source);
  const romanizedLines = alignedLines(romanized);
  const meaningLines = alignedLines(meaning);

  if (
    sourceLines.length !== romanizedLines.length ||
    sourceLines.length !== meaningLines.length
  ) {
    throw new DraftNotPublishableError(
      "Burmese, Romanized, and Meaning lyrics must have matching line counts before publishing.",
    );
  }

  const entries: LyricsV2Entry[] = [];
  for (let index = 0; index < sourceLines.length; index++) {
    const burmese = sourceLines[index];
    const romanizedLine = romanizedLines[index];
    const meaningLine = meaningLines[index];
    const sourceBlank = !burmese.trim();

    if (sourceBlank) {
      if (romanizedLine.trim() || meaningLine.trim()) {
        throw new DraftNotPublishableError(
          "Lyric section breaks must be blank across Burmese, Romanized, and Meaning.",
        );
      }
      if (entries.length > 0 && entries[entries.length - 1].kind !== "break") {
        entries.push({ kind: "break" });
      }
      continue;
    }

    if (!romanizedLine.trim()) {
      throw new DraftNotPublishableError(
        "Every Burmese lyric line must have a Romanized line before publishing.",
      );
    }

    entries.push({
      kind: "line",
      burmese,
      romanized: romanizedLine,
      meaning: meaningLine.trim() ? meaningLine : null,
    });
  }

  if (entries[entries.length - 1]?.kind === "break") entries.pop();
  if (!entries.some(entry => entry.kind === "line")) {
    throw new DraftNotPublishableError("Lyrics must contain at least one lyric line.");
  }

  return { version: 2, entries };
}

function mapDraft(draft: ContentDraftRecord, mmid: number): CreateSongInput {
  const parsed = PublishableDraftSchema.safeParse(draft);
  if (!parsed.success) throw new DraftNotPublishableError();

  const value = parsed.data;
  const canonical = CreateSongSchema.safeParse({
    mmid,
    songName: value.identity.songName,
    artistName: value.artists.map(artist =>
      artist.kind === "resolved"
        ? { name: artist.name, slug: artist.slug }
        : { name: artist.name },
    ),
    albumName: value.metadata.albumName,
    genre: value.metadata.genre,
    spotifyTrackId: value.metadata.spotifyTrackId,
    spotifyLink: value.metadata.spotifyLink,
    appleMusicLink: value.metadata.appleMusicLink,
    youtubeLink: value.metadata.youtubeLinks,
    imageLink: value.metadata.imageLink,
    about: value.generated.about,
    whenToListen: value.generated.whenToListen,
    // Legacy canonical field. It is not used by the current song page; keep it truthful
    // until the legacy field is removed in a dedicated cleanup.
    lyrics: value.source.burmeseLyrics,
    romanized: value.generated.romanized,
    burmese: value.source.burmeseLyrics,
    meaning: value.generated.meaning,
    lyricsV2: buildLyricsV2(
      value.source.burmeseLyrics,
      value.generated.romanized,
      value.generated.meaning,
    ),
    isRequested: true,
    requestedBy: value.metadata.requestedBy,
  });

  if (!canonical.success) throw new DraftNotPublishableError();
  return canonical.data;
}

export class PublishingService {
  constructor(
    private readonly ingestions: Pick<IngestionService, "getById" | "transition">,
    private readonly drafts: Pick<ContentDraftService, "getByIngestionId">,
    private readonly songs: Pick<
      SongService,
      "getPublishedByIngestion" | "getNextMmid" | "createPublishedSong"
    >,
    private readonly artists: Pick<ArtistService, "addSongReference">,
    private readonly requests: Pick<SongRequestService, "getAdminDetail" | "updateStatus">,
  ) {}

  async publish(ingestionId: unknown, updatedBy?: string): Promise<SongEntity> {
    let ingestion = await this.ingestions.getById(ingestionId);
    if (ingestion.status !== "ready_for_review" && ingestion.status !== "approved") {
      throw new PublicationStateError();
    }

    const draft = await this.drafts.getByIngestionId(ingestion.id);
    // Validate before looking for/creating the canonical Song so a stale or incomplete
    // draft cannot accidentally be finalized.
    mapDraft(draft, 1);

    let song = await this.songs.getPublishedByIngestion(ingestion.id);
    if (!song) song = await this.createSongWithRetry(draft, ingestion.id, updatedBy);

    for (const artist of draft.artists) {
      if (artist.kind === "resolved") {
        await this.artists.addSongReference(artist.slug, song.mmid, updatedBy);
      }
    }

    const request = await this.requests.getAdminDetail(ingestion.songRequestId);
    if (request.status !== "completed") {
      if (request.status !== "accepted") {
        throw new PublicationStateError("The source request is not accepted.");
      }
      await this.requests.updateStatus(
        request.id,
        request.revision,
        "completed",
        updatedBy,
      );
    }

    ingestion = await this.ingestions.getById(ingestion.id);
    if (ingestion.status !== "approved") {
      if (ingestion.status !== "ready_for_review") throw new PublicationStateError();
      await this.ingestions.transition(
        ingestion.id,
        ingestion.revision,
        "approved",
        updatedBy,
      );
    }

    return song;
  }

  private async createSongWithRetry(
    draft: ContentDraftRecord,
    ingestionId: string,
    updatedBy?: string,
  ): Promise<SongEntity> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const mmid = await this.songs.getNextMmid();
      try {
        return await this.songs.createPublishedSong(
          mapDraft(draft, mmid),
          ingestionId,
          updatedBy,
        );
      } catch (error) {
        if (error instanceof DuplicatePublishedSongError) {
          const existing = await this.songs.getPublishedByIngestion(ingestionId);
          if (existing) return existing;
          throw error;
        }
        if (error instanceof DuplicateSongError) continue;
        throw error;
      }
    }

    throw new PublicationMmidAllocationError();
  }
}

import type { SongCoverVideo } from "../domain/song-cover.types";
import type { SongCoverRepository, StoredSongCover } from "./song-cover.repository";
import {
  CoverSongIdSchema,
  CoverRecordIdSchema,
  CreateAdminCoverSchema,
  EditCoverSchema,
  ReviewCoverSchema,
  ReorderCoverSchema,
} from "./song-cover.validation";
import { parseYouTubeVideoId } from "./song-cover.youtube";
import type { YouTubeCoverMetadata } from "./song-cover.metadata";

export class CoverNotFoundError extends Error {}
export class CoverConflictError extends Error {}

export class SongCoverService {
  constructor(
    private readonly repository: SongCoverRepository,
    private readonly songExists: (mmid: number) => Promise<boolean>,
    private readonly lookupMetadata: (url: string) => Promise<YouTubeCoverMetadata | null> = async () => null,
  ) {}

  private async ensureSong(mmid: number): Promise<void> {
    if (!(await this.songExists(mmid))) throw new CoverNotFoundError("Song not found");
  }

  async approved(mmidInput: unknown): Promise<StoredSongCover[]> {
    const mmid = CoverSongIdSchema.parse(mmidInput);
    return this.repository.list(mmid, "approved");
  }

  async adminList(mmidInput: unknown): Promise<StoredSongCover[]> {
    const mmid = CoverSongIdSchema.parse(mmidInput);
    await this.ensureSong(mmid);
    return this.repository.list(mmid);
  }

  async adminAdd(mmidInput: unknown, input: unknown, actor: string): Promise<StoredSongCover> {
    const mmid = CoverSongIdSchema.parse(mmidInput);
    const data = CreateAdminCoverSchema.parse(input);
    await this.ensureSong(mmid);
    const youtubeVideoId = parseYouTubeVideoId(data.youtubeUrl);
    if (!youtubeVideoId) throw new Error("Invalid YouTube video URL");
    const existing = await this.repository.list(mmid);
    if (existing.some(item => item.youtubeVideoId === youtubeVideoId)) {
      throw new CoverConflictError("This video is already linked to this song");
    }
    const metadata = await this.lookupMetadata(data.youtubeUrl).catch(() => null);
    const record: SongCoverVideo = {
      mmid,
      youtubeVideoId,
      source: "admin",
      status: "approved",
      sortOrder: existing.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1,
      title: data.title || metadata?.title,
      thumbnailUrl: metadata?.thumbnailUrl,
      description: data.description,
      contributorName: data.contributorName,
      reviewedBy: actor,
      reviewedAt: new Date(),
    };
    try {
      return await this.repository.insert(record);
    } catch (error) {
      if (isDuplicateKey(error)) throw new CoverConflictError("This video is already linked to this song");
      throw error;
    }
  }

  async adminEdit(mmidInput: unknown, idInput: unknown, input: unknown): Promise<StoredSongCover> {
    const mmid = CoverSongIdSchema.parse(mmidInput);
    const id = CoverRecordIdSchema.parse(idInput);
    const changes = EditCoverSchema.parse(input);
    const record = await this.repository.edit(mmid, id, changes);
    if (!record) throw new CoverNotFoundError("Cover not found");
    return record;
  }

  async adminRemove(mmidInput: unknown, idInput: unknown): Promise<void> {
    const mmid = CoverSongIdSchema.parse(mmidInput);
    const id = CoverRecordIdSchema.parse(idInput);
    if (!(await this.repository.remove(mmid, id))) throw new CoverNotFoundError("Cover not found");
  }

  async adminReview(mmidInput: unknown, idInput: unknown, decision: unknown, actor: string): Promise<StoredSongCover> {
    const mmid = CoverSongIdSchema.parse(mmidInput);
    const id = CoverRecordIdSchema.parse(idInput);
    const status = ReviewCoverSchema.parse(decision);
    const record = await this.repository.edit(mmid, id, {
      status, reviewedAt: new Date(), reviewedBy: actor,
    }, "pending");
    if (!record) throw new CoverConflictError("Cover not found or already reviewed");
    return record;
  }

  async adminReorder(mmidInput: unknown, idInput: unknown): Promise<void> {
    const mmid = CoverSongIdSchema.parse(mmidInput);
    const ids = ReorderCoverSchema.parse(idInput);
    const existing = await this.adminList(mmid);
    const expected = new Set(existing.map(item => item.id));
    if (ids.length !== expected.size || new Set(ids).size !== ids.length ||
      ids.some(id => !expected.has(id))) {
      throw new CoverConflictError("Reorder must include every cover for this song exactly once");
    }
    await this.repository.reorder(mmid, ids);
  }
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null &&
    "code" in error && error.code === 11000;
}

import connectDB from "@/infrastructure/database/mongodb";
import { SongCoverModel } from "./song-cover.model";
import type { SongCoverVideo, SongCoverStatus } from "../domain/song-cover.types";
import type { StoredSongCover, SongCoverRepository, CoverReviewQuery, CoverReviewPage } from "../application/song-cover.repository";

function toCover(record: SongCoverVideo & { _id: unknown }): StoredSongCover {
  return {
    id: String(record._id),
    mmid: record.mmid,
    youtubeVideoId: record.youtubeVideoId,
    title: record.title,
    description: record.description,
    thumbnailUrl: record.thumbnailUrl,
    contributorName: record.contributorName,
    status: record.status,
    source: record.source,
    sortOrder: record.sortOrder,
    reviewedAt: record.reviewedAt,
    reviewedBy: record.reviewedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class MongoSongCoverRepository implements SongCoverRepository {
  async listCommunity({status, page, limit, mmids}: CoverReviewQuery): Promise<CoverReviewPage> {
    if (mmids?.length === 0) return {items: [], total: 0, page, limit, totalPages: 0};
    await connectDB();
    const filter = {source: "community", status, ...(mmids ? {mmid: {$in: mmids}} : {})};
    const [rows, total] = await Promise.all([
      SongCoverModel.find(filter).sort({createdAt: -1, _id: -1})
        .skip((page - 1) * limit).limit(limit).lean(),
      SongCoverModel.countDocuments(filter),
    ]);
    return {items: rows.map(row => toCover(row)), total, page, limit, totalPages: Math.ceil(total / limit)};
  }

  async list(mmid: number, status?: SongCoverStatus): Promise<StoredSongCover[]> {
    await connectDB();
    const rows = await SongCoverModel.find({ mmid, ...(status ? { status } : {}) })
      .sort({ sortOrder: 1, createdAt: 1, _id: 1 }).lean();
    return rows.map(row => toCover(row));
  }

  async get(mmid: number, id: string): Promise<StoredSongCover | null> {
    await connectDB();
    const row = await SongCoverModel.findOne({ mmid, _id: id }).lean();
    return row ? toCover(row) : null;
  }

  async insert(input: SongCoverVideo): Promise<StoredSongCover> {
    await connectDB();
    const record = await SongCoverModel.create(input);
    return toCover(record.toObject());
  }

  async edit(mmid: number, id: string, changes: Record<string, unknown>, expectedStatus?: SongCoverStatus): Promise<StoredSongCover | null> {
    await connectDB();
    const row = await SongCoverModel.findOneAndUpdate(
      { mmid, _id: id, ...(expectedStatus ? { status: expectedStatus } : {}) },
      { $set: changes },
      { new: true, runValidators: true },
    ).lean();
    return row ? toCover(row) : null;
  }

  async remove(mmid: number, id: string): Promise<boolean> {
    await connectDB();
    const result = await SongCoverModel.deleteOne({ mmid, _id: id });
    return result.deletedCount === 1;
  }

  async reorder(mmid: number, ids: string[]): Promise<void> {
    if (!ids.length) return;
    await connectDB();
    await SongCoverModel.bulkWrite(ids.map((id, sortOrder) => ({
      updateOne: {
        filter: { mmid, _id: id },
        update: { $set: { sortOrder } },
      },
    })));
  }
}

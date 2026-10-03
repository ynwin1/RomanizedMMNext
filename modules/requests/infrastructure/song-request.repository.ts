import { adminPage, type AdminPage } from "@/shared/admin-list";
import type { AdminSongRequestDetail, AdminSongRequestRecord, SongRequestQueueItem } from "../application/song-request.dto";
import type { AdminRequestQuery } from "../application/song-request.admin-query";
import { requestAdminFilter } from "./song-request.admin-filter";
import connectDB from "@/infrastructure/database/mongodb";
import type { CreateSongRequestInput, SongRequestEntity, SongRequestStatus, StoredSongRequestStatus } from "../domain/song-request.types";
import SongRequest, { type ISongRequest } from "./song-request.model";
import { ISongRequestRepository } from "../application/song-request.repository";

type SongRequestPersistenceRecord = Pick<ISongRequest, Exclude<keyof SongRequestEntity, "id">> & { _id?: unknown };

function managedStatus(status?: StoredSongRequestStatus | null): SongRequestStatus {
  if (!status) return "pending";
  return status === "added" ? "completed" : status;
}

function toEntity(request: SongRequestPersistenceRecord): SongRequestEntity {
  return {
    id: request._id == null ? "" : String(request._id),
    songName: request.songName,
    artist: request.artist,
    youtubeLink: request.youtubeLink,
    details: request.details,
    notifyEmail: request.notifyEmail,
    requestedBy: request.requestedBy,
    songStory: request.songStory,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    updatedBy: request.updatedBy,
    status: request.status,
  };
}

export class MongoSongRequestRepository implements ISongRequestRepository {
  async countAdmin(status?: SongRequestStatus): Promise<number> {
    await connectDB();
    return SongRequest.countDocuments(requestAdminFilter("", status));
  }

  async listAdmin(query: AdminRequestQuery): Promise<AdminPage<AdminSongRequestRecord>> {
    await connectDB();
    const filter = requestAdminFilter(query.q, query.status);
    const [rows, total] = await Promise.all([
      SongRequest.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit)
        .limit(query.limit).select("songName artist status createdAt").lean(),
      SongRequest.countDocuments(filter),
    ]);
    return adminPage(rows.map(row => ({
      id: String(row._id),
      songName: row.songName,
      artist: row.artist,
      status: managedStatus(row.status),
      createdAt: row.createdAt,
    })), total, query);
  }

  async create(input: CreateSongRequestInput): Promise<SongRequestEntity> {
    await connectDB();
    const request = await SongRequest.create(input);
    return toEntity(request.toObject());
  }

  async listQueue(): Promise<SongRequestQueueItem[]> {
    await connectDB();
    return SongRequest.find().select("songName artist -_id").lean();
  }

  async findAdminDetail(id: string): Promise<AdminSongRequestDetail | null> {
    await connectDB();
    const request = await SongRequest.findById(id).lean();
    return request ? { ...toEntity(request), status: managedStatus(request.status), revision: request.__v ?? 0 } : null;
  }

  async updateStatus(id: string, revision: number, status: SongRequestStatus, updatedBy?: string): Promise<SongRequestEntity | null> {
    await connectDB();
    const versionFilter = revision === 0 ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] } : { __v: revision };
    const request = await SongRequest.findOneAndUpdate(
      { _id: id, ...versionFilter },
      { $set: { status, ...(updatedBy ? { updatedBy } : {}) }, $inc: { __v: 1 } },
      { new: true, runValidators: true, upsert: false },
    ).lean();
    return request ? toEntity(request) : null;
  }

  async findById(id: string): Promise<SongRequestEntity | null> {
    await connectDB();
    const request = await SongRequest.findById(id).lean();
    return request ? toEntity(request) : null;
  }
}

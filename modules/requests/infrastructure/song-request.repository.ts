import { adminPage, type AdminPage, type AdminListQuery } from "@/shared/admin-list";
import { literalSearch } from "@/shared/literal-search";
import type { AdminSongRequestRecord } from "../application/song-request.dto";
import type { AdminRequestQuery } from "../application/song-request.admin-query";
import { requestAdminFilter } from "./song-request.admin-filter";
import connectDB from "@/infrastructure/database/mongodb";
import { CreateSongRequestInput, SongRequestEntity } from "../domain/song-request.types";
import { SongRequestQueueItem } from "../application/song-request.dto";
import SongRequest, { type ISongRequest } from "./song-request.model";
import { ISongRequestRepository } from "../application/song-request.repository";

type SongRequestPersistenceRecord = Pick<ISongRequest, Exclude<keyof SongRequestEntity, "id">> & { _id?: unknown };

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
    status: request.status,
  };
}

export class MongoSongRequestRepository implements ISongRequestRepository {
  async countAdmin(status?: "pending" | "added"): Promise<number> {
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
    return adminPage(rows.map(row => ({ id: String(row._id), songName: row.songName, artist: row.artist, status: row.status ?? "pending", createdAt: row.createdAt })), total, query);
  }

  async create(input: CreateSongRequestInput): Promise<SongRequestEntity> {
    await connectDB();
    const request = await SongRequest.create(input);
    return toEntity(request.toObject());
  }

  async listQueue(): Promise<SongRequestQueueItem[]> {
    await connectDB();
    return SongRequest.find()
      .select("songName artist -_id")
      .lean();
  }
}

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

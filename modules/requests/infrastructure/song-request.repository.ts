import connectDB from "@/infrastructure/database/mongodb";
import { CreateSongRequestInput, SongRequestEntity } from "../domain/song-request.types";
import { SongRequestQueueItem } from "../application/song-request.dto";
import SongRequest from "./song-request.model";

function toEntity(request: any): SongRequestEntity {
  return {
    id: request._id?.toString?.() ?? "",
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

export interface ISongRequestRepository {
  create(input: CreateSongRequestInput): Promise<SongRequestEntity>;
  listQueue(): Promise<SongRequestQueueItem[]>;
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

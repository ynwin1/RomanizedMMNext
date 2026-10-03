import { SongRequestQueueItem } from "./song-request.dto";
import { CreateSongRequestInput, SongRequestEntity } from "../domain/song-request.types";
import { ISongRequestRepository } from "./song-request.repository";

export class SongRequestService {
  constructor(private readonly requests: ISongRequestRepository) {}

  async create(input: CreateSongRequestInput): Promise<SongRequestEntity> {
    return this.requests.create(input);
  }

  async getQueue(): Promise<SongRequestQueueItem[]> {
    return this.requests.listQueue();
  }
}

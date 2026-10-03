import {
  CreateSongRequestInput,
  SongRequestEntity,
} from "../domain/song-request.types";
import { SongRequestQueueItem } from "./song-request.dto";

export interface ISongRequestRepository {
  create(input: CreateSongRequestInput): Promise<SongRequestEntity>;
  listQueue(): Promise<SongRequestQueueItem[]>;
}

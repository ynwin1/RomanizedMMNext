import { AdminRequestQuerySchema, type AdminRequestQuery } from "./song-request.admin-query";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminSongRequestRecord } from "./song-request.dto";
import {
  CreateSongRequestInput,
  SongRequestEntity,
} from "../domain/song-request.types";
import { SongRequestQueueItem } from "./song-request.dto";

export interface ISongRequestRepository {
  listAdmin(query: AdminRequestQuery): Promise<AdminPage<AdminSongRequestRecord>>;
  countAdmin(status?: "pending" | "added"): Promise<number>;
  create(input: CreateSongRequestInput): Promise<SongRequestEntity>;
  listQueue(): Promise<SongRequestQueueItem[]>;
}

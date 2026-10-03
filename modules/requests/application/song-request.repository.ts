import type { AdminRequestQuery } from "./song-request.admin-query";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminSongRequestDetail, AdminSongRequestRecord, SongRequestQueueItem } from "./song-request.dto";
import type { CreateSongRequestInput, SongRequestEntity, SongRequestStatus } from "../domain/song-request.types";

export interface ISongRequestRepository {
  listAdmin(query: AdminRequestQuery): Promise<AdminPage<AdminSongRequestRecord>>;
  countAdmin(status?: SongRequestStatus): Promise<number>;
  create(input: CreateSongRequestInput): Promise<SongRequestEntity>;
  listQueue(): Promise<SongRequestQueueItem[]>;
  findAdminDetail(id: string): Promise<AdminSongRequestDetail | null>;
  updateStatus(id: string, revision: number, status: SongRequestStatus, updatedBy?: string): Promise<SongRequestEntity | null>;
  findById(id: string): Promise<SongRequestEntity | null>;
}

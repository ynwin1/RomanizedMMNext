import { AdminRequestQuerySchema, type AdminRequestQuery } from "./song-request.admin-query";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminSongRequestRecord } from "./song-request.dto";
import { SongRequestQueueItem } from "./song-request.dto";
import { CreateSongRequestInput, SongRequestEntity } from "../domain/song-request.types";
import { ISongRequestRepository } from "./song-request.repository";

export class SongRequestService {
  constructor(private readonly requests: ISongRequestRepository) {}

  async getAdminList(input: unknown = {}): Promise<AdminPage<AdminSongRequestRecord>> {
    const query = AdminRequestQuerySchema.parse(input);
    return this.requests.listAdmin(query);
  }

  async getAdminCount(status?: "pending" | "added"): Promise<number> {
    if (status !== undefined) AdminRequestQuerySchema.parse({ status });
    return this.requests.countAdmin(status);
  }

  async create(input: CreateSongRequestInput): Promise<SongRequestEntity> {
    return this.requests.create(input);
  }

  async getQueue(): Promise<SongRequestQueueItem[]> {
    return this.requests.listQueue();
  }
}

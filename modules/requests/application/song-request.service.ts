import { AdminRequestQuerySchema } from "./song-request.admin-query";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminSongRequestDetail, AdminSongRequestRecord, SongRequestQueueItem } from "./song-request.dto";
import type { CreateSongRequestInput, SongRequestEntity, SongRequestStatus } from "../domain/song-request.types";
import { ISongRequestRepository } from "./song-request.repository";
import { SongRequestIdSchema, SongRequestRevisionSchema, SongRequestStatusSchema } from "./song-request.validation";
import { SongRequestConflictError } from "./song-request-write.error";
import { NotFoundError } from "@/shared/errors/not-found.error";

export class SongRequestService {
  constructor(private readonly requests: ISongRequestRepository) {}

  async getAdminList(input: unknown = {}): Promise<AdminPage<AdminSongRequestRecord>> {
    return this.requests.listAdmin(AdminRequestQuerySchema.parse(input));
  }

  async getAdminCount(status?: SongRequestStatus): Promise<number> {
    if (status !== undefined) SongRequestStatusSchema.parse(status);
    return this.requests.countAdmin(status);
  }

  async create(input: CreateSongRequestInput): Promise<SongRequestEntity> {
    return this.requests.create(input);
  }

  async getQueue(): Promise<SongRequestQueueItem[]> {
    return this.requests.listQueue();
  }

  async getAdminDetail(id: unknown): Promise<AdminSongRequestDetail> {
    const parsed = SongRequestIdSchema.parse(id);
    const request = await this.requests.findAdminDetail(parsed);
    if (!request) throw new NotFoundError("Song request not found", "SONG_REQUEST_NOT_FOUND");
    return request;
  }

  async updateStatus(id: unknown, revision: unknown, status: unknown): Promise<SongRequestEntity> {
    const requestId = SongRequestIdSchema.parse(id);
    const expectedRevision = SongRequestRevisionSchema.parse(revision);
    const nextStatus = SongRequestStatusSchema.parse(status);
    const request = await this.requests.updateStatus(requestId, expectedRevision, nextStatus);
    if (request) return request;
    if (!(await this.requests.findById(requestId))) throw new NotFoundError("Song request not found", "SONG_REQUEST_NOT_FOUND");
    throw new SongRequestConflictError();
  }
}

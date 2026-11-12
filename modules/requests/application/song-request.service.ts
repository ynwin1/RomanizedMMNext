import { AdminRequestQuerySchema } from "./song-request.admin-query";
import type { AdminPage } from "@/shared/admin-list";
import type { AdminSongRequestDetail, AdminSongRequestRecord, SongRequestQueueItem } from "./song-request.dto";
import type { SongRequestEntity, SongRequestStatus } from "../domain/song-request.types";
import { ISongRequestRepository } from "./song-request.repository";
import {
  SongRequestIdSchema,
  SongRequestInputSchema,
  SongRequestRevisionSchema,
  SongRequestStatusSchema,
} from "./song-request.validation";
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

  /** Archive only outstanding requests; completed and accepted workflows stay intact. */
  async rejectOpenBefore(cutoff: Date, updatedBy: string): Promise<number> {
    if (!(cutoff instanceof Date) || !Number.isFinite(cutoff.getTime()) ||
        cutoff.getTime() > Date.now() + 60_000) {
      throw new Error("Invalid bulk rejection cutoff");
    }
    if (!updatedBy.trim()) throw new Error("Admin identity is required");
    return this.requests.rejectOpenBefore(cutoff, updatedBy);
  }

  async create(input: unknown): Promise<SongRequestEntity> {
    return this.requests.create(SongRequestInputSchema.parse(input));
  }

  async listAcceptedForFulfillment():Promise<AdminSongRequestDetail[]> {
    return this.requests.listAccepted();
  }

  async fulfillWithSong(id:unknown,mmid:number,updatedBy:string):Promise<void> {
    const requestId=SongRequestIdSchema.parse(id);
    if(!Number.isSafeInteger(mmid)||mmid<=0)throw new Error("Invalid fulfilled song");
    if(!updatedBy.trim())throw new Error("Admin identity is required");
    if(!await this.requests.fulfillAccepted(requestId,mmid,updatedBy))
      throw new SongRequestConflictError();
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

  async updateStatus(id: unknown, revision: unknown, status: unknown, updatedBy?: string): Promise<SongRequestEntity> {
    const requestId = SongRequestIdSchema.parse(id);
    const expectedRevision = SongRequestRevisionSchema.parse(revision);
    const nextStatus = SongRequestStatusSchema.parse(status);
    const request = await this.requests.updateStatus(requestId, expectedRevision, nextStatus, updatedBy);
    if (request) return request;
    if (!(await this.requests.findById(requestId))) throw new NotFoundError("Song request not found", "SONG_REQUEST_NOT_FOUND");
    throw new SongRequestConflictError();
  }
}

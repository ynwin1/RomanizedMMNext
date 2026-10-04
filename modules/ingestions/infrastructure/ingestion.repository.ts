import connectDB from "@/infrastructure/database/mongodb";
import type { IIngestionRepository } from "../application/ingestion.repository";
import type { CreateIngestionInput } from "../application/ingestion.validation";
import { DuplicateIngestionError } from "../application/ingestion-write.error";
import type { IngestionEntity, IngestionRecord, IngestionStatus } from "../domain/ingestion.types";
import Ingestion, { type IIngestion } from "./ingestion.model";

type IngestionPersistenceRecord = Pick<IIngestion, "songRequestId" | "status" | "createdAt" | "updatedAt" | "updatedBy"> & {
  _id?: unknown;
  __v?: number;
};

function toEntity(ingestion: IngestionPersistenceRecord): IngestionEntity {
  return {
    id: ingestion._id == null ? "" : String(ingestion._id),
    songRequestId: String(ingestion.songRequestId),
    status: ingestion.status,
    createdAt: ingestion.createdAt,
    updatedAt: ingestion.updatedAt,
    updatedBy: ingestion.updatedBy,
  };
}

function toRecord(ingestion: IngestionPersistenceRecord): IngestionRecord {
  return { ...toEntity(ingestion), revision: ingestion.__v ?? 0 };
}

export class MongoIngestionRepository implements IIngestionRepository {
  async create(input: CreateIngestionInput, updatedBy?: string): Promise<IngestionEntity> {
    await connectDB();
    try {
      const ingestion = await Ingestion.create({
        songRequestId: input.songRequestId,
        status: "awaiting_source",
        ...(updatedBy ? { updatedBy } : {}),
      });
      return toEntity(ingestion.toObject());
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new DuplicateIngestionError();
      }
      throw error;
    }
  }

  async findById(id: string): Promise<IngestionRecord | null> {
    await connectDB();
    const ingestion = await Ingestion.findById(id).lean();
    return ingestion ? toRecord(ingestion) : null;
  }

  async findByRequestId(songRequestId: string): Promise<IngestionRecord | null> {
    await connectDB();
    const ingestion = await Ingestion.findOne({ songRequestId }).lean();
    return ingestion ? toRecord(ingestion) : null;
  }

  async transition(
    id: string,
    revision: number,
    fromStatus: IngestionStatus,
    toStatus: IngestionStatus,
    updatedBy?: string,
  ): Promise<IngestionEntity | null> {
    await connectDB();
    const versionFilter = revision === 0
      ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] }
      : { __v: revision };

    const ingestion = await Ingestion.findOneAndUpdate(
      { _id: id, status: fromStatus, ...versionFilter },
      { $set: { status: toStatus, ...(updatedBy ? { updatedBy } : {}) }, $inc: { __v: 1 } },
      { new: true, runValidators: true, upsert: false },
    ).lean();

    return ingestion ? toEntity(ingestion) : null;
  }
}

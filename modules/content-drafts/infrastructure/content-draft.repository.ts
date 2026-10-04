import connectDB from "@/infrastructure/database/mongodb";
import type { IContentDraftRepository } from "../application/content-draft.repository";
import type { ContentDraftPatch, CreateContentDraftInput } from "../application/content-draft.validation";
import { DuplicateContentDraftError } from "../application/content-draft-write.error";
import type { ContentDraftEntity, ContentDraftRecord, DraftArtistReference } from "../domain/content-draft.types";
import ContentDraft, { type IContentDraft } from "./content-draft.model";

type PersistenceRecord = Pick<
  IContentDraft,
  "ingestionId" | "identity" | "source" | "generated" | "metadata" | "artists" | "createdAt" | "updatedAt" | "updatedBy"
> & {
  _id?: unknown;
  __v?: number;
};

function toEntity(draft: PersistenceRecord): ContentDraftEntity {
  return {
    id: draft._id == null ? "" : String(draft._id),
    ingestionId: String(draft.ingestionId),
    identity: { ...(draft.identity ?? {}) },
    source: { ...(draft.source ?? {}) },
    generated: { ...(draft.generated ?? {}) },
    metadata: { ...(draft.metadata ?? {}) },
    artists: (draft.artists ?? []).map(artist => {
      const value = artist as DraftArtistReference & { artistId?: unknown };
      return value.kind === "resolved"
        ? { kind: "resolved", artistId: String(value.artistId), name: value.name, slug: value.slug }
        : { kind: "unresolved", name: value.name };
    }),
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    updatedBy: draft.updatedBy,
  };
}

function writeOperations(patch: ContentDraftPatch, updatedBy?: string) {
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};

  for (const section of ["identity", "source", "generated", "metadata"] as const) {
    const values = patch[section];
    if (!values) continue;
    for (const [key, value] of Object.entries(values)) {
      const path = `${section}.${key}`;
      if (value === null) unset[path] = 1;
      else set[path] = value;
    }
  }

  if (patch.artists !== undefined) set.artists = patch.artists;
  if (updatedBy) set.updatedBy = updatedBy;

  return { set, unset };
}

export class MongoContentDraftRepository implements IContentDraftRepository {
  async create(input: CreateContentDraftInput, updatedBy?: string): Promise<ContentDraftEntity> {
    await connectDB();
    try {
      const draft = await ContentDraft.create({
        ingestionId: input.ingestionId,
        identity: {},
        source: {},
        generated: {},
        metadata: {},
        artists: [],
        ...(updatedBy ? { updatedBy } : {}),
      });
      return toEntity(draft.toObject());
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new DuplicateContentDraftError();
      }
      throw error;
    }
  }

  async findById(id: string): Promise<ContentDraftRecord | null> {
    await connectDB();
    const draft = await ContentDraft.findById(id).lean();
    return draft ? { ...toEntity(draft), revision: draft.__v ?? 0 } : null;
  }

  async findByIngestionId(ingestionId: string): Promise<ContentDraftRecord | null> {
    await connectDB();
    const draft = await ContentDraft.findOne({ ingestionId }).lean();
    return draft ? { ...toEntity(draft), revision: draft.__v ?? 0 } : null;
  }

  async update(
    id: string,
    revision: number,
    patch: ContentDraftPatch,
    updatedBy?: string,
  ): Promise<ContentDraftEntity | null> {
    await connectDB();
    const versionFilter = revision === 0
      ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] }
      : { __v: revision };

    const { set, unset } = writeOperations(patch, updatedBy);
    const update: Record<string, unknown> = { $inc: { __v: 1 } };
    if (Object.keys(set).length > 0) update.$set = set;
    if (Object.keys(unset).length > 0) update.$unset = unset;

    const draft = await ContentDraft.findOneAndUpdate(
      { _id: id, ...versionFilter },
      update,
      { new: true, runValidators: true, upsert: false },
    ).lean();

    return draft ? toEntity(draft) : null;
  }
}

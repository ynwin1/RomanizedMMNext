import connectDB from "@/infrastructure/database/mongodb";
import type { ILyricsMeaningReviewDraftRepository } from "../application/lyrics-meaning-review-draft.repository";
import type { LegacyLyricsSnapshot } from "../domain/lyrics-meaning-alignment.types";
import type {
  LyricsMeaningReviewDraft,
  LyricsMeaningReviewDraftRow,
} from "../domain/lyrics-meaning-review-draft.types";
import LyricsMeaningReviewDraftModel, { type ILyricsMeaningReviewDraft } from "./lyrics-meaning-review-draft.model";

type PersistenceRecord = Pick<
  ILyricsMeaningReviewDraft,
  "mmid" | "songName" | "legacySnapshot" | "rows" | "createdAt" | "updatedAt" | "updatedBy"
>;

function toEntity(value: PersistenceRecord): LyricsMeaningReviewDraft {
  return {
    mmid: value.mmid,
    songName: value.songName,
    legacySnapshot: {
      burmese: value.legacySnapshot.burmese,
      romanized: value.legacySnapshot.romanized,
      meaning: value.legacySnapshot.meaning,
    },
    rows: value.rows.map(row => ({
      index: row.index,
      burmese: row.burmese,
      romanized: row.romanized,
      meaning: row.meaning,
      source: row.source,
      confidence: row.confidence,
      edited: row.edited,
    })),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    updatedBy: value.updatedBy,
  };
}

export class MongoLyricsMeaningReviewDraftRepository implements ILyricsMeaningReviewDraftRepository {
  async findByMmid(mmid: number): Promise<LyricsMeaningReviewDraft | null> {
    await connectDB();
    const draft = await LyricsMeaningReviewDraftModel.findOne({ mmid }).lean();
    return draft ? toEntity(draft) : null;
  }

  async listMmids(): Promise<number[]> {
    await connectDB();
    const drafts = await LyricsMeaningReviewDraftModel.find({}).select("mmid -_id").lean();
    return drafts.map(draft => draft.mmid);
  }

  async upsertGenerated(
    mmid: number,
    songName: string,
    legacySnapshot: LegacyLyricsSnapshot,
    rows: LyricsMeaningReviewDraftRow[],
    updatedBy?: string,
  ): Promise<LyricsMeaningReviewDraft> {
    await connectDB();
    const draft = await LyricsMeaningReviewDraftModel.findOneAndUpdate(
      { mmid },
      {
        $set: {
          songName,
          legacySnapshot,
          rows,
          ...(updatedBy ? { updatedBy } : {}),
        },
      },
      { new: true, runValidators: true, upsert: true },
    ).lean();
    if (!draft) throw new Error("Failed to persist AI Meaning review draft.");
    return toEntity(draft);
  }

  async updateRowsIfSnapshotMatches(
    mmid: number,
    expected: LegacyLyricsSnapshot,
    rows: LyricsMeaningReviewDraftRow[],
    updatedBy?: string,
  ): Promise<LyricsMeaningReviewDraft | null> {
    await connectDB();
    const draft = await LyricsMeaningReviewDraftModel.findOneAndUpdate(
      {
        mmid,
        "legacySnapshot.burmese": expected.burmese,
        "legacySnapshot.romanized": expected.romanized,
        "legacySnapshot.meaning": expected.meaning,
      },
      {
        $set: {
          rows,
          ...(updatedBy ? { updatedBy } : {}),
        },
      },
      { new: true, runValidators: true, upsert: false },
    ).lean();
    return draft ? toEntity(draft) : null;
  }

  async deleteByMmid(mmid: number): Promise<void> {
    await connectDB();
    await LyricsMeaningReviewDraftModel.deleteOne({ mmid });
  }
}

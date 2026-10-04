import type { LegacyLyricsSnapshot } from "../domain/lyrics-meaning-alignment.types";
import type {
  LyricsMeaningReviewDraft,
  LyricsMeaningReviewDraftRow,
} from "../domain/lyrics-meaning-review-draft.types";

export interface ILyricsMeaningReviewDraftRepository {
  findByMmid(mmid: number): Promise<LyricsMeaningReviewDraft | null>;
  listMmids(): Promise<number[]>;
  upsertGenerated(
    mmid: number,
    songName: string,
    legacySnapshot: LegacyLyricsSnapshot,
    rows: LyricsMeaningReviewDraftRow[],
    updatedBy?: string,
  ): Promise<LyricsMeaningReviewDraft>;
  updateRowsIfSnapshotMatches(
    mmid: number,
    expected: LegacyLyricsSnapshot,
    rows: LyricsMeaningReviewDraftRow[],
    updatedBy?: string,
  ): Promise<LyricsMeaningReviewDraft | null>;
  deleteByMmid(mmid: number): Promise<void>;
}

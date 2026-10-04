import mongoose, { Model, models, Schema } from "mongoose";
import type { MeaningAlignmentConfidence, MeaningAlignmentSource } from "../domain/lyrics-meaning-alignment.types";

export interface ILyricsMeaningReviewDraft extends mongoose.Document {
  mmid: number;
  songName: string;
  legacySnapshot: {
    burmese: string;
    romanized: string;
    meaning: string;
  };
  rows: Array<{
    index: number;
    burmese: string;
    romanized: string;
    meaning: string;
    source: MeaningAlignmentSource;
    confidence: MeaningAlignmentConfidence;
    edited: boolean;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

const RowSchema = new Schema({
  index: { type: Number, required: true },
  burmese: { type: String, required: true },
  romanized: { type: String, required: true },
  meaning: { type: String, required: true },
  source: { type: String, required: true, enum: ["reused", "generated"] },
  confidence: { type: String, required: true, enum: ["high", "medium", "low"] },
  edited: { type: Boolean, required: true, default: false },
}, { _id: false });

const LyricsMeaningReviewDraftSchema: Schema<ILyricsMeaningReviewDraft> = new Schema({
  mmid: { type: Number, required: true, unique: true, index: true },
  songName: { type: String, required: true },
  legacySnapshot: {
    burmese: { type: String, required: true },
    romanized: { type: String, required: true },
    meaning: { type: String, required: true },
  },
  rows: { type: [RowSchema], required: true },
  updatedBy: { type: String },
}, { timestamps: true, minimize: false });

const LyricsMeaningReviewDraft: Model<ILyricsMeaningReviewDraft> =
  models.LyricsMeaningReviewDraft
    || mongoose.model("LyricsMeaningReviewDraft", LyricsMeaningReviewDraftSchema);

export default LyricsMeaningReviewDraft;

import mongoose, { Schema, models, type Model } from "mongoose";
import type { LyricTimingTrack } from "../domain/lyric-timing.types";

export interface StoredLyricTimingTrack extends LyricTimingTrack {
  mmid: number;
}
const lineSchema = new Schema({
  entryIndex: {type: Number, required: true},
  startMs: {type: Number, required: true},
  endMs: {type: Number, required: true},
}, {_id: false});
const timingSchema = new Schema({
  mmid: {type: Number, required: true},
  version: {type: Number, required: true, enum: [1]},
  youtubeVideoId: {type: String, required: true},
  lyricsFingerprint: {type: String, required: true},
  status: {type: String, required: true, enum: ["draft", "published"]},
  lines: {type: [lineSchema], required: true},
}, {timestamps: true});
timingSchema.index({mmid: 1, youtubeVideoId: 1}, {unique: true});
export const LyricTimingModel: Model<StoredLyricTimingTrack> =
  (models.LyricTimingTrack as Model<StoredLyricTimingTrack> | undefined) ??
  mongoose.model<StoredLyricTimingTrack>("LyricTimingTrack", timingSchema);

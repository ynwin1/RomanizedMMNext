import mongoose, { Schema, models, type Model } from "mongoose";
import {
  SONG_COVER_SOURCES,
  SONG_COVER_STATUSES,
  type SongCoverVideo,
} from "../domain/song-cover.types";

const songCoverSchema = new Schema<SongCoverVideo>({
  mmid: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: "mmid must be an integer",
    },
  },
  youtubeVideoId: {
    type: String,
    required: true,
    match: /^[a-zA-Z0-9_-]{11}$/,
  },
  title: { type: String, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 500 },
  thumbnailUrl: { type: String, trim: true },
  contributorName: { type: String, trim: true, maxlength: 100 },
  status: {
    type: String,
    required: true,
    enum: SONG_COVER_STATUSES,
    default: "pending",
  },
  source: { type: String, required: true, enum: SONG_COVER_SOURCES },
  sortOrder: { type: Number, required: true, min: 0, default: 0 },
  reviewedAt: { type: Date },
  reviewedBy: { type: String },
}, { timestamps: true, collection: "songCoverVideos" });

// The same YouTube video may appear on different songs, but only once per song.
songCoverSchema.index({ mmid: 1, youtubeVideoId: 1 }, { unique: true });
// Public listing and admin ordering.
songCoverSchema.index({ mmid: 1, status: 1, sortOrder: 1, createdAt: 1 });

export const SongCoverModel: Model<SongCoverVideo> =
  (models.SongCoverVideo as Model<SongCoverVideo> | undefined) ??
  mongoose.model<SongCoverVideo>("SongCoverVideo", songCoverSchema);

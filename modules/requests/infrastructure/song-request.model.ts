import mongoose, { Schema, Model, models } from "mongoose";
import type { StoredSongRequestStatus } from "../domain/song-request.types";

export interface ISongRequest extends mongoose.Document {
  songName: string;
  artist: string;
  youtubeLink?: string;
  details?: string;
  notifyEmail?: string;
  requestedBy?: string;
  songStory?: string;
  createdAt?: Date;
  status?: StoredSongRequestStatus;
}

const SongRequestSchema: Schema<ISongRequest> = new Schema({
  songName: { type: String, required: true },
  artist: { type: String, required: true },
  youtubeLink: { type: String },
  details: { type: String },
  notifyEmail: { type: String },
  requestedBy: { type: String },
  songStory: { type: String },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "reviewing", "accepted", "rejected", "completed", "added"], default: "pending" },
});

const SongRequest: Model<ISongRequest> = models.SongRequest || mongoose.model("SongRequest", SongRequestSchema);
export default SongRequest;

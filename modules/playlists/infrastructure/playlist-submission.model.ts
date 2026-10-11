import mongoose, {Schema, type Model, models} from "mongoose";
import {PLAYLIST_GENRES, type PlaylistGenre} from "../domain/playlist.types";

export interface IPlaylistSubmission {
  playlistId: string;
  url: string;
  genre: PlaylistGenre;
  status: "pending" | "approved" | "rejected";
  playlistRecordId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema<IPlaylistSubmission>({
  playlistId: {type: String, required: true},
  url: {type: String, required: true},
  genre: {type: String, enum: PLAYLIST_GENRES, required: true},
  status: {type: String, enum: ["pending", "approved", "rejected"], required: true, default: "pending"},
  playlistRecordId: String,
}, {timestamps: true});
schema.index({playlistId: 1, genre: 1, status: 1});
schema.index({playlistId: 1, genre: 1}, {unique: true, partialFilterExpression: {status: "pending"}});
schema.index({status: 1, createdAt: -1});

export const PlaylistSubmission: Model<IPlaylistSubmission> = models.PlaylistSubmission || mongoose.model<IPlaylistSubmission>("PlaylistSubmission", schema);

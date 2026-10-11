import mongoose, {Schema, type Model, models} from "mongoose";
import {PLAYLIST_GENRES, PLAYLIST_PLATFORMS, PLAYLIST_STATUSES, type PlaylistGenre, type PlaylistPlatform, type PlaylistStatus} from "../domain/playlist.types";

export interface IPlaylist {
  platform: PlaylistPlatform;
  platformPlaylistId: string;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  curator?: string;
  genres: PlaylistGenre[];
  status: PlaylistStatus;
  sortOrder: number;
  updatedBy?: string;
  __v?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const PlaylistSchema = new Schema<IPlaylist>({
  platform: {type: String, enum: PLAYLIST_PLATFORMS, required: true},
  platformPlaylistId: {type: String, required: true},
  url: {type: String, required: true},
  title: {type: String, required: true},
  description: {type: String},
  imageUrl: {type: String},
  curator: {type: String},
  genres: {type: [String], enum: PLAYLIST_GENRES, required: true},
  status: {type: String, enum: PLAYLIST_STATUSES, default: "draft", required: true},
  sortOrder: {type: Number, min: 0, default: 0},
  updatedBy: {type: String},
}, {timestamps: true});

// The same external playlist can be tagged with multiple genres but stored once.
PlaylistSchema.index({platform: 1, platformPlaylistId: 1}, {unique: true});
PlaylistSchema.index({status: 1, genres: 1, sortOrder: 1});

const Playlist: Model<IPlaylist> = models.Playlist || mongoose.model<IPlaylist>("Playlist", PlaylistSchema);
export default Playlist;

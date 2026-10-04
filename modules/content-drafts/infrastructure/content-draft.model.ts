import mongoose, { Model, models, Schema } from "mongoose";
import type { DraftArtistReference } from "../domain/content-draft.types";

export interface IContentDraft extends mongoose.Document {
  ingestionId: mongoose.Types.ObjectId;
  identity: {
    songName?: string;
  };
  source: {
    burmeseLyrics?: string;
  };
  generated: {
    romanized?: string;
    meaning?: string;
    about?: string;
    whenToListen?: string;
  };
  metadata: {
    albumName?: string;
    genre?: string;
    spotifyTrackId?: string;
    spotifyLink?: string;
    appleMusicLink?: string;
    youtubeLinks?: string[];
    imageLink?: string;
    requestedBy?: string;
  };
  artists: DraftArtistReference[];
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

const DraftArtistSchema = new Schema({
  kind: { type: String, required: true, enum: ["resolved", "unresolved"] },
  artistId: { type: Schema.Types.ObjectId },
  name: { type: String, required: true },
  slug: { type: String },
}, { _id: false });

const ContentDraftSchema: Schema<IContentDraft> = new Schema({
  ingestionId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
  identity: {
    songName: { type: String },
  },
  source: {
    burmeseLyrics: { type: String },
  },
  generated: {
    romanized: { type: String },
    meaning: { type: String },
    about: { type: String },
    whenToListen: { type: String },
  },
  metadata: {
    albumName: { type: String },
    genre: { type: String },
    spotifyTrackId: { type: String },
    spotifyLink: { type: String },
    appleMusicLink: { type: String },
    youtubeLinks: { type: [String] },
    imageLink: { type: String },
    requestedBy: { type: String },
  },
  artists: { type: [DraftArtistSchema], default: [] },
  updatedBy: { type: String },
}, { timestamps: true, minimize: false });

const ContentDraft: Model<IContentDraft> =
  models.ContentDraft || mongoose.model("ContentDraft", ContentDraftSchema);

export default ContentDraft;

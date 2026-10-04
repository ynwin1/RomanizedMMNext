import mongoose, { Schema, Model, models } from "mongoose";
import type { LyricsV2 } from "../domain/lyrics-v2.types";

export interface ISong extends mongoose.Document {
    mmid: number;
    songName: string;
    artistName: [{
        name: string,
        slug?: string
    }]
    albumName?: string;
    genre: string;
    spotifyTrackId?: string;
    spotifyLink?: string;
    appleMusicLink?: string;
    youtubeLink?: string[];
    imageLink?: string;
    about: string;
    whenToListen: string;
    lyrics: string;
    romanized: string;
    burmese: string;
    meaning: string;
    lyricsV2?: LyricsV2;
    sourceIngestionId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    updatedBy?: string;
    isRequested?: boolean;
    requestedBy?: string;
    songStoryEn?: string;
    songStoryMy?: string;
}

const LyricsV2EntrySchema = new Schema({
    kind: { type: String, enum: ["line", "break"], required: true },
    burmese: { type: String },
    romanized: { type: String },
    meaning: { type: String },
}, { _id: false });

const LyricsV2Schema = new Schema({
    version: { type: Number, enum: [2], required: true },
    entries: { type: [LyricsV2EntrySchema], required: true },
}, { _id: false });

const SongSchema: Schema<ISong> = new Schema({
    mmid: { type: Number, required: true, unique: true },
    songName: { type: String, required: true },
    artistName: { type: [
            {
                name: { type: String, required: true },
                slug: { type: String, required: false },
            },
        ]
    },
    albumName: { type: String },
    genre: { type: String, required: true },
    spotifyTrackId: { type: String },
    spotifyLink: { type: String },
    appleMusicLink: { type: String },
    youtubeLink: { type: [String] },
    imageLink: { type: String },
    about: { type: String, required: true },
    whenToListen: { type: String, required: true },
    lyrics: { type: String, required: true },
    romanized: { type: String, required: true },
    burmese: { type: String, required: true },
    meaning: { type: String, required: true },
    lyricsV2: { type: LyricsV2Schema },
    sourceIngestionId: { type: String, unique: true, sparse: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedBy: { type: String },
    isRequested: { type: Boolean, default: false },
    requestedBy: { type: String },
    songStoryEn: { type: String },
    songStoryMy: { type: String },
}, { timestamps: true });

const Song: Model<ISong> = models.Song || mongoose.model("Song", SongSchema);
export default Song;

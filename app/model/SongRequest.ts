import mongoose, { Schema, Model, models } from "mongoose";

export interface ISongRequest extends mongoose.Document {
    songName: string;
    artist: string;
    youtubeLink?: string;
    details?: string;
}

const SongRequestSchema: Schema<ISongRequest> = new Schema({
    songName: { type: String, required: true },
    artist: { type: String, required: true },
    youtubeLink: { type: String },
    details: { type: String },
});

const SongRequest: Model<ISongRequest> = models.SongRequest || mongoose.model("SongRequest", SongRequestSchema);

export default SongRequest;




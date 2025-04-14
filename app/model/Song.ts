import mongoose, { Schema, Model, models } from "mongoose";

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
    youtubeLink?: string;
    imageLink?: string;
    about: string;
    whenToListen: string;
    lyrics: string;
    romanized: string;
    burmese: string;
    meaning: string;
}

const SongSchema: Schema<ISong> = new Schema({
    mmid: { type: Number, required: true, unique: true },
    songName: { type: String, required: true },
    artistName: { type: [
            {
                name: { type: String, required: true },
                slug: { type: String, required: true, unique: true}
            },
        ]
    },
    albumName: { type: String },
    genre: { type: String, required: true },
    spotifyTrackId: { type: String },
    spotifyLink: { type: String },
    appleMusicLink: { type: String },
    youtubeLink: { type: String },
    imageLink: { type: String },
    about: { type: String, required: true },
    whenToListen: { type: String, required: true },
    lyrics: { type: String, required: true },
    romanized: { type: String, required: true },
    burmese: { type: String, required: true },
    meaning: { type: String, required: true },
});

const Song: Model<ISong> = models.Song || mongoose.model("Song", SongSchema);
export default Song;
import mongoose, { Schema, Model, models } from "mongoose";

export interface IArtist extends mongoose.Document {
    name: string;
    slug: string;
    imageLink?: string;
    bannerLink?: string;
    biography: string;
    biographyMy?: string;
    unknownFact?: string;
    type: "Singer" | "Band";
    members?: string[];
    origin?: string[];
    labels?: string[];
    musicGenre: string[];
    songs: number[];
    socials?: {
        facebook?: string;
        instagram?: string;
        youtube?: string;
        spotify?: string;
        appleMusic?: string;
    },
    likes: number;
}

const ArtistSchema: Schema<IArtist> = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    imageLink: { type: String },
    bannerLink: { type: String },
    biography: { type: String, required: true },
    biographyMy: { type: String },
    unknownFact: { type: String },
    type: { type: String, required: true },
    members: { type: [String] },
    origin: { type: [String] },
    labels: { type: [String] },
    musicGenre: { type: [String], required: true },
    songs: { type: [Number], required: true },
    socials: {
        facebook: { type: String },
        instagram: { type: String },
        youtube: { type: String },
        spotify: { type: String },
        appleMusic: { type: String },
    },
    likes: { type: Number, default: 0 },
});

const Artist: Model<IArtist> = models.Artist || mongoose.model("Artist", ArtistSchema);

export default Artist;
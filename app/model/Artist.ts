import mongoose, { Schema, Model, models } from "mongoose";
import { ArtistType } from "../lib/types";

export interface IArtist extends mongoose.Document {
    name: string;
    slug: string;
    imageLink: string;
    bannerLink?: string;
    biography?: string;
    biographyMy?: string;
    unknownFact?: string;
    type: ArtistType;
    members?: [{
        name: string;
        imageLink?: string;
        slug?: string;
    }]
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
    imageLink: { type: String, required: true },
    bannerLink: { type: String },
    biography: { type: String, required: false },
    biographyMy: { type: String },
    unknownFact: { type: String },
    type: { type: String, required: true },
    members: { type: [
        {
        name: { type: String, required: true },
        imageLink: { type: String, required: false },
        slug: { type: String, required: false },
        }
        ]
    },
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
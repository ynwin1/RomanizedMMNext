import mongoose, { Schema, Model, models } from "mongoose";
import { GameMode } from "../lib/constants";

export interface ITriviaScore extends mongoose.Document {
    userName: string,
    score: number,
    country: string,
    date: Date,
    gameMode: GameMode,
}

const TriviaScoreSchema: Schema<ITriviaScore> = new Schema({
    userName: { type: String, required: true },
    score: { type: Number, required: true },
    country: { type: String },
    date: { type: Date, default: Date.now },
    gameMode: { type: String, enum: GameMode, required: true },
});

const TriviaScore: Model<ITriviaScore> = models.TriviaScore || mongoose.model("TriviaScore", TriviaScoreSchema);

export default TriviaScore;




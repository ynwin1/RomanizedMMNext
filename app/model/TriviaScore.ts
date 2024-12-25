import mongoose, { Schema, Model, models } from "mongoose";

export interface ITriviaScore extends mongoose.Document {
    userName: string,
    score: number,
    country: string,
    date: Date,
}

const TriviaScoreSchema: Schema<ITriviaScore> = new Schema({
    userName: { type: String, required: true },
    score: { type: Number, required: true },
    country: { type: String },
    date: { type: Date, default: Date.now },
});

const TriviaScore: Model<ITriviaScore> = models.TriviaScore || mongoose.model("TriviaScore", TriviaScoreSchema);

export default TriviaScore;




import mongoose, { Schema, models, type Model } from "mongoose";
import type { MoodometerAnalysis } from "../domain/moodometer.types";

export interface StoredMoodometer {
  mmid: number;
  analysis: MoodometerAnalysis;
  createdAt: Date;
}
const scoreSchema = new Schema({moodId:{type:String,required:true},score:{type:Number,required:true}}, {_id:false});
const analysisSchema = new Schema({
  version:{type:Number,required:true},
  source:{type:String,required:true},
  status:{type:String,required:true,enum:["draft","published"]},
  lyricsFingerprint:{type:String,required:true},
  moods:{type:[scoreSchema],required:true},
  summary:{type:String,required:true},
  modelVersion:{type:String,required:true},
}, {_id:false});
const moodSchema = new Schema<StoredMoodometer>({
  mmid:{type:Number,required:true,index:true},
  analysis:{type:analysisSchema,required:true},
  createdAt:{type:Date,default:Date.now},
}, {timestamps:false});
moodSchema.index({mmid:1,createdAt:-1});
export const MoodometerModel: Model<StoredMoodometer> =
  (models.MoodometerAnalysis as Model<StoredMoodometer> | undefined) ??
  mongoose.model<StoredMoodometer>("MoodometerAnalysis",moodSchema);

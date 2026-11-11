import mongoose,{Schema,models,type Model} from "mongoose";
import type {AutoSyncJob} from "../application/auto-sync.job";

export interface StoredAutoSyncJob extends AutoSyncJob {
  _id:mongoose.Types.ObjectId;
}
const jobSchema=new Schema<StoredAutoSyncJob>({
  version:{type:Number,required:true,enum:[1]},
  mmid:{type:Number,required:true,index:true},
  youtubeVideoId:{type:String,required:true},
  lyricsFingerprint:{type:String,required:true},
  status:{type:String,required:true,enum:["awaiting_upload","queued","processing","completed","failed","cancelled"]},
  uploadKey:{type:String,default:null},
  errorCode:{type:String,default:null},
  createdAt:{type:Date,required:true},
  updatedAt:{type:Date,required:true},
  expiresAt:{type:Date,required:true},
},{strict:true});
jobSchema.index({mmid:1,youtubeVideoId:1,createdAt:-1});
jobSchema.index({expiresAt:1},{expireAfterSeconds:0});
export const AutoSyncJobModel:Model<StoredAutoSyncJob>=
  (models.AutoSyncJob as Model<StoredAutoSyncJob>|undefined)??
  mongoose.model<StoredAutoSyncJob>("AutoSyncJob",jobSchema);

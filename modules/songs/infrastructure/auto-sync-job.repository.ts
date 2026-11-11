import connectDB from "@/infrastructure/database/mongodb";
import {AutoSyncJobModel} from "./auto-sync-job.model";
import {AutoSyncJobSchema,createAwaitingUploadJob,transitionAutoSyncJob,
  type AutoSyncJob,type AutoSyncJobStatus} from "../application/auto-sync.job";
import {Types} from "mongoose";

const publicFields="version mmid youtubeVideoId lyricsFingerprint status uploadKey errorCode createdAt updatedAt expiresAt";
function parsed(doc:unknown):AutoSyncJob {
  return AutoSyncJobSchema.parse(doc);
}

/** Database persistence is intentionally separate from upload auth and workers. */
export class MongoAutoSyncJobRepository {
  async createPending(args:{mmid:number;youtubeVideoId:string;lyricsFingerprint:string}):Promise<{id:string;job:AutoSyncJob}> {
    const job=createAwaitingUploadJob(args);
    await connectDB();
    const created=await AutoSyncJobModel.create(job);
    return {id:String(created._id),job};
  }
  async get(mmid:number,id:string):Promise<AutoSyncJob|null> {
    if(!Types.ObjectId.isValid(id)||!/^([a-f0-9]{24})$/i.test(id))return null;
    await connectDB();
    const result=await AutoSyncJobModel.findOne({_id:id,mmid}).select(publicFields).lean();
    return result?parsed(result):null;
  }
  async recent(mmid:number,videoId:string,limit=10):Promise<Array<{id:string;job:AutoSyncJob}>> {
    if(!Number.isSafeInteger(limit)||limit<1||limit>20)throw Error("Invalid history limit");
    await connectDB();
    const docs=await AutoSyncJobModel.find({mmid,youtubeVideoId:videoId}).select(publicFields)
      .sort({createdAt:-1,_id:-1}).limit(limit).lean();
    return docs.map(doc=>({id:String(doc._id),job:parsed(doc)}));
  }
  /**
   * Optimistic update: only one caller can move a job out of a known state
   * at a time. Worker-side code must additionally validate song fingerprint.
   */
  async transition(mmid:number,id:string,to:AutoSyncJobStatus,
    options:{uploadKey?:string;errorCode?:AutoSyncJob["errorCode"]}={}):Promise<AutoSyncJob|null> {
    const old=await this.get(mmid,id);
    if(!old)return null;
    const next=transitionAutoSyncJob(old,to,new Date(),options);
    await connectDB();
    const updated=await AutoSyncJobModel.findOneAndUpdate({
      _id:id,mmid,status:old.status,updatedAt:old.updatedAt,
    },{$set:{
      status:next.status,updatedAt:next.updatedAt,uploadKey:next.uploadKey,errorCode:next.errorCode,
    }},{new:true,runValidators:true}).select(publicFields).lean();
    if(!updated)throw Error("Auto-sync job changed concurrently; reload and retry");
    return parsed(updated);
  }
}

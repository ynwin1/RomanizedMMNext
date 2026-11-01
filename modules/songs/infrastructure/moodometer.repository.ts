import connectDB from "@/infrastructure/database/mongodb";
import { MoodometerModel } from "./moodometer.model";
import type { MoodometerAnalysis } from "../domain/moodometer.types";
import type { MoodometerStorage, MoodometerRecord } from "../application/moodometer.service";
import { MoodometerAnalysisSchema } from "../application/moodometer.validation";

function convert(raw: { _id: unknown; mmid: number; analysis: MoodometerAnalysis; createdAt: Date }): MoodometerRecord {
  return {id:String(raw._id),mmid:raw.mmid,analysis:MoodometerAnalysisSchema.parse(raw.analysis),createdAt:raw.createdAt};
}
export class MongoMoodometerRepository implements MoodometerStorage {
  async insert(mmid:number,analysis:MoodometerAnalysis) {
    await connectDB();
    const record=await MoodometerModel.create({mmid,analysis});
    return convert(record.toObject());
  }
  async history(mmid:number,limit:number) {
    await connectDB();
    const records=await MoodometerModel.find({mmid}).sort({createdAt:-1,_id:-1}).limit(limit).lean();
    return records.map(convert);
  }
  async byId(mmid:number,id:string) {
    if (!/^[a-f0-9]{24}$/i.test(id)) return null;
    await connectDB();
    const record=await MoodometerModel.findOne({_id:id,mmid}).lean();
    return record?convert(record):null;
  }
  async publish(mmid:number,id:string) {
    if (!/^[a-f0-9]{24}$/i.test(id)) return null;
    await connectDB();
    // Publish one item while keeping older versions available for recovery.
    await MoodometerModel.updateMany({mmid,"analysis.status":"published"},{$set:{"analysis.status":"draft"}});
    const record=await MoodometerModel.findOneAndUpdate({_id:id,mmid},{$set:{"analysis.status":"published"}},{new:true}).lean();
    return record?convert(record):null;
  }
  async published(mmid:number) {
    await connectDB();
    const record=await MoodometerModel.findOne({mmid,"analysis.status":"published"}).sort({createdAt:-1}).lean();
    return record?convert(record):null;
  }
}

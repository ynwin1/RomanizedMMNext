import connectDB from "@/infrastructure/database/mongodb";
import { CountryStatEntity } from "../domain/country-stat.types";
import CountryStat from "./country-stat.model";

function toEntity(stat: any): CountryStatEntity {
  return {
    id: stat._id?.toString?.() ?? "",
    country: stat.country,
    code: stat.code,
    count: stat.count,
  };
}

export interface ICountryStatRepository {
  increment(country: string, code: string): Promise<CountryStatEntity | null>;
  listTop(limit: number): Promise<CountryStatEntity[]>;
}

export class MongoCountryStatRepository implements ICountryStatRepository {
  async increment(country: string, code: string): Promise<CountryStatEntity | null> {
    await connectDB();

    const stat = await CountryStat.findOneAndUpdate(
      { code },
      { $inc: { count: 1 }, $set: { country } },
      { upsert: true, new: true },
    ).lean();

    return stat ? toEntity(stat) : null;
  }

  async listTop(limit: number): Promise<CountryStatEntity[]> {
    await connectDB();

    const stats = await CountryStat.find({})
      .sort({ count: -1 })
      .limit(limit)
      .lean();

    return stats.map(toEntity);
  }
}

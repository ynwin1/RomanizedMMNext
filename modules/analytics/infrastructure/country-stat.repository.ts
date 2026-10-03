import connectDB from "@/infrastructure/database/mongodb";
import { CountryStatEntity } from "../domain/country-stat.types";
import CountryStat, { type ICountryStat } from "./country-stat.model";
import { ICountryStatRepository } from "../application/country-stat.repository";

type CountryStatPersistenceRecord = ICountryStat & { _id?: unknown };

function toEntity(stat: CountryStatPersistenceRecord): CountryStatEntity {
  return {
    id: stat._id == null ? "" : String(stat._id),
    country: stat.country,
    code: stat.code,
    count: stat.count,
  };
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

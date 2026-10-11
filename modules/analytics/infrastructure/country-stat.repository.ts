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

    let stat: CountryStatPersistenceRecord | null;
    try {
      stat = await CountryStat.findOneAndUpdate(
        { country },
        { $inc: { count: 1 }, $set: { code } },
        { upsert: true, new: true },
      ).lean();
    } catch (error) {
      // Parallel first visits can race to create the same unique country.
      // Retry as an update, without upsert, so the winning row is incremented.
      if (!isCountryDuplicateKey(error)) throw error;
      stat = await CountryStat.findOneAndUpdate(
        { country },
        { $inc: { count: 1 }, $set: { code } },
        { new: true },
      ).lean();
    }

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

function isCountryDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error
    && error.code === 11000 && "keyPattern" in error
    && typeof error.keyPattern === "object" && error.keyPattern !== null
    && "country" in error.keyPattern;
}

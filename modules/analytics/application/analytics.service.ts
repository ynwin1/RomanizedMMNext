import { CountryStatEntity } from "../domain/country-stat.types";
import { ICountryStatRepository } from "../infrastructure/country-stat.repository";

export class AnalyticsService {
  constructor(private readonly countryStats: ICountryStatRepository) {}

  async trackCountry(country: string, code: string): Promise<CountryStatEntity | null> {
    return this.countryStats.increment(country, code);
  }

  async getTopCountries(limit: number = 10): Promise<CountryStatEntity[]> {
    return this.countryStats.listTop(limit);
  }
}

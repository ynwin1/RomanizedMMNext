import { CountryStatEntity } from "../domain/country-stat.types";

export interface ICountryStatRepository {
  increment(country: string, code: string): Promise<CountryStatEntity | null>;
  listTop(limit: number): Promise<CountryStatEntity[]>;
}

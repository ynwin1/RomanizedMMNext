import { AnalyticsService } from "./application/analytics.service";
import { MongoCountryStatRepository } from "./infrastructure/country-stat.repository";

const countryStatRepository = new MongoCountryStatRepository();
export const analyticsService = new AnalyticsService(countryStatRepository);

export * from "./domain/country-stat.types";

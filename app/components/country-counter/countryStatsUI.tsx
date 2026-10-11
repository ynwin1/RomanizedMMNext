import React from "react";
import { countryFlags } from "@/app/lib/utils";
import { analyticsService } from "@/modules/analytics";
import { logger } from "@/infrastructure/logging/logger";

export const revalidate = 60;

const CountryStatsUi = async () => {
  try {
    const stats = await analyticsService.getTopCountries();

    const countryStats = stats.map((stat) => ({
      country: stat.country,
      flag: countryFlags[stat.country] || null,
      count: stat.count,
    }));

    return (
      <section aria-label="Visitor countries" className="mt-10 rounded-xl border border-theme-border bg-surface p-5 text-foreground sm:p-7">
        <h2 className="mb-5 text-xl font-bold tracking-tight sm:text-2xl">Top 10 Visitors</h2>

        <div className="w-full overflow-x-auto rounded-lg border border-theme-border">
          <table className="w-full text-sm sm:text-base">
            <thead className="bg-surface-raised text-foreground uppercase text-sm tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left border-b border-theme-border">Country</th>
                <th className="px-6 py-4 text-right border-b border-theme-border">Views</th>
              </tr>
            </thead>
            <tbody>
              {countryStats.map((stat) => (
                <tr
                  key={stat.country}
                  className="hover:bg-surface-raised transition duration-200 border-b border-theme-border"
                >
                  <td className="px-6 py-4 flex items-center gap-2">
                    <span>{stat.flag || "🌍"}</span>
                    <span>{stat.country}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{stat.count}</td>
                </tr>
              ))}
              {countryStats.length === 0 && <tr><td colSpan={2} className="px-6 py-8 text-center text-muted">Visitor statistics are not available yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    );
  } catch (error) {
    logger.error("Failed to fetch country stats", error);
    return <p role="status" className="mt-8 text-center text-sm text-muted">Visitor statistics are temporarily unavailable.</p>;
  }
};

export default CountryStatsUi;

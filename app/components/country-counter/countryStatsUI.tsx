import React from 'react'
import CountryStat from "@/app/model/CountryStat";
import {countryFlags} from "@/app/lib/utils";

export const revalidate = 60; // revalidate every 60 seconds

const CountryStatsUi = async () => {
    let countryStats = [];
    try {
        const resp = await CountryStat.find({}).sort({ count: -1 }).limit(10);
        if (!resp) {
            throw new Error("Failed to fetch country stats");
        }

        countryStats = resp.map((stat) => ({
            country: stat.country,
            flag: countryFlags[stat.country] || null,
            count: stat.count,
        }));
    } catch (e) {
        console.error("Error fetching country stats: ", e);
        return <div>Error fetching country stats</div>;
    }

    return (
        <div className="flex flex-col gap-6 mt-16 mb-16 text-white items-center z-20">
            <h2 className="text-3xl font-extrabold tracking-tight">Top 10 Visitors</h2>

            <div className="overflow-x-auto w-full flex justify-center">
                <table className="w-[80vw] md:w-[30vw] bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg rounded-xl overflow-hidden text-sm sm:text-base">
                    <thead className="bg-gray-700 text-white uppercase text-sm tracking-wider">
                    <tr>
                        <th className="px-6 py-4 text-left border-b border-gray-600">Country</th>
                        <th className="px-6 py-4 text-right border-b border-gray-600">Count</th>
                    </tr>
                    </thead>
                    <tbody>
                    {countryStats.map((stat, index) => (
                        <tr
                            key={index}
                            className="hover:bg-gray-700 transition duration-200 border-b border-gray-700"
                        >
                            <td className="px-6 py-4 flex items-center gap-2">
                                <span>{stat.flag || "🌍"}</span>
                                <span>{stat.country}</span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium">{stat.count}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>

    )
}
export default CountryStatsUi

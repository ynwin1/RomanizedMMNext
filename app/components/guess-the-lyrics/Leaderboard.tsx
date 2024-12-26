import React, {useEffect, useState} from 'react'
import {fetchAllTriviaScores} from "@/app/lib/action";

const Leaderboard = ({refresh}: {refresh: boolean}) => {
    const [allScores, setScores] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadScores = async () => {
            try {
                const data = await fetchAllTriviaScores();
                setScores(data);
            } catch (error) {
                console.error('Failed to fetch scores:', error);
            } finally {
                setLoading(false);
            }
        };

        loadScores();
    }, [refresh]);

    if (loading) {
        return null;
    }

    return (
        <div className="flex flex-col justify-center items-center px-4 mb-6 mt-8 ">
            <h1 className="text-3xl text-white text-center p-4 max-md:[text-xl]">
                <u>Leaderboard</u>
            </h1>

            <div className="w-[80vw] md:w-[60vw]">
                <table className="w-full bg-black bg-opacity-30 backdrop-blur-sm">
                    <thead>
                    <tr className="bg-blue-600">
                        <th className="py-3 px-2 md:px-6 text-left text-sm font-semibold uppercase break-all tracking-wider hidden md:table-cell">
                            Rank
                        </th>
                        <th className="py-3 px-2 md:px-6 text-left text-sm font-semibold uppercase break-all">
                            <span className="hidden sm:block">Name</span>
                            <span className="block sm:hidden">🧑</span>
                        </th>
                        <th className="py-3 px-2 md:px-6 text-left text-sm font-semibold uppercase tracking-wider break-all">
                            <span className="hidden sm:block">Country</span>
                            <span className="block sm:hidden">🌍</span>
                        </th>
                        <th className="py-3 px-2 md:px-6 text-left text-sm font-semibold uppercase tracking-wider break-all">
                            <span className="hidden sm:block">Score</span>
                            <span className="block sm:hidden">Pts</span>
                        </th>
                        <th className="py-3 px-2 md:px-6 text-left text-sm font-semibold uppercase tracking-wider hidden md:table-cell break-all">
                            Date
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {allScores.map((score, index) => (
                        <tr key={index} className="hover:bg-white hover:bg-opacity-10 transition-colors">
                            <td className="py-4 px-2 md:px-6 text-white hidden md:table-cell">
                                {index + 1}
                            </td>
                            <td className="py-4 px-2 md:px-6 text-white break-words">
                                {score.userName}
                            </td>
                            <td className="py-4 px-2 md:px-6 text-white break-words">
                                {score.country}
                            </td>
                            <td className="py-4 px-2 md:px-6 text-white">
                                {score.score}
                            </td>
                            <td className="py-4 px-2 md:px-6 text-white hidden md:table-cell">
                                {new Date(score.date).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
export default Leaderboard

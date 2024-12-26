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
        <div className="flex flex-col justify-center items-center rounded-lg mt-8">
            <h1 className="text-3xl text-white text-center p-4"><u>Leaderboard</u></h1>
            <table className="bg-black bg-opacity-30 backdrop-blur-sm">
                <thead>
                <tr className="bg-blue-600">
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider hidden md:inline-block">Rank</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Name</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Country</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider">Score</th>
                    <th className="py-3 px-6 text-left text-sm font-semibold uppercase tracking-wider hidden md:inline-block">Date</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {allScores.map((score, index) => (
                    <tr key={index} className="hover:bg-white hover:bg-opacity-10 transition-colors">
                        <td className="py-4 px-6 text-white hidden md:inline-block">{index + 1}</td>
                        <td className="py-4 px-6 text-white">{score.userName}</td>
                        <td className="py-4 px-6 text-white">{score.country}</td>
                        <td className="py-4 px-6 text-white">{score.score}</td>
                        <td className="py-4 px-6 text-white hidden md:inline-block">{new Date(score.date).toLocaleDateString()}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
export default Leaderboard

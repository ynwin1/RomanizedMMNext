import React, {useEffect, useState} from 'react'
import {fetchAllTriviaScores} from "@/app/lib/action";
import {useTranslations} from "next-intl";
import {GameMode} from "@/app/lib/constants";

const Leaderboard = ({refresh, gameMode}: {refresh: boolean, gameMode: GameMode}) => {
    const [allScores, setScores] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const translator = useTranslations("GuessTheLyrics");

    useEffect(() => {
        const loadScores = async () => {
            try {
                const data = await fetchAllTriviaScores(gameMode);
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
        <div className="flex flex-col justify-center items-center px-4 mt-8 ">
            <h1 className="text-3xl text-white text-center p-4 max-md:text-xl">
                <u>{translator("leaderboard")}</u>
            </h1>
            <div>
                <table className="w-[50vw] max-md:w-[80vw] bg-black bg-opacity-30 backdrop-blur-sm">
                    <thead>
                    <tr className="bg-blue-600">
                        <th className="py-3 px-2 md:px-6 text-left text-sm font-semibold uppercase tracking-wider hidden md:table-cell">
                            {translator("rank")}
                        </th>
                        <th className="py-3 px-2 md:px-6 text-left text-sm font-semibold uppercase">
                            {translator("name")}
                        </th>
                        <th className="py-3 px-2 md:px-6 text-left text-sm font-semibold uppercase tracking-wider">
                            <span className="hidden sm:block">{translator("country")}</span>
                            <span className="block sm:hidden">📍</span>
                        </th>
                        <th className="py-3 px-2 md:px-6 text-left text-sm font-semibold uppercase tracking-wider">
                            <span className="hidden sm:block">{translator("score")}</span>
                            <span className="block sm:hidden">{translator("score")}</span>
                        </th>
                        <th className="py-3 px-2 md:px-6 text-left text-sm font-semibold uppercase tracking-wider hidden md:table-cell">
                            {translator("date")}
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
            <p className="text-lg w-[50vw] max-md:w-[80vw] mt-4 bg-black bg-opacity-70 rounded-2xl p-4">
                Emojis do not appear on Windows. Installing this Chrome extension &nbsp;
                <a href="https://chromewebstore.google.com/detail/country-flag-fixer/jhcpefjbhmbkgjgipkhndplfbhdecijh"
                   target="_blank"
                   className="text-amber-400"
                >
                    <u>Flag Fixer</u>
                </a>
                &nbsp; fixes the issue.
            </p>
        </div>
    );
}
export default Leaderboard

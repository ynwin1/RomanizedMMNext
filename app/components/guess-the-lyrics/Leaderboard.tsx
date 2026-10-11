import React, {useEffect, useState} from 'react'
import {fetchAllTriviaScores} from "@/app/actions/trivia.action";
import {useTranslations} from "next-intl";
import {GameMode} from "@/modules/trivia/domain/game-mode";
import { logger } from "@/infrastructure/logging/logger";
import type { TriviaLeaderboardRecord } from "@/modules/trivia";

const Leaderboard = ({refresh, gameMode}: {refresh: boolean, gameMode: GameMode}) => {
    const [allScores, setScores] = useState<TriviaLeaderboardRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const translator = useTranslations("GuessTheLyrics");

    useEffect(() => {
        const loadScores = async () => {
            try {
                const data = await fetchAllTriviaScores(gameMode);
                setScores(data);
            } catch (error) {
                logger.error("Failed to fetch leaderboard scores", error);
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
        <section aria-label={translator("leaderboard")} className="mt-6 w-full rounded-2xl border border-theme-border bg-surface p-4 sm:p-6">
            <h2 className="mb-5 text-xl font-bold text-foreground sm:text-2xl">{translator("leaderboard")}</h2>
            <div className="w-full overflow-x-auto rounded-lg border border-theme-border">
                <table className="w-full min-w-[310px] border-collapse bg-surface text-sm">
                    <thead>
                    <tr className="bg-surface-raised text-foreground">
                        <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">
                            {translator("rank")}
                        </th>
                        <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold uppercase">
                            {translator("name")}
                        </th>
                        <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold uppercase tracking-wider">
                            <span className="hidden sm:block">{translator("country")}</span>
                            <span className="block sm:hidden">📍</span>
                        </th>
                        <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold uppercase tracking-wider">
                            <span className="hidden sm:block">{translator("score")}</span>
                            <span className="block sm:hidden">{translator("score")}</span>
                        </th>
                        <th className="py-3 px-3 sm:px-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell">
                            {translator("date")}
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                    {allScores.map((score, index) => (
                        <tr key={index} className="hover:bg-surface-raised transition-colors">
                            <td className="px-3 py-3 text-muted hidden sm:table-cell sm:px-4">
                                {index + 1}
                            </td>
                            <td className="break-words px-3 py-3 font-medium text-foreground sm:px-4">
                                {score.userName}
                            </td>
                            <td className="break-words px-3 py-3 text-foreground sm:px-4">
                                {score.country}
                            </td>
                            <td className="px-3 py-3 font-semibold tabular-nums text-accent sm:px-4">
                                {score.score}
                            </td>
                            <td className="px-3 py-3 text-muted hidden md:table-cell sm:px-4">
                                {new Date(score.date).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                    {allScores.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No scores yet. Be the first on the leaderboard!</td></tr>}
                    </tbody>
                </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
                Emojis do not appear on Windows. Installing this Chrome extension &nbsp;
                <a href="https://chromewebstore.google.com/detail/country-flag-fixer/jhcpefjbhmbkgjgipkhndplfbhdecijh"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="text-accent"
                >
                    <u>Flag Fixer</u>
                </a>
                &nbsp; fixes the issue.
            </p>
        </section>
    );
}
export default Leaderboard

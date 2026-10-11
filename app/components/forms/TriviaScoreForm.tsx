"use client";

import React, {useActionState, useEffect} from "react";
import {createTriviaScore, TriviaScoreState} from "@/app/actions/trivia.action";
import {countryFlags} from "@/app/lib/utils";
import {Button} from "@/app/components/buttons/FormSubmitButton";
import { GameMode } from "@/modules/trivia/domain/game-mode";

interface TriviaScoreFormProps {
    score: number;
    gameMode: GameMode;
    setShowSaveCard: React.Dispatch<React.SetStateAction<boolean>>
}

export const TriviaScoreForm = ({score, gameMode, setShowSaveCard}: TriviaScoreFormProps) => {
    const initialState: TriviaScoreState = {message: "", errors: {}};
    const [state, formAction] = useActionState(createTriviaScore, initialState);

    useEffect(() => {
        if (!state.errors) {
            setShowSaveCard(false);
        }
    }, [state.message]);

    return (
        <form action={formAction} className="w-full max-w-lg text-left">
            <div className="rounded-xl border border-theme-border bg-surface-raised p-4 sm:p-6">
                <div className="mb-5 text-foreground">
                    <h2 className="text-xl font-bold">{`You scored ${score} points!`}</h2>
                    <p className="mt-1 text-sm text-muted">Save your score to the leaderboard.</p>
                </div>
                {/* Name */}
                <div className="mb-4">
                    <label htmlFor="userName" className="mb-2 block text-sm font-medium">
                        Name
                    </label>
                    <input
                        id="userName"
                        name="userName"
                        type="text"
                        placeholder="Enter your name"
                        className="block min-h-11 w-full rounded-lg border border-theme-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-accent"
                        aria-describedby="name-error"
                    />
                    <div id="name-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.userName &&
                            state.errors.userName.map((error) => (
                                <p className="mt-2 text-sm text-red-500" key={error}>
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>
                {/* Country */}
                <div className="mb-4">
                    <label htmlFor="country" className="mb-2 block text-sm font-medium">
                        Where are you from?
                    </label>
                    <select
                        id="country"
                        name="country"
                        className="block min-h-11 w-full rounded-lg border border-theme-border bg-surface px-3 text-sm text-foreground focus-visible:outline-accent"
                        defaultValue={Object.keys(countryFlags)[0]}
                        aria-describedby="country-error"
                        required
                    >
                        {Object.keys(countryFlags).map((country, index) => (
                            <option key={index} value={country}>
                                {`${country} ${countryFlags[country]}`}
                            </option>
                        ))}
                    </select>
                    <div id="country-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.country &&
                            state.errors.country.map((error) => (
                                <p className="mt-2 text-sm text-red-500" key={error}>
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>
                {/* Score */}
                <div className="mb-4">
                    <label htmlFor="score" className="mb-2 block text-sm font-medium">
                        Score
                    </label>
                    <input
                        id="score"
                        name="score"
                        type="number"
                        className="block min-h-11 w-full rounded-lg border border-theme-border bg-surface px-3 text-sm text-foreground focus-visible:outline-accent"
                        defaultValue={score}
                        aria-describedby="score-error"
                        readOnly
                    />
                    <div id="score-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.score &&
                            state.errors.score.map((error) => (
                                <p className="mt-2 text-sm text-red-500" key={error}>
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>
                {/* Game Mode */}
                <input type="hidden" name="gameMode" value={gameMode} />
                <div className="flex justify-end">
                    <div className="mt-6 flex justify-end gap-4">
                        <Button type="submit">Save</Button>
                    </div>
                </div>
            </div>
        </form>
    )
}

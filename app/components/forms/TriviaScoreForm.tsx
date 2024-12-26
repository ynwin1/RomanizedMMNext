"use client";

import React, {useActionState, useEffect} from "react";
import {createTriviaScore, ReportState, TriviaScoreState} from "@/app/lib/action";
import {countryFlags} from "@/app/lib/utils";
import {Button} from "@/app/components/buttons/FormSubmitButton";
import {useFormState} from "react-dom";

interface TriviaScoreFormProps {
    score: number;
    setShowSaveCard: React.Dispatch<React.SetStateAction<boolean>>
}

export const TriviaScoreForm = ({score, setShowSaveCard}: TriviaScoreFormProps) => {
    const initialState: TriviaScoreState = {message: "", errors: {}};
    const [state, formAction] = useFormState(createTriviaScore, initialState);

    useEffect(() => {
        if (!state.errors) {
            setShowSaveCard(false);
        }
    }, [state.message]);

    return (
        <form action={formAction}>
            <div className="rounded-xl bg-black bg-opacity-70 p-4 w-[40vw] max-md:w-[80vw]">
                <h1 className="text-lg font-semibold mb-4">
                    <p>{`You scored ${score} points.`}</p>
                    <p>Save your score!</p>
                </h1>
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
                        className="block w-full text-black rounded-md border border-gray-200 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500"
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
                        name="country"
                        className="block text-black w-full rounded-md border border-gray-200 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500"
                        defaultValue={countryFlags[0]}
                        aria-describedby="country-error"
                        required
                    >
                        {countryFlags.map((flag, index) => (
                            <option key={index} value={flag}>
                                {flag}
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
                        className="block text-black w-full rounded-md border border-gray-200 py-2 pl-3 text-sm outline-2 placeholder:text-gray-500"
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
                <div className="flex justify-end">
                    <div className="mt-6 flex justify-end gap-4">
                        <Button type="submit">Save</Button>
                    </div>
                </div>
            </div>
        </form>
    )
}
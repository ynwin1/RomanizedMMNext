"use client";
import React, {useActionState, useEffect} from 'react'
import {MusicalNoteIcon, UserIcon, PencilIcon} from "@heroicons/react/16/solid";
import {createSongReport, ReportState} from "@/app/lib/action";
import {Button} from "@/app/components/buttons/FormSubmitButton";
import {useTranslations} from "next-intl";

const SongReportForm = ({songName, artist, renderReport, renderMessage, setResponse}:
                            {   songName: string,
                                artist: string,
                                renderReport: React.Dispatch<React.SetStateAction<boolean>>,
                                renderMessage: React.Dispatch<React.SetStateAction<boolean>>,
                                setResponse: React.Dispatch<React.SetStateAction<string>>
                            }) => {
    const initialState: ReportState = {message: "", errors: {}};
    const [state, formAction] = useActionState(createSongReport, initialState);
    const translator = useTranslations("MusicPage");

    useEffect(() => {
        if (state.message && !state.errors?.details) {
            setResponse(state.message);
            renderMessage(true);
            renderReport(false);
        }
    }, [state.message]);

    const handleSubmit = async (formData: FormData) => {
        try {
            await formAction(formData);
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <form action={handleSubmit}>
            {/* Song Name */}
            <div className="mb-4">
                <div className="relative mt-2 rounded-md">
                    <div className="relative">
                        <input
                            id="songName"
                            name="songName"
                            type="string"
                            value={songName}
                            className="peer text-black block w-[45vw] max-md:w-[80vw] rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                            readOnly
                        />
                        <MusicalNoteIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                    </div>
                </div>
            </div>

            {/* Artist Name */}
            <div className="mb-4">
                <div className="relative mt-2 rounded-md">
                    <div className="relative">
                        <input
                            id="artist"
                            name="artist"
                            type="string"
                            value={artist}
                            className="peer text-black block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                            readOnly
                        />
                        <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                    </div>
                </div>
            </div>

            {/* Report/Suggestion */}
            <div className="mb-4">
                <div className="relative mt-2 rounded-md">
                    <div className="relative">
                        <textarea
                            id="details"
                            name="details"
                            placeholder={translator("report")}
                            className="peer text-black block w-full rounded-md border border-gray-200 py-2 pl-10 pr-3 text-sm outline-2 placeholder:text-gray-500 resize-y"
                            aria-describedby="details-error"
                            rows={2}
                        />
                        <PencilIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                    </div>
                    <div id="details-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.details &&
                            state.errors.details.map((error) => (
                                <p className="mt-2 text-sm text-red-500" key={error}>
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <Button type="submit">{translator("submit")}</Button>
          </div>
        </form>
    )
}
export default SongReportForm;

"use client";
import React, {useActionState} from 'react';
import {createSongRequest, State} from "@/app/lib/action";
import {MusicalNoteIcon, UserIcon, PlayIcon, PencilIcon} from "@heroicons/react/16/solid";
import { Button } from '@/app/components/buttons/FormSubmitButton';

const SongRequestForm = () => {
    const initialState: State = {message: null, errors: {}};
    const [state, formAction] = useActionState(createSongRequest, initialState);

    return (
        <form action={formAction}>
            {/* Song Name */}
            <div className="mb-4">
                <label htmlFor="songName" className="mb-2 block text-sm font-medium">
                    Song Title
                </label>
                <div className="relative mt-2 rounded-md">
                    <div className="relative">
                        <input
                            id="songName"
                            name="songName"
                            type="string"
                            placeholder="Song Title"
                            className="peer text-black block w-[45vw] max-md:w-[80vw] rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                            aria-describedby="songName-error"
                        />
                        <MusicalNoteIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                    </div>
                    <div id="songName-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.songName &&
                        state.errors.songName.map((error) => (
                            <p className="mt-2 text-sm text-red-500" key={error}>
                                {error}
                            </p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Artist Name */}
            <div className="mb-4">
                <label htmlFor="artist" className="mb-2 block text-sm font-medium">
                    Artist
                </label>
                <div className="relative mt-2 rounded-md">
                    <div className="relative">
                        <input
                            id="artist"
                            name="artist"
                            type="string"
                            placeholder="Artist"
                            className="peer text-black block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                            aria-describedby="artist-error"
                        />
                        <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                    </div>
                    <div id="artist-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.artist &&
                            state.errors.artist.map((error) => (
                                <p className="mt-2 text-sm text-red-500" key={error}>
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>
            </div>

            {/* Song YouTube URL */}
            <div className="mb-4">
                <label htmlFor="youtubeLink" className="mb-2 block text-sm font-medium">
                    YouTube (Optional)
                </label>
                <div className="relative mt-2 rounded-md">
                    <div className="relative">
                        <input
                            id="youtubeLink"
                            name="youtubeLink"
                            type="string"
                            placeholder="YouTube Link"
                            className="peer text-black block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                            aria-describedby="youtubeLink-error"
                        />
                        <PlayIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                    </div>
                    <div id="youtubeLink-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.youtubeLink &&
                            state.errors.youtubeLink.map((error) => (
                                <p className="mt-2 text-sm text-red-500" key={error}>
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="mb-4">
                <label htmlFor="details" className="mb-2 block text-sm font-medium">
                    Details (Optional)
                </label>
                <div className="relative mt-2 rounded-md">
                    <div className="relative">
                        <input
                            id="details"
                            name="details"
                            type="string"
                            placeholder="Details"
                            className="peer text-black block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 text-black"
                            aria-describedby="details-error"
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
                <Button type="submit">Submit</Button>
            </div>
        </form>
    )
}
export default SongRequestForm;

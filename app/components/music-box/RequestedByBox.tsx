import React from 'react'

interface RequestedByBoxProps {
    locale?: string;
    requestedBy?: string;
    songStoryEn?: string;
    songStoryMy?: string;
}

function formatRequesterNameText(locale: string, name: string): string {
    if (locale === 'my') {
        return `${name} မှ တောင်းဆိုထားသည်`;
    } else {
        return `Requested by ${name}`;
    }
}

/*
    * A box component to display who requested the song along with their story.
    * Return null if both requestedBy and songStory are not provided.
    * Story present + no name = Use "Anonymous"
    * No story + name present = Just show the name
 */
export const RequestedByBox = ({locale = "en", requestedBy = "Anonymous", songStoryEn, songStoryMy}: RequestedByBoxProps) => {
    const songStory = locale === "my" ? songStoryMy : songStoryEn;

    if (!songStory && (!requestedBy || requestedBy === "Anonymous")) {
        return null;
    }

    if (!songStory) {
        return (
            <div className="text-right text-gray-600 font-medium max-w-lg mx-auto">
                {formatRequesterNameText(locale, requestedBy)}
            </div>
        )
    }

    return (
        <div className="bg-amber-50 p-4 rounded-xl shadow-md max-w-lg mx-auto max-md:w-[80%] w-[60%]">
            <p className="italic text-gray-700 mb-4">"{songStory}"</p>
            <p className="text-right text-gray-600 font-sm">{formatRequesterNameText(locale, requestedBy)}</p>
        </div>
    )
}

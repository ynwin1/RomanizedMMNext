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
            <div className="text-right text-muted font-medium max-w-lg mx-auto">
                {formatRequesterNameText(locale, requestedBy)}
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-lg rounded-xl border border-theme-border bg-surface p-4 sm:p-5">
            <p className="italic text-foreground mb-4">"{songStory}"</p>
            <p className="text-right text-muted font-sm">{formatRequesterNameText(locale, requestedBy)}</p>
        </div>
    )
}

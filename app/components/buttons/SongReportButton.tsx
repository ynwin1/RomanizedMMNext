"use client";
import React, {useState} from 'react'
import SongReportForm from "@/app/components/forms/SongReportForm";

interface SongReportProps {
    songName: string;
    artist: string;
}

const SongReportButton = ({songName, artist} : SongReportProps) => {
    const [showReport, setReport] = useState(false);
    const [showMessage, renderMessage] = useState(false);
    const [response, setResponse] = useState("");

    return (
        <div className="flex flex-col gap-8 justify-center items-center">
            <button type="button"
                    className="bg-red-600 text-white rounded-2xl px-4 py-2 text-lg font-bold hover:bg-red-800"
                    onClick={() => setReport(!showReport)}
            >
                Report/Suggestion
            </button>
            {showReport && (
                <SongReportForm
                    songName={songName}
                    artist={artist}
                    renderReport={setReport}
                    renderMessage={renderMessage}
                    setResponse={setResponse}
                />
            )}
            {showMessage && (
                <div className="flex flex-col justify-center items-center gap-6">
                    <p className="text-center text-lg">{response}</p>
                    <button
                        className="bg-blue-500 text-white rounded-xl px-4 py-1 w-[8rem] text-lg font-bold hover:bg-blue-400"
                        onClick={() => {
                            renderMessage(false);
                            setResponse("");
                        }}
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    )
}
export default SongReportButton;

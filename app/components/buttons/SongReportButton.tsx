"use client";
import React, {useState} from 'react'
import SongReportForm from "@/app/components/forms/SongReportForm";
import {useTranslations} from "next-intl";

interface SongReportProps {
    songName: string;
    artist: string;
}

const SongReportButton = ({songName, artist} : SongReportProps) => {
    const [showReport, setReport] = useState(false);
    const [showMessage, renderMessage] = useState(false);
    const [response, setResponse] = useState("");

    const translator = useTranslations("MusicPage");

    return (
        <div className="relative">
            <button type="button"
                    className="bg-red-600 text-white rounded-2xl px-4 py-2 text-lg font-bold hover:bg-red-800"
                    onClick={() => setReport(!showReport)}
            >
                {translator("report")}
            </button>
            
            {showReport && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setReport(false)} />
                    {/* Form */}
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
                        <SongReportForm
                            songName={songName}
                            artist={artist}
                            renderReport={setReport}
                            renderMessage={renderMessage}
                            setResponse={setResponse}
                        />
                    </div>
                </>
            )}
            
            {showMessage && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => renderMessage(false)} />
                    {/* Message */}
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
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
                    </div>
                </>
            )}
        </div>
    )
}
export default SongReportButton;
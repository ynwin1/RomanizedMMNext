"use client";

import React, {useState}  from 'react';
import jsPDF from 'jspdf';
import {LyricsPDFProps} from '../../lib/types';
import notoSansMyanmarBase64 from "./NotoSansMyanmarBase64";

const downloadLyricsPDF = (selectedOptions: string[], songData: LyricsPDFProps) => {
    const doc = new jsPDF();

    doc.addFileToVFS("NotoSansMyanmar-Regular.ttf", notoSansMyanmarBase64);
    doc.addFont("NotoSansMyanmar-Regular.ttf", "NotoSansMyanmar", "normal");
    
    selectedOptions.forEach((version, index) => {
        if (index !== 0) {
            doc.addPage();
        }

        const title = songData.name;
        const artists = songData.artists;
        const lyricsVersion = version;

        let lyricsContent = "";

        if (version === "Burmese") {
            doc.setFont("NotoSansMyanmar");
            lyricsContent = songData.burmese;
        } else if (version === "Romanized") {
            doc.setFont("Helvetica");
            lyricsContent = songData.romanized;
        } else if (version === "Meaning") {
            doc.setFont("Helvetica");
            lyricsContent = songData.meaning;
        }

        // ADD TITLE
        doc.setFontSize(18);
        doc.text(title, 10, 20);

        // VERSION
        doc.setFontSize(14);
        doc.text(`Version: ${lyricsVersion}`, 10, 30);

        // ARTISTS
        doc.setFontSize(12);
        doc.text(`Artists: ${artists}`, 10, 40);

        // LYRICS
        doc.setFontSize(12);
        doc.text(lyricsContent, 10, 50);

        // FOOTER
        doc.setFontSize(10);
        doc.text("Lyrics by RomanizedMM.com", 10, 280);
    });

    doc.save(`${songData.name}-RomanizedMM.pdf`);
}

export default function LyricsPDFModal({pdfProps}: {pdfProps: LyricsPDFProps}) {
    const {name, artists, romanized, burmese, meaning} = pdfProps;
    const [isOpen, setIsOpen] = useState(false);
    const [selections, setSelections] = useState({
        burmese: false,
        romanized: false,
        meaning: false,
    });

    const handleDownload = () => {
        const selectedOptions = [];
        if (selections.burmese) selectedOptions.push("Burmese");
        if (selections.romanized) selectedOptions.push("Romanized");
        if (selections.meaning) selectedOptions.push("Meaning");
    
        downloadLyricsPDF(selectedOptions, {name, artists, romanized, burmese, meaning});
    };

    return (
        <div className="flex items-center justify-center">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 hover:cursor-pointer transition-all duration-300" onClick={() => setIsOpen(true)}>
            Save Lyrics in PDF
          </button>
    
          {isOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-opacity-50">
              <div className="bg-black p-6 rounded shadow text-white border-2 border-white">
                <h2 className="text-lg font-bold mb-4">Select versions to download</h2>
    
                <div className="space-y-2">
                  <label><input type="checkbox" name="burmese" checked={selections.burmese} onChange={(e) => setSelections({ ...selections, burmese: e.target.checked })}/> Burmese</label><br/>
                  <label><input type="checkbox" name="romanized" checked={selections.romanized} onChange={(e) => setSelections({ ...selections, romanized: e.target.checked })}/> Romanized</label><br/>
                  <label><input type="checkbox" name="meaning" checked={selections.meaning} onChange={(e) => setSelections({ ...selections, meaning: e.target.checked })}/> Meaning</label>
                </div>
    
                <div className="mt-6 flex justify-end space-x-2">
                  <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-black bg-gray-300 rounded hover:bg-gray-400 hover:cursor-pointer transition-all duration-300">Cancel</button>
                  <button onClick={handleDownload} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 hover:cursor-pointer transition-all duration-300">Confirm</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
}

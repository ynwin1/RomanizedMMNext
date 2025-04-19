import React from 'react';
import Link from 'next/link';

interface SongCardProps {
  locale: string;
  song: {
    songName: string;
    artistName: {name: string, slug?: string}[];
    mmid: string;
    imageLink: string;
  };
}

const SongCard: React.FC<SongCardProps> = ({ locale, song }) => {
  // Song name localization logic
  const engName = song.songName.split('(')[0];
  const burmeseName = song.songName.split('(')[1]?.replace(/[()]/g, '').trim();
  const nameToDisplay = locale === 'en' ? engName : burmeseName || engName;

  // Artist display logic (show up to 3)
  const artistNames = song.artistName.map(artist => artist.name);
  const displayedArtists = artistNames.join(', ').slice(0, 25);
  const moreArtists = song.artistName.length > 3;

  const songURL = `/${locale}/song/${engName.replace(/\s/g, '')}/${song.mmid}`;

  return (
    <div className="bg-black border-2 border-white rounded-2xl shadow-lg overflow-hidden flex flex-col items-center p-4 transition-transform hover:scale-105 hover:shadow-2xl w-64 max-md:w-[80vw]">
      <img
        src={song.imageLink}
        alt={nameToDisplay}
        className="w-full h-40 object-cover rounded-xl mb-4 border border-gray-200"
      />
      <div className="font-bold text-lg text-center mb-2 line-clamp-2">{nameToDisplay}</div>
      <div className="text-white text-sm text-center mb-4">
        {displayedArtists}
        {moreArtists && '…'}
      </div>
      <Link href={songURL} className="w-full">
        <button className="w-full bg-blue-600 text-white rounded-xl px-4 py-2 font-semibold hover:bg-blue-400 transition-colors">
          View
        </button>
      </Link>
    </div>
  );
};

export default SongCard;

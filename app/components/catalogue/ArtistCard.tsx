import React from "react";
import Link from "next/link";
import { IArtist } from "@/app/model/Artist";

interface ArtistCardProps {
  locale: string;
  artist: IArtist;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ locale, artist }) => {
  const artistURL = `/${locale}/artist/${artist.slug}`;
  return (
    <Link href={artistURL}>
      <div className="bg-black border-2 border-white rounded-xl shadow-lg p-4 w-64 flex flex-col items-center hover:scale-105 transition-all duration-300">
          <img
              src={artist.imageLink}
              alt={artist.name}
              className="w-32 h-32 object-cover rounded-full mb-4 border-2"
          />
          <h2 className="font-bold text-xl text-center mb-2">{artist.name}</h2>
        <div className="text-sm text-white text-center mb-2">
            {artist.musicGenre && artist.musicGenre.length > 0 ? artist.musicGenre.slice(0,2).join(", ") : null}
        </div>
        <div className="text-xs text-gray-400 text-center">
            {artist.type}
        </div>
      </div>
    </Link>
  );
};

export default ArtistCard;

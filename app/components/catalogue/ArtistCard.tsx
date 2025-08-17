import React from "react";
import Link from "next/link";
import { IArtist } from "@/app/model/Artist";

interface ArtistCardProps {
  locale: string;
  artist: IArtist;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ locale, artist }) => {
  const artistURL: string | null = artist.slug ? `/${locale}/artist/${artist.slug}` : null;
  
  const cardContent = (
    <div className="w-[800px] max-md:w-[300px] mx-auto bg-black border border-white rounded-lg p-4 flex items-center hover:bg-gray-800 transition-colors duration-200">
      {/* Image */}
      <div className="flex-shrink-0 w-16 h-16 mr-4">
        <img
          src={artist.imageLink}
          alt={artist.name}
          className="w-full h-full object-cover rounded-full border-2 border-white"
        />
      </div>
      
      {/* Desktop Layout - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between flex-1">
        {/* Name - Fixed width */}
        <div className="w-48">
          <h2 className="font-bold text-white truncate">
            {artist.name}
          </h2>
        </div>
        
        {/* Genre - Centered flex */}
        <div className="flex-1 flex justify-center px-6">
          {artist.musicGenre && artist.musicGenre.length > 0 ? (
            <p className="text-sm text-gray-300 truncate">
              {artist.musicGenre.slice(0, 2).join(", ")}
            </p>
          ) : (
            <p className="text-sm text-gray-500">No genre</p>
          )}
        </div>
        
        {/* Type - Fixed width, right aligned */}
        <div className="w-48 flex justify-end">
          <span className="px-3 py-1 text-xs font-medium bg-gray-700 text-gray-200 rounded-full">
            {artist.type}
          </span>
        </div>
      </div>

      {/* Mobile Layout - Only name, hidden on desktop */}
      <div className="md:hidden flex-1">
        <h2 className="font-bold text-white truncate">
          {artist.name}
        </h2>
      </div>
    </div>
  );

  return artistURL ? (
    <Link href={artistURL} className="block">
      {cardContent}
    </Link>
  ) : (
    <div className="block opacity-80 cursor-not-allowed">
      {cardContent}
    </div>
  );
};

export default ArtistCard;

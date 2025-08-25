"use client";
import React from "react";
import { IArtist } from "@/app/model/Artist";
import { useRouter } from "next/navigation";

interface ArtistCardProps {
  locale: string;
  artist: IArtist;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ locale, artist }) => {
  const router = useRouter();
  const artistURL: string | null = artist.slug ? `/${locale}/artist/${artist.slug}` : null;

  const cardContent = (
    <div className="group w-[70vw] max-md:w-[90vw] mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-800 border border-gray-700/50 rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/50 backdrop-blur-sm">
      <div className="flex items-center relative">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 transition-opacity duration-500"></div>

        {/* Image with enhanced styling */}
        <div className="relative flex-shrink-0 w-20 h-20 mr-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-sm opacity-0 transition-all duration-300"></div>
          <img
            src={artist.imageLink}
            alt={artist.name}
            className="relative w-full h-full object-cover rounded-full border-3 border-white/20 transition-all duration-300 shadow-lg"
          />
          <div className="absolute inset-0 rounded-full ring-2 ring-transparent transition-all duration-300"></div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center flex-1 justify-between relative z-10">
          {/* GROUP 1: Content (Name, Genre, Type) */}
          <div className="flex items-center flex-1 max-w-2xl">
            {/* Name */}
            <div className="flex-1 min-w-0 pr-8">
              <h2 className={`text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent transition-all duration-300 truncate ${artistURL ? "cursor-pointer" : ""}`}>
                {artist.name}
              </h2>
              {/* Subtle animation line */}
              <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left mt-1 rounded-full"></div>
            </div>

            {/* Genre */}
            <div className="flex-1 min-w-0 text-center px-8">
              {artist.musicGenre && artist.musicGenre.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {artist.musicGenre.slice(0, 2).map((genre, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-gray-200 rounded-full border border-gray-600/50 backdrop-blur-sm hover:from-blue-600/80 hover:to-purple-600/80 transition-all duration-200"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No genre</p>
              )}
            </div>

            {/* Artist Type */}
            <div className="flex-1 min-w-0 text-center pl-8">
              <span className="relative inline-block px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full shadow-lg transition-all duration-300 whitespace-nowrap">
                <span className="relative z-10">{artist.type}</span>
                <div className="absolute inset-0 rounded-full blur opacity-0 transition-opacity duration-300"></div>
              </span>
            </div>
          </div>

          {/* GROUP 2: Actions (Buttons) */}
          <div className="flex-shrink-0 ml-12">
            <div className="flex gap-3">
              <>
                {
                  artistURL && (
                    <button 
                      onClick={() => router.push(artistURL)}
                      className="group/btn relative px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/30 transform hover:scale-105">
                      <span className="relative z-10 text-sm">Bio</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full blur opacity-0 group-hover/btn:opacity-40 transition-opacity duration-200"></div>
                    </button>
                  )
                }

                <button className="group/btn relative px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/30 transform hover:scale-105">
                  <span className="relative z-10 text-sm">Songs</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full blur opacity-0 group-hover/btn:opacity-40 transition-opacity duration-200"></div>
                </button>
              </>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex-1 relative z-10">
          <div className="space-y-2">
            {/* Artist Name */}
            <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300 truncate">
              {artist.name}
            </h2>

            {/* Genre and Type Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Genre */}
              {artist.musicGenre && artist.musicGenre.length > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-gray-200 rounded-full border border-gray-600/50">
                  {artist.musicGenre[0]}
                </span>
              )}

              {/* Artist Type */}
              <span className="px-3 py-1 text-xs font-medium text-white rounded-full shadow-sm">
                {artist.type}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Buttons */}
        <div className="md:hidden flex-shrink-0 ml-4 relative z-10">
          <div className="flex flex-col gap-2">
            {
              artistURL && (
                <button 
                  onClick={() => router.push(artistURL)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded-full transition-all duration-200 shadow-lg">
                  Bio
                </button>
              )
            }

            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-medium rounded-full transition-all duration-200 shadow-lg">
              Songs
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>{cardContent}</div>
  );
};

export default ArtistCard;
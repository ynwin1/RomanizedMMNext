"use client";
import React, { useState } from "react";
import { IArtist } from "@/app/model/Artist";
import { ISong } from "@/app/model/Song";
import { useRouter } from "next/navigation";
import { extractSongName, formatSongNameForURL } from "@/app/lib/utils";
import { ChevronDownIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ArtistCardProps {
  locale: string;
  artist: IArtist;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ locale, artist }) => {
  const router = useRouter();
  const [songsExpanded, setSongsExpanded] = useState(false);
  const [songs, setSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const artistURL: string = `/${locale}/artist/${artist.slug}`;
  console.log(`Artist has biography: ${artist.biography}`);

  const fetchSongs = async () => {
    if (!artist.songs?.length) {
      setError("No songs available for this artist");
      console.log("No songs available for this artist");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all songs concurrently
      const songPromises = artist.songs.map(async (songId: number) => {
        const response = await fetch(`/api/song/search/${songId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch song ${songId}`);
        }
        const result = await response.json();
        return result.data;
      });

      const songResults = await Promise.all(songPromises);
      setSongs(songResults);
      
      if (songResults.length === 0) {
        setError("No songs found for this artist");
      }
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError("Failed to load songs");
    } finally {
      setLoading(false);
    }
  };

  const toggleSongs = async () => {
    if (!songsExpanded && songs.length === 0 && !loading) {
      await fetchSongs();
    }
    setSongsExpanded(!songsExpanded);
  };

  const handleSongClick = (song: ISong) => {
    // Build song URL using the song ID
    const {engName} = extractSongName(song.songName);
    const songNameFormatted = formatSongNameForURL(engName);
    router.push(`/${locale}/song/${songNameFormatted}/${song.mmid}`);
  };

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
              <h2 className={`text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent transition-all duration-300`}>
                {artist.name}
              </h2>
              {/* Animation line */}
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
              <span className="relative inline-block px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full shadow-lg group-hover:shadow-blue-500/30 group-hover:from-indigo-500 group-hover:to-blue-500 transition-all duration-300 whitespace-nowrap">
                <span className="relative z-10">{artist.type}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </span>
            </div>
          </div>

          {/* GROUP 2: Actions (Buttons) */}
          <div className="flex-shrink-0 ml-12">
            <div className="flex gap-3">
              {artist.biography && (
                <button 
                  onClick={() => router.push(artistURL)}
                  className="group/btn relative px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/30 transform hover:scale-105"
                >
                  <span className="relative z-10 text-sm">Bio</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl blur opacity-0 group-hover/btn:opacity-40 transition-opacity duration-200"></div>
                </button>
              )}

              <button 
                onClick={toggleSongs}
                className={`group/btn relative px-5 py-2.5 bg-gradient-to-r font-medium rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 ${
                  songsExpanded 
                    ? 'from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 hover:shadow-pink-500/30' 
                    : 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 hover:shadow-purple-500/30'
                } text-white`}
              >
                <span className="relative z-10 text-sm flex items-center gap-2">
                  Songs
                  <span className={`transform transition-transform duration-200 ${songsExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon className="w-5 h-5" />
                  </span>
                </span>
                <div className={`absolute inset-0 rounded-xl blur opacity-0 group-hover/btn:opacity-40 transition-opacity duration-200 ${
                  songsExpanded 
                    ? 'bg-gradient-to-r from-pink-400 to-pink-500' 
                    : 'bg-gradient-to-r from-purple-400 to-purple-500'
                }`}></div>
              </button>
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
              <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full shadow-sm">
                {artist.type}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Buttons */}
        <div className="md:hidden flex-shrink-0 ml-4 relative z-10">
          <div className="flex flex-col gap-2">
            {artist.biography && (
              <button 
                onClick={() => router.push(artistURL)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-medium rounded-full transition-all duration-200 shadow-lg"
              >
                Bio
              </button>
            )}

            <button 
              onClick={toggleSongs}
              className={`px-4 py-2 bg-gradient-to-r text-white text-sm font-medium rounded-full transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                songsExpanded 
                  ? 'from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600' 
                  : 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600'
              }`}
            >
              Songs
              <span className={`transform transition-transform duration-200 ${songsExpanded ? 'rotate-180' : ''}`}>
                <ChevronDownIcon className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="relative">
      {cardContent}
      
      {/* Songs Dropdown */}
      {songsExpanded && (
        <div className="w-[70vw] max-md:w-[90vw] mx-auto mt-4 bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-600/50 rounded-xl p-4 shadow-xl backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
              Songs by {artist.name}
            </h3>
            <button
              onClick={() => setSongsExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700/50"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                Loading songs...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-400 text-sm flex items-center gap-2">
                <span className="w-4 h-4 text-red-500">⚠</span>
                {error}
              </div>
            </div>
          )}

          {/* Songs List */}
          {!loading && !error && songs.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {songs.map((song: ISong) => (
                <button
                  key={song.mmid}
                  onClick={() => handleSongClick(song)}
                  className="w-full text-left p-3 rounded-lg transition-all duration-200 border border-transparent hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 hover:border-blue-500/50 cursor-pointer group/song"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate text-gray-200 group-hover/song:text-white">
                      {locale === "my" ? extractSongName(song.songName).mmName || extractSongName(song.songName).engName : extractSongName(song.songName).engName}
                    </span>
                    <span className="text-blue-400 opacity-0 group-hover/song:opacity-100 transition-opacity ml-2 flex-shrink-0">
                      <ChevronRightIcon className="w-5 h-5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && songs.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 text-sm">
                No songs available
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtistCard;
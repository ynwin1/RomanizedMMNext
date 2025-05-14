"use client";
import React, { useEffect, useState } from "react";
import SongCard from "@/app/components/artist/SongCard";

interface MoreSongsProps {
    artists: { name: string; slug?: string }[];
    currentSongId: number;
    locale: string;
}

type SongData = {
  mmid: number;
  songName: string;
  imageLink?: string;
};

const MoreSongs: React.FC<MoreSongsProps> = ({ artists, currentSongId, locale }) => {
  const [songs, setSongs] = useState<SongData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSongsForArtist(name: string, slug?: string): Promise<SongData[]> {
      try {
        if (slug) {
          const artistRes = await fetch(`/api/artist/${slug}`);
          const artistData = await artistRes.json();
          if (artistData && artistData.songs) {
            // filter out current song
            const songIds = artistData.songs.filter((id: number) => id !== currentSongId);
            const songFetches = songIds.map((id: number) =>
              fetch(`/api/song/search/${id}`).then(res => res.json()).then(song => song.data)
            );
            return (await Promise.all(songFetches)).filter(Boolean);
          }
        } else {
            // find all songs by artist name from database
          const res = await fetch(`/api/song/by-artist?artist=${encodeURIComponent(name)}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.songs)) {
            return data.songs.filter((song: SongData) => song.mmid !== currentSongId);
          }
        }
      } catch {
        throw new Error("Error fetching songs by artist");
      }
      return [];
    }

    const fetchAllSongs = async () => {
      setLoading(true);
      setError(null);
      try {
        const allSongsArr = await Promise.all(
          artists.map(({ name, slug }) => fetchSongsForArtist(name, slug))
        );
        // Flatten, remove duplicates by mmid, and limit to 4
        const allSongs = Array.from(
          new Map(allSongsArr.flat().map(song => [song.mmid, song])).values()
        ).slice(0, 4);
        setSongs(allSongs);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllSongs();

  }, [JSON.stringify(artists), currentSongId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!songs.length) return null;

  return (
    <div className="flex flex-col justify-center items-center gap-5 max-md:max-w-[90%] mx-auto">
      <h2 className="text-2xl font-bold text-white">More Lyrics From {artists[0].name}</h2>
      <div className={songs.length === 1 ? "flex justify-center" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {songs.map((song) => (
          <SongCard
            songName={song.songName}
            mmid={song.mmid}
            imageLink={song.imageLink ?? ""}
            locale={locale}
            key={`${song.songName}-${song.mmid}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MoreSongs

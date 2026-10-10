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

  if (loading) return <p role="status" className="text-center text-sm text-[#CBBEAE]">Loading related songs…</p>;
  if (error) return <p role="status" className="text-center text-sm text-[#CBBEAE]">Related songs are temporarily unavailable.</p>;
  if (!songs.length) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <h2 className="text-xl font-semibold text-[#F3EDE3]">More lyrics from {artists[0]?.name}</h2>
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
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

import connectDB from "@/infrastructure/database/mongodb";
import Song from "@/modules/songs/infrastructure/song.model";
import type { RomanizationReferenceSong, RomanizationReferenceSource } from "@/modules/romanization-references/application/romanization-reference.types";

export class MongoRomanizationReferenceSource implements RomanizationReferenceSource {
  async recentReviewedSongs(limit: number): Promise<RomanizationReferenceSong[]> {
    await connectDB();
    const songs = await Song.find({ lyricsV2: { $exists: true } })
      .sort({ updatedAt: -1, mmid: -1 })
      .limit(limit)
      .select("mmid lyricsV2 -_id")
      .lean();
    return songs.map(song => ({ mmid: song.mmid, lyricsV2: song.lyricsV2! }));
  }
}

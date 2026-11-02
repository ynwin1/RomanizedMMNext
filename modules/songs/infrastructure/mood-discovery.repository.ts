import connectDB from "@/infrastructure/database/mongodb";
import {MoodometerModel} from "./moodometer.model";
import {MoodometerAnalysisSchema} from "../application/moodometer.validation";
import {rankMoodCandidates} from "../application/mood-discovery";
import {lyricTimingFingerprint} from "../application/lyric-timing.fingerprint";
import type {MoodId} from "../domain/moodometer.types";
import type {SongEntity} from "../domain/song.types";
import type {SongService} from "../application/song.service";

export async function discoverSongsByMood(songs:SongService,mood:MoodId,limit=24):Promise<Array<{song:SongEntity;score:number}>> {
  await connectDB();
  // Published mood records only; filter stale lyric fingerprints before rendering.
  const records=await MoodometerModel.find({"analysis.status":"published","analysis.moods.moodId":mood})
    .sort({createdAt:-1,_id:-1}).limit(500).lean();
  const ranked=rankMoodCandidates(records.map(r=>({
    mmid:r.mmid,analysis:MoodometerAnalysisSchema.parse(r.analysis),
  })),mood,Math.min(100,Math.max(limit*3,30)));
  const matched=await Promise.all(ranked.map(async item=>{
    try {
      const song=await songs.getSongPage(item.mmid);
      if(!song.lyricsV2 || lyricTimingFingerprint(song.lyricsV2)!==
        records.find(r=>r.mmid===item.mmid)?.analysis.lyricsFingerprint)return null;
      return {song,score:item.score};
    }catch{return null}
  }));
  return matched.filter((item):item is {song:SongEntity;score:number}=>item!==null).slice(0,limit);
}

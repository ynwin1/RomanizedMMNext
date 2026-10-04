export interface LyricSourceLine {
  index: number;
  text: string;
}

export interface LyricGenerationInput {
  lines: LyricSourceLine[];
}

export interface GeneratedLyricLine {
  index: number;
  text: string;
}

export interface RomanizationReference {
  burmese: string;
  romanized: string;
  meaning?: string;
  sourceSongMmid: number;
  sourceSongName: string;
  match: "exact" | "phrase" | "similar";
  score: number;
}

export interface RomanizationGenerationInput extends LyricGenerationInput {
  references?: RomanizationReference[];
}

export interface RomanizationReviewInput extends LyricGenerationInput {
  romanizedLines: GeneratedLyricLine[];
  meaningLines: GeneratedLyricLine[];
  references?: RomanizationReference[];
}

export interface EditorialGenerationInput extends LyricGenerationInput {
  songName?: string;
  artistNames?: string[];
  romanizedLines?: GeneratedLyricLine[];
  meaningLines?: GeneratedLyricLine[];
}

export interface LineGenerationResult {
  lines: GeneratedLyricLine[];
}

export interface EditorialGenerationResult {
  about: string;
  whenToListen: string;
}

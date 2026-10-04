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

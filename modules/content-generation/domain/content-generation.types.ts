export interface LyricSourceLine {
  index: number;
  text: string;
}

export interface LyricGenerationInput {
  lines: LyricSourceLine[];
}

export interface EditorialGenerationInput extends LyricGenerationInput {
  songName?: string;
  artistNames?: string[];
}

export interface GeneratedLyricLine {
  index: number;
  text: string;
}

export interface LineGenerationResult {
  lines: GeneratedLyricLine[];
}

export interface EditorialGenerationResult {
  about: string;
  whenToListen: string;
}

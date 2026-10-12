export interface LyricSourceLine {
  index: number;
  text: string;
}

export interface LyricGenerationInput {
  lines: LyricSourceLine[];
  references?: Array<{ burmese: string; romanized: string }>;
}

export interface GeneratedLyricLine {
  index: number;
  text: string;
}

export interface RomanizationRefinement {
  index: number;
  kind: "exact-line" | "word" | "conflict";
  original: string;
  corrected: string;
  referenceMmids: number[];
  hasConflict: boolean;
}

export interface EditorialGenerationInput extends LyricGenerationInput {
  songName?: string;
  artistNames?: string[];
  romanizedLines?: GeneratedLyricLine[];
  meaningLines?: GeneratedLyricLine[];
}

export interface LineGenerationResult {
  lines: GeneratedLyricLine[];
  refinements?: RomanizationRefinement[];
}

export interface EditorialGenerationResult {
  about: string;
  whenToListen: string;
}

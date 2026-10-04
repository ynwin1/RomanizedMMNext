export type ContentGenerationQualityIssueCode =
  | "romanization_contains_myanmar_script"
  | "meaning_contains_myanmar_script"
  | "romanization_sentence_not_capitalized"
  | "meaning_sentence_not_capitalized"
  | "about_multiline"
  | "when_to_listen_multiline";

export interface ContentGenerationQualityIssue {
  code: ContentGenerationQualityIssueCode;
  field: "romanized" | "meaning" | "about" | "whenToListen";
  message: string;
  lineIndex?: number;
}

export interface ContentGenerationQualityReport {
  valid: boolean;
  issues: ContentGenerationQualityIssue[];
}

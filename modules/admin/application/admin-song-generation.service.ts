import { z } from "zod";
import type { ContentGenerationService } from "@/modules/content-generation/application/content-generation.service";
import { buildLyricsV2FromAlignedText } from "@/modules/songs/application/lyrics-v2.builder";

const InputSchema = z.object({
  burmeseLyrics: z.string().max(200000).refine(value => value.trim().length > 0, "Burmese lyrics are required."),
  songName: z.string().trim().max(500).optional(),
  artistNames: z.array(z.string().trim().min(1).max(500)).max(30).optional(),
}).strict();

function lines(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
    .map((value, index) => ({ index, text: value }));
}

function join(values: Array<{ text: string }>) {
  return values.map(value => value.text).join("\n");
}

export class AdminSongGenerationService {
  constructor(
    private readonly generation: Pick<
      ContentGenerationService,
      "romanize" | "translateMeaning" | "generateEditorialMetadata"
    >,
  ) {}

  async generate(input: unknown) {
    const parsed = InputSchema.parse(input);
    const sourceInput = { lines: lines(parsed.burmeseLyrics) };

    const [romanized, meaning] = await Promise.all([
      this.generation.romanize(sourceInput),
      this.generation.translateMeaning(sourceInput),
    ]);

    const editorial = await this.generation.generateEditorialMetadata({
      ...sourceInput,
      ...(parsed.songName ? { songName: parsed.songName } : {}),
      ...(parsed.artistNames?.length ? { artistNames: parsed.artistNames } : {}),
      romanizedLines: romanized.lines,
      meaningLines: meaning.lines,
    });

    const romanizedText = join(romanized.lines);
    const meaningText = join(meaning.lines);

    return {
      romanized: romanizedText,
      meaning: meaningText,
      about: editorial.about,
      whenToListen: editorial.whenToListen,
      lyricsV2: buildLyricsV2FromAlignedText(
        parsed.burmeseLyrics,
        romanizedText,
        meaningText,
      ),
    };
  }
}

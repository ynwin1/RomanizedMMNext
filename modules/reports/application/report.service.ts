import { SongReportInput } from "../domain/report.types";

export type ReportNotifier = (
  webhookUrl: string,
  message: { content: string },
) => Promise<void>;

export class ReportService {
  constructor(private readonly notify: ReportNotifier) {}

  async submit(input: SongReportInput): Promise<void> {
    const webhookUrl = process.env.DISCORD_SONG_REPORT_WEBHOOK;
    if (!webhookUrl) {
      throw new Error("Discord webhook URL is not set");
    }

    await this.notify(webhookUrl, {
      content: `Song Name: ${input.songName}\nArtist: ${input.artist}\nDetails: ${input.details}`,
    });
  }
}

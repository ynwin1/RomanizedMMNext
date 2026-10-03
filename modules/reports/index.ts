import { sendDiscordNotification } from "@/integrations/notifications/discord-notification.adapter";
import { ReportService } from "./application/report.service";

export const reportService = new ReportService(sendDiscordNotification);

export * from "./domain/report.types";

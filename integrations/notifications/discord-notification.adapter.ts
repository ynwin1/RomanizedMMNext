export interface DiscordMessage {
  content: string;
}

export async function sendDiscordNotification(
  webhookUrl: string,
  message: DiscordMessage,
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error("Failed to send notification to Discord");
  }
}

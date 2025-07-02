import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendSlackNotification = action({
  args: {
    webhookUrl: v.string(),
    message: v.string(),
  },
  handler: async (_, args) => {
    const res = await fetch(args.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: args.message }),
    });
    if (!res.ok) {
      throw new Error(`Slack通知失敗: ${res.status} ${res.statusText}`);
    }
  },
}); 
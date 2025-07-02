/**
 * Slack通知機能
 * 
 * このファイルでは、Slack Webhookを使用した通知機能を提供しています。
 * Google広告APIリリースノートの新着通知やエラー通知に使用されます。
 */

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Slack Webhookを使用してメッセージを送信するアクション関数
 * 
 * この関数は以下の用途で使用されます：
 * - Google広告APIリリースノートの新着通知
 * - エラー発生時の通知
 * 
 * @param webhookUrl - Slack WebhookのURL
 * @param message - 送信するメッセージ内容
 * @throws Error - Webhook送信に失敗した場合
 */
export const sendSlackNotification = action({
  args: {
    webhookUrl: v.string(),
    message: v.string(),
  },
  handler: async (_, args) => {
    // Slack WebhookにPOSTリクエストを送信
    const res = await fetch(args.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: args.message }),
    });
    
    // レスポンスが正常でない場合はエラーを投げる
    if (!res.ok) {
      throw new Error(`Slack通知失敗: ${res.status} ${res.statusText}`);
    }
  },
}); 
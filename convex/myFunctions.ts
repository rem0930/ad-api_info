/**
 * Google広告APIリリースノート監視システム
 * 
 * このファイルには以下の機能が含まれています：
 * - 基本的なConvex関数（query, mutation, action）のサンプル
 * - Google広告リリースノートの定期チェック機能
 * - Slack通知機能
 */

import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { checkAndSaveGoogleAdsReleaseNotes } from "./sources/googleAds";
import { sendSlackNotification } from "./slack";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

/**
 * データベースから数値のリストを取得するクエリ関数
 * @param count - 取得する数値の個数
 * @returns ビューアー情報と数値のリスト
 */
export const listNumbers = query({
  // Validators for arguments.
  args: {
    count: v.number(),
  },

  // Query implementation.
  handler: async (ctx, args) => {
    //// Read the database as many times as you need here.
    //// See https://docs.convex.dev/database/reading-data.
    const numbers = await ctx.db
      .query("numbers")
      // Ordered by _creationTime, return most recent
      .order("desc")
      .take(args.count);
    return {
      viewer: (await ctx.auth.getUserIdentity())?.name ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

/**
 * データベースに新しい数値を追加するミューテーション関数
 * @param value - 追加する数値
 */
export const addNumber = mutation({
  // Validators for arguments.
  args: {
    value: v.number(),
  },

  // Mutation implementation.
  handler: async (ctx, args) => {
    //// Insert or modify documents in the database here.
    //// Mutations can also read from the database like queries.
    //// See https://docs.convex.dev/database/writing-data.

    const id = await ctx.db.insert("numbers", { value: args.value });

    console.log("Added new document with id:", id);
    // Optionally, return a value from your mutation.
    // return id;
  },
});

/**
 * サードパーティAPIとの連携やnpmパッケージの使用例
 * @param first - 数値パラメータ
 * @param second - 文字列パラメータ
 */
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    //// Query data by running Convex queries.
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    });
    console.log(data);

    //// Write data by running Convex mutations.
    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    });
  },
});

/**
 * Google広告リリースノートの定期チェック機能
 * 
 * 毎日JST 9:00（UTC 0:00）に実行され、新しいリリースノートがある場合に
 * Slackに通知を送信します。
 * 
 * 設定項目：
 * - cron: "0 9 * * *" - 毎日UTC 0:00（JST 9:00）に実行
 * - SLACK_WEBHOOK_URL: Slack通知用のWebhook URL（環境変数で設定推奨）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const googleAdsReleaseNoteCheck = {
  cron: "0 9 * * *", // JST 9:00（UTC 0:00）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any) => {
    // TODO: 環境変数から取得するように変更
    const SLACK_WEBHOOK_URL = "<YOUR_WEBHOOK_URL>";
    
    try {
      // Google広告リリースノートをチェックして新しいアイテムを取得
      const newItems = await ctx.runMutation(checkAndSaveGoogleAdsReleaseNotes, {});
      
      // 新しいアイテムがある場合、Slackに通知
      if (newItems.length > 0) {
        const msg = `Google広告APIリリースノート新着\n\n` +
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newItems.map((item: any) => `• [${item.title}](${item.link}) (${item.pubDate})`).join("\n");
        await ctx.runAction(sendSlackNotification, {
          webhookUrl: SLACK_WEBHOOK_URL,
          message: msg,
        });
      }
    } catch (e: unknown) {
      // エラーが発生した場合、Slackにエラー通知を送信
      await ctx.runAction(sendSlackNotification, {
        webhookUrl: SLACK_WEBHOOK_URL,
        message: `⚠️ Google広告: 情報取得に失敗しました\n${e instanceof Error ? e.message : String(e)}`,
      });
    }
  },
};

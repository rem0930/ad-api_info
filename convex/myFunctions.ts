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
 * Google広告リリースノートの型定義
 */
interface GoogleAdsReleaseNote {
  _id: string;
  title: string;
  link: string;
  pubDate: string;
  lastSeen: string;
}

/**
 * Google広告リリースノートのリストを取得するクエリ関数
 * @param limit - 取得するリリースノートの最大数
 * @returns リリースノートの配列（最新順）
 */
export const listGoogleAdsReleaseNotes = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50; // デフォルトで50件取得
    
    const releaseNotes = await ctx.db
      .query("googleAdsReleaseNotes")
      .order("desc") // 最新のものから
      .take(limit);
    
    return releaseNotes.reverse(); // 古い順に表示
  },
});

/**
 * Google広告リリースノートを検索するクエリ関数
 * @param searchTerm - 検索キーワード
 * @param limit - 取得するリリースノートの最大数
 * @returns 検索結果のリリースノート配列
 */
export const searchGoogleAdsReleaseNotes = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchTerm = args.searchTerm.toLowerCase();
    
    const allNotes = await ctx.db.query("googleAdsReleaseNotes").collect();
    
    // タイトルで検索（大文字小文字を区別しない）
    const filteredNotes = allNotes.filter(note => 
      note.title.toLowerCase().includes(searchTerm)
    );
    
    // 最新順にソートして制限
    return filteredNotes
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, limit);
  },
});

/**
 * Google広告リリースノートの統計情報を取得するクエリ関数
 * @returns リリースノートの統計情報
 */
export const getGoogleAdsStats = query({
  args: {},
  handler: async (ctx) => {
    const allNotes = await ctx.db.query("googleAdsReleaseNotes").collect();
    
    // 今日の日付を取得
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 今月の日付範囲を計算
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // 今日追加されたリリースノート
    const todayNotes = allNotes.filter(note => 
      note.lastSeen.startsWith(todayStr)
    );
    
    // 今月追加されたリリースノート
    const thisMonthNotes = allNotes.filter(note => {
      const noteDate = new Date(note.lastSeen);
      return noteDate >= firstDayOfMonth && noteDate <= lastDayOfMonth;
    });
    
    return {
      total: allNotes.length,
      today: todayNotes.length,
      thisMonth: thisMonthNotes.length,
      lastUpdated: allNotes.length > 0 ? allNotes[allNotes.length - 1].lastSeen : null,
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
 * Google広告リリースノートをデータベースに追加するミューテーション関数
 * @param title - リリースノートのタイトル
 * @param link - リリースノートのリンク
 * @param pubDate - 公開日
 * @param lastSeen - 最後に確認した日時
 */
export const addGoogleAdsReleaseNote = mutation({
  args: {
    title: v.string(),
    link: v.string(),
    pubDate: v.string(),
    lastSeen: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("googleAdsReleaseNotes", {
      title: args.title,
      link: args.link,
      pubDate: args.pubDate,
      lastSeen: args.lastSeen,
    });
    return id;
  },
});

/**
 * 手動でGoogle広告リリースノートをチェックするアクション関数
 * @returns 新しく追加されたリリースノートの配列
 */
export const manualCheckGoogleAdsReleaseNotes = action({
  args: {},
  handler: async (ctx): Promise<Array<{title: string; link: string; pubDate: string}>> => {
    // RSSフィードを取得
    const response = await fetch('https://developers.google.com/feeds/google-ads-api-release-notes.xml');
    const xmlText = await response.text();
    
    // 簡易的なXMLパース
    const items: Array<{title: string; link: string; pubDate: string}> = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      
      items.push({
        title: titleMatch ? titleMatch[1].trim() : '',
        link: linkMatch ? linkMatch[1].trim() : '',
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
      });
    }

    // データベースから既存のリリースノートを取得
    const prev: GoogleAdsReleaseNote[] = await ctx.runQuery(api.myFunctions.listGoogleAdsReleaseNotes, { limit: 1000 });
    const prevLinks: Set<string> = new Set(prev.map((i: GoogleAdsReleaseNote) => i.link));

    // 新着分のみを抽出
    const newItems: Array<{title: string; link: string; pubDate: string}> = items.filter(item => !prevLinks.has(item.link));

    // 新着分をデータベースに保存
    const now = new Date().toISOString();
    for (const item of newItems) {
      await ctx.runMutation(api.myFunctions.addGoogleAdsReleaseNote, {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        lastSeen: now,
      });
    }
    
    return newItems;
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

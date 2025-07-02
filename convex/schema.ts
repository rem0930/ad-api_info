/**
 * Convexデータベーススキーマ定義
 * 
 * このファイルでは、アプリケーションで使用するデータベーステーブルの構造を定義しています。
 * スキーマは任意ですが、TypeScriptの型安全性を向上させることができます。
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  /**
   * サンプル用の数値テーブル
   * Convexの基本的な機能をテストするために使用
   */
  numbers: defineTable({
    value: v.number(),
  }),
  
  /**
   * Google広告リリースノート情報を格納するテーブル
   * 重複チェックとSlack通知のために使用
   */
  googleAdsReleaseNotes: defineTable({
    title: v.string(),        // リリースノートのタイトル
    link: v.string(),         // リリースノートのURL
    pubDate: v.string(),      // 公開日（RSSフィードの形式）
    lastSeen: v.string(),     // 最後に確認した日時（ISO日付文字列）
  }),
});

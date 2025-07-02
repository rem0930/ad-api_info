/**
 * Google広告APIリリースノート取得・監視機能
 * 
 * このファイルでは以下の機能を提供しています：
 * - Google広告APIのRSSフィードからのリリースノート取得
 * - 新着リリースノートの検知とデータベース保存
 * - 重複チェック機能
 */

import { query, mutation } from '../_generated/server';

// Google広告APIリリースノートのRSSフィードURL
const FEED_URL = 'https://developers.google.com/feeds/google-ads-api-release-notes.xml';

/**
 * Google広告APIリリースノートをRSSフィードから取得するクエリ関数
 * 
 * この関数はRSSフィードをパースして、最新のリリースノート情報を取得します。
 * 簡易的な正規表現ベースのXMLパーサーを使用しています。
 * 
 * @returns リリースノートの配列（タイトル、リンク、公開日を含む）
 */
export const fetchGoogleAdsReleaseNotes = query({
  args: {},
  handler: async () => {
    // RSSフィードを取得
    const response = await fetch(FEED_URL);
    const xmlText = await response.text();
    
    // 簡易的なXMLパース（実際の実装ではより堅牢なパーサーを使用）
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    // 各itemタグを抽出してパース
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
    
    return items;
  },
});

/**
 * Google広告APIリリースノートの差分検知・保存・新着通知機能
 * 
 * この関数は以下の処理を実行します：
 * 1. RSSフィードから最新のリリースノートを取得
 * 2. データベースの既存データと比較して新着を検知
 * 3. 新着分をデータベースに保存
 * 4. 新着分のリストを返却（Slack通知用）
 * 
 * @returns 新着リリースノートの配列
 */
export const checkAndSaveGoogleAdsReleaseNotes = mutation({
  args: {},
  handler: async (ctx) => {
    // RSSフィードを取得
    const response = await fetch(FEED_URL);
    const xmlText = await response.text();
    
    // 簡易的なXMLパース
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    // 各itemタグを抽出してパース
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
    const prev = await ctx.db.query('googleAdsReleaseNotes').collect();
    const prevLinks = new Set(prev.map(i => i.link));

    // 新着分のみを抽出（既存のリンクに含まれていないもの）
    const newItems = items.filter(item => !prevLinks.has(item.link));

    // 新着分をデータベースに保存
    const now = new Date().toISOString();
    for (const item of newItems) {
      await ctx.db.insert('googleAdsReleaseNotes', {
        ...item,
        lastSeen: now, // 最後に確認した日時を記録
      });
    }
    
    return newItems;
  },
}); 
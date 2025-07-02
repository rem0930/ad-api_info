import { query, mutation } from '../_generated/server';

const FEED_URL = 'https://developers.google.com/feeds/google-ads-api-release-notes.xml';

// RSSから最新リリースノートを取得
export const fetchGoogleAdsReleaseNotes = query({
  args: {},
  handler: async () => {
    const response = await fetch(FEED_URL);
    const xmlText = await response.text();
    
    // 簡易的なXMLパース（実際の実装ではより堅牢なパーサーを使用）
    const items = [];
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
    
    return items;
  },
});

// 差分検知＆保存＆新着分返却
export const checkAndSaveGoogleAdsReleaseNotes = mutation({
  args: {},
  handler: async (ctx) => {
    const response = await fetch(FEED_URL);
    const xmlText = await response.text();
    
    // 簡易的なXMLパース
    const items = [];
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

    // 既存データ取得
    const prev = await ctx.db.query('googleAdsReleaseNotes').collect();
    const prevLinks = new Set(prev.map(i => i.link));

    // 新着分のみ抽出
    const newItems = items.filter(item => !prevLinks.has(item.link));

    // 新着分を保存
    const now = new Date().toISOString();
    for (const item of newItems) {
      await ctx.db.insert('googleAdsReleaseNotes', {
        ...item,
        lastSeen: now,
      });
    }
    return newItems;
  },
}); 
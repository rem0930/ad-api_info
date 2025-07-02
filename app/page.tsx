"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";
import { useState } from "react";

/**
 * Google広告APIリリースノート監視システム - メインページ
 * 
 * このページでは以下の機能を提供しています：
 * - Google広告APIリリースノートの一覧表示
 * - 統計情報の表示
 * - 手動チェック機能
 * - リアルタイム更新
 * - 検索機能
 */
export default function Home() {
  return (
    <>
      {/* 固定ヘッダー */}
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <h1 className="text-xl font-bold">Google広告API リリースノート監視</h1>
        <nav className="flex gap-4">
          <Link href="/demo" className="text-sm underline hover:no-underline">
            デモページ
          </Link>
        </nav>
      </header>
      
      {/* メインコンテンツエリア */}
      <main className="p-8">
        <GoogleAdsDashboard />
      </main>
    </>
  );
}

/**
 * Google広告ダッシュボードコンポーネント
 * 
 * リリースノートの統計情報と一覧を表示するメインコンポーネント
 */
function GoogleAdsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // 統計情報を取得
  const stats = useQuery(api.myFunctions.getGoogleAdsStats);
  
  // リリースノート一覧を取得（検索時は検索結果、そうでなければ通常の一覧）
  const normalReleaseNotes = useQuery(api.myFunctions.listGoogleAdsReleaseNotes, { limit: 20 });
  const searchReleaseNotes = useQuery(
    api.myFunctions.searchGoogleAdsReleaseNotes,
    isSearching && searchTerm.trim() ? { searchTerm: searchTerm.trim(), limit: 20 } : "skip"
  );
  
  // 表示するリリースノートを決定
  const releaseNotes = isSearching && searchTerm.trim() ? searchReleaseNotes : normalReleaseNotes;
  
  // 手動チェック機能
  const manualCheck = useAction(api.myFunctions.manualCheckGoogleAdsReleaseNotes);

  // 検索処理
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setIsSearching(term.trim().length > 0);
  };

  // 手動チェック処理
  const handleManualCheck = async () => {
    try {
      console.log('=== 手動チェック開始 ===');
      console.log('手動チェックを開始します...');
      
      const result = await manualCheck({});
      console.log('手動チェック結果:', result);
      console.log('新しく追加されたリリースノート数:', result.length);
      console.log('新しく追加されたリリースノート詳細:', result);
      
      if (result.length === 0) {
        console.log('新着リリースノートは0件でした');
        console.log('考えられる原因:');
        console.log('1. RSSフィードに新しい記事がない');
        console.log('2. 既に全ての記事がデータベースに保存済み');
        console.log('3. RSSフィードの取得に失敗');
      }
      
      alert(`チェック完了！新着: ${result.length}件`);
      console.log('=== 手動チェック終了 ===');
    } catch (error) {
      console.error('=== 手動チェックエラー ===');
      console.error('リリースノートの取得に失敗しました:', error);
      console.error('エラーの詳細:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('エラーが発生しました。コンソールを確認してください。');
    }
  };

  // データ読み込み中の表示
  if (stats === undefined || normalReleaseNotes === undefined || (isSearching && searchReleaseNotes === undefined)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // releaseNotesがundefinedの場合は空配列を使用
  const displayNotes = releaseNotes ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 統計情報セクション */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="総リリースノート数"
          value={stats.total}
          description="データベースに保存されている総数"
          color="blue"
        />
        <StatCard
          title="今日の新着"
          value={stats.today}
          description="今日追加されたリリースノート"
          color="green"
        />
        <StatCard
          title="今月の新着"
          value={stats.thisMonth}
          description="今月追加されたリリースノート"
          color="purple"
        />
        <StatCard
          title="最終更新"
          value={stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString('ja-JP') : 'なし'}
          description="最後に更新された日時"
          color="orange"
        />
      </div>

      {/* 手動チェックボタン */}
      <div className="flex justify-center">
        <button
          onClick={handleManualCheck}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          手動でリリースノートをチェック
        </button>
      </div>

      {/* 検索機能 */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="リリースノートを検索..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        {isSearching && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
            「{searchTerm}」で検索中... ({displayNotes.length}件)
          </p>
        )}
      </div>

      {/* リリースノート一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {isSearching ? `検索結果: "${searchTerm}"` : "最新のリリースノート"}
        </h2>
        
        {displayNotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isSearching 
                ? `「${searchTerm}」に一致するリリースノートが見つかりませんでした`
                : "まだリリースノートがありません"
              }
            </p>
            {!isSearching && (
              <button
                onClick={handleManualCheck}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                最初のリリースノートを取得
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayNotes.map((note, index) => (
              <ReleaseNoteCard key={index} note={note} searchTerm={searchTerm} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 統計カードコンポーネント
 * 
 * @param title - カードのタイトル
 * @param value - 表示する値
 * @param description - 説明文
 * @param color - カラーテーマ
 */
function StatCard({ 
  title, 
  value, 
  description, 
  color 
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  color: 'blue' | 'green' | 'purple' | 'orange' 
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]} dark:bg-gray-800 dark:border-gray-700 dark:text-white`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  );
}

/**
 * リリースノートカードコンポーネント
 * 
 * @param note - リリースノートのデータ
 * @param searchTerm - 検索キーワード（ハイライト用）
 */
function ReleaseNoteCard({ note, searchTerm }: { 
  note: { title: string; link: string; pubDate: string; lastSeen: string }; 
  searchTerm?: string 
}) {
  // 検索キーワードをハイライトする関数
  const highlightText = (text: string, term: string) => {
    if (!term || term.trim() === '') return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
          <a 
            href={note.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {searchTerm ? highlightText(note.title, searchTerm) : note.title}
          </a>
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded ml-4">
          {new Date(note.pubDate).toLocaleDateString('ja-JP')}
        </span>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        <span>公開日: {note.pubDate}</span>
        <span>取得日: {new Date(note.lastSeen).toLocaleDateString('ja-JP')}</span>
      </div>
    </div>
  );
}

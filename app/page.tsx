"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";

/**
 * アプリケーションのメインページコンポーネント
 * 
 * このページでは以下の機能を提供しています：
 * - Convexデータベースとのリアルタイム連携デモ
 * - 数値の追加・表示機能
 * - 開発者向けリソースへのリンク
 */
export default function Home() {
  return (
    <>
      {/* 固定ヘッダー */}
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        Convex + Next.js
      </header>
      
      {/* メインコンテンツエリア */}
      <main className="p-8 flex flex-col gap-16">
        <h1 className="text-4xl font-bold text-center">Convex + Next.js</h1>
        <Content />
      </main>
    </>
  );
}

/**
 * メインコンテンツコンポーネント
 * 
 * Convexのリアルタイム機能をデモンストレーションするためのコンポーネント
 * - データベースからの数値取得
 * - 新しい数値の追加
 * - リアルタイム更新の確認
 */
function Content() {
  // Convexクエリを使用してデータベースから数値を取得
  const { viewer, numbers } =
    useQuery(api.myFunctions.listNumbers, {
      count: 10,
    }) ?? {};
  
  // Convexミューテーションを使用してデータベースに数値を追加
  const addNumber = useMutation(api.myFunctions.addNumber);

  // データ読み込み中の表示
  if (viewer === undefined || numbers === undefined) {
    return (
      <div className="mx-auto">
        <p>loading... (consider a loading skeleton)</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto">
      {/* ユーザー情報表示 */}
      <p>Welcome {viewer ?? "Anonymous"}!</p>
      
      {/* 機能説明 */}
      <p>
        Click the button below and open this page in another window - this data
        is persisted in the Convex cloud database!
      </p>
      
      {/* ランダム数値追加ボタン */}
      <p>
        <button
          className="bg-foreground text-background text-sm px-4 py-2 rounded-md"
          onClick={() => {
            void addNumber({ value: Math.floor(Math.random() * 10) });
          }}
        >
          Add a random number
        </button>
      </p>
      
      {/* 数値リスト表示 */}
      <p>
        Numbers:{" "}
        {numbers?.length === 0
          ? "Click the button!"
          : numbers?.join(", ") ?? "..."}
      </p>
      
      {/* 開発者向け情報 */}
      <p>
        Edit{" "}
        <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
          convex/myFunctions.ts
        </code>{" "}
        to change your backend
      </p>
      <p>
        Edit{" "}
        <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
          app/page.tsx
        </code>{" "}
        to change your frontend
      </p>
      
      {/* サーバーコンポーネント例へのリンク */}
      <p>
        See the{" "}
        <Link href="/server" className="underline hover:no-underline">
          /server route
        </Link>{" "}
        for an example of loading data in a server component
      </p>
      
      {/* 開発者リソースセクション */}
      <div className="flex flex-col">
        <p className="text-lg font-bold">Useful resources:</p>
        <div className="flex gap-2">
          <div className="flex flex-col gap-2 w-1/2">
            <ResourceCard
              title="Convex docs"
              description="Read comprehensive documentation for all Convex features."
              href="https://docs.convex.dev/home"
            />
            <ResourceCard
              title="Stack articles"
              description="Learn about best practices, use cases, and more from a growing
            collection of articles, videos, and walkthroughs."
              href="https://www.typescriptlang.org/docs/handbook/2/basic-types.html"
            />
          </div>
          <div className="flex flex-col gap-2 w-1/2">
            <ResourceCard
              title="Templates"
              description="Browse our collection of templates to get started quickly."
              href="https://www.convex.dev/templates"
            />
            <ResourceCard
              title="Discord"
              description="Join our developer community to ask questions, trade tips & tricks,
            and show off your projects."
              href="https://www.convex.dev/community"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * リソースカードコンポーネント
 * 
 * 開発者向けリソースへのリンクを表示するためのカードコンポーネント
 * 
 * @param title - リソースのタイトル
 * @param description - リソースの説明
 * @param href - リソースのURL
 */
function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-2 bg-slate-200 dark:bg-slate-800 p-4 rounded-md h-28 overflow-auto">
      <a href={href} className="text-sm underline hover:no-underline">
        {title}
      </a>
      <p className="text-xs">{description}</p>
    </div>
  );
}

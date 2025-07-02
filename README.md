# Google広告APIリリースノート監視システム

このプロジェクトは、Google広告APIのリリースノートを自動的に監視し、新しいリリースノートが公開された際にSlackに通知を送信するシステムです。

## 🚀 機能

- **自動監視**: 毎日JST 9:00にGoogle広告APIのRSSフィードをチェック
- **重複検知**: 既に通知済みのリリースノートは除外
- **Slack通知**: 新着リリースノートをSlackチャンネルに自動通知
- **リアルタイムUI**: Convex + Next.jsによるリアルタイムデータ表示
- **エラー通知**: 監視処理でエラーが発生した場合もSlackに通知

## 🛠️ 技術スタック

- **バックエンド**: [Convex](https://convex.dev/) - リアルタイムデータベースとサーバーロジック
- **フロントエンド**: [React](https://react.dev/) + [Next.js](https://nextjs.org/) - モダンなWebアプリケーション
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com/) - 美しくアクセシブルなUI
- **通知**: Slack Webhook - リアルタイム通知

## 📦 セットアップ

### 前提条件

- Node.js 18以上
- pnpm（推奨）またはnpm
- Convexアカウント
- Slack Webhook URL

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/rem0930/ad-api_info.git
cd ad-api_info
```

2. 依存関係をインストール
```bash
pnpm install
```

3. Convexプロジェクトをセットアップ
```bash
npx convex dev
```

4. 環境変数を設定
```bash
# .env.localファイルを作成
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
```

5. 開発サーバーを起動
```bash
pnpm dev
```

## 🔧 設定

### Slack通知の設定

1. SlackワークスペースでIncoming Webhookを設定
2. 取得したWebhook URLを環境変数に設定
3. `convex/myFunctions.ts`の`SLACK_WEBHOOK_URL`を更新

### 監視スケジュールの変更

`convex/myFunctions.ts`の`googleAdsReleaseNoteCheck`関数内のcron設定を変更：

```typescript
cron: "0 9 * * *", // 毎日JST 9:00（UTC 0:00）
```

## 📁 プロジェクト構造

```
ad-api_info/
├── app/                    # Next.jsアプリケーション
│   ├── page.tsx           # メインページ
│   └── layout.tsx         # レイアウト
├── convex/                # Convexバックエンド
│   ├── myFunctions.ts     # メイン関数（cron、クエリ、ミューテーション）
│   ├── schema.ts          # データベーススキーマ
│   ├── slack.ts           # Slack通知機能
│   └── sources/
│       └── googleAds.ts   # Google広告API関連機能
├── components/            # Reactコンポーネント
└── public/               # 静的ファイル
```

## 🚀 デプロイ

### Convexへのデプロイ

```bash
npx convex deploy
```

### Next.jsアプリケーションのデプロイ

Vercel、Netlify、またはその他のプラットフォームにデプロイ可能です。

## 📚 学習リソース

ConvexとNext.jsの詳細については以下を参照してください：

- [Convex ドキュメント](https://docs.convex.dev/) - Convexの包括的なドキュメント
- [Next.js ドキュメント](https://nextjs.org/docs) - Next.jsの詳細ガイド
- [Convex Discord](https://convex.dev/community) - リアルタイムサポート

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します！

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

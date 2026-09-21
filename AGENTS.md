# Repository Guidelines

## プロジェクト構成

itxryx.com は Next.js 16・React 19・TypeScript の静的ポートフォリオです。アプリと Terraform の AWS 基盤は、デプロイ時に out/ を S3 へ同期して接続します。

- src/app/page.tsx: メイン画面。Profile・LinkSection・SiteFooter はファイル内のコンポーネント。
- src/app/layout.tsx: 共通レイアウトとメタデータ。globals.css: Tailwind CSS v4 とテーマ定義。
- src/app/current-year.tsx・noise-background.tsx: クライアント側の年表示と背景描画。
- public/: 静的アセット。public/me.jpeg は /me.jpeg で配信。
- terraform/bootstrap/: state 用 S3 とロック用 DynamoDB の初期構築。
- terraform/environments/prod/: 本番ルートモジュール。modules/static_site/ は S3・CloudFront、modules/www_redirect/ は www からルートドメインへの 301 リダイレクトを構成。
- .github/workflows/: CI/CD。.devcontainer/: Node 24 の開発環境。

## 開発・検証コマンド

コマンドは DevContainer の /workspace で実行します。

- npm ci: ロックファイルに従って依存関係をインストール。
- npm run dev: ポート 3000 で開発サーバーを起動。
- npm run build: 型チェックを含むビルドを実行し、静的ファイルを out/ に出力。
- npm run lint: Biome による整形・Lint の検査。
- npm run lint:fix: Biome の安全な自動修正。
- npm run format: Biome による整形。

npm run start は next start を実行するため、静的エクスポートの確認には使いません。本番相当の確認では out/ を静的サーバーで配信します。

## コーディングと静的出力

インデントはスペース 2 個とし、Biome の整形・import 整理に従います。コンポーネント名は PascalCase、ルートファイルは page.tsx・layout.tsx などの Next.js 規約に合わせます。src/ の参照には @/* エイリアスを利用できます。

next.config.ts の output: "export" と images.unoptimized: true を維持します。実行時サーバーが必要な cookies()・headers()・Server Actions・ISR・リクエスト依存の Route Handlers や、generateStaticParams() のない動的ルートは追加しません。

静的な画面構成は page.tsx に置き、Hooks が必要な処理は "use client" のコンポーネントに分離します。window・canvas などの操作は useEffect 内から行います。CurrentYear は閲覧時の年を取得するため useEffect を使用しています。Date 自体はブラウザー専用 API ではありません。

## テストと変更時の確認

テストフレームワーク・npm test・カバレッジ基準は未設定です。意味のあるロジックを追加する際は、用途に応じて Vitest や Playwright などの最小限の構成を導入し、renders-profile-links.test.tsx のように振る舞いを示す名前を付けます。

変更後は npm run lint と npm run build を実行し、実行結果と終了コードを報告します。失敗を抑制せず、依頼範囲外の問題は報告します。

## インフラとデプロイ

GitHub Actions のランナーは ubuntu-24.04 に固定しています。OS バージョンの更新時はワークフローの互換性を検証します。

Terraform apply と本番デプロイは GitHub Actions からのみ実行します。初回は Terraform Bootstrap、その後は Deploy Production を使用し、DevContainer を含むローカルから実 AWS への apply・S3 同期は行いません。

Deploy Production は main への push 時に PRODUCTION_DEPLOY_ENABLED=true の場合、または手動実行時に起動します。依存導入、Lint、ビルド、Terraform の整形検査・init・validate・plan・apply、out/ の S3 同期、CloudFront キャッシュ無効化の順に処理します。

本番の S3 読み取り権限は AWS:SourceArn 条件で対象 CloudFront に限定します。バックエンド設定・入力値・認証情報は GitHub Actions の Variables/Secrets から渡します。必要な設定と実行手順は DEPLOYMENT_MANUAL.md を参照してください。秘密情報や node_modules/・.next/・out/ などの生成物はコミットしません。

## コミットとプルリクエスト

履歴にある fix:・update:・chore: などの接頭辞に合わせ、変更内容を簡潔に記述します。例: fix: styles。PR には変更の要約と検証コマンド・結果を記載し、表示変更にはスクリーンショットを添えます。

## エージェントの作業方針

応答は日本語で、結論から簡潔に述べます。着手前に既存コード・依存関係・影響範囲を確認し、Next.js の変更前にはインストール済みバージョンとローカルの資料を確認します。未確認事項は明示します。

ユーザーの変更を上書きせず、変更を依頼範囲に限定します。削除などのリスクを伴う操作は理由・影響・安全策を事前に説明します。単純で読みやすい設計を優先し、不要な共通化やリファクタリングを避けます。構成やツールを変更した場合は、このガイドも更新します。

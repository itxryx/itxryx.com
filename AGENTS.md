# Repository Guidelines

## プロジェクト構成

itxryx.com は Next.js 16・React 19・TypeScript の静的ポートフォリオです。アプリと Terraform の AWS 基盤は、デプロイ時に out/ を S3 へ同期して接続します。

- src/app/page.tsx: メイン画面。Profile・LinkSection・SiteFooter はファイル内のコンポーネント。
- src/app/layout.tsx: 共通レイアウトとメタデータ。globals.css: Tailwind CSS v4 とテーマ定義。
- src/app/current-year.tsx・noise-background.tsx: クライアント側の年表示と背景描画。
- public/: 静的アセット。public/me.jpeg は /me.jpeg で配信。
- terraform/bootstrap/: state 用 S3 とロック用 DynamoDB の初期構築。
- terraform/environments/prod/: 本番ルートモジュール。modules/static_site/ は S3・CloudFront、modules/www_redirect/ は www からルートドメインへの 301 リダイレクトを構成。
- .github/workflows/: CI/CD。.devcontainer/: mise で Node.js・pnpm を管理する開発環境。

## 開発・検証コマンド

コマンドは DevContainer の /workspace で実行します。mise.toml の aqua:nodejs/node で Node.js を 26.12.1 に完全固定し、aqua:pnpm/pnpm で pnpm を 12 系にメジャー固定します。package.json の engines も同じ条件に揃えます。DevContainer のビルドコンテキストはリポジトリルートです。イメージビルド時に mise.toml・mise.lock を COPY し、mise trust と mise install --yes --locked を実行します。コンテナ作成後の postCreateCommand では pnpm install --frozen-lockfile のみ実行します。mise の [settings] に minimum_release_age = "7d" と lockfile = true を指定し、新規バージョン選択の待機期間と mise.lock を管理します。通常の導入は mise install --yes --locked、pnpm 自体の更新は mise lock --bump aqua:pnpm/pnpm の後に mise install --yes --locked を実行し、mise.lock もコミットしてください。

- pnpm install --frozen-lockfile: pnpm-lock.yaml に従って依存関係をインストール。依存更新時は pnpm add / pnpm update を使い、ロックファイルもコミット。
- pnpm run dev: ポート 3000 で開発サーバーを起動。
- pnpm run build: 型チェックを含むビルドを実行し、静的ファイルを out/ に出力。
- pnpm run lint: Biome による整形・Lint の検査。
- pnpm run lint:fix: Biome の安全な自動修正。
- pnpm run format: Biome による整形。

pnpm run start は next start を実行するため、静的エクスポートの確認には使いません。本番相当の確認では out/ を静的サーバーで配信します。

ロックファイルは必ず対応するツールのコマンドで生成・更新し、手動編集やスクリプトによる内容の書き換えは禁止します。mise.lock は mise lock、pnpm-lock.yaml は pnpm install --lockfile-only・pnpm add・pnpm update などを使用します。不要なエントリの削除や競合解消も、設定ファイルを修正してからツールで再生成してください。

## コーディングと静的出力

依存パッケージのインストールスクリプトは pnpm-workspace.yaml の allowBuilds で個別に許可します。

インデントはスペース 2 個とし、Biome の整形・import 整理に従います。コンポーネント名は PascalCase、ルートファイルは page.tsx・layout.tsx などの Next.js 規約に合わせます。src/ の参照には @/* エイリアスを利用できます。

next.config.ts の output: "export" と images.unoptimized: true を維持します。実行時サーバーが必要な cookies()・headers()・Server Actions・ISR・リクエスト依存の Route Handlers や、generateStaticParams() のない動的ルートは追加しません。

静的な画面構成は page.tsx に置き、Hooks が必要な処理は "use client" のコンポーネントに分離します。window・canvas などの操作は useEffect 内から行います。CurrentYear は閲覧時の年を取得するため useEffect を使用しています。Date 自体はブラウザー専用 API ではありません。

## テストと変更時の確認

公開後チェックは scripts/verify-site.mjs、Bootstrap の backend 操作は scripts/bootstrap-backend.sh に実装しています。`node --test scripts/*.test.mjs` は Node.js 標準のテストランナーを使い、HTTP サーバーや AWS CLI・Terraform のモックで検証するため、AWS 認証は不要です。CI は ShellCheck でも Bootstrap スクリプトを検査します。アプリ用テストフレームワーク・pnpm test・カバレッジ基準は未設定です。

変更後は pnpm run lint と pnpm run build を実行し、実行結果と終了コードを報告します。失敗を抑制せず、依頼範囲外の問題は報告します。

## インフラとデプロイ

GitHub Actions のランナーは ubuntu-24.04 に固定しています。OS バージョンの更新時はワークフローの互換性を検証します。

Terraform apply と本番デプロイは GitHub Actions からのみ実行します。初回は Terraform Bootstrap で state 用リソースを作成し、Terraform Production で本番インフラを構築します。サイト公開には Deploy Site を使用し、DevContainer を含むローカルから実 AWS への apply・S3 同期は行いません。

Terraform Bootstrap は main からの手動実行専用です。mode は create（新規作成）、adopt（既存リソースの取り込み）、manage（保存済み state の管理）で、既定は manage・apply=false です。Bootstrap 自身の state は TF_BOOTSTRAP_STATE_KEY で本番と別の S3 キーに保存します。初回 create は local backend から移行し、復旧用 state を Artifact に7日間保存します。バケット・ロックテーブルは prevent_destroy で保護し、既存 state を上書きしません。元の state が利用できる場合は import より移行を優先してください。

Terraform Production は main からの手動実行専用で、既定では plan のみ実行します。apply=true の場合は terraform-production Environment の承認後に、同じコミット・保存済み plan・Provider lock を使って適用します。承認待ちには GitHub 側の Required reviewers 設定が必要です。plan の Artifact は1日間保存します。

CI は PR と main への push で検証・ビルドし、main の out/ を7日間 Artifact として保存します。Deploy Site は main の push に対する CI 成功後、PRODUCTION_DEPLOY_ENABLED=true の場合にその成果物を公開します。手動公開は main のみで、同じ CI を再利用します。ビルドには AWS 認証を渡しません。

Deploy Site は SITE_BUCKET_NAME・SITE_DISTRIBUTION_ID で指定した配信先を使用し、Terraform は実行しません。公開前に対象 SHA が main の最新か確認し、S3 同期、CloudFront の無効化と完了待機、ページ・画像・www 転送・404 の検証を行います。Terraform Bootstrap・Terraform Production と同じ concurrency group を使用します。

本番の S3 読み取り権限は AWS:SourceArn 条件で対象 CloudFront に限定します。バックエンド設定・入力値・認証情報は GitHub Actions の Variables/Secrets から渡します。必要な設定と実行手順は DEPLOYMENT_MANUAL.md を参照してください。秘密情報や node_modules/・.next/・out/ などの生成物はコミットしません。

## コミットとプルリクエスト

履歴にある fix:・update:・chore: などの接頭辞に合わせ、変更内容を簡潔に記述します。例: fix: styles。PR には変更の要約と検証コマンド・結果を記載し、表示変更にはスクリーンショットを添えます。

## エージェントの作業方針

応答は日本語で、結論から簡潔に述べます。着手前に既存コード・依存関係・影響範囲を確認し、Next.js の変更前にはインストール済みバージョンとローカルの資料を確認します。未確認事項は明示します。

ユーザーの変更を上書きせず、変更を依頼範囲に限定します。削除などのリスクを伴う操作は理由・影響・安全策を事前に説明します。単純で読みやすい設計を優先し、不要な共通化やリファクタリングを避けます。構成やツールを変更した場合は、このガイドも更新します。

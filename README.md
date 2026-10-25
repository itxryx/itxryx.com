# itxryx.com

Next.js・React・TypeScript による静的ポートフォリオです。

## 開発環境

Node.js と pnpm は mise の aqua backend で管理します。mise.toml で Node.js は 26.12.1 に完全固定、pnpm は 12 系にメジャー固定しています。package.json の engines にも同じバージョン条件を指定しています。pnpm の新規バージョン選択では公開後 7 日以上経過したリリースを対象にし、解決したバージョンとチェックサムを mise.lock に保存します。

DevContainer のイメージビルド時に mise.toml・mise.lock を /workspace に COPY し、mise trust と mise install --yes --locked で Node.js・pnpm を導入します。コンテナ作成後は postCreateCommand で pnpm install --frozen-lockfile を実行し、依存をインストールします。コマンドはコンテナ内の /workspace で実行してください。

```sh
pnpm run dev
```

http://localhost:3000 で表示を確認できます。メイン画面は src/app/page.tsx です。

セットアップを再実行する場合:

```sh
mise trust
mise install --yes --locked
pnpm install --frozen-lockfile
```

pnpm 自体の更新は mise lock --bump aqua:pnpm/pnpm でロックを更新し、mise install --yes --locked で適用します。mise.lock もコミットしてください。

依存の追加・更新には pnpm add / pnpm update を使い、pnpm-lock.yaml もコミットしてください。依存パッケージのインストールスクリプトは pnpm-workspace.yaml の allowBuilds で個別に許可します。

## 検証

```sh
pnpm run lint
pnpm run build
```

ビルド結果は out/ に出力されます。静的出力の確認には out/ を配信する静的サーバーを使用してください。

## CI

`.github/workflows/ci.yml` は PR と main への push で実行されます。AWS 認証や `PRODUCTION_DEPLOY_ENABLED` の設定は不要です。

- `App`: 依存導入、Lint、自動化スクリプトのテスト、静的ビルド。main の成果物は Artifact として7日間保存します。
- `Terraform (bootstrap)` / `Terraform (prod)`: 整形検査、`terraform init -backend=false -input=false`、`terraform validate`。plan・apply は実行しません。
- `Workflows`: actionlint 1.7.12 で全 Workflow を検査し、同梱の ShellCheck で Bootstrap スクリプトを検査。

ブランチ保護で CI を必須にする場合は、初回実行後に上記4つのチェックを登録してください。ブランチ保護は GitHub 側で別途設定します。

自動化スクリプトのテストは `node --test scripts/*.test.mjs` で実行します。Node.js 標準のテストランナーを使用し、公開後チェックはローカル HTTP サーバー、Bootstrap は AWS CLI・Terraform のモックで検証します。実 AWS や外部サイトには接続しません。

## デプロイ

GitHub Actions から AWS S3 + CloudFront へデプロイします。

- `Terraform Bootstrap`: state 用リソースの作成・取り込み・管理。main からの手動実行専用で、既定では保存済み state の plan のみ実行します。Bootstrap 自身の state は本番と別の S3 キーに保存します。
- `Terraform Production`: 本番インフラの変更。main からの手動実行専用で、既定では plan のみ実行します。適用には `apply=true` を指定し、`terraform-production` Environment の承認設定を使用します。
- `Deploy Site`: main の CI 成功後に、その実行の Artifact を公開します。手動実行では同じ CI を呼び出してから公開します。Terraform は使用しません。

自動公開には `PRODUCTION_DEPLOY_ENABLED=true`、配信先には `SITE_BUCKET_NAME` と `SITE_DISTRIBUTION_ID` が必要です。公開後は CloudFront の無効化完了を待ち、ページ・画像・www 転送・404 を検証します。承認設定と移行手順は DEPLOYMENT_MANUAL.md を参照してください。

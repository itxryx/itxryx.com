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

- `App`: 依存導入、Lint、静的ビルド。
- `Terraform (bootstrap)` / `Terraform (prod)`: 整形検査、`terraform init -backend=false -input=false`、`terraform validate`。plan・apply は実行しません。
- `Workflows`: actionlint 1.7.12 で全 Workflow を検査。

ブランチ保護で CI を必須にする場合は、初回実行後に上記4つのチェックを登録してください。ブランチ保護は GitHub 側で別途設定します。

## デプロイ

GitHub Actions から AWS S3 + CloudFront へデプロイします。

- `Terraform Bootstrap`: state 用リソースの初期構築。手動実行専用。
- `Terraform Production`: 本番インフラの変更。main からの手動実行専用で、既定では plan のみ実行します。適用には `apply=true` を指定し、`terraform-production` Environment の承認設定を使用します。
- `Deploy Production`: サイトのビルド・公開。Terraform apply は実行せず、既存 state から配信先を取得します。

main への push では CI と、自動公開が有効な場合の Deploy Production が独立して起動します。承認設定と移行手順は DEPLOYMENT_MANUAL.md を参照してください。

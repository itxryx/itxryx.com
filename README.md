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

## デプロイ

GitHub Actions から AWS S3 + CloudFront へデプロイします。設定と実行手順は DEPLOYMENT_MANUAL.md を参照してください。

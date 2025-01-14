# itxryx.com

[https://itxryx.com](https://itxryx.com)

## 開発環境

以下で事前にビルドされた環境が立ち上がります。

[http://localhost:8080](http://localhost:8080)

```
// 全体のビルド
$ docker compose build

// Nginx + Remixの起動
$ docker compose up -d
```

コンテナを立ち上げた状態で以下を実行すると、Remixの開発環境が立ち上がります。

HMRが有効です。

[http://localhost:5173](http://localhost:5173)

```
// bashを立ち上げてコンテナにログイン
$ docker compose exec node bash

// Remixの開発環境の起動
# npm run dev
```

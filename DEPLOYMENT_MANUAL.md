# Deployment Manual

このプロジェクトは、GitHub Actions からのみ AWS S3 + CloudFront へデプロイします。ローカルから Terraform apply や S3 sync は実行しないでください。

## 1. AWS 前提条件

- Route53 に `itxryx.com` の hosted zone が存在していること。
- Route53 に `itxryx.com` / `www.itxryx.com` の既存 A/AAAA レコードがある場合は、Terraform 管理へ import するか、初回 apply 前に整理すること。
- ACM 証明書が `us-east-1` で発行済みであること。
- ACM 証明書が `itxryx.com` と `www.itxryx.com` の両方をカバーしていること。
- GitHub Actions で使う AWS access key には、少なくとも S3、DynamoDB、CloudFront、Route53、ACM 参照、IAM policy document 評価に必要な権限があること。

## 2. GitHub Secrets

Repository secrets に以下を設定してください。

| Name | Value |
| --- | --- |
| `AWS_ACCESS_KEY_ID` | GitHub Actions 用 AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | GitHub Actions 用 AWS secret access key |

ビルド・検証 job には AWS 認証を渡しません。`Deploy Site` が使用する AWS 操作は配信用 S3 の ListBucket・GetObject・PutObject・DeleteObject と、対象 CloudFront の CreateInvalidation・GetInvalidation です。Terraform backend へのアクセスは不要です。現状はインフラ用と同じ Secrets を使用するため、IAM 権限そのものの分離は別途必要です。

## 3. GitHub Variables

Repository variables に以下を設定してください。

| Name | Example | Required |
| --- | --- | --- |
| `AWS_REGION` | `ap-northeast-1` | No |
| `TF_STATE_BUCKET` | `itxryx-com-terraform-state` | Yes |
| `TF_LOCK_TABLE` | `itxryx-com-terraform-locks` | Yes |
| `TF_STATE_KEY` | `itxryx.com/prod/terraform.tfstate` | No |
| `TF_BOOTSTRAP_STATE_KEY` | `itxryx.com/bootstrap/terraform.tfstate` | No（本番 state と別のキー） |
| `DOMAIN_NAME` | `itxryx.com` | No |
| `WWW_DOMAIN_NAME` | `www.itxryx.com` | No |
| `ROUTE53_HOSTED_ZONE_ID` | `Zxxxxxxxxxxxxx` | Yes |
| `ACM_CERTIFICATE_ARN` | `arn:aws:acm:us-east-1:...:certificate/...` | Yes |
| `SITE_BUCKET_NAME` | `itxryx-com-prod-site` | Yes |
| `SITE_DISTRIBUTION_ID` | `E1234567890ABC` | Yes（サイト配信用 CloudFront。www 転送用ではない） |
| `PRODUCTION_DEPLOY_ENABLED` | `true` | No |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Yes（GA4 の計測に必要。実際の測定 ID を設定） |

`TF_STATE_BUCKET` と `SITE_BUCKET_NAME` はグローバルに一意な S3 bucket 名にしてください。

Bootstrap 自身の state は `TF_STATE_BUCKET` 内の `TF_BOOTSTRAP_STATE_KEY` に保存します。本番 state と同じキーは使用できません。保存後はバケット名・リージョン・両 state キー・ロックテーブル名を安易に変更しないでください。変更が必要な場合は既存 state を確認して移行します。IAM policy で state のキーを限定している場合は、Bootstrap 用キーへの読み書きも許可してください。

`PRODUCTION_DEPLOY_ENABLED` は初回の本番インフラ構築と配信先設定が完了するまで未設定または `false` にしてください。`true` にすると、`main` branch への push / merge に対する CI の成功後に `Deploy Site` が公開を実行します。main からの手動実行は、この値に関係なく公開できます。`Terraform Production` の実行条件には影響しません。

`SITE_BUCKET_NAME` と `SITE_DISTRIBUTION_ID` は、Terraform outputs の `site_bucket_name` と `site_distribution_id` に合わせます。インフラ変更で配信先が変わった場合は、サイト公開前に Variables を更新してください。

## 4. Terraform 適用の承認設定

GitHub の Settings → Environments に `terraform-production` を作成し、次を設定してください。

- Deployment branches and tags: `main` branch のみを許可。
- Required reviewers: plan を確認する担当者を登録。

この Environment は `Terraform Production` と `Terraform Bootstrap` の Apply job で共用します。

Environment を YAML に指定するだけでは承認待ちになりません。Required reviewers が未設定の場合、`apply=true` の実行は plan 成功後にそのまま apply に進みます。承認設定を完了するまでは `apply=false` で plan のみ実行してください。Required reviewers の利用可否は GitHub のプランとリポジトリの公開範囲に依存します。

単独運用で自分が実行・承認する場合は Prevent self-review を有効にしないでください。AWS 認証と Terraform の入力値は引き続き Repository secrets / variables を使用し、この Environment には同名の上書き設定を追加しないでください。

公式資料: [Deployment protection rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)。

## 5. Bootstrap の作成・移行・管理

`Terraform Bootstrap` は main からの手動実行専用です。既定の `mode=manage`・`apply=false` は、保存済みの Bootstrap state を使った plan のみ実行します。

| mode | 用途 | state の扱い |
| --- | --- | --- |
| `create` | バケット・ロックテーブルが両方とも未作成の場合 | local backend で作成後、S3 backend に移行 |
| `adopt` | リソースは存在するが元の state が利用できない場合 | 既存の6リソースを import し、S3 に保存 |
| `manage` | Bootstrap state の保存が完了した後 | 保存済み S3 state を使って plan / apply |

いずれも既定では plan のみです。適用する場合は `apply=true` で実行し、その実行の Summary を確認して `terraform-production` を承認します。同じコミット・保存済み plan・Provider lock を使って適用します。plan は1日間保存し、期限切れの場合は新しく実行してください。

### 新規環境

1. `mode=create`・`apply=false` で、新規作成されるリソースを確認します。バケットまたはテーブルが既に存在する場合は停止します。権限エラーも停止し、未作成として扱いません。
2. `mode=create`・`apply=true` で再実行し、今回の plan を確認して承認します。
3. 適用後、local state を復旧用 Artifact に保存し、`terraform init -migrate-state` で Bootstrap 専用の S3 キーへ移行します。既存の移行先 state がある場合は上書きせず停止します。
4. S3 に Bootstrap state が保存されたことと、`mode=manage`・`apply=false` で差分がないことを確認します。
5. 次節の `Terraform Production` で本番インフラを構築します。
6. Terraform outputs の配信先を `SITE_BUCKET_NAME` と `SITE_DISTRIBUTION_ID` に登録します。
7. `Deploy Site` を手動実行して公開を確認し、`PRODUCTION_DEPLOY_ENABLED=true` にします。

### 旧 Workflow で構築済みの環境

1. S3 の Bootstrap 用キー、過去の実行 Artifact、保管済みの `terraform.tfstate` を確認します。旧 Workflow は local state の保存処理を持っていませんでしたが、別途保管した state がないか確認してください。本番用 state は Bootstrap の移行元に使いません。
2. 利用可能な元の state がある場合は、それを保全し、GitHub Actions 上で移行先が空であることを確認して S3 backend へ移行します。二重管理を避けるため、元の state が他で使われている状態で adopt は実行しません。
3. 元の state が利用できず、バケット・テーブルとその設定が既存構成どおりに作成済みなら、`mode=adopt`・`apply=false` で実行します。
4. S3 バケット、Public Access Block、Ownership Controls、Versioning、暗号化設定、DynamoDB テーブルの6リソースの import を確認します。旧構成どおりなら、リソースの新規作成・変更・削除がないことを確認します。設定差分がある場合は適用前に原因を調べます。
5. `mode=adopt`・`apply=true` で実行し、今回の plan を確認して承認します。完了後は `mode=manage` に切り替えます。

adopt の init は既存バケットを使うため、plan-only でも空の backend state が作られる場合があります。import の完了前に manage へ切り替えないでください。manage は state の存在とバケット・テーブルが管理対象に含まれることを確認します。

### 失敗時と保護設定

初回 create の Apply job は、失敗時も存在する local state を `bootstrap-recovery-<run ID>-<attempt>` Artifact に保存します。保存期間は7日です。state には機密情報が含まれる場合があるため、外部共有やコミットはせず、期限内に安全な場所へ保全してください。ランナーの強制終了などで Artifact 自体が保存できない場合もあります。

リソース作成が完了して S3 移行だけが失敗した場合は、移行先 state の有無を先に確認します。保存済みなら manage、未保存なら保全した local state の移行を行います。元の state を利用できない場合に限り adopt で引き継ぎます。作成自体が部分失敗した場合は、state と実リソースを照合して GitHub Actions 上で復旧し、空の state から create を再実行しないでください。

バケットとロックテーブルには `prevent_destroy` を設定しています。Terraform による削除・置換を防ぎますが、AWS コンソールなどからの削除を防ぐ設定ではありません。復旧のために state や lock ファイルを手動編集しないでください。

## 6. 本番インフラの変更

`.github/workflows/terraform-prod.yml` の `Terraform Production` を手動実行します。対象 branch は `main` のみで、それ以外は job がスキップされます。サイトのビルド・配信は実行しません。

1. Terraform の変更を main にマージし、CI の成功を確認します。サイト側も同時に変更する場合は、マージ前に `PRODUCTION_DEPLOY_ENABLED=false` にします。
2. plan のみ確認する場合は、`apply` を未選択（既定値 `false`）で実行します。
3. 適用する場合は、承認設定を確認したうえで `apply=true` で実行します。
4. `Terraform Plan` job が整形検査、init、validate、plan を実行します。Summary に対象コミット SHA と plan が表示されます。
5. 今回の実行の plan を確認し、Review deployments で `terraform-production` を承認します。内容が想定と異なる場合は承認せず実行をキャンセルします。
6. `Terraform Apply` job が同じコミット、保存済み plan、同じ Provider バージョンを使って適用します。配信先などの outputs は job のログに表示されます。
7. 配信先が変わった場合は `SITE_BUCKET_NAME` と `SITE_DISTRIBUTION_ID` を更新します。サイトの更新も必要な場合は `Deploy Site` を実行し、自動公開を停止していた場合は確認後に `PRODUCTION_DEPLOY_ENABLED=true` に戻します。

plan と apply は同じ Workflow 実行内で受け渡します。過去の plan-only 実行をそのまま適用する機能はありません。`apply=true` の実行で生成された plan を改めて確認してください。

plan と Provider lock は Artifact ID を指定して受け渡し、保存期間は1日です。plan には state や機密値が含まれる場合があるため、Artifact を外部へ共有しないでください。期限切れや state 更新によって適用できない場合は、Workflow 全体を新しく実行して plan から確認し直してください。

`Terraform Bootstrap`、`Terraform Production`、`Deploy Site` は共通の concurrency group を使用し、同時に実行しません。承認待ちの間もサイト公開が待機するため、不要な実行はキャンセルしてください。

## 7. サイトの公開

`.github/workflows/deploy-site.yml` の `Deploy Site` を使用します。自動・手動ともに main の最新コミットを対象とし、Terraform は実行しません。

自動公開:

1. main への push で CI が Lint、公開後チェックのテスト、ビルド、Terraform 検証、Workflow 検証を実行します。
2. App job が `out/` をコミット SHA・実行 attempt に対応する Artifact として7日間保存します。
3. CI 全体の成功後、`PRODUCTION_DEPLOY_ENABLED=true` の場合だけ Deploy Site がその CI 実行・同じ SHA の成果物を Artifact ID で取得します。失敗 job のみを再実行した場合は、今回以前の最新 attempt の成果物を使います。再ビルドはしません。PR・fork の実行結果は公開対象外です。

手動公開:

1. GitHub Actions で Deploy Site を選び、branch を main にして実行します。
2. Build and Validate job が同じ CI を呼び出します。全検証に成功した場合だけ、その実行で作った Artifact を公開します。

どちらの場合も、Deploy and Verify job が次の順で処理します。

1. 配信先の Variables と、成果物の index.html・404.html・me.jpeg の存在を確認。
2. 対象コミットが main の最新であることを確認。main が進んでいた場合は公開前に失敗させ、最新の CI 成功または新しい手動実行を待ちます。
3. AWS 認証後、`out/` を S3 に同期。従来どおり `--delete` と `Cache-Control: public, max-age=300` を使用。
4. CloudFront の全パスを無効化し、完了まで待機。
5. `scripts/verify-site.mjs` でトップページ・画像・404 の応答コードと本文が成果物と一致すること、www がパス・クエリを保持して301転送されることを確認。

確認に失敗した場合は Workflow を失敗として扱います。公開済みファイルは自動で切り戻しません。原因を解消して再実行してください。Artifact の保存期限切れの場合は新しい CI または手動実行でビルドし直します。

main への push では CI と Deploy Site の2つの実行が表示されますが、CI の後に公開する関係になり、二重ビルドは発生しません。CI が失敗した場合や自動公開が無効の場合、Deploy Site の job はスキップされます。

### 既存の Deploy Production からの移行

1. マージ前に `PRODUCTION_DEPLOY_ENABLED=false` にします。
2. 過去の Terraform Apply の outputs または AWS CloudFront コンソールでサイト配信用 Distribution ID を確認し、Repository variable の `SITE_DISTRIBUTION_ID` に登録します。`SITE_BUCKET_NAME` も実際の配信先と一致することを確認します。
3. この変更を main にマージし、CI の成功を確認します。旧 deploy-prod.yml は新しい deploy-site.yml に置き換わります。
4. Deploy Site を main から手動実行し、公開後チェックの成功を確認します。
5. `PRODUCTION_DEPLOY_ENABLED=true` に戻します。

GA4 の測定 ID は CI のビルド時に埋め込みます。ID を変更した場合は、古い Artifact を再配信せず、新しい CI または手動実行で再ビルドしてください。

## 8. 確認項目

- `https://itxryx.com/` が表示されること。
- `https://www.itxryx.com/` が `https://itxryx.com/` に 301 redirect されること。
- `https://itxryx.com/me.jpeg` などの静的アセットが表示されること。
- 存在しない URL が 404 として扱われること。

## 9. Google Analytics 4

本番デプロイでは GitHub Variables の `NEXT_PUBLIC_GA_MEASUREMENT_ID` を使用します。次の手順で実際の測定 ID を登録してください。登録済みの場合は再登録不要です。

1. Google Analytics で対象の GA4 プロパティと `https://itxryx.com` のウェブデータストリームを用意します。
2. 管理画面の「データ ストリーム」から対象ストリームを開き、`G-` で始まる測定 ID をコピーします。
3. GitHub の Settings → Secrets and variables → Actions → Variables に、`NEXT_PUBLIC_GA_MEASUREMENT_ID` を登録します。測定 ID は公開される識別子です。
4. `Deploy Site` workflow で再ビルド・デプロイします。ID はビルド時に静的ファイルへ埋め込まれるため、登録・変更時も再デプロイが必要です。
5. 本番サイトを開き、Google Analytics のリアルタイムレポートでアクセスを確認します。ブラウザーの Network でも `gtag/js` の読み込みと `g/collect` の送信を確認できます。

ci.yml の既定値 `G-XXXXXXXXXX` はプレイスホルダーです。変数が未設定または空の場合はこの値でタグが生成され、ビルドも成功しますが、対象の GA4 プロパティでは計測できません。

ローカルで測定 ID を指定せずにビルドした場合、および `pnpm run dev` では計測タグを出力しません。設定値が `G-` と半角英大文字・数字の形式でない場合はエラーになります。

本番の計測を停止する場合は、ci.yml のフォールバック `|| 'G-XXXXXXXXXX'` と GitHub Variables の測定 ID を両方削除して再ビルド・デプロイします。変数の削除だけではタグは無効になりません。

ページ表示は Google タグの自動計測を使用します。手動の `page_view` 送信を追加すると二重計測になるため、追加しないでください。

公式資料: [測定 ID の確認](https://support.google.com/analytics/answer/9539598?hl=ja)、[ページビューの計測](https://developers.google.com/analytics/devguides/collection/ga4/views)。

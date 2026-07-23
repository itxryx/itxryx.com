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

## 3. GitHub Variables

Repository variables に以下を設定してください。

| Name | Example | Required |
| --- | --- | --- |
| `AWS_REGION` | `ap-northeast-1` | No |
| `TF_STATE_BUCKET` | `itxryx-com-terraform-state` | Yes |
| `TF_LOCK_TABLE` | `itxryx-com-terraform-locks` | Yes |
| `TF_STATE_KEY` | `itxryx.com/prod/terraform.tfstate` | No |
| `DOMAIN_NAME` | `itxryx.com` | No |
| `WWW_DOMAIN_NAME` | `www.itxryx.com` | No |
| `ROUTE53_HOSTED_ZONE_ID` | `Zxxxxxxxxxxxxx` | Yes |
| `ACM_CERTIFICATE_ARN` | `arn:aws:acm:us-east-1:...:certificate/...` | Yes |
| `SITE_BUCKET_NAME` | `itxryx-com-prod-site` | Yes |
| `PRODUCTION_DEPLOY_ENABLED` | `true` | No |

`TF_STATE_BUCKET` と `SITE_BUCKET_NAME` はグローバルに一意な S3 bucket 名にしてください。

`PRODUCTION_DEPLOY_ENABLED` は初回 bootstrap が完了するまで未設定または `false` にしてください。`true` にすると、`main` branch への push / merge で `Deploy Production` workflow が自動実行されます。手動実行の場合は、この値に関係なく `Deploy Production` workflow を実行できます。

## 4. 初回 Bootstrap

1. GitHub Actions の `Terraform Bootstrap` workflow を手動実行します。
2. `TF_STATE_BUCKET` の S3 bucket と `TF_LOCK_TABLE` の DynamoDB table が作成されたことを確認します。
3. Repository variable の `PRODUCTION_DEPLOY_ENABLED` を `true` にします。
4. この workflow は初回作成用です。作成後に繰り返し実行すると、既存リソースとの競合で失敗する可能性があります。

## 5. 本番 Deploy

以下のどちらかで `Deploy Production` workflow が実行されます。

- GitHub Actions 画面から手動実行する。
- `main` branch へ merge または push する。

workflow は次の順で実行します。

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. Terraform init / validate / plan / apply
5. `out/` を S3 bucket へ sync
6. `itxryx.com` の CloudFront distribution を invalidation

## 6. 確認項目

- `https://itxryx.com/` が表示されること。
- `https://www.itxryx.com/` が `https://itxryx.com/` に 301 redirect されること。
- `https://itxryx.com/me.jpeg` などの静的アセットが表示されること。
- 存在しない URL が 404 として扱われること。

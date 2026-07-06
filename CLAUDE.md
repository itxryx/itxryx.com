# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Architecture Notes

This is a static personal portfolio site (`itxryx.com`) with two independent parts: a Next.js static export app and Terraform-managed AWS infrastructure that serves it. They only connect at deploy time — the CI workflow builds the app into `out/` and syncs it into the S3 bucket that Terraform provisions.

### App

The entire UI lives in `src/app/page.tsx` as a single-page composition of local, unexported components (`Profile`, `LinkSection`, `SiteFooter`). `current-year.tsx` and `noise-background.tsx` are the only extracted components, both client components (`"use client"`) because they depend on browser APIs (`Date`, `canvas`/`window`) that would break static export if rendered at build time. When adding new interactive pieces, follow this pattern: keep server-renderable content inline in `page.tsx`, and only pull something into its own `"use client"` file when it genuinely needs a browser API or hook.

### Infrastructure (`terraform/`)

Three layers, applied in order and never by hand — only via GitHub Actions:

1. `terraform/bootstrap/` — one-time creation of the S3 bucket + DynamoDB table used as remote state backend for everything else. Run once via the `Terraform Bootstrap` workflow.
2. `terraform/environments/prod/` — the root module for production. Wires together the two reusable modules below and attaches the S3 bucket policy that allows CloudFront (only, via `AWS:SourceArn` condition) to read site objects.
3. `terraform/modules/static_site/` and `terraform/modules/www_redirect/` — reusable modules. `static_site` provisions the S3 bucket + CloudFront distribution for `itxryx.com`. `www_redirect` provisions a separate CloudFront distribution that 301-redirects `www.itxryx.com` to the apex domain.

Both the S3 backend config and Terraform input variables are injected entirely from GitHub Actions repository variables/secrets at workflow runtime (see `env:` blocks in `.github/workflows/*.yml`) — there is no `.tfvars` file in the repo. `DEPLOYMENT_MANUAL.md` documents the required secrets/variables and the full bootstrap/deploy runbook in Japanese.

### Deploy flow (`.github/workflows/deploy-prod.yml`)

Triggered on push to `main` (gated by the `PRODUCTION_DEPLOY_ENABLED` repo variable) or manual dispatch: `npm ci` → `npm run lint` → `npm run build` → `terraform plan`/`apply` in `terraform/environments/prod` → `aws s3 sync out/` → CloudFront invalidation. Do not attempt to replicate this locally against real AWS resources.

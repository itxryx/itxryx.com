# itxryx.com

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router 7 (SPA mode)
- **Analytics**: Google Analytics
- **Infrastructure**: AWS (S3 + CloudFront)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 24.12.0 (managed by [mise](https://mise.jdx.dev/))
- AWS CLI (for infrastructure management)
- Terraform (for infrastructure provisioning)

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Edit .env and set your Google Analytics tracking ID (optional for development)
# VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

## Development

```bash
# Start development server (http://localhost:5173)
# Accessible via network as well
npm run dev

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Infrastructure

インフラは Terraform で管理されています。詳細は[terraform/](./terraform/)ディレクトリを参照してください。

### Setup Infrastructure

```bash
cd terraform

# Create terraform.tfvars and set your ACM certificate ARN
# acm_certificate_arn = "arn:aws:acm:us-east-1:XXXXXXXXXXXX:certificate/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"

# Initialize Terraform
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply
```

## Deployment

main ブランチへの push で自動的にビルド・デプロイが実行されます。

### Required GitHub Secrets

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_GA_TRACKING_ID`

### Deployment Workflow

1. Lint checks
2. Build application
3. Sync to S3 (with appropriate cache headers)
4. Invalidate CloudFront cache

## Architecture

- **S3**: Static file hosting (public access blocked, OAC enabled)
- **CloudFront**: CDN with custom domain support
- **CloudFront Function**: www → non-www redirect (301)
- **ACM**: SSL/TLS certificate (us-east-1)
- **Cache Strategy**:
  - Static assets (JS/CSS/images): `max-age=31536000` (1 year)
  - index.html/JSON files: `no-cache`
- **SPA Support**: 403/404 errors return index.html

## Project Structure

```
src/
├── components/     # React components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
└── types/          # TypeScript type definitions
```

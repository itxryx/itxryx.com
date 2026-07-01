# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 portfolio project using the App Router and `src/` layout. Application routes live in `src/app/`; the main page is `src/app/page.tsx`, shared document metadata and layout are in `src/app/layout.tsx`, and global styles are in `src/app/globals.css`. Small page-local components currently live beside the route in `src/app/`, such as `current-year.tsx` and `noise-background.tsx`. Static assets belong in `public/` and are served from the site root, for example `public/me.jpeg` is available as `/me.jpeg`.

Infrastructure as code lives in `terraform/`: `terraform/bootstrap/` creates the remote state resources, `terraform/environments/prod/` is the production root module, and reusable modules live in `terraform/modules/`. GitHub Actions workflows live in `.github/workflows/`. DevContainer configuration is in `.devcontainer/` and uses Node 24. Keep generated folders such as `node_modules/`, `.next/`, and `out/` out of version control.

## Build, Test, and Development Commands

- `npm run dev`: start the local Next.js development server on port `3000`.
- `npm run build`: build the site. Because `next.config.ts` sets `output: "export"`, this emits static assets to `out/`.
- `npm run lint`: run Biome checks for formatting and lint issues.
- `npm run lint:fix`: run Biome checks and apply safe fixes.
- `npm run format`: format files with Biome.

`npm run start` currently runs `next start`, which is not the normal serving path for static export output. Prefer serving the generated `out/` directory when validating production static output.

Terraform apply and production deploys are intended to run only from GitHub Actions. Do not deploy from a local shell; use `Terraform Bootstrap` once for remote state setup and `Deploy Production` for production changes.

## Coding Style & Naming Conventions

Use TypeScript, React 19, and the Next.js App Router conventions. Components and layouts use PascalCase exports where named; route files follow Next.js filenames such as `page.tsx`, `layout.tsx`, and `not-found.tsx`. Use the `@/*` alias for imports from `src/`.

Biome is the formatter and linter. It uses two-space indentation, recommended React and Next.js rules, and import organization. Styling uses Tailwind CSS v4 through `@tailwindcss/postcss`, with global theme tokens in `src/app/globals.css`.

## Static Site Generation Guidelines

This project targets static export. Do not add runtime-only features unless the deployment model changes. Avoid `cookies()`, `headers()`, Server Actions, ISR, request-dependent Route Handlers, and dynamic routes without `generateStaticParams()`. `next.config.ts` already sets `images.unoptimized: true`; prefer static files from `public/` for image assets.

## Testing Guidelines

No test framework is configured yet. When adding behavior with meaningful logic, add a focused test runner such as Vitest for unit tests or Playwright for browser flows. Name tests by behavior, for example `renders-profile-links.test.tsx`.

## Commit & Pull Request Guidelines

Use short, imperative commit messages such as `Add portfolio shell` or `Configure static export`. Pull requests should include a concise summary, verification commands run, and screenshots for visual changes.

## Agent-Specific Instructions

Before editing Next.js code, check the installed version and prefer local docs or current project conventions over assumptions. Do not overwrite user changes. Keep changes narrow, update this guide when tooling or structure changes, and run `npm run lint` plus `npm run build` when available. If working outside the DevContainer, first confirm that `node` and `npm` are available.

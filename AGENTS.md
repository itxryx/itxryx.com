# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js portfolio project using the App Router and `src/` layout. Application routes live in `src/app/`; the main page is `src/app/page.tsx`, shared document metadata and layout are in `src/app/layout.tsx`, and global styles are in `src/app/globals.css`. Static assets belong in `public/` and are served from the site root, for example `public/next.svg` is available as `/next.svg`.

DevContainer configuration is in `.devcontainer/`. Keep generated folders such as `node_modules/`, `.next/`, and `out/` out of version control.

## Build, Test, and Development Commands

- `npm run dev`: start the local Next.js development server on port `3000`.
- `npm run build`: build the site. Because `next.config.ts` sets `output: "export"`, this emits static assets to `out/`.
- `npm run lint`: run Biome checks for formatting and lint issues.
- `npm run format`: format files with Biome.

`npm run start` currently runs `next start`, which is not the normal serving path for static export output. Prefer serving the generated `out/` directory when validating production static output.

## Coding Style & Naming Conventions

Use TypeScript, React, and the Next.js App Router conventions. Components and layouts use PascalCase exports where named; route files follow Next.js filenames such as `page.tsx`, `layout.tsx`, and `not-found.tsx`. Use the `@/*` alias for imports from `src/`.

Biome is the formatter and linter. It uses two-space indentation, recommended React and Next.js rules, and import organization.

## Static Site Generation Guidelines

This project targets static export. Do not add runtime-only features unless the deployment model changes. Avoid `cookies()`, `headers()`, Server Actions, ISR, request-dependent Route Handlers, and dynamic routes without `generateStaticParams()`. For image handling, remember that static export may require unoptimized images or static files from `public/`.

## Testing Guidelines

No test framework is configured yet. When adding behavior with meaningful logic, add a focused test runner such as Vitest for unit tests or Playwright for browser flows. Name tests by behavior, for example `renders-profile-links.test.tsx`.

## Commit & Pull Request Guidelines

Use short, imperative commit messages such as `Add portfolio shell` or `Configure static export`. Pull requests should include a concise summary, verification commands run, and screenshots for visual changes.

## Agent-Specific Instructions

Before editing Next.js code, check the installed version and prefer local docs or current project conventions over assumptions. Do not overwrite user changes. Keep changes narrow, update this guide when tooling or structure changes, and run `npm run lint` plus `npm run build` when available.

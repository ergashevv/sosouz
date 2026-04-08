# soso

AI-powered platform for discovering, comparing, and shortlisting universities for studying abroad.

[![CI](https://github.com/ergashevv/sosouz/actions/workflows/ci.yml/badge.svg)](https://github.com/ergashevv/sosouz/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## Overview

`soso` helps students move faster from search to decision by combining:

- university discovery and country-based filtering,
- AI-assisted chat guidance,
- ranked/top university experiences,
- multilingual UX (English, Uzbek, Russian).

## Core Features

- **University discovery** with country and query-based filtering.
- **AI advisor chat** for study-abroad related guidance.
- **Conversation and message APIs** for chat persistence.
- **Top university/ranking views** with background sync endpoints.
- **User auth + sessions** with PostgreSQL-backed persistence.
- **Multilingual interface** (`en`, `uz`, `ru`).

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** PostgreSQL + Prisma
- **Styling/UI:** Tailwind CSS 4, Framer Motion, Lucide
- **AI:** Google Gemini API (`@google/generative-ai`)
- **Data integrations:** Serper, YouTube Data API (optional)
- **Deployment:** Vercel

## Project Structure

```text
src/
  app/                 # App Router pages and API routes
  components/          # UI components and chat workspace
  lib/                 # AI logic, API clients, utilities, i18n
prisma/
  schema.prisma        # Database schema
scripts/               # Operational and data sync scripts
docs/                  # Internal setup journals and notes
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` in project root and set required values.

3. Generate Prisma client and sync schema:

   ```bash
   npm run db:push
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Set these in `.env` (and production environment settings).

### Required

- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Gemini API key

### Recommended

- `GEMINI_MODEL`: Gemini model name (default in code: `gemini-2.5-flash`)
- `SITE_URL`: Canonical backend/site URL
- `NEXT_PUBLIC_SITE_URL`: Public app URL
- `NEXT_PUBLIC_APP_URL`: Alternative public URL

### Optional Integrations

- `SERPER_API_KEY`: Search enrichment for rankings/research logic
- `YOUTUBE_DATA_API_KEY`: YouTube channel/content enrichment
- `NEXT_PUBLIC_GTM_ID`: Google Tag Manager container id
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics 4 measurement id (`G-...`) when GTM is not used
- `GOOGLE_CLIENT_ID`: Google OAuth client id (for "Continue with Google")
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `CRON_SECRET`: Protect scheduled sync endpoints
- `NEXT_PUBLIC_CONTACT_EMAIL`: Public contact email override
- `NEXT_PUBLIC_LOCAL_COUNTRY`: Default local country label

### Optional Tuning

- `ADVISOR_MAX_PROMPT_UNIVERSITIES`
- `ADVISOR_MAX_MESSAGE_CHARS`
- `GEMINI_RETRY_MAX`
- `GEMINI_FALLBACK_MODELS`
- `COUNTRY_RANKING_BATCH_SIZE`
- `COUNTRY_RANKING_API_PREFETCH_BATCHES`
- `RANKING_SOURCE_EXCERPT_MAX_CHARS`
- `RESEARCH_REFRESH_COOLDOWN_MS`

## Database Notes

- Prisma client is generated automatically on install via `postinstall`.
- For first-time local setup, `npm run db:push` is the fastest path.
- For managed environments, use `npm run db:migrate`.

## Available Scripts

- `npm run dev` - start local development server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run db:migrate` - apply Prisma migrations (deploy flow)
- `npm run db:push` - push schema to database
- `npm run db:baseline` - mark baseline migration as applied
- `npm run db:sync-migration-checksums` - sync migration checksums
- `npm run db:sync-nuu-tuition` - run tuition sync script

## Deployment

Primary target: **Vercel**.

- Connect repository to Vercel.
- Set all required environment variables.
- Ensure production `DATABASE_URL` is configured.
- Run migration strategy (`db:migrate`) as part of deployment/release flow.

Live URL: [sosouz.vercel.app](https://sosouz.vercel.app)

## Repository Standards

This repository follows standard open-source and engineering governance files:

- `LICENSE` - legal usage terms (MIT)
- `SECURITY.md` - private vulnerability reporting process
- `CONTRIBUTING.md` - contribution and quality workflow
- `CODE_OF_CONDUCT.md` - community behavior expectations
- `.github/ISSUE_TEMPLATE` - structured bug/feature intake
- `.github/pull_request_template.md` - consistent PR quality checks
- `.github/workflows/ci.yml` - automated lint/build verification
- `docs/product-focus-plan.md` - differentiation, funnel, monetization focus, and data moat plan

## Security

- Never commit `.env` or secret keys.
- Rotate API keys immediately if exposed.
- Keep `CRON_SECRET` set for any scheduled API endpoints.

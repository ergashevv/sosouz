# Contributing to soso

Thanks for your interest in improving `soso`.
This document explains the expected workflow and quality bar for contributions.

## Ground Rules

- Be respectful and follow `CODE_OF_CONDUCT.md`.
- Open an issue before large changes.
- Keep pull requests small, focused, and reviewable.
- Do not commit secrets or private operational data.

## Development Setup

1. Fork and clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure `.env` (see `README.md` for required variables).
4. Prepare database schema:

   ```bash
   npm run db:push
   ```

5. Start local development:

   ```bash
   npm run dev
   ```

## Branching and Commits

- Use a dedicated branch per change:
  - `feat/<short-description>`
  - `fix/<short-description>`
  - `docs/<short-description>`
- Use clear commit messages in imperative mood:
  - `feat(chat): improve advisor response fallback`
  - `fix(api): validate missing conversation id`

## Pull Request Checklist

Before opening a PR:

- [ ] Code builds and runs locally.
- [ ] `npm run lint` passes.
- [ ] New behavior is documented in `README.md` or relevant docs.
- [ ] No secrets are added to the repository.
- [ ] API behavior changes include clear migration/rollout notes.

## Reporting Bugs

Please use the issue templates and include:

- expected behavior,
- actual behavior,
- reproduction steps,
- environment details (OS, browser, Node version),
- logs/screenshots where relevant.

## Feature Requests

For feature ideas, include:

- the user problem,
- why current behavior is insufficient,
- a proposed UX or API direction,
- alternatives considered.

## Security Issues

Do not open public issues for sensitive vulnerabilities.
Please report privately via `SECURITY.md`.

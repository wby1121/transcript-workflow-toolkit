# Contributing

Thanks for considering contributing to Transcript Workflow Toolkit.

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/transcript-workflow-toolkit.git
cd transcript-workflow-toolkit
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

## Project Principles

1. **7-day ship rule** — Any feature that can't ship in 7 days gets cut from scope.
2. **Zero external services** — No databases, no caches, no queues. Everything is self-contained.
3. **Graduated complexity** — Start simple, upgrade only when data proves the need.
4. **One person must be able to maintain this** — No microservices, no distributed systems.

## Before Submitting

- Run `pnpm lint` and fix any issues
- Test the full flow: URL input → transcript → AI → export
- Make sure SEO pages render correctly
- Keep the README up to date if you add features

## Pull Request Process

1. Fork and create a feature branch
2. Make your changes
3. Open a PR with a clear description
4. Keep PRs small and focused — one feature per PR

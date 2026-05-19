# Transcript Workflow Toolkit

<p align="center">
  <strong>YouTube video → Searchable text + AI summary → Export anywhere.</strong>
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick Start</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#one-click-deploy"><strong>Deploy</strong></a> ·
  <a href="#architecture"><strong>Architecture</strong></a> ·
  <a href="#api"><strong>API</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## What is this?

A **self-hosted**, **SEO-optimized** tool that extracts YouTube video transcripts with timestamps, cleans them with AI, and exports to Markdown, TXT, or clipboard. Built for solo developers who want a tool that actually ships.

**Not** an AI workspace. **Not** a SaaS platform. **Not** a Notion competitor.

Just one thing, done well: `video URL → transcript → export`.

## Features

- **Instant transcript extraction** — Paste any YouTube URL, get timestamped text
- **AI cleaning** — Remove filler words, generate summaries, extract key topics and FAQ (DeepSeek V4)
- **Rule-engine fallback** — Works without AI keys. Regex-based cleaning always runs.
- **Multiple exports** — Markdown (Obsidian-ready), plain text, clipboard
- **SEO pages** — Every transcript becomes a Google-indexable page with unique AI content
- **Local workspace** — Transcript history saved in your browser. No accounts, no cloud sync.
- **Internal dashboard** — Built-in analytics: requests, exports, search queries, error rates
- **Async provider chain** — YouTube API v3 → yt-dlp fallback. Handles API failures gracefully.
- **Rate limiting** — Per-IP sliding window. No crawler abuse.
- **Sentry integration** — Optional error tracking. One env var to enable.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/transcript-workflow-toolkit.git
cd transcript-workflow-toolkit

# 2. Install
pnpm install

# 3. Configure
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local — add your DeepSeek API key (optional) and/or YouTube API key

# 4. Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Paste a YouTube URL. Done.

**Minimum config**: Nothing. Works with zero API keys using yt-dlp.
**Recommended**: Add `DEEPSEEK_API_KEY` for AI features (summary, topics, FAQ).
**Optional**: Add `YOUTUBE_API_KEY` for faster transcript fetching.

## One-Click Deploy

### Docker

```bash
# Build and run
docker-compose up -d

# Or manual build
pnpm docker:build
docker run -p 3000:3000 \
  -e DEEPSEEK_API_KEY=sk-xxx \
  -e YOUTUBE_API_KEY=xxx \
  -v $(pwd)/data:/app/data \
  transcript-toolkit
```

### VPS (Tencent Cloud / AWS / any 2C2G)

```bash
# On your server
git clone https://github.com/YOUR_USERNAME/transcript-workflow-toolkit.git
cd transcript-workflow-toolkit
cp .env.example apps/web/.env.local
nano apps/web/.env.local  # Add your API keys
docker-compose up -d
```

That's it. Port 3000, no database to provision, no Redis, no microservices.

## Architecture

```
User: "Paste YouTube URL"
          │
          ▼
┌────────────────────┐
│  Next.js API Route │  POST /api/transcript
│  (synchronous)     │──────────────────────┐
└────────────────────┘                      │
                                            ▼
                              ┌─────────────────────────┐
                              │  Provider Chain          │
                              │  1. YouTube Data API v3  │
                              │  2. yt-dlp (fallback)    │
                              └───────────┬─────────────┘
                                          │
                                          ▼
                              ┌─────────────────────────┐
                              │  Parser (SRT/VTT/XML)   │
                              │  → TranscriptSegment[]  │
                              └───────────┬─────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │  JSON Store  │    │  Rule Engine │    │  DeepSeek AI │
            │  (SQLite API)│    │  (fillers)   │    │  (summary,   │
            │              │    │              │    │   topics,FAQ)│
            └──────────────┘    └──────────────┘    └──────────────┘
                    │                     │                     │
                    └─────────────────────┼─────────────────────┘
                                          ▼
                              ┌─────────────────────────┐
                              │  Response:              │
                              │  { transcript,          │
                              │    variants, seo }      │
                              └─────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              Export MD/TXT        AI Summary tab         SEO Page
              (client Blob)        (DeepSeek)       /youtube-transcript/[slug]
```

### Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 App Router | SSR, SEO, file-based routing |
| Language | TypeScript | Type safety, solo maintainer |
| UI | Tailwind CSS + shadcn/ui | Accessible, fast to build |
| Storage | JSON file store | Zero dependencies, SQLite-compatible API |
| Transcript | yt-dlp + YouTube API v3 | Industry standard, failover chain |
| AI | DeepSeek V4 (Anthropic-compatible) | Cost-effective chunk processing |
| Deployment | Docker | One command, anywhere |
| Analytics | Built-in (SQL) | No GA4, no Mixpanel, no external deps |
| Errors | Sentry (optional) | One env var, no code changes |

### Database (JSON file store)

Six "tables" stored in a single JSON file at `data/transcripts.db`:

| Table | Purpose |
|-------|---------|
| `transcripts` | Core transcript data (video_id, title, segments, etc.) |
| `transcript_variants` | One-to-many: raw, cleaned, summary, topics, headings, faq |
| `seo_content` | Per-video SEO metadata (summary, keywords, FAQ, slug) |
| `analytics_events` | Event sourcing: every user action tracked |
| `search_queries` | Referrer keyword extraction for SEO feedback loop |
| `error_log` | Every provider failure with stderr, duration, and context |

Zero-infrastructure. The JSON store implements a SQLite-compatible query API (`prepare().run().get().all()`) so you can swap in real SQLite with one file change when you outgrow it.

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/transcript` | Fetch transcript for a YouTube URL |
| `GET` | `/api/transcript/:videoId` | Get cached transcript |
| `POST` | `/api/transcript/clean` | Generate AI summary, topics, headings, FAQ |
| `GET` | `/api/export?videoId=&format=` | Server-side export (for long transcripts) |
| `POST` | `/api/analytics/events` | Client-side event logging |
| `GET` | `/api/debug` | System health: yt-dlp, DeepSeek, YouTube API status |
| `GET` | `/api/internal/stats` | Internal dashboard data |
| `GET` | `/sitemap.xml` | Dynamic sitemap (auto-generated from cached transcripts) |

## Project Structure

```
transcript-workflow-toolkit/
├── apps/web/                    # Next.js 14 App Router
│   └── src/
│       ├── app/                 # Pages + API routes
│       │   ├── page.tsx         # Landing page
│       │   ├── youtube-transcript/
│       │   │   ├── page.tsx     # Tool page (SPA)
│       │   │   └── [slug]/      # Programmatic SEO pages (SSR)
│       │   ├── internal/        # Built-in analytics dashboard
│       │   └── api/             # All API routes
│       ├── components/          # React components
│       ├── hooks/               # Custom hooks
│       ├── lib/                 # Business logic
│       │   ├── ai/              # DeepSeek client + generators
│       │   ├── transcript/      # Parser + cleaner
│       │   └── db.ts            # JSON file store (SQLite-compatible)
│       ├── providers/           # YouTube API + yt-dlp
│       └── types/               # TypeScript interfaces
├── packages/shared/             # Shared types (for future Chrome extension)
├── docs/                        # PRD, architecture, data flow
├── Dockerfile                   # Multi-stage production build
├── docker-compose.yml           # One-command deploy
└── .env.example                 # All env vars documented
```

## Why This Project?

### What it is NOT
- ❌ Not a SaaS (no accounts, no payments, no cloud)
- ❌ Not an AI workspace (no chat, no RAG, no agents)
- ❌ Not a Notion/Obsidian competitor
- ❌ No microservices, Redis, Kafka, Kubernetes

### What it IS
- ✅ A focused tool that does one thing well
- ✅ SEO-optimized for organic traffic growth
- ✅ One person can maintain indefinitely
- ✅ Deploy anywhere with Docker. Zero external services.
- ✅ Graduated complexity: JSON store → real SQLite → PostgreSQL only when needed

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

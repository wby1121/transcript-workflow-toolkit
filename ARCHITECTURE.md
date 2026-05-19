# Architecture & Project Structure (v3 — Production Ready)

## Monorepo Layout

```
transcript-workflow-toolkit/
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── tsconfig.base.json
├── .env.example
├── .env.local                      # Actual secrets (gitignored)
├── .gitignore
├── docker-compose.yml              # app + umami + nginx
├── Dockerfile                      # Multi-stage: Node 20 + Python 3 + yt-dlp
│
├── docs/
│   ├── PRD.md
│   ├── SITEMAP.md
│   ├── DATA_FLOW.md
│   └── ARCHITECTURE.md
│
├── apps/
│   └── web/                        # Next.js 14 App Router
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── components.json
│       ├── sentry.client.config.ts
│       ├── sentry.server.config.ts
│       │
│       ├── src/
│       │   ├── middleware.ts           # Rate limiter (per-IP, in-memory)
│       │   │
│       │   ├── app/
│       │   │   ├── layout.tsx          # Root layout + Umami script + metadata
│       │   │   ├── page.tsx            # Landing page (SSG)
│       │   │   ├── not-found.tsx
│       │   │   ├── error.tsx           # Global error boundary
│       │   │   ├── robots.ts
│       │   │   ├── sitemap.ts          # Dynamic sitemap
│       │   │   │
│       │   │   ├── youtube-transcript/
│       │   │   │   ├── page.tsx        # Tool page (client-heavy)
│       │   │   │   └── [slug]/
│       │   │   │       └── page.tsx    # SEO page (SSR, with SEO content layer)
│       │   │   │
│       │   │   ├── tiktok-transcript/
│       │   │   │   └── page.tsx        # Coming soon
│       │   │   │
│       │   │   ├── video-to-markdown/
│       │   │   │   └── page.tsx        # SEO keyword alias
│       │   │   │
│       │   │   └── api/
│       │   │       ├── transcript/
│       │   │       │   ├── route.ts    # POST (job creator — async, no await)
│       │   │       │   ├── clean/
│       │   │       │   │   └── route.ts # POST (rule engine + AI chunk)
│       │   │       │   └── [videoId]/
│       │   │       │       └── route.ts # GET (cached transcript + variants)
│       │   │       │
│       │   │       ├── jobs/
│       │   │       │   ├── [jobId]/
│       │   │       │   │   ├── route.ts   # GET (poll status)
│       │   │       │   │   └── retry/
│       │   │       │   │       └── route.ts # POST (retry failed)
│       │   │       │   └── stats/
│       │   │       │       └── route.ts   # GET (health check)
│       │   │       │
│       │   │       ├── export/
│       │   │       │   └── route.ts   # GET (server-side stream for long transcripts)
│       │   │       │
│       │   │       └── analytics/
│       │   │           └── events/
│       │   │               └── route.ts # POST (client-side event logging)
│       │   │
│       │   ├── components/
│       │   │   ├── ui/                     # shadcn/ui
│       │   │   │   ├── button.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── badge.tsx
│       │   │   │   ├── tabs.tsx
│       │   │   │   ├── toggle.tsx
│       │   │   │   ├── dropdown-menu.tsx
│       │   │   │   ├── toast.tsx
│       │   │   │   ├── skeleton.tsx
│       │   │   │   ├── separator.tsx
│       │   │   │   └── tooltip.tsx
│       │   │   │
│       │   │   ├── UrlInput.tsx             # URL input + validation + submit
│       │   │   ├── JobStatusIndicator.tsx   # Polling UI: "Fetching via {provider}..."
│       │   │   ├── TranscriptViewer.tsx     # Renders transcript with timestamps
│       │   │   ├── TranscriptLine.tsx       # [00:24] text
│       │   │   ├── TabBar.tsx               # Raw / Cleaned / Summary tabs
│       │   │   ├── SummaryCard.tsx          # AI summary + key topics
│       │   │   ├── FaqSection.tsx           # AI-generated FAQ
│       │   │   ├── ExportBar.tsx            # MD / TXT / Copy buttons
│       │   │   ├── VideoInfo.tsx            # Thumbnail, title, channel, duration
│       │   │   ├── LoadingSkeleton.tsx
│       │   │   ├── ErrorDisplay.tsx         # Error + retry
│       │   │   ├── EmptyState.tsx           # Before first input
│       │   │   ├── RecentHistory.tsx        # Local Workspace sidebar
│       │   │   ├── RateLimitWarning.tsx     # 429 warning banner
│       │   │   └── SEOContent.tsx           # Static SEO text at page bottom
│       │   │
│       │   ├── providers/                   # Provider abstraction layer
│       │   │   ├── interface.ts             # TranscriptProvider interface
│       │   │   ├── registry.ts              # Provider registry + chain runner
│       │   │   ├── youtube-api.ts           # YouTube Data API v3 provider
│       │   │   └── yt-dlp.ts                # yt-dlp provider
│       │   │
│       │   ├── lib/
│       │   │   ├── db.ts                    # SQLite connection singleton
│       │   │   ├── db-init.ts               # CREATE TABLE IF NOT EXISTS (all tables)
│       │   │   ├── rate-limiter.ts          # In-memory sliding window rate limiter
│       │   │   ├── transcript/
│       │   │   │   ├── parser.ts            # Parse XML/SRT/VTT → JSON
│       │   │   │   └── cleaner.ts           # Rule-engine cleaning (regex)
│       │   │   ├── ai/
│       │   │   │   ├── client.ts            # DeepSeek client (Anthropic-compatible)
│       │   │   │   ├── summary.ts           # Summary generator (chunk-based)
│       │   │   │   ├── topics.ts            # Key topic extractor
│       │   │   │   ├── headings.ts          # Section heading generator
│       │   │   │   └── faq.ts               # FAQ extractor
│       │   │   ├── queue/
│       │   │   │   ├── job-creator.ts       # Create job, return jobId
│       │   │   │   ├── job-worker.ts        # Async worker: provider chain → save → AI → done
│       │   │   │   ├── job-poller.ts        # Client-side polling hook
│       │   │   │   └── job-cleanup.ts       # Stale job reaper
│       │   │   ├── variants.ts              # CRUD for transcript_variants table
│       │   │   ├── seo.ts                   # SEO content generation + seo_content table
│       │   │   ├── analytics.ts             # analytics_events + search_queries logging
│       │   │   ├── cache.ts                 # Transcript cache operations
│       │   │   ├── export.ts                # MD/TXT generation + server-side streaming
│       │   │   ├── workspace.ts             # IndexedDB wrapper (idb-keyval)
│       │   │   └── utils.ts                 # URL parsing, slug gen, IP hashing
│       │   │
│       │   ├── hooks/
│       │   │   ├── useTranscript.ts         # Main: submit URL → poll job → result
│       │   │   ├── useJobPolling.ts         # Poll job status
│       │   │   ├── useLocalWorkspace.ts     # Read/write IndexedDB
│       │   │   ├── useCopyToClipboard.ts    # Copy with toast
│       │   │   └── useAnalytics.ts          # Fire-and-forget event logging
│       │   │
│       │   ├── types/
│       │   │   └── index.ts                 # All TypeScript interfaces
│       │   │
│       │   └── styles/
│       │       └── globals.css
│       │
│       └── public/
│           ├── favicon.ico
│           ├── og-image.png
│           └── robots.txt
│
├── packages/
│   └── shared/
│       ├── package.json
│       └── src/
│           ├── types.ts
│           └── constants.ts
│
├── chrome-extension/                # Month 2+ placeholder
│   └── README.md
│
└── data/                            # SQLite DB files (docker volume)
    └── .gitkeep
```

## Key Architecture Decisions (v3)

### 1. Provider Layer (NEW in v3)

Every transcript source implements `TranscriptProvider`. The registry runs providers in priority order. yt-dlp is NOT the main flow — it's a fallback provider.

```typescript
interface TranscriptProvider {
  name: string;
  priority: number;
  fetch(videoId: string): Promise<TranscriptResult>;
  isAvailable(): Promise<boolean>;
}
```

This solves: TikTok later, new YouTube API versions, and testing (mock provider).

### 2. Async Job Queue (Reinforced in v3)

`POST /api/transcript` creates a job and returns IMMEDIATELY. The worker runs after the HTTP response is sent. Critical: no `await` on yt-dlp in the request handler.

### 3. transcript_variants (NEW in v3)

Replaces the single `cleaned_text` column. One transcript → many variants: raw, cleaned, summary, topics, headings, faq, blog, study_notes, markdown. Each variant stores its `method` (rule/ai/raw) and `tokens_used`.

### 4. analytics_events (NEW in v3)

Replaces scattered counter fields (`fetch_count`, `export_count`). Event-sourcing pattern: every user action is an event. Query for aggregates later. This is what lets you answer "which export format is most popular?" and "what's the funnel from request to export?"

### 5. search_queries (NEW in v3)

Parses referrer headers to extract search keywords. This IS the SEO feedback loop. Without it, you don't know what users search for.

### 6. Rate Limiter (NEW in v3)

In-memory sliding window per IP. 10 req/min for transcript fetch, 30 req/min for everything else. No Redis needed. SHA256(IP) for privacy.

### 7. SEO Content Layer (Reinforced in v3)

Separate `seo_content` table. Every SEO page has: AI summary, key topics, FAQ, semantic headings. This is what prevents Google from treating pages as "low-value transcript mirrors."

### 8. Component State Machine

```
IDLE → SUBMITTING → POLLING → SUCCESS (tabs: Raw | Cleaned | Summary | FAQ)
                              → ERROR (message + retry + "try different video")

SUCCESS can transition to:
  → CLEANING (AI variants being generated) → SUCCESS (new tabs appear)
```

### 9. SSR vs Client Rendering

| Route | Render | Reason |
|-------|--------|--------|
| `/` | SSG | Landing, rarely changes |
| `/youtube-transcript` | Client | Tool page, URL input → API |
| `/youtube-transcript/[slug]` | SSR | SEO page, must be indexed |
| `/api/*` | Server | API routes |
| `/tiktok-transcript` | SSG | Static "coming soon" |
| `/video-to-markdown` | SSG | SEO landing, then redirect |

### 10. Docker Architecture

```
┌──────────────────────────────────────────┐
│  Tencent Cloud SG (2C/2G)               │
│                                          │
│  docker-compose                          │
│  ├── app (Next.js + Python3 + yt-dlp)   │
│  │   Port: 3000                          │
│  │   Volume: ./data:/app/data            │
│  ├── umami (Analytics)                   │
│  │   Port: 3001                          │
│  │   Volume: ./umami-db:/app/data        │
│  └── nginx (optional)                    │
│      Port: 80/443                        │
│      Proxies: app:3000, umami:3001       │
└──────────────────────────────────────────┘
```

## Environment Variables

```env
# YouTube Data API v3
YOUTUBE_API_KEY=your_google_api_key_here

# DeepSeek AI (Anthropic-compatible endpoint)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/anthropic

# Database
DATABASE_PATH=./data/transcripts.db

# App
NEXT_PUBLIC_APP_URL=http://your-server-ip:3000

# Umami
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=http://your-server-ip:3001/script.js

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Rate Limiting
RATE_LIMIT_TRANSCRIPT_PER_MINUTE=10
RATE_LIMIT_GENERAL_PER_MINUTE=30

# Job Queue
JOB_STALE_TIMEOUT_MINUTES=30
JOB_MAX_RETRIES=2
JOB_POLL_MAX_SECONDS=60

# Export
EXPORT_CLIENT_SIDE_MAX_WORDS=5000
```

## Database: Why 6 Tables Instead of 1

| v2 | v3 | Why |
|----|----|-----|
| `transcripts` (with counter fields) | `transcripts` (data only) | Separate concerns: data vs analytics |
| `cleaned_text TEXT` column | `transcript_variants` table | One transcript → N variants (cleaned, summary, topics, faq, blog...) |
| Scattered `_count` fields | `analytics_events` table | Event sourcing: answer any question later |
| None | `seo_content` table | SEO metadata separate from transcript data |
| None | `search_queries` table | SEO feedback loop: what users actually search |
| `error_log` | `error_log` (enhanced) | Added: provider, stderr, duration_ms |

## Complexity Budget (v3)

| Item | Complexity | Δ from v2 |
|------|-----------|-----------|
| Provider Layer | Low | NEW — interface + 2 implementations |
| SQLite Job Queue | Low-Medium | — |
| transcript_variants table | Low | NEW — one table, simple CRUD |
| analytics_events table | Low | NEW — append-only log |
| search_queries table | Low | NEW — upsert on referrer parse |
| seo_content table | Low | NEW — one table, SEO generation |
| Rate Limiter middleware | Low | NEW — in-memory Map, ~50 lines |
| Export streaming | Low | NEW — ReadableStream for long text |
| **TOTAL** | **Medium** | Still maintainable by one person |

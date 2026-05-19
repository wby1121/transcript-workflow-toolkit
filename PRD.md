# PRD: YouTube Transcript Workflow Toolkit

**Status:** v3 — Production Ready
**Author:** Solo Developer
**Date:** 2026-05-18
**Perspective:** SEO Product Engineering (not just tool engineering)

---

## 1. Product Identity

**Product Name:** Transcript Workflow Toolkit
**Tagline:** Turn video content into searchable, organized, exportable text.
**Positioning:** SEO-driven video knowledge extraction tool.

The difference from v1: this is NOT a "free utility page." It's a product with:
- **Retention** (Local Workspace)
- **Observability** (analytics events, error logs, search query tracking)
- **SEO defensibility** (AI content layer on every page — not raw transcript mirrors)
- **Monetization path** (Pro capabilities reserved in architecture)

---

## 2. Target Users

- Researchers who watch YouTube videos and need text notes
- Content creators who repurpose video content to blog/text
- Students who want searchable lecture transcripts
- Developers/knowledge workers building personal knowledge bases
- Obsidian/Notion users who capture video content into their workflows

---

## 3. Core Value Proposition

```
Video URL in → Async Job Queue → Transcript + Variants + SEO Context + Export out
                    ↑                                        ↑
            Never blocks UI                        Anti-duplicate-content layer
```

One page, one action. No accounts, no cloud sync. But local history persists.

---

## 4. MVP Features (Week 1 — MUST SHIP)

### 4.1 Home Page
- Tool description + value proposition
- URL input (YouTube primary, TikTok grayed out)
- Static SEO content at page bottom
- Rate-limited (no crawler abuse)

### 4.2 YouTube Transcript Tool (`/youtube-transcript`)
- Input: YouTube URL (all formats)
- **Async job queue**: never blocks the UI; polling with progress indicator
- Output: transcript with timestamps
- Provider chain: YouTube API v3 → yt-dlp fallback
- Caching: SQLite, < 7 days = instant return

### 4.3 AI Cleaning & SEO Content Layer
**This is SEO survival, not a feature.**

Rule Engine (always-on, zero cost, zero tokens):
- Remove filler words, normalize whitespace, segment by paragraphs

AI Layer (DeepSeek V4 Pro, chunk-only, never full transcript):
- 2-3 sentence video summary
- 3-5 key topics
- Semantic section headings
- FAQ extraction (Q&A pairs from transcript)

All AI output saved as `transcript_variants` + `seo_content` table entries.

### 4.4 Export
- Markdown download (Obsidian-friendly, includes summary + topics)
- TXT download
- Copy to clipboard
- Client-side for short transcripts (< 5K words)
- Server-side stream for long transcripts (> 5K words)

### 4.5 Local Workspace (No Login)
- IndexedDB via idb-keyval
- Recent transcripts (20), recent exports (20), last session restore
- Zero backend calls, zero accounts

### 4.6 SEO Pages (Programmatic)
- `/youtube-transcript/[slug]` — SSR with full SEO content layer
- Every page: summary + topics + FAQ (NOT raw transcript mirror)
- Dynamic sitemap.xml
- Schema.org markup
- This is the anti-duplicate-content defense

### 4.7 Analytics & Observability
- Umami self-hosted (pageviews, referrers, custom events)
- `analytics_events` table (product events: request, export, clean, etc.)
- `search_queries` table (referrer keyword capture — SEO feedback loop)
- `error_log` table (every failure with provider, stderr, duration)
- Sentry (client + server error tracking)
- `/api/jobs/stats` internal health endpoint
- Rate limiter (per-IP, in-memory sliding window)

---

## 5. Explicitly NOT in MVP

- ❌ User accounts / authentication / cloud sync
- ❌ AI chat with transcript / multi-agent / RAG / vector DB
- ❌ TikTok (too unstable — gray placeholder only)
- ❌ Chrome extension (Month 2+, after 100+ UV/day organic)
- ❌ Heavy analytics (no GA4, Mixpanel, PostHog)
- ❌ Admin dashboard (too heavy — internal stats endpoints + Umami suffice)
- ❌ Redis / Kafka / BullMQ / any external queue
- ❌ Microservices / Kubernetes

---

## 6. Architecture Principles (Product, not just Tech)

| Principle | Meaning |
|-----------|---------|
| **Async-first** | Transcript fetch never blocks the UI |
| **Provider abstraction** | yt-dlp is a fallback, not the main flow |
| **Variant system** | One transcript → many outputs (cleaned, summary, faq, blog...) |
| **Event sourcing** | Analytics via events, not counter columns |
| **SEO content layer** | Every indexed page has unique AI context |
| **Observable by default** | Every failure logged, every action tracked |
| **Rate limited** | No crawler can drain API quota or AI tokens |
| **7-day ship rule** | Any feature that can't ship in 7 days is cut |

---

## 7. User Journey

```
1. Land on homepage
2. Paste YouTube URL → "Get Transcript"
3. See: "Fetching transcript via YouTube API..." (async, no freeze)
4. Transcript appears with timestamps
5. Tabs: Raw | Cleaned | Summary | FAQ
6. Export → Markdown → download
7. Auto-saved to Local Workspace
8. Return next day → history still there
```

---

## 8. Week-by-Week Roadmap

| Week | Deliverable |
|------|-------------|
| Week 1 | URL input → async job queue → transcript → export. **GO LIVE.** |
| Week 2 | AI cleaning + SEO content layer + programmatic SEO pages + Local Workspace |
| Week 3 | Umami analytics + Google Search Console + Sentry + search query tracking |
| Week 4 | Long-tail SEO content + failed job monitoring + rate limit tuning |
| Month 2+ | Chrome extension (only if organic traffic > 100 UV/day) |
| Month 3+ | Pro features (only if retention + traffic exist) |

---

## 9. Future Pro Capabilities (Architecture Reserved, NOT Built)

- Bulk export (multiple transcripts)
- Transcript archive (cloud sync)
- AI Smart Summary (deeper than MVP)
- AI Semantic Search across saved transcripts
- Notion/Obsidian integration (one-click sync)
- Collection/folder organization

---

## 10. Success Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Google indexed pages | > 50 | GSC |
| Organic impressions | > 100/day | Umami / GSC |
| Transcript fetches | > 20/day | analytics_events |
| Export actions | > 10/day | analytics_events |
| AI variant generation | > 5/day | analytics_events |
| Return visitors (7-day) | > 10% | Umami |
| Failed job rate | < 5% | error_log query |
| Page load time | < 2s | Lighthouse |
| Lighthouse SEO | > 90 | Lighthouse |

---

## 11. Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| yt-dlp breaks | High | Provider abstraction; YouTube API is primary |
| API quota exhausted | Medium | yt-dlp fallback; aggressive caching |
| Transcript fetch timeout | High | Async job queue — UI never blocks |
| AI token cost explosion | Medium | Chunk-only processing; rule engine baseline |
| SEO: duplicate content penalty | High | AI context layer on every indexed page |
| Low retention (tool-page trap) | High | Local Workspace persistence |
| Crawler abuse (API/token drain) | High | Per-IP rate limiter |
| Blind to failures | High | Sentry + error_log + job stats endpoint |
| Blind to search intent | High | search_queries table from referrer parsing |

---

## 12. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database | SQLite (better-sqlite3) — 6 tables |
| Transcript Fetch | Provider chain: YouTube Data API v3 → yt-dlp |
| AI | DeepSeek V4 Pro (Anthropic-compatible, chunk-only) |
| Job Queue | SQLite-backed async queue (in-process) |
| Analytics | Umami self-hosted + analytics_events table |
| Error Tracking | Sentry |
| Client Storage | IndexedDB (idb-keyval) |
| Rate Limiting | In-memory sliding window (middleware) |
| Deployment | Docker on Tencent Cloud SG (2C/2G) |
| Monorepo | pnpm workspaces + Turborepo |

---

## 13. From Tool Engineering to SEO Product Engineering

| Tool Engineering (v1) | SEO Product Engineering (v3) |
|------------------------|------------------------------|
| Function works | Function works + is indexable + is analyzable + can grow |
| Transcript fetched | Transcript fetched + SEO layer generated + search intent tracked |
| Export works | Export works + event logged + format preference tracked |
| Error occurs | Error caught + logged with provider + stderr + duration |
| User visits | User visits + referrer parsed + keyword extracted |
| Counter on main table | Event log — query any question later |

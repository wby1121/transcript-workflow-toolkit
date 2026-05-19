# Data Flow & API Design (v3 — Production Ready)

## High-Level Data Flow (Async Job Queue)

```
User Input (YouTube URL)
        │
        ▼
┌───────────────────┐
│   Parse URL       │  Extract video ID
│   + Rate Limit    │  per-IP: 10 req/min (in-memory sliding window)
│   (Server)        │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│   Check Cache     │  SQLite: SELECT * FROM transcripts WHERE video_id = ?
│   (SQLite)        │  If cached + fresh (< 7 days) → 200 OK immediately
└───────┬───────────┘
        │
        ├── Cache HIT ──→ Return immediately (no queue, no job)
        │                  200 OK { cached: true, transcript: {...} }
        │
        └── Cache MISS ──→
                │
                ▼
┌──────────────────────────────────────────┐
│   CREATE JOB (immediate return)          │
│                                          │
│   1. Check: existing job for video_id?   │
│      → Yes: return that jobId (dedup)    │
│      → No: INSERT new job                │
│   2. INSERT INTO jobs (status='pending') │
│   3. Log event: analytics_events         │
│      (event_type='transcript_request')   │
│   4. Fire worker async (no await!)       │
│   5. RETURN 202 { jobId, status }        │
│                                          │
│   CRITICAL: Worker runs AFTER response   │
│   is sent. No synchronous waiting.       │
└───────┬──────────────────────────────────┘
        │
        ▼
┌───────────────────┐
│   Client Polls    │  GET /api/jobs/[jobId]
│   Job Status      │  Every 1.5 seconds, max 60 seconds
│                   │  Response: { status, progress, result? }
└───────┬───────────┘
        │
        ├── pending ──→ "Waiting to start..." — keep polling
        ├── processing ──→ "Fetching transcript via {provider}..." — keep polling
        ├── done ──→ 200 with transcript, stop polling
        └── failed ──→ Show error + retry button
                │
                ▼
┌──────────────────────────────────────────────────┐
│   JOB WORKER (async, after HTTP response sent)   │
│                                                  │
│   1. UPDATE jobs SET status='processing'         │
│   2. Try Provider 1: YouTube Data API v3         │
│      → Success: parse, save, done                │
│      → Failure: log error, try Provider 2        │
│   3. Try Provider 2: yt-dlp                      │
│      → Success: parse, save, done                │
│      → Failure: log error, job → failed          │
│   4. Parse subtitle format (XML/SRT/VTT → JSON)  │
│   5. Save to transcripts table                   │
│   6. Save raw → transcript_variants              │
│      (variant_type='raw')                        │
│   7. Trigger Rule Engine (sync, zero cost)       │
│      → Save to transcript_variants               │
│        (variant_type='cleaned')                  │
│   8. Trigger AI SEO layer (async, chunk-based)   │
│      → Save to transcript_variants               │
│        (variant_type='summary', 'topics',        │
│         'headings', 'faq')                       │
│   9. Log completion: analytics_events            │
│      (event_type='transcript_completed')         │
│  10. UPDATE jobs SET status='done'               │
│                                                  │
│   ON ERROR (any step):                           │
│     UPDATE jobs SET status='failed',             │
│       error_message=?, error_type=?              │
│     INSERT INTO error_log (job_id, video_id,     │
│       error_type, error_message, stderr,         │
│       provider, duration_ms)                     │
│     Log: analytics_events                        │
│       (event_type='transcript_failed')           │
└──────────────────────────────────────────────────┘
                │
                ▼
┌───────────────────┐
│   Return to UI    │  (via poll response)
│                   │
│   JSON Response:  │
│   {               │
│     videoId,      │
│     title,        │
│     channelName,  │
│     thumbnailUrl, │
│     duration,     │
│     transcript:   │
│       [{ts, text}]│
│     variants: {   │
│       raw,        │
│       cleaned,    │
│       summary,    │
│       topics,     │
│       headings,   │
│       faq         │
│     },            │
│     cached: bool, │
│     language,     │
│     provider      │  "youtube_api" | "yt_dlp"
│   }               │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│   Export          │
│                   │
│   Short (< 5000   │  Client-side: generate MD/TXT, download
│   words):         │  or clipboard.writeText()
│                   │
│   Long (> 5000    │  Server-side: GET /api/export?videoId=X&format=md
│   words):         │  Stream response to avoid browser memory pressure
│                   │
│   After export:   │
│   → Save to Local │  IndexedDB (Local Workspace)
│     Workspace     │
│   → Log event:    │  analytics_events (event_type='export_md' etc.)
│     analytics     │
└───────────────────┘
```

## Provider Layer (Critical Abstraction)

### Why

yt-dlp breaks. YouTube API changes quotas. TikTok will need a completely different fetcher. Without a provider abstraction, every new source is a rewrite.

### Interface

```typescript
interface TranscriptProvider {
  name: string;                          // 'youtube_api' | 'yt_dlp' | 'tiktok_api'
  priority: number;                      // 1 = primary, 2 = fallback
  fetch(videoId: string): Promise<TranscriptResult>;
  isAvailable(): Promise<boolean>;       // Health check
}
```

### Provider Chain

```
Request
  │
  ├── Provider[0]: YouTube Data API v3  (priority: 1)
  │   └── Fail → log, continue
  │
  ├── Provider[1]: yt-dlp               (priority: 2)
  │   └── Fail → log, continue
  │
  └── All providers exhausted → job failed
```

### Per-Provider Error Logging

Each provider failure is logged separately in error_log with:
- `provider`: which provider failed
- `error_type`: 'api_quota' | 'no_transcript' | 'timeout' | 'parse_error' | 'unknown'
- `duration_ms`: how long the attempt took
- `stderr`: raw error output

This is how you know WHICH provider is breaking, not just THAT something broke.

## Database Schema (Complete v3)

### transcripts (core data, no analytics, no variants)

```sql
CREATE TABLE transcripts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id        TEXT NOT NULL UNIQUE,
  url             TEXT NOT NULL,
  title           TEXT NOT NULL,
  channel_name    TEXT,
  thumbnail_url   TEXT,
  duration_seconds INTEGER,
  transcript_json TEXT NOT NULL,       -- [{ts_seconds, ts_display, text}]
  language        TEXT DEFAULT 'en',
  provider        TEXT NOT NULL,       -- 'youtube_api' | 'yt_dlp'
  fetched_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transcripts_video_id ON transcripts(video_id);
CREATE INDEX idx_transcripts_fetched_at ON transcripts(fetched_at);
CREATE INDEX idx_transcripts_title ON transcripts(title);
```

### transcript_variants (one-to-many: raw, cleaned, summary, topics, headings, faq, blog, etc.)

```sql
CREATE TABLE transcript_variants (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id        TEXT NOT NULL,
  variant_type    TEXT NOT NULL,       -- 'raw','cleaned','summary','topics','headings','faq','blog','study_notes','markdown'
  content         TEXT NOT NULL,       -- The variant text/JSON
  method          TEXT DEFAULT 'rule', -- 'rule' | 'ai' | 'raw'
  tokens_used     INTEGER,            -- AI tokens consumed (NULL for rule engine)
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES transcripts(video_id)
);

CREATE INDEX idx_variants_video_id ON transcript_variants(video_id);
CREATE INDEX idx_variants_type ON transcript_variants(variant_type);
CREATE UNIQUE INDEX idx_variants_video_type ON transcript_variants(video_id, variant_type);
```

### seo_content (SEO-specific metadata, separate from variants)

```sql
CREATE TABLE seo_content (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id        TEXT NOT NULL UNIQUE,
  seo_summary     TEXT,                -- AI-generated 2-3 sentence summary for meta description
  seo_topics      TEXT,                -- JSON array: ["topic1", "topic2"]
  seo_faq         TEXT,                -- JSON: [{"q":"...","a":"..."}]
  slug            TEXT NOT NULL,       -- URL-safe slug for SEO page
  meta_title      TEXT,                -- Custom meta title
  meta_description TEXT,              -- Custom meta description
  generated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES transcripts(video_id)
);

CREATE INDEX idx_seo_slug ON seo_content(slug);
```

### jobs (async job queue)

```sql
CREATE TABLE jobs (
  id              TEXT PRIMARY KEY,    -- UUID
  video_id        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending|processing|done|failed
  progress        TEXT,                -- Human-readable: "Fetching via YouTube API..."
  error_type      TEXT,               -- 'api_quota'|'no_transcript'|'timeout'|'parse_error'|'provider_error'|'unknown'
  error_message   TEXT,
  provider        TEXT,               -- Which provider is currently processing
  result_json     TEXT,               -- Cached transcript JSON on completion
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at      DATETIME,
  completed_at    DATETIME,
  duration_ms     INTEGER             -- Total job duration
);

CREATE INDEX idx_jobs_video_id ON jobs(video_id);
CREATE INDEX idx_jobs_status ON jobs(status);
```

### error_log (observability — every failure recorded)

```sql
CREATE TABLE error_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id          TEXT,
  video_id        TEXT,
  provider        TEXT,               -- 'youtube_api' | 'yt_dlp' | 'deepseek'
  error_type      TEXT NOT NULL,      -- 'api_quota'|'no_transcript'|'timeout'|'parse_error'|'provider_error'|'ai_error'|'unknown'
  error_message   TEXT NOT NULL,
  stderr          TEXT,               -- Raw error output (yt-dlp stderr, API response body)
  duration_ms     INTEGER,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_error_log_type ON error_log(error_type);
CREATE INDEX idx_error_log_created_at ON error_log(created_at);
CREATE INDEX idx_error_log_video_id ON error_log(video_id);
```

### analytics_events (product analytics — what users actually do)

```sql
CREATE TABLE analytics_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type      TEXT NOT NULL,      -- 'transcript_request','transcript_completed','transcript_failed',
                                      -- 'export_md','export_txt','export_copy',
                                      -- 'ai_clean','ai_summary','ai_topics','ai_faq',
                                      -- 'page_view','seo_landing','retry'
  video_id        TEXT,
  ip_hash         TEXT,               -- SHA256(IP) for anonymous dedup, not raw IP
  user_agent      TEXT,
  referrer        TEXT,
  metadata        TEXT,               -- JSON: any extra context
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_type ON analytics_events(event_type);
CREATE INDEX idx_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_events_video_id ON analytics_events(video_id);
```

### search_queries (referrer keyword capture — the SEO feedback loop)

```sql
CREATE TABLE search_queries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  query           TEXT NOT NULL,      -- The search query from referrer
  source          TEXT NOT NULL,      -- 'google' | 'bing' | 'duckduckgo' | 'other'
  landing_page    TEXT NOT NULL,      -- Which page they landed on
  country         TEXT,               -- From Cloudflare / IP geolocation (optional)
  count           INTEGER DEFAULT 1,  -- How many times this query appeared
  first_seen      DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_search_queries_query_page ON search_queries(query, landing_page);
```

### Why analytics_events instead of count fields on transcripts

The old design had `fetch_count`, `export_count` on the transcripts table. This is wrong because:
- You can't answer "which export format is most popular?"
- You can't answer "what time of day has most traffic?"
- You can't answer "which referrers bring AI-clean users vs export-only users?"
- You can't run a funnel: request → complete → export

analytics_events is a simple event log. For a solo dev with < 1000 events/day, SQLite handles this easily. If you ever need a real analytics DB, you migrate — but you probably won't need to.

### Why search_queries matters

This is the SEO feedback loop. Without it, you're blind to what users search for. With it:
- "youtube transcript to markdown" gets 10x more hits than "youtube transcript" → you build a dedicated `/video-to-markdown` landing page
- "[creator name] transcript" queries appear → you pre-generate those SEO pages
- TikTok queries appear → you know when to prioritize TikTok support

## API Routes (Complete v3)

### `POST /api/transcript`
Create async job. NEVER waits for transcript fetch.

**Request:** `{ url: "https://www.youtube.com/watch?v=XXX" }`

**Cache hit → 200:**
```json
{ "cached": true, "jobId": null, "transcript": { "..." } }
```

**Cache miss → 202:**
```json
{ "cached": false, "jobId": "uuid-xxxx", "status": "pending" }
```

**Rate limited → 429:**
```json
{ "error": "Too many requests. Try again in 30 seconds.", "retryAfter": 30 }
```

### `GET /api/jobs/[jobId]`
Poll job status. Client polls every 1.5s, max 60s.

**Response (pending):**
```json
{ "jobId": "uuid-xxxx", "status": "pending", "progress": "Waiting to start..." }
```

**Response (processing):**
```json
{ "jobId": "uuid-xxxx", "status": "processing", "provider": "youtube_api", "progress": "Fetching transcript via YouTube API..." }
```

**Response (done):**
```json
{ "jobId": "uuid-xxxx", "status": "done", "videoId": "XXX", "transcript": { "..." } }
```

**Response (failed):**
```json
{ "jobId": "uuid-xxxx", "status": "failed", "error": "No transcript available", "code": "NO_TRANSCRIPT", "retryable": false }
```

### `POST /api/jobs/[jobId]/retry`
Retry a failed job (creates new job for same video_id).

### `POST /api/transcript/clean`
Apply rule engine + AI processing to an existing transcript.

**Request:** `{ "videoId": "XXX", "options": { "variants": ["cleaned", "summary", "topics", "headings", "faq"] } }`

**Response (200):**
```json
{
  "variants": {
    "cleaned": { "content": "...", "method": "rule" },
    "summary": { "content": "...", "method": "ai", "tokensUsed": 450 },
    "topics": { "content": "[\"topic1\",\"topic2\"]", "method": "ai", "tokensUsed": 300 },
    "headings": { "content": "[...]", "method": "ai", "tokensUsed": 600 },
    "faq": { "content": "[...]", "method": "ai", "tokensUsed": 500 }
  }
}
```

### `GET /api/transcript/[videoId]`
Get cached transcript + all variants (for SSR SEO pages).

### `GET /api/export`
Server-side export for long transcripts.

**Query params:** `?videoId=XXX&format=md`

**Response:** Streams the file with `Content-Disposition: attachment`.

### `GET /api/jobs/stats`
Internal health endpoint. Returns:
```json
{
  "pending": 2, "processing": 1, "failed": 3,
  "failedToday": 1, "avgDurationMs": 4200
}
```

### `GET /sitemap.xml`
Dynamic sitemap from cached transcripts.

## AI Processing Strategy (Reinforced)

### NEVER send full transcript to AI

| AI Task | Input | ~Tokens | Generates Variant |
|---------|-------|---------|-------------------|
| Summary | First 2000 + last 500 chars | ~600 | `summary` |
| Key Topics | First 3000 chars | ~750 | `topics` |
| Section Headings | Per 500-word chunk | ~150/chunk | `headings` |
| FAQ | Summary + topics (not raw transcript) | ~400 | `faq` |
| Rule Engine Cleaning | Full transcript (regex, no AI) | 0 tokens | `cleaned` |

Total AI cost per transcript: ~2,000-5,000 tokens. Controllable and predictable.

## Rate Limiting

```
Per-IP sliding window:
  - 10 requests / minute (transcript fetch)
  - 30 requests / minute (all other endpoints)

Implementation:
  - In-memory Map<ip, {count, windowStart}>
  - Not persisted (cleared on restart — acceptable for MVP)
  - 429 response with Retry-After header
  - Upgrade path: Redis (only if traffic warrants it)
```

## Caching Strategy

| Condition | Action |
|-----------|--------|
| Cache hit, age < 7 days | Return immediately (200, no job) |
| Cache hit, age > 7 days | Return cached + create background refresh job |
| Cache miss | Create job → 202 → client polls |
| Job exists for same video_id | Return existing jobId (dedup) |
| Provider 1 fails | Log to error_log, try Provider 2 |
| All providers fail | Job → failed, log error, return to user |

## Client-Side: Local Workspace (IndexedDB)

```
Keys (via idb-keyval):
  recent-transcripts → [{ videoId, title, channelName, thumbnailUrl, accessedAt }]
                       FIFO, max 20 entries
  recent-exports     → [{ videoId, title, format, exportedAt }]
                       FIFO, max 20 entries
  last-session       → { videoId, title, tabState }
                       Restore on next visit
```

## Export Strategy

| Transcript Length | Method | Reason |
|-------------------|--------|--------|
| < 5,000 words | Client-side | Browser handles ~50KB strings fine |
| > 5,000 words | Server-side stream | Avoid browser memory pressure |
| Copy to clipboard | Client-side (truncated at 10K chars) | Clipboard API has limits |

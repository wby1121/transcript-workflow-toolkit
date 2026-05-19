import { getDb } from './db'

export function initializeDatabase(): void {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS transcripts (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id        TEXT NOT NULL UNIQUE,
      url             TEXT NOT NULL,
      title           TEXT NOT NULL,
      channel_name    TEXT,
      thumbnail_url   TEXT,
      duration_seconds INTEGER,
      transcript_json TEXT NOT NULL,
      language        TEXT DEFAULT 'en',
      provider        TEXT NOT NULL,
      fetched_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transcripts_video_id ON transcripts(video_id);
    CREATE INDEX IF NOT EXISTS idx_transcripts_fetched_at ON transcripts(fetched_at);
    CREATE INDEX IF NOT EXISTS idx_transcripts_title ON transcripts(title);

    CREATE TABLE IF NOT EXISTS transcript_variants (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id        TEXT NOT NULL,
      variant_type    TEXT NOT NULL,
      content         TEXT NOT NULL,
      method          TEXT DEFAULT 'rule',
      tokens_used     INTEGER,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES transcripts(video_id)
    );

    CREATE INDEX IF NOT EXISTS idx_variants_video_id ON transcript_variants(video_id);
    CREATE INDEX IF NOT EXISTS idx_variants_type ON transcript_variants(variant_type);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_video_type ON transcript_variants(video_id, variant_type);

    CREATE TABLE IF NOT EXISTS seo_content (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id        TEXT NOT NULL UNIQUE,
      seo_summary     TEXT,
      seo_topics      TEXT,
      seo_faq         TEXT,
      slug            TEXT NOT NULL,
      meta_title      TEXT,
      meta_description TEXT,
      generated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES transcripts(video_id)
    );

    CREATE INDEX IF NOT EXISTS idx_seo_slug ON seo_content(slug);

    CREATE TABLE IF NOT EXISTS jobs (
      id              TEXT PRIMARY KEY,
      video_id        TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'pending',
      progress        TEXT,
      error_type      TEXT,
      error_message   TEXT,
      provider        TEXT,
      result_json     TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at      DATETIME,
      completed_at    DATETIME,
      duration_ms     INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_video_id ON jobs(video_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

    CREATE TABLE IF NOT EXISTS error_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id          TEXT,
      video_id        TEXT,
      provider        TEXT,
      error_type      TEXT NOT NULL,
      error_message   TEXT NOT NULL,
      stderr          TEXT,
      duration_ms     INTEGER,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_error_log_type ON error_log(error_type);
    CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_error_log_video_id ON error_log(video_id);

    CREATE TABLE IF NOT EXISTS analytics_events (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type      TEXT NOT NULL,
      video_id        TEXT,
      ip_hash         TEXT,
      user_agent      TEXT,
      referrer        TEXT,
      metadata        TEXT,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_events_video_id ON analytics_events(video_id);

    CREATE TABLE IF NOT EXISTS search_queries (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      query           TEXT NOT NULL,
      source          TEXT NOT NULL,
      landing_page    TEXT NOT NULL,
      country         TEXT,
      count           INTEGER DEFAULT 1,
      first_seen      DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen       DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_search_queries_query_page ON search_queries(query, landing_page);
  `)

  console.log('[DB] All tables initialized successfully')
}

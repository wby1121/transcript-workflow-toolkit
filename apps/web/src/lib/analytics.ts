import { getDb } from './db'
import { hashIp, parseReferrerKeyword } from './utils'
import type { AnalyticsEventType } from '@/types'

export function logEvent(
  eventType: AnalyticsEventType,
  options: {
    videoId?: string
    ip?: string
    userAgent?: string
    referrer?: string
    metadata?: Record<string, unknown>
  } = {}
): void {
  try {
    const db = getDb()
    const stmt = db.prepare(
      `INSERT INTO analytics_events (event_type, video_id, ip_hash, user_agent, referrer, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    stmt.run(
      eventType,
      options.videoId || null,
      options.ip ? hashIp(options.ip) : null,
      options.userAgent || null,
      options.referrer || null,
      options.metadata ? JSON.stringify(options.metadata) : null
    )

    // Also track search queries from referrer
    if (options.referrer) {
      const parsed = parseReferrerKeyword(options.referrer)
      if (parsed) {
        const upsert = db.prepare(
          `INSERT INTO search_queries (query, source, landing_page, last_seen)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(query, landing_page) DO UPDATE SET
             count = count + 1,
             last_seen = CURRENT_TIMESTAMP`
        )
        upsert.run(parsed.query, parsed.source, '/')
      }
    }
  } catch (err) {
    // Analytics should never crash the app
    console.error('[Analytics] Failed to log event:', err)
  }
}

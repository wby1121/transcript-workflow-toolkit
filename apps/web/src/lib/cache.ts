import { getDb } from './db'
import type { TranscriptResult, TranscriptVariant, SeoContent } from '@/types'

function rowToTranscript(row: Record<string, unknown>): TranscriptResult {
  return {
    videoId: row.video_id as string,
    url: row.url as string,
    title: row.title as string,
    channelName: row.channel_name as string | undefined,
    thumbnailUrl: row.thumbnail_url as string | undefined,
    durationSeconds: row.duration_seconds as number | undefined,
    transcript: JSON.parse(row.transcript_json as string),
    language: row.language as string,
    provider: row.provider as string,
    fetchedAt: row.fetched_at as string | undefined,
  }
}

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function getCachedTranscript(videoId: string): TranscriptResult | null {
  const db = getDb()
  const row = db.prepare(
    `SELECT * FROM transcripts WHERE video_id = ?`
  ).get(videoId) as Record<string, unknown> | undefined

  if (!row) return null

  const fetchedAtRaw = row.fetched_at as string
  const fetchedAt = fetchedAtRaw ? new Date(fetchedAtRaw).getTime() : Date.now()
  // If date is invalid (NaN), treat as fresh
  if (isNaN(fetchedAt) || Date.now() - fetchedAt > CACHE_MAX_AGE_MS) {
    if (isNaN(fetchedAt)) {
      // Invalid date — assume fresh, but log
      console.warn('[Cache] Invalid fetched_at for', videoId, '— treating as fresh')
      return rowToTranscript(row)
    }
    return null
  }

  return rowToTranscript(row)
}

export function getCachedVariants(videoId: string): Record<string, TranscriptVariant> {
  const db = getDb()
  const rows = db.prepare(
    `SELECT * FROM transcript_variants WHERE video_id = ?`
  ).all(videoId) as Array<Record<string, unknown>>

  const variants: Record<string, TranscriptVariant> = {}
  for (const row of rows) {
    const vtype = row.variant_type as string
    variants[vtype] = {
      id: row.id as number,
      videoId: row.video_id as string,
      variantType: vtype as TranscriptVariant['variantType'],
      content: row.content as string,
      method: row.method as 'rule' | 'ai' | 'raw',
      tokensUsed: row.tokens_used as number | undefined,
      createdAt: row.created_at as string,
    }
  }
  return variants
}

export function getCachedSeo(videoId: string): SeoContent | null {
  const db = getDb()
  const row = db.prepare(
    `SELECT * FROM seo_content WHERE video_id = ?`
  ).get(videoId) as Record<string, unknown> | undefined

  if (!row) return null

  return {
    videoId: row.video_id as string,
    seoSummary: row.seo_summary as string | undefined,
    seoTopics: row.seo_topics ? JSON.parse(row.seo_topics as string) : undefined,
    seoFaq: row.seo_faq ? JSON.parse(row.seo_faq as string) : undefined,
    slug: row.slug as string,
    metaTitle: row.meta_title as string | undefined,
    metaDescription: row.meta_description as string | undefined,
  }
}

export function saveTranscript(data: TranscriptResult): void {
  const db = getDb()
  db.prepare(
    `INSERT OR REPLACE INTO transcripts
     (video_id, url, title, channel_name, thumbnail_url, duration_seconds,
      transcript_json, language, provider, fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).run(
    data.videoId,
    data.url,
    data.title,
    data.channelName || null,
    data.thumbnailUrl || null,
    data.durationSeconds || null,
    JSON.stringify(data.transcript),
    data.language,
    data.provider
  )
}

export function incrementFetchCount(videoId: string): void {
  const db = getDb()
  db.prepare(
    `UPDATE transcripts SET fetched_at = CURRENT_TIMESTAMP WHERE video_id = ?`
  ).run(videoId)
}

export function isCacheStale(videoId: string): boolean {
  const db = getDb()
  const row = db.prepare(
    `SELECT fetched_at FROM transcripts WHERE video_id = ?`
  ).get(videoId) as { fetched_at: string } | undefined

  if (!row) return true
  return Date.now() - new Date(row.fetched_at).getTime() > CACHE_MAX_AGE_MS
}

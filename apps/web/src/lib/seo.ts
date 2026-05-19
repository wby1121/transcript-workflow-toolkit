import { getDb } from './db'
import { slugify } from './utils'
import type { SeoContent, FaqEntry } from '@/types'

export function saveSeoContent(data: {
  videoId: string
  summary?: string
  topics?: string[]
  faq?: FaqEntry[]
  title: string
  metaDescription?: string
}): void {
  const db = getDb()
  const slug = slugify(data.title)

  db.prepare(
    `INSERT OR REPLACE INTO seo_content
     (video_id, seo_summary, seo_topics, seo_faq, slug, meta_title, meta_description, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).run(
    data.videoId,
    data.summary || null,
    data.topics ? JSON.stringify(data.topics) : null,
    data.faq ? JSON.stringify(data.faq) : null,
    slug,
    `${data.title} - Transcript | Transcript Workflow Toolkit`,
    data.metaDescription || `Full transcript of "${data.title}" with timestamps. Export to Markdown, TXT, or copy to clipboard. AI-powered summary and key topics.`,
  )
}

export function getSeoBySlug(slug: string): SeoContent | null {
  const db = getDb()
  const row = db.prepare(
    `SELECT * FROM seo_content WHERE slug = ?`
  ).get(slug) as Record<string, unknown> | undefined

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

export function getAllSeoSlugs(): Array<{ slug: string; fetchedAt: string }> {
  const db = getDb()
  return db.prepare(
    `SELECT s.slug, t.fetched_at as fetchedAt
     FROM seo_content s
     JOIN transcripts t ON s.video_id = t.video_id
     ORDER BY t.fetched_at DESC`
  ).all() as Array<{ slug: string; fetchedAt: string }>
}

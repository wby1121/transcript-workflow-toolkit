import { getDb } from './db'
import type { TranscriptVariant, VariantType } from '@/types'

export function saveVariant(
  videoId: string,
  variantType: VariantType,
  content: string,
  method: 'rule' | 'ai' | 'raw',
  tokensUsed?: number
): void {
  const db = getDb()
  db.prepare(
    `INSERT OR REPLACE INTO transcript_variants
     (video_id, variant_type, content, method, tokens_used, created_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).run(videoId, variantType, content, method, tokensUsed || null)
}

export function getVariant(videoId: string, variantType: VariantType): TranscriptVariant | null {
  const db = getDb()
  const row = db.prepare(
    `SELECT * FROM transcript_variants WHERE video_id = ? AND variant_type = ?`
  ).get(videoId, variantType) as Record<string, unknown> | undefined

  if (!row) return null
  return {
    id: row.id as number,
    videoId: row.video_id as string,
    variantType: row.variant_type as VariantType,
    content: row.content as string,
    method: row.method as 'rule' | 'ai' | 'raw',
    tokensUsed: row.tokens_used as number | undefined,
    createdAt: row.created_at as string,
  }
}

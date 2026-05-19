import { getDb } from '@/lib/db'
// uuid removed — using crypto.randomUUID()
import type { Job } from '@/types'

function generateId(): string {
  // Use crypto.randomUUID when available, fallback to manual
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'job_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9)
}

export function createJob(videoId: string): Job {
  const db = getDb()

  // Check for existing pending/processing job for this video
  const existing = db.prepare(
    `SELECT * FROM jobs WHERE video_id = ? AND status IN ('pending', 'processing') ORDER BY created_at DESC LIMIT 1`
  ).get(videoId) as Record<string, unknown> | undefined

  if (existing) {
    return {
      id: existing.id as string,
      videoId: existing.video_id as string,
      status: existing.status as Job['status'],
      progress: existing.progress as string | undefined,
      createdAt: existing.created_at as string,
    }
  }

  const id = generateId()
  db.prepare(
    `INSERT INTO jobs (id, video_id, status, created_at) VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)`
  ).run(id, videoId)

  return {
    id,
    videoId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

export function getJob(jobId: string): Job | null {
  const db = getDb()
  const row = db.prepare(`SELECT * FROM jobs WHERE id = ?`).get(jobId) as Record<string, unknown> | undefined
  if (!row) return null

  return {
    id: row.id as string,
    videoId: row.video_id as string,
    status: row.status as Job['status'],
    progress: row.progress as string | undefined,
    errorType: row.error_type as string | undefined,
    errorMessage: row.error_message as string | undefined,
    provider: row.provider as string | undefined,
    resultJson: row.result_json as string | undefined,
    createdAt: row.created_at as string,
    startedAt: row.started_at as string | undefined,
    completedAt: row.completed_at as string | undefined,
    durationMs: row.duration_ms as number | undefined,
  }
}

export function updateJobStatus(
  jobId: string,
  status: Job['status'],
  extra: Partial<{
    progress: string
    errorType: string
    errorMessage: string
    provider: string
    resultJson: string
  }> = {}
): void {
  const db = getDb()
  const now = new Date().toISOString()

  if (status === 'processing') {
    db.prepare(
      `UPDATE jobs SET status = 'processing', progress = ?, provider = ?, started_at = ? WHERE id = ?`
    ).run(extra.progress || 'Processing...', extra.provider || null, now, jobId)
  } else if (status === 'done') {
    db.prepare(
      `UPDATE jobs SET status = 'done', result_json = ?, completed_at = ?,
       duration_ms = (julianday(?) - julianday(started_at)) * 86400000 WHERE id = ?`
    ).run(extra.resultJson || null, now, now, jobId)
  } else if (status === 'failed') {
    db.prepare(
      `UPDATE jobs SET status = 'failed', error_type = ?, error_message = ?,
       completed_at = ?, duration_ms = (julianday(?) - julianday(started_at)) * 86400000 WHERE id = ?`
    ).run(extra.errorType || 'unknown', extra.errorMessage || 'Unknown error', now, now, jobId)
  } else {
    db.prepare(`UPDATE jobs SET status = ?, progress = ? WHERE id = ?`).run(status, extra.progress || null, jobId)
  }
}

export function getJobStats(): { pending: number; processing: number; failed: number; failedToday: number } {
  const db = getDb()
  const pending = (db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE status = 'pending'`).get() as { c: number }).c
  const processing = (db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE status = 'processing'`).get() as { c: number }).c
  const failed = (db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE status = 'failed'`).get() as { c: number }).c
  const failedToday = (db.prepare(
    `SELECT COUNT(*) as c FROM jobs WHERE status = 'failed' AND date(created_at) = date('now')`
  ).get() as { c: number }).c

  return { pending, processing, failed, failedToday }
}

import { getDb } from '@/lib/db'

const STALE_TIMEOUT_MINUTES = parseInt(process.env.JOB_STALE_TIMEOUT_MINUTES || '30')

export function cleanupStaleJobs(): void {
  const db = getDb()

  // Mark stale processing jobs as failed
  db.prepare(
    `UPDATE jobs SET status = 'failed', error_type = 'timeout', error_message = 'Job timed out'
     WHERE status = 'processing'
     AND started_at < datetime('now', '-' || ? || ' minutes')`
  ).run(STALE_TIMEOUT_MINUTES)

  // Delete old completed jobs (keep last 1000)
  db.prepare(
    `DELETE FROM jobs WHERE status IN ('done', 'failed')
     AND id NOT IN (SELECT id FROM jobs WHERE status IN ('done', 'failed') ORDER BY created_at DESC LIMIT 1000)`
  ).run()
}

// Run cleanup periodically
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStaleJobs, 5 * 60 * 1000) // Every 5 minutes
}

export function getProvider(): string {
  return 'job-cleanup'
}

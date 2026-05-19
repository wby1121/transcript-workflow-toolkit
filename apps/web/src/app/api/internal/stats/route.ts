import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  // Aggregate from analytics_events
  const allEvents = db.prepare('SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 1000').all() as Record<string, unknown>[]
  const transcriptRequests = allEvents.filter(e => e.event_type === 'transcript_request').length
  const transcriptCompleted = allEvents.filter(e => e.event_type === 'transcript_completed').length
  const transcriptFailed = allEvents.filter(e => e.event_type === 'transcript_failed').length
  const exportsMd = allEvents.filter(e => e.event_type === 'export_md').length
  const exportsTxt = allEvents.filter(e => e.event_type === 'export_txt').length
  const exportsCopy = allEvents.filter(e => e.event_type === 'export_copy').length
  const aiSummaries = allEvents.filter(e => e.event_type === 'ai_summary').length
  const pageViews = allEvents.filter(e => e.event_type === 'page_view').length

  // Search queries
  const searchQueries = db.prepare('SELECT * FROM search_queries ORDER BY last_seen DESC LIMIT 20').all() as Record<string, unknown>[]

  // Error log
  const errors = db.prepare('SELECT * FROM error_log ORDER BY created_at DESC LIMIT 20').all() as Record<string, unknown>[]

  // Top videos
  const videoCounts: Record<string, { count: number; title: string }> = {}
  for (const e of allEvents) {
    if (e.event_type === 'transcript_completed' && e.video_id) {
      const vid = String(e.video_id)
      if (!videoCounts[vid]) videoCounts[vid] = { count: 0, title: vid }
      videoCounts[vid].count++
    }
  }
  const topVideos = Object.entries(videoCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, info]) => ({ videoId: id, count: info.count }))

  // Recent events timeline
  const recentEvents = allEvents.slice(0, 50).map(e => ({
    type: e.event_type,
    videoId: e.video_id,
    createdAt: e.created_at,
  }))

  return NextResponse.json({
    overview: {
      transcriptRequests,
      transcriptCompleted,
      transcriptFailed,
      failRate: transcriptRequests > 0 ? ((transcriptFailed / transcriptRequests) * 100).toFixed(1) + '%' : '0%',
      exportsMd,
      exportsTxt,
      exportsCopy,
      totalExports: exportsMd + exportsTxt + exportsCopy,
      aiSummaries,
      pageViews,
    },
    searchQueries: searchQueries.slice(0, 10),
    recentErrors: errors.slice(0, 10),
    topVideos,
    recentEvents,
  })
}

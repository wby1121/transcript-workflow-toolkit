'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, FileText, Sparkles, AlertTriangle, Search, TrendingUp, Activity } from 'lucide-react'

interface StatsData {
  overview: {
    transcriptRequests: number
    transcriptCompleted: number
    transcriptFailed: number
    failRate: string
    exportsMd: number
    exportsTxt: number
    exportsCopy: number
    totalExports: number
    aiSummaries: number
    pageViews: number
  }
  searchQueries: Array<{ query: string; source: string; count: number; last_seen: string }>
  recentErrors: Array<{ error_type: string; error_message: string; provider: string; created_at: string; video_id: string }>
  topVideos: Array<{ videoId: string; count: number }>
  recentEvents: Array<{ type: string; videoId: string; createdAt: string }>
}

export default function InternalStatsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/internal/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return <div className="container max-w-5xl mx-auto px-4 py-8"><Skeleton className="h-96" /></div>
  if (error) return <div className="container max-w-5xl mx-auto px-4 py-8 text-destructive">Error: {error}</div>
  if (!data) return null

  const { overview, searchQueries, recentErrors, topVideos } = data

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Internal Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={<FileText />} label="Transcripts" value={overview.transcriptCompleted} sub={`${overview.transcriptRequests} requests`} />
        <MetricCard icon={<Activity />} label="Page Views" value={overview.pageViews} />
        <MetricCard icon={<Sparkles />} label="AI Generations" value={overview.aiSummaries} />
        <MetricCard icon={<AlertTriangle />} label="Fail Rate" value={overview.failRate} sub={`${overview.transcriptFailed} failed`} warn={overview.transcriptFailed > 0} />
      </div>

      {/* Export Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-base">Exports</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Markdown</span><span className="font-mono">{overview.exportsMd}</span></div>
              <div className="flex justify-between"><span>TXT</span><span className="font-mono">{overview.exportsTxt}</span></div>
              <div className="flex justify-between"><span>Copy</span><span className="font-mono">{overview.exportsCopy}</span></div>
              <div className="flex justify-between border-t pt-2 font-medium"><span>Total</span><span className="font-mono">{overview.totalExports}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Search className="w-4 h-4" /> Search Queries</CardTitle></CardHeader>
          <CardContent>
            {searchQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No search queries tracked yet. They appear when users arrive from search engines.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchQueries.map((q, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{q.query}</span>
                    <Badge variant="outline">{q.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Videos */}
      {topVideos.length > 0 && (
        <Card className="mb-8">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Top Videos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {topVideos.map((v, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener" className="text-primary hover:underline truncate mr-4 font-mono text-xs">
                    {v.videoId}
                  </a>
                  <span className="text-muted-foreground shrink-0">{v.count} fetches</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Errors */}
      {recentErrors.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> Recent Errors</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentErrors.map((e, i) => (
                <div key={i} className="text-sm border-l-2 border-destructive pl-3 py-1">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">{e.error_type}</Badge>
                    <Badge variant="secondary" className="text-xs shrink-0">{e.provider || 'unknown'}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs truncate">{e.error_message}</p>
                  <p className="text-muted-foreground text-xs">
                    {e.video_id && <span className="font-mono mr-2">{e.video_id}</span>}
                    {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetricCard({ icon, label, value, sub, warn }: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  warn?: boolean
}) {
  return (
    <Card className={warn ? 'border-destructive/50' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${warn ? 'text-destructive' : ''}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

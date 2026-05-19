import { NextRequest, NextResponse } from 'next/server'
import { getJob, createJob } from '@/lib/queue/job-creator'
import { processJob } from '@/lib/queue/job-worker'
import { getCachedTranscript } from '@/lib/cache'
import { logEvent } from '@/lib/analytics'

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const oldJob = getJob(params.jobId)
  if (!oldJob) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (oldJob.status === 'done') {
    const cached = getCachedTranscript(oldJob.videoId)
    return NextResponse.json({
      cached: true,
      jobId: null,
      status: 'done',
      transcript: cached,
    })
  }

  // Get the original URL from the transcript record
  const cached = getCachedTranscript(oldJob.videoId)
  const url = cached?.url || `https://www.youtube.com/watch?v=${oldJob.videoId}`

  logEvent('retry', { videoId: oldJob.videoId })

  const newJob = createJob(oldJob.videoId)

  processJob(newJob.id, oldJob.videoId, url).catch(err => {
    console.error(`[API] Retry job ${newJob.id} failed:`, err)
  })

  return NextResponse.json({
    cached: false,
    jobId: newJob.id,
    status: 'pending',
  }, { status: 202 })
}

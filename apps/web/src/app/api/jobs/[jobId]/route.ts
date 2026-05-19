import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '@/lib/queue/job-creator'
import { getCachedTranscript, getCachedVariants, getCachedSeo } from '@/lib/cache'

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const job = getJob(params.jobId)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status === 'done') {
    // Load the full transcript result
    let transcript = null
    let variants = null
    let seo = null

    try {
      transcript = getCachedTranscript(job.videoId)
      variants = getCachedVariants(job.videoId)
      seo = getCachedSeo(job.videoId)
    } catch (err) {
      console.error('[API] Failed to load transcript result:', err)
    }

    return NextResponse.json({
      jobId: job.id,
      status: 'done',
      videoId: job.videoId,
      transcript,
      variants: variants && Object.keys(variants).length > 0 ? variants : undefined,
      seo: seo || undefined,
    })
  }

  if (job.status === 'failed') {
    const retryable = job.errorType !== 'no_transcript'
    return NextResponse.json({
      jobId: job.id,
      status: 'failed',
      error: job.errorMessage || 'Unknown error',
      code: job.errorType || 'UNKNOWN',
      retryable,
    })
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    provider: job.provider,
  })
}

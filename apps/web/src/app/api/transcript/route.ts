import { NextRequest, NextResponse } from 'next/server'
import { parseYouTubeUrl } from '@/lib/utils'
import { getCachedTranscript, getCachedVariants, getCachedSeo, isCacheStale, saveTranscript } from '@/lib/cache'
import { saveVariant } from '@/lib/variants'
import { cleanTranscriptToText } from '@/lib/transcript/cleaner'
import { checkRateLimit } from '@/lib/rate-limiter'
import { logEvent } from '@/lib/analytics'
import { z } from 'zod'

const RequestSchema = z.object({ url: z.string().url().or(z.string().min(1)) })

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimit = checkRateLimit(ip, 10, 60000, 'transcript')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in 30 seconds.', retryAfter: rateLimit.retryAfter || 30 },
      { status: 429 }
    )
  }

  // Parse request
  let body: { url: string }
  try {
    body = RequestSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body', code: 'INVALID_REQUEST' }, { status: 400 })
  }

  const videoId = parseYouTubeUrl(body.url)
  if (!videoId) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL. Supported: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/', code: 'INVALID_URL' },
      { status: 400 }
    )
  }

  logEvent('transcript_request', { videoId, ip })

  try {
    // Check cache
    const cached = getCachedTranscript(videoId)
    if (cached && !isCacheStale(videoId)) {
      const variants = getCachedVariants(videoId)
      const seo = getCachedSeo(videoId)
      return NextResponse.json({
        cached: true, status: 'done', transcript: cached,
        variants: Object.keys(variants).length > 0 ? variants : undefined,
        seo: seo || undefined,
      })
    }

    // ---- SYNCHRONOUS FETCH ----
    const { fetchTranscript } = await import('@/providers/registry')

    let result
    try {
      result = await fetchTranscript(videoId, 'direct')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({
        error: `Failed to fetch transcript: ${message}`,
        code: 'FETCH_FAILED',
        hint: 'Make sure you have either YOUTUBE_API_KEY set in .env.local OR yt-dlp installed (pip install yt-dlp). Check /api/debug for diagnostics.',
      }, { status: 500 })
    }

    // Save to DB
    const transcriptResult = {
      videoId,
      url: body.url,
      title: result.title,
      channelName: result.channelName,
      thumbnailUrl: result.thumbnailUrl,
      durationSeconds: result.durationSeconds,
      transcript: result.transcript,
      language: result.language,
      provider: result.provider,
    }

    saveTranscript(transcriptResult)

    // Save raw variant
    const rawText = result.transcript.map((s: { tsDisplay: string; text: string }) => `[${s.tsDisplay}] ${s.text}`).join('\n')
    saveVariant(videoId, 'raw', rawText, 'raw')

    // Rule engine cleaning
    const cleanedText = cleanTranscriptToText(result.transcript)
    saveVariant(videoId, 'cleaned', cleanedText, 'rule')

    logEvent('transcript_completed', { videoId, metadata: { provider: result.provider } })

    const variants = getCachedVariants(videoId)

    return NextResponse.json({
      cached: false, status: 'done', transcript: transcriptResult,
      variants: Object.keys(variants).length > 0 ? variants : undefined,
    })

  } catch (err) {
    console.error('[API] Unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

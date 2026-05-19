import { saveTranscript, getCachedTranscript } from '@/lib/cache'
import { saveVariant } from '@/lib/variants'
import { cleanTranscriptToText } from '@/lib/transcript/cleaner'
import { updateJobStatus, getJob } from '@/lib/queue/job-creator'
import { logEvent } from '@/lib/analytics'
import type { TranscriptResult } from '@/types'

export async function processJob(jobId: string, videoId: string, url: string): Promise<void> {
  const startTime = Date.now()

  try {
    // Check cache first
    const cached = getCachedTranscript(videoId)
    if (cached) {
      updateJobStatus(jobId, 'done', { resultJson: JSON.stringify(cached) })
      logEvent('transcript_completed', { videoId })
      return
    }

    // Update to processing
    updateJobStatus(jobId, 'processing', { progress: 'Starting transcript fetch...' })

    // Dynamic import providers to avoid bundling issues
    const { fetchTranscript } = await import('@/providers/registry')
    const result = await fetchTranscript(videoId, jobId)

    const transcriptResult: TranscriptResult = {
      videoId,
      url,
      title: result.title,
      channelName: result.channelName,
      thumbnailUrl: result.thumbnailUrl,
      durationSeconds: result.durationSeconds,
      transcript: result.transcript,
      language: result.language,
      provider: result.provider,
    }

    updateJobStatus(jobId, 'processing', { progress: 'Saving transcript...' })
    saveTranscript(transcriptResult)

    const rawText = result.transcript.map(s => `[${s.tsDisplay}] ${s.text}`).join('\n')
    saveVariant(videoId, 'raw', rawText, 'raw')

    updateJobStatus(jobId, 'processing', { progress: 'Applying text cleaning...' })
    const cleanedText = cleanTranscriptToText(result.transcript)
    saveVariant(videoId, 'cleaned', cleanedText, 'rule')

    const durationMs = Date.now() - startTime
    updateJobStatus(jobId, 'done', { resultJson: JSON.stringify(transcriptResult) })
    logEvent('transcript_completed', { videoId, metadata: { provider: result.provider, durationMs } })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const durationMs = Date.now() - startTime
    console.error('[Worker] Job failed:', jobId, message)

    updateJobStatus(jobId, 'failed', {
      errorType: 'provider_error',
      errorMessage: message,
    })

    logEvent('transcript_failed', { videoId, metadata: { error: message, durationMs } })
  }
}

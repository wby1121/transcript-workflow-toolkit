import type { TranscriptProvider, ProviderResult } from './interface'

export class YouTubeApiProvider implements TranscriptProvider {
  name = 'youtube_api'
  priority = 1
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || ''
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async fetch(videoId: string): Promise<ProviderResult> {
    const apiKey = this.apiKey

    // Step 1: Get video metadata
    let title = 'YouTube Video'
    let channelName: string | undefined
    let thumbnailUrl: string | undefined
    let durationSeconds: number | undefined

    if (apiKey) {
      try {
        const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
        videoUrl.searchParams.set('part', 'snippet,contentDetails')
        videoUrl.searchParams.set('id', videoId)
        videoUrl.searchParams.set('key', apiKey)

        const videoRes = await fetch(videoUrl.toString(), { signal: AbortSignal.timeout(10000) })
        if (videoRes.ok) {
          const videoData = await videoRes.json()
          const videoItem = videoData.items?.[0]
          if (videoItem) {
            title = videoItem.snippet.title
            channelName = videoItem.snippet.channelTitle
            thumbnailUrl = videoItem.snippet.thumbnails?.maxres?.url
              || videoItem.snippet.thumbnails?.high?.url
              || videoItem.snippet.thumbnails?.default?.url
            durationSeconds = parseDuration(videoItem.contentDetails.duration)
          }
        }
      } catch { /* metadata is nice-to-have, not critical */ }
    } else {
      // No API key — use fallback thumbnail
      thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }

    // Step 2: Get transcript via YouTube timedtext API (no auth needed)
    const transcript = await fetchTranscript(videoId)
    if (!transcript || transcript.length === 0) {
      throw new Error('No English transcript available for this video')
    }

    return {
      transcript,
      title,
      channelName,
      thumbnailUrl,
      durationSeconds,
      language: 'en',
    }
  }
}

async function fetchTranscript(videoId: string): Promise<any[]> {
  const { parseXmlTranscript } = await import('@/lib/transcript/parser')
  const { formatTimestamp } = await import('@/lib/utils')

  // YouTube's own timedtext API — the source of truth, no auth needed
  const urls = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US`,
    `https://www.youtube.com/api/timedtext?v=${videoId}`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TranscriptToolkit/1.0)',
        },
      })
      if (!res.ok) continue

      const text = await res.text()

      // YouTube timedtext returns XML with <text start="..." dur="...">...</text>
      if (text.includes('<text ')) {
        const transcript = parseXmlTranscript(text)
        if (transcript.length > 0) return transcript
      }
    } catch { /* try next URL */ }
  }

  // Fallback: public transcript API
  try {
    const res = await fetch(`https://youtubetranscript.com/?v=${videoId}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const text = await res.text()
      if (text.includes('<text ')) {
        const transcript = parseXmlTranscript(text)
        if (transcript.length > 0) return transcript
      }
    }
  } catch { /* last resort failed */ }

  return []
}

function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return parseInt(match[1] || '0') * 3600 + parseInt(match[2] || '0') * 60 + parseInt(match[3] || '0')
}

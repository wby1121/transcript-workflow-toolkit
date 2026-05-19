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
    // Get video details via YouTube Data API v3
    const apiKey = this.apiKey
    if (!apiKey) {
      throw new Error('YouTube API key not configured')
    }

    // Step 1: Get video metadata
    const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    videoUrl.searchParams.set('part', 'snippet,contentDetails')
    videoUrl.searchParams.set('id', videoId)
    videoUrl.searchParams.set('key', apiKey)

    const videoRes = await fetch(videoUrl.toString())
    if (!videoRes.ok) {
      const body = await videoRes.text()
      throw new Error(`YouTube API error (${videoRes.status}): ${body.substring(0, 200)}`)
    }
    const videoData = await videoRes.json()
    const videoItem = videoData.items?.[0]
    if (!videoItem) {
      throw new Error('Video not found')
    }

    const title = videoItem.snippet.title
    const channelName = videoItem.snippet.channelTitle
    const thumbnailUrl = videoItem.snippet.thumbnails?.maxres?.url
      || videoItem.snippet.thumbnails?.high?.url
      || videoItem.snippet.thumbnails?.default?.url
    const durationSeconds = parseDuration(videoItem.contentDetails.duration)

    // Step 2: Get transcript via public transcript API
    // Use multiple fallback transcript sources
    let transcript = await fetchTranscriptPublic(videoId)
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

async function fetchTranscriptPublic(videoId: string): Promise<any[]> {
  // Try public transcript API (no auth needed)
  const sources = [
    `https://youtubetranscript.com/?v=${videoId}`,
    `https://youtubetranscript.com/?v=${videoId}&hl=en`,
  ]

  for (const url of sources) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) continue
      const text = await res.text()

      // Parse the response — it's XML format
      const { parseXmlTranscript } = await import('@/lib/transcript/parser')

      // The response has <text> elements
      if (text.includes('<text ')) {
        const transcript = parseXmlTranscript(text)
        if (transcript.length > 0) return transcript
      }

      // Try parsing as JSON (some APIs return JSON)
      try {
        const json = JSON.parse(text)
        if (Array.isArray(json)) {
          const { formatTimestamp } = await import('@/lib/utils')
          return json.map((item: any) => ({
            tsSeconds: Math.floor(item.offset / 1000 || item.start || 0),
            tsDisplay: formatTimestamp(Math.floor(item.offset / 1000 || item.start || 0)),
            text: (item.text || '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim(),
          })).filter((item: any) => item.text.length > 0)
        }
      } catch { /* not JSON, continue */ }
    } catch { /* try next source */ }
  }

  return []
}

function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return parseInt(match[1] || '0') * 3600 + parseInt(match[2] || '0') * 60 + parseInt(match[3] || '0')
}

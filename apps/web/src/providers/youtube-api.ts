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
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured')
    }

    // Step 1: Get video details
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${this.apiKey}`
    const videoRes = await fetch(videoUrl)
    if (!videoRes.ok) {
      const body = await videoRes.text()
      throw new Error(`YouTube API error (${videoRes.status}): ${body}`)
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

    // Parse duration
    const durationRaw = videoItem.contentDetails.duration // ISO 8601: "PT1H2M3S"
    const durationSeconds = parseDuration(durationRaw)

    // Step 2: Get captions
    const captionsUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${this.apiKey}`
    const captionsRes = await fetch(captionsUrl)
    if (!captionsRes.ok) {
      throw new Error('Failed to fetch captions list')
    }
    const captionsData = await captionsRes.json()
    const captionItem = captionsData.items?.[0]
    if (!captionItem) {
      throw new Error('No captions available for this video')
    }

    // Step 3: Download caption track
    const captionId = captionItem.id
    const downloadUrl = `https://www.googleapis.com/youtube/v3/captions/${captionId}?key=${this.apiKey}`
    const downloadRes = await fetch(downloadUrl, {
      headers: { 'Accept': 'application/xml' },
    })
    if (!downloadRes.ok) {
      throw new Error('Failed to download caption track')
    }
    const rawXml = await downloadRes.text()

    // Parse will be done by the fetcher
    const { parseXmlTranscript } = await import('@/lib/transcript/parser')
    const transcript = parseXmlTranscript(rawXml)

    return {
      transcript,
      title,
      channelName,
      thumbnailUrl,
      durationSeconds,
      language: captionItem.snippet?.language || 'en',
    }
  }
}

function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}

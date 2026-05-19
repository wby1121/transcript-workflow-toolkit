// Shared types between web app and future Chrome extension

export interface TranscriptSegment {
  tsSeconds: number
  tsDisplay: string
  text: string
}

export interface TranscriptResult {
  videoId: string
  url: string
  title: string
  channelName?: string
  thumbnailUrl?: string
  transcript: TranscriptSegment[]
  language: string
  provider: string
}

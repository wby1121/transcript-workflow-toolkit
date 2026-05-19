import type { TranscriptSegment } from '@/types'

export interface ProviderResult {
  transcript: TranscriptSegment[]
  title: string
  channelName?: string
  thumbnailUrl?: string
  durationSeconds?: number
  language: string
}

export interface TranscriptProvider {
  name: string
  priority: number
  fetch(videoId: string): Promise<ProviderResult>
  isAvailable(): Promise<boolean>
}

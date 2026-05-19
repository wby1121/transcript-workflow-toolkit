import type { ProviderResult } from './interface'
import { YouTubeApiProvider } from './youtube-api'
import { YtDlpProvider } from './yt-dlp'
import { getDb } from '@/lib/db'

let providers: (YouTubeApiProvider | YtDlpProvider)[] | null = null

function getProviders() {
  if (providers) return providers
  providers = [
    new YouTubeApiProvider(process.env.YOUTUBE_API_KEY),
    new YtDlpProvider(),
  ].sort((a, b) => a.priority - b.priority)
  return providers
}

export async function fetchTranscript(
  videoId: string,
  _jobId: string
): Promise<ProviderResult & { provider: string }> {
  const allProviders = getProviders()
  const errors: string[] = []

  for (const provider of allProviders) {
    try {
      const result = await provider.fetch(videoId)
      return { ...result, provider: provider.name }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`${provider.name}: ${message}`)
      console.error(`[Provider] ${provider.name} failed for ${videoId}: ${message}`)
    }
  }

  const detail = errors.map(e => `  - ${e}`).join('\n')
  throw new Error(
    `All providers exhausted. Errors:\n${detail}\n\n` +
    `Fix: Set YOUTUBE_API_KEY in .env.local (recommended) or install yt-dlp (pip install yt-dlp).\n` +
    `Check http://localhost:3000/api/debug for diagnostics.`
  )
}

export async function checkProviderHealth(): Promise<Record<string, boolean>> {
  const allProviders = getProviders()
  const health: Record<string, boolean> = {}
  for (const provider of allProviders) {
    try { health[provider.name] = await provider.isAvailable() }
    catch { health[provider.name] = false }
  }
  return health
}

import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export async function GET() {
  const results: Record<string, unknown> = {
    nodeVersion: process.version,
    platform: process.platform,
    envKeys: {
      youtubeApiKey: process.env.YOUTUBE_API_KEY ? 'SET' : 'NOT SET',
      deepseekApiKey: process.env.DEEPSEEK_API_KEY ? 'SET' : 'NOT SET',
      deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || '(default)',
    },
  }

  // Test DeepSeek connection
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/anthropic').replace(/\/$/, '')

  if (apiKey) {
    const urls = [`${baseUrl}/v1/messages`, `${baseUrl}/messages`, baseUrl]
    for (const url of urls) {
      try {
        const controller = new AbortController()
        const t = setTimeout(() => controller.abort(), 10000)
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'hi' }],
          }),
          signal: controller.signal,
        })
        clearTimeout(t)
        const text = await res.text()
        results.deepseekTest = { url, status: res.status, ok: res.ok, bodyPreview: text.substring(0, 300) }
        break
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        if (msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('timeout')) {
          results.deepseekTest = { url, error: 'Timeout after 10s' }
          break
        }
        if (!results.deepseekErrors) results.deepseekErrors = []
        ;(results.deepseekErrors as Array<{ url: string; error: string }>).push({ url, error: msg })
      }
    }
  } else {
    results.deepseekTest = { error: 'DEEPSEEK_API_KEY not set' }
  }

  // Check yt-dlp
  try {
    const { stdout } = await execFileAsync('yt-dlp', ['--version'], { timeout: 5000 })
    results.ytDlp = { available: true, version: stdout.trim() }
  } catch {
    try {
      const { stdout } = await execFileAsync('python', ['-m', 'yt_dlp', '--version'], { timeout: 5000 })
      results.ytDlp = { available: true, version: stdout.trim(), via: 'python -m yt_dlp' }
    } catch {
      results.ytDlp = { available: false, error: 'Not found in PATH' }
    }
  }

  // Check YouTube API
  const ytKey = process.env.YOUTUBE_API_KEY
  if (ytKey) {
    try {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=id&id=dQw4w9WgXcQ&key=${ytKey}`,
        { signal: controller.signal }
      )
      clearTimeout(t)
      results.youtubeApi = { ok: res.ok, status: res.status }
    } catch (err: unknown) {
      results.youtubeApi = { ok: false, error: (err as Error).message }
    }
  } else {
    results.youtubeApi = { configured: false }
  }

  return NextResponse.json(results)
}

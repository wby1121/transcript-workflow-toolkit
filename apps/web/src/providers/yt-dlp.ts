import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)

async function findYtDlp(): Promise<{ cmd: string; args: string[] }> {
  for (const [cmd, testArgs] of [
    ['yt-dlp', ['--version']],
    ['yt-dlp.exe', ['--version']],
    ['python', ['-m', 'yt_dlp', '--version']],
    ['python3', ['-m', 'yt_dlp', '--version']],
  ]) {
    try {
      await execFileAsync(cmd, testArgs, { timeout: 5000 })
      if (cmd === 'python' || cmd === 'python3') {
        return { cmd, args: ['-m', 'yt_dlp'] }
      }
      return { cmd, args: [] }
    } catch { /* try next */ }
  }

  throw new Error(
    'yt-dlp not found. Install it: pip install yt-dlp, or set YOUTUBE_API_KEY in .env.local.'
  )
}

export class YtDlpProvider {
  name = 'yt_dlp'
  priority = 2

  async isAvailable(): Promise<boolean> {
    try {
      await findYtDlp()
      return true
    } catch {
      return false
    }
  }

  async fetch(videoId: string) {
    const { cmd, args } = await findYtDlp()
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const subFile = join(tmpdir(), `ytt_sub_${videoId}`)

    try {
      // Step 1: Download subtitle to temp file using yt-dlp
      const allArgs = [
        ...args,
        '--write-auto-subs',
        '--sub-format', 'srt',
        '--sub-langs', 'en',
        '--skip-download',
        '--no-warnings',
        '--no-playlist',
        '-o', subFile,
        url,
      ]

      await execFileAsync(cmd, allArgs, {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      })

      // Step 2: Read the downloaded subtitle file
      const subtitlePath = subFile + '.en.srt'
      let rawSub: string
      try {
        rawSub = await readFile(subtitlePath, 'utf-8')
        await unlink(subtitlePath).catch(() => {})
        await unlink(subFile).catch(() => {})
      } catch {
        // Try without .en (some yt-dlp versions use different naming)
        rawSub = await readFile(subFile, 'utf-8')
        await unlink(subFile).catch(() => {})
      }

      // Step 3: Get video info
      const { stdout } = await execFileAsync(cmd, [
        ...args,
        '--dump-json',
        '--no-playlist',
        url,
      ], { timeout: 30000, maxBuffer: 5 * 1024 * 1024 })

      const info = JSON.parse(stdout.trim().split('\n').pop() || '{}')
      const title = info.title || 'Unknown Video'
      const channelName = info.uploader || info.channel || undefined
      const thumbnailUrl = info.thumbnail || undefined
      const durationSeconds = info.duration || undefined

      // Parse the subtitle
      const { parseTranscript } = await import('@/lib/transcript/parser')
      const transcript = parseTranscript(rawSub, 'srt')

      if (transcript.length === 0) {
        throw new Error('Transcript parsed but empty — video may not have English subtitles')
      }

      return {
        transcript,
        title,
        channelName,
        thumbnailUrl,
        durationSeconds,
        language: 'en',
      }
    } catch (err: unknown) {
      // Cleanup temp files
      await unlink(subFile).catch(() => {})
      await unlink(subFile + '.en.srt').catch(() => {})

      const message = err instanceof Error ? err.message : 'Unknown error'
      throw new Error(`yt-dlp failed: ${message}`)
    }
  }
}

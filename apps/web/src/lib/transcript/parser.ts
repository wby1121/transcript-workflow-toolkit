import type { TranscriptSegment } from '@/types'
import { formatTimestamp } from '@/lib/utils'

// Parse SRT subtitle format
export function parseSrt(raw: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []
  const blocks = raw.trim().split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue

    // Line 2 is the timestamp: "00:00:01,000 --> 00:00:04,000"
    const tsMatch = lines[1]?.match(/(\d{2}):(\d{2}):(\d{2})[,.]\d{3}/)
    if (!tsMatch) continue

    const hours = parseInt(tsMatch[1])
    const minutes = parseInt(tsMatch[2])
    const seconds = parseInt(tsMatch[3])
    const totalSeconds = hours * 3600 + minutes * 60 + seconds

    // Lines 3+ are the text
    const text = lines.slice(2).join(' ').trim()
    if (!text) continue

    segments.push({
      tsSeconds: totalSeconds,
      tsDisplay: formatTimestamp(totalSeconds),
      text,
    })
  }

  return segments
}

// Parse VTT subtitle format
export function parseVtt(raw: string): TranscriptSegment[] {
  // Remove WEBVTT header
  const cleaned = raw.replace(/^WEBVTT.*\n/, '').replace(/^\s*\n/, '')
  return parseSrt(cleaned) // VTT and SRT are similar enough
}

// Parse raw XML from YouTube API captions
export function parseXmlTranscript(raw: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = []
  const textRegex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]*)<\/text>/g

  let match
  while ((match = textRegex.exec(raw)) !== null) {
    const startSeconds = parseFloat(match[1])
    const text = match[3]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()

    if (!text) continue

    segments.push({
      tsSeconds: Math.floor(startSeconds),
      tsDisplay: formatTimestamp(Math.floor(startSeconds)),
      text,
    })
  }

  return segments
}

// Detect format and parse
export function parseTranscript(raw: string, format?: string): TranscriptSegment[] {
  if (format === 'xml' || raw.includes('<text ')) {
    return parseXmlTranscript(raw)
  }
  if (raw.startsWith('WEBVTT')) {
    return parseVtt(raw)
  }
  // Default: try SRT
  return parseSrt(raw)
}

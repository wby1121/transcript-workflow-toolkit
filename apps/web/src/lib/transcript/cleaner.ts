import type { TranscriptSegment } from '@/types'

const FILLER_WORDS = [
  '\bum\b', '\buh\b', '\ber\b', '\bah\b',
  '\byou know\b', '\blike\b', '\bi mean\b',
  '\bsort of\b', '\bkind of\b', '\bright\?\b',
  '\bokay\b', '\bso\b', '\bactually\b',
  '\bbasically\b', '\bliterally\b', '\banyway\b',
]

const FILLER_REGEX = new RegExp(FILLER_WORDS.join('|'), 'gi')

export function removeFillers(text: string): string {
  return text.replace(FILLER_REGEX, '').replace(/\s{2,}/g, ' ').trim()
}

export function segmentByParagraphs(segments: TranscriptSegment[]): TranscriptSegment[] {
  const result: TranscriptSegment[] = []
  let buffer: TranscriptSegment[] = []
  let charCount = 0

  for (const segment of segments) {
    buffer.push(segment)
    charCount += segment.text.length

    // Break after ~500 chars or at sentence endings followed by pause
    if (charCount > 500 || /[.!?]$/.test(segment.text)) {
      if (buffer.length > 0) {
        result.push({
          tsSeconds: buffer[0].tsSeconds,
          tsDisplay: buffer[0].tsDisplay,
          text: buffer.map(s => s.text).join(' '),
        })
        buffer = []
        charCount = 0
      }
    }
  }

  // Flush remaining
  if (buffer.length > 0) {
    result.push({
      tsSeconds: buffer[0].tsSeconds,
      tsDisplay: buffer[0].tsDisplay,
      text: buffer.map(s => s.text).join(' '),
    })
  }

  return result
}

export function cleanTranscript(segments: TranscriptSegment[]): {
  cleaned: TranscriptSegment[]
  stats: { fillersRemoved: number; segmentsCreated: number }
} {
  const originalCount = segments.length
  const fillersRemoved = segments.reduce((count, seg) => {
    const cleaned = removeFillers(seg.text)
    return count + (seg.text.length - cleaned.length > 0 ? 1 : 0)
  }, 0)

  const cleanedSegments = segments.map(seg => ({
    ...seg,
    text: removeFillers(seg.text),
  })).filter(seg => seg.text.length > 0)

  const segmented = segmentByParagraphs(cleanedSegments)

  return {
    cleaned: segmented,
    stats: {
      fillersRemoved,
      segmentsCreated: segmented.length,
    },
  }
}

export function cleanTranscriptToText(segments: TranscriptSegment[]): string {
  const { cleaned } = cleanTranscript(segments)
  return cleaned.map(s => s.text).join('\n\n')
}

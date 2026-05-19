import { NextRequest, NextResponse } from 'next/server'
import { getCachedTranscript, getCachedVariants, getCachedSeo } from '@/lib/cache'
import { generateMarkdown, generatePlainText } from '@/lib/export'
import { logEvent } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')
  const format = request.nextUrl.searchParams.get('format') || 'md'

  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 })
  }

  const transcript = getCachedTranscript(videoId)
  if (!transcript) {
    return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
  }

  const variants = getCachedVariants(videoId)
  const seo = getCachedSeo(videoId)
  const eventType = format === 'md' ? 'export_md' : format === 'txt' ? 'export_txt' : 'export_copy'

  logEvent(eventType, { videoId })

  if (format === 'txt') {
    const text = generatePlainText(transcript, variants)
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${transcript.title.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}.txt"`,
      },
    })
  }

  // Default: Markdown
  const md = generateMarkdown(transcript, variants, seo || undefined)
  return new NextResponse(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${transcript.title.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}.md"`,
    },
  })
}

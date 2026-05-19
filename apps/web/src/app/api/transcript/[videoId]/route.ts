import { NextRequest, NextResponse } from 'next/server'
import { getCachedTranscript, getCachedVariants, getCachedSeo } from '@/lib/cache'

export async function GET(
  _request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const transcript = getCachedTranscript(params.videoId)
  if (!transcript) {
    return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
  }

  const variants = getCachedVariants(params.videoId)
  const seo = getCachedSeo(params.videoId)

  return NextResponse.json({
    transcript,
    variants: Object.keys(variants).length > 0 ? variants : undefined,
    seo: seo || undefined,
  })
}

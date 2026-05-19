import { NextRequest, NextResponse } from 'next/server'
import { logEvent } from '@/lib/analytics'
import type { AnalyticsEventType } from '@/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { eventType, videoId, metadata } = body as {
    eventType: AnalyticsEventType
    videoId?: string
    metadata?: Record<string, unknown>
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
  const userAgent = request.headers.get('user-agent') || undefined
  const referrer = request.headers.get('referer') || undefined

  logEvent(eventType, { videoId, ip, userAgent, referrer, metadata })

  return NextResponse.json({ ok: true })
}
